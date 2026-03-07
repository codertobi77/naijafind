import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const getAllSuppliers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .take(limit);
    
    return suppliers;
  }
});

// Query admin : lister toutes les galeries (imageGallery de chaque fournisseur)
export const listAllGalleriesAdmin = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .take(limit);
    // Map to only return needed fields
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      imageGallery: s.imageGallery || [],
    }));
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

    const s = supplier ?? await ctx.db.get(id as any);
    if (!s) {
      return { supplier: null, reviews: [] };
    }

    const reviews = await ctx.db.query("reviews").withIndex("supplierId", (q) => q.eq("supplierId", s._id as unknown as string)).collect();
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
    country: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    website: v.optional(v.string()),
    image: v.optional(v.string()),
    imageGallery: v.optional(v.array(v.string())),
    business_hours: v.optional(v.record(v.string(), v.string())),
    social_links: v.optional(v.record(v.string(), v.string())),
    business_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const userId = identity.subject;
    // Application-level enforcement: Check for existing supplier profile for this user
    const supplier = await ctx.db.query("suppliers").withIndex("userId", (q) => q.eq("userId", userId)).first();
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
      country: args.country,
      latitude: args.latitude,
      longitude: args.longitude,
      location: `${args.city}, ${args.state}`,
      website: args.website,
      image: args.image,
      imageGallery: args.imageGallery,
      business_hours: businessHoursToSave,
      social_links: args.social_links,
      business_type: args.business_type,
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

/**
 * Internal query: Search suppliers with minimal fields for action processing
 * Returns only necessary fields to minimize bandwidth
 */
export const _searchSuppliersInternal = internalQuery({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const offset = args.offset ?? 0;
    
    // Get approved suppliers with minimal fields
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .take(limit);
    
    // Return only necessary fields
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      description: s.description,
      category: s.category,
      city: s.city,
      state: s.state,
      location: s.location,
      rating: s.rating,
      reviews_count: s.reviews_count,
      verified: s.verified,
      featured: s.featured,
      approved: s.approved,
      image: s.image,
      logo_url: s.logo_url,
      latitude: s.latitude,
      longitude: s.longitude,
      phone: s.phone,
      email: s.email,
    }));
  },
});

/**
 * Internal query: Get products with minimal fields for search
 */
export const _getProductsForSearch = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const products = await ctx.db.query("products").take(limit);
    
    return products.map(p => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      supplierId: p.supplierId,
      category: p.category,
    }));
  },
});

/**
 * Search suppliers - OPTIMIZED ACTION VERSION
 * Uses internal queries to minimize bandwidth and improve performance
 */
export const searchSuppliers = action({
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

    // Use internal query to fetch suppliers with minimal fields
    const suppliers = await ctx.runQuery(internal.suppliers._searchSuppliersInternal, {
      limit: 2000, // Fetch more for filtering
      offset: 0,
    });

    let all = [...suppliers];

    if (args.q && args.q.trim()) {
      const q = args.q.toLowerCase();
      
      // Get products with minimal fields
      const products = await ctx.runQuery(internal.suppliers._getProductsForSearch, { limit: 1000 });
      
      // Find suppliers that have matching products
      const supplierIdsWithMatchingProducts = new Set<string>();
      products.forEach(product => {
        if (product.name?.toLowerCase().includes(q) || 
            product.description?.toLowerCase().includes(q)) {
          supplierIdsWithMatchingProducts.add(product.supplierId);
        }
      });
      
      all = all.filter(s =>
        (s.business_name?.toLowerCase().includes(q)) ||
        (s.description?.toLowerCase().includes(q)) ||
        supplierIdsWithMatchingProducts.has(s._id as unknown as string)
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
      all = all.filter(s => s.approved === true);
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

    // Apply sorting - prioritize featured suppliers first, then apply user-selected sort
    all = all.sort((a, b) => {
      // First priority: featured suppliers come first
      const featuredA = a.featured ? 1 : 0;
      const featuredB = b.featured ? 1 : 0;
      
      if (featuredB !== featuredA) {
        return featuredB - featuredA; // Featured first
      }
      
      // Second priority: user-selected sort
      if (sortBy === 'distance') {
        const distA = (a as any).distance ?? Number.POSITIVE_INFINITY;
        const distB = (b as any).distance ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      } else if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      } else if (sortBy === 'reviews') {
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      }
      
      // Default 'relevance' - sort by rating then reviews
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
    });

    const total = all.length;
    const sliced = all.slice(offset, offset + limit);
    return { suppliers: sliced, total };
  },
});

