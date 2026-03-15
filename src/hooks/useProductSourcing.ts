import { useState, useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

// ==========================================
// TYPES (Imported from backend)
// ==========================================

/**
 * Supplier snapshot in search results
 * Matches the backend SupplierSnapshot interface
 */
export interface SupplierSnapshot {
  id: string;
  name: string;
  rating?: number;
  reviews_count?: number;
  verified: boolean;
  approved: boolean;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  category: string;
  matchScore: number;
  matchConfidence: 'high' | 'medium' | 'low';
}

/**
 * Product search result
 * Matches the backend ProductSearchResult interface
 */
export interface ProductSearchResult {
  _id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  status: string;
  category?: string;
  images?: string[];
  relevanceScore: number;
  suppliers: SupplierSnapshot[];
  totalSuppliers: number;
}

export interface QuoteRequestInput {
  quantity?: number;
  quantityUnit?: string;
  message: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerCountry?: string;
  buyerCompany?: string;
  preferredDeliveryDate?: string;
  budgetRange?: string;
}

export interface UseProductSearchOptions {
  language?: string;
  itemsPerPage?: number;
}

export interface UseProductSearchReturn {
  // State
  results: ProductSearchResult[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;

  // Actions
  search: (params: SearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export interface SearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedSupplier?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'match_score';
}

// ==========================================
// HOOK: Product Search
// ==========================================

export function useProductSearch(
  options: UseProductSearchOptions = {}
): UseProductSearchReturn {
  const { language = 'en', itemsPerPage = 20 } = options;

  const searchAction = useAction(api.productSearch.searchProductsMultilingual);

  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [lastParams, setLastParams] = useState<SearchParams | null>(null);

  const search = useCallback(
    async (params: SearchParams) => {
      setLoading(true);
      setError(null);
      setCurrentOffset(0);
      setLastParams(params);

      try {
        const response = await searchAction({
          q: params.query,
          category: params.category,
          language,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          verifiedSupplier: params.verifiedSupplier,
          sortBy: params.sortBy || 'relevance',
          limit: itemsPerPage,
          offset: 0,
        });

        setResults(response.products as ProductSearchResult[]);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [searchAction, language, itemsPerPage]
  );

  const loadMore = useCallback(async () => {
    if (!lastParams || loading || results.length >= total) return;

    const newOffset = currentOffset + itemsPerPage;
    setLoading(true);

    try {
      const response = await searchAction({
        q: lastParams.query,
        category: lastParams.category,
        language,
        minPrice: lastParams.minPrice,
        maxPrice: lastParams.maxPrice,
        verifiedSupplier: lastParams.verifiedSupplier,
        sortBy: lastParams.sortBy || 'relevance',
        limit: itemsPerPage,
        offset: newOffset,
      });

      setResults((prev) => [...prev, ...(response.products as ProductSearchResult[])]);
      setCurrentOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more results');
    } finally {
      setLoading(false);
    }
  }, [lastParams, loading, results.length, total, currentOffset, itemsPerPage, language, searchAction]);

  const reset = useCallback(() => {
    setResults([]);
    setTotal(0);
    setError(null);
    setCurrentOffset(0);
    setLastParams(null);
  }, []);

  return {
    results,
    total,
    loading,
    error,
    hasMore: results.length < total,
    search,
    loadMore,
    reset,
  };
}

// ==========================================
// HOOK: Quote Request (RFQ)
// ==========================================

export interface UseQuoteRequestReturn {
  submitting: boolean;
  success: boolean;
  error: string | null;
  submitQuoteRequest: (
    productId: Id<'products'>,
    supplierIds: Id<'suppliers'>[],
    data: QuoteRequestInput
  ) => Promise<boolean>;
  reset: () => void;
}

export function useQuoteRequest(): UseQuoteRequestReturn {
  const createMutation = useMutation(api.quoteRequests.createQuoteRequest);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuoteRequest = useCallback(
    async (
      productId: Id<'products'>,
      supplierIds: Id<'suppliers'>[],
      data: QuoteRequestInput
    ): Promise<boolean> => {
      if (supplierIds.length === 0) {
        setError('Please select at least one supplier');
        return false;
      }

      if (!data.buyerName.trim()) {
        setError('Please enter your name');
        return false;
      }

      if (!data.buyerEmail.trim() || !data.buyerEmail.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }

      if (!data.message.trim()) {
        setError('Please enter a message');
        return false;
      }

      setSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        await createMutation({
          productId,
          supplierIds,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          message: data.message.trim(),
          buyerName: data.buyerName.trim(),
          buyerEmail: data.buyerEmail.trim().toLowerCase(),
          buyerPhone: data.buyerPhone?.trim(),
          buyerCountry: data.buyerCountry?.trim(),
          buyerCompany: data.buyerCompany?.trim(),
          preferredDeliveryDate: data.preferredDeliveryDate,
          budgetRange: data.budgetRange,
        });

        setSuccess(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit quote request');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [createMutation]
  );

  const reset = useCallback(() => {
    setSubmitting(false);
    setSuccess(false);
    setError(null);
  }, []);

  return {
    submitting,
    success,
    error,
    submitQuoteRequest,
    reset,
  };
}

// ==========================================
// HOOK: Product Suppliers
// ==========================================

export interface UseProductSuppliersReturn {
  suppliers: SupplierSnapshot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProductSuppliers(
  productId: Id<'products'> | null,
  limit: number = 5
): UseProductSuppliersReturn {
  const { data, isLoading, error, refetch } = useConvexQuery(
    api.productSearch.getProductSuppliers,
    productId ? { productId, limit } : 'skip',
    { staleTime: 5 * 60 * 1000 }
  );

  // Import the hook dynamically to avoid circular dependencies
  const { useConvexQuery: useActualConvexQuery } = require('../hooks/useConvexQuery');

  const actualQuery = useActualConvexQuery(
    api.productSearch.getProductSuppliers,
    productId ? { productId, limit } : 'skip',
    { staleTime: 5 * 60 * 1000 }
  );

  return {
    suppliers: (actualQuery.data?.suppliers as SupplierSnapshot[]) || [],
    loading: actualQuery.isLoading,
    error: actualQuery.error?.message || null,
    refetch: actualQuery.refetch,
  };
}

// ==========================================
// HOOK: Product Translation
// ==========================================

export interface UseProductTranslationReturn {
  translating: boolean;
  translate: (productId: Id<'products'>, targetLang: string) => Promise<boolean>;
}

export function useProductTranslation(): UseProductTranslationReturn {
  const translateAction = useAction(api.productTranslation.translateProduct);

  const [translating, setTranslating] = useState(false);

  const translate = useCallback(
    async (productId: Id<'products'>, targetLang: string): Promise<boolean> => {
      setTranslating(true);
      try {
        const result = await translateAction({
          productId,
          targetLang,
        });
        return result.success;
      } catch (err) {
        console.error('Translation error:', err);
        return false;
      } finally {
        setTranslating(false);
      }
    },
    [translateAction]
  );

  return {
    translating,
    translate,
  };
}

// ==========================================
// UTILITY: Get localized product name
// ==========================================

export function getLocalizedProductName(
  product: ProductSearchResult,
  translations: Record<string, { name?: string }>,
  language: string
): string {
  // Check for translation in provided translations object
  const translation = translations[product._id];
  if (translation?.name) {
    return translation.name;
  }

  // Return original name
  return product.name;
}

// ==========================================
// UTILITY: Format match confidence badge
// ==========================================

export function getConfidenceBadgeProps(
  confidence: 'high' | 'medium' | 'low'
): {
  color: 'green' | 'yellow' | 'gray';
  labelKey: string;
} {
  switch (confidence) {
    case 'high':
      return { color: 'green', labelKey: 'match.confidence.high' };
    case 'medium':
      return { color: 'yellow', labelKey: 'match.confidence.medium' };
    case 'low':
      return { color: 'gray', labelKey: 'match.confidence.low' };
    default:
      return { color: 'gray', labelKey: 'match.confidence.unknown' };
  }
}
