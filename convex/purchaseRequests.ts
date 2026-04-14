import { mutation, query, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Internal: Create purchase request (called from action)
 */
export const _createPurchaseRequest = mutation({
  args: {
    description: v.string(),
    quantity: v.number(),
    unit: v.string(),
    whatsapp: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("purchaseRequests", {
      description: args.description,
      quantity: args.quantity,
      unit: args.unit,
      whatsapp: args.whatsapp,
      image: args.image,
      status: 'pending',
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
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
 * Create a new purchase request
 * Simplified version with image support
 */
export const createPurchaseRequest = action({
  args: {
    description: v.string(),
    quantity: v.number(),
    unit: v.string(),
    whatsapp: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
    const requestId = await ctx.runMutation(internal.purchaseRequests._createPurchaseRequest, {
      description: args.description,
      quantity: args.quantity,
      unit: args.unit,
      whatsapp: args.whatsapp,
      image: args.image,
      userId: userId,
    });
    
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
    
    return { success: true, requestId };
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
    if (request.userId !== identity.subject) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      
      if (!user?.is_admin) {
        throw new Error("Accès refusé");
      }
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
      .withIndex("userId", (q) => q.eq("userId", identity.subject))
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
    
    // Only allow owner or admin to view
    if (request.userId !== identity.subject) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      
      if (!user?.is_admin) {
        throw new Error("Accès refusé");
      }
    }
    
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
    
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });
    
    // Notify the requester about status update
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
    if (supplier.userId !== identity.subject) {
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
    
    // Notify requester
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
    
    let requests;
    if (args.status) {
      requests = await ctx.db
        .query("purchaseRequests")
        .withIndex("status", (q) => q.eq("status", args.status))
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
    
    const allRequests = await ctx.db.query("purchaseRequests").collect();
    
    const pending = allRequests.filter(r => r.status === 'pending').length;
    const contacted = allRequests.filter(r => r.status === 'contacted').length;
    const quoted = allRequests.filter(r => r.status === 'quoted').length;
    const completed = allRequests.filter(r => r.status === 'completed').length;
    const cancelled = allRequests.filter(r => r.status === 'cancelled').length;
    
    // Get today's requests
    const today = new Date().toISOString().split('T')[0];
    const todayRequests = allRequests.filter(r => r.createdAt.startsWith(today)).length;
    
    return {
      total: allRequests.length,
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
    
    // Notify the requester
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
    
    return { success: true };
  },
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
