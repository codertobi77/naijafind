import { QueryClient } from '@tanstack/react-query';
import { CACHE_TAGS } from './convexCache';

// Cache tag configurations for different data types
const CACHE_CONFIG = {
  // Highly volatile - refetch frequently
  [CACHE_TAGS.NOTIFICATIONS]: { staleTime: 10 * 1000, gcTime: 60 * 1000 },
  [CACHE_TAGS.NOTIFICATION_COUNT]: { staleTime: 10 * 1000, gcTime: 60 * 1000 },
  [CACHE_TAGS.DASHBOARD_STATS]: { staleTime: 30 * 1000, gcTime: 2 * 60 * 1000 },
  
  // Medium volatility - standard cache
  [CACHE_TAGS.USERS]: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  [CACHE_TAGS.SUPPLIERS]: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  [CACHE_TAGS.PRODUCTS]: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  [CACHE_TAGS.REVIEWS]: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  
  // Low volatility - cache longer
  [CACHE_TAGS.CATEGORIES]: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  [CACHE_TAGS.SEARCH_SUGGESTIONS]: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  
  // Admin data - moderate cache
  [CACHE_TAGS.ADMIN_DASHBOARD]: { staleTime: 60 * 1000, gcTime: 3 * 60 * 1000 },
  [CACHE_TAGS.ADMIN_STATS]: { staleTime: 60 * 1000, gcTime: 3 * 60 * 1000 },
} as const;

// Configure React Query with optimized defaults for Convex
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Retry failed requests
      retry: 1,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Enable suspense for better loading states
      suspense: false,
      
      // Keep previous data while fetching new data
      placeholderData: (previousData: unknown) => previousData,
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  };
}
