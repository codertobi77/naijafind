import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Header } from '../../components/base';
import { Package, FileText, Send, ChevronDown, MessageCircle, Upload, X } from 'lucide-react';

// Quantity units - now internationalized
const getQuantityUnits = (t: (key: string) => string) => [
  { value: 'pieces', label: t('units.pieces', 'Pièces') },
  { value: 'kg', label: t('units.kg', 'Kilogrammes') },
  { value: 'tonnes', label: t('units.tonnes', 'Tonnes') },
  { value: 'litres', label: t('units.litres', 'Litres') },
  { value: 'meters', label: t('units.meters', 'Mètres') },
  { value: 'units', label: t('units.units', 'Unités') },
  { value: 'boxes', label: t('units.boxes', 'Cartons') },
  { value: 'pallets', label: t('units.pallets', 'Palettes') },
  { value: 'containers', label: t('units.containers', 'Conteneurs') },
];

export default function PurchaseRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPurchaseRequest = useAction(api.purchaseRequests.createPurchaseRequest);
  
  const [formData, setFormData] = useState({
    description: '',
    quantity: '',
    unit: 'tonnes',
    whatsapp: '',
  });
  
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
    
    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = t('purchase_request.errors.whatsapp_required', 'Le numéro WhatsApp est requis');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await createPurchaseRequest({
        description: formData.description,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        whatsapp: formData.whatsapp,
        image: image || undefined,
      });
      
      if (result.success) {
        setIsSubmitting(false);
        setIsSuccess(true);
        
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
      
      {/* Hero Section - Reduced height for better proportions */}
      <div 
        className="relative py-10 sm:py-12"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(https://readdy.ai/api/search-image?query=African%20business%20meeting%20handshake%20professional%20warehouse%20modern%20commerce%20Nigeria%20trading%20deal%20agreement%20suppliers%20b2b%20partnership&width=1200&height=300&seq=purchase-hero&orientation=landscape)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t('purchase_request.title', 'Publiez une demande d\'achat')}
          </h1>
          <p className="text-base text-white/90 max-w-2xl mx-auto">
            {t('purchase_request.subtitle', 'Recevez rapidement des propositions de fournisseurs qualifiés.')}
          </p>
        </div>
      </div>

      {/* Form Section - Better spacing without overlap */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header - Better contrast and spacing */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-5 border-b border-green-100">
            <p className="text-gray-700 text-center text-sm sm:text-base font-medium">
              {t('purchase_request.form_header', 'Remplissez le formulaire ci-dessous et obtenez des offres des meilleurs fournisseurs')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                {t('purchase_request.description', 'Description du besoin')}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('purchase_request.description_placeholder', 'Ex: 50 tonnes de riz blanc')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Product Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-600" />
                {t('purchase_request.image', 'Photo du produit (optionnel)')}
              </label>
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('L\'image ne doit pas dépasser 5 Mo');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result as string;
                          setImage(result);
                          setImagePreview(result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-green-500 focus:outline-none"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      {t('purchase_request.upload_image', 'Cliquez pour ajouter une photo')}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {t('purchase_request.image_max_size', 'Max 5 Mo')}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                {t('purchase_request.quantity', 'Quantité')}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="50"
                  className={`flex-1 min-w-0 px-3 sm:px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <div className="relative flex-shrink-0">
                  <select
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    className="appearance-none w-[90px] sm:w-[100px] px-2 sm:px-3 py-3 pr-8 sm:pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                  >
                    {getQuantityUnits(t).map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                {t('purchase_request.whatsapp', 'Numéro WhatsApp')}
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder={t('purchase_request.whatsapp_placeholder', '+33 6 12 34 56 78')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                  errors.whatsapp ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.whatsapp && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('purchase_request.publishing', 'Envoi en cours...')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t('purchase_request.submit', 'Envoyer ma demande')}
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-gray-500">
              {t('purchase_request.footer', 'Vous serez contacté rapidement par des fournisseurs')}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
