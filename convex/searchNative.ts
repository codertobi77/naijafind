import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ==========================================
// NATIVE SEARCH SYSTEM - NO TYPESENSE
// ==========================================

/**
 * Extract keywords from search query for better matching
 */
function extractSearchKeywords(query: string): string[] {
  if (!query) return [];
  const STOP_WORDS = new Set([
    "a","an","the","and","or","of","for","to","in","on","at","by","with",
    "avec","pour","de","des","du","la","le","les","un","une","et","ou","au","aux"
  ]);
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
  const tokens = normalized.split(/[\s,;:\-|\/\(\)\[\]\{\}_\*\.]+/);
  const keywords = tokens.filter(
    (t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t)
  );
  return [...new Set(keywords)];
}

/**
 * Calculate relevance score for text matching
 */
function calculateTextScore(
  query: string,
  keywords: string[],
  fields: { name?: string; description?: string; keywords?: string[]; category?: string }
): number {
  let score = 0;
  const fullQuery = query.toLowerCase().trim();
  const name = (fields.name || "").toLowerCase();
  const desc = (fields.description || "").toLowerCase();
  const fieldKeywords = (fields.keywords || []).map(k => k.toLowerCase());
  const category = (fields.category || "").toLowerCase();

  // Exact match in name = highest score
  if (name.includes(fullQuery)) {
    score += 50;
  }
  // Starts with query
  else if (name.startsWith(fullQuery.slice(0, 3))) {
    score += 30;
  }

  // Keyword matches
  for (const kw of keywords) {
    if (kw.length < 2) continue;
    if (name.includes(kw)) score += 15;
    if (desc.includes(kw)) score += 8;
    if (fieldKeywords.some(k => k.includes(kw))) score += 12;
    if (category.includes(kw)) score += 10;
  }

  return score;
}

// ==========================================
// PRODUCT SEARCH
// ==========================================

/**
 * Internal: Get products for search with pagination
 */
export const _getProductsBatch = internalQuery({
  args: {
    category: v.optional(v.string()),
    cursor: v.optional(v.string()),
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(args.batchSize, 500);
    
    let query = ctx.db.query("products");
    
    if (args.category && args.category.trim()) {
      query = query.withIndex("category", q => q.eq("category", args.category!));
    }
    
    const products = await query.take(batchSize);
    
    return products.map(p => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      stock: p.stock,
      status: p.status,
      category: p.category,
      keywords: p.keywords,
      images: p.images,
      supplierId: p.supplierId,
      isSearchable: p.isSearchable,
      created_at: p.created_at,
    }));
  },
});

/**
 * Search products with filters, scoring, and supplier matching
 */
export const searchProductsNative = action({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()), // city or state filter
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    inStock: v.optional(v.boolean()),
    verifiedSupplier: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("relevance"),
      v.literal("price_asc"),
      v.literal("price_desc"),
      v.literal("newest"),
      v.literal("rating")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy || "relevance";
    const searchQuery = args.q?.trim() || "";
    const keywords = extractSearchKeywords(searchQuery);
    const hasQuery = searchQuery.length > 0;

    // Fetch products in batches
    const BATCH_SIZE = 1000;
    const rawProducts = await ctx.runQuery(
      internal.searchNative._getProductsBatch,
      { category: args.category, batchSize: BATCH_SIZE }
    );

    type ScoredProduct = {
      _id: string;
      name: string;
      description?: string;
      shortDescription?: string;
      price: number;
      stock: number;
      status: string;
      category?: string;
      keywords?: string[];
      images?: string[];
      supplierId: string;
      isSearchable?: boolean;
      created_at: string;
      _score: number;
      _supplier?: any;
    };

    let scored: ScoredProduct[] = rawProducts.map(p => ({ ...p, _score: 0, _supplier: null }));

    // Apply text search and calculate scores
    if (hasQuery) {
      scored = scored.filter(p => {
        const score = calculateTextScore(searchQuery, keywords, {
          name: p.name,
          description: p.description,
          keywords: p.keywords,
          category: p.category,
        });
        p._score = score;
        return score > 0;
      });
    } else {
      // No query = give base score for sorting
      scored.forEach(p => p._score = 1);
    }

    // Apply filters
    scored = scored.filter(p => {
      if (args.minPrice !== undefined && p.price < args.minPrice) return false;
      if (args.maxPrice !== undefined && p.price > args.maxPrice) return false;
      if (args.inStock && p.stock <= 0) return false;
      if (p.status !== "active" && p.isSearchable !== true) return false;
      return true;
    });

    // Fetch suppliers for products
    const supplierIds = [...new Set(scored.map(p => p.supplierId))];
    const suppliersMap = new Map<string, any>();
    
    for (const supplierId of supplierIds) {
      try {
        const supplier = await ctx.runQuery(
          internal.suppliers._getSupplierByIdInternal,
          { id: supplierId as any }
        );
        if (supplier) {
          suppliersMap.set(supplierId, supplier);
        }
      } catch {
        // Skip if supplier not found
      }
    }

    // Attach suppliers and apply location filter
    scored = scored
      .map(p => {
        p._supplier = suppliersMap.get(p.supplierId) || null;
        return p;
      })
      .filter(p => {
        if (!args.location) return true;
        const loc = args.location.toLowerCase();
        const s = p._supplier;
        if (!s) return false;
        return (
          s.city?.toLowerCase().includes(loc) ||
          s.state?.toLowerCase().includes(loc) ||
          s.location?.toLowerCase().includes(loc)
        );
      })
      .filter(p => {
        if (!args.verifiedSupplier) return true;
        return p._supplier?.verified && p._supplier?.approved;
      });

    // Apply sorting
    scored.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "newest":
          return (b.created_at || "").localeCompare(a.created_at || "");
        case "rating":
          return (b._supplier?.rating || 0) - (a._supplier?.rating || 0);
        case "relevance":
        default:
          const scoreDiff = b._score - a._score;
          if (scoreDiff !== 0) return scoreDiff;
          return (b._supplier?.rating || 0) - (a._supplier?.rating || 0);
      }
    });

    const total = scored.length;
    const page = scored.slice(offset, offset + limit).map(p => {
      const { _score, _supplier, ...productData } = p;
      return {
        ...productData,
        supplier: _supplier ? {
          id: _supplier._id,
          name: _supplier.business_name,
          rating: _supplier.rating,
          reviews_count: _supplier.reviews_count,
          verified: _supplier.verified,
          approved: _supplier.approved,
          city: _supplier.city,
          state: _supplier.state,
          location: _supplier.location,
          logo: _supplier.logo_url,
        } : null,
        relevanceScore: _score,
      };
    });

    return {
      products: page,
      total,
      hasMore: total > offset + limit,
      query: searchQuery,
    };
  },
});

