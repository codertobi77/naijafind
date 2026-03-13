import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Header } from '../../components/base';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { useMultilingualSearch } from '../../hooks/useMultilingualSearch';
import { useMutation } from 'convex/react';

const ITEMS_PER_PAGE = 20;

interface SupplierSnapshot {
  id: string;
  name: string;
  rating?: number;
  reviews_count?: number;
  verified?: boolean;
  location?: string;
  city?: string;
  state?: string;
  category?: string;
}

interface ProductResult {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  status?: string;
  category?: string;
  images?: string[];
  supplierId?: string;
  supplier?: SupplierSnapshot | null;
  suppliers?: SupplierSnapshot[];
  potentialSuppliers?: SupplierSnapshot[];
  relevanceScore?: number;
}

// Helper with timeout to protect UI
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

export default function ProductSearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [filters, setFilters] = useState({
    query: initialQuery,
    category: initialCategory,
    minPrice: '',
    maxPrice: '',
    verifiedSupplier: false,
  });

  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'newest'>(
    'relevance'
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ products: ProductResult[]; total: number }>({
    products: [],
    total: 0,
  });
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const searchProducts = useAction(api.productSearch.searchProductsMultilingual);
  const { translateQuery, isTranslating } = useMultilingualSearch();
  const createSupplierRequestMutation = useMutation(api.suppliers.createSupplierRequest);

  // Categories for filters
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategories,
    {},
    { staleTime: 15 * 60 * 1000 }
  );

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    setSearchParams(params, { replace: true });
    setCurrentPage(0);
  }, [filters.query, filters.category, setSearchParams]);

  // Perform search whenever filters / sort / page change
  useEffect(() => {
    const runSearch = async () => {
      setLoading(true);
      setError(null);
      setTranslatedQuery(null);

      try {
        let searchQuery = filters.query.trim();
        if (searchQuery) {
          const translationResult = await translateQuery(searchQuery, {
            skipIfEnglish: true,
            detectSourceLang: true,
          });
          if (translationResult.wasTranslated) {
            searchQuery = translationResult.translatedQuery;
            setTranslatedQuery(filters.query.trim());
          }
        }

        const result = await withTimeout(
          searchProducts({
            q: searchQuery || undefined,
            category: filters.category || undefined,
            language: 'en', // TODO: Get from i18n
            minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
            verifiedSupplier: filters.verifiedSupplier || undefined,
            limit: BigInt(ITEMS_PER_PAGE),
            offset: BigInt(currentPage * ITEMS_PER_PAGE),
            sortBy,
          }),
          30000,
          t('search.timeout_error')
        );

        setResults({
          products: (result as any).products || [],
          total: Number((result as any).total || 0),
        });
      } catch (err) {
        console.error('Product search error:', err);
        setError(
          err instanceof Error ? err.message : t('search.error_generic') || 'Erreur de recherche'
        );
      } finally {
        setLoading(false);
      }
    };

    void runSearch();
  }, [filters, sortBy, currentPage, searchProducts, translateQuery, t]);

  const totalPages = Math.max(1, Math.ceil(results.total / ITEMS_PER_PAGE));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Filters */}
          <aside className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 border border-gray-100 sticky top-24">
              <h2 className="font-bold text-base sm:text-lg mb-4 flex items-center">
                <i className="ri-filter-3-line mr-2 text-green-600" />
                {t('search.filters')}
              </h2>

              {/* Query */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('search.title')}
                </label>
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                  }
                  placeholder={t('search.placeholder')}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
                />
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filter.category')}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
                >
                  <option value="">{t('filter.all_categories')}</option>
                  {categories?.map((cat: any) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price range */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filter.price_range')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                    }
                    placeholder={t('filter.min')}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min={0}
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                    }
                    placeholder={t('filter.max')}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Verified suppliers only */}
              <div className="mb-5">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={filters.verifiedSupplier}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        verifiedSupplier: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>{t('filter.verified_only')}</span>
                </label>
              </div>

              <button
                onClick={() =>
                  setFilters({
                    query: '',
                    category: '',
                    minPrice: '',
                    maxPrice: '',
                    verifiedSupplier: false,
                  })
                }
                className="w-full text-green-600 hover:text-green-700 text-sm font-medium"
              >
                {t('filter.reset')}
              </button>
            </div>
          </aside>

          {/* Results */}
          <section className="lg:w-3/4">
            <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {t('products.results_title')}
                  </h1>
                  <p className="text-sm text-gray-600 flex items-center flex-wrap gap-2">
                    {loading || isTranslating ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-1" />
                        {isTranslating
                          ? t('search.translating') || 'Traduction...'
                          : t('search.loading')}
                      </>
                    ) : (
                      <>
                        <i className="ri-checkbox-circle-line text-green-600 mr-1" />
                        {results.total} {t('products.label')}
                      </>
                    )}
                    {translatedQuery && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <i className="ri-translate-2 mr-1" />
                        {t('search.translated_from')}: "{translatedQuery}"
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as typeof sortBy)
                    }
                    className="w-full sm:w-auto px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm outline-none"
                  >
                    <option value="relevance">
                      {t('search.sort.relevance')}
                    </option>
                    <option value="price_asc">
                      {t('products.sort.price_asc')}
                    </option>
                    <option value="price_desc">
                      {t('products.sort.price_desc')}
                    </option>
                    <option value="newest">
                      {t('products.sort.newest')}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-700 flex items-center gap-2">
                <i className="ri-error-warning-line" />
                <span>{error}</span>
              </div>
            )}

            {/* List */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-soft p-4 sm:p-5 border border-gray-100 animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft p-10 border border-gray-100 text-center">
                <i className="ri-search-line text-4xl text-gray-300 mb-3" />
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {t('products.no_results_title')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('products.no_results_subtitle')}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {results.products.map((product) => {
                    const potentialSuppliers: SupplierSnapshot[] =
                      (product as any).suppliers || (product as any).potentialSuppliers || [];
                    const image =
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : `https://readdy.ai/api/search-image?query=${encodeURIComponent(
                            `${product.name} ${product.category || ''} product`
                          )}&width=320&height=240&seq=product-${product._id}&orientation=landscape`;

                    return (
                      <article
                        key={product._id}
                        className="bg-white rounded-2xl shadow-soft hover:shadow-medium border border-gray-100 transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="p-4 sm:p-5 flex gap-4 sm:gap-6">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                            <img
                              src={image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                  {product.name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {product.category && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                      <i className="ri-price-tag-3-line mr-1" />
                                      {product.category}
                                    </span>
                                  )}
                                  {product.status === 'active' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      <i className="ri-check-line mr-1" />
                                      {t('status.active')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {product.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {product.description}
                              </p>
                            )}

                            {potentialSuppliers.length > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 mb-1">
                                  <i className="ri-store-2-line text-green-600" />
                                  <span className="font-semibold">
                                    {t('products.potential_suppliers_title')}
                                  </span>
                                  <span className="text-gray-400">
                                    {t('products.potential_suppliers_count', {
                                      count: potentialSuppliers.length,
                                    })}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {potentialSuppliers.slice(0, 3).map((s) => (
                                    <Link
                                      key={s.id}
                                      to={`/supplier/${s.id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-[11px] sm:text-xs text-green-800 border border-green-100 hover:bg-green-100"
                                    >
                                      <span className="truncate max-w-[120px]">
                                        {s.name}
                                      </span>
                                      {s.verified && (
                                        <i className="ri-verified-badge-fill ml-1 text-[10px]" />
                                      )}
                                    </Link>
                                  ))}
                                  {potentialSuppliers.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      {t('products.more_suppliers', {
                                        count: potentialSuppliers.length - 3,
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                {product.relevanceScore !== undefined && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                                    <i className="ri-magic-line mr-1 text-purple-500" />
                                    {t('search.relevance')}:{' '}
                                    {product.relevanceScore}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                              >
                                {t('search.view_details')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-2 py-1 rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="ri-arrow-left-line" />
                      </button>
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(index)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            currentPage === index
                              ? 'bg-green-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={currentPage >= totalPages - 1}
                        className="px-2 py-1 rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="ri-arrow-right-line" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => {
            setSelectedProduct(null);
            setShowRequestForm(false);
            setRequestMessage('');
          }}
          onRequestSupplier={() => setShowRequestForm(true)}
          showRequestForm={showRequestForm}
          requestMessage={requestMessage}
          setRequestMessage={setRequestMessage}
          requestSubmitting={requestSubmitting}
          onRequestSubmit={async () => {
            if (!requestMessage.trim()) return;
            setRequestSubmitting(true);
            try {
              await createSupplierRequestMutation({
                productName: selectedProduct.name,
                productCategory: selectedProduct.category,
                message: requestMessage,
              });
              alert(t('products.request_sent'));
              setShowRequestForm(false);
              setRequestMessage('');
            } catch (error) {
              console.error('Error submitting request:', error);
              alert(t('products.request_error'));
            } finally {
              setRequestSubmitting(false);
            }
          }}
        />
      )}
    </div>
  );
}

// Product Details Modal Component
function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onRequestSupplier,
  showRequestForm,
  requestMessage,
  setRequestMessage,
  requestSubmitting,
  onRequestSubmit,
}: {
  product: ProductResult;
  isOpen: boolean;
  onClose: () => void;
  onRequestSupplier: () => void;
  showRequestForm: boolean;
  requestMessage: string;
  setRequestMessage: (msg: string) => void;
  requestSubmitting: boolean;
  onRequestSubmit: () => void;
}) {
  const { t } = useTranslation();

  const potentialSuppliers: SupplierSnapshot[] =
    (product as any).suppliers || (product as any).potentialSuppliers || [];
  const image =
    product.images && product.images.length > 0
      ? product.images[0]
      : `https://readdy.ai/api/search-image?query=${encodeURIComponent(
          `${product.name} ${product.category || ''} product`
        )}&width=640&height=480&seq=product-${product._id}&orientation=landscape`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('products.details_title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl" />
            </button>
          </div>

          {/* Product Image */}
          <div className="mb-6">
            <img
              src={image}
              alt={product.name}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
            {product.category && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                <i className="ri-price-tag-3-line mr-2" />
                {product.category}
              </div>
            )}
            {product.description && (
              <p className="text-gray-600">{product.description}</p>
            )}
          </div>

          {/* Potential Suppliers Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="ri-store-2-line mr-2 text-green-600" />
                {t('products.potential_suppliers_title')}
              </h3>
              <span className="text-sm text-gray-500">
                {potentialSuppliers.length} {t('products.suppliers_found')}
              </span>
            </div>

            {potentialSuppliers.length > 0 ? (
              <div className="space-y-3 mb-4">
                {potentialSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{supplier.name}</h4>
                        {supplier.verified && (
                          <i className="ri-verified-badge-fill text-green-600" />
                        )}
                      </div>
                      {supplier.category && (
                        <p className="text-sm text-gray-600">{supplier.category}</p>
                      )}
                      {supplier.location && (
                        <p className="text-xs text-gray-500 flex items-center">
                          <i className="ri-map-pin-line mr-1" />
                          {supplier.location}
                        </p>
                      )}
                      {supplier.rating !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          <i className="ri-star-fill text-yellow-500 text-sm" />
                          <span className="text-sm font-medium">{supplier.rating}</span>
                          {supplier.reviews_count !== undefined && (
                            <span className="text-xs text-gray-500">
                              ({supplier.reviews_count} {t('supplier.reviews')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/supplier/${supplier.id}`}
                      onClick={onClose}
                      className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                    >
                      {t('search.view_details')}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <i className="ri-information-line mr-2" />
                  {t('products.no_suppliers_found')}
                </p>
              </div>
            )}

            {/* Request Supplier Search Button */}
            {!showRequestForm && (
              <button
                onClick={onRequestSupplier}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-soft hover:shadow-medium flex items-center justify-center gap-2 group"
              >
                <i className="ri-search-eye-line text-xl group-hover:scale-110 transition-transform" />
                {t('products.request_supplier_search')}
              </button>
            )}

            {/* Request Form */}
            {showRequestForm && (
              <div className="mt-4 bg-gray-50 rounded-2xl p-6 border-2 border-green-100 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <i className="ri-edit-line text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">
                    {t('products.request_supplier_form_title')}
                  </h4>
                </div>
                
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder={t('products.request_supplier_placeholder')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none outline-none transition-all min-h-[120px]"
                  rows={4}
                />
                
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={onRequestSubmit}
                    disabled={requestSubmitting || !requestMessage.trim()}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-soft"
                  >
                    {requestSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2" />
                        {t('products.sending')}
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-fill mr-2" />
                        {t('products.send_request')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRequestForm(false);
                      setRequestMessage('');
                    }}
                    className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                  >
                    {t('products.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


