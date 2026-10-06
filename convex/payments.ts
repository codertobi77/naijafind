import {
  action,
  internalAction,
  internalMutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  XPRESS_PRICING,
  FEATURED_PRICING,
  SUBSCRIPTION_PRICING,
} from "./pricing";
import {
  initializeMonerooPayment,
  type MonerooCustomer,
} from "./moneroo";
// Type-only : les annotations de retour des handlers ci-dessous cassent la
// boucle d'inférence (corps → internal.* → ApiFromModules → type du handler)
// responsable de la cascade TS2589/TS7022 sur l'ensemble du codebase.
import type { Doc, Id } from "./_generated/dataModel";

// ==========================================
// MODULE DE PAIEMENT MONEROO — actions publiques + crons
// ==========================================
// Architecture du module (découpé pour éviter toute auto-référence
// `internal.<module courant>`, responsable d'une instanciation circulaire
// des types dans ApiFromModules — cascade TS2589/TS7022 sur tout le codebase) :
//   - moneroo.ts            : helpers HTTP Moneroo (aucune fonction Convex)
//   - paymentsData.ts       : queries/mutations internes (accès DB pur)
//   - paymentsProcessing.ts : action interne webhook + crédit des avantages
//   - payments.ts (ici)     : actions publiques (init paiements, vérification)
//                             + crons (sweep, expiration Vitrine)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==========================================
// ACTIONS PUBLIQUES (initialisation des paiements)
// ==========================================

/**
 * Initialiser le paiement d'un abonnement (Basic / Premium).
 * Montant dérivé du plan côté serveur — jamais fourni par le client.
 */
export const initializeSubscription = action({
  args: {
    plan: v.union(v.literal("basic"), v.literal("premium")),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    paymentId: Id<"payments">;
    monerooPaymentId: string;
    checkoutUrl: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    // Rate limiting: max 5 initialisations / heure / utilisateur
    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: identity.tokenIdentifier,
      action: "payment_initialization",
      limit: 5,
      windowMinutes: 60,
    });

    const supplier = await ctx.runQuery(
      internal.paymentsData._getSupplierByUserId,
      { userId: identity.tokenIdentifier }
    );
    if (!supplier) {
      throw new Error("Profil fournisseur non trouvé");
    }

    const pricing = SUBSCRIPTION_PRICING[args.plan];
    const customer: MonerooCustomer = {
      email: (identity.email as string | undefined) ?? supplier.email,
      first_name: (identity.given_name as string | undefined) ?? "Client",
      last_name: (identity.family_name as string | undefined) ?? "Naijafind",
    };

    const checkout = await initializeMonerooPayment({
      amount: pricing.amount,
      currency: pricing.currency,
      description: pricing.description,
      customer,
      metadata: {
        type: "subscription",
        plan: args.plan,
        supplierId: supplier._id,
      },
    });

    const paymentId = await ctx.runMutation(
      internal.paymentsData._createPayment,
      {
        userId: identity.tokenIdentifier,
        supplierId: supplier._id,
        type: "subscription",
        amount: pricing.amount,
        currency: pricing.currency,
        monerooPaymentId: checkout.id,
        monerooCheckoutUrl: checkout.checkoutUrl,
        description: pricing.description,
        metadata: {
          plan: args.plan,
          supplierId: supplier._id,
        },
      }
    );

    return {
      success: true,
      paymentId,
      monerooPaymentId: checkout.id,
      checkoutUrl: checkout.checkoutUrl,
    };
  },
});

/**
 * Initialiser le paiement de la mise en avant « Vitrine » (50 000 XOF / 30 jours).
 */
