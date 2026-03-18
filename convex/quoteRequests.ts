import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ==========================================
// QUOTE REQUEST (RFQ) SYSTEM
// ==========================================

/**
 * Type for quote request status
 */
export type QuoteRequestStatus = "pending" | "sent" | "responded" | "closed";

/**
 * Type for delivery status
 */
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed";

/**
 * Type for supplier response status
 */
export type SupplierResponseStatus = "pending" | "viewed" | "responded" | "declined";

// ==========================================
// INTERNAL MUTATIONS
// ==========================================

/**
 * Internal: Create quote request supplier entries
 */
export const _createQuoteRequestSuppliers = internalMutation({
  args: {
    quoteRequestId: v.id("quoteRequests"),
    supplierIds: v.array(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const createdIds: Id<"quoteRequestSuppliers">[] = [];

    for (const supplierId of args.supplierIds) {
      const id = await ctx.db.insert("quoteRequestSuppliers", {
        quoteRequestId: args.quoteRequestId,
        supplierId,
        deliveryStatus: "pending",
        responseStatus: "pending",
        createdAt: now,
        updatedAt: now,
      });
      createdIds.push(id);
    }

    return { createdIds };
  },
});

/**
 * Internal: Get supplier email for notifications
 */
export const _getSupplierEmail = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) return null;

    // Find user associated with supplier
    const user = await ctx.db
      .query("users")
      .withIndex("tokenIdentifier", (q) => q.eq("tokenIdentifier", supplier.userId))
      .first();

    return user?.email || supplier.email || null;
  },
});

// ==========================================
// PUBLIC MUTATIONS
// ==========================================

/**
 * Mutation: Create a quote request (RFQ)
 * 
 * Creates:
 * - One QuoteRequest document
 * - One QuoteRequestSupplier for each selected supplier
 * 
 * Returns the created quote request ID
 */
export const createQuoteRequest = mutation({
  args: {
    productId: v.id("products"),
    supplierIds: v.array(v.id("suppliers")),
    quantity: v.optional(v.float64()),
    quantityUnit: v.optional(v.string()),
    message: v.string(),
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.optional(v.string()),
    buyerCountry: v.optional(v.string()),
    buyerCompany: v.optional(v.string()),
    preferredDeliveryDate: v.optional(v.string()),
    budgetRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate required fields
    if (!args.buyerName.trim()) {
      throw new Error("Buyer name is required");
    }
    if (!args.buyerEmail.trim() || !args.buyerEmail.includes("@")) {
      throw new Error("Valid buyer email is required");
    }
    if (!args.message.trim()) {
      throw new Error("Message is required");
    }
    if (args.supplierIds.length === 0) {
      throw new Error("At least one supplier must be selected");
    }

    // Get current user if authenticated
    const identity = await ctx.auth.getUserIdentity();

    const now = new Date().toISOString();

    // Create the quote request
    const quoteRequestId = await ctx.db.insert("quoteRequests", {
      productId: args.productId,
      quantity: args.quantity,
      quantityUnit: args.quantityUnit,
      message: args.message,
      buyerName: args.buyerName.trim(),
      buyerEmail: args.buyerEmail.trim().toLowerCase(),
      buyerPhone: args.buyerPhone?.trim(),
      buyerCountry: args.buyerCountry?.trim(),
      buyerCompany: args.buyerCompany?.trim(),
      preferredDeliveryDate: args.preferredDeliveryDate,
      budgetRange: args.budgetRange,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      userId: identity?.subject,
    });

    // Create supplier entries
    const supplierResults = await Promise.all(
      args.supplierIds.map(async (supplierId) => {
        const id = await ctx.db.insert("quoteRequestSuppliers", {
          quoteRequestId,
          supplierId,
          deliveryStatus: "pending",
          responseStatus: "pending",
          createdAt: now,
          updatedAt: now,
        });
        return { supplierId, quoteRequestSupplierId: id };
      })
    );

    // Update quote request status to "sent"
    await ctx.db.patch(quoteRequestId, { status: "sent", updatedAt: now });

    return {
      success: true,
      quoteRequestId,
      supplierCount: supplierResults.length,
    };
  },
});

/**
 * Mutation: Update quote request status (admin or supplier)
 */
