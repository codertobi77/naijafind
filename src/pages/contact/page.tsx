import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { contactFormSchema, validateForm } from '../../lib/validation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Mapbox Map Component
function ContactMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [3.4240, 6.4281], // Lagos, Nigeria
        zoom: 13,
        pitch: 45,
        bearing: -17.6,
        antialias: true
      });

      mapInstanceRef.current = map;

      map.on('load', () => {
        // Add 3D terrain
        map.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

        // Add 3D buildings
        if (!map.getLayer('3d-buildings')) {
          map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
              'fill-extrusion-color': '#a8a8a8',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6
            }
          });
        }

        // Add marker for office location
        markerRef.current = new mapboxgl.Marker({ color: '#16a34a' })
          .setLngLat([3.4240, 6.4281])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <h3 class="font-semibold text-sm">Olufinja Office</h3>
                <p class="text-xs text-gray-600">Victoria Island, Lagos</p>
              </div>`
            )
          )
          .addTo(map);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="w-full h-full min-h-[250px] bg-gray-100" />;
}

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general' as 'general' | 'supplier' | 'technical' | 'partnership' | 'feedback',
    website: '' // Honeypot field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const meData = useQuery(api.users.me, {});
  
  // Convex mutations and queries
  const sendContactEmail = useMutation(api.emails.sendContactEmail);
  const checkRateLimit = useQuery(api.rateLimit.checkRateLimit, 
    formData.email ? {
      identifier: formData.email,
      action: 'contact_form',
      limit: 3,
      windowMinutes: 60
    } : 'skip'
  );
  const recordAttempt = useMutation(api.rateLimit.recordAttempt);

  // Check if data is still loading
  const dataLoading = meData === undefined;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});
    setSubmitStatus('idle');
    
    try {
      // Honeypot check - if website field is filled, it's a bot
      if (formData.website) {
        console.log('Bot detected via honeypot');
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      // Validate form data
      const validation = validateForm(contactFormSchema, formData);
      if (!validation.success) {
        setValidationErrors(validation.errors || {});
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      // Check rate limit
      if (checkRateLimit && !checkRateLimit.allowed) {
        setSubmitStatus('rate_limited');
        setIsSubmitting(false);
        return;
      }

      // Record rate limit attempt
      await recordAttempt({
        identifier: formData.email,
        action: 'contact_form'
      });

      // Send email via Convex
      await sendContactEmail({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        type: formData.type
      });

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', type: 'general', website: '' });
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
                Olufinja
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.home')}</Link>
              <Link to="/search" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.search')}</Link>
              <Link to="/categories" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.categories')}</Link>
              <Link to="/about" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.about')}</Link>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LanguageSelector />
              <SignedOut>
                <Link to="/auth/login" className="text-gray-700 hover:text-green-600 font-medium text-sm sm:text-base">
                  {t('nav.login')}
                </Link>
                <button 
                  onClick={handleAddBusinessClick}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">{t('about.add_business')}</span>
                  <span className="sm:hidden">{t('about.add_business')}</span>
                </button>
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
      <section className="bg-green-600 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{t('contact.form_title')}</h2>
            
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm sm:text-base">
                <i className="ri-check-line mr-2"></i>
                {t('contact.success')}
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm sm:text-base">
                <i className="ri-error-warning-line mr-2"></i>
                {validationErrors._form || t('contact.error')}
              </div>
            )}
            
            {submitStatus === 'rate_limited' && (
              <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-sm sm:text-base">
                <i className="ri-time-line mr-2"></i>
                Too many requests. Please try again later.
                {checkRateLimit?.resetAt && (
                  <span className="block mt-1 text-xs">
                    Try again after {new Date(checkRateLimit.resetAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Honeypot field - hidden from users */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.name')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                      validationErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('contact.placeholder_name')}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.email')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('contact.placeholder_email')}
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.type')}
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8 text-sm"
                >
                  <option value="general">{t('contact.type_general')}</option>
                  <option value="supplier">{t('contact.type_supplier')}</option>
                  <option value="technical">{t('contact.type_technical')}</option>
                  <option value="partnership">{t('contact.type_partnership')}</option>
                  <option value="feedback">{t('contact.type_feedback')}</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.subject')} *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                    validationErrors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('contact.placeholder_subject')}
                />
                {validationErrors.subject && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.subject}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contact.message')} *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  maxLength={500}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                    validationErrors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('contact.placeholder_message')}
                ></textarea>
                {validationErrors.message && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {formData.message.length}/500 {t('contact.char_count')}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t('contact.sending')}
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line mr-2"></i>
                    {t('contact.send')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">{t('contact.info_title')}</h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="ri-map-pin-line text-green-600 text-lg sm:text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('contact.address_title')}</h4>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {t('contact.address_text')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="ri-phone-line text-green-600 text-lg sm:text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('contact.phone_title')}</h4>
                    <p className="text-gray-600 text-sm sm:text-base">+234 1 234 5678</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="ri-mail-line text-green-600 text-lg sm:text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('contact.email_title')}</h4>
                    <p className="text-gray-600 text-sm sm:text-base">contact@Olufinja.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i className="ri-time-line text-green-600 text-lg sm:text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{t('contact.hours_title')}</h4>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {t('contact.hours_text')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[250px]">
              <ContactMap />
            </div>

            {/* FAQ Link */}
            <div className="bg-green-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('contact.faq_title')}</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {t('contact.faq_text')}
              </p>
              <Link to="/faq" className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base">
                {t('contact.see_faq')} <i className="ri-arrow-right-line ml-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

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