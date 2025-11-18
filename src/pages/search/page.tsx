
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../../convex/_generated/api';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';
import { useConvexQuery } from '../../hooks/useConvexQuery';

interface Supplier {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  review_count: number;
  distance?: number;
  verified: boolean;
  image_url: string;
  description: string;
  phone: string;
  email: string;
}

export default function Search() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  // Using React Query for caching
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    query: searchParams.get('q') || '',
    distance: '50',
    rating: '',
    verified: false
  });
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const cityOptions = Array.from(new Set(suppliers.map(s => s.location.split(',')[0].trim())));
  const citySuggestions = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt']; // mock pop
  const handleScrollToResults = () => {
    setTimeout(()=>{
      document.getElementById('resultSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  const queryArgs = {
    q: filters.query || undefined,
    category: filters.category || undefined,
    location: filters.location || undefined,
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    radiusKm: Number(filters.distance || '50'),
    minRating: filters.rating ? Number(filters.rating) : undefined,
    verified: filters.verified || undefined,
    limit: BigInt(itemsPerPage),
    offset: BigInt(currentPage * itemsPerPage),
    sortBy: sortBy as 'relevance' | 'distance' | 'rating' | 'reviews' | undefined,
  } as const;
  
  // Use React Query with shorter cache time for search results (1 minute)
  const { data: convexResult, isLoading: queryLoading } = useConvexQuery(
    api.suppliers.searchSuppliers,
    queryArgs,
    { 
      staleTime: 1 * 60 * 1000, // 1 minute - search results should be relatively fresh
      gcTime: 3 * 60 * 1000 // Keep in cache for 3 minutes
    }
  );

  useEffect(() => {
    setLoading(queryLoading);
    if (!convexResult) return;
    const list = (convexResult.suppliers || []).map((s: any) => ({
      id: (s._id ?? s.id) as string,
      name: s.business_name ?? s.name ?? '',
      category: s.category ?? '',
      location: s.location ?? [s.city, s.state].filter(Boolean).join(', '),
      rating: s.rating ?? 0,
      review_count: s.reviews_count ?? 0,
      distance: (s as any).distance,
      verified: !!s.verified,
      image_url: s.image ?? s.image_url ?? s.logo_url ?? '',
      description: s.description ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
    })) as Supplier[];
    setSuppliers(list);
    setTotalCount(convexResult.total ?? list.length);
  }, [convexResult, queryLoading]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when filters change
  }, [filters, sortBy]);

  // Cache categories with longer stale time
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategories,
    {},
    { staleTime: 15 * 60 * 1000 } // 15 minutes
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center group">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <i className="ri-compass-3-fill text-white text-xl"></i>
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" style={{ fontFamily: "Pacifico, serif" }}>
                  NaijaFind
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-1">
              <Link to="/" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.home')}</Link>
              <Link to="/search" className="px-4 py-2 rounded-lg text-green-600 bg-green-50 font-medium transition-all">{t('nav.search')}</Link>
              <Link to="/categories" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.categories')}</Link>
              <Link to="/about" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.about')}</Link>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LanguageSelector />
              <SignedOut>
                <Link to="/auth/login" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium whitespace-nowrap text-sm sm:text-base transform hover:-translate-y-0.5">
                  {t('nav.login')}
                </Link>
                <Link to="/auth/register" className="border-2 border-green-600 text-green-600 px-4 sm:px-6 py-2.5 rounded-xl hover:bg-green-50 hover:border-green-700 transition-all duration-300 font-medium whitespace-nowrap text-sm sm:text-base hidden sm:block">
                  {t('nav.register')}
                </Link>
              </SignedOut>
              <SignedIn>
                {meData?.user?.user_type === 'supplier' && (
                  <Link 
                    to="/dashboard"
                    className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-lg transition-colors hidden sm:block"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" id="resultSection">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Filtres */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-24 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center">
                  <i className="ri-filter-3-line mr-2 text-green-600"></i>
                  Filtres
                </h3>
                <button 
                  onClick={() => setFilters({category: '', location: '', query: '', distance: '50', rating: '', verified: false})}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Réinitialiser
                </button>
              </div>
              {/* Recherche */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="ri-search-line mr-1"></i>
                  Recherche
                </label>
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => setFilters({...filters, query: e.target.value})}
                  placeholder="Nom ou description..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none"
                />
                {!filters.query && (
                  <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-2">
                    Suggestions :
                    {citySuggestions.map(c => (
                      <button key={c} className="underline text-green-700 hover:text-green-900 px-2"
                        onClick={()=>setFilters({...filters, query: c})}>{c}</button>
                    ))}
                    {categories && categories.slice(0,2).map(cat => (
                      <button key={cat._id} className="underline text-blue-700 hover:text-blue-900 px-2"
                        onClick={()=>setFilters({...filters, category: cat.name})}>{cat.name}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ville/état combo */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="ri-map-pin-line mr-1"></i>
                  Ville principale
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm pr-10 outline-none"
                >
                  <option value="">Toutes villes</option>
                  {cityOptions.filter(Boolean).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  {cityOptions.length === 0 && citySuggestions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-600 mt-1">Filtrez par ville</div>
              </div>

              {/* Catégorie */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="ri-list-check mr-1"></i>
                  Catégorie
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm pr-10 outline-none"
                >
                  <option value="">Toutes catégories</option>
                  {categories?.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-600 mt-1">Filtrez par catégorie</div>
              </div>

              {/* Distance */}
              <div className="mb-6">
                <label className="block text sm font-medium text-gray-700 mb-2">
                  Distance maximale
                </label>
                <select
                  value={filters.distance}
                  onChange={(e) => setFilters({...filters, distance: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">Filtrez par distance</div>
              </div>

              {/* Note minimale */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note minimale
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({...filters, rating: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="">Toutes notes</option>
                  <option value="4">4+ étoiles</option>
                  <option value="4.5">4.5+ étoiles</option>
                  <option value="4.8">4.8+ étoiles</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">Filtrez par note</div>
              </div>

              {/* Vérifié */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => setFilters({...filters, verified: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Entreprises vérifiées uniquement</span>
                </label>
              </div>

              <button 
                onClick={() => setFilters({category: '', location: '', query: '', distance: '50', rating: '', verified: false})}
                className="w-full text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:w-3/4">
            {/* En-tête des résultats */}
            <div className="bg-white rounded-2xl shadow-soft p-6 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Résultats de recherche
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base flex items-center">
                    {loading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Recherche en cours...
                      </>
                    ) : (
                      <>
                        <i className="ri-checkbox-circle-line text-green-600 mr-2"></i>
                        {suppliers.length} fournisseurs trouvés
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex bg-gray-100 rounded-xl p-1.5 shadow-sm">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'list' 
                          ? 'bg-white text-gray-900 shadow-md' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <i className="ri-list-unordered mr-2"></i>
                      <span className="hidden sm:inline">Liste</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'map' 
                          ? 'bg-white text-gray-900 shadow-md' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <i className="ri-map-pin-line mr-2"></i>
                      <span className="hidden sm:inline">Carte</span>
                    </button>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm pr-10 outline-none"
                  >
                    <option value="relevance">Pertinence</option>
                    <option value="distance">Distance</option>
                    <option value="rating">Note</option>
                    <option value="reviews">Nombre d'avis</option>
                  </select>
                </div>
              </div>
            </div>

            {viewMode === 'map' && (
              <div className="bg-white rounded-lg shadow-sm mb-6 h-64 sm:h-96">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7708!2d3.3792!3d6.5244!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc9e87a367c3d9cb!2sLagos%2C%20Nigeria!5e0!3m2!1sen!2s!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-16 sm:w-24 h-16 sm:h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {suppliers.map((supplier: any) => {
                  const supplierId = supplier.id;
                  const supplierName = supplier.name;
                  const imageQuery = encodeURIComponent(`${supplierName} ${supplier.category} business Nigeria professional storefront`);
                                
                  return (
                    <div key={supplierId} className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100 hover:-translate-y-1">
                      <div className="p-6">
                        <div className="flex gap-6">
                          <div className="w-20 sm:w-28 h-20 sm:h-28 flex-shrink-0">
                            {supplier.image_url ? (
                              <img
                                src={supplier.image_url}
                                alt={supplierName}
                                className="w-full h-full object-cover object-top rounded-xl shadow-sm"
                                onError={(e) => {
                                  // Fallback to generated image if the actual image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://readdy.ai/api/search-image?query=${imageQuery}&width=200&height=200&seq=search-${supplierId}&orientation=squarish`;
                                  target.onerror = null; // Prevent infinite loop
                                }}
                              />
                            ) : (
                              <img
                                src={`https://readdy.ai/api/search-image?query=${imageQuery}&width=200&height=200&seq=search-${supplierId}&orientation=squarish`}
                                alt={supplierName}
                                className="w-full h-full object-cover object-top rounded-xl shadow-sm"
                              />
                            )}
                          </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                                <span className="truncate">{supplier.name}</span>
                                {supplier.verified && (
                                  <span className="badge badge-verified flex-shrink-0">
                                    <i className="ri-verified-badge-fill mr-1"></i>
                                    <span className="hidden sm:inline">Vérifié</span>
                                    <span className="sm:hidden">✓</span>
                                  </span>
                                )}
                              </h3>
                              <p className="text-green-600 text-sm font-semibold flex items-center">
                                <i className="ri-store-2-line mr-1"></i>
                                {supplier.category}
                              </p>
                            </div>
                            <div className="text-right ml-2 flex-shrink-0">
                              <div className="flex items-center gap-1.5 mb-1 bg-gradient-to-br from-yellow-50 to-orange-50 px-3 py-2 rounded-xl border border-yellow-200">
                                <i className="ri-star-fill text-yellow-500 text-sm"></i>
                                <div className="font-bold text-sm text-gray-900">{supplier.rating}</div>
                                <div className="text-gray-500 text-xs">({supplier.review_count})</div>
                              </div>
                              {supplier.distance && (
                                <p className="text-xs text-gray-500">{supplier.distance.toFixed(1)} km</p>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{supplier.description}</p>
                          <div className="space-y-1 sm:space-y-2 mb-4">
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <i className="ri-map-pin-line mr-2 text-green-600 flex-shrink-0"></i>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{supplier.location}</div>
                                <div className="text-xs text-gray-500">Adresse complète disponible</div>
                              </div>
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <i className="ri-phone-line mr-2 text-green-600 flex-shrink-0"></i>
                              <span className="truncate">{supplier.phone}</span>
                            </div>
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <i className="ri-mail-line mr-2 text-green-600 flex-shrink-0"></i>
                              <span className="truncate">{supplier.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <a
                                href={`tel:${supplier.phone}`}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                title="Appeler"
                              >
                                <i className="ri-phone-line text-base sm:text-lg"></i>
                              </a>
                              <a
                                href={`mailto:${supplier.email}`}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                title="Envoyer un email"
                              >
                                <i className="ri-mail-line text-base sm:text-lg"></i>
                              </a>
                              <button
                                onClick={() => (document.querySelector('#vapi-widget-floating-button') as HTMLElement | null)?.click()}
                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                title="Prendre rendez-vous"
                              >
                                <i className="ri-calendar-line text-base sm:text-lg"></i>
                              </button>
                            </div>
                            <Link
                              to={`/supplier/${supplier.id}`}
                              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                            >
                              Voir détails
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

            {!loading && suppliers.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="ri-arrow-left-line"></i>
                  </button>
                  
                  {Array.from({ length: Math.min(5, Math.ceil(totalCount / itemsPerPage)) }, (_, i) => {
                    const totalPages = Math.ceil(totalCount / itemsPerPage);
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-green-600 text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage) - 1, p + 1))}
                    disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) - 1}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="ri-arrow-right-line"></i>
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
