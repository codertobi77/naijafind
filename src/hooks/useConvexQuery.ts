import { useQuery, type UseQueryOptions, useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import { getFunctionName } from 'convex/server';
import {
  getQueryCacheTags,
  getMutationInvalidationTags,
  invalidateCacheByTags,
  getStaleTimeForQuery,
  type CacheTag,
} from '../lib/convexCache';

/**
 * Converts BigInt values to strings for JSON serialization in React Query cache keys
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
}

/**
 * Custom hook that wraps Convex queries with React Query caching
 * Includes automatic cache tags and optimized stale times
 */
export function useConvexQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: Query['_args'],
  options?: Omit<UseQueryOptions<Query['_returnType']>, 'queryKey' | 'queryFn'>
) {
  const convex = useConvex();
  const functionName = getFunctionName(query);
  const cacheTags = getQueryCacheTags(query);
  const recommendedStaleTime = getStaleTimeForQuery(functionName);

  return useQuery({
    queryKey: [functionName, serializeBigInt(args)],
    queryFn: async () => {
      const result = await convex.query(query, args);
      return result as Query['_returnType'];
    },
    // Use recommended stale time unless overridden
    staleTime: options?.staleTime ?? recommendedStaleTime,
    // Add cache tags to query meta for invalidation
    meta: {
      ...options?.meta,
      tags: cacheTags,
    },
    ...options,
  });
}

/**
 * Hook for queries that should be skipped conditionally
 * Includes cache tags support
 */
export function useConvexQuerySkippable<Query extends FunctionReference<'query'>>(
  query: Query | 'skip',
  args: Query['_args'] | undefined,
  options?: Omit<UseQueryOptions<Query['_returnType'] | null>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  const convex = useConvex();
  const functionName = query !== 'skip' ? getFunctionName(query) : null;
  const cacheTags = query !== 'skip' ? getQueryCacheTags(query) : [];
  const recommendedStaleTime = functionName ? getStaleTimeForQuery(functionName) : 5 * 60 * 1000;

  return useQuery<Query['_returnType'] | null>({
    queryKey: functionName ? [functionName, serializeBigInt(args)] : ['skip'],
    queryFn: async () => {
      if (query === 'skip' || !args) return null;
      const result = await convex.query(query, args);
      return result as Query['_returnType'];
    },
    enabled: query !== 'skip' && args !== undefined,
    staleTime: options?.staleTime ?? recommendedStaleTime,
    meta: {
      ...options?.meta,
      tags: cacheTags,
    },
    ...options,
  });
}

/**
 * Custom hook that wraps Convex mutations with React Query
 * Provides loading states, error handling, and automatic cache invalidation
 */
export function useConvexMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  options?: Omit<UseMutationOptions<Mutation['_returnType'], Error, Mutation['_args']>, 'mutationKey' | 'mutationFn'>
) {
  const convex = useConvex();
  const queryClient = useQueryClient();
  const functionName = getFunctionName(mutation);
  const invalidationTags = getMutationInvalidationTags(mutation);

  return useMutation({
    mutationKey: [functionName],
    mutationFn: async (args: Mutation['_args']) => {
      const result = await convex.mutation(mutation, args);
      return result as Mutation['_returnType'];
    },
    // Auto-invalidate related queries on success
    onSuccess: async (data, variables, context) => {
      // Invalidate cache by tags
      if (invalidationTags.length > 0) {
        await invalidateCacheByTags(queryClient, invalidationTags);
      }
      // Call user-provided onSuccess if exists
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, {} as any);
      }
    },
    ...options,
  });
}

/**
 * Hook for mutations with custom invalidation logic
 * Allows specifying additional tags to invalidate beyond the automatic ones
 */
export function useConvexMutationWithInvalidation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  additionalTags: CacheTag[],
  options?: Omit<UseMutationOptions<Mutation['_returnType'], Error, Mutation['_args']>, 'mutationKey' | 'mutationFn'>
) {
  const convex = useConvex();
  const queryClient = useQueryClient();
  const functionName = getFunctionName(mutation);
  const baseInvalidationTags = getMutationInvalidationTags(mutation);
  const allTags = [...new Set([...baseInvalidationTags, ...additionalTags])];

  return useMutation({
    mutationKey: [functionName, 'custom'],
    mutationFn: async (args: Mutation['_args']) => {
      const result = await convex.mutation(mutation, args);
      return result as Mutation['_returnType'];
    },
    onSuccess: async (data, variables, context) => {
      if (allTags.length > 0) {
        await invalidateCacheByTags(queryClient, allTags);
      }
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, {} as any);
      }
    },
    ...options,
  });
}
