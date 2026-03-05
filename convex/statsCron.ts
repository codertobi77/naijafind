import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation: Recalculate all global stats (admin stats)
 * Uses batched processing to avoid document read limits
 */
export const recalculateGlobalStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // Process suppliers in batches to count
    let totalSuppliers = 0;
    let pendingSuppliers = 0;
    let approvedSuppliers = 0;
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let claimedSuppliers = 0;
    let ratingSum = 0;
    let ratedSuppliersCount = 0;
    
    // Batch process suppliers
    let supplierBatch = await ctx.db.query("suppliers").take(100);
    while (supplierBatch.length > 0) {
      for (const s of supplierBatch) {
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
      // Get next batch
      const lastId = supplierBatch[supplierBatch.length - 1]._id;
      supplierBatch = await ctx.db
        .query("suppliers")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Batch process users
    let totalUsers = 0;
    let totalSuppliersAsUsers = 0;
    let totalRegularUsers = 0;
    
    let userBatch = await ctx.db.query("users").take(100);
    while (userBatch.length > 0) {
      for (const u of userBatch) {
        totalUsers++;
        if (u.user_type === 'supplier') totalSuppliersAsUsers++;
        if (u.user_type === 'user') totalRegularUsers++;
      }
      const lastId = userBatch[userBatch.length - 1]._id;
      userBatch = await ctx.db
        .query("users")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Batch process reviews
    let totalReviews = 0;
    let pendingReviews = 0;
    let approvedReviews = 0;
    
    let reviewBatch = await ctx.db.query("reviews").take(100);
    while (reviewBatch.length > 0) {
      for (const r of reviewBatch) {
        totalReviews++;
        if (r.status === 'pending') pendingReviews++;
        if (r.status === 'approved') approvedReviews++;
      }
      const lastId = reviewBatch[reviewBatch.length - 1]._id;
      reviewBatch = await ctx.db
        .query("reviews")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Batch process products
    let totalProducts = 0;
    let activeProducts = 0;
    
    let productBatch = await ctx.db.query("products").take(100);
    while (productBatch.length > 0) {
      for (const p of productBatch) {
        totalProducts++;
        if (p.status === 'active') activeProducts++;
      }
      const lastId = productBatch[productBatch.length - 1]._id;
      productBatch = await ctx.db
        .query("products")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Batch process categories
    let totalCategories = 0;
    let activeCategories = 0;
    
    let categoryBatch = await ctx.db.query("categories").take(100);
    while (categoryBatch.length > 0) {
      for (const c of categoryBatch) {
        totalCategories++;
        if (c.is_active !== false) activeCategories++;
      }
      const lastId = categoryBatch[categoryBatch.length - 1]._id;
      categoryBatch = await ctx.db
        .query("categories")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Batch process claims
    let pendingClaims = 0;
    let approvedClaims = 0;
    let rejectedClaims = 0;
    
    let claimBatch = await ctx.db.query("supplierClaims").take(100);
    while (claimBatch.length > 0) {
      for (const c of claimBatch) {
        if (c.status === 'pending') pendingClaims++;
        if (c.status === 'approved') approvedClaims++;
        if (c.status === 'rejected') rejectedClaims++;
      }
      const lastId = claimBatch[claimBatch.length - 1]._id;
      claimBatch = await ctx.db
        .query("supplierClaims")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    const averageRating = ratedSuppliersCount > 0 ? ratingSum / ratedSuppliersCount : 0;
    
    // Update all global stats
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
          metadata: { ...existing.metadata, lastCronRun: now },
        });
      } else {
        await ctx.db.insert("stats", {
          key: stat.key,
          value: stat.value,
          category: "global",
          metadata: { lastCronRun: now },
          updatedAt: now,
        });
      }
    }
    
    return {
      success: true,
      message: "Global stats recalculated",
      statsCount: statsToUpdate.length,
      timestamp: now,
    };
  },
});

/**
 * Internal mutation: Recalculate stats for all suppliers
 * Each supplier gets their own stats document
 * Processes in batches to avoid document read limits
 */
export const recalculateAllSupplierStats = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    lastSupplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const batchSize = Math.min(args.batchSize ?? 50, 50); // Max 50 per batch
    
    // Get batch of suppliers - use paginated query
    let suppliersBatch;
    if (args.lastSupplierId) {
      // Get suppliers after the last processed one
      suppliersBatch = await ctx.db
        .query("suppliers")
        .withIndex("_creationTime", (q) => q.gt("_creationTime", 0))
        .filter((q) => q.gt(q.field("_id"), args.lastSupplierId!))
        .take(batchSize);
    } else {
      // First batch
      suppliersBatch = await ctx.db.query("suppliers").take(batchSize);
    }
    
    let updatedCount = 0;
    let lastProcessedId: string | undefined;
    
    for (const supplier of suppliersBatch) {
      // Use indexed queries to get only relevant reviews/products for this supplier
      const supplierReviews = await ctx.db
        .query("reviews")
        .withIndex("supplierId", (q) => q.eq("supplierId", supplier._id))
        .collect();
      
      const totalReviews = supplierReviews.length;
      const averageRating = totalReviews > 0
        ? supplierReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        : 0;
      
      // Query products for this supplier using index
      const supplierProducts = await ctx.db
        .query("products")
        .withIndex("supplierId", (q) => q.eq("supplierId", supplier._id))
        .collect();
      
      const totalProducts = supplierProducts.length;
      const activeProducts = supplierProducts.filter(p => p.status === 'active').length;
      
      // Check claim status
      const hasApprovedClaim = supplier.claimStatus === 'approved';
      
      // Update or create supplier stats with unique key
      const uniqueKey = `supplierStats:${supplier._id}`;
      const existingStat = await ctx.db
        .query("stats")
        .withIndex("key", (q) => q.eq("key", uniqueKey))
        .first();
      
      const statData = {
        key: uniqueKey,
        value: totalReviews + totalProducts,
        category: "supplier",
        metadata: {
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
        },
        updatedAt: now,
      };
      
      if (existingStat) {
        await ctx.db.patch(existingStat._id, statData);
      } else {
        await ctx.db.insert("stats", statData);
      }
      
      updatedCount++;
      lastProcessedId = supplier._id;
    }
    
    // Schedule next batch if we got a full batch
    const hasMore = suppliersBatch.length === batchSize;
    if (hasMore && lastProcessedId) {
      await ctx.scheduler.runAfter(0, internal.statsCron.recalculateAllSupplierStats, {
        batchSize,
        lastSupplierId: lastProcessedId,
      });
    }
    
    return {
      success: true,
      message: "Supplier stats recalculated (batch)",
      suppliersUpdated: updatedCount,
      hasMore,
      timestamp: now,
    };
  },
});

