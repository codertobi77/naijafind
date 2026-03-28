import { query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { expandQueryWithDictionary, calculateSemanticScore } from "./productDictionary";

// ==========================================
// PRODUCT-FIRST SEARCH
// ==========================================

/**
 * Type for supplier snapshot in search results
 */
interface SupplierSnapshot {
  id: string;
  name: string;
  rating?: number;
  reviews_count?: number;
  verified: boolean;
  approved: boolean;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  category: string;
  matchScore: number;
  matchConfidence: "high" | "medium" | "low";
}

/**
 * Type for search result product
 */
interface ProductSearchResult {
  _id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  status: string;
  category?: string;
  images?: string[];
  relevanceScore: number;
  suppliers: SupplierSnapshot[];
  totalSuppliers: number;
}

// ==========================================
// INTERNAL QUERIES
// ==========================================

/**
 * Internal: Get supplier details by IDs batch
 * Prevents N+1 queries by fetching all suppliers at once
 */
export const _getSuppliersByIds = internalQuery({
  args: {
    supplierIds: v.array(v.id("suppliers")),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const suppliers: any[] = [];

    for (const id of args.supplierIds) {
      const supplier = await ctx.db.get(id);
      if (supplier) {
        suppliers.push({
          _id: supplier._id,
          business_name: supplier.business_name,
          category: supplier.category,
          country: supplier.country,
          city: supplier.city,
          state: supplier.state,
          verified: supplier.verified,
          approved: supplier.approved,
          rating: supplier.rating,
          reviews_count: supplier.reviews_count,
        });
      }
    }

    return suppliers;
  },
});

/**
 * Internal: Get products for search optimization
 * Uses indexes to minimize data read
 * 
 * IMPORTANT: Returns ALL products by default, regardless of isSearchable flag.
 * The isSearchable filter is only applied when explicitly requested.
 */
export const _getProductsForSearch = internalQuery({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    isSearchable: v.optional(v.boolean()), // Only filter if explicitly provided
  },
  handler: async (ctx, args): Promise<Array<{
    _id: Id<"products">;
    name: string;
    description?: string;
    shortDescription?: string;
    price?: number;
    status: string;
    category?: string;
    keywords?: string[];
    images?: string[];
    originalLanguage?: string;
    supplierId?: Id<"suppliers">;
  }>> => {
    const limit = Math.min(args.limit ?? 500, 1000);
    // Only filter by isSearchable if explicitly provided (not undefined)
    const shouldFilterBySearchable = args.isSearchable !== undefined;

    let products: any[] = [];

    // Use appropriate index based on filters
    if (args.category && args.status) {
      products = await ctx.db
        .query("products")
        .withIndex("status_category", (q) =>
          q.eq("status", args.status!).eq("category", args.category!)
        )
        .filter((q) => 
          shouldFilterBySearchable ? q.eq(q.field("isSearchable"), args.isSearchable!) : true
        )
        .take(limit);
    } else if (args.category) {
      products = await ctx.db
        .query("products")
        .withIndex("category", (q) => q.eq("category", args.category!))
        .filter((q) => 
          shouldFilterBySearchable ? q.eq(q.field("isSearchable"), args.isSearchable!) : true
        )
        .take(limit);
    } else if (args.status) {
      products = await ctx.db
        .query("products")
        .withIndex("status", (q) => q.eq("status", args.status!))
        .filter((q) => 
          shouldFilterBySearchable ? q.eq(q.field("isSearchable"), args.isSearchable!) : true
        )
        .take(limit);
    } else {
      // No filters - fetch ALL products (no isSearchable filter by default)
      if (shouldFilterBySearchable) {
        products = await ctx.db
          .query("products")
          .withIndex("isSearchable", (q) => q.eq("isSearchable", args.isSearchable!))
          .take(limit);
      } else {
        // Default behavior: return all products regardless of isSearchable
        products = await ctx.db.query("products").take(limit);
      }
    }

    return products.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      status: p.status,
      category: p.category,
      keywords: p.keywords,
      images: p.images,
      originalLanguage: p.originalLanguage,
      supplierId: p.supplierId,
    }));
  },
});

