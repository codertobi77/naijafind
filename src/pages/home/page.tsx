import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { useConvexAuth, useMutation } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import Modal from '../../components/base/Modal';
import { HeroSection, Section, Container, Footer } from '../../components/layout';
import { SectionTitle, StatCard, StatsGrid, CTASection } from '../../components/ui';
import { FormInput, FormSelect } from '../../components/forms';

// Default category image URL for fallback
const DEFAULT_CATEGORY_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Cg transform='translate(200,150)'%3E%3Cpath d='M-60-80h120v160h-120zM-40-100h80v20h-80zM-30-90h20v-20h-20z' fill='%239ca3af'/%3E%3Cpath d='M-40-40h80v20h-80zM-40-10h80v20h-80zM-40 20h60v20h-60z' fill='%23d1d5db'/%3E%3C/g%3E%3C/svg%3E";

// Define proper TypeScript interface for Supplier based on Convex schema
type Supplier = Doc<"suppliers">;

// Newsletter Section Component
interface NewsletterSectionProps {
  title: string;
  subtitle: string;
  benefits: string[];
  subscribeToNewsletter: (args: { email: string; name?: string; sector?: string }) => Promise<{ success: boolean; message: string; alreadySubscribed?: boolean }>;
  isSubscribing: boolean;
  setIsSubscribing: (value: boolean) => void;
  setModalConfig: (config: { title: string; message: string; icon: 'success' | 'info' | 'warning' }) => void;
  setModalOpen: (open: boolean) => void;
}

function NewsletterSection({ title, subtitle, benefits, subscribeToNewsletter, isSubscribing, setIsSubscribing, setModalConfig, setModalOpen }: NewsletterSectionProps) {
  const sectorOptions = [
    { value: '', label: 'Sélectionnez votre secteur' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Textile', label: 'Textile' },
    { value: 'Électronique', label: 'Électronique' },
    { value: 'Alimentation', label: 'Alimentation' },
    { value: 'Construction', label: 'Construction' },
    { value: 'Automobile', label: 'Automobile' },
    { value: 'Autre', label: 'Autre' },
  ];

  return (
    <Section background="green">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Restez informé des nouveautés</h2>
            <p className="text-base sm:text-lg text-white/90 mb-6">Recevez les dernières actualités sur les fournisseurs, les nouvelles entreprises et les opportunités d'affaires au Nigeria.</p>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-white/90">
                  <i className="ri-check-line text-lg mr-3"></i>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-lg">
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
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                <select
                  name="sector"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500 text-sm bg-white"
                >
                  {sectorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
  );
}

// Categories Carousel Component - REMOVED (no longer used)
// interface CategoriesCarouselProps {
//   categories: Array<{ _id: string; name: string; description?: string; image?: string; icon?: string }> | undefined;
//   t: (key: string) => string;
// }

// Categories Carousel Component - REMOVED (no longer used)
// function CategoriesCarousel({ categories, t }: CategoriesCarouselProps) { ... }

// Premium Suppliers Section Component with auto-scroll
interface PremiumSuppliersSectionProps {
  premiumSuppliers: Supplier[];
  premiumSuppliersData: unknown;
  t: (key: string) => string;
}

function PremiumSuppliersSection({ premiumSuppliers, premiumSuppliersData, t }: PremiumSuppliersSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!scrollRef.current || premiumSuppliers.length <= 4) return;

    const scrollContainer = scrollRef.current;
    let scrollAmount = 0;
    const scrollStep = 0.5;
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    const interval = setInterval(() => {
      if (!isPaused && maxScroll > 0) {
        scrollAmount += scrollStep;
        if (scrollAmount >= maxScroll) {
          scrollAmount = 0;
        }
        scrollContainer.scrollLeft = scrollAmount;
      }
    }, 30);

    return () => clearInterval(interval);
  }, [premiumSuppliers.length, isPaused]);

  // Duplicate suppliers for infinite scroll effect
  const displaySuppliers = premiumSuppliers.length > 4 
    ? [...premiumSuppliers, ...premiumSuppliers] 
    : premiumSuppliers;

  return (
    <Section background="white">
      <Container>
        <SectionTitle
          title={t('premium.title')}
          subtitle={t('premium.subtitle')}
          centered
        />

        {premiumSuppliersData === undefined ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : premiumSuppliers.length > 0 ? (
          <div className="relative">
            {/* Gradient overlays for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollBehavior: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {displaySuppliers.map((supplier: Supplier, index: number) => (
                <div 
                  key={`${supplier._id}-${index}`} 
                  className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                >
                  <div className="relative h-48 overflow-hidden">
                    {supplier.image ? (
                      <img
                        src={supplier.image}
                        alt={supplier.business_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=premium-${supplier._id}&orientation=landscape`;
                          target.onerror = null;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=premium-${supplier._id}&orientation=landscape`}
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
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                        {supplier.business_name}
                      </h3>
                      <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                        <i className="ri-star-fill mr-1 text-yellow-500"></i>
                        {supplier.rating?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {supplier.description || t('msg.no_description')}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full truncate max-w-[100px]">
                        {supplier.category}
                      </span>
                      <span className="flex items-center flex-shrink-0">
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
  );
}

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
    { icon: 'ri-map-pin-line', iconColor: 'text-blue-600', iconBg: 'from-blue-100 to-indigo-100', value: '36', label: t('stats.states') },
    { icon: 'ri-shopping-cart-line', iconColor: 'text-purple-600', iconBg: 'from-purple-100 to-pink-100', value: '1.2M+', label: t('stats.transactions') },
    { icon: 'ri-star-line', iconColor: 'text-yellow-600', iconBg: 'from-yellow-100 to-orange-100', value: '4.8', label: t('stats.rating') },
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
          <StatsGrid stats={stats} columns={4} />
        </Container>
      </Section>

      {/* Premium Suppliers Section */}
      <PremiumSuppliersSection
        premiumSuppliers={featuredSuppliers}
        premiumSuppliersData={featuredSuppliersData}
        t={t}
      />

      {/* Newsletter Section */}
      <NewsletterSection
        title={t('newsletter.title')}
        subtitle={t('newsletter.subtitle')}
        benefits={newsletterBenefits}
        subscribeToNewsletter={subscribeToNewsletter}
        isSubscribing={isSubscribing}
        setIsSubscribing={setIsSubscribing}
        setModalConfig={setModalConfig}
        setModalOpen={setModalOpen}
      />

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
