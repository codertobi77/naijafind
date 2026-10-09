import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Header } from '../../components/base';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Home,
  FileText,
  LayoutDashboard,
  AlertTriangle,
  Zap,
} from 'lucide-react';

type VerifyState =
  | { kind: 'checking' }
  | { kind: 'missing' }
  | { kind: 'completed'; type: string | null; requestId?: string; requestNumber?: number }
  | { kind: 'pending' }
  | { kind: 'failed'; type: string | null; requestId?: string; requestNumber?: number };

/**
 * Vue partagée des pages de retour de paiement Moneroo
 * (/payment/success et /payment/failed).
 *
 * Le statut affiché fait toujours foi sur la page d'arrivée : on relit le
 * statut réel via verifyPaymentPublic (qui re-vérifie auprès de Moneroo),
 * quelle que soit la page sur laquelle l'utilisateur a été redirigé.
 */
export function PaymentResultView({ outcome }: { outcome: 'success' | 'failed' }) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const verifyPaymentPublic = useAction(api.payments.verifyPaymentPublic);

  // Moneroo appelle la return_url avec la référence du paiement ; on accepte
  // les variantes de nommage du paramètre pour être robuste.
  const paymentId =
    searchParams.get('paymentId') ||
    searchParams.get('payment_id') ||
    searchParams.get('paymentID') ||
    searchParams.get('id') ||
    '';

  const [state, setState] = useState<VerifyState>(
    paymentId ? { kind: 'checking' } : { kind: 'missing' }
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Flux « Xpress direct » (xpress_new) : réessai du paiement pour la demande
  // créée en Normal au fallback d'annulation.
  const retryXpressCheckout = useAction(api.payments.retryXpressCheckout);
  const [isRetrying, setIsRetrying] = useState(false);

  const verify = useCallback(async () => {
    if (!paymentId) {
      setState({ kind: 'missing' });
      return;
    }
    setIsRefreshing(true);
    try {
      const result = await verifyPaymentPublic({ monerooPaymentId: paymentId });
      if (!result?.success) {
        // Paiement inconnu localement : aucune trace de ce paiement.
        setState({ kind: 'missing' });
      } else if (result.status === 'completed') {
        setState({
          kind: 'completed',
          type: result.type,
          requestId: result.requestId,
          requestNumber: result.requestNumber,
        });
      } else if (result.status === 'failed') {
        setState({
          kind: 'failed',
          type: result.type,
          requestId: result.requestId,
          requestNumber: result.requestNumber,
        });
      } else {
        setState({ kind: 'pending' });
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      // Erreur réseau : on propose de réessayer plutôt que d'afficher
      // un statut potentiellement erroné.
      setState({ kind: 'pending' });
    } finally {
      setIsRefreshing(false);
    }
  }, [paymentId, verifyPaymentPublic]);

  /**
   * Flux « Xpress direct » annulé : réessayer le Xpress pour la MÊME demande
   * (enregistrée en Normal au fallback) — nouveau checkout xpress_upgrade
   * puis redirection immédiate vers Moneroo.
   */
  const handleRetryXpress = useCallback(async () => {
    if (!paymentId) return;
    setIsRetrying(true);
    try {
      const checkout = await retryXpressCheckout({ monerooPaymentId: paymentId });
      window.location.href = checkout.checkoutUrl;
    } catch (error) {
      console.error('Xpress retry failed:', error);
      setIsRetrying(false);
      alert(t('payment.modal_error', 'Impossible d\'initialiser le paiement. Veuillez réessayer.'));
    }
  }, [paymentId, retryXpressCheckout, t]);

  useEffect(() => {
    if (paymentId) {
      void verify();
    }
  }, [paymentId, verify]);

  const successMessage = (type: string | null) => {
    switch (type) {
      case 'xpress_upgrade':
        return t('payment.success_xpress', 'Votre demande d\'achat est passée en Xpress : traitement prioritaire sous 48-72h.');
      case 'subscription':
        return t('payment.success_subscription', 'Votre abonnement est actif. Bonne visibilité sur la plateforme !');
      case 'featured_upgrade':
        return t('payment.success_featured', 'Votre Vitrine est active : votre profil est mis en avant pendant 30 jours.');
      default:
        return t('payment.success_generic', 'Votre paiement a été confirmé avec succès.');
    }
  };

  const renderButtons = (showDashboard: boolean) => (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
      >
        <Home className="w-5 h-5" />
        {t('payment.back_home', 'Retour à l\'accueil')}
      </Link>
      <Link
        to="/dashboard/purchase-requests"
        className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
      >
        <FileText className="w-5 h-5" />
        {t('payment.view_requests', 'Voir mes demandes')}
      </Link>
      {showDashboard && (
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          <LayoutDashboard className="w-5 h-5" />
          {t('payment.view_dashboard', 'Aller au tableau de bord')}
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {state.kind === 'checking' && (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('payment.checking_title', 'Vérification du paiement...')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('payment.checking_desc', 'Nous confirmons votre paiement auprès de notre prestataire. Cela ne prend que quelques secondes.')}
              </p>
            </>
          )}

          {state.kind === 'completed' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              {state.type === 'xpress_new' ? (
                // Flux « Xpress direct » : la demande vient d'être créée en
                // Xpress au moment du paiement — texte de succès dédié.
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {t('payment.xpress_success_title', 'Demande publiée avec succès !')}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {t('payment.xpress_success_message', 'Votre demande a été enregistrée et sera traitée en priorité : vous recevrez des propositions de fournisseurs sous 72 heures ouvrées.')}
                  </p>
                  {state.requestNumber != null && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                      <p className="text-sm font-medium text-green-700">
                        {t('purchase_request.request_number', 'N° de votre demande')} :{' '}
                        <span className="text-lg font-bold text-green-800">
                          N° {state.requestNumber}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-green-600">
                        {t('purchase_request.request_number_hint', 'Conservez ce numéro pour suivre votre demande depuis votre tableau de bord.')}
                      </p>
                    </div>
                  )}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-blue-700">
                      <strong>{t('payment.xpress_success_steps', 'Prochaines étapes :')}</strong>
                    </p>
                    <ul className="text-sm text-blue-600 mt-2 list-disc list-inside">
                      <li>{t('payment.xpress_success_step1', 'Vous recevrez des propositions de fournisseurs par email et WhatsApp sous 72 heures ouvrées.')}</li>
                      <li>{t('payment.xpress_success_step2', 'Notre équipe SUJI vous accompagne pour comparer les offres et choisir le meilleur fournisseur.')}</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {t('payment.success_title', 'Paiement confirmé !')}
                  </h2>
                  <p className="text-gray-600 mb-6">{successMessage(state.type)}</p>
                </>
              )}
              {renderButtons(state.type === 'subscription' || state.type === 'featured_upgrade')}
            </>
          )}

          {state.kind === 'pending' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('payment.pending_title', 'Paiement en cours de traitement')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('payment.pending_desc', 'Votre paiement n\'est pas encore confirmé. Si vous venez de le terminer, cela peut prendre quelques instants.')}
              </p>
              <button
                onClick={() => void verify()}
                disabled={isRefreshing}
                className="mb-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {t('payment.pending_refresh', 'Revérifier maintenant')}
              </button>
              {renderButtons(false)}
            </>
          )}

          {state.kind === 'failed' && state.type === 'xpress_new' && state.requestId && (
            // Flux « Xpress direct » annulé/échoué : la demande a tout de même
            // été enregistrée en Normal (fallback au traitement du paiement).
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('payment.xpress_cancelled_title', 'Paiement annulé')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('payment.xpress_cancelled_message', 'Votre demande a tout de même été enregistrée en mode Normal (traitement sous 1 à 2 semaines). Vous pouvez réessayer le Xpress pour cette même demande afin de bénéficier du traitement prioritaire sous 72 heures ouvrées.')}
              </p>
              {state.requestNumber != null && (
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left">
                  <p className="text-sm font-medium text-blue-700">
                    {t('purchase_request.request_number', 'N° de votre demande')} :{' '}
                    <span className="text-lg font-bold text-blue-800">
                      N° {state.requestNumber}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    {t('purchase_request.request_number_hint', 'Conservez ce numéro pour suivre votre demande depuis votre tableau de bord.')}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => void handleRetryXpress()}
                  disabled={isRetrying}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white transition-all hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isRetrying ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {isRetrying
                    ? t('payment.xpress_retrying', 'Redirection vers le paiement...')
                    : t('payment.xpress_retry', 'Réessayer le Xpress — 15 000 FCFA')}
                </button>
                <Link
                  to="/purchase-request"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {t('payment.back_to_form', 'Retourner au formulaire')}
                </Link>
              </div>
            </>
          )}

          {state.kind === 'failed' && !(state.type === 'xpress_new' && state.requestId) && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('payment.failed_title', 'Paiement non abouti')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('payment.failed_desc', 'Le paiement n\'a pas pu être confirmé. Si vous avez été débité, contactez le support — aucun montant n\'est prélevé sur un paiement échoué.')}
              </p>
              {renderButtons(false)}
            </>
          )}

          {state.kind === 'missing' && outcome === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('payment.failed_title', 'Paiement non abouti')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('payment.missing_id', 'Aucune référence de paiement fournie. Vérifiez le lien depuis lequel vous avez été redirigé.')}
              </p>
              {renderButtons(false)}
            </>
          )}

          {state.kind === 'missing' && outcome === 'success' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('payment.checking_title', 'Vérification du paiement...')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('payment.missing_id', 'Aucune référence de paiement fournie. Vérifiez le lien depuis lequel vous avez été redirigé.')}
              </p>
              {renderButtons(false)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentResultView;
