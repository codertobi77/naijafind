/**
 * Tarification côté serveur — source unique de vérité pour le module Moneroo.
 *
 * IMPORTANT (sécurité) : les montants ne doivent JAMAIS provenir du client.
 * Toute action de paiement dérive son montant de ces constantes.
 *
 * NB : Moneroo attend le montant dans l'unité PRINCIPALE de la devise
 * (ex : 30000 = 30 000 NGN, 50000 = 50 000 XOF).
 */

/** Traitement Xpress d'une demande d'achat : 30 000 NGN (48-72h). */
export const XPRESS_PRICING = {
  amount: 30_000,
  currency: "NGN",
  description: "Traitement Xpress d'une demande d'achat (48-72h)",
} as const;

/** Mise en avant « Vitrine » : 50 000 XOF pour 30 jours. */
export const FEATURED_PRICING = {
  amount: 50_000,
  currency: "XOF",
  days: 30,
  description: "Mise en avant Vitrine (30 jours)",
} as const;

/** Abonnements fournisseurs. Basic : 30 jours. Premium : 1 an (inclut la Vitrine). */
export const SUBSCRIPTION_PRICING = {
  basic: {
    amount: 25_000,
    currency: "XOF",
    days: 30,
    description: "Abonnement Basic (30 jours)",
  },
  premium: {
    amount: 200_000,
    currency: "XOF",
    days: 365,
    description: "Abonnement Premium (1 an)",
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PRICING;

export function isSubscriptionPlan(value: string): value is SubscriptionPlanId {
  return value === "basic" || value === "premium";
}
