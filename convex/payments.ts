import {
  action,
  internalAction,
  internalMutation,
  query,
} from "./_generated/server";
import type { GenericActionCtx } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  XPRESS_PRICING,
  FEATURED_PRICING,
  SUBSCRIPTION_PRICING,
} from "./pricing";
import {
  initializeMonerooPayment,
  getSiteUrl,
  type MonerooCustomer,
} from "./moneroo";
import { isNotifiableUserId } from "./notificationUtils";
import { subscriptionExpiryReminderTemplate } from "./emailTemplates";
// Type-only : les annotations de retour des handlers ci-dessous cassent la
// boucle d'inférence (corps → internal.* → ApiFromModules → type du handler)
// responsable de la cascade TS2589/TS7022 sur l'ensemble du codebase.
import type { DataModel, Doc, Id } from "./_generated/dataModel";

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
 * Cœur partagé des paiements Xpress pour une demande EXISTANTE : réutilise
 * un checkout en attente s'il y en a un, sinon initialise un nouveau paiement
 * Moneroo et enregistre le doc payments correspondant (xpress_upgrade).
 * Fonction simple (pas une fonction Convex) : appelée par
 * initializeXpressPayment et retryXpressCheckout.
 */
async function startXpressUpgradeCheckout({
  ctx,
  requestId,
  email,
  phone,
  userId,
  givenName,
  familyName,
}: {
  ctx: GenericActionCtx<DataModel>;
  requestId: Id<"purchaseRequests">;
  email: string;
  phone?: string;
  userId: string;
  givenName?: string;
  familyName?: string;
}): Promise<{
  checkoutUrl: string;
  monerooPaymentId: string;
  reused?: boolean;
  paymentId?: Id<"payments">;
}> {
  // Rate limiting: max 5 initialisations / heure / email
  await ctx.runAction(internal.rateLimit.enforceRateLimit, {
    identifier: email,
    action: "xpress_payment_init",
    limit: 5,
    windowMinutes: 60,
  });

  const request = await ctx.runQuery(
    internal.purchaseRequests._getRequestById,
    { requestId }
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
    { requestId }
  );
  if (existing?.monerooCheckoutUrl) {
    return {
      checkoutUrl: existing.monerooCheckoutUrl,
      monerooPaymentId: existing.monerooPaymentId,
      reused: true,
    };
  }

  const customer: MonerooCustomer = {
    email,
    first_name: givenName ?? "Client",
    last_name: familyName ?? "Naijafind",
  };
  if (phone) {
    customer.phone = phone;
  }

  const checkout = await initializeMonerooPayment({
    amount: XPRESS_PRICING.amount,
    currency: XPRESS_PRICING.currency,
    description: XPRESS_PRICING.description,
    customer,
    metadata: {
      type: "xpress_upgrade",
      requestId,
      guestEmail: email,
    },
  });

  const paymentId = await ctx.runMutation(
    internal.paymentsData._createPayment,
    {
      userId,
      purchaseRequestId: requestId,
      type: "xpress_upgrade",
      amount: XPRESS_PRICING.amount,
      currency: XPRESS_PRICING.currency,
      monerooPaymentId: checkout.id,
      monerooCheckoutUrl: checkout.checkoutUrl,
      description: XPRESS_PRICING.description,
      metadata: {
        requestId,
        guestEmail: email,
      },
      guestEmail: userId.startsWith("guest:") ? email : undefined,
    }
  );

  return {
    checkoutUrl: checkout.checkoutUrl,
    monerooPaymentId: checkout.id,
    paymentId,
  };
}

/**
 * Initialiser le paiement Xpress d'une demande d'achat EXISTANTE
 * (15 000 XOF) — flux « upgrade » : dashboard (list/detail), réessai après
 * annulation d'un checkout direct. Public : les invités peuvent payer
 * (la demande est créée en Normal, puis passée en Xpress après confirmation
 * du paiement).
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

    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.tokenIdentifier ?? `guest:${email}`;

    const { checkoutUrl, monerooPaymentId, reused, paymentId } =
      await startXpressUpgradeCheckout({
        ctx,
        requestId: args.requestId,
        email,
        phone: args.customerPhone,
        userId,
        givenName: identity?.given_name as string | undefined,
        familyName: identity?.family_name as string | undefined,
      });

    return {
      success: true,
      checkoutUrl,
      monerooPaymentId,
      reused,
      paymentId,
    };
  },
});

/**
 * Initialiser un checkout Xpress SANS demande préalable (flux « Xpress
 * direct ») : l'utilisateur est redirigé immédiatement vers la page de
 * checkout Moneroo — aucune page intermédiaire, aucune création de demande
 * en base avant le paiement.
 *
 * Le payload complet du formulaire est stocké en JSON dans metadata.payload
 * du doc payments (type "xpress_new") : la demande sera créée au traitement
 * du paiement — en Xpress si confirmé, en Normal si annulé/échoué (fallback,
 * cf. paymentsProcessing.ts).
 */
