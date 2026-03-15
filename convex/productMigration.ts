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
 * Uses efficient pagination - continues searching until it finds products needing migration
 */
export const _getProductsNeedingMigration = internalQuery({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()), // Product ID to start from (exclusive)
  },
  handler: async (ctx, args) => {
    const targetLimit = Math.min(args.limit, 200);
    
    let allProductsScanned = 0;
    const needingMigration: any[] = [];
    let currentCursor = args.cursor || null;
    
    // Keep fetching batches until we find enough products needing migration
    while (needingMigration.length < targetLimit) {
      // Query products ordered by _id for consistent pagination
      let query = ctx.db.query("products").order("asc");
      
      if (currentCursor) {
        // Start after the cursor
        query = query.filter((q) => q.gt(q.field("_id"), currentCursor));
      }
      
      // Take a batch
      const batchSize = 500; // Scan larger batches to find gaps faster
      const products = await query.take(batchSize);
      
      if (products.length === 0) {
        break; // No more products
      }
      
      allProductsScanned += products.length;
      
      // Filter those without isSearchable field
      for (const p of products) {
        if (p.isSearchable === undefined || p.isSearchable === null) {
          needingMigration.push(p);
          if (needingMigration.length >= targetLimit) break;
        }
      }
      
      // Update cursor
      currentCursor = products[products.length - 1]._id;
      
      // If we scanned less than batchSize, we've reached the end
      if (products.length < batchSize) {
        break;
      }
    }

    // Get the next cursor from the last product scanned (not just those needing migration)
    const nextCursor = currentCursor;

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
      hasMore: needingMigration.length === targetLimit,
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
interface ProductData {
  name: string;
  description?: string;
  category?: string;
}

function generateKeywordsFromProduct(product: ProductData): string[] {
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

    const results: {
      totalProcessed: number;
      migrated: number;
      skipped: number;
      errors: { productId: string; error: string }[];
    } = {
      totalProcessed: 0,
      migrated: 0,
      skipped: 0,
      errors: [],
    };

    let cursor: string | null = args.startCursor || null;
    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 200; // Augmenté pour les grands datasets

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const batchResult: {
        products: Array<{ _id: any; name: string; description?: string; category?: string }>;
        nextCursor: string | null;
        hasMore: boolean;
      } = await ctx.runQuery(
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
    startCursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetLimit = Math.min(args.limit, 200);
    let currentCursor = args.startCursor || null;

    if (!args.onlyWithoutMatches) {
      let query = ctx.db
        .query("products")
        .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
        .order("asc");

      if (currentCursor) {
        query = query.filter((q) => q.gt(q.field("_id"), currentCursor));
      }

      const batch = await query.take(targetLimit);
      const nextCursor = batch.length > 0 ? batch[batch.length - 1]._id : null;

      return {
        products: batch.map((p) => ({
          _id: p._id,
          name: p.name,
          category: p.category,
        })),
        nextCursor,
        hasMore: batch.length === targetLimit,
      };
    }

    // onlyWithoutMatches = true
    // On récupère les produits déjà matchés.
    // Si tu dépasses 10k candidats un jour, il faudra aussi paginer cette table.
    const allCandidates = await ctx.db.query("productSupplierCandidates").take(10000);
    const productIdsWithCandidates = new Set(
      allCandidates.map((c) => c.productId.toString())
    );

    const selected: Array<{ _id: Id<"products">; name: string; category?: string }> = [];
    const scanBatchSize = 500;
    let reachedEnd = false;

    while (selected.length < targetLimit) {
      let query = ctx.db
        .query("products")
        .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
        .order("asc");

      if (currentCursor) {
        query = query.filter((q) => q.gt(q.field("_id"), currentCursor));
      }

      const scanBatch = await query.take(scanBatchSize);

      if (scanBatch.length === 0) {
        reachedEnd = true;
        break;
      }

      for (const product of scanBatch) {
        if (!productIdsWithCandidates.has(product._id.toString())) {
          selected.push({
            _id: product._id,
            name: product.name,
            category: product.category,
          });

          if (selected.length >= targetLimit) break;
        }
      }

      currentCursor = scanBatch[scanBatch.length - 1]._id;

      if (scanBatch.length < scanBatchSize) {
        reachedEnd = true;
        break;
      }
    }

    return {
      products: selected,
      nextCursor: currentCursor,
      hasMore: !reachedEnd,
    };
  },
});

