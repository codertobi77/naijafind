import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';
import ImageUpload from '../../components/base/ImageUpload';
import ImageGalleryUpload from '../../components/base/ImageGalleryUpload';
import LocationPicker from '../../components/base/LocationPicker';
import Modal from '../../components/base/Modal';

export default function SupplierSetup() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { isLoaded } = useAuth();
  const navigate = useNavigate();
  const meData = useQuery(api.users.me, {});
  const categories = useQuery(api.categories.getAllCategories, {});
  const signUpSupplier = useMutation(api.users.signUpSupplier);

  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    description: '',
    category: '',
    address: '',
    city: '',
    state: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
    website: '',
    image: '',
    imageGallery: [] as string[],
    business_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true },
    },
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Pré-remplir avec les données de l'utilisateur
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        phone: user.primaryPhoneNumber?.phoneNumber || prev.phone,
      }));
    }
  }, [user]);

  // Si l'utilisateur a déjà un profil supplier, rediriger
  useEffect(() => {
    if (meData?.supplier) {
      navigate('/dashboard');
    }
  }, [meData, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = t('supplier_setup.errors.business_name_required');
    }
    if (!formData.category) {
      newErrors.category = t('supplier_setup.errors.category_required');
    }
    if (!formData.country) {
      newErrors.country = t('supplier_setup.errors.country_required');
    }
    if (!formData.city.trim()) {
      newErrors.city = t('supplier_setup.errors.city_required');
    }
    if (!formData.state.trim()) {
      newErrors.state = t('supplier_setup.errors.state_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.primaryEmailAddress?.emailAddress) {
      alert(t('supplier_setup.errors.email_not_available'));
      return;
    }

    setLoading(true);

    try {
      await signUpSupplier({
        business_name: formData.business_name,
        email: user.primaryEmailAddress.emailAddress,
        phone: formData.phone || undefined,
        description: formData.description || undefined,
        category: formData.category,
        address: formData.address || undefined,
        city: formData.city,
        state: formData.state,
        country: formData.country || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        website: formData.website || undefined,
        image: formData.image || undefined,
        imageGallery: formData.imageGallery.length > 0 ? formData.imageGallery : undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      });

      // Show a message that admin approval is needed
      setShowApprovalModal(true);
    } catch (error: any) {
      // Handle the case where a supplier profile already exists
      if (error.message && error.message.includes("existe déjà")) {
        alert(t('supplier_setup.errors.profile_exists'));
      } else {
        alert(error.message || t('supplier_setup.errors.profile_creation_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-300 rounded-full filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4 relative z-10">
        <Link to="/" className="flex justify-center group">
          <div className="text-center">
            <span className="text-4xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300" style={{ fontFamily: 'Pacifico, serif' }}>
              NaijaFind
            </span>
            <div className="h-1 w-20 bg-green-600 mx-auto mt-2 rounded-full group-hover:w-32 transition-all duration-300"></div>
          </div>
        </Link>
        <div className="mt-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <i className="ri-store-line text-3xl text-green-600"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('supplier_setup.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('supplier_setup.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 relative z-10">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-green-100 sm:rounded-2xl sm:px-10 border border-gray-100">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{t('supplier_setup.step', { current: 3, total: 3 })}</span>
              <span className="text-sm font-medium text-green-600">{t('supplier_setup.almost_done')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <h3 className="text-sm font-semibold text-green-800 mb-4 flex items-center">
                <i className="ri-building-line mr-2"></i>
                {t('supplier_setup.basic_info')}
              </h3>
              <div className="space-y-4">
                {/* Nom de l'entreprise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.business_name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                      errors.business_name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder={t('supplier_setup.business_name_placeholder')}
                  />
                  {errors.business_name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {errors.business_name}
                    </p>
                  )}
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.category')} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white ${
                      errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('supplier_setup.select_category')}</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <i className="ri-error-warning-line mr-1"></i>
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('supplier_setup.description_placeholder')}
                  />
                </div>
                
                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.profile_image')}
                  </label>
                  <ImageUpload
                    label=""
                    value={formData.image}
                    onChange={(value: string) => setFormData({...formData, image: value})}
                    placeholder={t('supplier_setup.profile_image_placeholder')}
                  />
                </div>

                {/* Image Gallery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.image_gallery')}
                  </label>
                  <ImageGalleryUpload
                    label=""
                    value={formData.imageGallery}
                    onChange={(value: string[]) => setFormData({...formData, imageGallery: value})}
                    maxImages={10}
                    placeholder={t('supplier_setup.image_gallery_placeholder')}
                  />
                </div>
              </div>
            </div>

            {/* Informations de contact */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 mb-4 flex items-center">
                <i className="ri-phone-line mr-2"></i>
                {t('supplier_setup.contact_info')}
              </h3>
              <div className="space-y-4">
                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('supplier_setup.phone_placeholder')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.email')}
                  </label>
                  <input
                    type="email"
                    value={user.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Site web */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier_setup.website')}
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t('supplier_setup.website_placeholder')}
                  />
                </div>
              </div>
            </div>

            {/* Adresse avec LocationPicker */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <h3 className="text-sm font-semibold text-purple-800 mb-4 flex items-center">
                <i className="ri-map-pin-line mr-2"></i>
                {t('supplier_setup.address_info')}
              </h3>
              <LocationPicker
                value={{
                  country: formData.country,
                  state: formData.state,
                  city: formData.city,
                  address: formData.address,
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                onChange={(location) => setFormData({
                  ...formData,
                  country: location.country,
                  state: location.state,
                  city: location.city,
                  address: location.address,
                  latitude: location.latitude,
                  longitude: location.longitude,
                })}
                errors={errors}
              />
            </div>

            {/* Business Hours */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              <h3 className="text-sm font-semibold text-yellow-800 mb-4 flex items-center">
                <i className="ri-time-line mr-2"></i>
                {t('supplier_setup.business_hours')}
              </h3>
              <div className="space-y-4">
                {Object.entries(formData.business_hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 w-24">
                      {t(`supplier_setup.days.${day}` as 'supplier_setup.days.monday')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) => setFormData({
                          ...formData,
                          business_hours: {
                            ...formData.business_hours,
                            [day]: { ...hours, closed: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-600 mr-2">{t('supplier_setup.closed')}</span>
                      {!hours.closed && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => setFormData({
                              ...formData,
                              business_hours: {
                                ...formData.business_hours,
                                [day]: { ...hours, open: e.target.value }
                              }
                            })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => setFormData({
                              ...formData,
                              business_hours: {
                                ...formData.business_hours,
                                [day]: { ...hours, close: e.target.value }
                              }
                            })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('supplier_setup.image_gallery')}
              </label>
              <ImageGalleryUpload
                label=""
                value={formData.imageGallery}
                onChange={(value: string[]) => setFormData({...formData, imageGallery: value})}
                maxImages={10}
                placeholder={t('supplier_setup.image_gallery_placeholder')}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                {t('supplier_setup.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    {t('supplier_setup.creating_profile')}
                  </span>
                ) : (
                  t('supplier_setup.create_profile')
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-green-600 font-medium transition-colors group">
            <i className="ri-arrow-left-line mr-2 group-hover:-translate-x-1 transition-transform"></i>
            {t('supplier_setup.home')}
          </Link>
        </div>
      </div>

      {/* Modal de confirmation d'approbation */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          navigate('/');
        }}
        title={t('supplier_setup.approval_modal.title')}
        message={t('supplier_setup.approval_modal.message')}
        buttonText={t('supplier_setup.approval_modal.button')}
        icon="success"
      />
    </div>
  );
}
