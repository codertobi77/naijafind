import { type QueryClient } from '@tanstack/react-query';
import type { FunctionReference } from 'convex/server';
import { getFunctionName } from 'convex/server';

/**
 * Cache tag definitions for Convex queries
 * Used to group related queries for batch invalidation
 */
export const CACHE_TAGS = {
  // User-related queries
  USERS: 'users',
  USER_PROFILE: 'user-profile',
  
  // Supplier-related queries
  SUPPLIERS: 'suppliers',
  SUPPLIER_PROFILE: 'supplier-profile',
  SUPPLIER_PRODUCTS: 'supplier-products',
  
  // Product-related queries
  PRODUCTS: 'products',
  PRODUCT_DETAILS: 'product-details',
  
  // Category-related queries
  CATEGORIES: 'categories',
  CATEGORY_DETAILS: 'category-details',
  
  // Admin-related queries
  ADMIN_DASHBOARD: 'admin-dashboard',
  ADMIN_STATS: 'admin-stats',
  ADMIN_USERS: 'admin-users',
  ADMIN_SUPPLIERS: 'admin-suppliers',
  ADMIN_PRODUCTS: 'admin-products',
  
  // Search and suggestions
  SEARCH: 'search',
  SEARCH_SUGGESTIONS: 'search-suggestions',
  
  // Reviews
  REVIEWS: 'reviews',
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_COUNT: 'notification-count',
  
  // Dashboard
  DASHBOARD_STATS: 'dashboard-stats',
  DASHBOARD_ACTIVITY: 'dashboard-activity',
  
  // Verification
  VERIFICATION_STATUS: 'verification-status',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

/**
 * Mapping of Convex function names to their cache tags
 * This defines which queries are invalidated when a mutation occurs
 */
export const QUERY_CACHE_TAGS: Record<string, CacheTag[]> = {
  // Categories
  'categories:getAllCategories': [CACHE_TAGS.CATEGORIES],
  'categories:getAllCategoriesAdmin': [CACHE_TAGS.CATEGORIES, CACHE_TAGS.ADMIN_DASHBOARD],
  
  // Products
  'products:listProducts': [CACHE_TAGS.PRODUCTS, CACHE_TAGS.SUPPLIER_PRODUCTS],
  'products:listAllProductsAdmin': [CACHE_TAGS.PRODUCTS, CACHE_TAGS.ADMIN_PRODUCTS],
  'products:listProductsBySupplier': [CACHE_TAGS.PRODUCTS, CACHE_TAGS.SUPPLIER_PRODUCTS],
  
  // Suppliers
  'suppliers:getSupplier': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE],
  'suppliers:getSupplierBySlug': [CACHE_TAGS.SUPPLIERS],
  'suppliers:getSupplierForEdit': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE],
  'suppliers:getAllSuppliers': [CACHE_TAGS.SUPPLIERS],
  'suppliers:getPendingSuppliers': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.ADMIN_SUPPLIERS],
  'suppliers:getVerifiedSuppliers': [CACHE_TAGS.SUPPLIERS],
  'suppliers:getSuppliersByCategory': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.CATEGORIES],
  'suppliers:searchSuppliers': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SEARCH],
  'suppliers:getSupplierStats': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.DASHBOARD_STATS],
  'suppliers:getPublicSupplierProfile': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE],
  'suppliers:getSuppliersWithActiveProducts': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.PRODUCTS],
  
  // Users
  'users:getUser': [CACHE_TAGS.USERS, CACHE_TAGS.USER_PROFILE],
  'users:getAllUsers': [CACHE_TAGS.USERS, CACHE_TAGS.ADMIN_USERS],
  'users:getPendingUsers': [CACHE_TAGS.USERS, CACHE_TAGS.ADMIN_USERS],
  'users:getUserStats': [CACHE_TAGS.USERS, CACHE_TAGS.DASHBOARD_STATS],
  'users:getCurrentUser': [CACHE_TAGS.USERS, CACHE_TAGS.USER_PROFILE],
  'users:getCurrentUserWithProfile': [CACHE_TAGS.USERS, CACHE_TAGS.USER_PROFILE, CACHE_TAGS.SUPPLIER_PROFILE],
  
  // Dashboard
  'dashboard:getStats': [CACHE_TAGS.DASHBOARD_STATS],
  'dashboard:getAdminStats': [CACHE_TAGS.DASHBOARD_STATS, CACHE_TAGS.ADMIN_STATS],
  'dashboard:getSupplierStats': [CACHE_TAGS.DASHBOARD_STATS, CACHE_TAGS.SUPPLIER_PROFILE],
  
  // Reviews
  'reviews:getReviewsBySupplier': [CACHE_TAGS.REVIEWS, CACHE_TAGS.SUPPLIER_PROFILE],
  'reviews:getAverageRating': [CACHE_TAGS.REVIEWS],
  'reviews:getReviewCount': [CACHE_TAGS.REVIEWS],
  'reviews:getAllReviews': [CACHE_TAGS.REVIEWS, CACHE_TAGS.ADMIN_DASHBOARD],
  'reviews:getPendingReviews': [CACHE_TAGS.REVIEWS, CACHE_TAGS.ADMIN_DASHBOARD],
  
  // Search
  'searchSuggestions:getSuggestions': [CACHE_TAGS.SEARCH_SUGGESTIONS],
  'searchSuggestions:getPopular': [CACHE_TAGS.SEARCH_SUGGESTIONS],
  
  // Notifications
  'notifications:getUserNotifications': [CACHE_TAGS.NOTIFICATIONS],
  'notifications:getUnreadCount': [CACHE_TAGS.NOTIFICATIONS, CACHE_TAGS.NOTIFICATION_COUNT],
  
  // Verification
  'verification:getStatus': [CACHE_TAGS.VERIFICATION_STATUS],
  'verification:getMyVerification': [CACHE_TAGS.VERIFICATION_STATUS],
  'verification:getPendingVerifications': [CACHE_TAGS.VERIFICATION_STATUS, CACHE_TAGS.ADMIN_DASHBOARD],
  'verification:getVerificationStats': [CACHE_TAGS.VERIFICATION_STATUS, CACHE_TAGS.DASHBOARD_STATS],
  
  // Admin
  'admin:getStats': [CACHE_TAGS.ADMIN_STATS, CACHE_TAGS.ADMIN_DASHBOARD],
  'admin:getPendingActions': [CACHE_TAGS.ADMIN_DASHBOARD],
  'admin:getRecentActivity': [CACHE_TAGS.DASHBOARD_ACTIVITY, CACHE_TAGS.ADMIN_DASHBOARD],
};