/**
 * Internal: Get product candidates for multiple products in one batch
 * Eliminates N+1 query by fetching all candidates at once
 */
export const _getBatchProductCandidates = internalQuery({
  args: {
    productIds: v.array(v.id("products")),
    limit: v.optional(v.number()),
    minScore: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Record<string, any[]>> => {
    const limit = Math.min(args.limit ?? 5, 20);
    const minScore = args.minScore ?? 0.3;
    
    // Get all candidates for all products
    const allCandidates: Record<string, any[]> = {};
    
    for (const productId of args.productIds) {
      const candidates = await ctx.db
        .query("productSupplierCandidates")
        .withIndex("productId_approved", (q) =>
          q.eq("productId", productId).eq("isApproved", true)
        )
        .filter((q) => q.gte(q.field("matchScore"), minScore))
        .order("desc")
        .take(limit);
      
      allCandidates[productId] = candidates;
    }
    
    return allCandidates;
  },
});

// ==========================================
// PUBLIC QUERIES
// ==========================================

/**
 * Query: Get potential suppliers for a product
 * Returns top N approved candidates with supplier details
 * Optimized to prevent N+1 queries
 */
export const getProductSuppliers = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
    minConfidence: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
  },
  handler: async (ctx, args): Promise<{ suppliers: SupplierSnapshot[] }> => {
    const limit = Math.min(args.limit ?? 5, 20);

    // Get approved candidates sorted by score
    const candidates = await ctx.db
      .query("productSupplierCandidates")
      .withIndex("productId_approved", (q) =>
        q.eq("productId", args.productId).eq("isApproved", true)
      )
      .order("desc")
      .take(limit);

    if (candidates.length === 0) {
      return { suppliers: [] };
    }

    // Fetch all suppliers in one batch (prevents N+1)
    const supplierIds = candidates.map((c) => c.supplierId);
    const suppliers = await Promise.all(
      supplierIds.map((id) => ctx.db.get(id))
    );

    // Merge candidate data with supplier data
    const result = candidates
      .map((candidate, index) => {
        const supplier = suppliers[index];
        if (!supplier) return null;

        return {
          id: supplier._id,
          name: supplier.business_name,
          rating: supplier.rating,
          reviews_count: supplier.reviews_count,
          verified: supplier.verified,
          approved: supplier.approved,
          location: supplier.location,
          city: supplier.city,
          state: supplier.state,
          country: supplier.country,
          category: supplier.category,
          matchScore: candidate.matchScore,
          matchConfidence: candidate.matchConfidence,
        } as SupplierSnapshot;
      })
      .filter((s): s is SupplierSnapshot => s !== null);

    return { suppliers: result };
  },
});

// ==========================================
// SEARCH ACTION
// ==========================================

/**
 * Action: Product-first search
 * 
 * PERFORMANCE NOTES:
 * - Uses indexed queries throughout (category, status, isSearchable)
 * - Fetches candidates using productId_approved index
 * - Batches supplier lookups to prevent N+1
 * - Limits all queries to prevent "too many bytes read" errors
 */
