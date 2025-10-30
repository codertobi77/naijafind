import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listOrders = query({
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

    return orders;
  }
});

export const createOrder = mutation({
  args: {
    order_number: v.string(),
    total_amount: v.float64(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const now = new Date().toISOString();
    const id = await ctx.db.insert("orders", {
      supplierId: supplier._id as unknown as string,
      order_number: args.order_number,
      total_amount: args.total_amount,
      status: args.status,
      created_at: now,
      updated_at: now,
    });
    return { success: true, id };
  }
});

export const updateOrder = mutation({
  args: {
    id: v.id("orders"),
    order_number: v.optional(v.string()),
    total_amount: v.optional(v.float64()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Commande introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || order.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.patch(args.id, {
      order_number: args.order_number ?? order.order_number,
      total_amount: args.total_amount ?? order.total_amount,
      status: args.status ?? order.status,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  }
});

export const deleteOrder = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const order = await ctx.db.get(id);
    if (!order) throw new Error("Commande introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || order.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.delete(id);
    return { success: true };
  }
});
