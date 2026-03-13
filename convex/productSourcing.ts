import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ==========================================
// SUPPLIER MATCHING LOGIC
// ==========================================

/**
 * Match confidence thresholds
 * - >= 0.8 => "high"
 * - >= 0.55 => "medium"
 * - else => "low"
 */
const MATCH_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.55,
} as const;

/**
 * Match score weights
 * - categoryMatch: 35% - Primary factor
 * - keywordMatch: 30% - Product keywords overlap
 * - countryMatch: 15% - Geographic relevance
 * - supplierProfileCompleteness: 10% - Data quality signal
 * - adminValidation: 10% - Manual admin adjustment
 */
const MATCH_WEIGHTS = {
  category: 0.35,
  keyword: 0.30,
  country: 0.15,
  profileCompleteness: 0.10,
  adminValidation: 0.10,
} as const;

/**
 * Helper: Normalize match score to confidence level
 */
function scoreToConfidence(score: number): "high" | "medium" | "low" {
  if (score >= MATCH_THRESHOLDS.HIGH) return "high";
  if (score >= MATCH_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

/**
 * Helper: Calculate category match score
 * Returns 1 if exact match, 0.7 if supplier category contains product category or vice versa, 0 otherwise
 */
function calculateCategoryMatch(
  productCategory: string | undefined,
  supplierCategory: string
): number {
  if (!productCategory) return 0.3; // Neutral score if no category

  const prodCat = productCategory.toLowerCase().trim();
  const supCat = supplierCategory.toLowerCase().trim();

  if (prodCat === supCat) return 1.0;
  if (supCat.includes(prodCat) || prodCat.includes(supCat)) return 0.7;

  // Check for common parent categories or related categories
  const relatedCategories: Record<string, string[]> = {
    electronics: ["it", "tech", "gadgets", "telecom"],
    it: ["electronics", "tech", "software", "hardware"],
    "beauty": ["health", "personal care", "cosmetics"],
    health: ["beauty", "medical", "pharmacy"],
    food: ["agroalimentaire", "grocery", "beverages"],
    agroalimentaire: ["food", "agriculture", "farming"],
    construction: ["btp", "building", "materials"],
    btp: ["construction", "building", "infrastructure"],
    clothing: ["fashion", "apparel", "textile"],
    fashion: ["clothing", "apparel", "textile"],
    automotive: ["auto", "vehicles", "parts"],
    auto: ["automotive", "vehicles", "parts"],
  };

  const prodRelated = relatedCategories[prodCat] || [];
  const supRelated = relatedCategories[supCat] || [];

  if (prodRelated.includes(supCat) || supRelated.includes(prodCat)) return 0.5;

  return 0;
}

/**
 * Helper: Calculate keyword match score
 * Based on overlap between product keywords and supplier business description/category
 */
function calculateKeywordMatch(
  productKeywords: string[] | undefined,
  supplierDescription: string | undefined,
  supplierCategory: string
): number {
  if (!productKeywords || productKeywords.length === 0) return 0.3;

  const supplierText = `${supplierCategory} ${supplierDescription || ""}`.toLowerCase();

  let matches = 0;
  for (const keyword of productKeywords) {
    const kw = keyword.toLowerCase().trim();
    if (kw.length > 1 && supplierText.includes(kw)) {
      matches++;
    }
  }

  // Score based on percentage of keywords matched, with a minimum of 0.1 for having keywords
  const matchRate = matches / productKeywords.length;
  return Math.max(0.1, Math.min(1.0, matchRate));
}

/**
 * Helper: Calculate country match score
 * Currently returns 1 (neutral) as geographic matching requires buyer location context
 * This can be enhanced with buyer-supplier proximity logic
 */
function calculateCountryMatch(
  supplierCountry: string | undefined,
  _targetCountry: string | undefined // Reserved for future buyer-country matching
): number {
  // If supplier has a country, give base score
  // Future enhancement: compare with buyer's preferred/requested country
  if (supplierCountry && supplierCountry.trim().length > 0) {
    return 0.6; // Base score for having country data
  }
  return 0.3;
}

/**
 * Helper: Calculate supplier profile completeness score
 * Based on presence of key fields that indicate an active, complete profile
 */
function calculateProfileCompleteness(supplier: {
  description?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  image?: string;
  verified: boolean;
  approved: boolean;
  rating?: number;
}): number {
  let score = 0;
  let maxScore = 7;

  if (supplier.description && supplier.description.length > 10) score++;
  if (supplier.phone && supplier.phone.length > 5) score++;
  if (supplier.website && supplier.website.length > 5) score++;
  if (supplier.logo_url || supplier.image) score++;
  if (supplier.verified) score++;
  if (supplier.approved) score++;
  if (supplier.rating && supplier.rating > 0) score++;

  return score / maxScore;
}

/**
 * Calculate overall match score using weighted formula
 */
export function calculateMatchScore(params: {
  productCategory?: string;
  productKeywords?: string[];
  supplierCategory: string;
  supplierDescription?: string;
  supplierCountry?: string;
  targetCountry?: string;
  supplier: {
    description?: string;
    phone?: string;
    website?: string;
    logo_url?: string;
    image?: string;
    verified: boolean;
    approved: boolean;
    rating?: number;
  };
  adminValidationScore?: number;
}): {
  totalScore: number;
  confidence: "high" | "medium" | "low";
  componentScores: {
    category: number;
    keyword: number;
    country: number;
    profileCompleteness: number;
    adminValidation: number;
  };
} {
  const categoryScore = calculateCategoryMatch(
    params.productCategory,
    params.supplierCategory
  );

  const keywordScore = calculateKeywordMatch(
    params.productKeywords,
    params.supplierDescription,
    params.supplierCategory
  );

  const countryScore = calculateCountryMatch(
    params.supplierCountry,
    params.targetCountry
  );

  const profileScore = calculateProfileCompleteness(params.supplier);

  const adminScore = params.adminValidationScore ?? 0.5; // Default neutral if not set

  const totalScore =
    MATCH_WEIGHTS.category * categoryScore +
    MATCH_WEIGHTS.keyword * keywordScore +
    MATCH_WEIGHTS.country * countryScore +
    MATCH_WEIGHTS.profileCompleteness * profileScore +
    MATCH_WEIGHTS.adminValidation * adminScore;

  return {
    totalScore: Math.min(1, Math.max(0, totalScore)),
    confidence: scoreToConfidence(totalScore),
    componentScores: {
      category: categoryScore,
      keyword: keywordScore,
      country: countryScore,
      profileCompleteness: profileScore,
      adminValidation: adminScore,
    },
  };
}

// ==========================================
// INTERNAL QUERIES FOR MATCHING
// ==========================================

/**
 * Internal: Get all approved suppliers for a category
 * Uses the approved_category index for efficiency
 */
export const _getApprovedSuppliersByCategory = internalQuery({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 200);

    // Use the approved_category index for efficient lookup
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved_category", (q) =>
        q.eq("approved", true).eq("category", args.category)
      )
      .take(limit);

    return suppliers.map((s) => ({
      _id: s._id,
      business_name: s.business_name,
      category: s.category,
      description: s.description,
      country: s.country,
      city: s.city,
      state: s.state,
      verified: s.verified,
      approved: s.approved,
      rating: s.rating,
      reviews_count: s.reviews_count,
      phone: s.phone,
      website: s.website,
      logo_url: s.logo_url,
      image: s.image,
    }));
  },
});

