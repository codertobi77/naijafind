import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useConvexQuerySkippable, useConvexQuery } from '../../hooks/useConvexQuery';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { SupplierAvatar } from '../../components/SupplierImage';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useDeepLTranslation } from '../../hooks/useDeepLTranslation';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/base';
import type { Map, Popup } from 'mapbox-gl';

/**
 * Composant pour afficher du texte traduisible avec DeepL
 * avec option pour voir l'original
 */
function TranslatableDescription({ text, maxLength = 300 }: { text: string; maxLength?: number }) {
  const { translate, isTranslating } = useDeepLTranslation();
  const { t, i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const currentLanguage = i18n.language;

  useEffect(() => {
    const loadTranslation = async () => {
      if (!text || currentLanguage === 'en') {
        setTranslatedText(null);
        return;
      }

      const result = await translate(text, currentLanguage as 'en' | 'fr', 'en');
      setTranslatedText(result);
    };

    loadTranslation();
  }, [text, currentLanguage, translate]);

  if (!text) {
    return <p className="text-gray-500 italic">{t('msg.no_description')}</p>;
  }

  const hasTranslation = translatedText && translatedText !== text;
  const displayText = showOriginal || !hasTranslation ? text : translatedText;
  const isLong = displayText.length > maxLength;
  const [expanded, setExpanded] = useState(false);

  const truncatedText = isLong && !expanded 
    ? displayText.substring(0, maxLength) + '...' 
    : displayText;

  return (
    <div className="relative">
      <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
        {truncatedText}
      </p>
      
      {isTranslating && (
        <span className="inline-flex items-center ml-2">
          <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
        </span>
      )}

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-green-600 hover:text-green-800 text-sm mt-2 font-medium"
        >
          {expanded ? t('btn.show_less') : t('btn.show_more')}
        </button>
      )}

      {hasTranslation && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showOriginal ? t('translation.view_translation') : t('translation.view_original')}
          </button>
          <span className="text-xs text-gray-400">• {t('translation.translated_by')}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Composant pour afficher un commentaire de review traduisible
 * Affiche automatiquement dans la langue du navigateur, avec possibilité de voir l'original
 */
function TranslatableReviewComment({ 
  comment, 
  sourceLanguage 
}: { 
  comment: string; 
  sourceLanguage?: string;
}) {
  const { translate, isTranslating } = useDeepLTranslation();
  const { t, i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const currentLanguage = i18n.language;

  useEffect(() => {
    const loadTranslation = async () => {
      if (!comment) {
        setTranslatedText(null);
        return;
      }

      // Si on a une langue source et qu'elle est différente de la langue actuelle, traduire
      const sourceLang = sourceLanguage || 'en';
      const targetLang = currentLanguage.startsWith('fr') ? 'fr' : 'en';
      
      // Ne pas traduire si la langue source est la même que la langue cible
      if (sourceLang === targetLang) {
        setTranslatedText(null);
        return;
      }

      const result = await translate(comment, targetLang, sourceLang);
      setTranslatedText(result);
    };

    loadTranslation();
  }, [comment, currentLanguage, translate, sourceLanguage]);

  const hasTranslation = translatedText && translatedText !== comment;
  // Par défaut, afficher la traduction (langue du navigateur), sauf si l'utilisateur clique pour voir l'original
  const displayText = showOriginal ? comment : (hasTranslation ? translatedText : comment);

  return (
    <div className="relative">
      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{displayText}</p>
      
      {isTranslating && (
        <span className="absolute -right-6 top-0">
          <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full inline-block" />
        </span>
      )}

      {hasTranslation && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showOriginal ? t('translation.view_translation') : t('translation.view_original')}
          </button>
          <span className="text-xs text-gray-400">• {t('translation.translated_from')} ({sourceLanguage?.toUpperCase() || 'EN'})</span>
        </div>
      )}
    </div>
  );
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Dynamically import mapbox-gl only when needed
let mapboxglPromise: Promise<typeof import('mapbox-gl')> | null = null;
const getMapboxgl = () => {
  if (!mapboxglPromise) {
    mapboxglPromise = import('mapbox-gl').then((mod) => {
      // Dynamically import CSS
      import('mapbox-gl/dist/mapbox-gl.css');
      return mod;
    });
  }
  return mapboxglPromise;
};

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
  business_type: string;
  created_at: string;
  userId?: string; // For internal messaging
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  user_name: string;
  sourceLanguage?: string; // Langue détectée du commentaire
}

