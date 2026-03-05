import { QueryClient } from '@tanstack/react-query';
import { CACHE_TAGS } from './convexCache';

// Cache tag configurations for different data types
const CACHE_CONFIG = {
  // Highly volatile - refetch frequently
  [CACHE_TAGS.NOTIFICATIONS]: { staleTime: 5 * 1000, gcTime: 30 * 1000 },
  [CACHE_TAGS.NOTIFICATION_COUNT]: { staleTime: 5 * 1000, gcTime: 30 * 1000 },
  [CACHE_TAGS.DASHBOARD_STATS]: { staleTime: 10 * 1000, gcTime: 60 * 1000 },
  
  // Medium volatility - shorter cache for admin
  [CACHE_TAGS.USERS]: { staleTime: 15 * 1000, gcTime: 60 * 1000 },
  [CACHE_TAGS.SUPPLIERS]: { staleTime: 15 * 1000, gcTime: 60 * 1000 },
  [CACHE_TAGS.PRODUCTS]: { staleTime: 15 * 1000, gcTime: 60 * 1000 },
  [CACHE_TAGS.REVIEWS]: { staleTime: 15 * 1000, gcTime: 60 * 1000 },
  
  // Low volatility - cache longer
  [CACHE_TAGS.CATEGORIES]: { staleTime: 60 * 1000, gcTime: 5 * 60 * 1000 },
  [CACHE_TAGS.SEARCH_SUGGESTIONS]: { staleTime: 60 * 1000, gcTime: 5 * 60 * 1000 },
  
  // Admin data - short cache
  [CACHE_TAGS.ADMIN_DASHBOARD]: { staleTime: 10 * 1000, gcTime: 60 * 1000 },
  [CACHE_TAGS.ADMIN_STATS]: { staleTime: 10 * 1000, gcTime: 60 * 1000 },
} as const;

// Configure React Query with optimized defaults for Convex
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduced cache time for more responsive updates
      staleTime: 30 * 1000, // 30 seconds (was 5 minutes)
      
      // Keep unused data in cache for shorter time
      gcTime: 2 * 60 * 1000, // 2 minutes (was 10 minutes)
      
      // Refetch on window focus disabled by default - reduces unnecessary network churn
      refetchOnWindowFocus: false,
      
      // Retry failed requests
      retry: 1,
      
      // Only refetch on mount if data is stale
      refetchOnMount: true,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Don't keep previous data to avoid showing stale data
      placeholderData: undefined,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

/**
 * Get cache configuration for a specific tag
 */
export function getCacheConfig(tag: string) {
  return CACHE_CONFIG[tag as keyof typeof CACHE_CONFIG] || {
    staleTime: 30 * 1000, // 30 seconds default
    gcTime: 2 * 60 * 1000, // 2 minutes
  };
}
