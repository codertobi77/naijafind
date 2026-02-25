import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { useConvexAuth, useMutation } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import Modal from '../../components/base/Modal';
import { HeroSection, Section, Container, Footer } from '../../components/layout';
import { CTASection } from '../../components/ui';
import { FormSelect } from '../../components/forms';

// Define proper TypeScript interface for Supplier based on Convex schema
type Supplier = Doc<"suppliers">;

// Search Hero Component with Autocomplete
interface SearchHeroProps {
  t: (key: string) => string;
  searchQuery: string;
  searchLocation: string;
  category: string;
  categories: Array<{ _id: string; name: string }> | undefined;
  featuredSuppliers: any[];
  setSearchQuery: (value: string) => void;
  setSearchLocation: (value: string) => void;
  setCategory: (value: string) => void;
  onSearch: () => void;
}

// Common search suggestions
const COMMON_SEARCH_TERMS = [
  'Agriculture',
  'Textile',
  'Électronique',
  'Alimentation',
  'Construction',
  'Mécanique',
  'Pharmaceutique',
  'Cosmétique',
  'Mobilier',
  'Plastique',
];

// Nigerian states for location suggestions
const NIGERIAN_STATES = [
  'Lagos',
  'Abuja',
  'Kano',
  'Ibadan',
  'Port Harcourt',
  'Benin City',
  'Kaduna',
  'Enugu',
  'Aba',
  'Onitsha',
];