// Supplier Mapbox Map Component
function SupplierMapboxMap({ latitude, longitude, name }: { latitude: number; longitude: number; name: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        const mapboxgl = await getMapboxgl();
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [longitude, latitude],
          zoom: 15,
          pitch: 45,
          bearing: -17.6,
          antialias: true
        });

        mapInstanceRef.current = map;

        map.on('load', () => {
          map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          
          map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
          
          if (!map.getLayer('3d-buildings')) {
            map.addLayer({
              'id': '3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 12,
              'paint': {
                'fill-extrusion-color': '#d4a574',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.8,
                'fill-extrusion-vertical-gradient': true,
                'fill-extrusion-ambient-occlusion-intensity': 0.3
              }
            });
          }

          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '40px';
          el.style.height = '40px';
          el.innerHTML = `
            <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-3 border-white ring-2 ring-green-400">
              <i class="ri-store-2-line text-white text-sm"></i>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-3"><h3 class="font-semibold text-sm text-gray-900">${name}</h3></div>`
          );

          new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(popup)
            .addTo(map);
        });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, name]);

  return <div ref={mapRef} className="w-full h-full bg-gray-100 rounded-lg" />;
}

export default function SupplierDetail() {
  const { t } = useTranslation();
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
  // Review mutation
  const createReviewMutation = useMutation(api.reviews.createReview);
  const createContactRequestMutation = useMutation(api.notifications.createContactRequest);
  
  // Fetch products for the supplier
  const productsQueryResult = useConvexQuerySkippable(
    supplierId ? api.products.listProductsBySupplier : 'skip',
    supplierId ? { supplierId } : undefined
  );
  const productsData = productsQueryResult.data || [];
  const productsLoading = productsQueryResult.isLoading || false;
  
  // Fetch similar suppliers based on category
  const [supplierCategory, setSupplierCategory] = useState<string | null>(null);
  const { data: similarSuppliersData } = useConvexQuerySkippable(
    supplierCategory ? api.suppliers.searchSuppliers : 'skip',
    supplierCategory ? { category: supplierCategory, limit: BigInt(4) } : undefined,
    { staleTime: 10 * 60 * 1000 } // Cache similar suppliers for 10 minutes
  );

  const [activeTab, setActiveTab] = useState('overview');
  const [showContactForm, setShowContactForm] = useState(false);
  const [showInternalMessageForm, setShowInternalMessageForm] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingInternalMessage, setIsSendingInternalMessage] = useState(false);
  const [internalMessageForm, setInternalMessageForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  
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
    business_type: supplier.business_type || 'products', // Default to products
    created_at: supplier.created_at || new Date().toISOString(),
    userId: supplier.userId, // For internal messaging
  } : null;
  
  const transformedReviews: Review[] = reviews.map((r: any) => ({
    id: r._id || r.id || '',
    rating: r.rating || 0,
    comment: r.comment || '',
    created_at: r.created_at || new Date().toISOString(),
    user_id: r.userId || '',
    user_name: t('supplier.review_client') || 'Client', // Convex reviews don't include user names by default
    sourceLanguage: r.sourceLanguage,
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
      console.error(t('supplier.form_error'), error);
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
      console.error(t('supplier.review_send_error'), error);
      showToast('error', t('supplier.review_error'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleInternalMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transformedSupplier?.userId) {
      showToast('error', t('supplier.contact_error'));
      return;
    }

    setIsSendingInternalMessage(true);

    try {
      await createContactRequestMutation({
        supplierUserId: transformedSupplier.userId,
        customerName: internalMessageForm.name,
        customerEmail: internalMessageForm.email || undefined,
        customerPhone: internalMessageForm.phone || undefined,
        message: internalMessageForm.message,
      });

      showToast('success', t('supplier.message_sent_success'));
      setShowInternalMessageForm(false);
      setInternalMessageForm({ name: '', email: '', phone: '', message: '' });
    } catch (error: any) {
      console.error(t('supplier.message_send_error'), error);
      showToast('error', t('supplier.message_sent_error'));
    } finally {
      setIsSendingInternalMessage(false);
    }
  };

  // Add timeout for loading to prevent infinite loading screen
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
      }
    }, 15000); // 15 seconds max for supplier loading
    
    return () => clearTimeout(timer);
  }, [loading]);

  // Loading state with timeout protection
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('supplier.loading')}</p>
        </div>
      </div>
    );
  }

  // Show error if loading takes too long
  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4">
            <i className="ri-time-line text-3xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('supplier.loading_timeout_title')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('supplier.loading_timeout_desc')}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              {t('supplier.retry')}
            </button>
            <Link
              to="/search"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('supplier.back_to_search')}
            </Link>
          </div>
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

              <TranslatableDescription text={transformedSupplier.description} maxLength={300} />

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
                    {transformedSupplier.phone ? (
                      <a href={`tel:${transformedSupplier.phone}`} className="text-green-600 hover:underline break-all text-xs sm:text-sm">
                        {transformedSupplier.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic text-xs sm:text-sm">{t('supplier.no_phone')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <i className="ri-mail-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{t('supplier.email')}</div>
                    {transformedSupplier.email ? (
                      <a href={`mailto:${transformedSupplier.email}`} className="text-green-600 hover:underline break-all text-xs sm:text-sm">
                        {transformedSupplier.email}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic text-xs sm:text-sm">{t('supplier.no_email')}</span>
                    )}
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
                {/* Three contact methods */}
                <a
                  href={`tel:${transformedSupplier.phone}`}
                  className="bg-blue-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-phone-line mr-1 sm:mr-2"></i>
                  {t('supplier.call')}
                </a>
                <a
                  href={`https://wa.me/${transformedSupplier.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-whatsapp-line mr-1 sm:mr-2"></i>
                  WhatsApp
                </a>
                <SignedIn>
                  <button
                    onClick={() => setShowInternalMessageForm(true)}
                    className="bg-purple-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                  >
                    <i className="ri-mail-send-line mr-1 sm:mr-2"></i>
                    {t('supplier.internal_message')}
                  </button>
                </SignedIn>
                <SignedOut>
                  <Link
                    to="/auth/login"
                    className="bg-purple-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                  >
                    <i className="ri-mail-send-line mr-1 sm:mr-2"></i>
                    {t('supplier.internal_message')}
                  </Link>
                </SignedOut>
                
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
                <button 
                  title={t('supplier.feature_not_available')}
                  className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base cursor-not-allowed opacity-60"
                >
                  <i className="ri-share-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">{t('supplier.share')}</span>
                  <span className="sm:hidden">{t('supplier.share')}</span>
                </button>
                <button 
                  title={t('supplier.feature_not_available')}
                  className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base cursor-not-allowed opacity-60"
                >
                  <i className="ri-heart-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">{t('supplier.favorite')}</span>
                  <span className="sm:hidden">{t('supplier.favorite')}</span>
                </button>
                
                {/* Claim Business Button */}
                <SignedOut>
                  <Link
                    to="/auth/login"
                    className="bg-orange-500 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                  >
                    <i className="ri-shield-user-line mr-1 sm:mr-2"></i>
                    {t('supplier.claim_business')}
                  </Link>
                </SignedOut>
                <SignedIn>
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="bg-orange-500 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                  >
                    <i className="ri-shield-user-line mr-1 sm:mr-2"></i>
                    {t('supplier.claim_business')}
                  </button>
                </SignedIn>
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
                {
                  id: transformedSupplier?.business_type === 'services' ? 'gallery' : 'products',
                  label: transformedSupplier?.business_type === 'services' ? t('supplier.gallery') : t('supplier.products'),
                  icon: transformedSupplier?.business_type === 'services' ? 'ri-image-line' : 'ri-product-hunt-line'
                }
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
                    {tab.id === 'products' && t('supplier.products')}
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
                    <TranslatableDescription text={transformedSupplier.description} maxLength={500} />

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center text-sm sm:text-base">
                        <i className="ri-information-line mr-2"></i>
                        {t('supplier.important_info')}
                      </h4>
                      <ul className="space-y-2 text-green-800 text-xs sm:text-sm">
                        <li className="flex items-center">
                          <i className="ri-check-line mr-2 text-green-600 flex-shrink-0"></i>
                          {t('supplier.verified_by_suji')}
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
                        <TranslatableReviewComment comment={review.comment} sourceLanguage={review.sourceLanguage} />
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
                    <div className="bg-gray-100 rounded-lg h-64 sm:h-80 lg:h-96 mb-4 sm:mb-6 overflow-hidden">
                      {transformedSupplier?.latitude && transformedSupplier?.longitude ? (
                        <SupplierMapboxMap 
                          latitude={transformedSupplier.latitude} 
                          longitude={transformedSupplier.longitude} 
                          name={transformedSupplier.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <i className="ri-map-pin-line text-4xl mb-2"></i>
                            <p>{t('supplier.location_not_available')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-sm sm:text-base">
                        <i className="ri-map-pin-line mr-2 text-green-600"></i>
                        {t('supplier.address')}
                      </h4>
                      <div className="space-y-2 text-gray-700 text-xs sm:text-sm">
                        <div className="font-medium">{transformedSupplier?.name}</div>
                        <div>{transformedSupplier?.address}</div>
                        <div>
                          {transformedSupplier?.city}, {transformedSupplier?.state}
                        </div>
                        <div>{transformedSupplier?.location}</div>
                      </div>
                    </div>

                    {transformedSupplier?.website && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-sm sm:text-base">
                          <i className="ri-global-line mr-2 text-green-600"></i>
                          {t('supplier.website')}
                        </h4>
                        <div className="space-y-2 text-gray-700">
                          <a
                            href={transformedSupplier.website.startsWith('http') ? transformedSupplier.website : `https://${transformedSupplier.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline break-all block text-xs sm:text-sm"
                          >
                            {transformedSupplier.website}
                          </a>
                        </div>
                        <a
                          href={transformedSupplier.website.startsWith('http') ? transformedSupplier.website : `https://${transformedSupplier.website}`}
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
            
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {t('supplier.products')}
                  </h3>
                  {transformedSupplier.category && (
                    <Link
                      to={`/products?category=${encodeURIComponent(transformedSupplier.category)}`}
                      className="inline-flex items-center text-xs sm:text-sm text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium"
                    >
                      <i className="ri-external-link-line mr-1" />
                      {t('supplier.view_similar_products')}
                    </Link>
                  )}
                </div>
                {productsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  </div>
                ) : productsData && productsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {productsData.map((product: any) => (
                      <article
                        key={product._id}
                        className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]}
                              alt={product.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 bg-gray-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(product.name)}&width=80&height=80&seq=product-${product._id}&orientation=squarish`;
                                target.onerror = null;
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <i className="ri-image-line text-gray-500"></i>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                              {product.name}
                            </h4>
                            {product.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  product.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {product.status === 'active' ? t('status.active') : t('status.inactive')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="ri-product-hunt-line text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600">{t('supplier.no_products')}</p>
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
            {similarSuppliers.map((similarSupplier) => (
              <div key={similarSupplier.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <SupplierAvatar
                    name={similarSupplier.name}
                    category={similarSupplier.category}
                    size="md"
                    className="mr-3 flex-shrink-0"
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
            ))}
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

      {/* Modal de message interne */}
      {showInternalMessageForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold">{t('supplier.internal_message')} {transformedSupplier?.name}</h3>
              <button
                onClick={() => setShowInternalMessageForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="ri-close-line text-lg sm:text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleInternalMessageSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.your_name')} *
                </label>
                <input
                  type="text"
                  value={internalMessageForm.name}
                  onChange={(e) => setInternalMessageForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_name')}
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.email')}
                </label>
                <input
                  type="email"
                  value={internalMessageForm.email}
                  onChange={(e) => setInternalMessageForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_email')}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.phone_number')}
                </label>
                <input
                  type="tel"
                  value={internalMessageForm.phone}
                  onChange={(e) => setInternalMessageForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_phone')}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('supplier.message')} *
                </label>
                <textarea
                  rows={4}
                  value={internalMessageForm.message}
                  onChange={(e) => setInternalMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder={t('supplier.placeholder_message')}
                  maxLength={500}
                  required
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  {internalMessageForm.message.length}/500 {t('supplier.characters')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInternalMessageForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                >
                  {t('supplier.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSendingInternalMessage || !internalMessageForm.name.trim() || !internalMessageForm.message.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isSendingInternalMessage ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      {t('supplier.sending')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line mr-2"></i>
                      {t('supplier.send_message')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Business Modal */}
      {showClaimModal && (
        <ClaimBusinessModal
          supplier={transformedSupplier}
          onClose={() => setShowClaimModal(false)}
          showToast={showToast}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// Claim Business Modal Component
interface ClaimBusinessModalProps {
  supplier: Supplier | null;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'warning', message: string) => void;
}

function ClaimBusinessModal({ supplier, onClose, showToast }: ClaimBusinessModalProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const [step, setStep] = useState<'verify' | 'manual_request' | 'confirm' | 'success'>('verify');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimJustification, setClaimJustification] = useState('');
  const claimMutation = useMutation(api.suppliers.claimSupplier);
  
  // Get user's email addresses from Clerk
  const userEmails = user?.emailAddresses?.map(e => e.emailAddress) || [];
  const primaryEmail = user?.primaryEmailAddress?.emailAddress || '';
  const supplierEmail = supplier?.email?.toLowerCase() || '';
  
  // Check if user's email matches the supplier's email
  const hasMatchingEmail = userEmails.some(email => 
    email.toLowerCase() === supplierEmail || 
    email.toLowerCase().includes(supplier?.name?.toLowerCase()?.replace(/\s+/g, '') || '')
  );
  
  const handleVerifyEmail = async () => {
    // Trigger email verification if needed
    const primaryEmailObj = user?.primaryEmailAddress;
    if (primaryEmailObj && !primaryEmailObj.verification?.status === 'verified') {
      try {
        await primaryEmailObj.prepareEmailAddressVerification({
          strategy: 'email_code'
        });
        showToast('success', 'Un code de vérification a été envoyé à votre email');
      } catch (error) {
        showToast('error', 'Erreur lors de l\'envoi du code de vérification');
      }
    }
  };
  
  const handleSubmitClaim = async (isManualRequest = false) => {
    if (!supplier || !user) return;
    
    setIsSubmitting(true);
    try {
      await claimMutation({
        supplierId: supplier.id,
        userEmail: primaryEmail,
        claimedAt: new Date().toISOString(),
        claimType: isManualRequest ? 'manual_review' : 'email_verified',
        justification: isManualRequest ? claimJustification : undefined,
      });
      setStep('success');
      showToast('success', t('claims.notification.claim_submitted'));
    } catch (error) {
      showToast('error', t('claims.notification.error_submit'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!supplier) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold flex items-center">
            <i className="ri-shield-user-line text-orange-500 mr-2"></i>
            {t('claims.modal.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label={t('claims.modal.close')}
          >
            <i className="ri-close-line text-lg sm:text-xl"></i>
          </button>
        </div>
        
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <i className="ri-information-line mr-1"></i>
                {t('claims.modal.verify.description', { businessName: supplier.name })}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{t('claims.modal.verify.business_email')}</span>
                <span className="text-sm font-medium text-gray-900">{supplier.email || t('claims.modal.verify.not_available')}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{t('claims.modal.verify.your_email')}</span>
                <span className="text-sm font-medium text-gray-900">{primaryEmail || t('claims.modal.verify.not_available')}</span>
              </div>
            </div>
            
            {hasMatchingEmail ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <i className="ri-check-line mr-1"></i>
                  {t('claims.modal.verify.email_match_success')}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <i className="ri-alert-line mr-1"></i>
                  {t('claims.modal.verify.email_match_warning')}
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Vous pouvez tout de même soumettre une demande qui sera examinée manuellement par un administrateur.
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                {t('claims.modal.verify.cancel')}
              </button>
              {hasMatchingEmail ? (
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm"
                >
                  {t('claims.modal.verify.continue')}
                </button>
              ) : (
                <button
                  onClick={() => setStep('manual_request')}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm"
                >
                  Demander un examen manuel
                </button>
              )}
            </div>
          </div>
        )}
        
        {step === 'manual_request' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <i className="ri-information-line mr-1"></i>
                Demande d'examen manuel
              </p>
              <p className="text-xs text-blue-700">
                Votre email ne correspond pas à celui de l'entreprise. Veuillez expliquer pourquoi vous souhaitez réclamer ce compte. Un administrateur examinera votre demande.
              </p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Justification de votre demande *
              </label>
              <textarea
                value={claimJustification}
                onChange={(e) => setClaimJustification(e.target.value)}
                placeholder="Ex: Je suis le propriétaire de cette entreprise, mon email professionnel est..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-sm resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {claimJustification.length}/500 caractères
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setStep('verify')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                Retour
              </button>
              <button
                onClick={() => handleSubmitClaim(true)}
                disabled={isSubmitting || claimJustification.trim().length < 20}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Envoi...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line mr-2"></i>
                    Soumettre la demande
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {step === 'confirm' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {t('claims.modal.confirm.description', { businessName: supplier.name })}
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-xs text-gray-600">
                <i className="ri-check-line text-green-500 mr-1"></i>
                {t('claims.modal.confirm.benefit_manage')}
              </p>
              <p className="text-xs text-gray-600">
                <i className="ri-check-line text-green-500 mr-1"></i>
                {t('claims.modal.confirm.benefit_reviews')}
              </p>
              <p className="text-xs text-gray-600">
                <i className="ri-check-line text-green-500 mr-1"></i>
                {t('claims.modal.confirm.benefit_stats')}
              </p>
              <p className="text-xs text-gray-600">
                <i className="ri-check-line text-green-500 mr-1"></i>
                {t('claims.modal.confirm.benefit_messages')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setStep('verify')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                {t('claims.modal.confirm.back')}
              </button>
              <button
                onClick={() => handleSubmitClaim(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t('claims.modal.confirm.submitting')}
                  </>
                ) : (
                  <>
                    <i className="ri-check-double-line mr-2"></i>
                    {t('claims.modal.confirm.submit')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <i className="ri-check-line text-3xl text-green-600"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{t('claims.modal.success.title')}</h4>
            <p className="text-sm text-gray-700">
              {t('claims.modal.success.description', { businessName: supplier.name })}
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              {t('claims.modal.success.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}