export const initializeXpressCheckout = action({
  args: {
    description: v.string(),
    quantity: v.number(),
    unit: v.string(),
    whatsapp: v.string(),
    attachment: v.optional(v.string()),
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
  }> => {
    const email = args.customerEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Adresse email invalide");
    }
    const description = args.description.trim();
    if (!description) {
      throw new Error("La description est requise");
    }
    if (!(args.quantity > 0)) {
      throw new Error("La quantité doit être supérieure à 0");
    }
    if (!args.unit.trim() || !args.whatsapp.trim()) {
      throw new Error("Champs manquants");
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

    // Payload du formulaire, stocké côté serveur pour la création de la
    // demande au traitement du paiement (metadata est un record<string,
    // string> → sérialisation JSON). Les métadonnées envoyées à Moneroo
    // restent minimales (taille limitée côté prestataire).
    const payload = JSON.stringify({
      description,
      quantity: args.quantity,
      unit: args.unit,
      whatsapp: args.whatsapp.trim(),
      attachment: args.attachment ?? undefined,
      customerEmail: email,
    });

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
        type: "xpress_new",
        guestEmail: email,
      },
    });

    await ctx.runMutation(internal.paymentsData._createPayment, {
      userId,
      type: "xpress_new",
      amount: XPRESS_PRICING.amount,
      currency: XPRESS_PRICING.currency,
      monerooPaymentId: checkout.id,
      monerooCheckoutUrl: checkout.checkoutUrl,
      description: XPRESS_PRICING.description,
      metadata: {
        type: "xpress_new",
        payload,
        guestEmail: email,
      },
      guestEmail: identity ? undefined : email,
    });

    return {
      success: true,
      checkoutUrl: checkout.checkoutUrl,
      monerooPaymentId: checkout.id,
    };
  },
});

/**
 * Réessayer le Xpress pour une demande issue du flux « Xpress direct » dont
 * le paiement a été annulé/échoué : la demande existe déjà en Normal (créée
 * au fallback) — on initialise un NOUVEAU paiement xpress_upgrade pour cette
 * même demande. Public : appelé depuis la page de retour de paiement.
 */
export const retryXpressCheckout = action({
  args: {
    monerooPaymentId: v.string(),
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
    // Rate limiting: max 5 essais / heure / paiement d'origine
    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: `retry:${args.monerooPaymentId}`,
      action: "xpress_retry",
      limit: 5,
      windowMinutes: 60,
    });

    const payment = await ctx.runQuery(
      internal.paymentsData._getPaymentByMonerooId,
      { monerooPaymentId: args.monerooPaymentId }
    );
    if (!payment) {
      throw new Error("Paiement introuvable");
    }
    if (payment.type !== "xpress_new") {
      throw new Error("Ce paiement ne correspond pas à un checkout Xpress direct");
    }
    if (payment.status === "completed") {
      throw new Error("Ce paiement a déjà été confirmé");
    }
    if (!payment.purchaseRequestId) {
      throw new Error("La demande associée n'a pas encore été enregistrée");
    }

    const email = (
      payment.guestEmail ?? payment.metadata?.guestEmail ?? ""
    ).toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Adresse email introuvable pour ce paiement");
    }

    const { checkoutUrl, monerooPaymentId, reused, paymentId } =
      await startXpressUpgradeCheckout({
        ctx,
        requestId: payment.purchaseRequestId,
        email,
        userId: payment.userId,
      });

    return {
      success: true,
      checkoutUrl,
      monerooPaymentId,
      reused,
      paymentId,
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
  ): Promise<{
    success: boolean;
    status: string;
    type: string | null;
    requestId?: string;
    requestNumber?: number;
  }> => {
    // Rate limiting: max 10 vérifications / heure / paiement
    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: `verify:${args.monerooPaymentId}`,
      action: "payment_verification",
      limit: 10,
      windowMinutes: 60,
    });

    // Le passage webhook crée la demande le cas échéant : paiement confirmé
    // → xpress ; paiement annulé/échoué → fallback normal (flux xpress_new).
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

    // Flux « Xpress direct » : exposer la demande créée au paiement (N° de
    // suivi, actions « réessayer / formulaire » sur la page de retour).
    let requestId: string | undefined;
    let requestNumber: number | undefined;
    if (payment.type === "xpress_new" && payment.purchaseRequestId) {
      const request = await ctx.runQuery(
        internal.purchaseRequests._getRequestById,
        { requestId: payment.purchaseRequestId }
      );
      requestId = payment.purchaseRequestId;
      requestNumber = request?.requestNumber ?? undefined;
    }

    return {
      success: true,
      status: payment.status,
      type: payment.type,
      requestId,
      requestNumber,
    };
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

