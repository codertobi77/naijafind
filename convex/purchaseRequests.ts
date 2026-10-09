import { mutation, query, internalQuery, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
// Type-only : annotations de retour des fonctions internes ajoutées
// (module paiements) — casse la boucle d'inférence TS7022/TS2589.
import type { Doc, Id } from "./_generated/dataModel";
import { isNotifiableUserId } from "./notificationUtils";

/**
 * Internal: Create purchase request (called from action)
 */
export const _createPurchaseRequest = mutation({
  args: {
    description: v.string(),
    quantity: v.number(),
    unit: v.string(),
    whatsapp: v.string(),
    attachment: v.optional(v.string()),
    processingOption: v.optional(v.union(v.literal('normal'), v.literal('xpress'))),
    userId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ requestId: Id<"purchaseRequests">; requestNumber: number }> => {
    const now = new Date().toISOString();
    // Normal par défaut : les anciens appelants (sans l'argument) restent rétro-compatibles.
    const processingOption = args.processingOption ?? 'normal';
    // Échéance de traitement calculée côté serveur : +72h (xpress) ou +14 jours
    // (normal — délai affiché « 1 à 2 semaines »).
    const expectedResponseAt = new Date(
      Date.now() +
        (processingOption === 'xpress'
          ? 72 * 60 * 60 * 1000
          : 14 * 24 * 60 * 60 * 1000)
    ).toISOString();

    // N° de suivi séquentiel : max des numéros existants + 1 via l'index
    // (les documents antérieurs sans numéro sont exclus de l'index).
    const lastNumbered = await ctx.db
      .query("purchaseRequests")
      .withIndex("requestNumber", (q) => q.gte("requestNumber", 1))
      .order("desc")
      .first();
    const requestNumber = (lastNumbered?.requestNumber ?? 0) + 1;

    const requestId = await ctx.db.insert("purchaseRequests", {
      description: args.description,
      quantity: args.quantity,
      unit: args.unit,
      whatsapp: args.whatsapp,
      attachment: args.attachment,
      requestNumber,
      processingOption,
      expectedResponseAt,
      status: 'pending',
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    return { requestId, requestNumber };
  },
});

/**
 * Internal: Create notification (called from action)
 */
export const _createNotification = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.any(),
    actionUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      actionUrl: args.actionUrl,
      createdAt: now,
    });
  },
});

/**
 * Internal: Lire une demande d'achat par ID (module paiements)
 */
export const _getRequestById = internalQuery({
  args: { requestId: v.id("purchaseRequests") },
  handler: async (
    ctx,
    args
  ): Promise<Doc<"purchaseRequests"> | null> => {
    return await ctx.db.get(args.requestId);
  },
});

/**
 * Internal: Passer une demande en Xpress après paiement confirmé (Moneroo).
 * Idempotent : sans effet si la demande est déjà en Xpress.
 */
