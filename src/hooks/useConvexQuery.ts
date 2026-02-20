import { useQuery, type UseQueryOptions, useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import { getFunctionName } from 'convex/server';

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
 * This reduces unnecessary Convex API calls and improves performance
 */
export function useConvexQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: Query['_args'],
  options?: Omit<UseQueryOptions<Query['_returnType']>, 'queryKey' | 'queryFn'>
) {
  const convex = useConvex();
  const functionName = getFunctionName(query);

  return useQuery({
    queryKey: [functionName, serializeBigInt(args)],
    queryFn: async () => {
      const result = await convex.query(query, args);
      return result as Query['_returnType'];
    },
    ...options,
  });
}

/**
 * Hook for queries that should be skipped conditionally
 */
export function useConvexQuerySkippable<Query extends FunctionReference<'query'>>(
  query: Query | 'skip',
  args: Query['_args'] | undefined,
  options?: Omit<UseQueryOptions<Query['_returnType'] | null>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  const convex = useConvex();
  const functionName = query !== 'skip' ? getFunctionName(query) : null;

  return useQuery<Query['_returnType'] | null>({
    queryKey: functionName ? [functionName, serializeBigInt(args)] : ['skip'],
    queryFn: async () => {
      if (query === 'skip' || !args) return null;
      const result = await convex.query(query, args);
      return result as Query['_returnType'];
    },
    enabled: query !== 'skip' && args !== undefined,
    ...options,
  });
}

/**
 * Custom hook that wraps Convex mutations with React Query
 * Provides loading states and error handling for mutations
 */
export function useConvexMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  options?: Omit<UseMutationOptions<Mutation['_returnType'], Error, Mutation['_args']>, 'mutationKey' | 'mutationFn'>
) {
  const convex = useConvex();
  const functionName = getFunctionName(mutation);

  return useMutation({
    mutationKey: [functionName],
    mutationFn: async (args: Mutation['_args']) => {
      const result = await convex.mutation(mutation, args);
      return result as Mutation['_returnType'];
    },
    ...options,
  });
}
