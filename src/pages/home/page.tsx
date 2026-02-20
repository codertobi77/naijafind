import React, { useState, useEffect, useRef } from 'react';
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
    <Section background="gradient">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h2>
            <p className="text-lg text-green-100 mb-6">{subtitle}</p>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-xl mr-3"></i>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Inscription à la newsletter</h3>
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
              <FormInput
                label="Nom complet"
                name="name"
                placeholder="Votre nom complet"
                required
              />
              <FormInput
                type="email"
                label="Email"
                name="email"
                placeholder="votre@email.com"
                required
              />
              <FormSelect
                label="Secteur d'activité"
                name="sector"
                options={sectorOptions}
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="w-full bg-green-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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

// Categories Carousel Component
interface CategoriesCarouselProps {
  categories: Array<{ _id: string; name: string; description?: string; image?: string; icon?: string }> | undefined;
  t: (key: string) => string;
}

function CategoriesCarousel({ categories, t }: CategoriesCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const categoriesPerSlide = 3;
  const totalSlides = categories ? Math.ceil(categories.length / categoriesPerSlide) : 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  if (!categories || categories.length === 0) return null;

  return (
    <Section background="green">
      <Container>
        <SectionTitle
          title={t('categories.title')}
          subtitle={t('categories.subtitle')}
          align="center"
        />

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
                      .slice(slideIndex * categoriesPerSlide, (slideIndex + 1) * categoriesPerSlide)
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
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_CATEGORY_IMAGE;
                                target.onerror = null;
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
                    className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? 'bg-green-600 w-8' : 'bg-gray-300'}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Container>
    </Section>
  );
}

// Featured Suppliers Section Component
interface FeaturedSuppliersSectionProps {
  featuredSuppliers: Supplier[];
  featuredSuppliersData: unknown;
  t: (key: string) => string;
}

function FeaturedSuppliersSection({ featuredSuppliers, featuredSuppliersData, t }: FeaturedSuppliersSectionProps) {
  return (
    <Section background="white">
      <Container>
        <SectionTitle
          title={t('featured.title')}
          subtitle={t('featured.subtitle')}
          align="center"
        />

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
                        const target = e.target as HTMLImageElement;
                        target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=featured-${supplier._id}&orientation=landscape`;
                        target.onerror = null;
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
      </Container>
    </Section>
  );
}

// Search Hero Component
interface SearchHeroProps {
  t: (key: string) => string;
  searchQuery: string;
  searchLocation: string;
  category: string;
  categories: Array<{ _id: string; name: string }> | undefined;
  setSearchQuery: (value: string) => void;
  setSearchLocation: (value: string) => void;
  setCategory: (value: string) => void;
  onSearch: () => void;
}

function SearchHero({ t, searchQuery, searchLocation, category, categories, setSearchQuery, setSearchLocation, setCategory, onSearch }: SearchHeroProps) {
  return (
    <HeroSection
      backgroundImage="https://readdy.ai/api/search-image?query=Modern%20Nigerian%20marketplace%20with%20vendors%20selling%20colorful%20products%2C%20bustling%20commercial%20district%20in%20Lagos%20with%20traditional%20and%20modern%20buildings%2C%20vibrant%20street%20scene%20with%20people%20shopping%2C%20warm%20golden%20lighting%2C%20professional%20photography%20style%2C%20clean%20organized%20market%20stalls&width=1200&height=600&seq=hero-nigeria&orientation=landscape"
      overlay="from-black/60 via-black/50 to-black/40"
      badge={{ icon: '', text: 'Trusted by 25,000+ Nigerian businesses', showPulse: true }}
      title={t('hero.title')}
      subtitle={t('hero.subtitle')}
    >
      {/* Search Form */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="ri-search-line mr-1"></i>{t('hero.search_placeholder')}
            </label>
            <FormInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('hero.search_placeholder')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="ri-map-pin-line mr-1"></i>{t('label.location')}
            </label>
            <FormInput
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder={t('hero.location_placeholder')}
              className="w-full"
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
        setSearchQuery={setSearchQuery}
        setSearchLocation={setSearchLocation}
        setCategory={setCategory}
        onSearch={handleSearch}
      />

      {/* Stats Section */}
      <Section background="white" padding="md">
        <Container>
          <StatsGrid columns={4}>
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </StatsGrid>
        </Container>
      </Section>

      {/* Categories Carousel */}
      <CategoriesCarousel categories={categories} t={t} />

      {/* Featured Suppliers Section */}
      <FeaturedSuppliersSection
        featuredSuppliers={featuredSuppliers}
        featuredSuppliersData={featuredSuppliersData}
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
