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

// Créer un utilisateur admin (sans authentification requise pour l'initialisation)
// Cette fonction interne est appelée par la route HTTP /admin/create
export const createAdmin = internalMutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier si l'utilisateur existe déjà
    const existing = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), args.email))
      .first();

    const now = new Date().toISOString();

    if (existing) {
      // Mettre à jour l'utilisateur existant pour le rendre admin
      await ctx.db.patch(existing._id, {
        user_type: 'admin',
        is_admin: true,
        firstName: args.firstName || existing.firstName,
        lastName: args.lastName || existing.lastName,
        phone: args.phone || existing.phone,
      });
      return {
        success: true,
        message: `L'utilisateur ${args.email} est maintenant admin`,
        id: existing._id,
      };
    } else {
      // Créer un nouvel utilisateur admin
      // Note: L'utilisateur devra s'inscrire via Clerk avec cet email
      const id = await ctx.db.insert("users", {
        email: args.email,
        user_type: 'admin',
        is_admin: true,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        created_at: now,
      });
      return {
        success: true,
        message: `Utilisateur admin créé pour ${args.email}. L'utilisateur devra s'inscrire via Clerk avec cet email.`,
        id,
      };
    }
  },
});

// Approve a supplier (admin only)
export const approveSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await requireAdmin(ctx);
    
    // Check if supplier exists
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Update supplier to approved
    const now = new Date().toISOString();
    await ctx.db.patch(args.supplierId, {
      approved: true,
      updated_at: now,
    });
    
    return { success: true };
  }
});

// Delete a supplier (admin only)
export const deleteSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await requireAdmin(ctx);
    
    // Check if supplier exists
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Delete the supplier
    await ctx.db.delete(args.supplierId);
    
    return { success: true };
  }
});

// Set a supplier as featured (admin only)
export const setSupplierFeatured = mutation({
  args: {
    supplierId: v.id("suppliers"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    await requireAdmin(ctx);
    
    // Check if supplier exists
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Update supplier featured status
    const now = new Date().toISOString();
    await ctx.db.patch(args.supplierId, {
      featured: args.featured,
      updated_at: now,
    });
    
    return { success: true };
  }});

// Reject a supplier (admin only)
export const rejectSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await requireAdmin(ctx);
    
    // Check if supplier exists
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Mark supplier as rejected
    const now = new Date().toISOString();
    await ctx.db.patch(args.supplierId, {
      approved: false,
      updated_at: now,
    });
    
    return { success: true };
  }
});

export const getPendingSuppliers = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is admin
    await requireAdmin(ctx);
    
    // Get all suppliers that are not approved
    const pendingSuppliers = await ctx.db
      .query("suppliers")
      .filter((q: any) => q.eq(q.field("approved"), false))
      .collect();
    
    return pendingSuppliers;
  }
});

// Get featured suppliers
export const getFeaturedSuppliers = query({
  args: {},
  handler: async (ctx) => {
    // Get all approved and featured suppliers
    const featuredSuppliers = await ctx.db
      .query("suppliers")
      .filter((q: any) => q.and(
        q.eq(q.field("approved"), true),
        q.eq(q.field("featured"), true)
      ))
      .collect();
    
    return featuredSuppliers;
  }
});