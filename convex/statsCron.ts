import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Internal ACTION: Recalculate all global stats (admin stats)
 * Converted to ACTION for bandwidth optimization - no reactive overhead
 * Uses batched processing to avoid document read limits
 */
export const recalculateGlobalStatsAction = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // Process suppliers in batches to count - using internal mutation calls
    let totalSuppliers = 0;
    let pendingSuppliers = 0;
    let approvedSuppliers = 0;
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let claimedSuppliers = 0;
    let ratingSum = 0;
    let ratedSuppliersCount = 0;
    
    // Batch process suppliers using paginated queries via internal helper
    let hasMore = true;
    let lastId: string | undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getSupplierBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const s of result.suppliers) {
        totalSuppliers++;
        if (!s.approved) pendingSuppliers++;
        if (s.approved) approvedSuppliers++;
        if (s.featured) featuredSuppliers++;
        if (s.verified) verifiedSuppliers++;
        if (s.claimStatus === "approved") claimedSuppliers++;
        if (s.rating && s.rating > 0) {
          ratingSum += s.rating;
          ratedSuppliersCount++;
        }
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Batch process users
    let totalUsers = 0;
    let totalSuppliersAsUsers = 0;
    let totalRegularUsers = 0;
    
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getUserBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const u of result.users) {
        totalUsers++;
        if (u.user_type === 'supplier') totalSuppliersAsUsers++;
        if (u.user_type === 'user') totalRegularUsers++;
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Batch process reviews
    let totalReviews = 0;
    let pendingReviews = 0;
    let approvedReviews = 0;
    
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getReviewBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const r of result.reviews) {
        totalReviews++;
        if (r.status === 'pending') pendingReviews++;
        if (r.status === 'approved') approvedReviews++;
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Batch process products
    let totalProducts = 0;
    let activeProducts = 0;
    
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getProductBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const p of result.products) {
        totalProducts++;
        if (p.status === 'active') activeProducts++;
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Batch process categories
    let totalCategories = 0;
    let activeCategories = 0;
    
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getCategoryBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const c of result.categories) {
        totalCategories++;
        if (c.is_active !== false) activeCategories++;
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Batch process claims
    let pendingClaims = 0;
    let approvedClaims = 0;
    let rejectedClaims = 0;
    
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getClaimBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const c of result.claims) {
        if (c.status === 'pending') pendingClaims++;
        if (c.status === 'approved') approvedClaims++;
        if (c.status === 'rejected') rejectedClaims++;
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    const averageRating = ratedSuppliersCount > 0 ? ratingSum / ratedSuppliersCount : 0;
    
    // Update all global stats via internal mutation
    const statsToUpdate = [
      { key: "totalSuppliers", value: totalSuppliers },
      { key: "pendingSuppliers", value: pendingSuppliers },
      { key: "approvedSuppliers", value: approvedSuppliers },
      { key: "featuredSuppliers", value: featuredSuppliers },
      { key: "verifiedSuppliers", value: verifiedSuppliers },
      { key: "claimedSuppliers", value: claimedSuppliers },
      { key: "totalUsers", value: totalUsers },
      { key: "totalSuppliersAsUsers", value: totalSuppliersAsUsers },
      { key: "totalRegularUsers", value: totalRegularUsers },
      { key: "totalReviews", value: totalReviews },
      { key: "pendingReviews", value: pendingReviews },
      { key: "approvedReviews", value: approvedReviews },
      { key: "totalProducts", value: totalProducts },
      { key: "activeProducts", value: activeProducts },
      { key: "totalCategories", value: totalCategories },
      { key: "activeCategories", value: activeCategories },
      { key: "pendingClaims", value: pendingClaims },
      { key: "approvedClaims", value: approvedClaims },
      { key: "rejectedClaims", value: rejectedClaims },
      { key: "averageRating", value: Math.round(averageRating * 100) / 100 },
    ];
    
    await ctx.runMutation(internal.statsCron.updateStatsBatch, {
      stats: statsToUpdate,
      category: "global",
      now,
    });
    
    return {
      success: true,
      message: "Global stats recalculated via action",
      statsCount: statsToUpdate.length,
      timestamp: now,
    };
  },
});

/**
 * Internal mutation: Wrapper for cron compatibility - schedules the action
 */
export const recalculateGlobalStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.statsCron.recalculateGlobalStatsAction, {});
    return { scheduled: true, message: "Global stats recalculation scheduled" };
  },
});

/**
 * Internal ACTION: Recalculate stats for all suppliers
 * Each supplier gets their own stats document
 * Processes in batches to avoid document read limits
 */