export const updateQuoteRequestStatus = mutation({
  args: {
    quoteRequestId: v.id("quoteRequests"),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("responded"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const quoteRequest = await ctx.db.get(args.quoteRequestId);
    if (!quoteRequest) throw new Error("Quote request not found");

    // Verify admin or involved supplier
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    const isAdmin = user?.is_admin || user?.user_type === "admin";

    // Check if user is a supplier involved in this request
    const supplierEntry = await ctx.db
      .query("quoteRequestSuppliers")
      .withIndex("quoteRequestId_supplierId", (q) =>
        q.eq("quoteRequestId", args.quoteRequestId)
      )
      .collect();

    const supplierIds = supplierEntry.map((s) => s.supplierId);
    const isInvolvedSupplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.subject))
      .first()
      .then((s) => s && supplierIds.includes(s._id));

    if (!isAdmin && !isInvolvedSupplier) {
      throw new Error("Not authorized to update this quote request");
    }

    await ctx.db.patch(args.quoteRequestId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Mutation: Supplier responds to a quote request
 */
export const respondToQuoteRequest = mutation({
  args: {
    quoteRequestSupplierId: v.id("quoteRequestSuppliers"),
    response: v.object({
      status: v.union(v.literal("responded"), v.literal("declined")),
      message: v.optional(v.string()),
      quotedPrice: v.optional(v.float64()),
      quotedCurrency: v.optional(v.string()),
      deliveryTimeDays: v.optional(v.int64()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get the quote request supplier entry
    const qrs = await ctx.db.get(args.quoteRequestSupplierId);
    if (!qrs) throw new Error("Quote request supplier entry not found");

    // Verify this supplier owns this entry
    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!supplier || qrs.supplierId !== supplier._id) {
      throw new Error("Not authorized to respond to this quote request");
    }

    const now = new Date().toISOString();

    // Update the supplier response
    await ctx.db.patch(args.quoteRequestSupplierId, {
      responseStatus: args.response.status,
      supplierMessage: args.response.message,
      quotedPrice: args.response.quotedPrice,
      quotedCurrency: args.response.quotedCurrency,
      deliveryTimeDays: args.response.deliveryTimeDays,
      updatedAt: now,
    });

    // Update the parent quote request status if this is the first response
    const quoteRequest = await ctx.db.get(qrs.quoteRequestId);
    if (quoteRequest && quoteRequest.status === "sent") {
      await ctx.db.patch(qrs.quoteRequestId, {
        status: "responded",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Mutation: Mark quote request as delivered to supplier
 * Called by email/notification system
 */
export const markQuoteRequestDelivered = mutation({
  args: {
    quoteRequestSupplierId: v.id("quoteRequestSuppliers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user?.is_admin && user?.user_type !== "admin") {
      throw new Error("Admin only");
    }

    await ctx.db.patch(args.quoteRequestSupplierId, {
      deliveryStatus: "delivered",
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// ==========================================
// PUBLIC QUERIES
// ==========================================

/**
 * Query: Get quote request details with suppliers
 */
export const getQuoteRequest = query({
  args: {
    quoteRequestId: v.id("quoteRequests"),
  },
  handler: async (ctx, args) => {
    const quoteRequest = await ctx.db.get(args.quoteRequestId);
    if (!quoteRequest) return null;

    // Get product details
    const product = await ctx.db.get(quoteRequest.productId);

    // Get all supplier entries
    const supplierEntries = await ctx.db
      .query("quoteRequestSuppliers")
      .withIndex("quoteRequestId", (q) => q.eq("quoteRequestId", args.quoteRequestId))
      .collect();

    // Fetch supplier details
    const suppliersWithDetails = await Promise.all(
      supplierEntries.map(async (entry) => {
        const supplier = await ctx.db.get(entry.supplierId);
        return {
          id: entry._id,
          supplierId: entry.supplierId,
          supplierName: supplier?.business_name || "Unknown Supplier",
          deliveryStatus: entry.deliveryStatus,
          responseStatus: entry.responseStatus,
          quotedPrice: entry.quotedPrice,
          quotedCurrency: entry.quotedCurrency,
          deliveryTimeDays: entry.deliveryTimeDays,
          supplierMessage: entry.supplierMessage,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        };
      })
    );

    return {
      ...quoteRequest,
      productName: product?.name || "Unknown Product",
      suppliers: suppliersWithDetails,
    };
  },
});

/**
 * Query: Get quote requests for a buyer (by email)
 */
export const getBuyerQuoteRequests = query({
  args: {
    buyerEmail: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("sent"), v.literal("responded"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);

    let query = ctx.db
      .query("quoteRequests")
      .withIndex("buyerEmail", (q) =>
        q.eq("buyerEmail", args.buyerEmail.toLowerCase())
      );

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status!));
    }

    const quoteRequests = await query.order("desc").take(limit);

    // Enrich with product names
    const enriched = await Promise.all(
      quoteRequests.map(async (qr) => {
        const product = await ctx.db.get(qr.productId);
        return {
          ...qr,
          productName: product?.name || "Unknown Product",
        };
      })
    );

    return enriched;
  },
});

/**
 * Query: Get quote requests for a supplier
 */
export const getSupplierQuoteRequests = query({
  args: {
    supplierId: v.id("suppliers"),
    limit: v.optional(v.number()),
    responseStatus: v.optional(v.union(v.literal("pending"), v.literal("viewed"), v.literal("responded"), v.literal("declined"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify supplier ownership
    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!supplier || supplier._id !== args.supplierId) {
      throw new Error("Not authorized to view these quote requests");
    }

    const limit = Math.min(args.limit ?? 50, 100);

    let entries = await ctx.db
      .query("quoteRequestSuppliers")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .order("desc")
      .take(limit);

    if (args.responseStatus) {
      entries = entries.filter((e) => e.responseStatus === args.responseStatus);
    }

    // Enrich with quote request and product details
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const quoteRequest = await ctx.db.get(entry.quoteRequestId);
        if (!quoteRequest) return null;

        const product = await ctx.db.get(quoteRequest.productId);

        return {
          id: entry._id,
          quoteRequestId: entry.quoteRequestId,
          deliveryStatus: entry.deliveryStatus,
          responseStatus: entry.responseStatus,
          quotedPrice: entry.quotedPrice,
          quotedCurrency: entry.quotedCurrency,
          deliveryTimeDays: entry.deliveryTimeDays,
          supplierMessage: entry.supplierMessage,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          // Quote request details
          buyerName: quoteRequest.buyerName,
          buyerEmail: quoteRequest.buyerEmail,
          buyerCountry: quoteRequest.buyerCountry,
          buyerCompany: quoteRequest.buyerCompany,
          quantity: quoteRequest.quantity,
          quantityUnit: quoteRequest.quantityUnit,
          message: quoteRequest.message,
          preferredDeliveryDate: quoteRequest.preferredDeliveryDate,
          budgetRange: quoteRequest.budgetRange,
          requestStatus: quoteRequest.status,
          // Product details
          productName: product?.name || "Unknown Product",
          productCategory: product?.category,
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

/**
 * Query: Get all quote requests (admin only)
 */
export const getAllQuoteRequests = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("sent"), v.literal("responded"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user?.is_admin && user?.user_type !== "admin") {
      throw new Error("Admin only");
    }

    const limit = Math.min(args.limit ?? 100, 200);

    let query = ctx.db.query("quoteRequests").order("desc");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status!));
    }

    const quoteRequests = await query.take(limit);

    // Enrich with product names
    const enriched = await Promise.all(
      quoteRequests.map(async (qr) => {
        const product = await ctx.db.get(qr.productId);
        return {
          ...qr,
          productName: product?.name || "Unknown Product",
        };
      })
    );

    return enriched;
  },
});

// ==========================================
// ACTIONS
// ==========================================

/**
 * Action: Get quote request statistics
 * Useful for dashboards
 */
export const getQuoteRequestStats = action({
  args: {
    supplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let stats = {
      total: 0,
      pending: 0,
      sent: 0,
      responded: 0,
      closed: 0,
    };

    if (args.supplierId) {
      // Supplier-specific stats
      const entries = await ctx.db
        .query("quoteRequestSuppliers")
        .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId!))
        .collect();

      stats.total = entries.length;

      for (const entry of entries) {
        const qr = await ctx.db.get(entry.quoteRequestId);
        if (qr) {
          stats[qr.status as keyof typeof stats]++;
        }
      }
    } else {
      // Global stats (admin only)
      const user = await ctx.runQuery(internal.users._getUserByEmail, {
        email: identity.email ?? "",
      });

      if (!user?.is_admin && user?.user_type !== "admin") {
        throw new Error("Admin only for global stats");
      }

      const quoteRequests = await ctx.db.query("quoteRequests").take(1000);
      stats.total = quoteRequests.length;

      for (const qr of quoteRequests) {
        stats[qr.status as keyof typeof stats]++;
      }
    }

    return stats;
  },
});

// ==========================================
// INTERNAL FUNCTIONS FOR SUPPLIER DEDUPLICATION
// ==========================================

/**
 * Internal query: Get quote request suppliers by supplier ID
 */
export const getQuoteRequestSuppliersBySupplierIdInternal = internalQuery({
  args: {
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quoteRequestSuppliers")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId as Id<"suppliers">))
      .collect();
  },
});

/**
 * Internal mutation: Update quote request supplier ID
 */
export const updateQuoteRequestSupplierInternal = internalMutation({
  args: {
    quoteRequestSupplierId: v.string(),
    newSupplierId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.quoteRequestSupplierId as Id<"quoteRequestSuppliers">, {
      supplierId: args.newSupplierId as Id<"suppliers">,
      updatedAt: new Date().toISOString(),
    });
  },
});
