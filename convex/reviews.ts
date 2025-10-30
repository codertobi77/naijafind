import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listReviews = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const reviews = await ctx.db
      .query("reviews")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .collect();

    return reviews;
  }
});

export const updateReview = mutation({
  args: {
    id: v.id("reviews"),
    status: v.optional(v.string()),
    response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const review = await ctx.db.get(args.id);
    if (!review) throw new Error("Avis introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || review.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.patch(args.id, {
      status: args.status ?? review.status,
      response: args.response ?? review.response,
    });

    return { success: true };
  }
});

export const deleteReview = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const review = await ctx.db.get(id);
    if (!review) throw new Error("Avis introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || review.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.delete(id);
    return { success: true };
  }
});
