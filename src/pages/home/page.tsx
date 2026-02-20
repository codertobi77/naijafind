import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';
import { useConvexAuth } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import type { Doc } from '../../../convex/_generated/dataModel';
import Modal from '../../components/base/Modal';

// Default category image URL for fallback
const DEFAULT_CATEGORY_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Cg transform='translate(200,150)'%3E%3Cpath d='M-60-80h120v160h-120zM-40-100h80v20h-80zM-30-90h20v-20h-20z' fill='%239ca3af'/%3E%3Cpath d='M-40-40h80v20h-80zM-40-10h80v20h-80zM-40 20h60v20h-60z' fill='%23d1d5db'/%3E%3C/g%3E%3C/svg%3E";

// Define proper TypeScript interface for Supplier based on Convex schema
type Supplier = Doc<"suppliers">;

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation(); // Using useLocation hook properly
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  // Using React Query cached queries instead of direct Convex queries
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  const { data: featuredSuppliersData } = useConvexQuery(
    api.admin.getFeaturedSuppliers,
    {},
    { staleTime: 10 * 60 * 1000 } // Cache featured suppliers for 10 minutes
  );
  
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategories,
    {},
    { staleTime: 15 * 60 * 1000 } // Cache categories for 15 minutes
  );
  
  // State for displaying messages from navigation
  const [message, setMessage] = useState<string | null>(null);
  
  // Modal state for newsletter
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ 
    title: '', 
    message: '', 
    icon: 'success' as 'success' | 'info' | 'warning' 
  });
  
  // Handle location state message
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      // Clear the state after displaying the message
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState(''); // Renamed from 'location' to avoid conflict
  const [category, setCategory] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Extract suppliers array from Convex response
  const featuredSuppliers: Supplier[] = featuredSuppliersData || [];

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
    if (searchLocation) params.set('location', searchLocation); // Updated to use searchLocation
    if (category) params.set('category', category);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Show message if redirected from dashboard */}
      {message && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p>{message}</p>
        </div>
      )}
      
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
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <i className="ri-menu-line text-2xl"></i>
            </button>
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
                {(meData?.user?.is_admin === true || meData?.user?.user_type === 'admin') && (
                  <Link 
                    to="/admin"
                    className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-lg transition-colors hidden sm:block"
                  >
                    {t('nav.admin')}
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
            {/* Mobile menu */}
            {mobileMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-50">
                <div className="flex flex-col py-2">
                  <Link to="/" className="px-4 py-2 text-green-600 bg-green-50 font-medium" onClick={() => setMobileMenuOpen(false)}>{t('nav.home')}</Link>
                  <Link to="/search" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium" onClick={() => setMobileMenuOpen(false)}>{t('nav.search')}</Link>
                  <Link to="/categories" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium" onClick={() => setMobileMenuOpen(false)}>{t('nav.categories')}</Link>
                  <Link to="/about" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium" onClick={() => setMobileMenuOpen(false)}>{t('nav.about')}</Link>
                  {(meData?.user?.is_admin === true || meData?.user?.user_type === 'admin') && (
                    <Link to="/admin" className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium" onClick={() => setMobileMenuOpen(false)}>{t('nav.admin')}</Link>
                  )}
                </div>
              </div>
            )}
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
                    value={searchLocation} // Updated to use searchLocation
                    onChange={(e) => setSearchLocation(e.target.value)} // Updated to use setSearchLocation
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
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold text-base transform hover:-translate-y-0.5"
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
                <i className="ri-map-pin-line text-3xl text-blue-600"></i>
              </div>
              <div className="text-3xl sm:text-5xl font-bold text-gradient mb-2">36</div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">{t('stats.states')}</div>
            </div>
            <div className="text-center group hover-lift">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4 group-hover:shadow-lg transition-all">
                <i className="ri-shopping-cart-line text-3xl text-purple-600"></i>
              </div>
              <div className="text-3xl sm:text-5xl font-bold text-gradient mb-2">1.2M+</div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">{t('stats.transactions')}</div>
            </div>
            <div className="text-center group hover-lift">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl mb-4 group-hover:shadow-lg transition-all">
                <i className="ri-star-line text-3xl text-yellow-600"></i>
              </div>
              <div className="text-3xl sm:text-5xl font-bold text-gradient mb-2">4.8</div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">{t('stats.rating')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Carousel */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('categories.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>
          
          <div className="relative">
            <div className="overflow-hidden">
              <div 
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="flex-shrink-0 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categories
                        ?.slice(slideIndex * categoriesPerSlide, (slideIndex + 1) * categoriesPerSlide)
                        .map((category) => (
                          <Link
                            key={category._id}
                            to={`/search?category=${encodeURIComponent(category.name)}`}
                            className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                          >
                            <div className="relative h-32 w-full mb-4 rounded-lg overflow-hidden">
                              <img 
                                src={category.image || DEFAULT_CATEGORY_IMAGE}
                                alt={category.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  // Fallback to default image if the actual image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.src = DEFAULT_CATEGORY_IMAGE;
                                  target.onerror = null; // Prevent infinite loop
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                              <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-white to-green-50 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                                <i className={`${category.icon || 'ri-folder-line'} text-2xl ${category.icon ? 'text-green-600' : 'text-gray-400'}`}></i>
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                              {category.name}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                              {category.description || t('msg.no_description')}
                            </p>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {totalSlides > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border border-gray-200 z-10"
                  aria-label="Previous slide"
                >
                  <i className="ri-arrow-left-s-line text-xl text-gray-700"></i>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border border-gray-200 z-10"
                  aria-label="Next slide"
                >
                  <i className="ri-arrow-right-s-line text-xl text-gray-700"></i>
                </button>
                
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentSlide === index ? 'bg-green-600 w-8' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Suppliers Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('featured.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('featured.subtitle')}
            </p>
          </div>
          
          {featuredSuppliersData === undefined ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : featuredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {featuredSuppliers.map((supplier: Supplier) => (
                <div key={supplier._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                  <div className="relative h-48 overflow-hidden">
                    {supplier.image ? (
                      <img 
                        src={supplier.image}
                        alt={supplier.business_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to generated image if the actual image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=featured-${supplier._id}&orientation=landscape`;
                          target.onerror = null; // Prevent infinite loop
                        }}
                      />
                    ) : (
                      <img 
                        src={`https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=featured-${supplier._id}&orientation=landscape`}
                        alt={supplier.business_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {supplier.verified && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                        <i className="ri-shield-star-line mr-1"></i>
                        {t('status.verified')}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        {supplier.business_name}
                      </h3>
                      <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                        <i className="ri-star-fill mr-1 text-yellow-500"></i>
                        {supplier.rating?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {supplier.description || t('msg.no_description')}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {supplier.category}
                      </span>
                      <span>
                        <i className="ri-map-pin-line mr-1"></i>
                        {supplier.city}, {supplier.state}
                      </span>
                    </div>
                    <Link 
                      to={`/supplier/${supplier._id}`}
                      className="block w-full text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {t('btn.view')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="ri-store-2-line text-5xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('featured.no_suppliers')}</h3>
              <p className="text-gray-600">{t('featured.no_suppliers_desc')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t('newsletter.title')}
              </h2>
              <p className="text-lg text-green-100 mb-6">
                {t('newsletter.subtitle')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-xl mr-3"></i>
                  {t('newsletter.benefit1')}
                </li>
                <li className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-xl mr-3"></i>
                  {t('newsletter.benefit2')}
                </li>
                <li className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-xl mr-3"></i>
                  {t('newsletter.benefit3')}
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
                    setModalConfig({
                      title: 'Inscription réussie !',
                      message: 'Merci de vous être abonné à notre newsletter.',
                      icon: 'success'
                    });
                    setModalOpen(true);
                    (e.target as HTMLFormElement).reset();
                  }
                } catch (error) {
                  setModalConfig({
                    title: 'Erreur',
                    message: 'Erreur lors de l\'inscription. Veuillez réessayer.',
                    icon: 'warning'
                  });
                  setModalOpen(true);
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText="OK"
        icon={modalConfig.icon}
      />
    </div>
  );
}