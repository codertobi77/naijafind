import { action, mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ==========================================
// MIGRATION SYSTEM FOR PRODUCT SOURCING
// ==========================================

/**
 * Migration status tracking table (using a simple counter approach)
 * We track progress in memory during action execution
 */

// ==========================================
// PHASE 1: MIGRATE PRODUCTS - Add new fields
// ==========================================

/**
 * Internal: Get products that need migration (missing isSearchable field)
 */
export const _getProductsNeedingMigration = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all products - we need to check each one
    // This is a one-time migration, so full scan is acceptable
    const products = await ctx.db.query("products").take(args.limit);
    
    // Filter those without isSearchable field
    const needingMigration = products.filter((p: any) => {
      // Check if the field exists and is not undefined
      return p.isSearchable === undefined || p.isSearchable === null;
    });

    return needingMigration.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      category: p.category,
      originalLanguage: p.originalLanguage,
      keywords: p.keywords,
    }));
  },
});

/**
 * Internal: Update a single product with migration fields
 */
export const _migrateProduct = internalMutation({
  args: {
    productId: v.id("products"),
    originalLanguage: v.string(),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      isSearchable: true,
      originalLanguage: args.originalLanguage,
      keywords: args.keywords,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  },
});

/**
 * Helper: Generate keywords from product data
 */
function generateKeywordsFromProduct(product: {
  name: string;
  description?: string;
  category?: string;
}): string[] {
  const keywords: string[] = [];
  
  // Add name words
  const nameWords = product.name
    .toLowerCase()
    .split(/[\s,;:\-\|\/\(\)\[\]\{\}_\*\.]+/)
    .filter((w) => w.length > 2);
  keywords.push(...nameWords);
  
  // Add category
  if (product.category) {
    keywords.push(product.category.toLowerCase());
    
    // Add related keywords based on category
    const categoryKeywords: Record<string, string[]> = {
      electronics: ["electronic", "device", "gadget", "tech"],
      it: ["computer", "software", "hardware", "it", "technology"],
      food: ["food", "agriculture", "agro", "organic", "fresh"],
      agroalimentaire: ["food", "agriculture", "agro", "organic", "fresh"],
      beauty: ["cosmetic", "beauty", "care", "personal care"],
      santé: ["health", "medical", "care", "wellness"],
      construction: ["building", "construction", "material", "btp"],
      btp: ["building", "construction", "material", "infrastructure"],
      clothing: ["clothing", "fashion", "apparel", "textile"],
      automotive: ["auto", "car", "vehicle", "automotive", "parts"],
      auto: ["auto", "car", "vehicle", "automotive", "parts"],
      sports: ["sport", "fitness", "equipment", "activity"],
      home: ["furniture", "home", "interior", "decor"],
      kitchen: ["kitchen", "cooking", "appliance", "culinary"],
    };
    
    const catLower = product.category.toLowerCase();
    const related = categoryKeywords[catLower];
    if (related) {
      keywords.push(...related);
    }
  }
  
  // Extract keywords from description
  if (product.description) {
    const descWords = product.description
      .toLowerCase()
      .split(/[\s,;:\-\|\/\(\)\[\]\{\}_\*\.]+/)
      .filter((w) => w.length > 3)
      .filter((w) => !commonStopWords.has(w));
    
    // Add top 10 most relevant words from description
    keywords.push(...descWords.slice(0, 10));
  }
  
  // Remove duplicates and return
  return [...new Set(keywords)].slice(0, 20);
}

const commonStopWords = new Set([
  "and", "the", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
  "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy",
  "did", "its", "let", "put", "say", "she", "too", "use", "avec", "pour",
  "dans", "sur", "sous", "entre", "par", "des", "les", "une", "est",
]);

/**
 * Action: Migrate all products - CLI VERSION (no auth required)
 * WARNING: Only use this for local development/CLI scripts
 */
