import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ==========================================
// MONEROO PAYMENT INTEGRATION
// ==========================================

const MONEROO_API_BASE = "https://api.moneroo.io/v1";

// Get Moneroo API key from environment
function getMonerooSecretKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) {
    throw new Error("MONEROO_SECRET_KEY not configured");
  }
  return key;
}

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
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    monerooPaymentId: v.string(),
    monerooCheckoutUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("payments", {
      userId: args.userId,
      supplierId: args.supplierId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      monerooPaymentId: args.monerooPaymentId,
      monerooCheckoutUrl: args.monerooCheckoutUrl,
      description: args.description,
      metadata: args.metadata,
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
  handler: async (ctx, args) => {
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
 * Internal: Update supplier featured status
 */
export const _updateSupplierFeatured = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
    featured: v.boolean(),
    featuredUntil: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const update: any = {
      featured: args.featured,
      updatedAt: now,
    };
    if (args.featuredUntil) update.featuredUntil = args.featuredUntil;
    if (args.subscriptionPlan) update.subscriptionPlan = args.subscriptionPlan;
    if (args.subscriptionExpiresAt) update.subscriptionExpiresAt = args.subscriptionExpiresAt;

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
  handler: async (ctx, args) => {
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
// ACTIONS (HTTP Calls to Moneroo)
// ==========================================

/**
 * Initialize a payment with Moneroo
 * Returns checkout_url for redirecting the customer
 */
export const initializePayment = action({
  args: {
    type: v.string(), // 'featured_upgrade', 'subscription', 'purchase'
    amount: v.number(), // Amount in smallest currency unit (e.g., 50000 for 500 XOF)
    currency: v.string(), // 'XOF', 'NGN', 'USD'
    description: v.string(),
    supplierId: v.optional(v.id("suppliers")),
    metadata: v.optional(v.record(v.string(), v.string())),
    returnUrl: v.string(), // Frontend return URL
    methods: v.optional(v.array(v.string())), // e.g., ['mtn_bj', 'moov_bj']
    customerEmail: v.string(),
    customerFirstName: v.string(),
    customerLastName: v.string(),
    customerPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    // Rate limiting: max 5 payment initializations per hour per user
    await ctx.runAction(internal.rateLimit.enforceRateLimit, {
      identifier: identity.tokenIdentifier,
      action: "payment_initialization",
      limit: 5,
      windowMinutes: 60,
    });

    const now = new Date().toISOString();
    const secretKey = getMonerooSecretKey();

    // Build customer object
    const customer: any = {
      email: args.customerEmail,
      first_name: args.customerFirstName,
      last_name: args.customerLastName,
    };
    if (args.customerPhone) {
      customer.phone = args.customerPhone;
    }

    // Build request body
    const requestBody: any = {
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      return_url: args.returnUrl,
      customer: customer,
      metadata: {
        ...args.metadata,
        userId: identity.tokenIdentifier,
        type: args.type,
        createdAt: now,
      },
    };

    // Optional: restrict payment methods
    if (args.methods && args.methods.length > 0) {
      requestBody.methods = args.methods;
    }

    // Call Moneroo API
    const response = await fetch(`${MONEROO_API_BASE}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moneroo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.id || !data.data.checkout_url) {
      throw new Error("Invalid response from Moneroo API");
    }

    // Create payment record in database
    const paymentId = await ctx.runMutation(internal.payments._createPayment, {
      userId: identity.tokenIdentifier,
      supplierId: args.supplierId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      monerooPaymentId: data.data.id,
      monerooCheckoutUrl: data.data.checkout_url,
      description: args.description,
      metadata: args.metadata,
    });

    return {
      success: true,
      paymentId,
      monerooPaymentId: data.data.id,
      checkoutUrl: data.data.checkout_url,
    };
  },
});

/**
 * Verify a payment status with Moneroo
 * Should be called when user returns from payment page
 */
export const verifyPayment = action({
  args: {
    monerooPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const secretKey = getMonerooSecretKey();

    // Call Moneroo verification API
    const response = await fetch(
      `${MONEROO_API_BASE}/payments/${args.monerooPaymentId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moneroo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const paymentStatus = data.data?.status || "unknown";

    // Find payment in database
    const payment = await ctx.runQuery(internal.payments._getPaymentByMonerooId, {
      monerooPaymentId: args.monerooPaymentId,
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Verify ownership
    if (payment.userId !== identity.tokenIdentifier) {
      // Check if admin
      const user = await ctx.runQuery(internal.payments._getUserByToken, {
        email: identity.email,
      });
      if (!user?.is_admin) {
        throw new Error("Accès refusé");
      }
    }

    // Map Moneroo status to our status
    let status: string;
    let paidAt: string | undefined;
    let failedAt: string | undefined;

    switch (paymentStatus) {
      case "success":
        status = "completed";
        paidAt = new Date().toISOString();
        break;
      case "failed":
        status = "failed";
        failedAt = new Date().toISOString();
        break;
      case "pending":
        status = "pending";
        break;
      case "cancelled":
        status = "failed";
        failedAt = new Date().toISOString();
        break;
      default:
        status = "pending";
    }

    // Update payment status
    await ctx.runMutation(internal.payments._updatePaymentStatus, {
      paymentId: payment._id,
      status,
      paidAt,
      failedAt,
    });

    // If payment successful, handle post-payment actions
    if (status === "completed") {
      await ctx.runAction(internal.payments._handleSuccessfulPayment, {
        paymentId: payment._id,
      });
    }

    return {
      success: true,
      status,
      paymentId: payment._id,
      monerooStatus: paymentStatus,
    };
  },
});

/**
 * Internal: Handle successful payment (update supplier status, send notifications)
 */
export const _handleSuccessfulPayment = action({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.runQuery(internal.payments._getPaymentById, {
      paymentId: args.paymentId,
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    const now = new Date();

    // Handle different payment types
    switch (payment.type) {
      case "featured_upgrade":
        if (payment.supplierId) {
          // Set featured for 30 days
          const featuredUntil = new Date();
          featuredUntil.setDate(featuredUntil.getDate() + 30);

          await ctx.runMutation(internal.payments._updateSupplierFeatured, {
            supplierId: payment.supplierId,
            featured: true,
            featuredUntil: featuredUntil.toISOString(),
          });

          // Create notification
          await ctx.runMutation(internal.payments._createPaymentNotification, {
            userId: payment.userId,
            title: "Paiement réussi - Statut Vitrine activé",
            message: `Votre paiement de ${payment.amount} ${payment.currency} a été confirmé. Votre entreprise est maintenant en vitrine jusqu'au ${featuredUntil.toLocaleDateString()}.`,
            paymentId: args.paymentId,
            type: "payment_success",
          });
        }
        break;

      case "subscription":
        if (payment.supplierId) {
          // Set subscription for 30 days (basic) or 365 days (premium)
          const plan = payment.metadata?.plan || "basic";
          const duration = plan === "premium" ? 365 : 30;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + duration);

          await ctx.runMutation(internal.payments._updateSupplierFeatured, {
            supplierId: payment.supplierId,
            featured: plan === "premium", // Premium gets featured automatically
            subscriptionPlan: plan,
            subscriptionExpiresAt: expiresAt.toISOString(),
            featuredUntil: plan === "premium" ? expiresAt.toISOString() : undefined,
          });

          await ctx.runMutation(internal.payments._createPaymentNotification, {
            userId: payment.userId,
            title: "Abonnement activé",
            message: `Votre abonnement ${plan} est maintenant actif jusqu'au ${expiresAt.toLocaleDateString()}.`,
            paymentId: args.paymentId,
            type: "payment_success",
          });
        }
        break;

      case "purchase":
        await ctx.runMutation(internal.payments._createPaymentNotification, {
          userId: payment.userId,
          title: "Paiement confirmé",
          message: `Votre paiement de ${payment.amount} ${payment.currency} a été confirmé.`,
          paymentId: args.paymentId,
          type: "payment_success",
        });
        break;
    }

    return { success: true };
  },
});

// ==========================================
// QUERIES
// ==========================================

/**
 * Get payment by Moneroo ID (internal)
 */
export const _getPaymentByMonerooId = internalMutation({
  args: {
    monerooPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("monerooPaymentId", (q) => q.eq("monerooPaymentId", args.monerooPaymentId))
      .first();
  },
});

/**
 * Get payment by ID (internal)
 */
export const _getPaymentById = internalMutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});

/**
 * Get user by token (internal)
 */
export const _getUserByToken = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * Get current user's payments
 */
export const getMyPayments = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const limit = Math.min(args.limit ?? 50, 100);

    let query = ctx.db
      .query("payments")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .order("desc");

    if (args.status) {
      query = ctx.db
        .query("payments")
        .withIndex("userId_status", (q) =>
          q.eq("userId", identity.tokenIdentifier).eq("status", args.status)
        )
        .order("desc");
    }

    return await query.take(limit);
  },
});

/**
 * Get payment status by ID
 */
export const getPaymentStatus = query({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      return null;
    }

    // Verify ownership or admin
    if (payment.userId !== identity.subject) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();

      if (!user?.is_admin) {
        throw new Error("Accès refusé");
      }
    }

    return payment;
  },
});