/**
 * Rappel avant expiration : notifier les fournisseurs dont le statut Vitrine
 * ou l'abonnement expire sous 3 jours (notification in-app + email).
 *
 * Idempotence : le champ expiryReminderSentAt est posé sur le doc supplier —
 * au plus un rappel tous les 7 jours par fournisseur (la fenêtre de 3 jours
 * couvre au maximum 3 exécutions quotidiennes du cron sans cette garde).
 *
 * Appelée quotidiennement par cron (crons.ts : notifyExpiringSoon).
 */
export const _notifyExpiringSoon = internalMutation({
  args: {},
  handler: async (
    ctx
  ): Promise<{ checked: number; notified: number }> => {
    const now = new Date().toISOString();
    const inThreeDays = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Scan borné de la table suppliers (taille modérée ; checkExpiredFeatured
    // scanne déjà l'index `featured` de la même façon).
    const suppliers = await ctx.db.query("suppliers").take(10000);

    let notified = 0;

    for (const supplier of suppliers) {
      const expiringFeatured =
        !!supplier.featuredUntil &&
        supplier.featuredUntil > now &&
        supplier.featuredUntil <= inThreeDays;
      const expiringSubscription =
        !!supplier.subscriptionExpiresAt &&
        supplier.subscriptionExpiresAt > now &&
        supplier.subscriptionExpiresAt <= inThreeDays;

      if (!expiringFeatured && !expiringSubscription) continue;

      // Idempotence : un seul rappel par cycle de 7 jours
      if (supplier.expiryReminderSentAt) {
        const lastReminder = new Date(supplier.expiryReminderSentAt).getTime();
        if (Date.now() - lastReminder < 7 * 24 * 60 * 60 * 1000) continue;
      }

      // Garde anti-invité
      if (!isNotifiableUserId(supplier.userId)) continue;

      const kind = expiringFeatured ? "vitrine" : "abonnement";
      const expiresAt = expiringFeatured
        ? supplier.featuredUntil!
        : supplier.subscriptionExpiresAt!;

      // Notification in-app
      try {
        await ctx.db.insert("notifications", {
          userId: supplier.userId,
          type: "system",
          title: "Votre statut expire bientôt",
          message:
            kind === "vitrine"
              ? "Votre statut Vitrine expire dans moins de 3 jours. Renouvelez-le depuis votre tableau de bord pour garder votre visibilité."
              : "Votre abonnement expire dans moins de 3 jours. Renouvelez-le depuis votre tableau de bord pour garder vos avantages.",
          data: {
            supplierId: supplier._id as unknown as string,
            kind,
            expiresAt,
          },
          read: false,
          actionUrl: "/dashboard",
          createdAt: now,
        });
      } catch (notifError) {
        console.error(
          `Rappel expiration : échec de la notification in-app pour ${supplier._id}:`,
          notifError
        );
      }

      // Email de rappel (best-effort)
      try {
        await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction as any, {
          to: supplier.email,
          subject: "Votre statut Suji expire bientôt",
          html: subscriptionExpiryReminderTemplate({
            siteUrl: getSiteUrl(),
            kind,
            expiresAt,
          }),
        });
      } catch (emailError) {
        console.error(
          `Rappel expiration : échec de l'email pour ${supplier._id}:`,
          emailError
        );
      }

      // Marquer le rappel comme envoyé (avant notified++ pour rester idempotent
      // même si l'un des deux canaux a échoué — l'essentiel est envoyé)
      await ctx.db.patch(supplier._id, { expiryReminderSentAt: now });
      notified++;
    }

    return { checked: suppliers.length, notified };
  },
});