// Legacy query version kept for backward compatibility
export const searchSuppliersQuery = query({
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
    // Redirect to action via internal query
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || 'relevance';

    // Use internal query to fetch suppliers
    const suppliers = await ctx.runQuery(internal.suppliers._searchSuppliersInternal, {
      limit: 2000,
      offset: 0,
    });

    let all = [...suppliers];

    if (args.q && args.q.trim()) {
      const q = args.q.toLowerCase();
      const products = await ctx.runQuery(internal.suppliers._getProductsForSearch, { limit: 1000 });
      
      const supplierIdsWithMatchingProducts = new Set<string>();
      products.forEach(product => {
        if (product.name?.toLowerCase().includes(q) || 
            product.description?.toLowerCase().includes(q)) {
          supplierIdsWithMatchingProducts.add(product.supplierId);
        }
      });
      
      all = all.filter(s =>
        (s.business_name?.toLowerCase().includes(q)) ||
        (s.description?.toLowerCase().includes(q)) ||
        supplierIdsWithMatchingProducts.has(s._id as unknown as string)
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
      all = all.filter(s => s.approved === true);
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
    all = all.sort((a, b) => {
      const featuredA = a.featured ? 1 : 0;
      const featuredB = b.featured ? 1 : 0;
      
      if (featuredB !== featuredA) {
        return featuredB - featuredA;
      }
      
      if (sortBy === 'distance') {
        const distA = (a as any).distance ?? Number.POSITIVE_INFINITY;
        const distB = (b as any).distance ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      } else if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      } else if (sortBy === 'reviews') {
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      }
      
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
    });

    const total = all.length;
    const sliced = all.slice(offset, offset + limit);
    return { suppliers: sliced, total };
  },
});

// Mutation for claiming a supplier/business
export const claimSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    userEmail: v.string(),
    claimedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Find the user in our database
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    
    // Get the supplier
    const supplier = await ctx.db.get(args.supplierId);
    
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Check if supplier is already claimed
    if (supplier.userId && supplier.userId !== user._id) {
      throw new Error("Cette entreprise a déjà été réclamée");
    }
    
    // Verify email matches (basic validation)
    const supplierEmail = (supplier.email || "").toLowerCase();
    const claimerEmail = args.userEmail.toLowerCase();
    // Email validation can be extended here
    void supplierEmail;
    void claimerEmail;
    
    // Create a claim record
    const claimId = await ctx.db.insert("supplierClaims", {
      supplierId: args.supplierId,
      userId: user._id,
      userEmail: args.userEmail,
      supplierEmail: supplier.email || "",
      status: "pending", // pending, approved, rejected
      claimedAt: args.claimedAt,
      verifiedAt: undefined,
      verifiedBy: undefined,
      notes: "",
    });
    
    // Update supplier with pending claim status
    await ctx.db.patch(args.supplierId, {
      claimStatus: "pending",
      claimId: claimId,
    });
    
    return { 
      success: true, 
      claimId,
      message: "Demande de réclamation soumise avec succès" 
    };
  }
});

// Admin: Get filtered suppliers using indexes
export const getFilteredSuppliers = query({
  args: {
    approved: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const limit = Math.min(args.limit ?? 500, 500);
    let suppliers: any[] = [];

    // Use index-based filtering when possible
    if (args.approved !== undefined && args.featured !== undefined) {
      // When both approved and featured are specified, use approved index first
      // then filter by featured
      const byApproved = await ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
        .take(limit);
      suppliers = byApproved.filter(s => s.featured === args.featured);
    } else if (args.approved !== undefined) {
      // Use approved index
      suppliers = await ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
        .take(limit);
    } else if (args.featured !== undefined) {
      // Use featured index
      suppliers = await ctx.db
        .query("suppliers")
        .withIndex("featured", (q) => q.eq("featured", args.featured as boolean))
        .take(limit);
    } else {
      // No index filter, fetch all
      suppliers = await ctx.db
        .query("suppliers")
        .take(limit);
    }

    // Apply category filter in memory if specified
    if (args.category) {
      suppliers = suppliers.filter(s => s.category === args.category);
    }

    // Apply search filter in memory if specified
    if (args.searchQuery && args.searchQuery.trim()) {
      const q = args.searchQuery.toLowerCase().trim();
      suppliers = suppliers.filter(s => 
        s.business_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q)
      );
    }

    return suppliers;
  },
});

