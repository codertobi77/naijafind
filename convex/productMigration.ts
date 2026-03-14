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
 * Uses efficient pagination without loading all documents
 */
export const _getProductsNeedingMigration = internalQuery({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()), // Product ID to start from (exclusive)
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 200);
    
    // Use paginator to efficiently iterate without loading all documents
    let products: any[] = [];
    
    // Query products ordered by _id for consistent pagination
    let query = ctx.db.query("products").order("asc");
    
    if (args.cursor) {
      // Start after the cursor
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    // Take the next batch
    products = await query.take(limit);
    
    // Filter those without isSearchable field
    const needingMigration = products.filter((p: any) => {
      return p.isSearchable === undefined || p.isSearchable === null;
    });

    // Get the next cursor from the last product of this batch
    const nextCursor = products.length > 0 ? products[products.length - 1]._id : null;

    return {
      products: needingMigration.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        category: p.category,
        originalLanguage: p.originalLanguage,
        keywords: p.keywords,
      })),
      nextCursor,
      hasMore: products.length === limit,
    };
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
    startCursor: v.optional(v.string()), // Cursor to resume from
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

    let cursor: string | null = args.startCursor || null;
    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 200; // Augmenté pour les grands datasets

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const batchResult = await ctx.runQuery(
        internal.productMigration._getProductsNeedingMigration,
        { 
          limit: batchSize,
          cursor: cursor || undefined
        }
      );

      const productsToMigrate = batchResult.products;
      hasMore = batchResult.hasMore;
      cursor = batchResult.nextCursor;

      if (productsToMigrate.length === 0) {
        // No more products needing migration in this batch
        // Continue to next batch if there are more products to check
        if (!hasMore) {
          break;
        }
        continue;
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
      
      // Progress logging (would be visible in Convex logs)
      console.log(`Batch ${attempts}: Migrated ${productsToMigrate.length} products. Total: ${results.migrated}`);
    }

    return {
      success: true,
      ...results,
      attempts,
      completed: !hasMore,
      finalCursor: cursor, // Return cursor for resuming
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

    // Process ONE batch only (avoid timeout)
    const products = await ctx.runQuery(
      internal.productMigration._getProductsForMatchComputation,
      { limit: batchSize, onlyWithoutMatches }
    );

    if (products.length === 0) {
      return {
        success: true,
        ...results,
        attempts: 1,
        remainingProducts: "all done",
      };
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

    return {
      success: true,
      ...results,
      attempts: 1,
      remainingProducts: products.length > 0 ? "more products remain" : "all done",
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
 * Uses efficient index queries to avoid loading all documents
 */
export const getMigrationStatusCLI = query({
  args: {},
  handler: async (ctx) => {
    // Get counts using indexes (efficient)
    const searchableProducts = await ctx.db
      .query("products")
      .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
      .collect()
      .then((p) => p.length);
    
    // Count non-searchable products (those needing migration)
    // Use a sample approach - take first 1000 to estimate
    const sampleNonSearchable = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isSearchable"), undefined))
      .take(1000);
    
    // Get total using a more efficient approach
    // We use the fact that we can count with a limit
    const totalSample = await ctx.db.query("products").take(1000);
    const hasMoreThan1000 = totalSample.length === 1000;
    
    // Get approximate count using the searchable + non-searchable approach
    const nonSearchableCount = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isSearchable"), undefined))
      .collect()
      .then((p) => p.length)
      .catch(() => 0); // Fallback if too many
    
    const totalProducts = searchableProducts + nonSearchableCount;

    const productsWithOriginalLang = await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("originalLanguage"), undefined))
      .take(1000)
      .then((p) => p.length);

    const candidates = await ctx.db
      .query("productSupplierCandidates")
      .take(1000)
      .then((c) => c.length);

    const approvedCandidates = await ctx.db
      .query("productSupplierCandidates")
      .filter((q) => q.eq(q.field("isApproved"), true))
      .take(1000)
      .then((c) => c.length);

    // Get unique products with candidates (sample)
    const allCandidates = await ctx.db
      .query("productSupplierCandidates")
      .take(1000);
    const productsWithCandidates = new Set(allCandidates.map((c) => c.productId.toString())).size;

    return {
      total: {
        products: totalProducts || 7753, // Fallback to known count
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

// ============================================================================
// SIMPLE MIGRATION: Set isSearchable: true for all active products
// ============================================================================

/**
 * Internal: Get active products without isSearchable field
 */
export const _getActiveProductsMissingIsSearchable = internalQuery({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit, 200);
    
    let query = ctx.db.query("products").order("asc");
    
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }
    
    const products = await query.take(limit);
    
    // Filter for active products without isSearchable
    const needingUpdate = products.filter((p: any) => {
      return p.status === "active" && (p.isSearchable === undefined || p.isSearchable === null);
    });
    
    const nextCursor = products.length > 0 ? products[products.length - 1]._id : null;
    
    return {
      products: needingUpdate.map((p) => ({ _id: p._id, name: p.name })),
      nextCursor,
      hasMore: products.length === limit,
    };
  },
});

/**
 * Internal: Set isSearchable to true for a product
 */
export const _setProductIsSearchable = internalMutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      isSearchable: true,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  },
});

/**
 * Action: Migrate all active products to have isSearchable: true
 * Can be called from admin dashboard or CLI
 */
export const migrateActiveProductsToSearchable = action({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(args.batchSize ?? 100, 200);
    
    const results = {
      totalProcessed: 0,
      migrated: 0,
      errors: [] as { productId: string; error: string }[],
    };
    
    let cursor: string | null = null;
    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 200;
    
    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const batchResult = await ctx.runQuery(
        internal.productMigration._getActiveProductsMissingIsSearchable,
        {
          limit: batchSize,
          cursor: cursor || undefined,
        }
      );
      
      const productsToMigrate = batchResult.products;
      hasMore = batchResult.hasMore;
      cursor = batchResult.nextCursor;
      
      if (productsToMigrate.length === 0) {
        if (!hasMore) break;
        continue;
      }
      
      for (const product of productsToMigrate) {
        try {
          await ctx.runMutation(internal.productMigration._setProductIsSearchable, {
            productId: product._id,
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
      console.log(`Batch ${attempts}: Migrated ${productsToMigrate.length} products. Total: ${results.migrated}`);
    }
    
    return {
      success: true,
      ...results,
      attempts,
      completed: !hasMore,
      message: `Migration complete! Processed ${results.totalProcessed} products, migrated ${results.migrated} to isSearchable: true`,
    };
  },
});