export const _markRequestAsXpress = internalMutation({
  args: { requestId: v.id("purchaseRequests") },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    reason?: "not_found";
    alreadyXpress?: boolean;
  }> => {
    const now = new Date().toISOString();
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return { success: false, reason: "not_found" as const };
    }
    if (request.processingOption === "xpress") {
      return { success: true, alreadyXpress: true };
    }

    const expectedResponseAt = new Date(
      Date.now() + 72 * 60 * 60 * 1000
    ).toISOString();
    await ctx.db.patch(args.requestId, {
      processingOption: "xpress",
      expectedResponseAt,
      updatedAt: now,
    });

    // Notifier le propriétaire (comptes authentifiés uniquement —
    // les demandes invités n'ont pas de compte à notifier)
    if (
      request.userId &&
      request.userId !== "anonymous" &&
      !request.userId.startsWith("guest:")
    ) {
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: "payment_success",
        title: "Demande passée en Xpress",
        message:
          "Votre paiement Xpress a été confirmé. Votre demande sera traitée en priorité sous 48-72h.",
        data: { requestId: args.requestId },
        read: false,
        actionUrl: `/dashboard/purchase-requests/${args.requestId}`,
        createdAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Internal: Créer la demande d'achat portée par un paiement « xpress_new »
 * (flux « Xpress direct » : checkout Moneroo AVANT toute création de demande).
 * Appelée par le module paiements :
 *   - paiement confirmé  → processingOption 'xpress' (fulfillSuccessfulPayment) ;
 *   - paiement annulé/échoué → processingOption 'normal' (fallback : la demande
 *     est quand même enregistrée, l'utilisateur pourra réessayer le Xpress).
 *
 * Idempotent : sans effet si le paiement est déjà lié à une demande
 * (purchaseRequestId posé) — protège du double appel webhook + page de retour.
 * La mutation est transactionnelle : insert demande + lien paiement insécables.
 */
export const _createRequestFromXpressPayment = internalMutation({
  args: {
    paymentId: v.id("payments"),
    processingOption: v.string(), // 'normal' | 'xpress' — contrôlé par l'appelant interne
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    reason?: "payment_not_found" | "invalid_payload" | "already_linked";
    requestId?: Id<"purchaseRequests">;
    requestNumber?: number;
    description?: string;
    quantity?: number;
    unit?: string;
  }> => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      return { success: false, reason: "payment_not_found" as const };
    }

    // Garde d'idempotence : la demande a déjà été créée pour ce paiement
    if (payment.purchaseRequestId) {
      const existing = await ctx.db.get(payment.purchaseRequestId);
      return {
        success: true,
        reason: "already_linked" as const,
        requestId: payment.purchaseRequestId,
        requestNumber: existing?.requestNumber,
        description: existing?.description,
        quantity: existing?.quantity,
        unit: existing?.unit,
      };
    }

    // Payload du formulaire, stocké en JSON dans metadata.payload à
    // l'initialisation du checkout (convex/payments.ts → initializeXpressCheckout)
    let payload: {
      description: string;
      quantity: number;
      unit: string;
      whatsapp: string;
      attachment?: string;
    } | null = null;
    try {
      payload = payment.metadata?.payload
        ? JSON.parse(payment.metadata.payload)
        : null;
    } catch {
      payload = null;
    }
    if (
      !payload ||
      typeof payload.description !== "string" ||
      !payload.description.trim() ||
      typeof payload.quantity !== "number" ||
      !(payload.quantity > 0) ||
      typeof payload.unit !== "string" ||
      !payload.unit.trim() ||
      typeof payload.whatsapp !== "string" ||
      !payload.whatsapp.trim()
    ) {
      console.error(
        "xpress_new : payload invalide pour le paiement",
        payment._id
      );
      return { success: false, reason: "invalid_payload" as const };
    }

    const processingOption =
      args.processingOption === "xpress" ? "xpress" : "normal";
    const now = new Date().toISOString();
    // Échéance de traitement calculée côté serveur : +72h (xpress) ou +14 jours
    // (normal — délai affiché « 1 à 2 semaines »).
    const expectedResponseAt = new Date(
      Date.now() +
        (processingOption === "xpress"
          ? 72 * 60 * 60 * 1000
          : 14 * 24 * 60 * 60 * 1000)
    ).toISOString();

    // N° de suivi séquentiel : max des numéros existants + 1 via l'index
    const lastNumbered = await ctx.db
      .query("purchaseRequests")
      .withIndex("requestNumber", (q) => q.gte("requestNumber", 1))
      .order("desc")
      .first();
    const requestNumber = (lastNumbered?.requestNumber ?? 0) + 1;

    const requestId = await ctx.db.insert("purchaseRequests", {
      description: payload.description,
      quantity: payload.quantity,
      unit: payload.unit,
      whatsapp: payload.whatsapp,
      attachment:
        typeof payload.attachment === "string" && payload.attachment
          ? payload.attachment
          : undefined,
      requestNumber,
      processingOption,
      expectedResponseAt,
      status: "pending",
      // userId du paiement : tokenIdentifier (authentifié) ou guest:<email>
      userId: payment.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Lier le paiement à la demande : garde d'idempotence pour tout appel
    // ultérieur (webhook + page de retour concurrents).
    await ctx.db.patch(payment._id, {
      purchaseRequestId: requestId,
      updatedAt: now,
    });

    return {
      success: true,
      requestId,
      requestNumber,
      description: payload.description,
      quantity: payload.quantity,
      unit: payload.unit,
    };
  },
});

/**
 * Create a new purchase request
 * Simplified version with image support
 */
export const createPurchaseRequest = action({
  args: {
    description: v.string(),
    quantity: v.number(),
    unit: v.string(),
    whatsapp: v.string(),
    attachment: v.optional(v.string()),
    processingOption: v.optional(v.union(v.literal('normal'), v.literal('xpress'))),
  },
  // Annotation de retour explicite (cf. _getRequestById ci-dessus) : évite
  // la boucle d'inférence TS7022/TS2589 qui touchait ce module.
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    requestId: Id<"purchaseRequests">;
    requestNumber: number;
  }> => {
    // Apply rate limiting - max 3 requests per hour per phone/IP
    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: args.whatsapp,
      action: 'purchase_request',
      limit: 3,
      windowMinutes: 60,
    });
    
    const identity = await ctx.auth.getUserIdentity();
    
    // Get user info if authenticated
    let userId = 'anonymous';
    
    if (identity) {
      userId = identity.tokenIdentifier;
    }
    
    // Create purchase request via internal mutation
    const { requestId, requestNumber } = await ctx.runMutation(
      internal.purchaseRequests._createPurchaseRequest,
      {
        description: args.description,
        quantity: args.quantity,
        unit: args.unit,
        whatsapp: args.whatsapp,
        attachment: args.attachment,
        processingOption: args.processingOption,
        userId: userId,
      }
    );
    
    // Find matching suppliers and notify them
    try {
      const matchingSuppliers = await ctx.runQuery(
        internal.purchaseRequests._findMatchingSuppliers,
        {
          description: args.description,
          limit: 20,
        }
      );
      
      // Create notifications for matching suppliers
      for (const supplier of matchingSuppliers) {
        await ctx.runMutation(internal.purchaseRequests._createNotification, {
          userId: supplier.userId,
          type: 'purchase_request',
          title: 'Nouvelle demande d\'achat',
          message: `${args.description} - ${args.quantity} ${args.unit}`,
          data: { 
            requestId,
            requestNumber,
            purchaseRequest: args,
            matchScore: supplier.matchScore,
          },
          actionUrl: `/dashboard/purchase-requests/${requestId}`,
        });
      }
    } catch (error) {
      console.error('Error notifying suppliers:', error);
      // Don't fail the request if notification fails
    }
    
    return { success: true, requestId, requestNumber };
  }
});

