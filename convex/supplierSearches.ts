import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Track a supplier search query
 */
export const trackSearch = action({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    resultsCount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    
    const now = new Date().toISOString();
    
    await ctx.runMutation(internal.supplierSearches._insertSearch, {
      query: args.query,
      category: args.category,
      location: args.location,
      userId,
      resultsCount: args.resultsCount,
      createdAt: now,
    });
    
    return { success: true };
  },
});

/**
 * Internal: Insert search record
 */
export const _insertSearch = mutation({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    userId: v.optional(v.string()),
    resultsCount: v.number(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("supplierSearches", {
      query: args.query,
      category: args.category,
      location: args.location,
      userId: args.userId,
      resultsCount: args.resultsCount,
      createdAt: args.createdAt,
    });
  },
});

/**
 * Get all supplier searches (admin only)
 */
export const getAllSearches = query({
  args: {
    limit: v.optional(v.number()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    const limit = Math.min(args.limit ?? 100, 500);
    
    let searches;
    if (args.days) {
      // Calculate date threshold
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - args.days);
      const thresholdStr = threshold.toISOString();
      
      searches = await ctx.db
        .query("supplierSearches")
        .withIndex("createdAt", (q) => q.gte("createdAt", thresholdStr))
        .order("desc")
        .take(limit);
    } else {
      searches = await ctx.db
        .query("supplierSearches")
        .order("desc")
        .take(limit);
    }
    
    return searches;
  },
});

/**
 * Get search statistics (admin only)
 */
export const getSearchStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    let searches;
    if (args.days) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - args.days);
      const thresholdStr = threshold.toISOString();
      
      searches = await ctx.db
        .query("supplierSearches")
        .withIndex("createdAt", (q) => q.gte("createdAt", thresholdStr))
        .collect();
    } else {
      searches = await ctx.db.query("supplierSearches").collect();
    }
    
    // Calculate stats
    const totalSearches = searches.length;
    const uniqueQueries = new Set(searches.map(s => s.query.toLowerCase())).size;
    const avgResults = searches.length > 0
      ? searches.reduce((sum, s) => sum + s.resultsCount, 0) / searches.length
      : 0;
    
    // Top search terms
    const queryCounts: Record<string, number> = {};
    for (const search of searches) {
      const key = search.query.toLowerCase();
      queryCounts[key] = (queryCounts[key] || 0) + 1;
    }
    
    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
    
    // Category distribution
    const categoryCounts: Record<string, number> = {};
    for (const search of searches) {
      if (search.category) {
        categoryCounts[search.category] = (categoryCounts[search.category] || 0) + 1;
      }
    }
    
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));
    
    return {
      totalSearches,
      uniqueQueries,
      avgResults: Math.round(avgResults * 10) / 10,
      topQueries,
      topCategories,
    };
  },
});

import { internal } from "./_generated/api";