export const recalculateAllSupplierStatsAction = internalAction({
  args: {
    batchSize: v.optional(v.number()),
    lastSupplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const batchSize = Math.min(args.batchSize ?? 50, 50); // Max 50 per batch
    
    // Get batch of suppliers using paginated query via internal helper
    const supplierResult = await ctx.runQuery(internal.statsCron.getSupplierBatchWithDetails, {
      cursor: args.lastSupplierId,
      limit: batchSize,
    });
    
    const suppliersBatch = supplierResult.suppliers;
    let updatedCount = 0;
    
    for (const supplier of suppliersBatch) {
      // Get reviews and products for this supplier via internal queries
      const reviewsResult = await ctx.runQuery(internal.statsCron.getSupplierReviewsBatch, {
        supplierId: supplier._id,
      });
      
      const totalReviews = reviewsResult.reviews.length;
      const averageRating = totalReviews > 0
        ? reviewsResult.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        : 0;
      
      const productsResult = await ctx.runQuery(internal.statsCron.getSupplierProductsBatch, {
        supplierId: supplier._id,
      });
      
      const totalProducts = productsResult.products.length;
      const activeProducts = productsResult.products.filter(p => p.status === 'active').length;
      
      // Check claim status
      const hasApprovedClaim = supplier.claimStatus === 'approved';
      
      // Update or create supplier stats via internal mutation
      await ctx.runMutation(internal.statsCron.updateSupplierStat, {
        supplierId: supplier._id,
        businessName: supplier.business_name,
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        totalProducts,
        activeProducts,
        hasApprovedClaim,
        isApproved: supplier.approved,
        isVerified: supplier.verified,
        isFeatured: supplier.featured,
        now,
      });
      
      updatedCount++;
    }
    
    // Schedule next batch if we got a full batch
    const hasMore = suppliersBatch.length === batchSize;
    const lastProcessedId = suppliersBatch.length > 0 ? suppliersBatch[suppliersBatch.length - 1]._id : undefined;
    
    if (hasMore && lastProcessedId) {
      await ctx.scheduler.runAfter(0, internal.statsCron.recalculateAllSupplierStats, {
        batchSize,
        lastSupplierId: lastProcessedId,
      });
    }
    
    return {
      success: true,
      message: "Supplier stats recalculated via action (batch)",
      suppliersUpdated: updatedCount,
      hasMore,
      timestamp: now,
    };
  },
});

/**
 * Internal mutation: Wrapper for cron compatibility - schedules the action
 */
export const recalculateAllSupplierStats = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    lastSupplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.statsCron.recalculateAllSupplierStatsAction, args);
    return { scheduled: true, message: "Supplier stats recalculation scheduled" };
  },
});

/**
 * Internal ACTION: Recalculate stats for homepage (user view)
 * These are stats shown to regular users
 * Uses batched processing to avoid document read limits
 */
export const recalculateHomepageStatsAction = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // Process suppliers in batches
    let totalSuppliers = 0;
    let activeSuppliers = 0;
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let ratingSum = 0;
    let ratedSuppliersCount = 0;
    
    // Track category counts
    const categorySupplierCounts: Record<string, number> = {};
    const activeCategoriesSet = new Set<string>();
    
    let hasMore = true;
    let lastId: string | undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getSupplierBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const s of result.suppliers) {
        totalSuppliers++;
        if (s.approved) {
          activeSuppliers++;
          if (s.featured) featuredSuppliers++;
          if (s.verified) verifiedSuppliers++;
          if (s.rating && s.rating > 0) {
            ratingSum += s.rating;
            ratedSuppliersCount++;
          }
          // Track categories for approved suppliers
          if (s.category) {
            activeCategoriesSet.add(s.category);
            categorySupplierCounts[s.category] = (categorySupplierCounts[s.category] || 0) + 1;
          }
        }
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Get active categories count
    let totalActiveCategories = 0;
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getCategoryBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const c of result.categories) {
        if (c.is_active !== false) totalActiveCategories++;
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Batch process reviews
    let approvedReviews = 0;
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getReviewBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const r of result.reviews) {
        if (r.status === 'approved') approvedReviews++;
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    const averageRating = ratedSuppliersCount > 0 ? ratingSum / ratedSuppliersCount : 0;
    
    // Homepage stats to display
    const homepageStats = [
      { key: "homepageTotalSuppliers", value: activeSuppliers },
      { key: "homepageFeaturedSuppliers", value: featuredSuppliers },
      { key: "homepageVerifiedSuppliers", value: verifiedSuppliers },
      { key: "homepageTotalReviews", value: approvedReviews },
      { key: "homepageTotalCategories", value: totalActiveCategories },
      { key: "homepageAverageRating", value: Math.round(averageRating * 10) / 10 },
    ];
    
    // Update homepage stats batch
    await ctx.runMutation(internal.statsCron.updateStatsBatch, {
      stats: homepageStats,
      category: "homepage",
      now,
    });
    
    // Update category stats for homepage
    const categoryStats = Object.entries(categorySupplierCounts).map(([categoryName, count]) => ({
      key: `homepageCategoryCount:${categoryName}`,
      value: count,
      metadata: { categoryName },
    }));
    
    for (const stat of categoryStats) {
      await ctx.runMutation(internal.statsCron.updateHomepageCategoryStat, {
        key: stat.key,
        value: stat.value,
        categoryName: stat.metadata.categoryName,
        now,
      });
    }
    
    return {
      success: true,
      message: "Homepage stats recalculated via action",
      statsCount: homepageStats.length,
      categoriesUpdated: Object.keys(categorySupplierCounts).length,
      timestamp: now,
    };
  },
});