/**
 * Delete a purchase request (owner only)
 */
export const deletePurchaseRequest = mutation({
  args: {
    id: v.id("purchaseRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Demande non trouvée");
    }
    
    // Only allow owner or admin to delete
    if (request.userId !== identity.tokenIdentifier) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      
      if (!user?.is_admin) {
        throw new Error("Accès refusé");
      }
    }
    
    // Supprimer d'abord les devis rattachés (sinon ils restent orphelins).
    // La pièce jointe vit sur le document demande (URL) : sa suppression
    // emporte la référence au fichier joint.
    const relatedQuotes = await ctx.db
      .query("quotes")
      .withIndex("requestId", (q) => q.eq("requestId", args.id))
      .take(100);
    for (const quote of relatedQuotes) {
      await ctx.db.delete(quote._id);
    }
    
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Get purchase requests for current user
 */
export const getMyPurchaseRequests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    const limit = Math.min(args.limit ?? 50, 100);
    
    const requests = await ctx.db
      .query("purchaseRequests")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .order("desc")
      .take(limit);
    
    return requests;
  }
});

/**
 * Get purchase request details by ID
 */
export const getPurchaseRequestById = query({
  args: {
    id: v.id("purchaseRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    const request = await ctx.db.get(args.id);
    if (!request) {
      return null;
    }
    
    // Accessible à tout utilisateur authentifié : les fournisseurs notifiés
    // doivent pouvoir consulter la demande d'achat pour y répondre.
    return request;
  }
});

/**
 * Update purchase request status (for suppliers/admins)
 */
export const updatePurchaseRequestStatus = mutation({
  args: {
    id: v.id("purchaseRequests"),
    status: v.string(), // 'pending', 'contacted', 'quoted', 'completed', 'cancelled'
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Demande non trouvée");
    }
    
    // Seul le propriétaire de la demande ou un admin peut modifier le statut
    if (request.userId !== identity.tokenIdentifier) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      
      if (!user?.is_admin) {
        throw new Error("Accès refusé");
      }
    }
    
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });
    
    // Notify the requester about status update
    // (garde anti-invité : pas de notification « poubelle » pour 'anonymous'/'guest:*')
    if (isNotifiableUserId(request.userId)) {
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: 'purchase_request_update',
        title: 'Mise à jour de votre demande',
        message: `Votre demande a été marquée comme: ${args.status}${args.message ? ` - ${args.message}` : ''}`,
        data: { requestId: args.id, status: args.status, message: args.message },
        read: false,
        actionUrl: `/dashboard/purchase-requests/${args.id}`,
        createdAt: now,
      });
    }
    
    return { success: true };
  }
});

/**
 * Submit a quote for a purchase request
 */
export const submitQuote = mutation({
  args: {
    requestId: v.id("purchaseRequests"),
    supplierId: v.id("suppliers"),
    price: v.number(),
    currency: v.string(),
    deliveryTime: v.string(),
    message: v.string(),
    validUntil: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Demande non trouvée");
    }
    
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Verify supplier belongs to this user
    if (supplier.userId !== identity.tokenIdentifier) {
      throw new Error("Accès refusé");
    }
    
    const now = new Date().toISOString();
    
    // Create quote
    const quoteId = await ctx.db.insert("quotes", {
      requestId: args.requestId,
      supplierId: args.supplierId,
      supplierName: supplier.business_name,
      supplierEmail: supplier.email,
      price: args.price,
      currency: args.currency,
      deliveryTime: args.deliveryTime,
      message: args.message,
      validUntil: args.validUntil,
      status: 'pending',
      createdAt: now,
    });
    
    // Notify requester (garde anti-invité)
    if (isNotifiableUserId(request.userId)) {
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: 'new_quote',
        title: 'Nouvelle offre reçue',
        message: `${supplier.business_name} vous propose une offre pour votre demande`,
        data: { 
          quoteId,
          requestId: args.requestId,
          supplierId: args.supplierId,
          price: args.price,
          currency: args.currency,
        },
        read: false,
        actionUrl: `/dashboard/purchase-requests/${args.requestId}`,
        createdAt: now,
      });
    }
    
    return { success: true, quoteId };
  }
});

