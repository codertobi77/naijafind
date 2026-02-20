import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/base';
import { useConvexAuth } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';

// Default category image URL for fallback
const DEFAULT_CATEGORY_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Cg transform='translate(200,150)'%3E%3Cpath d='M-60-80h120v160h-120zM-40-100h80v20h-80zM-30-90h20v-20h-20z' fill='%239ca3af'/%3E%3Cpath d='M-40-40h80v20h-80zM-40-10h80v20h-80zM-40 20h60v20h-60z' fill='%23d1d5db'/%3E%3C/g%3E%3C/svg%3E";

export default function Categories() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  // Using React Query with optimized cache times
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  const { data: categoriesData, isLoading: categoriesLoading } = useConvexQuery(
    api.categories.getAllCategories,
    {},
    { staleTime: 15 * 60 * 1000 } // Categories don't change often - cache for 15 minutes
  );
  const { data: allSuppliers, isLoading: suppliersLoading } = useConvexQuery(
    api.suppliers.searchSuppliers,
    { limit: BigInt(1000) },
    { staleTime: 5 * 60 * 1000 } // Cache supplier list for 5 minutes
  );

  // Loading state
  const loading = categoriesLoading || suppliersLoading;

  // Calculer le nombre de suppliers par catégorie
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (allSuppliers?.suppliers) {
      const counts: Record<string, number> = {};
      allSuppliers.suppliers.forEach((supplier: any) => {
        const cat = supplier.category || supplier.business_name;
        if (cat) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });
      setCategoryCounts(counts);
    }
  }, [allSuppliers]);

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

  // Mapper les catégories avec les counts
  const categories = categoriesData?.map((cat: any) => ({
    name: cat.name,
    icon: cat.icon || 'ri-folder-line',
    count: categoryCounts[cat.name] || 0,
    description: cat.description || '',
    image: cat.image || DEFAULT_CATEGORY_IMAGE
  })) || [];

  const filteredCategories = categories.filter((category: any) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('msg.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 mb-6">
            <i className="ri-grid-line text-white mr-2"></i>
            <span className="text-white text-sm font-semibold">{t('categories.title')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {t('categories.explore')}
          </h1>
          <p className="text-xl sm:text-2xl text-green-50 mb-10 max-w-2xl mx-auto">
            {t('categories.subtitle')}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('categories.search_placeholder')}
                className="w-full px-6 py-4 pl-14 rounded-2xl border-0 focus:ring-4 focus:ring-white/30 text-gray-900 shadow-xl text-base outline-none"
              />
              <i className="ri-search-line absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCategories.map((category, index) => (
              <div key={category.name} className="group bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:-translate-y-2">
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback to default image if the actual image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_CATEGORY_IMAGE;
                      target.onerror = null; // Prevent infinite loop
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-white to-green-50 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300 border border-white/50">
                      <i className={`${category.icon} text-3xl text-green-600`}></i>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="inline-flex items-center px-3 py-1.5 bg-white/95 backdrop-blur-md text-green-700 text-sm font-bold rounded-full shadow-lg">
                      {category.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{category.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{category.description}</p>
                  </div>
                  
                  <Link
                    to={`/search?category=${encodeURIComponent(category.name)}`}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 text-center block font-semibold text-sm transform group-hover:-translate-y-0.5"
                  >
                    <i className="ri-arrow-right-line mr-2"></i>
                    {t('categories.explore_category')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-search-line text-4xl sm:text-6xl text-gray-400 mb-4"></i>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('categories.no_results')}</h3>
              <p className="text-gray-600 text-sm sm:text-base">{t('categories.try_keywords')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {t('categories.stats_title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              {t('categories.stats_subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">25,000+</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('categories.verified_suppliers')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('categories.product_categories')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">36</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('categories.states_covered')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">1M+</div>
              <div className="text-gray-600 text-sm sm:text-base">{t('categories.monthly_searches')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-lg sm:text-xl font-bold mb-4" style={{ fontFamily: "Pacifico, serif" }}>
                Olufinja
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.quick_links')}</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link to="/search" className="hover:text-white">{t('nav.search')}</Link></li>
                <li><Link to="/categories" className="hover:text-white">{t('nav.categories')}</Link></li>
                <li><Link to="/about" className="hover:text-white">{t('nav.about')}</Link></li>
                <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link to="/help" className="hover:text-white">{t('nav.help')}</Link></li>
                <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
                <li><Link to="/faq" className="hover:text-white">{t('nav.faq')}</Link></li>
                <li><Link to="/privacy" className="hover:text-white">{t('nav.privacy')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.follow_us')}</h4>
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
            <p>&copy; 2024 Olufinja. {t('footer.rights')} | <a href="https://readdy.ai/?origin=logo" className="hover:text-white">{t('footer.powered_by')}</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}