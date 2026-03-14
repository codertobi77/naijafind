import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Header } from '../../components/base';
import { Package, MapPin, DollarSign, FileText, Send, ChevronDown } from 'lucide-react';

// Quantity units
const quantityUnits = [
  { value: 'pieces', label: 'Pièces' },
  { value: 'kg', label: 'Kilogrammes' },
  { value: 'tonnes', label: 'Tonnes' },
  { value: 'litres', label: 'Litres' },
  { value: 'meters', label: 'Mètres' },
  { value: 'units', label: 'Unités' },
  { value: 'boxes', label: 'Cartons' },
  { value: 'pallets', label: 'Palettes' },
  { value: 'containers', label: 'Conteneurs' },
];

// Currency options
const currencies = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'NGN', label: 'NGN (₦)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'XOF', label: 'XOF (CFA)' },
];

export default function PurchaseRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPurchaseRequest = useAction(api.purchaseRequests.createPurchaseRequest);
  
  const [formData, setFormData] = useState({
    description: '',
    quantity: '',
    unit: 'tonnes',
    location: '',
    budget: '',
    currency: 'EUR',
    additionalInfo: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    preferredDeliveryDate: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = t('purchase_request.errors.description_required', 'La description est requise');
    }
    
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = t('purchase_request.errors.quantity_invalid', 'La quantité doit être supérieure à 0');
    }
    
    if (!formData.location.trim()) {
      newErrors.location = t('purchase_request.errors.location_required', 'Le lieu de livraison est requis');
    }
    
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = t('purchase_request.errors.email_required', 'L\'email est requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = t('purchase_request.errors.email_invalid', 'L\'email n\'est pas valide');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit to backend
      const result = await createPurchaseRequest({
        description: formData.description,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        location: formData.location,
        budget: formData.budget || undefined,
        currency: formData.currency || undefined,
        additionalInfo: formData.additionalInfo || undefined,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        preferredDeliveryDate: formData.preferredDeliveryDate || undefined,
      });
      
      if (result.success) {
        setIsSubmitting(false);
        setIsSuccess(true);
        
        // Redirect after 5 seconds
        setTimeout(() => {
          navigate('/');
        }, 5000);
      }
    } catch (error) {
      console.error('Error submitting purchase request:', error);
      setIsSubmitting(false);
      alert(t('purchase_request.errors.submission', 'Une erreur est survenue. Veuillez réessayer.'));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('purchase_request.success_title', 'Demande publiée avec succès !')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('purchase_request.success_message', 'Votre demande a été envoyée à nos fournisseurs qualifiés. Vous recevrez rapidement des propositions adaptées à vos besoins.')}
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>{t('purchase_request.next_steps', 'Prochaines étapes :')}</strong>
              </p>
              <ul className="text-sm text-blue-600 mt-2 text-left list-disc list-inside">
                <li>{t('purchase_request.step1', 'Les fournisseurs vont étudier votre demande')}</li>
                <li>{t('purchase_request.step2', 'Vous recevrez des propositions par email')}</li>
                <li>{t('purchase_request.step3', 'Comparez et choisissez le meilleur offre')}</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              {t('common.return_home', 'Retour à l\'accueil')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Header />
      
      {/* Hero Section */}
      <div 
        className="relative py-16 sm:py-20"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(https://readdy.ai/api/search-image?query=African%20business%20meeting%20handshake%20professional%20warehouse%20modern%20commerce%20Nigeria%20trading%20deal%20agreement%20suppliers%20b2b%20partnership&width=1200&height=400&seq=purchase-hero&orientation=landscape)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('purchase_request.title', 'Publiez une demande d\'achat')}
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            {t('purchase_request.subtitle', 'Recevez rapidement des propositions de fournisseurs qualifiés.')}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <p className="text-gray-600 text-center">
              {t('purchase_request.form_header', 'Remplissez le formulaire ci-dessous et obtenez des offres des meilleurs fournisseurs')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Row 1: Description & Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  {t('purchase_request.description', 'Description de votre besoin')}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('purchase_request.description_placeholder', 'Je cherche 50 tonnes de riz')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  {t('purchase_request.quantity', 'Quantité')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    placeholder="50"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                      errors.quantity ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <div className="relative">
                    <select
                      value={formData.unit}
                      onChange={(e) => handleChange('unit', e.target.value)}
                      className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[120px]"
                    >
                      {quantityUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>
            </div>

            {/* Row 2: Location & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  {t('purchase_request.location', 'Pays / Ville')}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder={t('purchase_request.location_placeholder', 'Exemple: Nigeria, Lagos')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  {t('purchase_request.budget', 'Budget estimé')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', e.target.value)}
                    placeholder={t('purchase_request.budget_placeholder', 'Exemples: 500 000 $ / 200 000 €')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                  <div className="relative">
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white min-w-[100px]"
                    >
                      {currencies.map(currency => (
                        <option key={currency.value} value={currency.value}>{currency.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('purchase_request.additional_info', 'Informations supplémentaires (optionnel)')}
              </label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => handleChange('additionalInfo', e.target.value)}
                placeholder={t('purchase_request.additional_info_placeholder', 'Décrivez vos besoins spécifiques, qualité requise, délais de livraison souhaités...')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              />
            </div>

            {/* Contact Info Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t('purchase_request.contact_info', 'Vos coordonnées')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  placeholder={t('purchase_request.name_placeholder', 'Votre nom')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder={t('purchase_request.email_placeholder', 'Votre email')}
                  className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder={t('purchase_request.phone_placeholder', 'Votre téléphone')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
                <input
                  type="date"
                  value={formData.preferredDeliveryDate}
                  onChange={(e) => handleChange('preferredDeliveryDate', e.target.value)}
                  placeholder={t('purchase_request.delivery_date', 'Date de livraison souhaitée')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              {errors.contactEmail && (
                <p className="text-red-500 text-sm mt-2">{errors.contactEmail}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('purchase_request.publishing', 'Publication en cours...')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t('purchase_request.submit', 'Publier ma demande')}
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-gray-500">
              {t('purchase_request.footer', 'Vous serez contacté très rapidement par des fournisseurs qualifiés')}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
