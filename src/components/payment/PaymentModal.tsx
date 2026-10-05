import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

/**
 * Intention de paiement lancée depuis le dashboard :
 * - abonnement Basic ou Premium ;
 * - mise en avant « Vitrine » (50 000 XOF / 30 jours).
 */
export type PaymentIntent =
  | { kind: 'subscription'; planId: 'basic' | 'premium' }
  | { kind: 'featured' };

interface PaymentModalProps {
  open: boolean;
  intent: PaymentIntent | null;
  onClose: () => void;
}

/**
 * Confirmation avant redirection vers le checkout Moneroo.
 * Le montant est dérivé côté serveur : aucune valeur de prix ne vient du client.
 */
export default function PaymentModal({ open, intent, onClose }: PaymentModalProps) {
  const { t } = useTranslation();
  const initializeSubscription = useAction(api.payments.initializeSubscription);
  const initializeFeaturedUpgrade = useAction(api.payments.initializeFeaturedUpgrade);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Garde-fou : une seule initialisation par intention, même en cas de double
  // clic ou de double rendu (StrictMode).
  const startedRef = useRef<string | null>(null);

  const intentKey = intent
    ? intent.kind === 'subscription'
      ? `subscription:${intent.planId}`
      : 'featured'
    : null;

  // À la fermeture : réinitialiser l'état pour la prochaine intention.
  useEffect(() => {
    if (!open) {
      startedRef.current = null;
      setLoading(false);
      setError(null);
    }
  }, [open]);

  if (!open || !intent) return null;

  const priceLabel =
    intent.kind === 'subscription'
      ? intent.planId === 'basic'
        ? t('subscription.plan_basic_price', '25 000 XOF / 30 jours')
        : t('subscription.plan_premium_price', '200 000 XOF / 365 jours')
      : t('subscription.featured_price', '50 000 XOF / 30 jours');

  const confirmLabel =
    intent.kind === 'subscription'
      ? t('subscription.select_plan', 'Choisir ce plan')
      : t('subscription.featured_cta', 'Activer la Vitrine');

  const handleConfirm = async () => {
    if (loading || startedRef.current === intentKey) return;
    startedRef.current = intentKey;
    setLoading(true);
    setError(null);
    try {
      const result =
        intent.kind === 'subscription'
          ? await initializeSubscription({ plan: intent.planId })
          : await initializeFeaturedUpgrade({});
      if (result?.checkoutUrl) {
        // Redirection vers Moneroo : on garde la modale ouverte (état
        // « Redirection en cours... ») jusqu'au changement de page.
        window.location.href = result.checkoutUrl;
        return;
      }
      throw new Error('checkoutUrl manquant');
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : t('payment.modal_error', 'Impossible d\'initialiser le paiement. Veuillez réessayer.')
      );
      startedRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-fade-in">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
            <i className="ri-bank-card-line text-3xl text-amber-600"></i>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('payment.modal_title', 'Paiement sécurisé via Moneroo')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('payment.modal_desc', 'Vous allez être redirigé vers Moneroo pour compléter le paiement.')}
          </p>
          <p className="mb-6 text-lg font-bold text-gray-900">{priceLabel}</p>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => void handleConfirm()}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  {t('payment.modal_starting', 'Redirection en cours...')}
                </>
              ) : (
                confirmLabel
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium disabled:opacity-50"
            >
              {t('payment.modal_cancel', 'Annuler')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
