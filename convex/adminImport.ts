import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to require admin authentication
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Non autorisé");
  
  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("email"), identity.email))
    .first();
    
  if (!user || !user.is_admin) {
    throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
  }
  
  return user;
}

// Type for supplier import data
interface SupplierImportData {
  user_email: string;
  user_firstName?: string;
  user_lastName?: string;
  user_phone?: string;
  supplier_business_name: string;
  supplier_email: string;
  supplier_phone?: string;
  supplier_category: string;
  supplier_description?: string;
  supplier_address?: string;
  supplier_city: string;
  supplier_state: string;
  supplier_country?: string;
  supplier_website?: string;
  supplier_business_type?: string;
  supplier_verified?: boolean;
  supplier_approved?: boolean;
  supplier_featured?: boolean;
  supplier_image?: string;
  supplier_imageGallery?: string[];
  supplier_business_hours?: Record<string, string>;
  supplier_social_links?: Record<string, string>;
  supplier_latitude?: number;
  supplier_longitude?: number;
}

// Import a single supplier with user
export const importSupplier = internalMutation({
  args: {
    user_email: v.string(),
    user_firstName: v.optional(v.string()),
    user_lastName: v.optional(v.string()),
    user_phone: v.optional(v.string()),
    supplier_business_name: v.string(),
    supplier_email: v.string(),
    supplier_phone: v.optional(v.string()),
    supplier_category: v.string(),
    supplier_description: v.optional(v.string()),
    supplier_address: v.optional(v.string()),
    supplier_city: v.string(),
    supplier_state: v.string(),
    supplier_country: v.optional(v.string()),
    supplier_website: v.optional(v.string()),
    supplier_business_type: v.optional(v.string()),
    supplier_verified: v.optional(v.boolean()),
    supplier_approved: v.optional(v.boolean()),
    supplier_featured: v.optional(v.boolean()),
    supplier_image: v.optional(v.string()),
    supplier_imageGallery: v.optional(v.array(v.string())),
    supplier_business_hours: v.optional(v.record(v.string(), v.string())),
    supplier_social_links: v.optional(v.record(v.string(), v.string())),
    supplier_latitude: v.optional(v.float64()),
    supplier_longitude: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check if user exists by email
    let user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("email"), args.user_email))
      .first();

    let userId: string;

    if (user) {
      // Update existing user to supplier type if needed
      userId = user._id;
      if (user.user_type !== 'supplier') {
        await ctx.db.patch(userId, {
          user_type: 'supplier',
          firstName: args.user_firstName || user.firstName,
          lastName: args.user_lastName || user.lastName,
          phone: args.user_phone || user.phone,
        });
      }
    } else {
      // Create new user
      userId = await ctx.db.insert("users", {
        email: args.user_email,
        firstName: args.user_firstName,
        lastName: args.user_lastName,
        phone: args.user_phone,
        user_type: 'supplier',
        is_admin: false,
        created_at: now,
      });
    }

    // Check if supplier already exists for this user
    const existingSupplier = await ctx.db
      .query("suppliers")
      .filter((q: any) => q.eq(q.field("userId"), userId))
      .first();

    if (existingSupplier) {
      throw new Error(`Un fournisseur existe déjà pour l'utilisateur ${args.user_email}`);
    }

    // Default business hours if not provided
    const defaultBusinessHours = {
      monday: "08:00-18:00",
      tuesday: "08:00-18:00",
      wednesday: "08:00-18:00",
      thursday: "08:00-18:00",
      friday: "08:00-18:00",
      saturday: "09:00-17:00",
      sunday: "closed"
    };

    // Create supplier
    const supplierId = await ctx.db.insert("suppliers", {
      userId: userId,
      business_name: args.supplier_business_name,
      email: args.supplier_email,
      phone: args.supplier_phone,
      description: args.supplier_description,
      category: args.supplier_category,
      address: args.supplier_address,
      city: args.supplier_city,
      state: args.supplier_state,
      country: args.supplier_country,
      location: `${args.supplier_city}, ${args.supplier_state}`,
      website: args.supplier_website,
      business_type: args.supplier_business_type || 'products',
      verified: args.supplier_verified ?? false,
      approved: args.supplier_approved ?? true,
      featured: args.supplier_featured ?? false,
      image: args.supplier_image,
      imageGallery: args.supplier_imageGallery,
      business_hours: args.supplier_business_hours || defaultBusinessHours,
      social_links: args.supplier_social_links,
      latitude: args.supplier_latitude,
      longitude: args.supplier_longitude,
      rating: 0,
      reviews_count: 0n,
      created_at: now,
      updated_at: now,
    });

    // Send welcome notification
    await ctx.db.insert('notifications', {
      userId: userId,
      type: 'system',
      title: 'Bienvenue sur Suji !',
      message: `Votre entreprise "${args.supplier_business_name}" a été créée avec succès. Complétez votre profil pour commencer à recevoir des clients.`,
      data: { supplierId, type: 'supplier_created' },
      read: false,
      actionUrl: '/dashboard',
      createdAt: now,
    });

    return {
      success: true,
      userId,
      supplierId,
      message: `Fournisseur "${args.supplier_business_name}" créé avec succès`,
    };
  },
});