/**
 * Internal mutation: Wrapper for cron compatibility - schedules the action
 */
export const recalculateHomepageStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.statsCron.recalculateHomepageStatsAction, {});
    return { scheduled: true, message: "Homepage stats recalculation scheduled" };
  },
});

/**
 * Internal ACTION: Recalculate category stats
 * Uses batched processing to avoid document read limits
 */
export const recalculateCategoryStatsAction = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // First pass: collect all category names in batches
    const categoryStats: Record<string, {
      total: number;
      approved: number;
      featured: number;
      verified: number;
    }> = {};
    
    let hasMore = true;
    let lastId: string | undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getCategoryBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const category of result.categories) {
        categoryStats[category.name] = {
          total: 0,
          approved: 0,
          featured: 0,
          verified: 0,
        };
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Second pass: count suppliers per category in batches
    hasMore = true;
    lastId = undefined;
    
    while (hasMore) {
      const result = await ctx.runQuery(internal.statsCron.getSupplierBatch, {
        cursor: lastId,
        limit: 100,
      });
      
      for (const supplier of result.suppliers) {
        const cat = supplier.category;
        if (cat && categoryStats[cat]) {
          categoryStats[cat].total++;
          if (supplier.approved) categoryStats[cat].approved++;
          if (supplier.featured) categoryStats[cat].featured++;
          if (supplier.verified) categoryStats[cat].verified++;
        }
      }
      
      hasMore = result.hasMore;
      lastId = result.nextCursor;
    }
    
    // Update stats for each category with unique keys via internal mutation
    for (const [categoryName, counts] of Object.entries(categoryStats)) {
      await ctx.runMutation(internal.statsCron.updateCategoryStat, {
        categoryName,
        totalSuppliers: counts.total,
        approvedSuppliers: counts.approved,
        featuredSuppliers: counts.featured,
        verifiedSuppliers: counts.verified,
        now,
      });
    }
    
    return {
      success: true,
      message: "Category stats recalculated via action",
      categoriesUpdated: Object.keys(categoryStats).length,
      timestamp: now,
    };
  },
});

/**
 * Internal mutation: Wrapper for cron compatibility - schedules the action
 */
export const recalculateCategoryStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.statsCron.recalculateCategoryStatsAction, {});
    return { scheduled: true, message: "Category stats recalculation scheduled" };
  },
});

/**
 * Query: Get supplier-specific stats (for supplier dashboard)
 */
export const getSupplierStats = query({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Verify the user owns this supplier or is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user) throw new Error("Utilisateur non trouvé");
    
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Fournisseur non trouvé");
    
    // Only allow owner or admin
    if (supplier.userId !== user._id && !user.is_admin) {
      throw new Error("Accès refusé");
    }
    
    // Get the supplier stats using unique key
    const uniqueKey = `supplierStats:${args.supplierId}`;
    const stat = await ctx.db
      .query("stats")
      .withIndex("key", (q) => q.eq("key", uniqueKey))
      .first();
    
    if (!stat) {
      return {
        totalReviews: 0,
        averageRating: 0,
        totalProducts: 0,
        activeProducts: 0,
        hasApprovedClaim: false,
        isApproved: supplier.approved,
        isVerified: supplier.verified,
        isFeatured: supplier.featured,
      };
    }
    
    return {
      totalReviews: stat.metadata?.totalReviews || 0,
      averageRating: stat.metadata?.averageRating || 0,
      totalProducts: stat.metadata?.totalProducts || 0,
      activeProducts: stat.metadata?.activeProducts || 0,
      hasApprovedClaim: stat.metadata?.hasApprovedClaim || false,
      isApproved: stat.metadata?.isApproved || false,
      isVerified: stat.metadata?.isVerified || false,
      isFeatured: stat.metadata?.isFeatured || false,
      lastUpdated: stat.updatedAt,
    };
  },
});