export const migrateAllProductsCLI = action({
  args: {
    defaultLanguage: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const defaultLang = args.defaultLanguage || "en";
    const batchSize = Math.min(args.batchSize ?? 100, 200);

    const results = {
      totalProcessed: 0,
      migrated: 0,
      skipped: 0,
      errors: [] as { productId: string; error: string }[],
    };

    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const productsToMigrate = await ctx.runQuery(
        internal.productMigration._getProductsNeedingMigration,
        { limit: batchSize }
      );

      if (productsToMigrate.length === 0) {
        hasMore = false;
        break;
      }

      for (const product of productsToMigrate) {
        try {
          let detectedLang = defaultLang;
          const textToCheck = `${product.name} ${product.description || ""}`.toLowerCase();
          const frenchWords = ["le", "la", "les", "un", "une", "des", "et", "pour", "dans", "avec", "chez"];
          const hasFrenchWords = frenchWords.some((word) => textToCheck.includes(` ${word} `));
          
          if (hasFrenchWords) {
            detectedLang = "fr";
          }

          const keywords = generateKeywordsFromProduct({
            name: product.name,
            description: product.description,
            category: product.category,
          });

          await ctx.runMutation(internal.productMigration._migrateProduct, {
            productId: product._id,
            originalLanguage: detectedLang,
            keywords,
          });

          results.migrated++;
        } catch (error) {
          results.errors.push({
            productId: product._id,
            error: String(error),
          });
        }
      }

      results.totalProcessed += productsToMigrate.length;
    }

    return {
      success: true,
      ...results,
      attempts,
    };
  },
});

// ==========================================
// PHASE 2: COMPUTE SUPPLIER MATCHES
// ==========================================

/**
 * Internal: Get products ready for match computation
 */
export const _getProductsForMatchComputation = internalQuery({
  args: {
    limit: v.number(),
    onlyWithoutMatches: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get searchable products
    const products = await ctx.db
      .query("products")
      .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
      .take(args.limit);

    if (!args.onlyWithoutMatches) {
      return products.map((p) => ({ _id: p._id, name: p.name, category: p.category }));
    }

    // Filter to only those without existing candidates
    const productsWithoutMatches = [];
    
    for (const product of products) {
      const existingMatches = await ctx.db
        .query("productSupplierCandidates")
        .withIndex("productId", (q) => q.eq("productId", product._id))
        .first();
      
      if (!existingMatches) {
        productsWithoutMatches.push({
          _id: product._id,
          name: product.name,
          category: product.category,
        });
      }
    }

    return productsWithoutMatches;
  },
});

/**
 * Internal: Count total searchable products
 */
export const _countSearchableProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
      .collect();
    return products.length;
  },
});

/**
 * Internal: Count products with matches
 */
export const _countProductsWithMatches = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all unique product IDs from candidates
    const candidates = await ctx.db.query("productSupplierCandidates").take(10000);
    const uniqueProductIds = new Set(candidates.map((c) => c.productId.toString()));
    return uniqueProductIds.size;
  },
});

/**
 * Action: Compute supplier matches for all products
 */
export const computeMatchesForAllProducts = action({
  args: {
    batchSize: v.optional(v.number()),
    onlyWithoutMatches: v.optional(v.boolean()),
    autoApproveHighConfidence: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await ctx.runQuery(internal.users._getUserByEmail, {
      email: identity.email ?? "",
    });

    if (!user?.is_admin && user?.user_type !== "admin") {
      return { success: false, error: "Admin only" };
    }

    const batchSize = Math.min(args.batchSize ?? 50, 100);
    const onlyWithoutMatches = args.onlyWithoutMatches ?? true;
    const autoApprove = args.autoApproveHighConfidence ?? true;

    const results = {
      totalProcessed: 0,
      matchesCreated: 0,
      matchesUpdated: 0,
      errors: [] as { productId: string; error: string }[],
    };

    // Process in batches
    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;

      // Get batch of products
      const products = await ctx.runQuery(
        internal.productMigration._getProductsForMatchComputation,
        { limit: batchSize, onlyWithoutMatches }
      );

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      // Compute matches for each product
      for (const product of products) {
        try {
          const matchResult = await ctx.runAction(
            internal.productSourcing.computeProductMatches,
            {
              productId: product._id,
              matchSource: "rule_engine",
              autoApproveHighConfidence: autoApprove,
            }
          );

          if (matchResult.success) {
            results.matchesCreated += matchResult.candidatesCreated || 0;
            results.matchesUpdated += matchResult.candidatesUpdated || 0;
          } else {
            results.errors.push({
              productId: product._id,
              error: matchResult.error || "Unknown error",
            });
          }
        } catch (error) {
          results.errors.push({
            productId: product._id,
            error: String(error),
          });
        }
      }

      results.totalProcessed += products.length;

      // Small delay to prevent rate limiting
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return {
      success: true,
      ...results,
      attempts,
      remainingProducts: hasMore ? "more products remain" : "all done",
    };
  },
});

