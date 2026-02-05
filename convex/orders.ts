import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Get all orders for the current supplier (supplier view)
export const getSupplierOrders = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.int64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    let orders = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .collect();

    // Filter by status if provided
    if (args.status) {
      orders = orders.filter(o => o.status === args.status);
    }

    // Sort by created_at desc
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Limit if provided
    if (args.limit) {
      orders = orders.slice(0, Number(args.limit));
    }

    return orders;
  }
});

// Get all orders for the current customer (customer view)
export const getCustomerOrders = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.int64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    let orders = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("customerId"), identity.subject))
      .collect();

    // Filter by status if provided
    if (args.status) {
      orders = orders.filter(o => o.status === args.status);
    }

    // Sort by created_at desc
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Limit if provided
    if (args.limit) {
      orders = orders.slice(0, Number(args.limit));
    }

    // Enrich with supplier info
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const supplier = await ctx.db.get(order.supplierId as unknown as any);
        return {
          ...order,
          supplierName: supplier?.business_name || "Fournisseur inconnu",
          supplierLogo: supplier?.logo_url || null,
        };
      })
    );

    return enrichedOrders;
  }
});

// Get all orders for admin view
export const getAllOrders = query({
  args: {
    status: v.optional(v.string()),
    supplierId: v.optional(v.string()),
    limit: v.optional(v.int64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // Verify admin access
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
    
    if (!user?.is_admin) throw new Error("Accès refusé - Admin requis");

    let orders;
    
    if (args.supplierId) {
      orders = await ctx.db
        .query("orders")
        .filter(q => q.eq(q.field("supplierId"), args.supplierId))
        .collect();
    } else {
      orders = await ctx.db.query("orders").collect();
    }

    // Filter by status if provided
    if (args.status) {
      orders = orders.filter(o => o.status === args.status);
    }

    // Sort by created_at desc
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Limit if provided
    if (args.limit) {
      orders = orders.slice(0, Number(args.limit));
    }

    // Enrich with supplier and customer info
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const supplier = await ctx.db.get(order.supplierId as unknown as any);
        const customer = await ctx.db
          .query("users")
          .filter(q => q.eq(q.field("email"), order.customerId))
          .first();
        
        return {
          ...order,
          supplierName: supplier?.business_name || "Fournisseur inconnu",
          supplierLogo: supplier?.logo_url || null,
          customerName: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email : "Client inconnu",
          customerEmail: customer?.email || order.customerId,
        };
      })
    );

    return enrichedOrders;
  }
});

// Get single order by ID
export const getOrderById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const order = await ctx.db.get(id);
    if (!order) throw new Error("Commande introuvable");

    // Check authorization - customer, supplier, or admin can view
    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    const isAuthorized = 
      order.customerId === identity.subject || 
      (supplier && order.supplierId === (supplier._id as unknown as string)) ||
      user?.is_admin;

    if (!isAuthorized) throw new Error("Accès refusé");

    // Enrich with supplier and product details
    const supplierData = await ctx.db.get(order.supplierId as unknown as any);
    
    return {
      ...order,
      supplierName: supplierData?.business_name || "Fournisseur inconnu",
      supplierPhone: supplierData?.phone || null,
      supplierEmail: supplierData?.email || null,
      supplierAddress: supplierData?.address || null,
    };
  }
});

// Create new order (customer)
export const createOrder = mutation({
  args: {
    supplierId: v.string(),
    shipping_address: v.object({
      full_name: v.string(),
      phone: v.string(),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      country: v.optional(v.string()),
      postal_code: v.optional(v.string()),
    }),
    order_items: v.array(v.object({
      productId: v.string(),
      product_name: v.string(),
      quantity: v.int64(),
      unit_price: v.float64(),
      total_price: v.float64(),
      image_url: v.optional(v.string()),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé - Veuillez vous connecter");

    // Verify supplier exists
    const supplier = await ctx.db.get(args.supplierId as unknown as any);
    if (!supplier) throw new Error("Fournisseur introuvable");

    // Calculate total amount
    const total_amount = args.order_items.reduce((sum, item) => sum + item.total_price, 0);

    // Verify stock availability and update stock
    for (const item of args.order_items) {
      const product = await ctx.db.get(item.productId as unknown as any);
      if (!product) throw new Error(`Produit ${item.product_name} introuvable`);
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${item.product_name}. Disponible: ${product.stock}, Demandé: ${item.quantity}`);
      }
    }

    // Deduct stock
    for (const item of args.order_items) {
      const product = await ctx.db.get(item.productId as unknown as any);
      if (product) {
        await ctx.db.patch(item.productId as unknown as any, {
          stock: product.stock - Number(item.quantity),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const now = new Date().toISOString();
    const orderNumber = generateOrderNumber();
    const orderId = await ctx.db.insert("orders", {
      supplierId: args.supplierId,
      customerId: identity.subject,
      order_number: orderNumber,
      total_amount,
      status: "pending",
      payment_status: "pending",
      shipping_address: args.shipping_address,
      order_items: args.order_items,
      notes: args.notes || null,
      created_at: now,
      updated_at: now,
    });

    return { 
      success: true, 
      id: orderId,
      order_number: orderNumber,
    };
  }
});

// Update order status (supplier or admin)
export const updateOrderStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.string(), // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    payment_status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Commande introuvable");

    // Check authorization
    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    const isAuthorized = 
      (supplier && order.supplierId === (supplier._id as unknown as string)) ||
      user?.is_admin;

    if (!isAuthorized) throw new Error("Accès refusé");

    // If cancelled, restore stock
    if (args.status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.order_items) {
        const product = await ctx.db.get(item.productId as unknown as any);
        if (product) {
          await ctx.db.patch(item.productId as unknown as any, {
            stock: product.stock + Number(item.quantity),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.payment_status && { payment_status: args.payment_status }),
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  }
});

// Delete order (admin only or supplier for their own pending orders)
export const deleteOrder = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const order = await ctx.db.get(id);
    if (!order) throw new Error("Commande introuvable");

    // Check authorization
    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();

    const isAuthorized = 
      user?.is_admin ||
      (supplier && order.supplierId === (supplier._id as unknown as string) && order.status === 'pending');

    if (!isAuthorized) throw new Error("Accès refusé - Seuls les admins ou le fournisseur pour les commandes en attente peuvent supprimer");

    // Restore stock if order is not cancelled
    if (order.status !== 'cancelled') {
      for (const item of order.order_items) {
        const product = await ctx.db.get(item.productId as unknown as any);
        if (product) {
          await ctx.db.patch(item.productId as unknown as any, {
            stock: product.stock + Number(item.quantity),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    await ctx.db.delete(id);
    return { success: true };
  }
});

// Get order statistics for supplier dashboard
export const getOrderStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const orders = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .collect();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate stats
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      monthlyRevenue: orders
        .filter(o => {
          const d = new Date(o.created_at);
          return d.getMonth() === currentMonth && 
                 d.getFullYear() === currentYear && 
                 o.status !== 'cancelled';
        })
        .reduce((sum, o) => sum + o.total_amount, 0),
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0),
    };

    return stats;
  }
});

// Get order statistics for admin dashboard
export const getAdminOrderStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
    
    if (!user?.is_admin) throw new Error("Accès refusé - Admin requis");

    const orders = await ctx.db.query("orders").collect();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      monthlyRevenue: orders
        .filter(o => {
          const d = new Date(o.created_at);
          return d.getMonth() === currentMonth && 
                 d.getFullYear() === currentYear && 
                 o.status !== 'cancelled';
        })
        .reduce((sum, o) => sum + o.total_amount, 0),
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0),
    };

    return stats;
  }
});