// Bulk import suppliers (admin only)
export const bulkImportSuppliers = mutation({
  args: {
    suppliers: v.array(v.object({
      user_email: v.string(),
      user_firstName: v.optional(v.string()),
      user_lastName: v.optional(v.string()),
      user_phone: v.optional(v.string()),
      supplier_business_name: v.string(),
      supplier_email: v.string(),
      supplier_phone: v.optional(v.string()),
      supplier_category: v.string(),
      supplier_description: v.optional(v.string()),
      supplier_address: v.optional(v.string()),
      supplier_city: v.string(),
      supplier_state: v.string(),
      supplier_country: v.optional(v.string()),
      supplier_website: v.optional(v.string()),
      supplier_business_type: v.optional(v.string()),
      supplier_verified: v.optional(v.boolean()),
      supplier_approved: v.optional(v.boolean()),
      supplier_featured: v.optional(v.boolean()),
      supplier_image: v.optional(v.string()),
      supplier_imageGallery: v.optional(v.array(v.string())),
      supplier_business_hours: v.optional(v.record(v.string(), v.string())),
      supplier_social_links: v.optional(v.record(v.string(), v.string())),
      supplier_latitude: v.optional(v.float64()),
      supplier_longitude: v.optional(v.float64()),
    })),
  },
  handler: async (ctx, args) => {
    // Verify admin
    await requireAdmin(ctx);

    const results = {
      success: [] as any[],
      errors: [] as any[],
      total: args.suppliers.length,
      created: 0,
      failed: 0,
    };

    for (const supplierData of args.suppliers) {
      try {
        // Call internal mutation for each supplier
        const result = await ctx.runMutation(api.admin.importSupplier, supplierData);
        results.success.push(result);
        results.created++;
      } catch (error: any) {
        results.errors.push({
          supplier: supplierData.supplier_business_name,
          email: supplierData.user_email,
          error: error.message,
        });
        results.failed++;
      }
    }

    return results;
  },
});

// Import single supplier via admin API (with admin auth)
export const importSingleSupplier = mutation({
  args: {
    user_email: v.string(),
    user_firstName: v.optional(v.string()),
    user_lastName: v.optional(v.string()),
    user_phone: v.optional(v.string()),
    supplier_business_name: v.string(),
    supplier_email: v.string(),
    supplier_phone: v.optional(v.string()),
    supplier_category: v.string(),
    supplier_description: v.optional(v.string()),
    supplier_address: v.optional(v.string()),
    supplier_city: v.string(),
    supplier_state: v.string(),
    supplier_country: v.optional(v.string()),
    supplier_website: v.optional(v.string()),
    supplier_business_type: v.optional(v.string()),
    supplier_verified: v.optional(v.boolean()),
    supplier_approved: v.optional(v.boolean()),
    supplier_featured: v.optional(v.boolean()),
    supplier_image: v.optional(v.string()),
    supplier_imageGallery: v.optional(v.array(v.string())),
    supplier_business_hours: v.optional(v.record(v.string(), v.string())),
    supplier_social_links: v.optional(v.record(v.string(), v.string())),
    supplier_latitude: v.optional(v.float64()),
    supplier_longitude: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.runMutation(api.admin.importSupplier, args);
  },
});

// Generated API reference for internal calls
import { api } from "./_generated/api";
