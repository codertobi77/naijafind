// ==========================================
// PAIEMENTS — traitement des événements Moneroo (action interne)
// ==========================================
// Appelée par :
//   - le webhook HTTP (convex/http.ts → /webhooks/moneroo) ;
//   - verifyPaymentPublic (pages de retour /payment/success|failed) ;
//   - sweepPendingPayments (cron, filet de sécurité).
// Séparé de payments.ts/paymentsData.ts : aucune auto-référence
// `internal.<module courant>` (instanciation circulaire → TS2589/TS7022).

import type { GenericActionCtx } from "convex/server";
import type { DataModel, Doc } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  FEATURED_PRICING,
  SUBSCRIPTION_PRICING,
  isSubscriptionPlan,
  type SubscriptionPlanId,
} from "./pricing";
import { fetchMonerooVerification, mapMonerooStatus } from "./moneroo";

/**
 * Crédite les avantages d'un paiement réussi (Vitrine, abonnement, Xpress).
 * Fonction simple (pas une fonction Convex) : appelée en direct par
 * _processMonerooWebhook ci-dessous — aucun runAction intra-module.
 * Idempotence garantie par l'appelant (statut déjà vérifié).
 */
async function fulfillSuccessfulPayment(
  ctx: GenericActionCtx<DataModel>,
  payment: Doc<"payments">
): Promise<void> {
  switch (payment.type) {
    case "featured_upgrade": {
      if (!payment.supplierId) break;
      const featuredUntil = new Date(
        Date.now() + FEATURED_PRICING.days * 24 * 60 * 60 * 1000
      ).toISOString();
      await ctx.runMutation(internal.paymentsData._updateSupplierFeatured, {
        supplierId: payment.supplierId,
        featured: true,
        featuredUntil,
      });
      await ctx.runMutation(internal.paymentsData._createPaymentNotification, {
        userId: payment.userId,
        title: "Paiement confirmé — Vitrine activée",
        message: `Paiement de ${payment.amount} ${payment.currency} confirmé. Votre entreprise est en vitrine jusqu'au ${featuredUntil}.`,
        paymentId: payment._id,
        type: "payment_success",
      });
      break;
    }

    case "subscription": {
      if (!payment.supplierId) break;
      const plan = isSubscriptionPlan(payment.metadata?.plan ?? "basic")
        ? (payment.metadata!.plan as SubscriptionPlanId)
        : "basic";
      const pricing = SUBSCRIPTION_PRICING[plan];
      const expiresAt = new Date(
        Date.now() + pricing.days * 24 * 60 * 60 * 1000
      ).toISOString();
      await ctx.runMutation(internal.paymentsData._updateSupplierFeatured, {
        supplierId: payment.supplierId,
        featured: plan === "premium", // Premium inclut la mise en vitrine
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
        ...(plan === "premium" ? { featuredUntil: expiresAt } : {}),
      });
      await ctx.runMutation(internal.paymentsData._createPaymentNotification, {
        userId: payment.userId,
        title: "Abonnement activé",
        message: `Votre abonnement ${plan} est actif jusqu'au ${expiresAt}.`,
        paymentId: payment._id,
        type: "payment_success",
      });
      break;
    }

    case "xpress_upgrade": {
      // Passer la demande en Xpress (notification gérée en interne,
      // uniquement pour les propriétaires authentifiés)
      if (!payment.purchaseRequestId) break;
      await ctx.runMutation(
        internal.purchaseRequests._markRequestAsXpress,
        { requestId: payment.purchaseRequestId }
      );
      break;
    }

    case "purchase": {
      await ctx.runMutation(internal.paymentsData._createPaymentNotification, {
        userId: payment.userId,
        title: "Paiement confirmé",
        message: `Votre paiement de ${payment.amount} ${payment.currency} a été confirmé.`,
        paymentId: payment._id,
        type: "payment_success",
      });
      break;
    }
  }
}

/**
 * Internal: Traiter un événement webhook Moneroo (appelé depuis http.ts)
 * ou une re-vérification (sweep / page de retour).
 *
 * Idempotent :
 * - ignore les paiements déjà completed/refunded ;
 * - re-vérifie TOUJOURS le statut réel auprès de Moneroo avant de
 *   créditer quoi que ce soit (protection anti-fraude).
 */
export const _processMonerooWebhook = internalAction({
  args: {
    event: v.string(), // 'payment.initiated' | 'payment.success' | 'payment.failed' | 'payment.cancelled' | 'payment.refunded'
    monerooPaymentId: v.string(),
  },
  // Annotation de retour explicite : casse la boucle d'inférence qui
  // provoquait TS7022/TS2589 en cascade sur tout le codebase.
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    status?: string;
    reason?: string;
    alreadyProcessed?: boolean;
    unchanged?: boolean;
  }> => {
    const payment = await ctx.runQuery(
      internal.paymentsData._getPaymentByMonerooId,
      { monerooPaymentId: args.monerooPaymentId }
    );
    if (!payment) {
      // Paiement inconnu (test, autre environnement…) : ne pas planter le webhook
      return { success: false, reason: "not_found" };
    }

    // Remboursement : enregistré même après un paiement complété
    if (args.event === "payment.refunded") {
      if (payment.status === "refunded") {
        return { success: true, alreadyProcessed: true };
      }
      await ctx.runMutation(internal.paymentsData._updatePaymentStatus, {
        paymentId: payment._id,
        status: "refunded",
      });
      return { success: true, status: "refunded" };
    }

    if (payment.status === "completed" || payment.status === "refunded") {
      return { success: true, alreadyProcessed: true };
    }

    const now = new Date().toISOString();
    let newStatus: string;
    let paidAt: string | undefined;
    let failedAt: string | undefined;

    if (args.event === "payment.failed" || args.event === "payment.cancelled") {
      newStatus = "failed";
      failedAt = now;
    } else {
      // payment.success, payment.initiated (webhook/sweep/vérification publique) :
      // re-vérifier systématiquement auprès de Moneroo.
      const verifiedStatus = await fetchMonerooVerification(
        args.monerooPaymentId
      );
      switch (mapMonerooStatus(verifiedStatus)) {
        case "completed":
          newStatus = "completed";
          paidAt = now;
          break;
        case "failed":
          newStatus = "failed";
          failedAt = now;
          break;
        default:
          newStatus = "pending";
      }
    }

    if (newStatus === payment.status) {
      return { success: true, unchanged: true };
    }

    await ctx.runMutation(internal.paymentsData._updatePaymentStatus, {
      paymentId: payment._id,
      status: newStatus,
      paidAt,
      failedAt,
    });

    if (newStatus === "completed") {
      await fulfillSuccessfulPayment(ctx, payment);
    }

    return { success: true, status: newStatus };
  },
});