export const searchProductsMultilingual = action({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    minPrice: v.optional(v.float64()),
    maxPrice: v.optional(v.float64()),
    verifiedSupplier: v.optional(v.boolean()),
    limit: v.optional(v.int64()),
    offset: v.optional(v.int64()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || "relevance";

    const hasQuery = !!(args.q && args.q.trim());
    const queryLower = hasQuery ? args.q!.toLowerCase().trim() : "";
    const queryWords = hasQuery
      ? queryLower.split(/\s+/).filter((w: string) => w.length > 1)
      : [];

    // Step 1: Get base products using indexed query
    // IMPORTANT: Do NOT filter by isSearchable by default
    // Only apply filters when explicitly provided by the user
    const rawProducts: Array<{
      _id: Id<"products">;
      name: string;
      description?: string;
      shortDescription?: string;
      price?: number;
      status: string;
      category?: string;
      keywords?: string[];
      images?: string[];
      originalLanguage?: string;
      supplierId?: Id<"suppliers">;
    }> = await ctx.runQuery(
      internal.productSearch._getProductsForSearch,
      {
        category: args.category,
        status: "active",
        limit: 1000,
        // isSearchable is intentionally omitted to show ALL products by default
      }
    );

    // Step 2: Text search scoring
    interface ScoredProduct {
      _id: Id<"products">;
      name: string;
      description?: string;
      shortDescription?: string;
      price?: number;
      status: string;
      category?: string;
      keywords?: string[];
      images?: string[];
      _score: number;
      _matchType: "exact" | "name" | "description" | "keywords" | "none";
    }

    let scored: ScoredProduct[] = rawProducts.map((p) => ({
      ...p,
      _score: 0,
      _matchType: "none" as const,
    }));

    if (hasQuery) {
      // Expand query using dictionary for better matching
      const expandedTerms = expandQueryWithDictionary(queryLower);
      
      scored = scored
        .map((p) => {
          let score = 0;
          let matchType: ScoredProduct["_matchType"] = "none";

          const name = (p.name || "").toLowerCase();
          const desc = (p.description || "").toLowerCase();
          const keywords = (p.keywords || []).map((k: string) => k.toLowerCase());
          const category = (p.category || "").toLowerCase();

          // Calculate semantic scores using dictionary
          const nameSemanticScore = calculateSemanticScore(queryLower, name);
          const descSemanticScore = calculateSemanticScore(queryLower, desc);
          
          // Exact match in name gets highest score
          if (name === queryLower) {
            score += 100;
            matchType = "exact";
          } else if (name.includes(queryLower)) {
            score += 50;
            matchType = "name";
          }

          // Dictionary-enhanced word matching
          for (const term of expandedTerms) {
            // Name matches with expanded terms
            if (name.includes(term)) {
              score += 15;
              if (matchType === "none") matchType = "name";
            }
            
            // Description matches with expanded terms (dictionary synonyms)
            if (desc.includes(term)) {
              score += 8;
              if (matchType === "none") matchType = "description";
            }
            
            // Keywords matches with expanded terms
            for (const kw of keywords) {
              if (kw.includes(term) || term.includes(kw)) {
                score += 12;
                if (matchType === "none") matchType = "keywords";
              }
            }
          }

          // Original word matches (fallback)
          for (const word of queryWords) {
            if (name.includes(word)) {
              score += 10;
              if (matchType === "none") matchType = "name";
            }
            if (desc.includes(word)) {
              score += 3;
            }
          }

          // Keyword direct matches
          for (const kw of keywords) {
            if (kw.includes(queryLower) || queryLower.includes(kw)) {
              score += 20;
              if (matchType === "none") matchType = "keywords";
            }
          }

          // Description direct match
          if (desc.includes(queryLower)) {
            score += 10;
            if (matchType === "none") matchType = "description";
          }

          // Category match
          if (category === queryLower || category.includes(queryLower)) {
            score += 20;
          }
          
          // Category match with expanded terms
          for (const term of expandedTerms) {
            if (category.includes(term)) {
              score += 10;
            }
          }

          return { ...p, _score: score, _matchType: matchType };
        })
        .filter((p): p is ScoredProduct => p._score > 0); // Remove non-matching products when searching
    } else {
      // No query - give all products a base score
      scored = scored.map((p) => ({ ...p, _score: 1, _matchType: "none" }));
    }

    // Step 3: Price filtering
    if (args.minPrice !== undefined) {
      scored = scored.filter((p) => p.price !== undefined && p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      scored = scored.filter((p) => p.price !== undefined && p.price <= args.maxPrice!);
    }

    // Step 4: Get suppliers for each product
    // OPTIMIZED: Use batch query instead of N+1 loop
    const allCandidates: Record<string, any[]> = {};
    
    if (scored.length > 0) {
      const productIds = scored.map(p => p._id);
      const batchResult = await ctx.runQuery(
        internal.productSearch._getBatchProductCandidates,
        { productIds, limit: 5, minScore: 0.3 }
      );
      Object.assign(allCandidates, batchResult);
    }

    // Collect all supplier IDs for batch lookup
    const allSupplierIds = new Set<Id<"suppliers">>();
    for (const candidates of Object.values(allCandidates)) {
      for (const c of candidates) {
        allSupplierIds.add(c.supplierId);
      }
    }

    // Batch fetch all suppliers
    const suppliersMap: Record<string, any> = {};
    if (allSupplierIds.size > 0) {
      const suppliers = await ctx.runQuery(
        internal.productSearch._getSuppliersByIds,
        { supplierIds: Array.from(allSupplierIds) }
      );
      for (const s of suppliers) {
        suppliersMap[s._id] = s;
      }
    }

    // Merge supplier data with candidates
    interface ProductWithSuppliers extends ScoredProduct {
      suppliers: Array<{
        id: Id<"suppliers">;
        name: string;
        rating?: number;
        reviews_count?: number;
        verified: boolean;
        approved: boolean;
        location?: string;
        city?: string;
        state?: string;
        country?: string;
        category: string;
        matchScore: number;
        matchConfidence: "high" | "medium" | "low";
      }>;
      totalSuppliers: number;
    }

    const productsWithSuppliers: ProductWithSuppliers[] = scored.map((p) => {
      const candidates = allCandidates[p._id] || [];

      const suppliers = candidates
        .map((c: any) => {
          const s = suppliersMap[c.supplierId];
          if (!s) return null;

          // Filter by verified if requested
          if (args.verifiedSupplier && !s.verified) return null;

          return {
            id: s._id as Id<"suppliers">,
            name: s.business_name,
            rating: s.rating,
            reviews_count: s.reviews_count,
            verified: s.verified,
            approved: s.approved,
            location: s.location,
            city: s.city,
            state: s.state,
            country: s.country,
            category: s.category,
            matchScore: c.matchScore,
            matchConfidence: c.matchConfidence,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .slice(0, 5); // Top 5 suppliers per product

      // Boost score for products with high-quality suppliers
      const supplierBoost = suppliers.reduce((boost, s) => {
        if (s.matchConfidence === "high") return boost + 10;
        if (s.matchConfidence === "medium") return boost + 5;
        return boost + 2;
      }, 0);

      return {
        ...p,
        _score: p._score + supplierBoost,
        suppliers,
        totalSuppliers: candidates.length,
      };
    });

    // Step 5: Sorting
    productsWithSuppliers.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return (a.price || 0) - (b.price || 0);
        case "price_desc":
          return (b.price || 0) - (a.price || 0);
        case "newest":
          return (b as any).created_at?.localeCompare((a as any).created_at || "") || 0;
        case "match_score":
          return (b.suppliers[0]?.matchScore || 0) - (a.suppliers[0]?.matchScore || 0);
        case "relevance":
        default:
          return b._score - a._score;
      }
    });

    // Step 6: Pagination
    const total: number = productsWithSuppliers.length;
    const page = productsWithSuppliers.slice(offset, offset + limit);

    // Final result shaping
    const results: ProductSearchResult[] = page.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      status: p.status,
      category: p.category,
      images: p.images,
      relevanceScore: p._score,
      suppliers: p.suppliers,
      totalSuppliers: p.totalSuppliers,
    }));

    return { products: results, total };
  },
});

// ==========================================
// SUGGESTION ENDPOINTS
// ==========================================

/**
 * Query: Get product suggestions for autocomplete
 */
export const getProductSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ suggestions: Array<{ id: string; name: string; category?: string }> }> => {
    const limit = Math.min(args.limit ?? 10, 20);
    const queryLower = args.query.toLowerCase().trim();

    if (queryLower.length < 2) {
      return { suggestions: [] };
    }

    // Fetch products with isSearchable filter for better control
    const products = await ctx.db
      .query("products")
      .withIndex("isSearchable", (q) => q.eq("isSearchable", true))
      .filter((q) =>
        q.or(
          q.gt(q.field("name"), ""),
          q.gt(q.field("keywords"), [])
        )
      )
      .take(limit * 2); // Fetch more for filtering

    const suggestions = products
      .filter((p: any) => {
        const name = (p.name || "").toLowerCase();
        const keywords = (p.keywords || []).map((k: string) => k.toLowerCase());
        return (
          name.includes(queryLower) ||
          keywords.some((k: string) => k.includes(queryLower))
        );
      })
      .slice(0, limit)
      .map((p: any) => ({
        id: p._id,
        name: p.name,
        category: p.category,
      }));

    return { suggestions };
  },
});