/**
 * Debug: Check existing candidates count
 */
export const _debugCandidates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allCandidates = await ctx.db.query("productSupplierCandidates").take(10000);
    
    const uniqueProducts = new Set(allCandidates.map(c => c.productId.toString()));
    
    // Get first 10 searchable products
    const first10Searchable = await ctx.db
      .query("products")
      .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
      .take(10);
    
    // Check which ones have candidates
    const productIdsWithCandidates = new Set(allCandidates.map(c => c.productId.toString()));
    const searchableWithCandidates = first10Searchable.filter(p => 
      productIdsWithCandidates.has(p._id.toString())
    );
    
    return {
      totalCandidates: allCandidates.length,
      uniqueProducts: uniqueProducts.size,
      first10Searchable: first10Searchable.map(p => ({
        id: p._id,
        name: p.name,
        hasCandidates: productIdsWithCandidates.has(p._id.toString()),
      })),
      searchableWithCandidatesCount: searchableWithCandidates.length,
    };
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

    const batchSize = Math.min(args.batchSize ?? 20, 30);
    const onlyWithoutMatches = args.onlyWithoutMatches ?? true;
    const autoApprove = args.autoApproveHighConfidence ?? true;

    const results: {
      totalProcessed: number;
      matchesCreated: number;
      matchesUpdated: number;
      errors: { productId: string; error: string }[];
    } = {
      totalProcessed: 0,
      matchesCreated: 0,
      matchesUpdated: 0,
      errors: [],
    };

    let hasMore = true;
    let attempts = 0;
    let cursor: string | null = null;
    const MAX_ATTEMPTS = 500;

    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;

      const batchResult: {
        products: Array<{ _id: any; name: string; category?: string }>;
        nextCursor: string | null;
        hasMore: boolean;
      } = await ctx.runQuery(
        internal.productMigration._getProductsForMatchComputation,
        {
          limit: batchSize,
          onlyWithoutMatches,
          startCursor: cursor || undefined,
        }
      );

      const products = batchResult.products;

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      for (const product of products) {
        try {
          const result = await ctx.runAction(
            internal.productSourcing.computeProductMatches,
            {
              productId: product._id,
              matchSource: "rule_engine",
              autoApproveHighConfidence: autoApprove,
            }
          );

          if (result?.success) {
            results.matchesCreated += result.candidatesCreated || 0;
            results.matchesUpdated += result.candidatesUpdated || 0;
          } else {
            results.errors.push({
              productId: product._id,
              error: result?.error || "Unknown error",
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
      cursor = batchResult.nextCursor;
      hasMore = batchResult.hasMore;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return {
      success: true,
      ...results,
      attempts,
      nextCursor: cursor,
      remainingProducts: hasMore ? "more products remain" : "all done",
    };
  },
});

/**
 * Action: Compute supplier matches for all products - CLI VERSION
 * WARNING: Only use this for local development/CLI scripts
 * OPTIMIZED: Process ONE batch only to avoid timeout
 */
export const computeMatchesForAllProductsCLI = action({
  args: {
    batchSize: v.optional(v.number()),
    onlyWithoutMatches: v.optional(v.boolean()),
    autoApproveHighConfidence: v.optional(v.boolean()),
    startCursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(args.batchSize ?? 20, 30);
    const onlyWithoutMatches = args.onlyWithoutMatches ?? true;
    const autoApprove = args.autoApproveHighConfidence ?? true;

    const results: {
      totalProcessed: number;
      matchesCreated: number;
      matchesUpdated: number;
      errors: { productId: string; error: string }[];
      nextCursor: string | null;
      hasMore: boolean;
    } = {
      totalProcessed: 0,
      matchesCreated: 0,
      matchesUpdated: 0,
      errors: [],
      nextCursor: null,
      hasMore: false,
    };

    const batchResult: {
      products: Array<{ _id: any; name: string; category?: string }>;
      nextCursor: string | null;
      hasMore: boolean;
    } = await ctx.runQuery(
      internal.productMigration._getProductsForMatchComputation,
      {
        limit: batchSize,
        onlyWithoutMatches,
        startCursor: args.startCursor,
      }
    );

    const products = batchResult.products;

    if (products.length === 0) {
      return {
        success: true,
        ...results,
        attempts: 1,
        remainingProducts: "all done",
      };
    }

    // Conseil: ne pas lancer trop de runAction en parallèle.
    // On reste séquentiel ou avec petite concurrence.
    for (const product of products) {
      try {
        const result = await ctx.runAction(
          internal.productSourcing.computeProductMatches,
          {
            productId: product._id,
            matchSource: "rule_engine",
            autoApproveHighConfidence: autoApprove,
          }
        );

        if (result?.success) {
          results.matchesCreated += result.candidatesCreated || 0;
          results.matchesUpdated += result.candidatesUpdated || 0;
        } else {
          results.errors.push({
            productId: product._id,
            error: result?.error || "Unknown error",
          });
        }
      } catch (error) {
        results.errors.push({
          productId: product._id,
          error: String(error),
        });
      }
    }

    results.totalProcessed = products.length;
    results.nextCursor = batchResult.nextCursor;
    results.hasMore = batchResult.hasMore;

    return {
      success: true,
      ...results,
      attempts: 1,
      remainingProducts: batchResult.hasMore ? "more products remain" : "all done",
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
      phase2: {
        totalProcessed: 0,
        matchesCreated: 0,
        matchesUpdated: 0,
        errors: [] as { productId: string; error: string }[],
        batches: 0,
        completed: false,
      },
    };

    results.phase1 = await ctx.runAction(
      internal.productMigration.migrateAllProductsCLI,
      {
        defaultLanguage: args.defaultLanguage,
        batchSize: args.productBatchSize,
      }
    );

    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const batch: {
        success: boolean;
        totalProcessed: number;
        matchesCreated: number;
        matchesUpdated: number;
        errors: { productId: string; error: string }[];
        nextCursor: string | null;
        hasMore: boolean;
      } = await ctx.runAction(
        internal.productMigration.computeMatchesForAllProductsCLI,
        {
          batchSize: args.matchBatchSize,
          onlyWithoutMatches: false,
          autoApproveHighConfidence: args.autoApproveHighConfidence,
          startCursor: cursor || undefined,
        }
      );

      results.phase2.batches++;
      results.phase2.totalProcessed += batch.totalProcessed || 0;
      results.phase2.matchesCreated += batch.matchesCreated || 0;
      results.phase2.matchesUpdated += batch.matchesUpdated || 0;
      results.phase2.errors.push(...(batch.errors || []));

      cursor = batch.nextCursor || null;
      hasMore = batch.hasMore === true;
    }

    results.phase2.completed = true;

    return {
      success: true,
      phase1: results.phase1,
      phase2: results.phase2,
      summary: {
        productsMigrated: results.phase1?.migrated || 0,
        productsProcessedForMatching: results.phase2.totalProcessed,
        matchesCreated: results.phase2.matchesCreated,
        matchesUpdated: results.phase2.matchesUpdated,
        totalErrors:
          (results.phase1?.errors?.length || 0) +
          results.phase2.errors.length,
      },
    };
  },
});

// ==========================================
// MIGRATION STATUS QUERIES
// ==========================================

/**
 * Internal: count one page of all products
 */
export const _statusCountProductsPage = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 250, 500);

    let query = ctx.db.query("products").order("asc");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }

    const batch = await query.take(limit);

    let totalProducts = 0;
    let migratedProducts = 0;
    let searchableProducts = 0;
    let productsWithOriginalLang = 0;
    let productsWithKeywords = 0;

    for (const product of batch) {
      totalProducts++;

      const hasSearchable = product.isSearchable === true;
      const hasOriginalLanguage =
        product.originalLanguage !== undefined &&
        product.originalLanguage !== null &&
        String(product.originalLanguage).trim() !== "";
      const hasKeywords =
        Array.isArray((product as any).keywords) &&
        (product as any).keywords.length > 0;

      if (hasSearchable) searchableProducts++;
      if (hasOriginalLanguage) productsWithOriginalLang++;
      if (hasKeywords) productsWithKeywords++;

      if (hasSearchable && hasOriginalLanguage && hasKeywords) {
        migratedProducts++;
      }
    }

    return {
      totalProducts,
      migratedProducts,
      searchableProducts,
      productsWithOriginalLang,
      productsWithKeywords,
      nextCursor: batch.length > 0 ? batch[batch.length - 1]._id : null,
      hasMore: batch.length === limit,
    };
  },
});