export const initializeFeaturedUpgrade = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    success: boolean;
    paymentId: Id<"payments">;
    monerooPaymentId: string;
    checkoutUrl: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: identity.tokenIdentifier,
      action: "payment_initialization",
      limit: 5,
      windowMinutes: 60,
    });

    const supplier = await ctx.runQuery(
      internal.paymentsData._getSupplierByUserId,
      { userId: identity.tokenIdentifier }
    );
    if (!supplier) {
      throw new Error("Profil fournisseur non trouvé");
    }

    const customer: MonerooCustomer = {
      email: (identity.email as string | undefined) ?? supplier.email,
      first_name: (identity.given_name as string | undefined) ?? "Client",
      last_name: (identity.family_name as string | undefined) ?? "Naijafind",
    };

    const checkout = await initializeMonerooPayment({
      amount: FEATURED_PRICING.amount,
      currency: FEATURED_PRICING.currency,
      description: FEATURED_PRICING.description,
      customer,
      metadata: {
        type: "featured_upgrade",
        supplierId: supplier._id,
      },
    });

    const paymentId = await ctx.runMutation(
      internal.paymentsData._createPayment,
      {
        userId: identity.tokenIdentifier,
        supplierId: supplier._id,
        type: "featured_upgrade",
        amount: FEATURED_PRICING.amount,
        currency: FEATURED_PRICING.currency,
        monerooPaymentId: checkout.id,
        monerooCheckoutUrl: checkout.checkoutUrl,
        description: FEATURED_PRICING.description,
        metadata: { supplierId: supplier._id },
      }
    );

    return {
      success: true,
      paymentId,
      monerooPaymentId: checkout.id,
      checkoutUrl: checkout.checkoutUrl,
    };
  },
});

/**
 * Initialiser le paiement Xpress d'une demande d'achat (15 000 XOF).
 * Public : les invités peuvent payer (la demande est créée en Normal,
 * puis passée en Xpress après confirmation du paiement).
 */
export const initializeXpressPayment = action({
  args: {
    requestId: v.id("purchaseRequests"),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    checkoutUrl: string;
    monerooPaymentId: string;
    reused?: boolean;
    paymentId?: Id<"payments">;
  }> => {
    const email = args.customerEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Adresse email invalide");
    }

    // Rate limiting: max 5 initialisations / heure / email
    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: email,
      action: "xpress_payment_init",
      limit: 5,
      windowMinutes: 60,
    });

    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.tokenIdentifier ?? `guest:${email}`;

    const request = await ctx.runQuery(
      internal.purchaseRequests._getRequestById,
      { requestId: args.requestId }
    );
    if (!request) {
      throw new Error("Demande introuvable");
    }
    if (request.processingOption === "xpress") {
      throw new Error("Cette demande est déjà en traitement Xpress");
    }

    // Réutiliser le checkout en attente s'il existe (évite les doublons Moneroo)
    const existing = await ctx.runQuery(
      internal.paymentsData._getPendingXpressPayment,
      { requestId: args.requestId }
    );
    if (existing?.monerooCheckoutUrl) {
      return {
        success: true,
        checkoutUrl: existing.monerooCheckoutUrl,
        monerooPaymentId: existing.monerooPaymentId,
        reused: true,
      };
    }

    const customer: MonerooCustomer = {
      email,
      first_name: (identity?.given_name as string | undefined) ?? "Client",
      last_name: (identity?.family_name as string | undefined) ?? "Naijafind",
    };
    if (args.customerPhone) {
      customer.phone = args.customerPhone;
    }

    const checkout = await initializeMonerooPayment({
      amount: XPRESS_PRICING.amount,
      currency: XPRESS_PRICING.currency,
      description: XPRESS_PRICING.description,
      customer,
      metadata: {
        type: "xpress_upgrade",
        requestId: args.requestId,
        guestEmail: email,
      },
    });

    const paymentId = await ctx.runMutation(
      internal.paymentsData._createPayment,
      {
        userId,
        purchaseRequestId: args.requestId,
        type: "xpress_upgrade",
        amount: XPRESS_PRICING.amount,
        currency: XPRESS_PRICING.currency,
        monerooPaymentId: checkout.id,
        monerooCheckoutUrl: checkout.checkoutUrl,
        description: XPRESS_PRICING.description,
        metadata: {
          requestId: args.requestId,
          guestEmail: email,
        },
        guestEmail: identity ? undefined : email,
      }
    );

    return {
      success: true,
      paymentId,
      monerooPaymentId: checkout.id,
      checkoutUrl: checkout.checkoutUrl,
    };
  },
});

/**
 * Vérifier le statut d'un paiement (public, rate-limité).
 * Utilisé par les pages de retour /payment/success et /payment/failed,
 * y compris pour les paiements invités (Xpress sans compte).
 * Re-vérifie systématiquement le statut réel auprès de Moneroo.
 */