/**
 * Mapping of mutations to the cache tags they invalidate
 * When a mutation succeeds, all queries with these tags are invalidated
 */
export const MUTATION_INVALIDATION_MAP: Record<string, CacheTag[]> = {
  // Category mutations
  'categories:addCategory': [CACHE_TAGS.CATEGORIES, CACHE_TAGS.ADMIN_DASHBOARD],
  'categories:updateCategory': [CACHE_TAGS.CATEGORIES, CACHE_TAGS.SUPPLIERS, CACHE_TAGS.ADMIN_DASHBOARD],
  'categories:deleteCategory': [CACHE_TAGS.CATEGORIES, CACHE_TAGS.SUPPLIERS, CACHE_TAGS.ADMIN_DASHBOARD],
  
  // Product mutations
  'products:createProduct': [CACHE_TAGS.PRODUCTS, CACHE_TAGS.SUPPLIER_PRODUCTS, CACHE_TAGS.DASHBOARD_STATS],
  'products:updateProduct': [CACHE_TAGS.PRODUCTS, CACHE_TAGS.SUPPLIER_PRODUCTS, CACHE_TAGS.ADMIN_PRODUCTS],
  'products:deleteProduct': [CACHE_TAGS.PRODUCTS, CACHE_TAGS.SUPPLIER_PRODUCTS, CACHE_TAGS.ADMIN_PRODUCTS, CACHE_TAGS.DASHBOARD_STATS],
  
  // Supplier mutations
  'suppliers:createSupplier': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE, CACHE_TAGS.ADMIN_SUPPLIERS, CACHE_TAGS.DASHBOARD_STATS],
  'suppliers:updateSupplier': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE, CACHE_TAGS.ADMIN_SUPPLIERS],
  'suppliers:updateProfile': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE, CACHE_TAGS.USER_PROFILE],
  'suppliers:updateCompanyInfo': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE],
  'suppliers:deleteSupplier': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.ADMIN_SUPPLIERS, CACHE_TAGS.DASHBOARD_STATS],
  'suppliers:updateSupplierStatus': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.ADMIN_SUPPLIERS, CACHE_TAGS.ADMIN_DASHBOARD],
  'suppliers:verifySupplier': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.VERIFICATION_STATUS, CACHE_TAGS.ADMIN_SUPPLIERS],
  'suppliers:rejectSupplier': [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.VERIFICATION_STATUS, CACHE_TAGS.ADMIN_SUPPLIERS],
  
  // User mutations
  'users:updateUser': [CACHE_TAGS.USERS, CACHE_TAGS.USER_PROFILE, CACHE_TAGS.ADMIN_USERS],
  'users:updateUserType': [CACHE_TAGS.USERS, CACHE_TAGS.USER_PROFILE, CACHE_TAGS.ADMIN_USERS, CACHE_TAGS.ADMIN_DASHBOARD],
  'users:deleteUser': [CACHE_TAGS.USERS, CACHE_TAGS.ADMIN_USERS, CACHE_TAGS.DASHBOARD_STATS],
  'users:updateProfile': [CACHE_TAGS.USERS, CACHE_TAGS.USER_PROFILE],
  
  // Review mutations
  'reviews:createReview': [CACHE_TAGS.REVIEWS, CACHE_TAGS.SUPPLIER_PROFILE, CACHE_TAGS.DASHBOARD_STATS],
  'reviews:updateReview': [CACHE_TAGS.REVIEWS, CACHE_TAGS.SUPPLIER_PROFILE, CACHE_TAGS.ADMIN_DASHBOARD],
  'reviews:deleteReview': [CACHE_TAGS.REVIEWS, CACHE_TAGS.SUPPLIER_PROFILE, CACHE_TAGS.ADMIN_DASHBOARD],
  'reviews:approveReview': [CACHE_TAGS.REVIEWS, CACHE_TAGS.ADMIN_DASHBOARD],
  'reviews:rejectReview': [CACHE_TAGS.REVIEWS, CACHE_TAGS.ADMIN_DASHBOARD],
  'reviews:respondToReview': [CACHE_TAGS.REVIEWS, CACHE_TAGS.SUPPLIER_PROFILE],
  
  // Notification mutations
  'notifications:createNotification': [CACHE_TAGS.NOTIFICATIONS, CACHE_TAGS.NOTIFICATION_COUNT],
  'notifications:markAsRead': [CACHE_TAGS.NOTIFICATIONS, CACHE_TAGS.NOTIFICATION_COUNT],
  'notifications:markAllAsRead': [CACHE_TAGS.NOTIFICATIONS, CACHE_TAGS.NOTIFICATION_COUNT],
  'notifications:deleteNotification': [CACHE_TAGS.NOTIFICATIONS],
  
  // Verification mutations
  'verification:submit': [CACHE_TAGS.VERIFICATION_STATUS, CACHE_TAGS.DASHBOARD_STATS],
  'verification:approve': [CACHE_TAGS.VERIFICATION_STATUS, CACHE_TAGS.SUPPLIERS, CACHE_TAGS.ADMIN_DASHBOARD],
  'verification:reject': [CACHE_TAGS.VERIFICATION_STATUS, CACHE_TAGS.SUPPLIERS, CACHE_TAGS.ADMIN_DASHBOARD],
  'verification:requestChanges': [CACHE_TAGS.VERIFICATION_STATUS],
  
  // Search suggestions
  'searchSuggestions:recordSearch': [CACHE_TAGS.SEARCH, CACHE_TAGS.SEARCH_SUGGESTIONS],
  'searchSuggestions:addSuggestion': [CACHE_TAGS.SEARCH_SUGGESTIONS],
  
  // Init/Setup
  'init:initializeCategories': [CACHE_TAGS.CATEGORIES, CACHE_TAGS.ADMIN_DASHBOARD],
};