/**
 * Internal: Get all approved suppliers (fallback when no category match)
 * Limited to prevent memory issues
 */
export const _getApprovedSuppliersBatch = internalQuery({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 150);

    // Use approved index for efficient filtering
    let query = ctx.db.query("suppliers").withIndex("approved", (q) =>
      q.eq("approved", true)
    );

    // Pagination support if cursor provided
    if (args.cursor) {
      // Note: Convex doesn't support cursor-based pagination directly
      // This is a simplified implementation
      query = ctx.db.query("suppliers").withIndex("approved", (q) =>
        q.eq("approved", true)
      );
    }

    const suppliers = await query.take(limit);

    return suppliers.map((s) => ({
      _id: s._id,
      business_name: s.business_name,
      category: s.category,
      description: s.description,
      country: s.country,
      city: s.city,
      state: s.state,
      verified: s.verified,
      approved: s.approved,
      rating: s.rating,
      reviews_count: s.reviews_count,
      phone: s.phone,
      website: s.website,
      logo_url: s.logo_url,
      image: s.image,
    }));
  },
});

/**
 * Internal: Get existing candidate for a product-supplier pair
 */
export const _getExistingCandidate = internalQuery({
  args: {
    productId: v.id("products"),
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    // Query using the productId index and filter by supplierId
    const candidates = await ctx.db
      .query("productSupplierCandidates")
      .withIndex("productId", (q) => q.eq("productId", args.productId))
      .collect();

    return candidates.find((c) => c.supplierId === args.supplierId) || null;
  },
});