export const verifyPaymentPublic = action({
  args: {
    monerooPaymentId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; status: string; type: string | null }> => {
    // Rate limiting: max 10 vérifications / heure / paiement
    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: `verify:${args.monerooPaymentId}`,
      action: "payment_verification",
      limit: 10,
      windowMinutes: 60,
    });

    await ctx.runAction(internal.paymentsProcessing._processMonerooWebhook, {
      event: "payment.initiated",
      monerooPaymentId: args.monerooPaymentId,
    });

    const payment = await ctx.runQuery(
      internal.paymentsData._getPaymentByMonerooId,
      { monerooPaymentId: args.monerooPaymentId }
    );
    if (!payment) {
      return { success: false, status: "unknown", type: null };
    }
    return { success: true, status: payment.status, type: payment.type };
  },
});

// ==========================================
// INTERNAL ACTIONS (cron)
// ==========================================

/**
 * Internal (cron) : filet de sécurité — re-vérifier les paiements en
 * attente de plus de 15 minutes au cas où le webhook n'aurait pas été reçu.
 */
export const sweepPendingPayments = internalAction({
  args: {},
  handler: async (ctx): Promise<{ checked: number }> => {
    const stale = await ctx.runQuery(
      internal.paymentsData._getPendingPaymentsOlderThan,
      { olderThanMinutes: 15 }
    );
    for (const payment of stale) {
      try {
        await ctx.runAction(
          internal.paymentsProcessing._processMonerooWebhook,
          {
            event: "payment.initiated",
            monerooPaymentId: payment.monerooPaymentId,
          }
        );
      } catch (error) {
        console.error(
          `Sweep: échec de vérification du paiement ${payment.monerooPaymentId}:`,
          error
        );
      }
    }
    return { checked: stale.length };
  },
});

// ==========================================
// QUERIES
// ==========================================

/**
 * Get current user's payments
 */
export const getMyPayments = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Doc<"payments">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const limit = Math.min(args.limit ?? 50, 100);
    const status = args.status;

    const paymentsQuery = status
      ? ctx.db
          .query("payments")
          .withIndex("userId_status", (q) =>
            q.eq("userId", identity.tokenIdentifier).eq("status", status)
          )
      : ctx.db
          .query("payments")
          .withIndex("userId", (q) =>
            q.eq("userId", identity.tokenIdentifier)
          );

    return await paymentsQuery.order("desc").take(limit);
  },
});

// NOTE: getPaymentStatus / getAllPayments / getPaymentStats / cancelPayment
// (ancienne API publique, non utilisée par le frontend) ont été retirés lors de
// la réécriture du module — ils pourront être réintroduits avec l'UI admin des
// paiements. Les index `status` et `type` restent dans le schéma à cet effet.

// ==========================================
// CRON JOBS (enregistrées dans crons.ts)
// ==========================================

/**
 * Vérifier et désactiver les statuts Vitrine expirés.
 * Appelée quotidiennement par cron (internal).
 */
export const checkExpiredFeatured = internalMutation({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    success: boolean;
    checked: number;
    expired: number;
    updated: number;
  }> => {
    const now = new Date().toISOString();

    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("featured", (q) => q.eq("featured", true))
      .collect();

    const expiredSuppliers = suppliers.filter(
      (s) => s.featuredUntil && s.featuredUntil < now
    );

    let updated = 0;

    for (const supplier of expiredSuppliers) {
      // Vérifier si l'abonnement est également expiré
      const subscriptionExpired =
        !supplier.subscriptionExpiresAt ||
        supplier.subscriptionExpiresAt < now;

      await ctx.db.patch(supplier._id, {
        featured: false,
        updated_at: now,
        // Si l'abonnement est aussi expiré, repasser au plan gratuit
        ...(subscriptionExpired ? { subscriptionPlan: "free" } : {}),
      });

      // Notifier le propriétaire
      await ctx.db.insert("notifications", {
        userId: supplier.userId,
        type: "subscription_expired",
        title: "Statut Vitrine expiré",
        message:
          "Votre statut en vitrine a expiré. Renouvelez pour continuer à apparaître en avant.",
        read: false,
        actionUrl: "/dashboard",
        createdAt: now,
      });

      updated++;
    }

    return {
      success: true,
      checked: suppliers.length,
      expired: expiredSuppliers.length,
      updated,
    };
  },
});
