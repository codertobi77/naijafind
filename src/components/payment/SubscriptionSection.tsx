import { useTranslation } from 'react-i18next';
import useFormatDate from '../../hooks/useFormatDate';

type SubscriptionPlanId = 'basic' | 'premium';

interface SubscriptionSectionProps {
  currentPlan: string;
  featured: boolean;
  featuredUntil: string | null;
  subscriptionExpiresAt: string | null;
  onChooseSubscription: (planId: SubscriptionPlanId) => void;
  onFeaturedUpgrade: () => void;
}

/**
 * Onglet « Abonnement » du dashboard fournisseur :
 * - cartes des plans Gratuit / Basic / Premium (paiement Moneroo déclenché
 *   via onChooseSubscription, modale de confirmation gérée par le parent) ;
 * - carte « Vitrine » (mise en avant 30 jours) via onFeaturedUpgrade.
 * Les prix affichés sont indicatifs : le montant facturé est dérivé côté
 * serveur (convex/pricing.ts).
 */
export default function SubscriptionSection({
  currentPlan,
  featured,
  featuredUntil,
  subscriptionExpiresAt,
  onChooseSubscription,
  onFeaturedUpgrade,
}: SubscriptionSectionProps) {
  const { t } = useTranslation();
  const { formatShortDate } = useFormatDate();

  const plans: Array<{
    id: 'free' | 'basic' | 'premium';
    name: string;
    desc: string;
    price: string;
    features: string[];
  }> = [
    {
      id: 'free',
      name: t('plan.free', 'Gratuit'),
      desc: t('plan.free_desc', 'Parfait pour commencer'),
      price: t('subscription.plan_free_price', 'Gratuit'),
      features: [
        t('plan.free_max_products', '5 produits max'),
        t('plan.simple_profile', 'Profil simple'),
        t('plan.basic_support', 'Support de base'),
      ],
    },
    {
      id: 'basic',
      name: t('plan.basic', 'Basic'),
      desc: t('plan.basic_desc', 'Pour les petites entreprises'),
      price: t('subscription.plan_basic_price', '25 000 XOF / 30 jours'),
      features: [
        t('plan.basic_max_products', '50 produits'),
        t('plan.priority_support', 'Support prioritaire'),
        t('plan.basic_analytics', 'Analyses de base'),
        t('plan.verified_badge', 'Badge vérifié'),
      ],
    },
    {
      id: 'premium',
      name: t('plan.premium', 'Premium'),
      desc: t('plan.premium_desc', 'Pour les grandes entreprises'),
      price: t('subscription.plan_premium_price', '200 000 XOF / 365 jours'),
      features: [
        t('plan.unlimited_products', 'Produits illimités'),
        t('plan.support_247', 'Support 24/7'),
        t('plan.advanced_analytics', 'Analyses avancées'),
        t('plan.priority_promotion', 'Promotion prioritaire'),
        t('subscription.premium_includes_featured', 'Vitrine incluse'),
      ],
    },
  ];

  // Bouton « Choisir ce plan » — paramétré par le plan cible : le narrowing
  // (plan.id === 'basic' | 'premium') se fait à l'appel, hors closure, pour
  // rester valide quelle que soit la version de TypeScript.
  const renderSelectButton = (planId: SubscriptionPlanId, isPremium: boolean) => (
    <button
      onClick={() => onChooseSubscription(planId)}
      className={`w-full rounded-xl px-4 py-2.5 font-medium text-white transition-colors ${
        isPremium
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
          : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {t('subscription.select_plan', 'Choisir ce plan')}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* En-tête : plan actuel + date d'expiration */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('subscription.title', 'Plan d\'abonnement')}
        </h2>
        {currentPlan !== 'free' && subscriptionExpiresAt && (
          <p className="mt-1 text-sm text-gray-600">
            {t('subscription.expires', { date: formatShortDate(subscriptionExpiresAt) })}
          </p>
        )}
      </div>

      {/* Cartes des plans */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPremium = plan.id === 'premium';
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                isCurrent
                  ? 'border-green-500 ring-2 ring-green-500'
                  : isPremium
                    ? 'border-amber-300'
                    : 'border-gray-200'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    {t('subscription.current_badge', 'Plan actuel')}
                  </span>
                )}
              </div>
              <p className="mb-4 text-sm text-gray-500">{plan.desc}</p>
              <p
                className={`mb-4 text-lg font-bold ${
                  isPremium ? 'text-amber-600' : 'text-gray-900'
                }`}
              >
                {plan.price}
              </p>
              <ul className="mb-6 flex-1 space-y-2 text-sm text-gray-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <i className="ri-check-line mt-0.5 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.id === 'basic' || plan.id === 'premium'
                ? isCurrent
                  ? null
                  : renderSelectButton(plan.id, isPremium)
                : null}
            </div>
          );
        })}
      </div>

      {/* Carte Vitrine (mise en avant 30 jours) */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <i className="ri-vip-crown-line text-amber-500" />
              {t('subscription.featured_title', 'Vitrine')}
            </h3>
            <p className="mt-1 max-w-xl text-sm text-gray-600">
              {t('subscription.featured_desc', 'Votre profil apparaît en tête des résultats et des catégories pendant 30 jours.')}
            </p>
            <p className="mt-2 text-sm font-semibold text-amber-700">
              {t('subscription.featured_price', '50 000 XOF / 30 jours')}
            </p>
          </div>
          {featured ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-800">
              <i className="ri-check-line" />
              {featuredUntil
                ? t('subscription.featured_active', { date: formatShortDate(featuredUntil) })
                : t('subscription.featured_title', 'Vitrine')}
            </span>
          ) : (
            <button
              onClick={onFeaturedUpgrade}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-medium text-white transition-colors hover:from-amber-600 hover:to-orange-600"
            >
              <i className="ri-vip-crown-line" />
              {t('subscription.featured_cta', 'Activer la Vitrine')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
