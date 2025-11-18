import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllSuppliers = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get all suppliers for admin panel
    const allSuppliers = await ctx.db
      .query("suppliers")
      .collect();
    
    return allSuppliers;
  }
});

export const searchSuppliers = query({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    lat: v.optional(v.float64()),
    lng: v.optional(v.float64()),
    radiusKm: v.optional(v.float64()),
    minRating: v.optional(v.float64()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.int64()),
    offset: v.optional(v.int64()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || 'relevance';

    // Only show approved suppliers - filter at database level
    let query = ctx.db.query("suppliers").filter(q => q.eq(q.field("approved"), true));
    let all = await query.collect();

    if (args.q && args.q.trim()) {
      const q = args.q.toLowerCase();
      all = all.filter(s =>
        (s.business_name?.toLowerCase().includes(q)) ||
        (s.description?.toLowerCase().includes(q))
      );
    }

    if (args.category) {
      all = all.filter(s => s.category === args.category);
    }

    if (args.location) {
      const loc = args.location.toLowerCase();
      all = all.filter(s => (s.location || "").toLowerCase().includes(loc));
    }

    if (args.minRating && args.minRating > 0) {
      all = all.filter(s => (s.rating ?? 0) >= (args.minRating as number));
    }

    if (args.verified) {
      all = all.filter(s => s.verified === true);
    }

    if (args.lat !== undefined && args.lng !== undefined) {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const radius = args.radiusKm ?? 50;

      all = all
        .map(s => {
          if (s.latitude != null && s.longitude != null) {
            const d = haversineKm(lat, lng, s.latitude, s.longitude);
            return { ...s, distance: d } as typeof s & { distance: number };
          }
          return { ...s, distance: Number.POSITIVE_INFINITY } as typeof s & { distance: number };
        })
        .filter(s => s.distance <= radius);
    }

    // Apply sorting
    if (sortBy === 'distance') {
      all = all.sort((a, b) => {
        const distA = (a as any).distance ?? Number.POSITIVE_INFINITY;
        const distB = (b as any).distance ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      });
    } else if (sortBy === 'rating') {
      all = all.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'reviews') {
      all = all.sort((a, b) => Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0));
    }
    // else sortBy === 'relevance' - keep original order

    const total = all.length;
    const sliced = all.slice(offset, offset + limit);
    return { suppliers: sliced, total };
  }
});

export const getSupplierDetails = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const supplier = await ctx.db.get(id as any).catch(async () => {
      // fallback: try find by field id stored elsewhere
      const byFilter = await ctx.db.query("suppliers").filter(q => q.eq(q.field("_id"), id as any)).first();
      return byFilter ?? null;
    });

    const s = supplier ?? await ctx.db.query("suppliers").filter(q => q.eq(q.field("_id"), id as any)).first();
    if (!s) {
      return { supplier: null, reviews: [] };
    }

    const reviews = await ctx.db.query("reviews").filter(q => q.eq(q.field("supplierId"), s._id as unknown as string)).collect();
    return { supplier: s, reviews };
  }
});

export const updateSupplierProfile = mutation({
  args: {
    business_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    website: v.optional(v.string()),
    image: v.optional(v.string()),
    imageGallery: v.optional(v.array(v.string())),
    business_hours: v.optional(v.record(v.string(), v.string())),
    social_links: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const userId = identity.subject;
    // Application-level enforcement: Check for existing supplier profile for this user
    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), userId)).first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    // Ensure we're not trying to change the userId (which should be immutable)
    if (supplier.userId !== userId) {
      throw new Error("Tentative de modification non autorisée du profil fournisseur");
    }

    // Default business hours if none provided
    const defaultBusinessHours = {
      monday: "08:00-18:00",
      tuesday: "08:00-18:00",
      wednesday: "08:00-18:00",
      thursday: "08:00-18:00",
      friday: "08:00-18:00",
      saturday: "09:00-17:00",
      sunday: "closed"
    };

    const businessHoursToSave = args.business_hours || supplier.business_hours || defaultBusinessHours;

    await ctx.db.patch(supplier._id, {
      business_name: args.business_name,
      email: args.email,
      phone: args.phone,
      description: args.description,
      category: args.category,
      address: args.address,
      city: args.city,
      state: args.state,
      location: `${args.city}, ${args.state}`,
      website: args.website,
      image: args.image,
      imageGallery: args.imageGallery,
      business_hours: businessHoursToSave,
      social_links: args.social_links,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  }
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(v: number) { return v * Math.PI / 180; }