/**
 * Internal: Get approved candidates for a product
 * Returns top matches sorted by score
 */
export const _getProductCandidates = internalQuery({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
    minScore: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 50);
    const minScore = args.minScore ?? 0;

    // Use the productId_approved index for efficient lookup
    const candidates = await ctx.db
      .query("productSupplierCandidates")
      .withIndex("productId_approved", (q) =>
        q.eq("productId", args.productId).eq("isApproved", true)
      )
      .collect();

    // Filter by minimum score and sort by matchScore descending
    const filtered = candidates
      .filter((c) => c.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return filtered;
  },
});

// ==========================================
// MUTATIONS FOR MATCHING
// ==========================================

/**
 * Internal: Create or update a product-supplier candidate
 */
export const _upsertCandidate = internalMutation({
  args: {
    productId: v.id("products"),
    supplierId: v.id("suppliers"),
    matchScore: v.float64(),
    matchConfidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    matchSource: v.union(v.literal("manual"), v.literal("rule_engine"), v.literal("ai_inference"), v.literal("import")),
    isApproved: v.boolean(),
    componentScores: v.object({
      category: v.float64(),
      keyword: v.float64(),
      country: v.float64(),
      profileCompleteness: v.float64(),
      adminValidation: v.float64(),
    }),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check if candidate already exists
    const existing = await ctx.db
      .query("productSupplierCandidates")
      .withIndex("productId", (q) => q.eq("productId", args.productId))
      .collect();

    const found = existing.find((c) => c.supplierId === args.supplierId);

    if (found) {
      // Update existing
      await ctx.db.patch(found._id, {
        matchScore: args.matchScore,
        matchConfidence: args.matchConfidence,
        isApproved: args.isApproved,
        categoryMatchScore: args.componentScores.category,
        keywordMatchScore: args.componentScores.keyword,
        countryMatchScore: args.componentScores.country,
        profileCompletenessScore: args.componentScores.profileCompleteness,
        adminValidationScore: args.componentScores.adminValidation,
        updatedAt: now,
      });
      return { id: found._id, action: "updated" };
    } else {
      // Create new
      const id = await ctx.db.insert("productSupplierCandidates", {
        productId: args.productId,
        supplierId: args.supplierId,
        matchScore: args.matchScore,
        matchConfidence: args.matchConfidence,
        matchSource: args.matchSource,
        isApproved: args.isApproved,
        categoryMatchScore: args.componentScores.category,
        keywordMatchScore: args.componentScores.keyword,
        countryMatchScore: args.componentScores.country,
        profileCompletenessScore: args.componentScores.profileCompleteness,
        adminValidationScore: args.componentScores.adminValidation,
        createdAt: now,
        updatedAt: now,
      });
      return { id, action: "created" };
    }
  },
});

// ==========================================
// PUBLIC ACTIONS FOR MATCHING
// ==========================================

/**
 * Action: Compute and store matches for a product
 * This should be called when:
 * - A new product is created
 * - A product's category/keywords change
 * - Admin requests recomputation
 */