/**
 * Get all payments (admin only)
 */
export const getAllPayments = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
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

    let query = ctx.db.query("payments").order("desc");

    if (args.status) {
      query = ctx.db
        .query("payments")
        .withIndex("status", (q) => q.eq("status", args.status))
        .order("desc");
    } else if (args.type) {
      query = ctx.db
        .query("payments")
        .withIndex("type", (q) => q.eq("type", args.type))
        .order("desc");
    }

    return await query.take(limit);
  },
});

/**
 * Get payment statistics (admin only)
 */
export const getPaymentStats = query({
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

    const allPayments = await ctx.db.query("payments").collect();

    const pending = allPayments.filter((p) => p.status === "pending").length;
    const completed = allPayments.filter((p) => p.status === "completed").length;
    const failed = allPayments.filter((p) => p.status === "failed").length;
    const refunded = allPayments.filter((p) => p.status === "refunded").length;

    // Calculate total revenue (completed payments only)
    const revenue = allPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    // Group by currency
    const revenueByCurrency: Record<string, number> = {};
    allPayments
      .filter((p) => p.status === "completed")
      .forEach((p) => {
        revenueByCurrency[p.currency] = (revenueByCurrency[p.currency] || 0) + p.amount;
      });

    // Today's payments
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = allPayments.filter((p) => p.createdAt.startsWith(today)).length;

    return {
      total: allPayments.length,
      pending,
      completed,
      failed,
      refunded,
      revenue,
      revenueByCurrency,
      todayPayments,
    };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Cancel a pending payment
 */
export const cancelPayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Paiement non trouvé");
    }

    // Verify ownership or admin
    if (payment.userId !== identity.subject) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();

      if (!user?.is_admin) {
        throw new Error("Accès refusé");
      }
    }

    // Can only cancel pending payments
    if (payment.status !== "pending") {
      throw new Error("Seuls les paiements en attente peuvent être annulés");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.paymentId, {
      status: "failed",
      failedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

// ==========================================
// WEBHOOK HANDLER (Called from http.ts)
// ==========================================

/**
 * Process Moneroo webhook
 * Called by http.ts webhook endpoint
 */
export const processWebhook = mutation({
  args: {
    event: v.string(), // 'payment.success', 'payment.failed', etc.
    data: v.any(), // Moneroo payload
    signature: v.string(), // For verification
  },
  handler: async (ctx, args) => {
    // Verify webhook signature
    const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;
    if (webhookSecret) {
      // Simple signature verification (implement HMAC if Moneroo supports it)
      // For now, we trust the webhook with basic validation
    }

    const monerooPaymentId = args.data?.id;
    const status = args.data?.status;

    if (!monerooPaymentId) {
      throw new Error("Invalid webhook: missing payment ID");
    }

    // Find payment in database
    const payment = await ctx.runQuery(internal.payments._getPaymentByMonerooId, {
      monerooPaymentId,
    });

    if (!payment) {
      throw new Error(`Payment not found: ${monerooPaymentId}`);
    }

    // Avoid processing already completed payments
    if (payment.status === "completed") {
      return { success: true, alreadyProcessed: true };
    }

    const now = new Date().toISOString();
    let newStatus: string;
    let paidAt: string | undefined;
    let failedAt: string | undefined;

    // Map Moneroo events to our status
    switch (args.event) {
      case "payment.success":
        newStatus = "completed";
        paidAt = now;
        break;
      case "payment.failed":
        newStatus = "failed";
        failedAt = now;
        break;
      case "payment.cancelled":
        newStatus = "failed";
        failedAt = now;
        break;
      case "payment.refunded":
        newStatus = "refunded";
        break;
      default:
        throw new Error(`Unknown webhook event: ${args.event}`);
    }

    // Update payment status
    await ctx.runMutation(internal.payments._updatePaymentStatus, {
      paymentId: payment._id,
      status: newStatus,
      paidAt,
      failedAt,
    });

    // Handle successful payment actions
    if (newStatus === "completed") {
      await ctx.runAction(internal.payments._handleSuccessfulPayment, {
        paymentId: payment._id,
      });
    }

    return { success: true, paymentId: payment._id, status: newStatus };
  },
});

// ==========================================
// CRON JOBS
// ==========================================

/**
 * Check and update expired featured suppliers
 * Called by cron job daily
 */
export const checkExpiredFeatured = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // Get all suppliers with featuredUntil in the past
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("featured", (q) => q.eq("featured", true))
      .collect();
    
    const expiredSuppliers = suppliers.filter(
      (s) => s.featuredUntil && s.featuredUntil < now
    );
    
    let updated = 0;
    
    for (const supplier of expiredSuppliers) {
      // Check if subscription is also expired
      const subscriptionExpired = !supplier.subscriptionExpiresAt || supplier.subscriptionExpiresAt < now;
      
      await ctx.db.patch(supplier._id, {
        featured: false,
        updatedAt: now,
        // If subscription also expired, clear the plan
        ...(subscriptionExpired && { subscriptionPlan: "free" }),
      });
      
      // Create notification for the supplier owner
      await ctx.db.insert("notifications", {
        userId: supplier.userId,
        type: "subscription_expired",
        title: "Statut Vitrine expiré",
        message: "Votre statut en vitrine a expiré. Renouvelez pour continuer à apparaître en avant.",
        read: false,
        actionUrl: "/dashboard/subscription",
        createdAt: now,
      });
      
      updated++;
    }
    
    return { 
      success: true, 
      checked: suppliers.length, 
      expired: expiredSuppliers.length,
      updated 
    };
  },
});
