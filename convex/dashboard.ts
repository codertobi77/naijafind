import { query } from "./_generated/server";

// Pagination constants to stay under 1GB bandwidth
const MAX_PAGE_SIZE = 500;

export const supplierDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    // La table "orders" n'existe pas dans le schéma (aucune fonctionnalité de commandes).
    // On conserve la forme de l'API avec des valeurs vides.
    const orders: any[] = [];

    const productsResult = await ctx.db
      .query("products")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .paginate({ cursor: null, numItems: MAX_PAGE_SIZE });
    const products = productsResult.page;
    
    const reviewsResult = await ctx.db
      .query("reviews")
      .withIndex("supplierId", (q) => q.eq("supplierId", supplier._id as unknown as string))
      .paginate({ cursor: null, numItems: MAX_PAGE_SIZE });
    const reviews = reviewsResult.page;

    const totalOrders = 0;
    const totalProducts = products.length;
    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

    const monthlyRevenue = 0;

    return {
      profile: supplier,
      stats: {
        totalOrders,
        totalProducts,
        totalReviews,
        averageRating,
        monthlyRevenue,
      },
      orders,
      reviews,
      recentOrders: orders.slice(0, 5),
      recentReviews: reviews.slice(0, 5),
    };
  }
});