export const computeProductMatches = action({
  args: {
    productId: v.id("products"),
    matchSource: v.optional(v.union(v.literal("manual"), v.literal("rule_engine"), v.literal("ai_inference"), v.literal("import"))),
    autoApproveHighConfidence: v.optional(v.boolean()), // Auto-approve high confidence matches
  },
  handler: async (ctx, args) => {
    const source = args.matchSource ?? "rule_engine";
    const autoApprove = args.autoApproveHighConfidence ?? true;

    // Get product details
    const product = await ctx.runQuery(internal.products._getProductByIdInternal, {
      id: args.productId,
    });

    if (!product) {
      return { success: false, error: "Product not found", candidatesCreated: 0 };
    }

    // Get potential suppliers by category
    let suppliers: any[] = [];
    if (product.category) {
      suppliers = await ctx.runQuery(
        internal.productSourcing._getApprovedSuppliersByCategory,
        { category: product.category, limit: 100 }
      );
    }

    // If few results, get additional approved suppliers
    if (suppliers.length < 20) {
      const additional = await ctx.runQuery(
        internal.productSourcing._getApprovedSuppliersBatch,
        { limit: 50 }
      );
      // Merge and deduplicate
      const existingIds = new Set(suppliers.map((s) => s._id));
      for (const sup of additional) {
        if (!existingIds.has(sup._id)) {
          suppliers.push(sup);
        }
      }
    }

    let candidatesCreated = 0;
    let candidatesUpdated = 0;

    // Compute match score for each supplier
    for (const supplier of suppliers.slice(0, 100)) {
      const scoreResult = calculateMatchScore({
        productCategory: product.category,
        productKeywords: product.keywords,
        supplierCategory: supplier.category,
        supplierDescription: supplier.description,
        supplierCountry: supplier.country,
        supplier: {
          description: supplier.description,
          phone: supplier.phone,
          website: supplier.website,
          logo_url: supplier.logo_url,
          image: supplier.image,
          verified: supplier.verified,
          approved: supplier.approved,
          rating: supplier.rating,
        },
      });

      // Only store candidates with at least some relevance
      if (scoreResult.totalScore >= 0.3) {
        const isApproved = autoApprove && scoreResult.confidence === "high";

        const result = await ctx.runMutation(
          internal.productSourcing._upsertCandidate,
          {
            productId: args.productId,
            supplierId: supplier._id,
            matchScore: scoreResult.totalScore,
            matchConfidence: scoreResult.confidence,
            matchSource: source,
            isApproved,
            componentScores: scoreResult.componentScores,
          }
        );

        if (result.action === "created") {
          candidatesCreated++;
        } else {
          candidatesUpdated++;
        }
      }
    }

    return {
      success: true,
      candidatesCreated,
      candidatesUpdated,
      totalSuppliersChecked: suppliers.length,
    };
  },
});

/**
 * Action: Recompute all matches for a supplier
 * Call this when supplier profile changes significantly
 */
export const recomputeSupplierMatches = action({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    // Get supplier details
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      return { success: false, error: "Supplier not found" };
    }

    // Get all products
    const products = await ctx.db
      .query("products")
      .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
      .take(500);

    let updatedCount = 0;

    for (const product of products) {
      const scoreResult = calculateMatchScore({
        productCategory: product.category,
        productKeywords: product.keywords,
        supplierCategory: supplier.category,
        supplierDescription: supplier.description,
        supplierCountry: supplier.country,
        supplier: {
          description: supplier.description,
          phone: supplier.phone,
          website: supplier.website,
          logo_url: supplier.logo_url,
          image: supplier.image,
          verified: supplier.verified,
          approved: supplier.approved,
          rating: supplier.rating,
        },
      });

      if (scoreResult.totalScore >= 0.3) {
        await ctx.runMutation(internal.productSourcing._upsertCandidate, {
          productId: product._id,
          supplierId: args.supplierId,
          matchScore: scoreResult.totalScore,
          matchConfidence: scoreResult.confidence,
          matchSource: "rule_engine",
          isApproved: scoreResult.confidence === "high",
          componentScores: scoreResult.componentScores,
        });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});

// ==========================================
// ADMIN MUTATIONS
// ==========================================

/**
 * Mutation: Admin approves or rejects a candidate
 */
export const approveCandidate = mutation({
  args: {
    candidateId: v.id("productSupplierCandidates"),
    isApproved: v.boolean(),
    adminValidationScore: v.optional(v.float64()),
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

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");

    await ctx.db.patch(args.candidateId, {
      isApproved: args.isApproved,
      adminValidationScore: args.adminValidationScore,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Query: Get all candidates for admin review
 */
export const getCandidatesForReview = query({
  args: {
    productId: v.optional(v.id("products")),
    supplierId: v.optional(v.id("suppliers")),
    isApproved: v.optional(v.boolean()),
    minConfidence: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    limit: v.optional(v.number()),
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
    let candidates: any[] = [];

    if (args.productId) {
      candidates = await ctx.db
        .query("productSupplierCandidates")
        .withIndex("productId", (q) => q.eq("productId", args.productId))
        .collect();
    } else if (args.supplierId) {
      candidates = await ctx.db
        .query("productSupplierCandidates")
        .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
        .collect();
    } else {
      // No filter - limited to prevent memory issues
      candidates = await ctx.db.query("productSupplierCandidates").take(limit);
    }

    // Apply filters in memory
    if (args.isApproved !== undefined) {
      candidates = candidates.filter((c) => c.isApproved === args.isApproved);
    }

    if (args.minConfidence) {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const minOrder = confidenceOrder[args.minConfidence];
      candidates = candidates.filter(
        (c) => confidenceOrder[c.matchConfidence] >= minOrder
      );
    }

    return candidates.slice(0, limit);
  },
});
