import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Bandwidth-optimized actions for real-time statistics
 * These actions perform direct counts on source tables instead of using a cached stats table
 * This ensures stats are always accurate without needing cron jobs
 */

// ============================================================================
// SIMPLE SUPPLIER COUNT - For hero badge only
// ============================================================================

/**
 * Query: Get simple approved supplier count for hero badge
 * Lightweight query that only returns the count, no auth required
 */
export const getSupplierCount = query({
  args: {},
  handler: async (ctx) => {
    // Count only approved suppliers for public display (capped at 10000)
    const approvedSuppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .take(10000);
    
    // Return capped count - for accurate counts at scale, use a denormalized counter
    return approvedSuppliers.length < 10000 ? approvedSuppliers.length : 10000;
  },
});

/**
 * Action: Get category supplier counts efficiently
 * Uses server-side aggregation for minimal bandwidth
 * Returns array format to avoid special characters in field names
 */
export const getCategoryStats = action({
  args: {},
  handler: async (ctx) => {
    // Use internal query to do aggregation server-side
    const result = await ctx.runQuery(api.statsOptimized._getCategoryStatsInternal);
    return result;
  },
});

/**
 * Internal query: Do the actual aggregation
 */
export const _getCategoryStatsInternal = query({
  args: {},
  handler: async (ctx) => {
    // Parallelize database fetches
    const [categories, suppliers] = await Promise.all([
      ctx.db.query("categories").take(1000),
      ctx.db.query("suppliers").take(10000)
    ]);
    
    // Count suppliers per category
    const categoryMap = new Map<string, number>();
    
    // Initialize all categories with 0
    for (const cat of categories) {
      categoryMap.set(cat.name, 0);
    }
    
    // Count suppliers
    for (const supplier of suppliers) {
      const cat = supplier.category;
      if (cat && categoryMap.has(cat)) {
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      }
    }
    
    // Convert to array format
    const result = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
    
    return result;
  },
});

/**
 * Query: Get detailed category stats with breakdown
 * Returns total, approved, featured, verified counts per category as array
 */
export const getDetailedCategoryStats = query({
  args: {},
  handler: async (ctx) => {
    // Parallelize database fetches
    const [categories, suppliers] = await Promise.all([
      ctx.db.query("categories").take(1000),
      ctx.db.query("suppliers").take(10000)
    ]);

    // Single-pass Map-based aggregation
    const statsMap = new Map<string, { total: number; approved: number; featured: number; verified: number }>();
    
    // Initialize map with categories
    for (const cat of categories) {
      statsMap.set(cat.name, { total: 0, approved: 0, featured: 0, verified: 0 });
    }
    
    // Single pass over suppliers
    for (const s of suppliers) {
      const entry = statsMap.get(s.category);
      if (entry) {
        entry.total++;
        if (s.approved) entry.approved++;
        if (s.featured) entry.featured++;
        if (s.verified) entry.verified++;
      }
    }
    
    // Map results back to expected format
    return categories.map((cat) => ({
      name: cat.name,
      ...statsMap.get(cat.name)!
    }));
  },
});

// ============================================================================
// ADMIN DASHBOARD STATS - Real-time counts for admin
// ============================================================================

/**
 * Query: Get all admin dashboard stats
 * Performs direct counts for maximum accuracy
 */
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    // Check admin auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    // Parallelize all primary database fetches
    const [
      allSuppliers,
      allUsers,
      totalReviews,
      allProducts,
      allCategories,
      allClaims
    ] = await Promise.all([
      ctx.db.query("suppliers").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("reviews").count(), // Efficient count
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("supplierClaims").collect()
    ]);
    
    // Single-pass supplier aggregation
    let pendingSuppliers = 0;
    let approvedSuppliers = 0;
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let claimedSuppliers = 0;
    let ratingSum = 0;
    let ratedCount = 0;

    for (const s of allSuppliers) {
      if (s.approved) approvedSuppliers++;
      else pendingSuppliers++;

      if (s.featured) featuredSuppliers++;
      if (s.verified) verifiedSuppliers++;
      if (s.claimStatus === "approved") claimedSuppliers++;

      if (s.rating && s.rating > 0) {
        ratingSum += s.rating;
        ratedCount++;
      }
    }
    
    const totalSuppliers = allSuppliers.length;
    const averageRating = ratedCount > 0 ? ratingSum / ratedCount : 0;

    // Single-pass user aggregation
    let totalSuppliersAsUsers = 0;
    for (const u of allUsers) {
      if (u.user_type === 'supplier') totalSuppliersAsUsers++;
    }
    const totalUsers = allUsers.length;
    
    // Single-pass product aggregation
    let activeProducts = 0;
    for (const p of allProducts) {
      if (p.status === 'active') activeProducts++;
    }
    const totalProducts = allProducts.length;
    
    // Single-pass category aggregation
    let activeCategories = 0;
    for (const c of allCategories) {
      if (c.is_active !== false) activeCategories++;
    }
    
    // Single-pass claim aggregation
    let pendingClaims = 0;
    let approvedClaims = 0;
    for (const c of allClaims) {
      if (c.status === 'pending') pendingClaims++;
      else if (c.status === 'approved') approvedClaims++;
    }
    
    return {
      totalSuppliers,
      pendingSuppliers,
      approvedSuppliers,
      featuredSuppliers,
      verifiedSuppliers,
      claimedSuppliers,
      totalUsers,
      totalSuppliersAsUsers,
      totalReviews,
      totalProducts,
      activeProducts,
      activeCategories,
      pendingClaims,
      approvedClaims,
      averageRating: Math.round(averageRating * 100) / 100,
    };
  },
});