// Admin: Get all suppliers with pagination (no limit)
export const getAllSuppliersPaginated = query({
  args: {
    paginationOpts: v.object({
      cursor: v.union(v.null(), v.optional(v.string())),
      id: v.optional(v.number()),
      numItems: v.number(),
    }),
    approved: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const numItems = Math.min(args.paginationOpts.numItems, 500);
    const cursor = args.paginationOpts.cursor || undefined;

    // If filters are applied, use index queries (no pagination cursor support for filtered results)
    if (args.approved !== undefined || args.featured !== undefined || args.category || args.searchQuery) {
      let suppliers: any[] = [];
      const limit = 1000; // Higher limit for filtered results

      // Use index-based filtering when possible
      if (args.approved !== undefined && args.featured !== undefined) {
        const byApproved = await ctx.db
          .query("suppliers")
          .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
          .take(limit);
        suppliers = byApproved.filter(s => s.featured === args.featured);
      } else if (args.approved !== undefined) {
        suppliers = await ctx.db
          .query("suppliers")
          .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
          .take(limit);
      } else if (args.featured !== undefined) {
        suppliers = await ctx.db
          .query("suppliers")
          .withIndex("featured", (q) => q.eq("featured", args.featured as boolean))
          .take(limit);
      } else {
        suppliers = await ctx.db
          .query("suppliers")
          .take(limit);
      }

      // Apply category filter in memory if specified
      if (args.category) {
        const categoryLower = args.category.toLowerCase().trim();
        suppliers = suppliers.filter(s => 
          s.category?.toLowerCase().trim() === categoryLower
        );
      }

      // Apply search filter in memory if specified
      if (args.searchQuery && args.searchQuery.trim()) {
        const q = args.searchQuery.toLowerCase().trim();
        suppliers = suppliers.filter(s => 
          s.business_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q)
        );
      }

      // Return in paginated format
      return {
        page: suppliers,
        continueCursor: null, // No pagination for filtered results
        isDone: true,
      };
    }

    // No filters - use paginate for efficient fetching of all suppliers
    const result = await ctx.db
      .query("suppliers")
      .paginate({ cursor, numItems });

    return result;
  },
});

// Admin: Get all pending supplier claims
export const getPendingClaims = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get all pending claims
    const claims = await ctx.db
      .query("supplierClaims")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();
    
    // Get supplier details for each claim
    const claimsWithDetails = await Promise.all(
      claims.map(async (claim) => {
        const supplier = await ctx.db.get(claim.supplierId);
          
        const claimant = await ctx.db.get(claim.userId as Id<"users">);
          
        return {
          ...claim,
          supplier: supplier ? {
            _id: supplier._id,
            business_name: supplier.business_name,
            email: supplier.email,
            phone: supplier.phone,
            city: supplier.city,
            state: supplier.state,
          } : null,
          claimant: claimant ? {
            _id: claimant._id,
            email: claimant.email,
            firstName: claimant.firstName,
            lastName: claimant.lastName,
          } : null,
        };
      })
    );
    
    return claimsWithDetails;
  }
});

// Admin: Approve a supplier claim
export const approveClaim = mutation({
  args: {
    claimId: v.id("supplierClaims"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!admin || !admin.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get the claim
    const claim = await ctx.db.get(args.claimId);
      
    if (!claim) {
      throw new Error("Demande de réclamation non trouvée");
    }
    
    if (claim.status !== "pending") {
      throw new Error("Cette demande a déjà été traitée");
    }
    
    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "approved",
      verifiedAt: new Date().toISOString(),
      verifiedBy: admin._id,
      notes: args.notes || "",
    });
    
    // Update supplier: assign to the claiming user
    await ctx.db.patch(claim.supplierId, {
      userId: claim.userId,
      claimStatus: "approved",
      claimId: args.claimId,
      verified: true,
      approved: true,
      updated_at: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: "Demande de réclamation approuvée avec succès" 
    };
  }
});

// Admin: Reject a supplier claim
export const rejectClaim = mutation({
  args: {
    claimId: v.id("supplierClaims"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!admin || !admin.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get the claim
    const claim = await ctx.db.get(args.claimId);
      
    if (!claim) {
      throw new Error("Demande de réclamation non trouvée");
    }
    
    if (claim.status !== "pending") {
      throw new Error("Cette demande a déjà été traitée");
    }
    
    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "rejected",
      verifiedAt: new Date().toISOString(),
      verifiedBy: admin._id,
      notes: args.notes || "",
    });
    
    // Update supplier: reset claim status
    await ctx.db.patch(claim.supplierId, {
      claimStatus: undefined,
      claimId: undefined,
      updated_at: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: "Demande de réclamation refusée" 
    };
  }
});