/**
 * Action: Compute supplier matches for all products - CLI VERSION
 * WARNING: Only use this for local development/CLI scripts
 */
export const computeMatchesForAllProductsCLI = action({
  args: {
    batchSize: v.optional(v.number()),
    onlyWithoutMatches: v.optional(v.boolean()),
    autoApproveHighConfidence: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(args.batchSize ?? 50, 100);
    const onlyWithoutMatches = args.onlyWithoutMatches ?? true;
    const autoApprove = args.autoApproveHighConfidence ?? true;

    const results = {
      totalProcessed: 0,
      matchesCreated: 0,
      matchesUpdated: 0,
      errors: [] as { productId: string; error: string }[],
    };

    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;

      const products = await ctx.runQuery(
        internal.productMigration._getProductsForMatchComputation,
        { limit: batchSize, onlyWithoutMatches }
      );

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const product of products) {
        try {
          const matchResult = await ctx.runAction(
            internal.productSourcing.computeProductMatches,
            {
              productId: product._id,
              matchSource: "rule_engine",
              autoApproveHighConfidence: autoApprove,
            }
          );

          if (matchResult.success) {
            results.matchesCreated += matchResult.candidatesCreated || 0;
            results.matchesUpdated += matchResult.candidatesUpdated || 0;
          } else {
            results.errors.push({
              productId: product._id,
              error: matchResult.error || "Unknown error",
            });
          }
        } catch (error) {
          results.errors.push({
            productId: product._id,
            error: String(error),
          });
        }
      }

      results.totalProcessed += products.length;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return {
      success: true,
      ...results,
      attempts,
      remainingProducts: hasMore ? "more products remain" : "all done",
    };
  },
});

// ==========================================
// FULL MIGRATION - BOTH PHASES
// ==========================================

/**
 * Action: Run complete migration (products + matches) - CLI VERSION
 * WARNING: Only use this for local development/CLI scripts
 */
export const runFullMigrationCLI = action({
  args: {
    defaultLanguage: v.optional(v.string()),
    productBatchSize: v.optional(v.number()),
    matchBatchSize: v.optional(v.number()),
    autoApproveHighConfidence: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results = {
      phase1: null as any,
      phase2: null as any,
    };

    // Phase 1: Migrate products
    results.phase1 = await ctx.runAction(
      internal.productMigration.migrateAllProductsCLI,
      {
        defaultLanguage: args.defaultLanguage,
        batchSize: args.productBatchSize,
      }
    );

    // Phase 2: Compute matches
    results.phase2 = await ctx.runAction(
      internal.productMigration.computeMatchesForAllProductsCLI,
      {
        batchSize: args.matchBatchSize,
        onlyWithoutMatches: true,
        autoApproveHighConfidence: args.autoApproveHighConfidence,
      }
    );

    return {
      success: true,
      phase1: results.phase1,
      phase2: results.phase2,
      summary: {
        productsMigrated: results.phase1.migrated || 0,
        matchesCreated: results.phase2.matchesCreated || 0,
        totalErrors:
          (results.phase1.errors?.length || 0) +
          (results.phase2.errors?.length || 0),
      },
    };
  },
});
// ==========================================
// MIGRATION STATUS QUERIES
// ==========================================

