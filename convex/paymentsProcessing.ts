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
import { fetchMonerooVerification, mapMonerooStatus, getSiteUrl } from "./moneroo";
import { xpressGuestReceiptTemplate } from "./emailTemplates";

/**
 * Créer la demande d'achat portée par un paiement « xpress_new » (flux
 * « Xpress direct » : checkout AVANT création) puis notifier les
 * fournisseurs correspondants (best-effort, comme createPurchaseRequest).
 * Fonction simple (pas une fonction Convex) : appelée par
 * fulfillSuccessfulPayment (paiement confirmé → 'xpress') et par le passage
 * failed de _processMonerooWebhook (annulation → fallback 'normal').
 * L'idempotence est garantie par la mutation cible (garde sur
 * payment.purchaseRequestId).
 */
async function createRequestFromXpressPayment(
  ctx: GenericActionCtx<DataModel>,
  payment: Doc<"payments">,
  processingOption: "normal" | "xpress"
): Promise<void> {
  const created = await ctx.runMutation(
    internal.purchaseRequests._createRequestFromXpressPayment,
    { paymentId: payment._id, processingOption }
  );
  if (!created.success || !created.requestId) {
    console.error(
      `xpress_new : échec de création de la demande pour le paiement ${payment._id} (${created.reason ?? "inconnu"})`
    );
    return;
  }

  // Notifier les fournisseurs correspondants (best-effort : ne doit jamais
  // faire échouer le traitement du paiement).
  try {
    if (created.description) {
      const matchingSuppliers = await ctx.runQuery(
        internal.purchaseRequests._findMatchingSuppliers,
        { description: created.description, limit: 20 }
      );
      for (const supplier of matchingSuppliers) {
        await ctx.runMutation(
          internal.purchaseRequests._createNotification,
          {
            userId: supplier.userId,
            type: "purchase_request",
            title: "Nouvelle demande d'achat",
            message: `${created.description} - ${created.quantity ?? ""} ${created.unit ?? ""}`.trim(),
            data: {
              requestId: created.requestId,
              requestNumber: created.requestNumber,
            },
            actionUrl: `/dashboard/purchase-requests/${created.requestId}`,
          }
        );
      }
    }
  } catch (notifyError) {
    console.error(
      "xpress_new : échec de la notification des fournisseurs :",
      notifyError
    );
  }
}

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

      // Reçu email pour les invités (Xpress payé sans compte) : ils n'ont
      // ni notification in-app ni page de suivi — le reçu email est leur
      // seule confirmation. Best-effort : n'échoue jamais le paiement.
      if (payment.guestEmail) {
        try {
          await ctx.runAction(internal.sendEmail.sendEmailAction, {
            to: payment.guestEmail,
            subject: "Paiement Xpress confirmé — traitement sous 48-72h",
            html: xpressGuestReceiptTemplate({
              siteUrl: getSiteUrl(),
              amount: payment.amount,
              currency: payment.currency,
            }),
          });
        } catch (receiptError) {
          console.error(
            "Échec de l'envoi du reçu Xpress (invité) :",
            receiptError
          );
        }
      }
      break;
    }

    case "xpress_new": {
      // Flux « Xpress direct » : la demande n'existait PAS avant le paiement —
      // c'est ici qu'elle est créée, en Xpress (payée). Le payload du
      // formulaire vient du doc payments (metadata.payload).
      await createRequestFromXpressPayment(ctx, payment, "xpress");

      // Reçu email pour les invités (Xpress payé sans compte) : ils n'ont
      // ni notification in-app ni page de suivi — le reçu email est leur
      // seule confirmation. Best-effort : n'échoue jamais le paiement.
      if (payment.guestEmail) {
        try {
          await ctx.runAction(internal.sendEmail.sendEmailAction, {
            to: payment.guestEmail,
            subject: "Paiement Xpress confirmé — traitement sous 48-72h",
            html: xpressGuestReceiptTemplate({
              siteUrl: getSiteUrl(),
              amount: payment.amount,
              currency: payment.currency,
            }),
          });
        } catch (receiptError) {
          console.error(
            "Échec de l'envoi du reçu Xpress (invité) :",
            receiptError
          );
        }
      }
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
    } else if (
      newStatus === "failed" &&
      payment.type === "xpress_new" &&
      !payment.purchaseRequestId
    ) {
      // Flux « Xpress direct » : paiement annulé/échoué → la demande est quand
      // même enregistrée en option Normal. Couvre le webhook payment.cancelled/
      // payment.failed ET la re-vérification au retour utilisateur (la création
      // est idempotente via la garde purchaseRequestId).
      await createRequestFromXpressPayment(ctx, payment, "normal");
    }

    return { success: true, status: newStatus };
  },
});
