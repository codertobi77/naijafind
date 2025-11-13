/**
 * React Query Caching Strategy - Migration Guide
 * 
 * This file demonstrates how to migrate from direct Convex useQuery hooks
 * to React Query cached queries for better performance and reduced API calls.
 */

// ============================================================================
// BEFORE: Direct Convex Query (No Caching)
// ============================================================================
/*
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

function MyComponent() {
  const data = useQuery(api.myFunction, { arg1: 'value' });
  const loading = data === undefined;
  
  return loading ? <Spinner /> : <Content data={data} />;
}
*/

// ============================================================================
// AFTER: React Query Cached Query (With Caching)
// ============================================================================
/*
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';

function MyComponent() {
  const { data, isLoading } = useConvexQuery(
    api.myFunction, 
    { arg1: 'value' },
    { 
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
  
  return isLoading ? <Spinner /> : <Content data={data} />;
}
*/

// ============================================================================
// MIGRATION PATTERNS
// ============================================================================

/**
 * Pattern 1: Simple Query Migration
 */
export const Pattern1_SimpleQuery = () => {
  // BEFORE
  // const meData = useQuery(api.users.me, {});
  
  // AFTER
  // const { data: meData, isLoading } = useConvexQuery(api.users.me, {});
};

/**
 * Pattern 2: Query with Custom Stale Time
 * Use different stale times based on how often the data changes:
 * - User data: 2-5 minutes
 * - Categories/Static data: 10-15 minutes
 * - Featured content: 10 minutes
 * - Search results: 2-3 minutes
 */
export const Pattern2_CustomStaleTime = () => {
  // Static data that rarely changes - cache longer
  // const { data: categories } = useConvexQuery(
  //   api.categories.getAllCategories,
  //   {},
  //   { staleTime: 15 * 60 * 1000 } // 15 minutes
  // );
  
  // Dynamic data that changes frequently - cache shorter
  // const { data: searchResults } = useConvexQuery(
  //   api.suppliers.searchSuppliers,
  //   { query: searchTerm },
  //   { staleTime: 2 * 60 * 1000 } // 2 minutes
  // );
};

/**
 * Pattern 3: Conditional/Skippable Queries
 */
export const Pattern3_ConditionalQuery = () => {
  // BEFORE
  // const supplierData = useQuery(
  //   api.suppliers.getSupplierDetails,
  //   supplierId ? { id: supplierId } : 'skip'
  // );
  
  // AFTER
  // const { data: supplierData, isLoading } = useConvexQuerySkippable(
  //   supplierId ? api.suppliers.getSupplierDetails : 'skip',
  //   supplierId ? { id: supplierId } : undefined
  // );
};

/**
 * Pattern 4: Multiple Queries in One Component
 */
export const Pattern4_MultipleQueries = () => {
  // const { data: meData } = useConvexQuery(api.users.me, {});
  // const { data: categories } = useConvexQuery(api.categories.getAllCategories, {});
  // const { data: suppliers, isLoading } = useConvexQuery(
  //   api.suppliers.searchSuppliers,
  //   { limit: BigInt(10) }
  // );
  
  // All queries will be cached independently
  // Subsequent renders will use cached data if still fresh
};

/**
 * Pattern 5: Disable Caching for Real-time Data
 */
export const Pattern5_DisableCaching = () => {
  // For data that needs to be always fresh (e.g., live dashboards)
  // const { data: liveOrders } = useConvexQuery(
  //   api.orders.getLiveOrders,
  //   {},
  //   { 
  //     staleTime: 0, // Always refetch
  //     refetchInterval: 5000 // Refetch every 5 seconds
  //   }
  // );
};

// ============================================================================
// RECOMMENDED STALE TIMES BY DATA TYPE
// ============================================================================

export const CACHE_TIMES = {
  // User session data - moderate caching
  USER_DATA: 2 * 60 * 1000, // 2 minutes
  
  // Static reference data - aggressive caching
  CATEGORIES: 15 * 60 * 1000, // 15 minutes
  
  // Featured/promotional content - balanced caching
  FEATURED_CONTENT: 10 * 60 * 1000, // 10 minutes
  
  // Search results - short caching
  SEARCH_RESULTS: 3 * 60 * 1000, // 3 minutes
  
  // Dashboard statistics - short caching
  DASHBOARD_STATS: 5 * 60 * 1000, // 5 minutes
  
  // Product/Supplier details - moderate caching
  DETAILS_PAGE: 5 * 60 * 1000, // 5 minutes
  
  // Real-time data - no caching
  REAL_TIME: 0, // Always fresh
};

// ============================================================================
// PAGES TO MIGRATE
// ============================================================================

/**
 * TODO: Migrate these pages to use React Query caching:
 * 
 * ✅ src/pages/home/page.tsx - DONE (Example)
 * ⏳ src/pages/search/page.tsx - TODO
 * ⏳ src/pages/categories/page.tsx - TODO
 * ⏳ src/pages/supplier/page.tsx - TODO
 * ⏳ src/pages/dashboard/page.tsx - TODO
 * ⏳ src/pages/admin/page.tsx - TODO
 * ⏳ src/pages/contact/page.tsx - TODO
 * 
 * Auth pages (already have good loading states, migrate for consistency):
 * ⏳ src/pages/auth/login.tsx - TODO
 * ⏳ src/pages/auth/register.tsx - TODO
 * ⏳ src/pages/auth/choose-role.tsx - TODO
 * ⏳ src/pages/auth/supplier-setup.tsx - TODO
 */

// ============================================================================
// BENEFITS
// ============================================================================

/**
 * Benefits of React Query Caching:
 * 
 * 1. Reduced API Calls
 *    - Queries are cached and reused across components
 *    - Multiple components using same query = 1 API call
 * 
 * 2. Better Performance
 *    - Instant data display from cache
 *    - Background refetching for fresh data
 * 
 * 3. Automatic Background Updates
 *    - Refetch on window focus
 *    - Refetch on reconnect
 *    - Configurable polling intervals
 * 
 * 4. Better User Experience
 *    - Faster page loads
 *    - Reduced loading states
 *    - Smoother transitions between pages
 * 
 * 5. Cost Savings
 *    - Fewer Convex queries = lower costs
 *    - Especially beneficial for high-traffic pages
 */