/**
 * Get all purchase requests (admin only)
 */
export const getAllPurchaseRequests = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    const limit = Math.min(args.limit ?? 100, 500);
    
    // `const` local : conserve le narrowing (string, pas string | undefined)
    // à l'intérieur de la callback withIndex, contrairement à `args.status`.
    const status = args.status;
    let requests;
    if (status) {
      requests = await ctx.db
        .query("purchaseRequests")
        .withIndex("status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    } else {
      requests = await ctx.db
        .query("purchaseRequests")
        .order("desc")
        .take(limit);
    }
    
    return requests;
  },
});

/**
 * Get purchase request statistics (admin only)
 */
export const getPurchaseRequestStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    // Comptage borné via les index status/createdAt (évite de charger toutes les lignes)
    const countByStatus = async (status: string) =>
      (await ctx.db
        .query("purchaseRequests")
        .withIndex("status", (q) => q.eq("status", status))
        .take(10000)).length;
    
    const pending = await countByStatus('pending');
    const contacted = await countByStatus('contacted');
    const quoted = await countByStatus('quoted');
    const completed = await countByStatus('completed');
    const cancelled = await countByStatus('cancelled');
    
    // Demandes du jour (les dates ISO se trient lexicographiquement)
    const today = new Date().toISOString().split('T')[0];
    const todayRequests = (await ctx.db
      .query("purchaseRequests")
      .withIndex("createdAt", (q) => q.gte("createdAt", today))
      .take(10000)).length;
    
    return {
      total: pending + contacted + quoted + completed + cancelled,
      pending,
      contacted,
      quoted,
      completed,
      cancelled,
      todayRequests,
    };
  },
});

/**
 * Update purchase request status with notes (admin only)
 */
export const updatePurchaseRequestStatusAdmin = mutation({
  args: {
    id: v.id("purchaseRequests"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }
    
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }
    
    const request = await ctx.db.get(args.id);
    if (!request) {
      throw new Error("Demande non trouvée");
    }
    
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });
    
    // Notify the requester (garde anti-invité)
    if (isNotifiableUserId(request.userId)) {
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: 'purchase_request_update',
        title: 'Mise à jour de votre demande',
        message: `Votre demande a été mise à jour: ${args.status}${args.notes ? ` - ${args.notes}` : ''}`,
        data: { requestId: args.id, status: args.status, notes: args.notes },
        read: false,
        actionUrl: `/dashboard/purchase-requests/${args.id}`,
        createdAt: now,
      });
    }
    
    return { success: true };
  }
});

/**
 * Internal: Find matching suppliers for a purchase request
 * Uses keyword matching and location proximity
 */
export const _findMatchingSuppliers = internalQuery({
  args: {
    description: v.string(),
    location: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const descLower = args.description.toLowerCase();
    const locationLower = (args.location || '').toLowerCase();
    
    // Extract keywords from description
    const keywords = descLower
      .split(/[\s,;:\-]+/)
      .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word));
    
    // Get approved suppliers
    const allSuppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .take(500); // Limit to prevent timeout
    
    // Score and filter suppliers
    const scoredSuppliers = allSuppliers
      .map(supplier => {
        let score = 0;
        
        // Category match
        const categoryLower = (supplier.category || '').toLowerCase();
        if (keywords.some(kw => categoryLower.includes(kw))) {
          score += 50;
        }
        
        // Business name match
        const nameLower = (supplier.business_name || '').toLowerCase();
        if (keywords.some(kw => nameLower.includes(kw))) {
          score += 30;
        }
        
        // Description match
        const desc = (supplier.description || '').toLowerCase();
        for (const kw of keywords) {
          if (desc.includes(kw)) {
            score += 10;
          }
        }
        
        // Location match
        const cityLower = (supplier.city || '').toLowerCase();
        const stateLower = (supplier.state || '').toLowerCase();
        if (cityLower && locationLower.includes(cityLower)) {
          score += 40;
        }
        if (stateLower && locationLower.includes(stateLower)) {
          score += 30;
        }
        
        // Boost for verified/featured suppliers
        if (supplier.verified) score += 20;
        if (supplier.featured) score += 15;
        if (supplier.rating) score += Math.round(supplier.rating * 5);
        
        return { ...supplier, matchScore: score };
      })
      .filter(s => s.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
    
    return scoredSuppliers;
  },
});