/**
 * Query: Get migration status - CLI VERSION (no auth required)
 */
export const getMigrationStatusCLI = query({
  args: {},
  handler: async (ctx) => {
    // Get counts
    const totalProducts = await ctx.db.query("products").collect().then((p) => p.length);
    
    const searchableProducts = await ctx.db
      .query("products")
      .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
      .collect()
      .then((p) => p.length);

    const productsWithOriginalLang = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("originalLanguage"), undefined))
      .collect()
      .then((p) => p.length);

    const candidates = await ctx.db
      .query("productSupplierCandidates")
      .collect()
      .then((c) => c.length);

    const approvedCandidates = await ctx.db
      .query("productSupplierCandidates")
      .withIndex("productId_approved", (q) => q.eq("isApproved", true))
      .collect()
      .then((c) => c.length);

    // Get unique products with candidates
    const allCandidates = await ctx.db
      .query("productSupplierCandidates")
      .take(10000);
    const productsWithCandidates = new Set(allCandidates.map((c) => c.productId.toString())).size;

    return {
      total: {
        products: totalProducts,
        searchableProducts,
        productsWithOriginalLang,
        candidates,
        approvedCandidates,
        productsWithCandidates,
      },
      progress: {
        productsMigratedPercent:
          totalProducts > 0
            ? Math.round((searchableProducts / totalProducts) * 100)
            : 0,
        productsWithMatchesPercent:
          totalProducts > 0
            ? Math.round((productsWithCandidates / totalProducts) * 100)
            : 0,
      },
      readyForSearch: searchableProducts > 0 && approvedCandidates > 0,
    };
  },
});

// ==========================================
// SINGLE PRODUCT MIGRATION (for testing)
// ==========================================

/**
 * Mutation: Migrate a single product (admin/testing)
 */
export const migrateSingleProduct = mutation({
  args: {
    productId: v.id("products"),
    originalLanguage: v.optional(v.string()),
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

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    // Detect language
    let detectedLang = args.originalLanguage || "en";
    if (!args.originalLanguage) {
      const textToCheck = `${product.name} ${product.description || ""}`.toLowerCase();
      const frenchWords = ["le", "la", "les", "un", "une", "des", "et", "pour", "dans", "avec"];
      const hasFrenchWords = frenchWords.some((word) => textToCheck.includes(` ${word} `));
      if (hasFrenchWords) detectedLang = "fr";
    }

    // Generate keywords
    const keywords = generateKeywordsFromProduct({
      name: product.name,
      description: product.description,
      category: product.category,
    });

    // Update
    await ctx.db.patch(args.productId, {
      isSearchable: true,
      originalLanguage: detectedLang,
      keywords,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      productId: args.productId,
      originalLanguage: detectedLang,
      keywordsCount: keywords.length,
    };
  },
});

/**
 * Mutation: Remove translations field from all products (cleanup migration)
 * This fixes the schema validation error when deploying
 */
export const removeTranslationsField = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      const productAny = product as any;
      if (productAny.translations !== undefined) {
        // Remove the translations field by patching with undefined
        await ctx.db.patch(product._id, {
          translations: undefined,
        } as any);
        updated++;
      } else {
        skipped++;
      }
    }

    return {
      success: true,
      total: products.length,
      updated,
      skipped,
    };
  },
});

/**
 * Mutation: Compute matches for single product (admin/testing)
 */
export const computeMatchesForSingleProduct = mutation({
  args: {
    productId: v.id("products"),
    autoApproveHighConfidence: v.optional(v.boolean()),
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

    // This runs the action internally
    const result = await ctx.runAction(
      internal.productSourcing.computeProductMatches,
      {
        productId: args.productId,
        matchSource: "manual",
        autoApproveHighConfidence: args.autoApproveHighConfidence ?? true,
      }
    );

    return result;
  },
});
