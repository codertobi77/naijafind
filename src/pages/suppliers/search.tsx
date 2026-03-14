import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, MapPin, Star, Store, X, Phone, Globe, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNativeSupplierSearch } from '@/lib/search/hooks';
import { Header } from '@/components/base';

// Types for filters
interface FilterState {
  q?: string;
  category?: string;
  location?: string;
  verified?: boolean;
  featured?: boolean;
  minRating?: number;
  businessType?: 'products' | 'services';
}

// Supplier Card Component
function SupplierCard({ supplier, viewMode }: { supplier: any; viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex gap-4">
        <div className="w-24 h-24 flex-shrink-0">
          {supplier.logo_url ? (
            <img 
              src={supplier.logo_url} 
              alt={supplier.business_name}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-green-100 flex items-center justify-center">
              <Store className="w-10 h-10 text-green-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{supplier.business_name}</h3>
              <p className="text-sm text-gray-600 mt-1">{supplier.category}</p>
            </div>
            <div className="flex gap-1">
              {supplier.verified && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                  <i className="ri-shield-check-line"></i> Vérifié
                </span>
              )}
              {supplier.featured && (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">⭐ Premium</span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{supplier.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            {supplier.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {supplier.city}{supplier.state && `, ${supplier.state}`}
              </span>
            )}
            {supplier.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {supplier.rating.toFixed(1)} ({supplier.reviews_count || 0} avis)
              </span>
            )}
            {supplier.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {supplier.phone}
              </span>
            )}
          </div>
        </div>
        <Link 
          to={`/supplier/${supplier._id}`}
          className="flex items-center text-green-600 hover:text-green-700 self-center"
        >
          <ChevronRight className="w-6 h-6" />
        </Link>
      </div>
    );
  }

  return (
    <Link 
      to={`/supplier/${supplier._id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="h-32 bg-gray-100 relative">
        {supplier.image ? (
          <img 
            src={supplier.image} 
            alt={supplier.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {supplier.verified && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <i className="ri-shield-check-line"></i>
            </span>
          )}
          {supplier.featured && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">⭐</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{supplier.business_name}</h3>
        <p className="text-sm text-gray-600 mt-1">{supplier.category}</p>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          {supplier.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {supplier.city}
            </span>
          )}
          {supplier.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {supplier.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Filter Panel Component
function FilterPanel({ 
  filters, 
  onChange, 
  onClose 
}: { 
  filters: FilterState; 
  onChange: (filters: FilterState) => void;
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
          <Filter className="w-5 h-5" />
          Filtres
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Location Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
        <input
          type="text"
          placeholder="Ville ou état"
          value={localFilters.location || ''}
          onChange={(e) => setLocalFilters({ ...localFilters, location: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* Rating Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Note minimale</label>
        <div className="flex gap-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setLocalFilters({ ...localFilters, minRating: rating })}
              className={`px-3 py-1 rounded text-sm ${
                localFilters.minRating === rating 
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300' 
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {rating}+ <Star className="w-3 h-3 inline" />
            </button>
          ))}
        </div>
      </div>

      {/* Verification Filter */}
      <div className="mb-4 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.verified || false}
            onChange={(e) => setLocalFilters({ ...localFilters, verified: e.target.checked })}
            className="rounded text-green-600"
          />
          <span className="text-sm">Fournisseurs vérifiés uniquement</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.featured || false}
            onChange={(e) => setLocalFilters({ ...localFilters, featured: e.target.checked })}
            className="rounded text-yellow-600"
          />
          <span className="text-sm">Fournisseurs premium uniquement</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
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
export default function SupplierSearchPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Native search hook
  const {
    results: suppliers,
    total,
    isLoading: loading,
    error,
    hasMore,
    filters,
    setFilters,
    search,
    loadMore,
  } = useNativeSupplierSearch();

  // Update search when query changes
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('search.suppliers_title', 'Rechercher des fournisseurs')}
          </h1>
          
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.supplier_placeholder', 'Rechercher par nom, catégorie, ville...')}
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
              {filters.location && (
                <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {filters.location}
                  <button 
                    onClick={() => handleFilterChange({ ...filters, location: undefined })}
                    className="hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.verified && (
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <i className="ri-shield-check-line"></i> Vérifiés
                  <button 
                    onClick={() => handleFilterChange({ ...filters, verified: false })}
                    className="hover:text-blue-600"
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
                    <span className="font-semibold text-green-600">{total.toLocaleString()}</span> fournisseurs trouvés
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

            {/* Suppliers Grid/List */}
            {suppliers.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun fournisseur trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez d'ajuster vos filtres ou votre recherche
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                : 'space-y-4'
              }>
                {suppliers.map((supplier) => (
                  <SupplierCard 
                    key={supplier._id} 
                    supplier={supplier} 
                    viewMode={viewMode}
                  />
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
                  Charger plus de fournisseurs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
