import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { contactFormSchema, validateForm } from '../../lib/validation';
import { HeroSection, Section, Container, Footer } from '../../components/layout';
import { FormInput, FormTextarea, FormSelect } from '../../components/forms';
import { ContactInfoCard } from '../../components/ui';
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

const inquiryTypeOptions = [
  { value: 'general', label: 'contact.type_general' },
  { value: 'supplier', label: 'contact.type_supplier' },
  { value: 'technical', label: 'contact.type_technical' },
  { value: 'partnership', label: 'contact.type_partnership' },
  { value: 'feedback', label: 'contact.type_feedback' },
];

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

  const contactInfoItems = [
    {
      icon: 'ri-map-pin-line',
      title: t('contact.address_title'),
      content: t('contact.address_text'),
    },
    {
      icon: 'ri-phone-line',
      title: t('contact.phone_title'),
      content: '+234 1 234 5678',
    },
    {
      icon: 'ri-mail-line',
      title: t('contact.email_title'),
      content: 'contact@Olufinja.com',
    },
    {
      icon: 'ri-time-line',
      title: t('contact.hours_title'),
      content: t('contact.hours_text'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <HeroSection
        variant="gradient"
        overlay="from-green-600/95 to-emerald-600/90"
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
        className="py-12 sm:py-16"
      />

      <Section background="none" padding="lg">
        <Container>
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
                  <FormInput
                    label={t('contact.name')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={validationErrors.name}
                    placeholder={t('contact.placeholder_name')}
                  />
                  <FormInput
                    type="email"
                    label={t('contact.email')}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    error={validationErrors.email}
                    placeholder={t('contact.placeholder_email')}
                  />
                </div>

                <FormSelect
                  label={t('contact.type')}
                  name="type"
                  value={formData.type}
                  onChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}
                  options={inquiryTypeOptions.map(opt => ({ ...opt, label: t(opt.label) }))}
                />

                <FormInput
                  label={t('contact.subject')}
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  error={validationErrors.subject}
                  placeholder={t('contact.placeholder_subject')}
                />

                <FormTextarea
                  label={t('contact.message')}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  maxLength={500}
                  showCharCount
                  error={validationErrors.message}
                  placeholder={t('contact.placeholder_message')}
                />

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
              <ContactInfoCard items={contactInfoItems} />

              {/* Map */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[250px]">
                <ContactMap />
              </div>

              {/* FAQ Link */}
              <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('contact.faq_title')}</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{t('contact.faq_text')}</p>
                <Link to="/faq" className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base">
                  {t('contact.see_faq')} <i className="ri-arrow-right-line ml-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <Footer variant="dark" showLogo={false} />
    </div>
  );
}
