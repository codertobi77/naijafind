import { useCallback } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import { getFunctionName } from 'convex/server';
import {
  getQueryCacheTags,
  prefetchConvexQuery,
  warmCache,
  invalidateCacheByTags,
  clearConvexCache,
  type CacheTag,
  CACHE_TAGS,
} from '../lib/convexCache';

/**
 * Hook for prefetching Convex queries
 * Useful for preloading data before navigation
 */
export function usePrefetchConvex() {
  const queryClient = useQueryClient();
  const convex = useConvex();

  const prefetch = useCallback(
    async <Query extends FunctionReference<'query'>>(
      query: Query,
      args?: Query['_args']
    ) => {
      await prefetchConvexQuery(
        queryClient,
        convex as { query: FunctionReference<'query'>['_args'] },
        query,
        args || ({} as Query['_args'])
      );
    },
    [queryClient, convex]
  );

  const prefetchMultiple = useCallback(
    async (queries: Array<{
      query: FunctionReference<'query'>;
      args?: unknown;
    }>) => {
      await warmCache(
        queryClient,
        queries.map(q => ({
          convex: convex as { query: FunctionReference<'query'>['_args'] },
          query: q.query,
          args: q.args,
        }))
      );
    },
    [queryClient, convex]
  );

  return { prefetch, prefetchMultiple };
}

/**
 * Hook for cache invalidation utilities
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateByTags = useCallback(
    async (tags: CacheTag[]) => {
      await invalidateCacheByTags(queryClient, tags);
    },
    [queryClient]
  );

  const invalidateByFunction = useCallback(
    async <Query extends FunctionReference<'query'>>(query: Query) => {
      const functionName = getFunctionName(query);
      await queryClient.invalidateQueries({
        queryKey: [functionName],
      });
    },
    [queryClient]
  );

  const clearAllCache = useCallback(async () => {
    await clearConvexCache(queryClient);
  }, [queryClient]);

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  // Convenience methods for common invalidation patterns
  const invalidateCategories = useCallback(async () => {
    await invalidateCacheByTags(queryClient, [CACHE_TAGS.CATEGORIES]);
  }, [queryClient]);

  const invalidateProducts = useCallback(async () => {
    await invalidateCacheByTags(queryClient, [CACHE_TAGS.PRODUCTS, CACHE_TAGS.SUPPLIER_PRODUCTS]);
  }, [queryClient]);

  const invalidateSuppliers = useCallback(async () => {
    await invalidateCacheByTags(queryClient, [CACHE_TAGS.SUPPLIERS, CACHE_TAGS.SUPPLIER_PROFILE]);
  }, [queryClient]);

  const invalidateUsers = useCallback(async () => {
    await invalidateCacheByTags(queryClient, [CACHE_TAGS.USERS, CACHE_TAGS.USER_PROFILE]);
  }, [queryClient]);

  const invalidateDashboard = useCallback(async () => {
    await invalidateCacheByTags(queryClient, [
      CACHE_TAGS.DASHBOARD_STATS,
      CACHE_TAGS.ADMIN_DASHBOARD,
    ]);
  }, [queryClient]);

  const invalidateNotifications = useCallback(async () => {
    await invalidateCacheByTags(queryClient, [
      CACHE_TAGS.NOTIFICATIONS,
      CACHE_TAGS.NOTIFICATION_COUNT,
    ]);
  }, [queryClient]);

  return {
    invalidateByTags,
    invalidateByFunction,
    clearAllCache,
    invalidateAll,
    invalidateCategories,
    invalidateProducts,
    invalidateSuppliers,
    invalidateUsers,
    invalidateDashboard,
    invalidateNotifications,
  };
}

/**
 * Hook for optimistic updates
 * Allows updating cache before mutation completes
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const setQueryData = useCallback(
    <Query extends FunctionReference<'query'>>(
      query: Query,
      args: Query['_args'],
      updater: (oldData: Query['_returnType'] | undefined) => Query['_returnType']
    ) => {
      const functionName = getFunctionName(query);
      const queryKey = [functionName, args];

      queryClient.setQueryData(queryKey, updater);
    },
    [queryClient]
  );

  const cancelQueries = useCallback(
    async <Query extends FunctionReference<'query'>>(query: Query) => {
      const functionName = getFunctionName(query);
      await queryClient.cancelQueries({
        queryKey: [functionName],
      });
    },
    [queryClient]
  );

  const rollback = useCallback(
    <Query extends FunctionReference<'query'>>(query: Query, args: Query['_args']) => {
      const functionName = getFunctionName(query);
      const queryKey = [functionName, args];
      queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  return {
    setQueryData,
    cancelQueries,
    rollback,
  };
}

/**
 * Hook for background refetching
 * Keeps data fresh by periodically refetching in background
 */
export function useBackgroundRefetch(intervalMs: number = 30000) {
  const queryClient = useQueryClient();

  const startRefetching = useCallback(
    (tags: CacheTag[]) => {
      const intervalId = setInterval(async () => {
        await invalidateCacheByTags(queryClient, tags);
      }, intervalMs);

      return () => clearInterval(intervalId);
    },
    [queryClient, intervalMs]
  );

  return { startRefetching };
}
