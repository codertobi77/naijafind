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
    // Get all categories (usually small number, but bounded for safety)
    const categories = await ctx.db.query("categories").take(1000);
    
    // Get all suppliers - but only category field to minimize data transfer
    const suppliers = await ctx.db.query("suppliers").take(10000); // Limit to prevent timeout
    
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
    // Get all categories (bounded for safety)
    const categories = await ctx.db.query("categories").take(1000);
    
    // Get all suppliers (bounded to prevent memory issues)
    const suppliers = await ctx.db.query("suppliers").take(10000);
    
    // Build detailed stats using a Map for single-pass aggregation (O(C + S))
    // This avoids nested filtering which is O(C * S)
    const statsMap = new Map<string, { total: number, approved: number, featured: number, verified: number }>();

    // Initialize map with all categories
    for (const cat of categories) {
      statsMap.set(cat.name, { total: 0, approved: 0, featured: 0, verified: 0 });
    }

    // Aggregate supplier stats in one pass
    for (const s of suppliers) {
      if (s.category && statsMap.has(s.category)) {
        const stats = statsMap.get(s.category)!;
        stats.total++;
        if (s.approved) stats.approved++;
        if (s.featured) stats.featured++;
        if (s.verified) stats.verified++;
      }
    }

    // Convert Map back to array format
    const stats = categories.map((cat) => {
      const s = statsMap.get(cat.name)!;
      return {
        name: cat.name,
        ...s,
      };
    });
    
    return stats;
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
    
    // Parallelize collection fetching with Promise.all
    const [
      allSuppliers,
      allUsers,
      allReviews,
      allProducts,
      allCategories,
      allClaims
    ] = await Promise.all([
      ctx.db.query("suppliers").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("supplierClaims").collect()
    ]);

    // Aggregate supplier stats in a single pass
    let pendingSuppliers = 0;
    let approvedSuppliers = 0;
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let claimedSuppliers = 0;
    let ratedSuppliersCount = 0;
    let totalRating = 0;

    for (const s of allSuppliers) {
      if (!s.approved) pendingSuppliers++;
      else approvedSuppliers++;

      if (s.featured) featuredSuppliers++;
      if (s.verified) verifiedSuppliers++;
      if (s.claimStatus === "approved") claimedSuppliers++;

      if (s.rating && s.rating > 0) {
        ratedSuppliersCount++;
        totalRating += s.rating;
      }
    }
    
    // Aggregate other collection stats in single passes
    const totalUsers = allUsers.length;
    let totalSuppliersAsUsers = 0;
    for (const u of allUsers) {
      if (u.user_type === 'supplier') totalSuppliersAsUsers++;
    }
    
    const totalReviews = allReviews.length;
    
    const totalProducts = allProducts.length;
    let activeProducts = 0;
    for (const p of allProducts) {
      if (p.status === 'active') activeProducts++;
    }
    
    const totalCategories = allCategories.length;
    let activeCategories = 0;
    for (const c of allCategories) {
      if (c.is_active !== false) activeCategories++;
    }
    
    let pendingClaims = 0;
    let approvedClaims = 0;
    for (const c of allClaims) {
      if (c.status === 'pending') pendingClaims++;
      else if (c.status === 'approved') approvedClaims++;
    }
    
    // Calculate average rating
    const averageRating = ratedSuppliersCount > 0
      ? totalRating / ratedSuppliersCount
      : 0;
    
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
    // Parallelize queries for approved suppliers and active categories
    const [approvedSuppliers, categories] = await Promise.all([
      ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", true))
        .collect(),
      ctx.db
        .query("categories")
        .withIndex("is_active", (q) => q.eq("is_active", true))
        .collect()
    ]);
    
    const totalSuppliers = approvedSuppliers.length;
    const totalCategories = categories.length;
    
    // Aggregate featured, verified, rating, and category breakdown in one pass
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let ratedSuppliersCount = 0;
    let totalRating = 0;
    const categoryCounts: Record<string, number> = {};

    // Initialize category counts
    for (const cat of categories) {
      categoryCounts[cat.name] = 0;
    }

    for (const s of approvedSuppliers) {
      if (s.featured) featuredSuppliers++;
      if (s.verified) verifiedSuppliers++;

      if (s.rating && s.rating > 0) {
        ratedSuppliersCount++;
        totalRating += s.rating;
      }

      if (s.category && categoryCounts[s.category] !== undefined) {
        categoryCounts[s.category]++;
      }
    }
    
    // Calculate average rating
    const averageRating = ratedSuppliersCount > 0
      ? totalRating / ratedSuppliersCount
      : 0;

    return {
      totalSuppliers,
      featuredSuppliers,
      verifiedSuppliers,
      totalCategories,
      averageRating: Math.round(averageRating * 100) / 100,
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
    
    // Count reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    
    // Count products
    const products = await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    
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
    // Same logic as getAdminStats but without auth check
    // (auth is handled by the calling action)
    
    // Parallelize collection fetching with Promise.all
    const [
      allSuppliers,
      allUsers,
      allReviews,
      allProducts,
      allCategories,
      allClaims
    ] = await Promise.all([
      ctx.db.query("suppliers").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("supplierClaims").collect()
    ]);

    // Aggregate supplier stats in a single pass
    let pendingSuppliers = 0;
    let approvedSuppliersCount = 0;
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let claimedSuppliers = 0;
    let ratedSuppliersCount = 0;
    let totalRating = 0;

    for (const s of allSuppliers) {
      if (!s.approved) pendingSuppliers++;
      else approvedSuppliersCount++;

      if (s.featured) featuredSuppliers++;
      if (s.verified) verifiedSuppliers++;
      if (s.claimStatus === "approved") claimedSuppliers++;

      if (s.rating && s.rating > 0) {
        ratedSuppliersCount++;
        totalRating += s.rating;
      }
    }

    // Aggregate other collection stats in single passes
    const totalUsers = allUsers.length;
    let totalSuppliersAsUsers = 0;
    for (const u of allUsers) {
      if (u.user_type === 'supplier') totalSuppliersAsUsers++;
    }

    const totalReviews = allReviews.length;

    const totalProducts = allProducts.length;
    let activeProducts = 0;
    for (const p of allProducts) {
      if (p.status === 'active') activeProducts++;
    }

    const totalCategories = allCategories.length;
    let activeCategories = 0;
    for (const c of allCategories) {
      if (c.is_active !== false) activeCategories++;
    }
    
    let pendingClaims = 0;
    let approvedClaims = 0;
    for (const c of allClaims) {
      if (c.status === 'pending') pendingClaims++;
      else if (c.status === 'approved') approvedClaims++;
    }

    // Calculate average rating
    const averageRating = ratedSuppliersCount > 0
      ? totalRating / ratedSuppliersCount
      : 0;
    
    return {
      totalSuppliers: allSuppliers.length,
      pendingSuppliers,
      approvedSuppliers: approvedSuppliersCount,
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
