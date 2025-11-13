
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';
import { useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useConvexQuery } from '../../hooks/useConvexQuery';

interface Supplier {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  review_count: number;
  phone: string;
  email: string;
  verified: boolean;
  description: string;
  image_url: string;
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  // Using React Query cached queries instead of direct Convex queries
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  const { data: featuredSuppliersData, isLoading: loadingSuppliers } = useConvexQuery(
    api.suppliers.searchSuppliers, 
    { limit: BigInt(3), verified: true },
    { staleTime: 10 * 60 * 1000 } // Cache for 10 minutes since featured suppliers don't change often
  );
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategories, 
    {},
    { staleTime: 15 * 60 * 1000 } // Cache categories for 15 minutes
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Extract suppliers array from Convex response
  const featuredSuppliers = featuredSuppliersData?.suppliers || [];

  // Categories carousel logic
  const categoriesPerSlide = 3;
  const totalSlides = categories ? Math.ceil(categories.length / categoriesPerSlide) : 0;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [totalSlides]);

  const handleAddBusinessClick = () => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Rediriger vers l'inscription avec type supplier
        navigate('/auth/register?type=supplier');
      } else {
        // Vérifier si l'utilisateur est déjà un fournisseur
        if (meData?.user?.user_type === 'supplier') {
          navigate('/dashboard');
        } else {
          // Rediriger vers une page de conversion ou créer le profil supplier
          navigate('/dashboard?action=become-supplier');
        }
      }
    }
  };



  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    if (category) params.set('category', category);
    navigate(`/search?${params.toString()}`);
  };

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
              <Link to="/" className="px-4 py-2 rounded-lg text-green-600 bg-green-50 font-medium transition-all">{t('nav.home')}</Link>
              <Link to="/search" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.search')}</Link>
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

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden" 
               style={{
                 backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20Nigerian%20marketplace%20with%20vendors%20selling%20colorful%20products%2C%20bustling%20commercial%20district%20in%20Lagos%20with%20traditional%20and%20modern%20buildings%2C%20vibrant%20street%20scene%20with%20people%20shopping%2C%20warm%20golden%20lighting%2C%20professional%20photography%20style%2C%20clean%20organized%20market%20stalls&width=1200&height=600&seq=hero-nigeria&orientation=landscape')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/40"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">Trusted by 25,000+ Nigerian businesses</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-white/95 mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            {/* Search Form */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="ri-search-line mr-1"></i>{t('hero.search_placeholder')}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('hero.search_placeholder')}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="ri-map-pin-line mr-1"></i>{t('label.location')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('hero.location_placeholder')}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <i className="ri-list-check mr-1"></i>{t('label.category')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm pr-10 outline-none"
                  >
                    <option value="">{t('categories.view_all')}</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold text-base transform hover:-translate-y-0.5"
              >
                <i className="ri-search-line mr-2 text-lg"></i>
                {t('hero.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center group hover-lift">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4 group-hover:shadow-lg transition-all">
                <i className="ri-building-line text-3xl text-green-600"></i>
              </div>
              <div className="text-3xl sm:text-5xl font-bold text-gradient mb-2">25,000+</div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">{t('stats.suppliers')}</div>
            </div>
            <div className="text-center group hover-lift">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4 group-hover:shadow-lg transition-all">
                <i className="ri-stack-line text-3xl text-blue-600"></i>
              </div>
              <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">{t('stats.categories')}</div>
            </div>
            <div className="text-center group hover-lift">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4 group-hover:shadow-lg transition-all">
                <i className="ri-map-2-line text-3xl text-purple-600"></i>
              </div>
              <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">36</div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">{t('stats.cities')}</div>
            </div>
            <div className="text-center group hover-lift">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl mb-4 group-hover:shadow-lg transition-all">
                <i className="ri-star-line text-3xl text-orange-600"></i>
              </div>
              <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">1M+</div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">{t('stats.reviews')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-4">
              <i className="ri-grid-line text-green-600 mr-2"></i>
              <span className="text-green-700 text-sm font-semibold">Browse by Category</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('categories.title')}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>
          
          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-10 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center text-green-600 hover:text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 group"
              aria-label="Previous categories"
            >
              <i className="ri-arrow-left-s-line text-2xl sm:text-3xl"></i>
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-10 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center text-green-600 hover:text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 group"
              aria-label="Next categories"
            >
              <i className="ri-arrow-right-s-line text-2xl sm:text-3xl"></i>
            </button>

            {/* Carousel Track */}
            <div className="overflow-hidden" ref={carouselRef}>
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {categories && Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
                      {categories
                        .slice(slideIndex * categoriesPerSlide, (slideIndex + 1) * categoriesPerSlide)
                        .map((category) => (
                          <Link
                            key={category._id}
                            to={`/search?category=${encodeURIComponent(category.name)}`}
                            className="group bg-white rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:-translate-y-2"
                          >
                            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                              <i className={`${category.icon || 'ri-folder-line'} text-3xl text-green-600`}></i>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2 text-base group-hover:text-green-600 transition-colors">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{category.description}</p>
                            )}
                            <div className="inline-flex items-center text-green-600 font-semibold text-sm group-hover:gap-2 transition-all">
                              <span>Explore</span>
                              <i className="ri-arrow-right-line ml-1 group-hover:translate-x-1 transition-transform"></i>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    currentSlide === index
                      ? 'w-8 h-2 bg-gradient-to-r from-green-600 to-emerald-600'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center mt-8">
              <Link
                to="/categories"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold transform hover:-translate-y-0.5"
              >
                <span>View All Categories</span>
                <i className="ri-arrow-right-line ml-2 text-lg"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Suppliers */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {t('featured.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              {t('featured.subtitle')}
            </p>
          </div>
          
          {loadingSuppliers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-40 sm:h-48 bg-gray-200"></div>
                  <div className="p-4 sm:p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredSuppliers.map((supplier: any) => {
                const supplierId = supplier._id || supplier.id;
                const supplierName = supplier.business_name || supplier.name || 'Supplier';
                const supplierLocation = supplier.location || `${supplier.city || ''}, ${supplier.state || ''}`.trim();
                const supplierRating = supplier.rating || 0;
                const supplierReviewsCount = Number(supplier.reviews_count || 0);
                const imageQuery = encodeURIComponent(`${supplierName} ${supplier.category || ''} business Nigeria professional storefront`);
                
                return (
                  <div key={supplierId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="h-40 sm:h-48 bg-gray-200 relative">
                      <img
                        src={`https://readdy.ai/api/search-image?query=${imageQuery}&width=400&height=300&seq=supplier-${supplierId}&orientation=landscape`}
                        alt={supplierName}
                        className="w-full h-full object-cover object-top"
                      />
                      {supplier.verified && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <i className="ri-verified-badge-fill mr-1"></i>
                          {t('featured.verified')}
                        </div>
                      )}
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:lg text-gray-900 mb-1 truncate">{supplierName}</h3>
                          <p className="text-green-600 text-sm font-medium">{supplier.category}</p>
                        </div>
                        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg ml-2 flex-shrink-0">
                          <i className="ri-star-fill text-yellow-400 text-sm"></i>
                          <span className="text-sm font-medium text-gray-900 ml-1">{supplierRating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{supplier.description || 'No description available'}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-map-pin-line mr-2 text-green-600 flex-shrink-0"></i>
                          <span className="truncate">{supplierLocation}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-phone-line mr-2 text-green-600 flex-shrink-0"></i>
                          <span className="truncate">{supplier.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-mail-line mr-2 text-green-600 flex-shrink-0"></i>
                          <span className="truncate">{supplier.email || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          {supplier.phone && (
                            <a
                              href={`tel:${supplier.phone}`}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title={t('btn.call')}
                            >
                              <i className="ri-phone-line text-lg"></i>
                            </a>
                          )}
                          {supplier.email && (
                            <a
                              href={`mailto:${supplier.email}`}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title={t('btn.email')}
                            >
                              <i className="ri-mail-line text-lg"></i>
                            </a>
                          )}
                          <span className="text-sm text-gray-500">({supplierReviewsCount} {t('label.reviews')})</span>
                        </div>
                        <Link
                          to={`/supplier/${supplierId}`}
                          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                        >
                          {t('featured.view_profile')}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Restez informé des nouveautés
              </h2>
              <p className="text-lg sm:text-xl text-green-100 mb-4 sm:mb-6">
                Recevez les dernières actualités sur les fournisseurs, les nouvelles entreprises et les opportunités d'affaires au Nigeria.
              </p>
              <ul className="space-y-2 text-green-100 text-sm sm:text-base">
                <li className="flex items-center">
                  <i className="ri-check-line mr-2 flex-shrink-0"></i>
                  Nouveaux fournisseurs vérifiés
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line mr-2 flex-shrink-0"></i>
                  Opportunités d'affaires exclusives
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line mr-2 flex-shrink-0"></i>
                  Conseils pour développer votre entreprise
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Inscription à la newsletter
              </h3>
              <form className="space-y-4" data-readdy-form id="newsletter-subscription" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                try {
                  const response = await fetch('https://readdy.ai/api/form/d3i6i9b2p8nb8r4n7e7g', {
                    method: 'POST',
                    body: formData
                  });
                  if (response.ok) {
                    alert('Inscription réussie ! Merci de vous être abonné à notre newsletter.');
                    (e.target as HTMLFormElement).reset();
                  }
                } catch (error) {
                  alert('Erreur lors de l\'inscription. Veuillez réessayer.');
                }
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Votre nom complet"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur d'activité
                  </label>
                  <select
                    name="sector"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8 text-sm"
                  >
                    <option value="">Sélectionnez votre secteur</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Textile">Textile</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Alimentation">Alimentation</option>
                    <option value="Construction">Construction</option>
                    <option value="Automobile">Automobile</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap text-sm sm:text-base"
                >
                  <i className="ri-mail-line mr-2"></i>
                  S'abonner à la newsletter
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Vous êtes fournisseur ?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
            Rejoignez des milliers de fournisseurs et développez votre activité
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleAddBusinessClick}
              disabled={isLoading}
              className="bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Inscrire mon entreprise gratuitement
            </button>
            <button 
              onClick={() => {
                const widget = document.querySelector('#vapi-widget-floating-button') as HTMLElement;
                if (widget) widget.click();
              }}
              className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-white hover:text-gray-900 transition-colors font-medium whitespace-nowrap text-sm sm:text-base"
            >
              <i className="ri-chat-3-line mr-2"></i>
              Parler à un conseiller
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-lg sm:text-xl font-bold mb-4" style={{ fontFamily: "Pacifico, serif" }}>
                NaijaFind
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Le moteur de recherche géolocalisé de référence pour tous les fournisseurs du Nigeria.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link to="/search" className="hover:text-white">{t('nav.search')}</Link></li>
                <li><Link to="/categories" className="hover:text-white">{t('nav.categories')}</Link></li>
                <li><Link to="/about" className="hover:text-white">{t('nav.about')}</Link></li>
                <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link to="/help" className="hover:text-white">{t('nav.help')}</Link></li>
                <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
                <li><Link to="/faq" className="hover:text-white">{t('nav.faq')}</Link></li>
                <li><Link to="/privacy" className="hover:text-white">{t('nav.privacy')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-facebook-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-twitter-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-linkedin-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-instagram-fill text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 NaijaFind. {t('footer.rights')} | <a href="https://readdy.ai/?origin=logo" className="hover:text-white">{t('footer.powered_by')}</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