/**
 * Internal: count one page of candidate stats
 */
export const _statusCountCandidatesPage = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 500, 1000);

    let query = ctx.db.query("productSupplierCandidates").order("asc");
    if (args.cursor) {
      query = query.filter((q) => q.gt(q.field("_id"), args.cursor as string));
    }

    const batch = await query.take(limit);

    let totalCandidates = 0;
    let approvedCandidates = 0;

    const productIdsWithCandidates = new Set<string>();
    const productIdsWithApprovedCandidates = new Set<string>();

    for (const candidate of batch) {
      totalCandidates++;
      productIdsWithCandidates.add(candidate.productId.toString());

      if (candidate.isApproved === true) {
        approvedCandidates++;
        productIdsWithApprovedCandidates.add(candidate.productId.toString());
      }
    }

    return {
      totalCandidates,
      approvedCandidates,
      productIdsWithCandidates: Array.from(productIdsWithCandidates),
      productIdsWithApprovedCandidates: Array.from(
        productIdsWithApprovedCandidates
      ),
      nextCursor: batch.length > 0 ? batch[batch.length - 1]._id : null,
      hasMore: batch.length === limit,
    };
  },
});

/**
 * Action: Get migration status - CLI VERSION
 * IMPORTANT: action, not query, so each runQuery gets its own execution budget.
 */