/**
 * Query: Get homepage stats (for regular users)
 */
export const getHomepageStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db
      .query("stats")
      .withIndex("category", (q) => q.eq("category", "homepage"))
      .collect();
    
    const result: Record<string, number | Record<string, number>> = {};
    
    for (const stat of stats) {
      if (stat.key.startsWith("homepageCategoryCount:") && stat.metadata?.categoryName) {
        if (!result.categoryCounts) {
          result.categoryCounts = {};
        }
        (result.categoryCounts as Record<string, number>)[stat.metadata.categoryName] = stat.value;
      } else {
        result[stat.key] = stat.value;
      }
    }
    
    // Ensure defaults
    const defaults = {
      homepageTotalSuppliers: 0,
      homepageFeaturedSuppliers: 0,
      homepageVerifiedSuppliers: 0,
      homepageTotalReviews: 0,
      homepageTotalCategories: 0,
      homepageAverageRating: 0,
      categoryCounts: {},
    };
    
    return { ...defaults, ...result };
  },
});

// ============================================================================
// INTERNAL QUERY HELPERS FOR ACTIONS - Support bandwidth-optimized cron actions
// ============================================================================

/**
 * Internal query: Get batch of suppliers with pagination
 */
export const getSupplierBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 100);
    
    let query = ctx.db.query("suppliers");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const suppliers = await query.take(limit + 1);
    const hasMore = suppliers.length > limit;
    const results = hasMore ? suppliers.slice(0, limit) : suppliers;
    
    return {
      suppliers: results.map(s => ({
        _id: s._id,
        approved: s.approved,
        featured: s.featured,
        verified: s.verified,
        claimStatus: s.claimStatus,
        rating: s.rating,
        category: s.category,
        business_name: s.business_name,
      })),
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : undefined,
    };
  },
});

/**
 * Internal query: Get batch of users with pagination
 */
export const getUserBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 100);
    
    let query = ctx.db.query("users");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const users = await query.take(limit + 1);
    const hasMore = users.length > limit;
    const results = hasMore ? users.slice(0, limit) : users;
    
    return {
      users: results.map(u => ({
        _id: u._id,
        user_type: u.user_type,
      })),
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : undefined,
    };
  },
});

/**
 * Internal query: Get batch of reviews with pagination
 */
export const getReviewBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 100);
    
    let query = ctx.db.query("reviews");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const reviews = await query.take(limit + 1);
    const hasMore = reviews.length > limit;
    const results = hasMore ? reviews.slice(0, limit) : reviews;
    
    return {
      reviews: results.map(r => ({
        _id: r._id,
        status: r.status,
      })),
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : undefined,
    };
  },
});

/**
 * Internal query: Get batch of products with pagination
 */
export const getProductBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 100);
    
    let query = ctx.db.query("products");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const products = await query.take(limit + 1);
    const hasMore = products.length > limit;
    const results = hasMore ? products.slice(0, limit) : products;
    
    return {
      products: results.map(p => ({
        _id: p._id,
        status: p.status,
      })),
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : undefined,
    };
  },
});

/**
 * Internal query: Get batch of categories with pagination
 */
export const getCategoryBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 100);
    
    let query = ctx.db.query("categories");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const categories = await query.take(limit + 1);
    const hasMore = categories.length > limit;
    const results = hasMore ? categories.slice(0, limit) : categories;
    
    return {
      categories: results.map(c => ({
        _id: c._id,
        name: c.name,
        is_active: c.is_active,
      })),
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : undefined,
    };
  },
});

/**
 * Internal query: Get batch of claims with pagination
 */
export const getClaimBatch = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 100);
    
    let query = ctx.db.query("supplierClaims");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const claims = await query.take(limit + 1);
    const hasMore = claims.length > limit;
    const results = hasMore ? claims.slice(0, limit) : claims;
    
    return {
      claims: results.map(c => ({
        _id: c._id,
        status: c.status,
      })),
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : undefined,
    };
  },
});

/**
 * Internal mutation: Batch update stats
 */
