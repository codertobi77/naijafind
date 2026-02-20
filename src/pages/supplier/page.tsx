import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useConvexQuerySkippable, useConvexQuery } from '../../hooks/useConvexQuery';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/base';

interface Supplier {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  review_count: number;
  verified: boolean;
  image_url: string;
  image_gallery: string[];
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  user_name: string;
}


export default function SupplierDetail() {
  const { t } = useTranslation();
  useConvexAuth();
  const { id: supplierId } = useParams<{ id: string }>();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: '',
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  
  // Toast notification system
  const { toasts, showToast, removeToast } = useToast();
  const { data: supplierData, isLoading: supplierLoading, refetch: refetchSupplierData } = useConvexQuerySkippable(
    supplierId ? api.suppliers.getSupplierDetails : 'skip',
    supplierId ? { id: supplierId } : undefined,
    { staleTime: 5 * 60 * 1000 } // Cache supplier details for 5 minutes
  );
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  
  // Review mutation
  const createReviewMutation = useMutation(api.reviews.createReview);
  
  // Fetch similar suppliers based on category
  const [supplierCategory, setSupplierCategory] = useState<string | null>(null);
  const { data: similarSuppliersData } = useConvexQuerySkippable(
    supplierCategory ? api.suppliers.searchSuppliers : 'skip',
    supplierCategory ? { category: supplierCategory, limit: BigInt(4) } : undefined,
    { staleTime: 10 * 60 * 1000 } // Cache similar suppliers for 10 minutes
  );

  const [activeTab, setActiveTab] = useState('overview');
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract data from Convex response
  const supplier = supplierData?.supplier as any; // Type assertion for Convex supplier data
  const reviews = supplierData?.reviews || [];
  const loading = supplierLoading;
  
  // Process similar suppliers (exclude current supplier)
  const similarSuppliers = (similarSuppliersData?.suppliers || [])
    .filter((s: any) => s._id !== supplierId)
    .slice(0, 3)
    .map((s: any) => ({
      id: s._id || s.id,
      name: s.business_name || s.name || 'Supplier',
      category: s.category || '',
      rating: s.rating || 0,
      review_count: Number(s.reviews_count || 0),
      image_url: `${s.business_name || s.name} ${s.category} business Nigeria`,
    }));
  
  // Update category when supplier data is loaded
  useEffect(() => {
    if (supplier?.category && supplier.category !== supplierCategory) {
      setSupplierCategory(supplier.category);
    }
  }, [supplier?.category, supplierCategory]);


  const getDirections = () => {
    if (transformedSupplier) {
      const query = encodeURIComponent(`${transformedSupplier.address}, ${transformedSupplier.city}, ${transformedSupplier.state}, ${transformedSupplier.location}`);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
      window.open(url, '_blank');
    }
  };
  
  // Early returns for edge cases
  if (!supplierId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-6xl text-gray-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('supplier.missing_id')}</h2>
          <p className="text-gray-600 mb-6">{t('supplier.no_id_provided')}</p>
          <Link
            to="/search"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('supplier.back_to_search')}
          </Link>
        </div>
      </div>
    );
  }
  
  // Transform supplier data to match component interface
  const transformedSupplier: Supplier | null = supplier ? {
    id: supplier._id || supplierId,
    name: supplier.business_name || 'Supplier',
    description: supplier.description || '',
    category: supplier.category || '',
    location: supplier.location || `${supplier.city || ''}, ${supplier.state || ''}`.trim(),
    address: supplier.address || '',
    city: supplier.city || '',
    state: supplier.state || '',
    latitude: supplier.latitude || 0,
    longitude: supplier.longitude || 0,
    phone: supplier.phone || '',
    email: supplier.email || '',
    website: supplier.website,
    rating: supplier.rating || 0,
    review_count: Number(supplier.reviews_count || 0),
    verified: supplier.verified || false,
    image_url: supplier.image || `${supplier.business_name || 'business'} ${supplier.category || ''} Nigeria professional storefront`,
    image_gallery: supplier.imageGallery || [],
    created_at: supplier.created_at || new Date().toISOString(),
  } : null;
  
  const transformedReviews: Review[] = reviews.map((r: any) => ({
    id: r._id || r.id || '',
    rating: r.rating || 0,
    comment: r.comment || '',
    created_at: r.created_at || new Date().toISOString(),
    user_id: r.userId || '',
    user_name: 'Client', // Convex reviews don't include user names by default
  }));

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);

      const response = await fetch('https://readdy.ai/api/form/d3i6i9b2p8nb8r4n7e70', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showToast('success', t('supplier.contact_success'));
        setShowContactForm(false);
        (e.target as HTMLFormElement).reset();
      } else {
        showToast('error', t('supplier.contact_error'));
      }
    } catch (error) {
      console.error('Erreur d\'envoi du formulaire:', error);
      showToast('error', t('supplier.contact_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);

    try {
      await createReviewMutation({
        supplierId: supplierId || '',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      showToast('success', t('supplier.review_success'));
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: '' });
      
      // Refresh supplier data to show new review
      setTimeout(() => {
        refetchSupplierData();
      }, 500); // Small delay to ensure the backend has processed the review
    } catch (error: any) {
      console.error('Erreur d\'envoi de l\'avis:', error);
      showToast('error', t('supplier.review_error'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('supplier.loading')}</p>
        </div>
      </div>
    );
  }

  if (!transformedSupplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-6xl text-gray-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('supplier.not_found')}</h2>
          <p className="text-gray-600 mb-6">{t('supplier.not_exist')}</p>
          <Link
            to="/search"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('supplier.back_to_search')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-4 sm:mb-8 overflow-x-auto" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 sm:space-x-4 whitespace-nowrap">
            <li>
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                <i className="ri-home-line"></i>
              </Link>
            </li>
            <li>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </li>
            <li>
              <Link to="/search" className="text-gray-500 hover:text-gray-700 text-sm sm:text-base">
                {t('nav.search')}
              </Link>
            </li>
            <li>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </li>
            <li className="text-gray-900 font-medium text-sm sm:text-base truncate">{transformedSupplier.name}</li>
          </ol>
        </nav>

        {/* Status Messages - REMOVED: Now using Toast notifications */}

        {/* En-tête du fournisseur */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            <div className="w-full lg:w-1/3">
              <img
                src={transformedSupplier.image_url}
                alt={transformedSupplier.name}
                className="w-full h-48 sm:h-56 lg:h-64 object-cover object-top rounded-lg"
                onError={(e) => {
                  // Fallback to generated image if the actual image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(transformedSupplier.image_url)}&width=400&height=300&seq=detail-${transformedSupplier.id}&orientation=landscape`;
                  target.onerror = null; // Prevent infinite loop
                }}
              />
            </div>

            <div className="w-full lg:w-2/3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <span className="break-words">{transformedSupplier.name}</span>
                    {transformedSupplier.verified && (
                      <span className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center w-fit">
                        <i className="ri-verified-badge-fill mr-1"></i>
                        {t('supplier.verified')}
                      </span>
                    )}
                  </h1>
                  <p className="text-green-600 text-base sm:text-lg font-medium">{transformedSupplier.category}</p>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 bg-yellow-50 px-3 py-2 rounded-lg w-fit sm:ml-auto">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`ri-star-${star <= transformedSupplier.rating ? 'fill' : 'line'} text-yellow-400 text-sm sm:text-base`}
                        ></i>
                      ))}
                    </div>
                    <span className="font-bold text-base sm:text-lg">{transformedSupplier.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">({transformedSupplier.review_count} {t('supplier.reviews_count')})</p>
                </div>
              </div>

              <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed">{transformedSupplier.description}</p>

              {/* Contact info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <i className="ri-map-pin-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl mt-1 flex-shrink-0"></i>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{t('supplier.address')}</div>
                    <div className="break-words text-xs sm:text-sm">{transformedSupplier.address}</div>
                    <div className="break-words text-xs sm:text-sm">
                      {transformedSupplier.city}, {transformedSupplier.state}
                    </div>
                    <div className="break-words text-xs sm:text-sm">{transformedSupplier.location}</div>
                  </div>
                </div>

                <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <i className="ri-phone-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{t('supplier.phone')}</div>
                    <a href={`tel:${transformedSupplier.phone}`} className="text-green-600 hover:underline break-all text-xs sm:text-sm">
                      {transformedSupplier.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <i className="ri-mail-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{t('supplier.email')}</div>
                    <a href={`mailto:${transformedSupplier.email}`} className="text-green-600 hover:underline break-all text-xs sm:text-sm">
                      {transformedSupplier.email}
                    </a>
                  </div>
                </div>

                {transformedSupplier.website && (
                  <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <i className="ri-global-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{t('supplier.website')}</div>
                      <a
                        href={transformedSupplier.website.startsWith('http') ? transformedSupplier.website : `https://${transformedSupplier.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline break-all block text-xs sm:text-sm"
                      >
                        {transformedSupplier.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => setShowContactForm(true)}
                  className="bg-green-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-mail-line mr-1 sm:mr-2"></i>
                  {t('supplier.contact')}
                </button>
                <a
                  href={`tel:${transformedSupplier.phone}`}
                  className="bg-blue-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-phone-line mr-1 sm:mr-2"></i>
                  {t('supplier.call')}
                </a>
                <button
                  onClick={() => (document.querySelector('#vapi-widget-floating-button') as HTMLElement)?.click?.()}
                  className="bg-purple-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-calendar-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">{t('supplier.schedule')}</span>
                </button>
                {transformedSupplier.website && (
                  <a
                    href={transformedSupplier.website.startsWith('http') ? transformedSupplier.website : `https://${transformedSupplier.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                  >
                    <i className="ri-global-line mr-1 sm:mr-2"></i>
                    <span className="hidden sm:inline">{t('supplier.visit_website')}</span>
                    <span className="sm:hidden">{t('supplier.website')}</span>
                  </a>
                )}
                <button className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base">
                  <i className="ri-share-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">{t('supplier.share')}</span>
                  <span className="sm:hidden">{t('supplier.share')}</span>
                </button>
                <button className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base">
                  <i className="ri-heart-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">{t('supplier.favorite')}</span>
                  <span className="sm:hidden">{t('supplier.favorite')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 px-4 sm:px-6 lg:px-8 min-w-max">
              {[
                { id: 'overview', label: t('supplier.overview'), icon: 'ri-information-line' },
                { id: 'reviews', label: `${t('supplier.reviews')} (${transformedReviews.length})`, icon: 'ri-star-line' },
                { id: 'location', label: t('supplier.location'), icon: 'ri-map-pin-line' },
                { id: 'contact', label: t('supplier.contact'), icon: 'ri-phone-line' },
                { id: 'gallery', label: t('supplier.gallery'), icon: 'ri-image-line' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`${tab.icon} mr-1 sm:mr-2`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === 'overview' && t('supplier.overview')}
                    {tab.id === 'reviews' && `${t('supplier.reviews')} (${transformedReviews.length})`}
                    {tab.id === 'location' && t('supplier.location')}
                    {tab.id === 'contact' && t('supplier.contact')}
                    {tab.id === 'gallery' && t('supplier.gallery')}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{t('supplier.about')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  <div className="lg:col-span-2">
                    <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg leading-relaxed">{transformedSupplier.description}</p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center text-sm sm:text-base">
                        <i className="ri-information-line mr-2"></i>
                        {t('supplier.important_info')}
                      </h4>
                      <ul className="space-y-2 text-green-800 text-xs sm:text-sm">
                        <li className="flex items-center">
                          <i className="ri-check-line mr-2 text-green-600 flex-shrink-0"></i>
                          {t('supplier.verified_by_olufinja')}
                        </li>
                        <li className="flex items-center">
                          <i className="ri-check-line mr-2 text-green-600 flex-shrink-0"></i>
                          {t('supplier.quick_response')}
                        </li>
                        <li className="flex items-center">
                          <i className="ri-check-line mr-2 text-green-600 flex-shrink-0"></i>
                          {t('supplier.quality_service')}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                        <i className="ri-star-fill text-3xl sm:text-4xl text-yellow-500 mb-3"></i>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{transformedSupplier.rating}</div>
                        <div className="text-yellow-700 font-medium text-xs sm:text-sm">{t('supplier.avg_rating')}</div>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <i className="ri-chat-3-line text-3xl sm:text-4xl text-blue-500 mb-3"></i>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{transformedSupplier.review_count}</div>
                        <div className="text-blue-700 font-medium text-xs sm:text-sm">{t('supplier.customer_reviews')}</div>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <i className="ri-verified-badge-line text-3xl sm:text-4xl text-green-500 mb-3"></i>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900">
                          {transformedSupplier.verified ? t('supplier.verified') : t('status.pending')}
                        </div>
                        <div className="text-green-700 font-medium text-xs sm:text-sm">{t('supplier.status')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                  <h3 className="text-lg sm:text-xl font-semibold">{t('supplier.reviews')} ({transformedReviews.length})</h3>
                  <SignedIn>
                    <button 
                      onClick={() => setShowReviewForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                      <i className="ri-add-line mr-2"></i>
                      {t('supplier.leave_review')}
                    </button>
                  </SignedIn>
                  <SignedOut>
                    <Link 
                      to="/auth/login" 
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                      <i className="ri-login-box-line mr-2"></i>
                      {t('supplier.login_to_review')}
                    </Link>
                  </SignedOut>
                </div>
                
                {transformedReviews.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {transformedReviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="ri-user-line text-green-600 text-sm sm:text-base"></i>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                {review.user_name}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <i
                                      key={star}
                                      className={`ri-star-${star <= review.rating ? 'fill' : 'line'} text-yellow-400 text-sm`}
                                    ></i>
                                  ))}
                                </div>
                                <span className="font-medium text-gray-700 text-sm">{review.rating}/5</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs sm:text-sm">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <i className="ri-chat-3-line text-4xl sm:text-6xl text-gray-400 mb-4"></i>
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('supplier.no_reviews')}</h4>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{t('supplier.first_review')}</p>
                    <button className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base">
                      {t('supplier.first_review_button')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{t('supplier.location_access')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  <div className="lg:col-span-2">
                    <div className="bg-gray-100 rounded-lg h-64 sm:h-80 lg:h-96 mb-4 sm:mb-6">
                      <iframe
                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7708!2d${supplier.longitude}!3d${supplier.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMzEnMjcuOCJOIDPCsDIyJzQ1LjEiRQ!5e0!3m2!1sen!2s!4v1234567890`}
                        width="100%"
                        height="100%"
                        style={{ border: 0, borderRadius: '8px' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-sm sm:text-base">
                        <i className="ri-map-pin-line mr-2 text-green-600"></i>
                        {t('supplier.address')}
                      </h4>
                      <div className="space-y-2 text-gray-700 text-xs sm:text-sm">
                        <div className="font-medium">{supplier.name}</div>
                        <div>{supplier.address}</div>
                        <div>
                          {supplier.city}, {supplier.state}
                        </div>
                        <div>{supplier.location}</div>
                      </div>
                      <button 
                        onClick={getDirections}
                        className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <i className="ri-navigation-line mr-2"></i>
                        {t('supplier.get_directions')}
                      </button>
                    </div>

                    {supplier.website && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-sm sm:text-base">
                          <i className="ri-global-line mr-2 text-green-600"></i>
                          {t('supplier.website')}
                        </h4>
                        <div className="space-y-2 text-gray-700">
                          <a
                            href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline break-all block text-xs sm:text-sm"
                          >
                            {supplier.website}
                          </a>
                        </div>
                        <a
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap block text-center text-sm sm:text-base"
                        >
                          <i className="ri-external-link-line mr-2"></i>
                          {t('supplier.visit_website')}
                        </a>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center text-sm sm:text-base">
                        <i className="ri-information-line mr-2"></i>
                        {t('supplier.practical_info')}
                      </h4>
                      <ul className="space-y-2 text-blue-800 text-xs sm:text-sm">
                        <li className="flex items-center">
                          <i className="ri-time-line mr-2 flex-shrink-0"></i>
                          {t('supplier.hours')}
                        </li>
                        <li className="flex items-center">
                          <i className="ri-car-line mr-2 flex-shrink-0"></i>
                          {t('supplier.parking')}
                        </li>
                        <li className="flex items-center">
                          <i className="ri-wheelchair-line mr-2 flex-shrink-0"></i>
                          {t('supplier.accessibility')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{t('supplier.contact_info')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <i className="ri-phone-line text-xl sm:text-2xl text-green-600"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">{t('supplier.phone')}</div>
                          <a href={`tel:${supplier.phone}`} className="text-green-600 hover:underline text-sm sm:text-lg break-all">
                            {supplier.phone}
                          </a>
                        </div>
                      </div>
                      <a
                        href={`tel:${supplier.phone}`}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap block text-center text-sm sm:text-base"
                      >
                        <i className="ri-phone-line mr-2"></i>
                        {t('supplier.call_now')}
                      </a>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <i className="ri-mail-line text-xl sm:text-2xl text-blue-600"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">{t('supplier.email')}</div>
                          <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline break-all text-xs sm:text-sm">
                            {supplier.email}
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowContactForm(true)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <i className="ri-mail-send-line mr-2"></i>
                        {t('supplier.send_message')}
                      </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <i className="ri-map-pin-line text-xl sm:text-2xl text-orange-600"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">{t('supplier.address')}</div>
                          <div className="text-gray-600 text-xs sm:text-sm">
                            <div>{supplier.address}</div>
                            <div>
                              {supplier.city}, {supplier.state}
                            </div>
                            <div>{supplier.location}</div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={getDirections}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <i className="ri-navigation-line mr-2"></i>
                        {t('supplier.itinerary')}
                      </button>
                    </div>

                    {supplier.website && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-4">
                          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                            <i className="ri-global-line text-xl sm:text-2xl text-purple-600"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">{t('supplier.website')}</div>
                            <a
                              href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline break-all block text-xs sm:text-sm"
                            >
                              {supplier.website}
                            </a>
                          </div>
                        </div>
                        <a
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap block text-center text-sm sm:text-base"
                        >
                          <i className="ri-external-link-line mr-2"></i>
                          {t('supplier.open_website')}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">{t('supplier.schedule')}</h4>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">
                      {t('supplier.schedule')} {transformedSupplier?.name}.
                    </p>
                    <button
                      onClick={() => (document.querySelector('#vapi-widget-floating-button') as HTMLElement)?.click?.()}
                      className="w-full bg-purple-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                      <i className="ri-calendar-line mr-2"></i>
                      {t('supplier.schedule')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{t('supplier.photos')}</h3>
                {transformedSupplier?.image_gallery && transformedSupplier.image_gallery.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {transformedSupplier.image_gallery.map((image, index) => (
                      <div 
                        key={index} 
                        className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => {
                          // In a real implementation, you might want to open a lightbox or modal
                          // to show the full-size image
                        }}
                      >
                        <img
                          src={image}
                          alt={`${transformedSupplier?.name} - Photo ${index + 1}`}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to generated image if the actual image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(transformedSupplier?.name || 'business')}&width=400&height=400&seq=gallery-${index}&orientation=squarish`;
                            target.onerror = null; // Prevent infinite loop
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="ri-image-line text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600">{t('supplier.no_photos')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Entreprises similaires */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">{t('supplier.similar_businesses')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {similarSuppliers.map((similarSupplier) => {
              const imageQuery = encodeURIComponent(similarSupplier.image_url);
              return (
                <div key={similarSupplier.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <img
                      src={`https://readdy.ai/api/search-image?query=${imageQuery}&width=60&height=60&seq=similar-${similarSupplier.id}&orientation=squarish`}
                      alt={similarSupplier.name}
                      className="w-10 sm:w-12 h-10 sm:h-12 object-cover object-top rounded-lg mr-3 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {similarSupplier.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">{similarSupplier.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i key={star} className={`ri-star-${star <= similarSupplier.rating ? 'fill' : 'line'} text-yellow-400 text-xs sm:text-sm`}></i>
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 ml-1">{similarSupplier.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500 ml-1">({similarSupplier.review_count})</span>
                    </div>
                    <Link
                      to={`/supplier/${similarSupplier.id}`}
                      className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      {t('supplier.see_details')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de contact */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold">{t('supplier.contact_form_title')} {transformedSupplier?.name}</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="ri-close-line text-lg sm:text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'avis */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold">{t('supplier.leave_review_for')} {transformedSupplier?.name}</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="ri-close-line text-lg sm:text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.rating')} *
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="text-2xl focus:outline-none"
                    >
                      <i className={`ri-star-${star <= reviewForm.rating ? 'fill' : 'line'} ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                    </button>
                  ))}
                </div>
                {reviewForm.rating > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {reviewForm.rating} {reviewForm.rating === 1 ? t('supplier.star') : t('supplier.stars')}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.comment')}
                </label>
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_comment')}
                  maxLength={500}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  {reviewForm.comment.length}/500 {t('supplier.characters')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                >
                  {t('supplier.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || reviewForm.rating === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50 text-xs sm:text-sm"
                >
                  {reviewSubmitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      {t('supplier.submitting')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line mr-2"></i>
                      {t('supplier.submit_review')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de contact */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold">{t('supplier.contact_form_title')} {transformedSupplier?.name}</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="ri-close-line text-lg sm:text-xl"></i>
              </button>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="space-y-4"
              data-readdy-form
              id={`contact-supplier-${transformedSupplier?.id}`}
            >
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.your_name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_name')}
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_email')}
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.phone_number')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_phone')}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.subject')} *
                </label>
                <select
                  name="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8 text-xs sm:text-sm"
                  required
                >
                  <option value="">{t('supplier.select_subject')}</option>
                  <option value="Demande de devis">{t('supplier.quote_request')}</option>
                  <option value="Information produit">{t('supplier.product_info')}</option>
                  <option value="Partenariat">{t('supplier.partnership')}</option>
                  <option value="Support">{t('supplier.support')}</option>
                  <option value="Autre">{t('supplier.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.message')} *
                </label>
                <textarea
                  rows={4}
                  name="message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_message')}
                  maxLength={500}
                  required
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">{t('supplier.max_characters')}</p>
              </div>

              <input type="hidden" name="supplier_name" value={transformedSupplier?.name} />
              <input type="hidden" name="supplier_id" value={transformedSupplier?.id} />
              <input type="hidden" name="supplier_email" value={transformedSupplier?.email} />

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                >
                  {t('supplier.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      {t('supplier.sending')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line mr-2"></i>
                      {t('supplier.send')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}