export const getMigrationStatusCLI = action({
  args: {},
  handler: async (ctx) => {
    let productCursor: string | null = null;
    let hasMoreProducts = true;

    let totalProducts = 0;
    let migratedProducts = 0;
    let searchableProducts = 0;
    let productsWithOriginalLang = 0;
    let productsWithKeywords = 0;

    while (hasMoreProducts) {
      const page: {
        totalProducts: number;
        migratedProducts: number;
        searchableProducts: number;
        productsWithOriginalLang: number;
        productsWithKeywords: number;
        nextCursor: string | null;
        hasMore: boolean;
      } = await ctx.runQuery(
        internal.productMigration._statusCountProductsPage,
        {
          cursor: productCursor || undefined,
          limit: 250,
        }
      );

      totalProducts += page.totalProducts;
      migratedProducts += page.migratedProducts;
      searchableProducts += page.searchableProducts;
      productsWithOriginalLang += page.productsWithOriginalLang;
      productsWithKeywords += page.productsWithKeywords;

      productCursor = page.nextCursor;
      hasMoreProducts = page.hasMore;
    }

    let candidateCursor: string | null = null;
    let hasMoreCandidates = true;

    let totalCandidates = 0;
    let approvedCandidates = 0;

    const allProductsWithCandidates = new Set<string>();
    const allProductsWithApprovedCandidates = new Set<string>();

    while (hasMoreCandidates) {
      const page: {
        totalCandidates: number;
        approvedCandidates: number;
        productIdsWithCandidates: string[];
        productIdsWithApprovedCandidates: string[];
        nextCursor: string | null;
        hasMore: boolean;
      } = await ctx.runQuery(
        internal.productMigration._statusCountCandidatesPage,
        {
          cursor: candidateCursor || undefined,
          limit: 500,
        }
      );

      totalCandidates += page.totalCandidates;
      approvedCandidates += page.approvedCandidates;

      for (const id of page.productIdsWithCandidates) {
        allProductsWithCandidates.add(id);
      }

      for (const id of page.productIdsWithApprovedCandidates) {
        allProductsWithApprovedCandidates.add(id);
      }

      candidateCursor = page.nextCursor;
      hasMoreCandidates = page.hasMore;
    }

    const productsWithCandidates = allProductsWithCandidates.size;
    const productsWithApprovedCandidates =
      allProductsWithApprovedCandidates.size;

    const productsRemainingForMigration = Math.max(
      0,
      totalProducts - migratedProducts
    );

    const searchableRemainingForMatching = Math.max(
      0,
      searchableProducts - productsWithCandidates
    );

    const searchableRemainingForApprovedMatches = Math.max(
      0,
      searchableProducts - productsWithApprovedCandidates
    );

    const toPercent = (value: number, total: number) =>
      total > 0 ? Math.round((value / total) * 100) : 0;

    return {
      totals: {
        totalProducts,
        migratedProducts,
        searchableProducts,
        productsWithOriginalLang,
        productsWithKeywords,
        totalCandidates,
        approvedCandidates,
        productsWithCandidates,
        productsWithApprovedCandidates,
      },
      remaining: {
        productsRemainingForMigration,
        searchableRemainingForMatching,
        searchableRemainingForApprovedMatches,
      },
      progress: {
        migrationPercent: toPercent(migratedProducts, totalProducts),
        searchablePercent: toPercent(searchableProducts, totalProducts),
        originalLanguagePercent: toPercent(
          productsWithOriginalLang,
          totalProducts
        ),
        keywordsPercent: toPercent(productsWithKeywords, totalProducts),
        productsWithCandidatesPercent: toPercent(
          productsWithCandidates,
          totalProducts
        ),
        productsWithApprovedCandidatesPercent: toPercent(
          productsWithApprovedCandidates,
          totalProducts
        ),
        searchableCoveragePercent: toPercent(
          productsWithCandidates,
          searchableProducts
        ),
        approvedCoveragePercent: toPercent(
          productsWithApprovedCandidates,
          searchableProducts
        ),
      },
      health: {
        migrationComplete:
          totalProducts > 0 && migratedProducts === totalProducts,
        matchingComplete:
          searchableProducts > 0 &&
          productsWithCandidates === searchableProducts,
        approvalCoverageComplete:
          searchableProducts > 0 &&
          productsWithApprovedCandidates === searchableProducts,
        readyForSearch:
          searchableProducts > 0 && approvedCandidates > 0,
      },
      interpretation: {
        note:
          "matchesCreated/matchesUpdated comptent des candidats, pas des produits. Pour suivre la progression réelle, regarde surtout productsWithCandidates et productsWithApprovedCandidates.",
      },
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
export const computeMatchesForSingleProduct = action({
  args: {
    productId: v.id("products"),
    autoApproveHighConfidence: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.runQuery(internal.users._getUserByEmail, {
      email: identity.email ?? "",
    });

    if (!user?.is_admin && user?.user_type !== "admin") {
      throw new Error("Admin only");
    }

    // This runs the action internally
    const result: {
      success?: boolean;
      candidatesCreated?: number;
      candidatesUpdated?: number;
      error?: string;
    } = await ctx.runAction(
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
    
    const results: {
      totalProcessed: number;
      migrated: number;
      errors: { productId: string; error: string }[];
    } = {
      totalProcessed: 0,
      migrated: 0,
      errors: [],
    };
    
    let cursor: string | null = null;
    let hasMore = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 200;
    
    while (hasMore && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const batchResult: {
        products: Array<{ _id: any; name: string }>;
        nextCursor: string | null;
        hasMore: boolean;
      } = await ctx.runQuery(
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
