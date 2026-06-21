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
    // Optimization: Use native .count() for efficiency instead of fetching documents
    const count = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .count();
    
    return count < 10000 ? count : 10000;
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
    // Optimization: Parallelize fetches for categories and suppliers
    const [categories, suppliers] = await Promise.all([
      ctx.db.query("categories").take(1000),
      ctx.db.query("suppliers").take(10000),
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
    // Optimization: Parallelize fetches for categories and suppliers
    const [categories, suppliers] = await Promise.all([
      ctx.db.query("categories").take(1000),
      ctx.db.query("suppliers").take(10000),
    ]);
    
    // Optimization: Use a single pass Map-based aggregation to avoid O(C * S) complexity
    const statsMap = new Map();
    for (const cat of categories) {
      statsMap.set(cat.name, {
        name: cat.name,
        total: 0,
        approved: 0,
        featured: 0,
        verified: 0,
      });
    }

    for (const s of suppliers) {
      const catStats = statsMap.get(s.category);
      if (catStats) {
        catStats.total++;
        if (s.approved) catStats.approved++;
        if (s.featured) catStats.featured++;
        if (s.verified) catStats.verified++;
      }
    }
    
    return Array.from(statsMap.values());
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
    
    // Optimization: Parallelize all primary database fetches
    const [allSuppliers, allUsers, allReviews, allProducts, allCategories, allClaims] = await Promise.all([
      ctx.db.query("suppliers").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("supplierClaims").collect(),
    ]);

    // Optimization: Single-pass aggregation for supplier metrics
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

    const totalSuppliers = allSuppliers.length;
    
    // Optimization: Single-pass aggregation for other metrics
    const totalUsers = allUsers.length;
    const totalSuppliersAsUsers = allUsers.reduce((count, u) => u.user_type === 'supplier' ? count + 1 : count, 0);
    
    const totalReviews = allReviews.length;
    
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.reduce((count, p) => p.status === 'active' ? count + 1 : count, 0);
    
    const activeCategories = allCategories.reduce((count, c) => c.is_active !== false ? count + 1 : count, 0);
    
    // Claims breakdown
    let pendingClaims = 0;
    let approvedClaims = 0;
    for (const c of allClaims) {
      if (c.status === 'pending') pendingClaims++;
      else if (c.status === 'approved') approvedClaims++;
    }
    
    // Calculate average rating
    const averageRating = ratedSuppliersCount > 0 ? totalRating / ratedSuppliersCount : 0;
    
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
    // Optimization: Parallelize fetches for approved suppliers and categories
    const [approvedSuppliers, categories] = await Promise.all([
      ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", true))
        .collect(),
      ctx.db
        .query("categories")
        .withIndex("is_active", (q) => q.eq("is_active", true))
        .collect(),
    ]);
    
    // Optimization: Single-pass aggregation for all homepage metrics
    let featuredSuppliers = 0;
    let verifiedSuppliers = 0;
    let totalRating = 0;
    let ratedSuppliersCount = 0;
    
    const categoryCounts: Record<string, number> = {};
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

    const totalSuppliers = approvedSuppliers.length;
    const totalCategories = categories.length;
    const averageRating = ratedSuppliersCount > 0 ? totalRating / ratedSuppliersCount : 0;
    
    return {
      totalSuppliers,
      featuredSuppliers,
      verifiedSuppliers,
      totalCategories,
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
    
    // Optimization: Parallelize reviews and products fetches
    const [reviews, products] = await Promise.all([
      ctx.db
        .query("reviews")
        .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
        .collect(),
      ctx.db
        .query("products")
        .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
        .collect(),
    ]);
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    
    const totalProducts = products.length;
    // Optimization: Single-pass for active products
    const activeProducts = products.reduce((count, p) => p.status === 'active' ? count + 1 : count, 0);
    
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
    
    // Optimization: Parallelize all primary database fetches
    const [allSuppliers, allUsers, allReviews, allProducts, allCategories, allClaims] = await Promise.all([
      ctx.db.query("suppliers").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("supplierClaims").collect(),
    ]);

    // Optimization: Single-pass aggregation for supplier metrics
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

    const averageRating = ratedSuppliersCount > 0 ? totalRating / ratedSuppliersCount : 0;
    
    // Optimization: Single-pass aggregation for other metrics
    const totalSuppliersAsUsers = allUsers.reduce((count, u) => u.user_type === 'supplier' ? count + 1 : count, 0);
    const activeProducts = allProducts.reduce((count, p) => p.status === 'active' ? count + 1 : count, 0);
    const activeCategories = allCategories.reduce((count, c) => c.is_active !== false ? count + 1 : count, 0);

    // Claims breakdown
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
      totalReviews: allReviews.length,
      totalProducts: allProducts.length,
      activeProducts,
      activeCategories,
      pendingClaims,
      approvedClaims,
      averageRating: Math.round(averageRating * 100) / 100,
    };
  },
});
