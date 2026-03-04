import { query } from "./_generated/server";

// Pagination constants to stay under 1GB bandwidth
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

export const supplierDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const ordersResult = await ctx.db
      .query("orders")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .paginate({ cursor: null, numItems: MAX_PAGE_SIZE });
    const orders = ordersResult.page;
    
    const productsResult = await ctx.db
      .query("products")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .paginate({ cursor: null, numItems: MAX_PAGE_SIZE });
    const products = productsResult.page;
    
    const reviewsResult = await ctx.db
      .query("reviews")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .paginate({ cursor: null, numItems: MAX_PAGE_SIZE });
    const reviews = reviewsResult.page;

    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

    const now = new Date();
    const monthlyRevenue = orders
      .filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.payment_status === 'paid';
      })
      .reduce((sum, o) => sum + o.total_amount, 0);

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