/**
 * Get cache tags for a query function
 */
export function getQueryCacheTags<Query extends FunctionReference<'query'>>
  (query: Query): CacheTag[] {
  const functionName = getFunctionName(query);
  return QUERY_CACHE_TAGS[functionName] || [];
}

/**
 * Get cache tags to invalidate for a mutation function
 */
export function getMutationInvalidationTags<Mutation extends FunctionReference<'mutation'>>
  (mutation: Mutation): CacheTag[] {
  const functionName = getFunctionName(mutation);
  return MUTATION_INVALIDATION_MAP[functionName] || [];
}

/**
 * Invalidate queries by cache tags
 */
export async function invalidateCacheByTags(
  queryClient: QueryClient,
  tags: CacheTag[]
): Promise<void> {
  // Invalidate all queries that match the given tags
  await Promise.all(
    tags.map(tag => 
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Check if any query key component matches a tag
          return queryKey.some(key => {
            if (typeof key === 'string') {
              return key.includes(tag) || QUERY_CACHE_TAGS[key]?.includes(tag);
            }
            return false;
          });
        }
      })
    )
  );
}

/**
 * Prefetch a Convex query and add it to cache
 */
export async function prefetchConvexQuery<Query extends FunctionReference<'query'>>(
  queryClient: QueryClient,
  convex: { query: FunctionReference<'query'>['_args'] },
  query: Query,
  args: Query['_args']
): Promise<void> {
  const functionName = getFunctionName(query);
  const cacheTags = getQueryCacheTags(query);
  
  await queryClient.prefetchQuery({
    queryKey: [functionName, args],
    queryFn: async () => {
      const result = await convex.query(query, args);
      return result as Query['_returnType'];
    },
    meta: {
      tags: cacheTags,
    },
  });
}