// ============================================================================
// HOMEPAGE STATS - Public-facing statistics
// ============================================================================

/**
 * Query: Get homepage stats for public display
 * Shows approved/verified counts only
 */
export const getHomepageStats = query({
  args: {},
  handler: async (ctx) => {
    // Parallelize fetches
    const [approvedSuppliers, activeCategories] = await Promise.all([
      ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", true))
        .collect(),
      ctx.db
        .query("categories")
        .withIndex("is_active", (q) => q.eq("is_active", true))
        .collect()
    ]);
    
    // Single-pass supplier aggregation
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let ratingSum = 0;
    let ratedCount = 0;
    const countsMap = new Map<string, number>();

    for (const s of approvedSuppliers) {
      if (s.featured) featuredSuppliers++;
      if (s.verified) verifiedSuppliers++;

      if (s.rating && s.rating > 0) {
        ratingSum += s.rating;
        ratedCount++;
      }

      if (s.category) {
        countsMap.set(s.category, (countsMap.get(s.category) || 0) + 1);
      }
    }
    
    const averageRating = ratedCount > 0 ? ratingSum / ratedCount : 0;
    
    // Build category breakdown
    const categoryCounts: Record<string, number> = {};
    for (const cat of activeCategories) {
      categoryCounts[cat.name] = countsMap.get(cat.name) || 0;
    }
    
    return {
      totalSuppliers: approvedSuppliers.length,
      featuredSuppliers,
      verifiedSuppliers,
      totalCategories: activeCategories.length,
      averageRating: Math.round(averageRating * 10) / 10,
      categoryCounts,
    };
  },
});

// ============================================================================
// SUPPLIER STATS - Individual supplier statistics
// ============================================================================

/**
 * Query: Get stats for a specific supplier
 * Used in supplier dashboard
 */
export const getSupplierStats = query({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Verify user owns this supplier or is admin
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
    
    // Fetch products for this supplier once
    const products = await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
    
    const totalProducts = products.length;
    let activeProducts = 0;
    for (const p of products) {
      if (p.status === 'active') activeProducts++;
    }

    // Use denormalized rating and reviews_count from supplier document
    const totalReviews = Number(supplier.reviews_count || 0n);
    const averageRating = supplier.rating || 0;
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      totalProducts,
      activeProducts,
      hasApprovedClaim: supplier.claimStatus === 'approved',
      isApproved: supplier.approved,
      isVerified: supplier.verified,
      isFeatured: supplier.featured,
    };
  },
});

// ============================================================================
// ACTION: Bulk stats calculation (for background processing if needed)
// ============================================================================

/**
 * Action: Calculate all global stats
 * Can be called manually by admin when needed
 * Uses actions for bandwidth optimization on large datasets
 */
export const calculateGlobalStatsAction = action({
  args: {},
  handler: async (ctx) => {
    // This action can be used to verify stats or for migration purposes
    // It performs the same calculations as getAdminStats but as an action
    // which can be better for very large datasets
    
    const stats = await ctx.runQuery(api.statsOptimized._adminStatsInternal);
    
    return {
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    };
  },
});

/**
 * Internal query used by the action
 */
export const _adminStatsInternal = query({
  args: {},
  handler: async (ctx) => {
    // Parallelize all primary database fetches
    const [
      allSuppliers,
      allUsers,
      totalReviews,
      allProducts,
      allCategories,
      allClaims
    ] = await Promise.all([
      ctx.db.query("suppliers").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("reviews").count(), // Efficient count
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("supplierClaims").collect()
    ]);

    // Single-pass supplier aggregation
    let pendingSuppliers = 0;
    let approvedSuppliers = 0;
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let claimedSuppliers = 0;
    let ratingSum = 0;
    let ratedCount = 0;

    for (const s of allSuppliers) {
      if (s.approved) approvedSuppliers++;
      else pendingSuppliers++;

      if (s.featured) featuredSuppliers++;
      if (s.verified) verifiedSuppliers++;
      if (s.claimStatus === "approved") claimedSuppliers++;

      if (s.rating && s.rating > 0) {
        ratingSum += s.rating;
        ratedCount++;
      }
    }
    
    const averageRating = ratedCount > 0 ? ratingSum / ratedCount : 0;

    // Single-pass user aggregation
    let totalSuppliersAsUsers = 0;
    for (const u of allUsers) {
      if (u.user_type === 'supplier') totalSuppliersAsUsers++;
    }
    
    // Single-pass product aggregation
    let activeProducts = 0;
    for (const p of allProducts) {
      if (p.status === 'active') activeProducts++;
    }

    // Single-pass category aggregation
    let activeCategories = 0;
    for (const c of allCategories) {
      if (c.is_active !== false) activeCategories++;
    }

    // Single-pass claim aggregation
    let pendingClaims = 0;
    let approvedClaims = 0;
    for (const c of allClaims) {
      if (c.status === 'pending') pendingClaims++;
      else if (c.status === 'approved') approvedClaims++;
    }
    
    return {
      totalSuppliers: allSuppliers.length,
      pendingSuppliers,
      approvedSuppliers,
      featuredSuppliers,
      verifiedSuppliers,
      claimedSuppliers,
      totalUsers: allUsers.length,
      totalSuppliersAsUsers,
      totalReviews,
      totalProducts: allProducts.length,
      activeProducts,
      activeCategories,
      pendingClaims,
      approvedClaims,
      averageRating: Math.round(averageRating * 100) / 100,
    };
  },
});