// ==========================================
// SUPPLIER SEARCH
// ==========================================

/**
 * Internal: Get suppliers batch for search
 */
export const _getSuppliersBatch = internalQuery({
  args: {
    category: v.optional(v.string()),
    cursor: v.optional(v.string()),
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.min(args.batchSize, 500);
    
    let query = ctx.db.query("suppliers").withIndex("approved", q => q.eq("approved", true));
    
    if (args.category && args.category.trim()) {
      query = ctx.db.query("suppliers").withIndex("approved_category", q => 
        q.eq("approved", true).eq("category", args.category!)
      );
    }
    
    const suppliers = await query.take(batchSize);
    
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      description: s.description,
      category: s.category,
      email: s.email,
      phone: s.phone,
      address: s.address,
      city: s.city,
      state: s.state,
      location: s.location,
      website: s.website,
      rating: s.rating,
      reviews_count: s.reviews_count,
      verified: s.verified,
      approved: s.approved,
      featured: s.featured,
      logo_url: s.logo_url,
      image: s.image,
      latitude: s.latitude,
      longitude: s.longitude,
      created_at: s.created_at,
    }));
  },
});

/**
 * Search suppliers with filters and scoring
 */
export const searchSuppliersNative = action({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    businessType: v.optional(v.string()), // 'products' | 'services'
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("relevance"),
      v.literal("rating"),
      v.literal("reviews"),
      v.literal("newest"),
      v.literal("name_asc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy || "relevance";
    const searchQuery = args.q?.trim() || "";
    const keywords = extractSearchKeywords(searchQuery);
    const hasQuery = searchQuery.length > 0;

    // Fetch suppliers
    const BATCH_SIZE = 1000;
    const rawSuppliers = await ctx.runQuery(
      internal.searchNative._getSuppliersBatch,
      { category: args.category, batchSize: BATCH_SIZE }
    );

    type ScoredSupplier = {
      _id: string;
      business_name: string;
      description?: string;
      category: string;
      email: string;
      phone?: string;
      address?: string;
      city: string;
      state: string;
      location?: string;
      website?: string;
      rating?: number;
      reviews_count?: number;
      verified: boolean;
      approved: boolean;
      featured: boolean;
      logo_url?: string;
      image?: string;
      latitude?: number;
      longitude?: number;
      created_at: string;
      _score: number;
    };

    let scored: ScoredSupplier[] = rawSuppliers.map(s => ({ ...s, _score: 0 }));

    // Calculate relevance scores
    if (hasQuery) {
      scored = scored.filter(s => {
        let score = 0;
        const fullQuery = searchQuery.toLowerCase();
        const name = (s.business_name || "").toLowerCase();
        const desc = (s.description || "").toLowerCase();
        const category = (s.category || "").toLowerCase();
        const city = (s.city || "").toLowerCase();
        const state = (s.state || "").toLowerCase();

        // Exact name match
        if (name.includes(fullQuery)) score += 50;
        else if (name.startsWith(fullQuery.slice(0, 3))) score += 30;

        // Keyword matches
        for (const kw of keywords) {
          if (kw.length < 2) continue;
          if (name.includes(kw)) score += 15;
          if (desc.includes(kw)) score += 8;
          if (category.includes(kw)) score += 12;
          if (city.includes(kw)) score += 10;
          if (state.includes(kw)) score += 5;
        }

        s._score = score;
        return score > 0;
      });
    } else {
      scored.forEach(s => {
        s._score = 1;
        // Boost for verified/featured
        if (s.verified) s._score += 5;
        if (s.featured) s._score += 10;
      });
    }

    // Apply filters
    scored = scored.filter(s => {
      if (args.verified && !s.verified) return false;
      if (args.featured && !s.featured) return false;
      if (args.minRating && (s.rating || 0) < args.minRating) return false;
      if (args.location) {
        const loc = args.location.toLowerCase();
        const matches =
          s.city?.toLowerCase().includes(loc) ||
          s.state?.toLowerCase().includes(loc) ||
          s.location?.toLowerCase().includes(loc);
        if (!matches) return false;
      }
      return true;
    });

    // Sorting
    scored.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "reviews":
          return (b.reviews_count || 0) - (a.reviews_count || 0);
        case "newest":
          return (b.created_at || "").localeCompare(a.created_at || "");
        case "name_asc":
          return (a.business_name || "").localeCompare(b.business_name || "");
        case "relevance":
        default:
          const scoreDiff = b._score - a._score;
          if (scoreDiff !== 0) return scoreDiff;
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    const total = scored.length;
    const page = scored.slice(offset, offset + limit).map(s => {
      const { _score, ...supplierData } = s;
      return {
        ...supplierData,
        relevanceScore: _score,
      };
    });

    return {
      suppliers: page,
      total,
      hasMore: total > offset + limit,
      query: searchQuery,
    };
  },
});

