// ==========================================
// PAIEMENTS — accès données internes (queries/mutations)
// ==========================================
// Séparé de payments.ts : aucun module ne doit référencer
// `internal.<lui-même>` — les auto-références intra-module créent une
// instanciation circulaire des types dans ApiFromModules, qui déclenche
// une cascade TS2589 / TS7022 sur l'ensemble du codebase.
// Ce fichier ne référence AUCUNE fonction api/internal : graphe de types
// acyclique (terminal).

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
// Type-only : sans incidence sur ApiFromModules.
// Les annotations de retour ci-dessous cassent la boucle d'inférence
// (corps du handler → internal.* → ApiFromModules → type de la fonction).
import type { Doc, Id } from "./_generated/dataModel";

// ==========================================
// INTERNAL MUTATIONS
// ==========================================

/**
 * Internal: Create payment record
 */
export const _createPayment = internalMutation({
  args: {
    userId: v.string(),
    supplierId: v.optional(v.id("suppliers")),
    purchaseRequestId: v.optional(v.id("purchaseRequests")),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    monerooPaymentId: v.string(),
    monerooCheckoutUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    guestEmail: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"payments">> => {
    const now = new Date().toISOString();
    return await ctx.db.insert("payments", {
      userId: args.userId,
      supplierId: args.supplierId,
      purchaseRequestId: args.purchaseRequestId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      monerooPaymentId: args.monerooPaymentId,
      monerooCheckoutUrl: args.monerooCheckoutUrl,
      description: args.description,
      metadata: args.metadata,
      guestEmail: args.guestEmail,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Internal: Update payment status
 */
export const _updatePaymentStatus = internalMutation({
  args: {
    paymentId: v.id("payments"),
    status: v.string(),
    paidAt: v.optional(v.string()),
    failedAt: v.optional(v.string()),
    refundReason: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const now = new Date().toISOString();
    const update: any = {
      status: args.status,
      updatedAt: now,
    };
    if (args.paidAt) update.paidAt = args.paidAt;
    if (args.failedAt) update.failedAt = args.failedAt;
    if (args.refundReason) update.refundReason = args.refundReason;

    await ctx.db.patch(args.paymentId, update);
    return { success: true };
  },
});

/**
 * Internal: Update supplier featured / subscription status.
 * NB : la table suppliers utilise `updated_at` (et non `updatedAt`).
 */
export const _updateSupplierFeatured = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
    featured: v.boolean(),
    featuredUntil: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const update: any = {
      featured: args.featured,
      updated_at: new Date().toISOString(),
    };
    if (args.featuredUntil) update.featuredUntil = args.featuredUntil;
    if (args.subscriptionPlan) update.subscriptionPlan = args.subscriptionPlan;
    if (args.subscriptionExpiresAt) {
      update.subscriptionExpiresAt = args.subscriptionExpiresAt;
    }

    await ctx.db.patch(args.supplierId, update);
    return { success: true };
  },
});

/**
 * Internal: Create notification for payment
 */
export const _createPaymentNotification = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    paymentId: v.id("payments"),
    type: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"notifications">> => {
    const now = new Date().toISOString();
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: { paymentId: args.paymentId },
      read: false,
      createdAt: now,
    });
  },
});

// ==========================================
// INTERNAL QUERIES (utilisées via ctx.runQuery depuis les actions)
// ==========================================

/**
 * Internal: Get payment by Moneroo ID
 */
export const _getPaymentByMonerooId = internalQuery({
  args: {
    monerooPaymentId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<Doc<"payments"> | null> => {
    return await ctx.db
      .query("payments")
      .withIndex(
        "monerooPaymentId",
        (q) => q.eq("monerooPaymentId", args.monerooPaymentId)
      )
      .first();
  },
});

/**
 * Internal: Get payment by ID
 */
export const _getPaymentById = internalQuery({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args): Promise<Doc<"payments"> | null> => {
    return await ctx.db.get(args.paymentId);
  },
});

/**
 * Internal: Get supplier profile for a user
 */
export const _getSupplierByUserId = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<Doc<"suppliers"> | null> => {
    return await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Internal: Dernier paiement Xpress en attente pour une demande
 * (permet de réutiliser l'URL de checkout existante)
 */
export const _getPendingXpressPayment = internalQuery({
  args: {
    requestId: v.id("purchaseRequests"),
  },
  handler: async (ctx, args): Promise<Doc<"payments"> | null> => {
    return await ctx.db
      .query("payments")
      .withIndex("purchaseRequestId", (q) =>
        q.eq("purchaseRequestId", args.requestId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .first();
  },
});

/**
 * Internal: Paiements en attente plus vieux que N minutes (filet de
 * sécurité si un webhook Moneroo n'a pas été reçu)
 */
export const _getPendingPaymentsOlderThan = internalQuery({
  args: {
    olderThanMinutes: v.number(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ _id: Id<"payments">; monerooPaymentId: string }[]> => {
    const cutoff = new Date(
      Date.now() - args.olderThanMinutes * 60 * 1000
    ).toISOString();
    const pending = await ctx.db
      .query("payments")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();
    // Ne renvoyer que les champs sérialisables nécessaires au sweep
    return pending.map((p) => ({
      _id: p._id,
      monerooPaymentId: p.monerooPaymentId,
    }));
  },
});
