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
    
    // Update supplier rating and review count incrementally (O(1))
    const oldCount = Number(supplier.reviews_count ?? 0n);
    const oldRating = supplier.rating ?? 0;
    const newCount = oldCount + 1;
    const newAverageRating = (oldRating * oldCount + args.rating) / newCount;
    
    await ctx.db.patch(args.supplierId as any, {
      rating: newAverageRating,
      reviews_count: BigInt(newCount),
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

    // Update supplier rating incrementally (O(1)) if this is a status change that affects visibility
    // Visibility transition: deleted <-> published/other
    const oldStatus = review.status;
    const newStatus = args.status;

    if (newStatus && oldStatus !== newStatus) {
      const wasVisible = oldStatus !== "deleted";
      const isVisible = newStatus !== "deleted";

      if (wasVisible !== isVisible) {
        const oldCount = Number(supplier.reviews_count ?? 0n);
        const oldRating = supplier.rating ?? 0;
        let newCount = oldCount;
        let newAverageRating = oldRating;

        if (wasVisible && !isVisible) {
          // Transition: visible -> deleted (Removal logic)
          newCount = Math.max(0, oldCount - 1);
          newAverageRating = newCount > 0
            ? (oldRating * oldCount - review.rating) / newCount
            : 0;
        } else if (!wasVisible && isVisible) {
          // Transition: deleted -> visible (Addition logic)
          newCount = oldCount + 1;
          newAverageRating = (oldRating * oldCount + review.rating) / newCount;
        }

        await ctx.db.patch(supplier._id as any, {
          rating: newAverageRating,
          reviews_count: BigInt(newCount),
        });
      }
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

    // Update supplier rating and review count incrementally (O(1)) before deletion
    // Only update if the review was visible (not "deleted")
    if (review.status !== "deleted") {
      const oldCount = Number(supplier.reviews_count ?? 0n);
      const oldRating = supplier.rating ?? 0;
      const newCount = Math.max(0, oldCount - 1);
      const newAverageRating = newCount > 0
        ? (oldRating * oldCount - review.rating) / newCount
        : 0;

      await ctx.db.patch(supplier._id as any, {
        rating: newAverageRating,
        reviews_count: BigInt(newCount),
      });
    }

    await ctx.db.delete(id);
    
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
