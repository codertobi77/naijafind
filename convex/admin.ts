import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Helper function to require admin authentication
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Non autorisé");
  
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", identity.email))
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
      .withIndex("email", (q) => q.eq("email", args.email))
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
    
    // Update stats: decrement pending, increment approved
    await ctx.scheduler.runAfter(0, internal.stats.decrementStat, {
      key: "pendingSuppliers",
      amount: 1,
      category: "global",
    });
    await ctx.scheduler.runAfter(0, internal.stats.incrementStat, {
      key: "approvedSuppliers",
      amount: 1,
      category: "global",
    });
    
    // Send notification to supplier
    await ctx.db.insert('notifications', {
      userId: supplier.userId,
      type: 'approval',
      title: 'Félicitations ! Votre profil est approuvé',
      message: `Votre entreprise "${supplier.business_name}" a été validée par notre équipe. Vous pouvez maintenant recevoir des commandes.`,
      data: { supplierId: args.supplierId, type: 'supplier_approved' },
      read: false,
      actionUrl: '/dashboard',
      createdAt: now,
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
    const wasApproved = supplier.approved;
    const wasFeatured = supplier.featured;
    const category = supplier.category;
    await ctx.db.delete(args.supplierId);
    
    // Update stats
    await ctx.scheduler.runAfter(0, internal.stats.decrementStat, {
      key: "totalSuppliers",
      amount: 1,
      category: "global",
    });
    if (!wasApproved) {
      await ctx.scheduler.runAfter(0, internal.stats.decrementStat, {
        key: "pendingSuppliers",
        amount: 1,
        category: "global",
      });
    } else {
      await ctx.scheduler.runAfter(0, internal.stats.decrementStat, {
        key: "approvedSuppliers",
        amount: 1,
        category: "global",
      });
    }
    if (wasFeatured) {
      await ctx.scheduler.runAfter(0, internal.stats.decrementStat, {
        key: "featuredSuppliers",
        amount: 1,
        category: "global",
      });
    }
    if (category) {
      await ctx.scheduler.runAfter(0, internal.stats.decrementStat, {
        key: "suppliersInCategory",
        amount: 1,
        category: "category",
        metadata: { categoryName: category },
      });
    }
    
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
    
    // Update stats
    await ctx.scheduler.runAfter(0, internal.stats.incrementStat, {
      key: "featuredSuppliers",
      amount: args.featured ? 1 : -1,
      category: "global",
    });
    
    return { success: true };
  }});

// Reject a supplier (admin only)
export const rejectSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    reason: v.optional(v.string()),
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
    
    // Send notification to supplier
    await ctx.db.insert('notifications', {
      userId: supplier.userId,
      type: 'system',
      title: 'Mise à jour de votre inscription',
      message: `Votre demande pour "${supplier.business_name}" n'a pas pu être approuvée${args.reason ? `: ${args.reason}` : '. Contactez-nous pour plus d\'informations.'}`,
      data: { supplierId: args.supplierId, type: 'supplier_rejected', reason: args.reason },
      read: false,
      actionUrl: '/contact',
      createdAt: now,
    });
    
    return { success: true };
  }
});

export const getPendingSuppliers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    await requireAdmin(ctx);
    
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", false))
      .take(limit);
    
    return suppliers;
  }
});

// Get featured suppliers
export const getFeaturedSuppliers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    await requireAdmin(ctx);
    
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .filter((q: any) => q.and(
        q.eq(q.field("approved"), true),
        q.eq(q.field("featured"), true)
      ))
      .take(limit);
    
    return suppliers;
  }
});

// Delete all suppliers (admin only) - schedules a background job
export const deleteAllSuppliers = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if user is admin
    await requireAdmin(ctx);
    
    // Schedule the background deletion job
    await ctx.scheduler.runAfter(0, internal.admin.deleteAllSuppliersInternal, {});
    
    return { 
      success: true, 
      message: "Suppression de tous les fournisseurs planifiée en arrière-plan" 
    };
  }
});

// Internal mutation to delete all suppliers in background
export const deleteAllSuppliersInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all suppliers
    const suppliers = await ctx.db.query("suppliers").collect();
    
    let deletedCount = 0;
    let deletedUsersCount = 0;
    const now = new Date().toISOString();
    
    // Collect userIds associated with suppliers
    const userIdsToDelete = new Set<string>();
    for (const supplier of suppliers) {
      if (supplier.userId) {
        userIdsToDelete.add(supplier.userId as string);
      }
    }
    
    // Delete all suppliers
    for (const supplier of suppliers) {
      await ctx.db.delete(supplier._id);
      deletedCount++;
    }
    
    // Delete associated users
    for (const userId of userIdsToDelete) {
      try {
        await ctx.db.delete(userId as Id<"users">);
        deletedUsersCount++;
      } catch (error) {
        // User may not exist or already deleted, continue
        console.log(`Could not delete user ${userId}:`, error);
      }
    }
    
    // Reset all stats to 0
    const statsToReset = [
      "totalSuppliers",
      "pendingSuppliers", 
      "approvedSuppliers",
      "featuredSuppliers",
      "verifiedSuppliers"
    ];
    
    for (const key of statsToReset) {
      await ctx.scheduler.runAfter(0, internal.stats.setStat, {
        key,
        value: 0,
        category: "global",
      });
    }
    
    // Reset category stats
    const categoryStats = await ctx.db
      .query("stats")
      .withIndex("category", (q) => q.eq("category", "category"))
      .collect();
    
    for (const stat of categoryStats) {
      await ctx.db.patch(stat._id, {
        value: 0,
        updatedAt: now,
      });
    }
    
    return { 
      success: true, 
      deletedCount,
      deletedUsersCount,
      message: `${deletedCount} fournisseurs et ${deletedUsersCount} utilisateurs supprimés avec succès` 
    };
  }
});