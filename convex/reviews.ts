import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const listReviews = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("supplierId", (q) => q.eq("supplierId", supplier._id as unknown as string))
      .take(1000);

    return reviews;
  }
});

export const createReview = mutation({
  args: {
    supplierId: v.string(),
    rating: v.float64(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("La note doit être comprise entre 1 et 5");
    }
    
    // Check if user already reviewed this supplier
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("userId_supplierId", (q) =>
        q.eq("userId", identity.tokenIdentifier).eq("supplierId", args.supplierId)
      )
      .first();
    
    if (existingReview) {
      throw new Error("Vous avez déjà laissé un avis pour ce fournisseur");
    }
    
    // Verify supplier exists
    const supplier = await ctx.db.get(args.supplierId as any);
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Detect language if comment is provided
    let detectedLanguage: string | undefined;
    if (args.comment && args.comment.trim().length > 0) {
      try {
        const detectionResult = await ctx.runAction(internal.translation.detectLanguage, {
          text: args.comment,
        });
        detectedLanguage = detectionResult.language;
      } catch (error) {
        // Silently fail - language detection is not critical
        console.error('Language detection failed:', error);
      }
    }
    
    // Create review with detected language
    const reviewId = await ctx.db.insert("reviews", {
      supplierId: args.supplierId,
      userId: identity.tokenIdentifier,
      rating: args.rating,
      comment: args.comment,
      status: "published",
      sourceLanguage: detectedLanguage,
      created_at: new Date().toISOString(),
    });
    
    // Update supplier rating and review count
    const supplierReviews = await ctx.db
      .query("reviews")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
    
    const totalReviews = supplierReviews.length;
    const averageRating = totalReviews > 0 
      ? supplierReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    
    await ctx.db.patch(args.supplierId as any, {
      rating: averageRating,
      reviews_count: BigInt(totalReviews),
    });
    
    return { success: true, reviewId };
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

    const supplier = await ctx.db.query("suppliers").withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier)).first();
    if (!supplier || review.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.patch(args.id, {
      status: args.status ?? review.status,
      response: args.response ?? review.response,
    });

    // Update supplier rating if this is a status change that affects visibility
    if (args.status) {
      const supplierReviews = await ctx.db
        .query("reviews")
        .withIndex("supplierId", (q) => q.eq("supplierId", supplier._id as unknown as string))
        .take(1000);
      
      const publishedReviews = supplierReviews.filter(r => r.status !== "deleted");
      const totalReviews = publishedReviews.length;
      const averageRating = totalReviews > 0 
        ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
      
      await ctx.db.patch(supplier._id as any, {
        rating: averageRating,
        reviews_count: BigInt(totalReviews),
      });
    }

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

    const supplier = await ctx.db.query("suppliers").withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier)).first();
    if (!supplier || review.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.delete(id);
    
    // Update supplier rating and review count
    const supplierReviews = await ctx.db
      .query("reviews")
      .withIndex("supplierId", (q) => q.eq("supplierId", supplier._id as unknown as string))
      .take(1000);
    
    const publishedReviews = supplierReviews.filter(r => r.status !== "deleted");
    const totalReviews = publishedReviews.length;
    const averageRating = totalReviews > 0 
      ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    
    await ctx.db.patch(supplier._id as any, {
      rating: averageRating,
      reviews_count: BigInt(totalReviews),
    });
    
    return { success: true };
  }
});

// ==========================================
// INTERNAL FUNCTIONS FOR SUPPLIER DEDUPLICATION
// ==========================================

/**
 * Internal query: Get reviews by supplier ID
 */
export const getReviewsBySupplierIdInternal = internalQuery({
  args: {
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
  },
});

/**
 * Internal query: Get review by user and supplier
 */
export const getReviewByUserAndSupplierInternal = internalQuery({
  args: {
    userId: v.string(),
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("userId_supplierId", (q) => q.eq("userId", args.userId).eq("supplierId", args.supplierId))
      .first();
  },
});

/**
 * Internal mutation: Delete review by ID
 */
export const deleteReviewInternal = internalMutation({
  args: {
    reviewId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reviewId as any);
  },
});

/**
 * Internal mutation: Update review supplier ID
 */
export const updateReviewSupplierInternal = internalMutation({
  args: {
    reviewId: v.string(),
    newSupplierId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reviewId as any, {
      supplierId: args.newSupplierId,
    });
  },
});