/**
 * Internal mutation: Recalculate stats for homepage (user view)
 * These are stats shown to regular users
 * Uses batched processing to avoid document read limits
 */
export const recalculateHomepageStats = internalMutation({
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
    
    let supplierBatch = await ctx.db.query("suppliers").take(100);
    while (supplierBatch.length > 0) {
      for (const s of supplierBatch) {
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
      const lastId = supplierBatch[supplierBatch.length - 1]._id;
      supplierBatch = await ctx.db
        .query("suppliers")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Get active categories count
    let totalActiveCategories = 0;
    let categoryBatch = await ctx.db.query("categories").take(100);
    while (categoryBatch.length > 0) {
      for (const c of categoryBatch) {
        if (c.is_active !== false) totalActiveCategories++;
      }
      const lastId = categoryBatch[categoryBatch.length - 1]._id;
      categoryBatch = await ctx.db
        .query("categories")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Batch process reviews
    let approvedReviews = 0;
    let reviewBatch = await ctx.db.query("reviews").take(100);
    while (reviewBatch.length > 0) {
      for (const r of reviewBatch) {
        if (r.status === 'approved') approvedReviews++;
      }
      const lastId = reviewBatch[reviewBatch.length - 1]._id;
      reviewBatch = await ctx.db
        .query("reviews")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
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
    
    for (const stat of homepageStats) {
      const existing = await ctx.db
        .query("stats")
        .withIndex("key", (q) => q.eq("key", stat.key))
        .filter((q) => q.eq(q.field("category"), "homepage"))
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
          category: "homepage",
          updatedAt: now,
        });
      }
    }
    
    // Update category stats for homepage with unique keys
    for (const [categoryName, count] of Object.entries(categorySupplierCounts)) {
      const uniqueKey = `homepageCategoryCount:${categoryName}`;
      const existing = await ctx.db
        .query("stats")
        .withIndex("key", (q) => q.eq("key", uniqueKey))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: count,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("stats", {
          key: uniqueKey,
          value: count,
          category: "homepage",
          metadata: { categoryName },
          updatedAt: now,
        });
      }
    }
    
    return {
      success: true,
      message: "Homepage stats recalculated",
      statsCount: homepageStats.length,
      categoriesUpdated: Object.keys(categorySupplierCounts).length,
      timestamp: now,
    };
  },
});

/**
 * Internal mutation: Recalculate category stats
 * Uses batched processing to avoid document read limits
 */
export const recalculateCategoryStats = internalMutation({
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
    
    let categoryBatch = await ctx.db.query("categories").take(100);
    while (categoryBatch.length > 0) {
      for (const category of categoryBatch) {
        categoryStats[category.name] = {
          total: 0,
          approved: 0,
          featured: 0,
          verified: 0,
        };
      }
      const lastId = categoryBatch[categoryBatch.length - 1]._id;
      categoryBatch = await ctx.db
        .query("categories")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Second pass: count suppliers per category in batches
    let supplierBatch = await ctx.db.query("suppliers").take(100);
    while (supplierBatch.length > 0) {
      for (const supplier of supplierBatch) {
        const cat = supplier.category;
        if (cat && categoryStats[cat]) {
          categoryStats[cat].total++;
          if (supplier.approved) categoryStats[cat].approved++;
          if (supplier.featured) categoryStats[cat].featured++;
          if (supplier.verified) categoryStats[cat].verified++;
        }
      }
      const lastId = supplierBatch[supplierBatch.length - 1]._id;
      supplierBatch = await ctx.db
        .query("suppliers")
        .filter((q) => q.gt(q.field("_id"), lastId))
        .take(100);
    }
    
    // Update stats for each category with unique keys
    for (const [categoryName, counts] of Object.entries(categoryStats)) {
      const uniqueKey = `categoryStats:${categoryName}`;
      const existing = await ctx.db
        .query("stats")
        .withIndex("key", (q) => q.eq("key", uniqueKey))
        .first();
      
      const statData = {
        key: uniqueKey,
        value: counts.approved,
        category: "category",
        metadata: {
          categoryName,
          totalSuppliers: counts.total,
          approvedSuppliers: counts.approved,
          featuredSuppliers: counts.featured,
          verifiedSuppliers: counts.verified,
        },
        updatedAt: now,
      };
      
      if (existing) {
        await ctx.db.patch(existing._id, statData);
      } else {
        await ctx.db.insert("stats", statData);
      }
    }
    
    return {
      success: true,
      message: "Category stats recalculated",
      categoriesUpdated: Object.keys(categoryStats).length,
      timestamp: now,
    };
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
