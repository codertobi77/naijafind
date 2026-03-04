import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Initialize or get a counter
export const getStat = query({
  args: {
    key: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("stats").withIndex("key", (q) => q.eq("key", args.key));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    const stat = await query.first();
    
    if (!stat) {
      return { key: args.key, value: 0, category: args.category || "global" };
    }
    
    return { key: stat.key, value: stat.value, category: stat.category, metadata: stat.metadata };
  }
});

// Get multiple stats at once
export const getStats = query({
  args: {
    keys: v.array(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stats: Record<string, number> = {};
    
    for (const key of args.keys) {
      let query = ctx.db.query("stats").withIndex("key", (q) => q.eq("key", key));
      
      if (args.category) {
        query = query.filter((q) => q.eq(q.field("category"), args.category));
      }
      
      const stat = await query.first();
      stats[key] = stat?.value ?? 0;
    }
    
    return stats;
  }
});

// Get all stats by category
export const getStatsByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("stats")
      .withIndex("category", (q) => q.eq("category", args.category))
      .collect();
    
    return stats.map(s => ({
      key: s.key,
      value: s.value,
      metadata: s.metadata,
      updatedAt: s.updatedAt,
    }));
  }
});

// Internal mutation to increment a counter
export const incrementStat = internalMutation({
  args: {
    key: v.string(),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const amount = args.amount ?? 1;
    const category = args.category || "global";
    const now = new Date().toISOString();
    
    let query = ctx.db.query("stats").withIndex("key", (q) => q.eq("key", args.key));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    const existing = await query.first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: existing.value + amount,
        updatedAt: now,
      });
      return { key: args.key, value: existing.value + amount };
    } else {
      const id = await ctx.db.insert("stats", {
        key: args.key,
        value: amount,
        category,
        metadata: args.metadata,
        updatedAt: now,
      });
      return { key: args.key, value: amount, id };
    }
  }
});

// Internal mutation to decrement a counter
export const decrementStat = internalMutation({
  args: {
    key: v.string(),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const amount = args.amount ?? 1;
    const now = new Date().toISOString();
    
    let query = ctx.db.query("stats").withIndex("key", (q) => q.eq("key", args.key));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    const existing = await query.first();
    
    if (existing) {
      const newValue = Math.max(0, existing.value - amount);
      await ctx.db.patch(existing._id, {
        value: newValue,
        updatedAt: now,
      });
      return { key: args.key, value: newValue };
    }
    
    return { key: args.key, value: 0 };
  }
});

// Internal mutation to set a counter to a specific value
export const setStat = internalMutation({
  args: {
    key: v.string(),
    value: v.number(),
    category: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const category = args.category || "global";
    const now = new Date().toISOString();
    
    let query = ctx.db.query("stats").withIndex("key", (q) => q.eq("key", args.key));
    
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    const existing = await query.first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: now,
      });
      return { key: args.key, value: args.value };
    } else {
      const id = await ctx.db.insert("stats", {
        key: args.key,
        value: args.value,
        category,
        metadata: args.metadata,
        updatedAt: now,
      });
      return { key: args.key, value: args.value, id };
    }
  }
});

// Recalculate all stats from scratch (admin only)
export const recalculateAllStats = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    const now = new Date().toISOString();
    
    // Get all suppliers
    const suppliers = await ctx.db.query("suppliers").collect();
    const totalSuppliers = suppliers.length;
    const pendingSuppliers = suppliers.filter(s => !s.approved).length;
    const approvedSuppliers = suppliers.filter(s => s.approved).length;
    const featuredSuppliers = suppliers.filter(s => s.featured).length;
    const verifiedSuppliers = suppliers.filter(s => s.verified).length;
    
    // Get all users
    const users = await ctx.db.query("users").collect();
    const totalUsers = users.length;
    const totalSuppliersAsUsers = users.filter(u => u.user_type === 'supplier').length;
    
    // Get all reviews
    const reviews = await ctx.db.query("reviews").collect();
    const totalReviews = reviews.length;
    
    // Get all products
    const products = await ctx.db.query("products").collect();
    const totalProducts = products.length;
    
    // Get all categories
    const categories = await ctx.db.query("categories").collect();
    const activeCategories = categories.filter(c => c.is_active !== false).length;
    
    // Update all global stats
    const statsToUpdate = [
      { key: "totalSuppliers", value: totalSuppliers },
      { key: "pendingSuppliers", value: pendingSuppliers },
      { key: "approvedSuppliers", value: approvedSuppliers },
      { key: "featuredSuppliers", value: featuredSuppliers },
      { key: "verifiedSuppliers", value: verifiedSuppliers },
      { key: "totalUsers", value: totalUsers },
      { key: "totalSuppliersAsUsers", value: totalSuppliersAsUsers },
      { key: "totalReviews", value: totalReviews },
      { key: "totalProducts", value: totalProducts },
      { key: "activeCategories", value: activeCategories },
    ];
    
    for (const stat of statsToUpdate) {
      const existing = await ctx.db
        .query("stats")
        .withIndex("key", (q) => q.eq("key", stat.key))
        .filter((q) => q.eq(q.field("category"), "global"))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: stat.value,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("stats", {
          key: stat.key,
          value: stat.value,
          category: "global",
          updatedAt: now,
        });
      }
    }
    
    // Calculate category stats
    const categoryCounts: Record<string, number> = {};
    for (const supplier of suppliers) {
      const cat = supplier.category;
      if (cat) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }
    
    // Update category stats
    for (const [categoryName, count] of Object.entries(categoryCounts)) {
      const existing = await ctx.db
        .query("stats")
        .withIndex("key", (q) => q.eq("key", `suppliersInCategory`))
        .filter((q) => q.eq(q.field("category"), "category") && q.eq(q.field("metadata.categoryName"), categoryName))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: count,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("stats", {
          key: "suppliersInCategory",
          value: count,
          category: "category",
          metadata: { categoryName },
          updatedAt: now,
        });
      }
    }
    
    return {
      success: true,
      message: "Toutes les statistiques ont été recalculées",
      stats: statsToUpdate,
    };
  }
});

// Get admin dashboard stats
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    const stats = await ctx.db
      .query("stats")
      .withIndex("category", (q) => q.eq("category", "global"))
      .collect();
    
    const result: Record<string, number> = {};
    for (const stat of stats) {
      result[stat.key] = stat.value;
    }
    
    // Ensure all expected keys exist with defaults
    const defaults = {
      totalSuppliers: 0,
      pendingSuppliers: 0,
      approvedSuppliers: 0,
      featuredSuppliers: 0,
      verifiedSuppliers: 0,
      totalUsers: 0,
      totalReviews: 0,
      totalProducts: 0,
      activeCategories: 0,
    };
    
    return { ...defaults, ...result };
  }
});

// Get category stats with counts
export const getCategoryStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db
      .query("stats")
      .withIndex("category", (q) => q.eq("category", "category"))
      .collect();
    
    const result: Record<string, number> = {};
    for (const stat of stats) {
      const categoryName = stat.metadata?.categoryName;
      if (categoryName) {
        result[categoryName] = stat.value;
      }
    }
    
    return result;
  }
});
