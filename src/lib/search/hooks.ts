import { useState, useCallback, useEffect, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

// ==========================================
// NATIVE SEARCH HOOKS (No Typesense)
// ==========================================

export interface ProductSearchFilters {
  q?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  verifiedSupplier?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

export interface SupplierSearchFilters {
  q?: string;
  category?: string;
  location?: string;
  verified?: boolean;
  featured?: boolean;
  minRating?: number;
  businessType?: 'products' | 'services';
  sortBy?: 'relevance' | 'rating' | 'reviews' | 'newest' | 'name_asc';
}

interface SearchState<T> {
  results: T[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
}

// ==========================================
// PRODUCT SEARCH HOOK
// ==========================================

export function useNativeProductSearch(initialFilters?: ProductSearchFilters) {
  const [filters, setFilters] = useState<ProductSearchFilters>(initialFilters || {});
  const [state, setState] = useState<SearchState<any>>({
    results: [],
    total: 0,
    hasMore: false,
    isLoading: false,
    error: null,
  });
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const searchAction = useAction(api.searchNative.searchProductsNative);
  const mounted = useRef(false);

  const search = useCallback(async (newFilters?: ProductSearchFilters, resetOffset = true) => {
    const currentFilters = newFilters || filters;
    if (newFilters) setFilters(currentFilters);

    const newOffset = resetOffset ? 0 : offset;
    if (resetOffset) setOffset(0);

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await searchAction({
        ...currentFilters,
        limit,
        offset: newOffset,
      });

      setState(prev => ({
        results: resetOffset ? response.products : [...prev.results, ...response.products],
        total: response.total,
        hasMore: response.hasMore,
        isLoading: false,
        error: null,
      }));

      if (!resetOffset) {
        setOffset(newOffset + limit);
      }

      return response;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
      throw error;
    }
  }, [filters, offset, searchAction]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;
    await search(filters, false);
  }, [filters, state.hasMore, state.isLoading, search]);

  // Initial search - run once on mount
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      search(initialFilters || {}, true);
    }
  }, []);

  return {
    ...state,
    filters,
    setFilters,
    search,
    loadMore,
    refresh: () => search(filters, true),
  };
}

// ==========================================
// SUPPLIER SEARCH HOOK
// ==========================================

export function useNativeSupplierSearch(initialFilters?: SupplierSearchFilters) {
  const [filters, setFilters] = useState<SupplierSearchFilters>(initialFilters || {});
  const [state, setState] = useState<SearchState<any>>({
    results: [],
    total: 0,
    hasMore: false,
    isLoading: false,
    error: null,
  });
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const searchAction = useAction(api.searchNative.searchSuppliersNative);
  const mounted = useRef(false);

  const search = useCallback(async (newFilters?: SupplierSearchFilters, resetOffset = true) => {
    const currentFilters = newFilters || filters;
    if (newFilters) setFilters(currentFilters);

    const newOffset = resetOffset ? 0 : offset;
    if (resetOffset) setOffset(0);

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await searchAction({
        ...currentFilters,
        limit,
        offset: newOffset,
      });

      setState(prev => ({
        results: resetOffset ? response.suppliers : [...prev.results, ...response.suppliers],
        total: response.total,
        hasMore: response.hasMore,
        isLoading: false,
        error: null,
      }));

      if (!resetOffset) {
        setOffset(newOffset + limit);
      }

      return response;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
      throw error;
    }
  }, [filters, offset, searchAction]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;
    await search(filters, false);
  }, [filters, state.hasMore, state.isLoading, search]);

  // Initial search - run once on mount
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      search(initialFilters || {}, true);
    }
  }, []);

  return {
    ...state,
    filters,
    setFilters,
    search,
    loadMore,
    refresh: () => search(filters, true),
  };
}

// ==========================================
// COMBINED SEARCH HOOK
// ==========================================

interface CombinedSearchResult {
  products: any[];
  suppliers: any[];
  productTotal: number;
  supplierTotal: number;
  total: number;
}

export function useNativeCombinedSearch() {
  const [results, setResults] = useState<CombinedSearchResult>({
    products: [],
    suppliers: [],
    productTotal: 0,
    supplierTotal: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchAction = useAction(api.searchNative.combinedSearch);

  const search = useCallback(async (query: string, options?: {
    category?: string;
    location?: string;
    limit?: number;
  }) => {
    if (!query.trim()) {
      setResults({ products: [], suppliers: [], productTotal: 0, supplierTotal: 0, total: 0 });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await searchAction({
        q: query,
        category: options?.category,
        location: options?.location,
        limit: options?.limit || 10,
      });

      setResults(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [searchAction]);

  return {
    ...results,
    isLoading,
    error,
    search,
  };
}

// ==========================================
// SEARCH SUGGESTIONS HOOK
// ==========================================

export function useNativeSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<{ text: string; type: string; icon?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const suggestionsAction = useAction(api.searchNative.getSearchSuggestions);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getSuggestions = useCallback(async (
    query: string,
    type?: 'products' | 'suppliers' | 'all'
  ) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await suggestionsAction({
        q: query,
        type: type || 'all',
        limit: 8,
      });

      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [suggestionsAction]);

  const debouncedGetSuggestions = useCallback((
    query: string,
    type?: 'products' | 'suppliers' | 'all',
    delay = 200
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      getSuggestions(query, type);
    }, delay);
  }, [getSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    getSuggestions: debouncedGetSuggestions,
    clearSuggestions: () => setSuggestions([]),
  };
}

// ==========================================
// SUPPLIERS BY CATEGORY HOOK
// ==========================================

export function useSuppliersByCategory(category?: string, limit = 10) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchAction = useAction(api.searchNative.searchSuppliersNative);

  useEffect(() => {
    if (!category) {
      setSuppliers([]);
      return;
    }

    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        const response = await searchAction({
          category,
          limit,
          sortBy: 'rating',
        });
        setSuppliers(response.suppliers);
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [category, limit, searchAction]);

  return { suppliers, isLoading };
}
