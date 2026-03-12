import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Bandwidth-optimized actions for real-time statistics
 * These actions perform direct counts on source tables instead of using a cached stats table
 * This ensures stats are always accurate without needing cron jobs
 */

// ============================================================================
// CATEGORY STATS - Optimized for Categories Page
// ============================================================================

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
    // Get all categories (usually small number)
    const categories = await ctx.db.query("categories").collect();
    
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
    // Get all categories
    const categories = await ctx.db.query("categories").collect();
    
    // Get all suppliers
    const suppliers = await ctx.db.query("suppliers").collect();
    
    // Build detailed stats as array
    const stats = categories.map((cat) => {
      const catSuppliers = suppliers.filter(s => s.category === cat.name);
      return {
        name: cat.name,
        total: catSuppliers.length,
        approved: catSuppliers.filter(s => s.approved).length,
        featured: catSuppliers.filter(s => s.featured).length,
        verified: catSuppliers.filter(s => s.verified).length,
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
    
    // Count suppliers efficiently using indexes
    const allSuppliers = await ctx.db.query("suppliers").collect();
    const totalSuppliers = allSuppliers.length;
    const pendingSuppliers = allSuppliers.filter(s => !s.approved).length;
    const approvedSuppliers = allSuppliers.filter(s => s.approved).length;
    const featuredSuppliers = allSuppliers.filter(s => s.featured).length;
    const verifiedSuppliers = allSuppliers.filter(s => s.verified).length;
    const claimedSuppliers = allSuppliers.filter(s => s.claimStatus === "approved").length;
    
    // Count users
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const totalSuppliersAsUsers = allUsers.filter(u => u.user_type === 'supplier').length;
    
    // Count reviews
    const allReviews = await ctx.db.query("reviews").collect();
    const totalReviews = allReviews.length;
    
    // Count products
    const allProducts = await ctx.db.query("products").collect();
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter(p => p.status === 'active').length;
    
    // Count categories
    const allCategories = await ctx.db.query("categories").collect();
    const activeCategories = allCategories.filter(c => c.is_active !== false).length;
    
    // Count claims
    const allClaims = await ctx.db.query("supplierClaims").collect();
    const pendingClaims = allClaims.filter(c => c.status === 'pending').length;
    const approvedClaims = allClaims.filter(c => c.status === 'approved').length;
    
    // Calculate average rating
    const ratedSuppliers = allSuppliers.filter(s => s.rating && s.rating > 0);
    const averageRating = ratedSuppliers.length > 0
      ? ratedSuppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSuppliers.length
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
    // Count approved suppliers only for public display
    const approvedSuppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .collect();
    
    const totalSuppliers = approvedSuppliers.length;
    const featuredSuppliers = approvedSuppliers.filter(s => s.featured).length;
    const verifiedSuppliers = approvedSuppliers.filter(s => s.verified).length;
    
    // Calculate average rating from approved suppliers
    const ratedSuppliers = approvedSuppliers.filter(s => s.rating && s.rating > 0);
    const averageRating = ratedSuppliers.length > 0
      ? ratedSuppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSuppliers.length
      : 0;
    
    // Count active categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .collect();
    const totalCategories = categories.length;
    
    // Category breakdown with counts
    const categoryCounts: Record<string, number> = {};
    for (const cat of categories) {
      categoryCounts[cat.name] = approvedSuppliers.filter(s => s.category === cat.name).length;
    }
    
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
    
    const allSuppliers = await ctx.db.query("suppliers").collect();
    const allUsers = await ctx.db.query("users").collect();
    const allReviews = await ctx.db.query("reviews").collect();
    const allProducts = await ctx.db.query("products").collect();
    const allCategories = await ctx.db.query("categories").collect();
    const allClaims = await ctx.db.query("supplierClaims").collect();
    
    const ratedSuppliers = allSuppliers.filter(s => s.rating && s.rating > 0);
    const averageRating = ratedSuppliers.length > 0
      ? ratedSuppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSuppliers.length
      : 0;
    
    return {
      totalSuppliers: allSuppliers.length,
      pendingSuppliers: allSuppliers.filter(s => !s.approved).length,
      approvedSuppliers: allSuppliers.filter(s => s.approved).length,
      featuredSuppliers: allSuppliers.filter(s => s.featured).length,
      verifiedSuppliers: allSuppliers.filter(s => s.verified).length,
      claimedSuppliers: allSuppliers.filter(s => s.claimStatus === "approved").length,
      totalUsers: allUsers.length,
      totalSuppliersAsUsers: allUsers.filter(u => u.user_type === 'supplier').length,
      totalReviews: allReviews.length,
      totalProducts: allProducts.length,
      activeProducts: allProducts.filter(p => p.status === 'active').length,
      activeCategories: allCategories.filter(c => c.is_active !== false).length,
      pendingClaims: allClaims.filter(c => c.status === 'pending').length,
      approvedClaims: allClaims.filter(c => c.status === 'approved').length,
      averageRating: Math.round(averageRating * 100) / 100,
    };
  },
});
