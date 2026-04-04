import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useTranslation } from 'react-i18next';

export default function PendingApproval() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();
  const meData = useQuery(api.users.me, {});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    // If user is not a supplier or already approved, redirect to dashboard
    if (!isLoading && meData) {
      if (!meData.supplier) {
        navigate('/dashboard');
        return;
      }
      if (meData.supplier.approved === true) {
        navigate('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, meData, navigate]);

  if (isLoading || !meData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-200 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200 rounded-full filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center relative z-10">
        {/* Status Icon */}
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-time-line text-4xl text-yellow-600"></i>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('pending_approval.title', 'Profil en cours de validation')}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {t('pending_approval.message', 'Votre profil fournisseur est actuellement en attente d\'approbation par notre équipe. Cela prend généralement 24 à 48 heures ouvrées.')}
        </p>

        {/* Business Details Card */}
        {meData.supplier && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {t('pending_approval.business_info', 'Informations de votre entreprise')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('pending_approval.business_name', 'Nom')}:</span>
                <span className="font-medium text-gray-900">{meData.supplier.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('pending_approval.category', 'Catégorie')}:</span>
                <span className="font-medium text-gray-900">{meData.supplier.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('pending_approval.location', 'Localisation')}:</span>
                <span className="font-medium text-gray-900">{meData.supplier.city}, {meData.supplier.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('pending_approval.status', 'Statut')}:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <i className="ri-time-line mr-1"></i>
                  {t('pending_approval.pending', 'En attente')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-semibold text-gray-700">
            {t('pending_approval.next_steps', 'Prochaines étapes')}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-check-line text-green-600"></i>
              </div>
              <p className="text-xs text-gray-600">{t('pending_approval.step1', 'Soumission')}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-time-line text-yellow-600"></i>
              </div>
              <p className="text-xs text-gray-600">{t('pending_approval.step2', 'Vérification')}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ri-store-line text-gray-400"></i>
              </div>
              <p className="text-xs text-gray-600">{t('pending_approval.step3', 'Publication')}</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3 text-left">
            <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
            <div>
              <h4 className="text-sm font-semibold text-blue-800">
                {t('pending_approval.need_help', 'Besoin d\'aide ?')}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {t('pending_approval.contact_support', 'Si vous avez des questions, contactez notre équipe support.')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <i className="ri-home-line mr-2"></i>
            {t('pending_approval.go_home', 'Retour à l\'accueil')}
          </Link>
          <Link
            to="/contact"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <i className="ri-customer-service-line mr-2"></i>
            {t('pending_approval.contact', 'Contacter le support')}
          </Link>
        </div>
      </div>
    </div>
  );
}