export const updateStatsBatch = internalMutation({
  args: {
    stats: v.array(v.object({
      key: v.string(),
      value: v.number(),
    })),
    category: v.string(),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    for (const stat of args.stats) {
      const existing = await ctx.db
        .query("stats")
        .withIndex("key", (q) => q.eq("key", stat.key))
        .filter((q) => q.eq(q.field("category"), args.category))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: stat.value,
          updatedAt: args.now,
          metadata: { ...existing.metadata, lastCronRun: args.now },
        });
      } else {
        await ctx.db.insert("stats", {
          key: stat.key,
          value: stat.value,
          category: args.category,
          metadata: { lastCronRun: args.now },
          updatedAt: args.now,
        });
      }
    }
    return { updated: args.stats.length };
  },
});

// ============================================================================
// ADDITIONAL INTERNAL HELPERS FOR SUPPLIER/CATEGORY ACTIONS
// ============================================================================

/**
 * Internal query: Get supplier batch with full details
 */
export const getSupplierBatchWithDetails = internalQuery({
  args: {
    cursor: v.optional(v.id("suppliers")),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 50);
    
    let query = ctx.db.query("suppliers");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const suppliers = await query.take(limit + 1);
    const hasMore = suppliers.length > limit;
    const results = hasMore ? suppliers.slice(0, limit) : suppliers;
    
    return {
      suppliers: results.map(s => ({
        _id: s._id,
        business_name: s.business_name,
        approved: s.approved,
        featured: s.featured,
        verified: s.verified,
        claimStatus: s.claimStatus,
      })),
      hasMore,
    };
  },
});

/**
 * Internal query: Get reviews for a specific supplier
 */
export const getSupplierReviewsBatch = internalQuery({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
    
    return {
      reviews: reviews.map(r => ({
        _id: r._id,
        rating: r.rating,
        status: r.status,
      })),
    };
  },
});

/**
 * Internal query: Get products for a specific supplier
 */
export const getSupplierProductsBatch = internalQuery({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
    
    return {
      products: products.map(p => ({
        _id: p._id,
        status: p.status,
      })),
    };
  },
});

/**
 * Internal mutation: Update a single supplier stat
 */
export const updateSupplierStat = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
    businessName: v.string(),
    totalReviews: v.number(),
    averageRating: v.number(),
    totalProducts: v.number(),
    activeProducts: v.number(),
    hasApprovedClaim: v.boolean(),
    isApproved: v.boolean(),
    isVerified: v.boolean(),
    isFeatured: v.boolean(),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    const uniqueKey = `supplierStats:${args.supplierId}`;
    const existing = await ctx.db
      .query("stats")
      .withIndex("key", (q) => q.eq("key", uniqueKey))
      .first();
    
    const statData = {
      key: uniqueKey,
      value: args.totalReviews + args.totalProducts,
      category: "supplier",
      metadata: {
        supplierId: args.supplierId,
        businessName: args.businessName,
        totalReviews: args.totalReviews,
        averageRating: args.averageRating,
        totalProducts: args.totalProducts,
        activeProducts: args.activeProducts,
        hasApprovedClaim: args.hasApprovedClaim,
        isApproved: args.isApproved,
        isVerified: args.isVerified,
        isFeatured: args.isFeatured,
      },
      updatedAt: args.now,
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, statData);
    } else {
      await ctx.db.insert("stats", statData);
    }
  },
});

/**
 * Internal mutation: Update homepage category stat
 */
export const updateHomepageCategoryStat = internalMutation({
  args: {
    key: v.string(),
    value: v.number(),
    categoryName: v.string(),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stats")
      .withIndex("key", (q) => q.eq("key", args.key))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: args.now,
      });
    } else {
      await ctx.db.insert("stats", {
        key: args.key,
        value: args.value,
        category: "homepage",
        metadata: { categoryName: args.categoryName },
        updatedAt: args.now,
      });
    }
  },
});

/**
 * Internal mutation: Update category stat
 */
export const updateCategoryStat = internalMutation({
  args: {
    categoryName: v.string(),
    totalSuppliers: v.number(),
    approvedSuppliers: v.number(),
    featuredSuppliers: v.number(),
    verifiedSuppliers: v.number(),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    const uniqueKey = `categoryStats:${args.categoryName}`;
    const existing = await ctx.db
      .query("stats")
      .withIndex("key", (q) => q.eq("key", uniqueKey))
      .first();
    
    const statData = {
      key: uniqueKey,
      value: args.approvedSuppliers,
      category: "category",
      metadata: {
        categoryName: args.categoryName,
        totalSuppliers: args.totalSuppliers,
        approvedSuppliers: args.approvedSuppliers,
        featuredSuppliers: args.featuredSuppliers,
        verifiedSuppliers: args.verifiedSuppliers,
      },
      updatedAt: args.now,
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, statData);
    } else {
      await ctx.db.insert("stats", statData);
    }
  },
});