// ==========================================
// COMBINED SEARCH (Products + Suppliers)
// ==========================================

/**
 * Search both products and suppliers in one call
 */
export const combinedSearch = action({
  args: {
    q: v.string(),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 20);
    const searchQuery = args.q.trim();
    
    if (!searchQuery) {
      return { products: [], suppliers: [], total: 0 };
    }

    // Run both searches in parallel
    const [productResults, supplierResults] = await Promise.all([
      ctx.runAction(internal.searchNative.searchProductsNative, {
        q: searchQuery,
        category: args.category,
        location: args.location,
        limit,
        offset: 0,
        sortBy: "relevance",
      }),
      ctx.runAction(internal.searchNative.searchSuppliersNative, {
        q: searchQuery,
        category: args.category,
        location: args.location,
        limit,
        offset: 0,
        sortBy: "relevance",
      }),
    ]);

    return {
      products: productResults.products,
      suppliers: supplierResults.suppliers,
      productTotal: productResults.total,
      supplierTotal: supplierResults.total,
      total: productResults.total + supplierResults.total,
    };
  },
});

// ==========================================
// SUGGESTIONS / AUTOCOMPLETE
// ==========================================

/**
 * Get search suggestions based on query prefix
 */
export const getSearchSuggestions = action({
  args: {
    q: v.string(),
    type: v.optional(v.union(v.literal("products"), v.literal("suppliers"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = args.q.trim().toLowerCase();
    const type = args.type || "all";
    const limit = Math.min(args.limit ?? 8, 20);
    
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    const suggestions: { text: string; type: "product" | "supplier" | "category"; icon?: string }[] = [];

    // Search products for name matches
    if (type === "all" || type === "products") {
      const products = await ctx.runQuery(
        internal.searchNative._getProductsBatch,
        { batchSize: 200 }
      );
      
      const productMatches = products
        .filter(p => p.name?.toLowerCase().includes(query))
        .slice(0, limit)
        .map(p => ({
          text: p.name,
          type: "product" as const,
          icon: "ri-shopping-bag-line",
        }));
      
      suggestions.push(...productMatches);
    }

    // Search suppliers
    if (type === "all" || type === "suppliers") {
      const suppliers = await ctx.runQuery(
        internal.searchNative._getSuppliersBatch,
        { batchSize: 200 }
      );
      
      const supplierMatches = suppliers
        .filter(s => s.business_name?.toLowerCase().includes(query))
        .slice(0, limit)
        .map(s => ({
          text: s.business_name,
          type: "supplier" as const,
          icon: "ri-store-2-line",
        }));
      
      suggestions.push(...supplierMatches);
    }

    // Get matching categories
    const categories = await ctx.db.query("categories").collect();
    const categoryMatches = categories
      .filter(c => c.name?.toLowerCase().includes(query) || c.is_active !== false)
      .slice(0, 3)
      .map(c => ({
        text: c.name,
        type: "category" as const,
        icon: c.icon || "ri-folder-line",
      }));
    
    suggestions.push(...categoryMatches);

    // Remove duplicates and limit
    const unique = suggestions.filter((item, index, arr) => 
      arr.findIndex(t => t.text.toLowerCase() === item.text.toLowerCase()) === index
    );

    return { suggestions: unique.slice(0, limit) };
  },
});