function SearchInputWithSuggestions({
  value,
  onChange,
  placeholder,
  suggestions,
  label,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: string[];
  label: string;
  icon: string;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.trim()) {
      const filtered = suggestions
        .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 5));
    }
  }, [value, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <i className={`${icon} mr-1`}></i>{label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <i className="ri-search-line mr-2 text-gray-400"></i>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchHero({ t, searchQuery, searchLocation, category, categories, featuredSuppliers, setSearchQuery, setSearchLocation, setCategory, onSearch }: SearchHeroProps) {
  // Generate search suggestions from categories and supplier names
  const searchSuggestions = useMemo(() => {
    const categoryNames = categories?.map((c) => c.name) || [];
    const supplierNames = featuredSuppliers.map((s) => s.business_name);
    return [...new Set([...categoryNames, ...supplierNames, ...COMMON_SEARCH_TERMS])];
  }, [categories, featuredSuppliers]);

  return (
    <HeroSection
      backgroundImage="https://readdy.ai/api/search-image?query=Modern%20Nigerian%20marketplace%20with%20vendors%20selling%20colorful%20products%2C%20bustling%20commercial%20district%20in%20Lagos%20with%20traditional%20and%20modern%20buildings%2C%20vibrant%20street%20scene%20with%20people%20shopping%2C%20warm%20golden%20lighting%2C%20professional%20photography%20style%2C%20clean%20organized%20market%20stalls&width=1200&height=600&seq=hero-nigeria&orientation=landscape"
      backgroundGradient="from-black/60 via-black/50 to-black/40"
      showBadge={true}
      badgeText="Trusted by 25,000+ Nigerian businesses"
      badgeIcon=""
      title={t('hero.title')}
      subtitle={t('hero.subtitle')}
    >
      {/* Search Form */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchInputWithSuggestions
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('hero.search_placeholder')}
              suggestions={searchSuggestions}
              label={t('hero.search_placeholder')}
              icon="ri-search-line"
            />
          </div>
          <div>
            <SearchInputWithSuggestions
              value={searchLocation}
              onChange={setSearchLocation}
              placeholder={t('hero.location_placeholder')}
              suggestions={NIGERIAN_STATES}
              label={t('label.location')}
              icon="ri-map-pin-line"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="ri-list-check mr-1"></i>{t('label.category')}
            </label>
            <FormSelect
              value={category}
              onChange={(value) => setCategory(value)}
              options={[
                { value: '', label: t('categories.view_all') },
                ...(categories?.map((cat) => ({ value: cat.name, label: cat.name })) || [])
              ]}
            />
          </div>
        </div>
        <button
          onClick={onSearch}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold text-base transform hover:-translate-y-0.5"
        >
          <i className="ri-search-line mr-2 text-lg"></i>
          {t('hero.cta')}
        </button>
      </div>
    </HeroSection>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Using React Query cached queries instead of direct Convex queries
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  const { data: featuredSuppliersData } = useConvexQuery(
    api.admin.getFeaturedSuppliers,
    {},
    { staleTime: 10 * 60 * 1000 }
  );
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategories,
    {},
    { staleTime: 15 * 60 * 1000 }
  );

  // Newsletter subscription mutation
  const subscribeToNewsletter = useMutation(api.emails.subscribeToNewsletter);
  const [isSubscribing, setIsSubscribing] = useState(false);

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
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [category, setCategory] = useState('');

  // Extract suppliers array from Convex response
  const featuredSuppliers: Supplier[] = featuredSuppliersData || [];

  const handleAddBusinessClick = () => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/auth/register?type=supplier');
      } else {
        if (meData?.user?.user_type === 'supplier') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard?action=become-supplier');
        }
      }
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchLocation) params.set('location', searchLocation);
    if (category) params.set('category', category);
    navigate(`/search?${params.toString()}`);
  };

  const stats = [
    { icon: 'ri-building-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '25,000+', label: t('stats.suppliers') },
    { icon: 'ri-folder-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '500+', label: 'Catégories de produits' },
    { icon: 'ri-map-pin-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '36', label: t('stats.states') },
    { icon: 'ri-search-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '1M+', label: 'Recherches mensuelles' },
  ];

  const newsletterBenefits = [
    t('newsletter.benefit1'),
    t('newsletter.benefit2'),
    t('newsletter.benefit3'),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Header />

      {/* Show message if redirected from dashboard */}
      {message && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p>{message}</p>
        </div>
      )}

      {/* Hero Section */}
      <SearchHero
        t={t}
        searchQuery={searchQuery}
        searchLocation={searchLocation}
        category={category}
        categories={categories}
        featuredSuppliers={featuredSuppliers}
        setSearchQuery={setSearchQuery}
        setSearchLocation={setSearchLocation}
        setCategory={setCategory}
        onSearch={handleSearch}
      />

        {/* Stats Section */}
      <Section background="white" padding="md">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Premium Suppliers Section */}
      <Section background="white" padding="md">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Fournisseurs en vedette</h2>
            <p className="text-gray-600">Découvrez les fournisseurs les mieux notés près de chez vous</p>
          </div>

          {featuredSuppliersData === undefined ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : featuredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSuppliers.slice(0, 6).map((supplier: any) => (
                <div 
                  key={supplier._id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={supplier.image || `https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=premium-${supplier._id}&orientation=landscape`}
                      alt={supplier.business_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=premium-${supplier._id}&orientation=landscape`;
                        target.onerror = null;
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <i className="ri-shield-check-line mr-1"></i>
                      Vérifié
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{supplier.business_name}</h3>
                      <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                        <i className="ri-star-fill mr-1 text-yellow-500"></i>
                        {supplier.rating?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{supplier.description || t('msg.no_description')}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">{supplier.category}</span>
                      <span className="text-gray-500 flex items-center">
                        <i className="ri-map-pin-line mr-1"></i>
                        {supplier.city}, {supplier.state}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <i className="ri-phone-line mr-1"></i>
                        {supplier.phone || 'Contact'}
                      </span>
                      <Link
                        to={`/supplier/${supplier._id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Voir détails
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="ri-store-2-line text-5xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('premium.no_suppliers')}</h3>
              <p className="text-gray-600">{t('premium.no_suppliers_desc')}</p>
            </div>
          )}
        </Container>
      </Section>

      {/* Newsletter Section */}
      <Section background="green-dark" padding="lg">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Restez informé des nouveautés</h2>
              <p className="text-white/90 mb-6 leading-relaxed">Recevez les dernières actualités sur les fournisseurs, les nouvelles entreprises et les opportunités d'affaires au Nigeria.</p>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-center">
                  <i className="ri-check-line text-lg mr-3"></i>
                  {t('newsletter.benefit1')}
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-lg mr-3"></i>
                  {t('newsletter.benefit2')}
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-lg mr-3"></i>
                  {t('newsletter.benefit3')}
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Inscription à la newsletter</h3>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                const sector = formData.get('sector') as string;

                try {
                  setIsSubscribing(true);
                  const result = await subscribeToNewsletter({
                    email,
                    name: name || undefined,
                    sector: sector || undefined,
                  });

                  if (result.success) {
                    setModalConfig({
                      title: 'Inscription réussie !',
                      message: result.alreadySubscribed
                        ? 'Vous êtes déjà inscrit à notre newsletter.'
                        : 'Merci de vous être abonné à notre newsletter. Un email de confirmation vous a été envoyé.',
                      icon: 'success'
                    });
                    setModalOpen(true);
                    (e.target as HTMLFormElement).reset();
                  } else {
                    setModalConfig({
                      title: 'Erreur',
                      message: result.message || 'Erreur lors de l\'inscription. Veuillez réessayer.',
                      icon: 'warning'
                    });
                    setModalOpen(true);
                  }
                } catch (error: any) {
                  const errorMessage = error?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
                  setModalConfig({
                    title: 'Erreur',
                    message: errorMessage,
                    icon: 'warning'
                  });
                  setModalOpen(true);
                } finally {
                  setIsSubscribing(false);
                }
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Votre nom complet"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="votre@email.com"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                  <select
                    name="sector"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm bg-white"
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
                  disabled={isSubscribing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <i className="ri-mail-line mr-2"></i>
                  {isSubscribing ? 'Inscription en cours...' : "S'abonner à la newsletter"}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <CTASection
        variant="dark"
        title="Vous êtes fournisseur ?"
        subtitle="Rejoignez des milliers de fournisseurs et développez votre activité"
        primaryAction={{
          onClick: handleAddBusinessClick,
          label: "Inscrire mon entreprise gratuitement",
          variant: 'primary',
        }}
        secondaryAction={{
          onClick: () => {
            const widget = document.querySelector('#vapi-widget-floating-button') as HTMLElement;
            if (widget) widget.click();
          },
          label: "Parler à un conseiller",
          icon: 'ri-chat-3-line',
          variant: 'secondary',
        }}
      />

      {/* Footer */}
      <Footer variant="dark" showLogo={false} />

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
