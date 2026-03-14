import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, MapPin, Star, Package, Store, X, SlidersHorizontal } from 'lucide-react';
import { useNativeProductSearch, useNativeSupplierSearch, useSuppliersByCategory } from '@/lib/search/hooks';

// Types for filters
interface FilterState {
  q?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  verifiedSupplier?: boolean;
}

// Product Card Component
function ProductCard({ product, onClick }: { product: any; onClick?: () => void }) {
  const supplier = product.supplier;
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square bg-gray-100 relative">
        {product.images && product.images[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-12 h-12" />
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
            {product.category}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-green-600">
            {product.price?.toFixed(2)} ₦
          </span>
          {product.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {supplier && (
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
            <Store className="w-3 h-3" />
            {supplier.name}
            {supplier.city && (
              <span className="flex items-center gap-1 ml-2">
                <MapPin className="w-3 h-3" />
                {supplier.city}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Supplier Card Component
function SupplierCard({ supplier }: { supplier: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {supplier.logo ? (
            <img src={supplier.logo} alt={supplier.name} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Store className="w-6 h-6 text-green-600" />
            </div>
          )}
          <div>
            <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
            <p className="text-sm text-gray-600">{supplier.category}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {supplier.verified && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded flex items-center gap-1">
              <i className="ri-shield-check-line"></i> Vérifié
            </span>
          )}
          {supplier.approved && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Approuvé</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        {supplier.city && supplier.country && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {supplier.city}, {supplier.country}
          </span>
        )}
        {supplier.rating && (
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {supplier.rating.toFixed(1)} ({supplier.reviews_count || 0} avis)
          </span>
        )}
        {supplier.productCount !== undefined && (
          <span className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            {supplier.productCount} produits
          </span>
        )}
      </div>
    </div>
  );
}

// Filter Panel Component
function FilterPanel({ 
  filters, 
  onChange, 
  facets,
  onClose 
}: { 
  filters: FilterState; 
  onChange: (filters: FilterState) => void;
  facets?: Record<string, { counts: Array<{ value: string; count: number }> }>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(filters);

  const applyFilters = () => {
    onChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    setLocalFilters({});
    onChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          Filtres
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter */}
      {facets?.category?.counts && facets.category.counts.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {facets.category.counts.map((cat) => (
              <label key={cat.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="radio"
                  name="category"
                  checked={localFilters.category === cat.value}
                  onChange={() => setLocalFilters({ ...localFilters, category: cat.value })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">{cat.value}</span>
                <span className="text-xs text-gray-500">({cat.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.minPrice || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, minPrice: Number(e.target.value) || undefined })}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={localFilters.maxPrice || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: Number(e.target.value) || undefined })}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Country Filter */}
      {facets?.supplierCountry?.counts && facets.supplierCountry.counts.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
          <select
            value={localFilters.country || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, country: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Tous les pays</option>
            {facets.supplierCountry.counts.map((country) => (
              <option key={country.value} value={country.value}>
                {country.value} ({country.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Other Filters */}
      <div className="mb-4 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.verified || false}
            onChange={(e) => setLocalFilters({ ...localFilters, verified: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="text-sm">Fournisseurs vérifiés uniquement</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.inStock || false}
            onChange={(e) => setLocalFilters({ ...localFilters, inStock: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="text-sm">En stock uniquement</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          Appliquer
        </button>
        <button
          onClick={clearFilters}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

// Main Search Page Component
export default function ProductSearchPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Native search hook
  const {
    results: products,
    total,
    isLoading: loading,
    error,
    hasMore,
    filters,
    setFilters,
    search,
    loadMore,
  } = useNativeProductSearch();

  // Get suppliers for selected category
  const { suppliers: categorySuppliers } = useSuppliersByCategory(filters.category, 6);

  // Update search when query changes
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    search({ ...filters, q }, true);
  }, [filters, search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.q) {
        search({ ...filters, q: searchQuery }, true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, search]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    search(newFilters, true);
  };

  const suggestedSuppliers = products
    .map(p => p.supplier)
    .filter(Boolean)
    .filter((s, i, arr) => arr.findIndex(t => t.id === s.id) === i)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('products.search_title', 'Rechercher des produits')}
          </h1>
          
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder', 'Rechercher par nom, catégorie, description...')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filtres</span>
              {Object.keys(filters).length > 0 && (
                <span className="bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.category && (
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  {filters.category}
                  <button 
                    onClick={() => handleFilterChange({ ...filters, category: undefined })}
                    className="hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  {filters.minPrice || 0} - {filters.maxPrice || '∞'} ₦
                  <button 
                    onClick={() => handleFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined })}
                    className="hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.location && (
                <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  {filters.location}
                  <button 
                    onClick={() => handleFilterChange({ ...filters, location: undefined })}
                    className="hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          {showFilters && (
            <aside className="w-72 flex-shrink-0 hidden lg:block">
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                facets={undefined}
                onClose={() => setShowFilters(false)}
              />
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {loading ? (
                  'Recherche en cours...'
                ) : (
                  <>
                    <span className="font-semibold text-green-600">{total.toLocaleString()}</span> produits trouvés
                    {filters.q && <span> pour "{filters.q}"</span>}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700">{error.message}</p>
              </div>
            )}

            {/* Suggested Suppliers */}
            {(suggestedSuppliers.length > 0 || categorySuppliers.length > 0) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-green-600" />
                  Fournisseurs potentiels
                  {filters.category && <span className="text-sm font-normal text-gray-500">- {filters.category}</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(categorySuppliers.length > 0 ? categorySuppliers : suggestedSuppliers)
                    .slice(0, 6)
                    .map((supplier) => (
                      <SupplierCard key={supplier.id} supplier={supplier} />
                    ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {products.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez d'ajuster vos filtres ou votre recherche
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium"
                >
                  Charger plus de produits
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
