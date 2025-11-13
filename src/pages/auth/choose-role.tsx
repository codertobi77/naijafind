import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';

export default function ChooseRole() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'user' | 'supplier' | 'admin' | null>(null);
  const [loading, setLoading] = useState(false);
  const ensureUser = useMutation(api.users.ensureUser);
  const meData = useQuery(api.users.me, {});

  // Si l'utilisateur a déjà un rôle, rediriger (seulement une fois)
  useEffect(() => {
    if (isLoaded && isSignedIn && meData !== undefined && meData?.user?.user_type) {
      // Ne rediriger que si on n'est pas en train de charger un rôle
      if (loading) return;
      
      if (meData.user.user_type === 'supplier' && !meData.supplier) {
        navigate('/auth/supplier-setup', { replace: true });
      } else if (meData.user.user_type === 'supplier' && meData.supplier) {
        navigate('/dashboard', { replace: true });
      } else if (meData.user.user_type === 'admin') {
        navigate('/admin', { replace: true });
      } else if (meData.user.user_type === 'user') {
        navigate('/', { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, meData, navigate, loading]);

  const handleRoleSelection = async (role: 'user' | 'supplier' | 'admin') => {
    if (!isLoaded || !user) return;

    // Vérifier que l'utilisateur peut choisir le rôle admin
    if (role === 'admin' && meData?.user?.is_admin !== true && meData?.user?.user_type !== 'admin') {
      alert(t('choose_role.admin_not_authorized'));
      return;
    }

    setSelectedRole(role);
    setLoading(true);

    try {
      // Créer l'utilisateur avec le rôle choisi
      await ensureUser({
        user_type: role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        phone: user.primaryPhoneNumber?.phoneNumber || undefined,
      });

      // Rediriger selon le rôle
      if (role === 'supplier') {
        navigate('/auth/supplier-setup');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      alert(error.message || t('choose_role.error'));
      setLoading(false);
    }
  };

  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/register');
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-300 rounded-full filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10">
        <Link to="/" className="flex justify-center group">
          <div className="text-center">
            <span className="text-4xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300" style={{ fontFamily: 'Pacifico, serif' }}>
              NaijaFind
            </span>
            <div className="h-1 w-20 bg-green-600 mx-auto mt-2 rounded-full group-hover:w-32 transition-all duration-300"></div>
          </div>
        </Link>
        <div className="mt-8 text-center animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('choose_role.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('choose_role.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4 relative z-10">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-green-100 sm:rounded-2xl sm:px-10 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Utilisateur standard */}
            <button
              onClick={() => handleRoleSelection('user')}
              disabled={loading}
              className={`group relative p-8 rounded-2xl border-2 transition-all text-center hover:scale-105 transform duration-300 ${
                selectedRole === 'user'
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-xl'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform">
                <i className="ri-user-line text-3xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('choose_role.buyer')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('choose_role.buyer_description')}
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-xs text-gray-600">
                  <i className="ri-check-line text-blue-600 mr-2"></i>
                  {t('choose_role.search')}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <i className="ri-check-line text-blue-600 mr-2"></i>
                  {t('choose_role.direct_contact')}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <i className="ri-check-line text-blue-600 mr-2"></i>
                  {t('choose_role.certified_profiles')}
                </div>
              </div>
              {selectedRole === 'user' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                </div>
              )}
            </button>

            {/* Supplier */}
            <button
              onClick={() => handleRoleSelection('supplier')}
              disabled={loading}
              className={`group relative p-8 rounded-2xl border-2 transition-all text-center hover:scale-105 transform duration-300 ${
                selectedRole === 'supplier'
                  ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50 hover:shadow-xl'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform">
                <i className="ri-store-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('choose_role.supplier')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('choose_role.supplier_description')}
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-xs text-gray-600">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  {t('choose_role.business_profile')}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  {t('choose_role.product_management')}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  {t('choose_role.dashboard')}
                </div>
              </div>
              {selectedRole === 'supplier' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                </div>
              )}
            </button>

            {/* Admin - Seulement si l'utilisateur est déjà marqué comme admin */}
            {meData?.user?.is_admin === true || meData?.user?.user_type === 'admin' ? (
              <button
                onClick={() => handleRoleSelection('admin')}
                disabled={loading}
                className={`group relative p-8 rounded-2xl border-2 transition-all text-center hover:scale-105 transform duration-300 ${
                  selectedRole === 'admin'
                    ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-xl'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <i className="ri-shield-user-line text-3xl text-purple-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t('choose_role.admin')}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('choose_role.admin_description')}
                </p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center text-xs text-gray-600">
                    <i className="ri-check-line text-purple-600 mr-2"></i>
                    {t('choose_role.user_management')}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <i className="ri-check-line text-purple-600 mr-2"></i>
                    {t('choose_role.category_management')}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <i className="ri-check-line text-purple-600 mr-2"></i>
                    {t('choose_role.moderation')}
                  </div>
                </div>
                {selectedRole === 'admin' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <i className="ri-check-line text-white text-sm"></i>
                    </div>
                  </div>
                )}
              </button>
            ) : null}
          </div>

          {loading && (
            <div className="mt-8 text-center bg-green-50 p-6 rounded-xl border border-green-100">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>
              <p className="text-sm font-medium text-gray-700">{t('choose_role.processing')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('choose_role.please_wait')}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link to="/" className="inline-flex items-center text-gray-600 hover:text-green-600 font-medium transition-colors group">
              <i className="ri-arrow-left-line mr-2 group-hover:-translate-x-1 transition-transform"></i>
              {t('choose_role.home')}
            </Link>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-xl border border-green-100">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <i className="ri-lightbulb-line text-2xl text-green-600"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium mb-1">{t('choose_role.need_help')}</p>
              <p className="text-xs text-gray-600">
                {t('choose_role.help_description', { 
                  buyer: t('choose_role.buyer').toLowerCase(), 
                  supplier: t('choose_role.supplier').toLowerCase() 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