/**
 * Cache warming - prefetch multiple related queries at once
 */
export async function warmCache(
  queryClient: QueryClient,
  queries: Array<{
    convex: { query: FunctionReference<'query'>['_args'] },
    query: FunctionReference<'query'>,
    args?: unknown;
  }>
): Promise<void> {
  await Promise.all(
    queries.map(({ convex, query, args }) =>
      prefetchConvexQuery(queryClient, convex as { query: FunctionReference<'query'>['_args'] }, query, args || {})
    )
  );
}

/**
 * Clear all Convex-related cache
 */
export async function clearConvexCache(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey[0];
      return typeof queryKey === 'string' && queryKey.includes(':');
    }
  });
}

/**
 * Get stale time recommendation based on query type
 */
export function getStaleTimeForQuery(functionName: string): number {
  // Reduced stale times for more responsive updates
  if (functionName.includes('stats') || functionName.includes('dashboard')) {
    return 10 * 1000; // 10 seconds for stats (highly volatile)
  }
  if (functionName.includes('notifications') || functionName.includes('count')) {
    return 5 * 1000; // 5 seconds for real-time data
  }
  if (functionName.includes('search') || functionName.includes('suggestion')) {
    return 30 * 1000; // 30 seconds for search
  }
  if (functionName.includes('categories')) {
    return 60 * 1000; // 1 minute for categories
  }
  return 30 * 1000; // Default 30 seconds (reduced from 5 minutes)
}
