
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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
  const meData = useQuery(api.users.me, {});
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const featuredSuppliers = useQuery(api.suppliers.searchSuppliers, { limit: BigInt(3), verified: true });
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

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

  useEffect(() => {
    // fetchFeaturedSuppliers(); // This function is no longer needed
  }, []);

  // const fetchFeaturedSuppliers = async () => { // This function is no longer needed
  //   try {
  //     const response = await fetch(
  //       'https://khqolgtkhonnguqqizrx.supabase.co/functions/v1/search-suppliers?limit=3&featured=true'
  //     );
  //     const data = await response.json();
      
  //     if (data.suppliers && data.suppliers.length > 0) {
  //       setFeaturedSuppliers(data.suppliers);
  //     } else {
  //       // Données de fallback si aucun fournisseur en base
  //       setFeaturedSuppliers([
  //         {
  //           id: 'demo-1',
  //           name: 'Alaba Electronics Market',
  //           category: 'Électronique',
  //           location: 'Lagos, Nigeria',
  //           rating: 4.8,
  //           review_count: 324,
  //           phone: '+234 803 123 4567',
  //           email: 'contact@alabaelectronics.ng',
  //           verified: true,
  //           description: 'Spécialiste en électronique grand public, smartphones, ordinateurs et accessoires technologiques de qualité.',
  //           image_url: 'Modern electronics store in Lagos Nigeria with smartphones tablets computers displayed on shelves, bright LED lighting, professional retail environment, customers browsing products, clean organized layout'
  //         },
  //         {
  //           id: 'demo-2',
  //           name: 'Kano Textile Industries',
  //           category: 'Textile',
  //           location: 'Kano, Nigeria',
  //           rating: 4.9,
  //           review_count: 256,
  //           phone: '+234 805 987 6543',
  //           email: 'info@kanotextile.com',
  //           verified: true,
  //           description: 'Fabricant traditionnel de textiles nigérians, spécialisé dans les tissus authentiques et les vêtements sur mesure.',
  //           image_url: 'Traditional Nigerian textile factory with colorful fabrics being woven, workers in traditional dress operating looms, vibrant patterns and colors, authentic cultural setting, natural lighting'
  //         },
  //         {
  //           id: 'demo-3',
  //           name: 'Onitsha Main Market',
  //           category: 'Commerce général',
  //           location: 'Anambra, Nigeria',
  //           rating: 4.7,
  //           review_count: 189,
  //           phone: '+234 807 456 7890',
  //           email: 'market@onitsha.ng',
  //           verified: false,
  //           description: 'Marché principal d\'Onitsha offrant une large gamme de produits : alimentation, vêtements, électroménager et plus.',
  //           image_url: 'Bustling Nigerian marketplace with vendors selling various goods, colorful stalls with fruits vegetables and household items, busy shoppers, traditional market atmosphere, warm natural lighting'
  //         }
  //       ]);
  //     }
  //   } catch (error) {
  //     console.error('Erreur lors du chargement des fournisseurs:', error);
  //     // Utiliser les données de fallback en cas d\'erreur
  //     setFeaturedSuppliers([
  //       {
  //         id: 'demo-1',
  //         name: 'Alaba Electronics Market',
  //         category: 'Électronique',
  //         location: 'Lagos, Nigeria',
  //         rating: 4.8,
  //         review_count: 324,
  //         phone: '+234 803 123 4567',
  //         email: 'contact@alabaelectronics.ng',
  //         verified: true,
  //         description: 'Spécialiste en électronique grand public, smartphones, ordinateurs et accessoires technologiques de qualité.',
  //         image_url: 'Modern electronics store in Lagos Nigeria with smartphones tablets computers displayed on shelves, bright LED lighting, professional retail environment, customers browsing products, clean organized layout'
  //       },
  //       {
  //         id: 'demo-2',
  //         name: 'Kano Textile Industries',
  //         category: 'Textile',
  //         location: 'Kano, Nigeria',
  //         rating: 4.9,
  //         review_count: 256,
  //         phone: '+234 805 987 6543',
  //         email: 'info@kanotextile.com',
  //         verified: true,
  //         description: 'Fabricant traditionnel de textiles nigérians, spécialisé dans les tissus authentiques et les vêtements sur mesure.',
  //         image_url: 'Traditional Nigerian textile factory with colorful fabrics being woven, workers in traditional dress operating looms, vibrant patterns and colors, authentic cultural setting, natural lighting'
  //       },
  //       {
  //         id: 'demo-3',
  //         name: 'Onitsha Main Market',
  //         category: 'Commerce général',
  //         location: 'Anambra, Nigeria',
  //         rating: 4.7,
  //         review_count: 189,
  //         phone: '+234 807 456 7890',
  //         email: 'market@onitsha.ng',
  //         verified: false,
  //         description: 'Marché principal d\'Onitsha offrant une large gamme de produits : alimentation, vêtements, électroménager et plus.',
  //         image_url: 'Bustling Nigerian marketplace with vendors selling various goods, colorful stalls with fruits vegetables and household items, busy shoppers, traditional market atmosphere, warm natural lighting'
  //       }
  //     ]);
  //   } finally {
  //     setLoadingSuppliers(false);
  //   }
  // };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    if (category) params.set('category', category);
    if (window.REACT_APP_NAVIGATE) {
      window.REACT_APP_NAVIGATE(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
                NaijaFind
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-green-600 font-medium">{t('nav.home')}</Link>
              <Link to="/search" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.search')}</Link>
              <Link to="/categories" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.categories')}</Link>
              <Link to="/about" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.about')}</Link>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LanguageSelector />
              <Link to="/auth/login" className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap text-sm sm:text-base">
                {t('nav.login')}
              </Link>
              <Link to="/auth/register" className="border border-green-600 text-green-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium whitespace-nowrap text-sm sm:text-base hidden sm:block">
                {t('nav.register')}
              </Link>
              <Link to="/auth/register" className="border border-green-600 text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium whitespace-nowrap text-sm sm:hidden">
                {t('nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8" 
               style={{
                 backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20Nigerian%20marketplace%20with%20vendors%20selling%20colorful%20products%2C%20bustling%20commercial%20district%20in%20Lagos%20with%20traditional%20and%20modern%20buildings%2C%20vibrant%20street%20scene%20with%20people%20shopping%2C%20warm%20golden%20lighting%2C%20professional%20photography%20style%2C%20clean%20organized%20market%20stalls&width=1200&height=600&seq=hero-nigeria&orientation=landscape')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8">
              {t('hero.subtitle')}
            </p>
            
            {/* Search Form */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('hero.search_placeholder')}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('hero.search_placeholder')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('label.location')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('hero.location_placeholder')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('label.category')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
                  >
                    <option value="">{t('categories.view_all')}</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Textile">Textile</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Alimentation">Alimentation</option>
                    <option value="Construction">Construction</option>
                    <option value="Automobile">Automobile</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="w-full bg-green-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-green-7 transition-colors font-medium whitespace-nowrap text-sm sm:text-base"
              >
                <i className="ri-search-line mr-2"></i>
                {t('hero.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">25,000+</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('stats.suppliers')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('stats.categories')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">36</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('stats.cities')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">1M+</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('stats.reviews')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {t('categories.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              {t('categories.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              { name: 'Agriculture', icon: 'ri-plant-line', count: '5,200+' },
              { name: 'Textile', icon: 'ri-shirt-line', count: '3,800+' },
              { name: 'Électronique', icon: 'ri-smartphone-line', count: '2,900+' },
              { name: 'Alimentation', icon: 'ri-restaurant-line', count: '4,100+' },
              { name: 'Construction', icon: 'ri-building-line', count: '2,300+' },
              { name: 'Automobile', icon: 'ri-car-line', count: '1,800+' }
            ].map((category, index) => (
              <Link
                key={index}
                to={`/search?category=${encodeURIComponent(category.name)}`}
                className="bg-white rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <i className={`${category.icon} text-xl sm:text-2xl text-green-600`}></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{category.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{category.count}</p>
              </Link>
            ))}
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
              {featuredSuppliers.map((supplier) => (
                <div key={supplier.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-40 sm:h-48 bg-gray-200 relative">
                    <img
                      src={`https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28supplier.image_url%29%7D&width=400&height=300&seq=supplier-${supplier.id}&orientation=landscape`}
                      alt={supplier.name}
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
                        <h3 className="font-semibold text-base sm:lg text-gray-900 mb-1 truncate">{supplier.name}</h3>
                        <p className="text-green-600 text-sm font-medium">{supplier.category}</p>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg ml-2 flex-shrink-0">
                        <i className="ri-star-fill text-yellow-400 text-sm"></i>
                        <span className="text-sm font-medium text-gray-900 ml-1">{supplier.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{supplier.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="ri-map-pin-line mr-2 text-green-600 flex-shrink-0"></i>
                        <span className="truncate">{supplier.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="ri-phone-line mr-2 text-green-600 flex-shrink-0"></i>
                        <span className="truncate">{supplier.phone}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="ri-mail-line mr-2 text-green-600 flex-shrink-0"></i>
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <a
                          href={`tel:${supplier.phone}`}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title={t('btn.call')}
                        >
                          <i className="ri-phone-line text-lg"></i>
                        </a>
                        <a
                          href={`mailto:${supplier.email}`}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title={t('btn.email')}
                        >
                          <i className="ri-mail-line text-lg"></i>
                        </a>
                        <span className="text-sm text-gray-500">({supplier.review_count} {t('label.reviews')})</span>
                      </div>
                      <Link
                        to={`/supplier/${supplier.id}`}
                        className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                      >
                        {t('featured.view_profile')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
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
