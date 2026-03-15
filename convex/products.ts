import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const supplierId = supplier._id as unknown as string;
    const products = await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", supplierId))
      .collect();

    return products;
  }
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    price: v.float64(),
    stock: v.int64(),
    status: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const now = new Date().toISOString();
    const id = await ctx.db.insert("products", {
      supplierId: supplier._id as unknown as string,
      name: args.name,
      price: args.price,
      stock: args.stock,
      status: args.status,
      category: args.category,
      description: args.description,
      images: args.images,
      isSearchable: true, // Automatically make active products searchable
      created_at: now,
      updated_at: now,
    });
    
    return { success: true, id };
  }
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.float64()),
    stock: v.optional(v.int64()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const prod = await ctx.db.get(args.id);
    if (!prod) throw new Error("Produit introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || prod.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.patch(args.id, {
      name: args.name ?? prod.name,
      price: args.price ?? prod.price,
      stock: args.stock ?? prod.stock,
      status: args.status ?? prod.status,
      category: args.category !== undefined ? args.category : prod.category,
      description: args.description !== undefined ? args.description : prod.description,
      images: args.images !== undefined ? args.images : prod.images,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  }
});

// Query admin : lister tous les produits
export const listAllProductsAdmin = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier si admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();
    if (!user || (!user.is_admin && user.user_type !== 'admin')) {
      throw new Error("Non autorisé - Admin uniquement");
    }
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const products = await ctx.db.query("products").take(limit);
    return products;
  },
});

// Query admin : get filtered products using indexes
export const getFilteredProducts = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    supplierId: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    minPrice: v.optional(v.float64()),
    maxPrice: v.optional(v.float64()),
    sortBy: v.optional(v.string()), // 'name', 'price', 'created_at', 'stock'
    sortOrder: v.optional(v.string()), // 'asc', 'desc'
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier si admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();
    if (!user || (!user.is_admin && user.user_type !== 'admin')) {
      throw new Error("Non autorisé - Admin uniquement");
    }

    const limit = Math.min(args.limit ?? 2000, 2000);
    const sortBy = args.sortBy || 'created_at';
    const sortOrder = args.sortOrder || 'desc';
    let products: any[] = [];

    // Use index-based filtering when possible
    if (args.status) {
      // Use status index
      products = await ctx.db
        .query("products")
        .withIndex("status", (q) => q.eq("status", args.status as string ?? ""))
        .take(limit);
    } else if (args.category) {
      // Use category index
      const category = args.category as string;
      products = await ctx.db
        .query("products")
        .withIndex("category", (q) => q.eq("category", category))
        .take(limit);
    } else if (args.supplierId) {
      // Use supplierId index
      products = await ctx.db
        .query("products")
        .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId!))
        .take(limit);
    } else {
      // No index filter, fetch all
      products = await ctx.db
        .query("products")
        .take(limit);
    }

    // Apply additional filters in memory
    if (args.category && !args.status) {
      products = products.filter(p => p.category === args.category);
    }
    if (args.supplierId && !args.status && !args.category) {
      products = products.filter(p => p.supplierId === args.supplierId);
    }
    if (args.status && args.category) {
      products = products.filter(p => p.category === args.category);
    }

    // Apply price range filter
    if (args.minPrice !== undefined) {
      products = products.filter(p => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      products = products.filter(p => p.price <= args.maxPrice!);
    }

    // Apply search filter
    if (args.searchQuery && args.searchQuery.trim()) {
      const q = args.searchQuery.toLowerCase().trim();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    products.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'stock':
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        case 'created_at':
        default:
          comparison = (a.created_at || '').localeCompare(b.created_at || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return products;
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const prod = await ctx.db.get(id);
    if (!prod) throw new Error("Produit introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || prod.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.delete(id);
    
    return { success: true };
  }
});

export const listProductsBySupplier = query({
  args: { supplierId: v.string() },
  handler: async (ctx, args) => {
    // Get supplier by ID to verify existence
    const supplier = await ctx.db.get(args.supplierId as Id<"suppliers">);
    if (!supplier) throw new Error("Supplier not found");
    
    // Get products for this supplier
    const products = await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    return products;
  }
});

/**
 * Internal query: base products loader for search
 * Uses indexes and returns only fields needed by searchProducts action.
 */
export const _getProductsForSearchBase = internalQuery({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 1000, 1000);
    const q = ctx.db.query("products");

    const products = args.category && args.category.trim()
      ? await ctx.db
          .query("products")
          .withIndex("category", (q2) => q2.eq("category", args.category!))
          .take(limit)
      : await q.take(limit);

    return products.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      status: p.status,
      category: p.category,
      images: p.images,
      supplierId: (p as any).supplierId,
      created_at: (p as any).created_at,
    }));
  },
});

/**
 * Internal query: get product by ID for sourcing system
 */
export const _getProductByIdInternal = internalQuery({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    
    return {
      _id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      keywords: product.keywords,
      status: product.status,
      isSearchable: product.isSearchable,
      images: product.images,
      supplierId: product.supplierId,
    };
  },
});
// Categories that are service-based and should be excluded from product search
const SERVICE_CATEGORIES = new Set([
  'hôtellerie',
  'hotellerie',
  'hotel',
  'hôtel',
  'hospitality',
  'tourism',
  'tourisme',
  'restaurant',
  'catering',
  'traiteur',
  'event',
  'événementiel',
  'evenementiel',
  'wedding',
  'mariage',
  'beauty salon',
  'salon de beauté',
  'hair salon',
  'coiffure',
  'spa',
  'wellness',
  'bien-être',
  'bien etre',
  'cleaning service',
  'nettoyage',
  'security',
  'sécurité',
  'consulting',
  'conseil',
  'audit',
  'legal',
  'avocat',
  'lawyer',
  'accounting',
  'comptabilité',
  'training',
  'formation',
  'education',
  'education',
  'transport service',
  'logistics service',
  'insurance',
  'assurance',
  'banking',
  'banque',
  'finance service',
  'real estate service',
  'immobilier service',
]);

/**
 * Check if a category is a service category (should be excluded from product search)
 */
function isServiceCategory(category: string | undefined): boolean {
  if (!category) return false;
  const catLower = category.toLowerCase().trim();
  return SERVICE_CATEGORIES.has(catLower) || 
         Array.from(SERVICE_CATEGORIES).some(sc => catLower.includes(sc));
}

/**
 * Calculate supplier relevance score based on product category and search query
 * Uses category matching, name/description similarity, and keyword extraction
 */
function calculateSupplierRelevanceScore(
  supplier: any,
  productCategory: string | undefined,
  searchKeywords: string[],
  productName: string,
  productDescription?: string
): { score: number; matchDetails: string[] } {
  let score = 0;
  const matchDetails: string[] = [];
  
  const supplierCategory = (supplier.category || '').toLowerCase();
  const supplierName = (supplier.business_name || '').toLowerCase();
  const supplierDesc = (supplier.description || '').toLowerCase();
  const prodCat = (productCategory || '').toLowerCase();
  const prodName = productName.toLowerCase();
  const prodDesc = (productDescription || '').toLowerCase();
  
  // 1. CATEGORY MATCH (Highest priority - 40 points)
  if (prodCat && supplierCategory) {
    if (supplierCategory === prodCat) {
      score += 40;
      matchDetails.push('exact_category_match');
    } else if (supplierCategory.includes(prodCat) || prodCat.includes(supplierCategory)) {
      score += 30;
      matchDetails.push('partial_category_match');
    }
  }
  
  // 2. PRODUCT NAME MATCH IN SUPPLIER NAME/DESCRIPTION (20-25 points)
  // Extract key terms from product name (excluding common words)
  const productKeyTerms = prodName
    .split(/[\s,;:\-|\/\(\)\[\]\{\}_\*\.]+/)
    .filter(term => term.length > 2 && !['the', 'and', 'for', 'with', 'de', 'et', 'pour', 'avec'].includes(term));
  
  for (const term of productKeyTerms) {
    if (supplierName.includes(term)) {
      score += 25;
      matchDetails.push(`supplier_name_match:${term}`);
    }
    if (supplierDesc.includes(term)) {
      score += 15;
      matchDetails.push(`supplier_desc_match:${term}`);
    }
  }
  
  // 3. SEARCH KEYWORD MATCHES (10-15 points each)
  for (const keyword of searchKeywords) {
    if (keyword.length < 2) continue;
    const kw = keyword.toLowerCase();
    
    if (supplierName.includes(kw)) {
      score += 15;
      matchDetails.push(`keyword_name:${kw}`);
    }
    if (supplierDesc.includes(kw)) {
      score += 10;
      matchDetails.push(`keyword_desc:${kw}`);
    }
    if (supplierCategory.includes(kw)) {
      score += 12;
      matchDetails.push(`keyword_category:${kw}`);
    }
  }
  
  // 4. VERIFIED/APPROVED BOOST (10 points)
  if (supplier.verified && supplier.approved) {
    score += 10;
    matchDetails.push('verified_approved');
  }
  
  // 5. RATING BOOST (up to 10 points based on rating)
  if (supplier.rating && supplier.rating > 0) {
    score += Math.min(supplier.rating * 2, 10);
    matchDetails.push(`rating:${supplier.rating}`);
  }
  
  return { score, matchDetails };
}

function extractSearchKeywords(query: string): string[] {
  if (!query) return [];
  const STOP_WORDS = new Set([
    "a","an","the","and","or","of","for","to","in","on","avec","pour","de","des","du","la","le","les","un","une"
  ]);
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
  const tokens = normalized.split(/[\s,;:\-|\/\(\)\[\]\{\}_\*\.]+/);
  const keywords = tokens.filter(
    (t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t)
  );
  return [...new Set(keywords)];
}

/**
 * Public action: Alibaba-style product search with category-centric matching.
 * - Text search on product name/description
 * - Optional strict category filter
 * - Optional price range
 * - Optional filter on verified+approved suppliers
 */
export const searchProducts = action({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    minPrice: v.optional(v.float64()),
    maxPrice: v.optional(v.float64()),
    verifiedSupplier: v.optional(v.boolean()),
    limit: v.optional(v.int64()),
    offset: v.optional(v.int64()),
    sortBy: v.optional(v.string()), // 'relevance' | 'price_asc' | 'price_desc' | 'newest'
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || "relevance";

    const hasQuery = !!(args.q && args.q.trim());
    const keywords = hasQuery ? extractSearchKeywords(args.q!) : [];

    // Hard cap to keep memory bounded (applied inside internal query)
    const RAW_LIMIT = 1000;
    const rawProducts = await ctx.runQuery(
      internal.products._getProductsForSearchBase,
      {
        category: args.category,
        limit: RAW_LIMIT,
      }
    );

    type ScoredProduct = any & {
      _score: number;
      _suppliers?: any[] | null;
    };

    let scored: ScoredProduct[] = rawProducts.map((p: any) => ({
      ...p,
      _score: 0,
      _suppliers: null,
    }));

    // FILTER OUT SERVICE CATEGORIES (hotels, restaurants, etc.)
    scored = scored.filter((p) => {
      if (isServiceCategory(p.category)) {
        return false;
      }
      return true;
    });

    // Text & price filters + relevance score
    scored = scored.filter((p) => {
      let score = 0;

      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();

      if (hasQuery) {
        const fullQuery = args.q!.toLowerCase().trim();
        if (name.includes(fullQuery)) {
          score += 40;
        }
        for (const kw of keywords) {
          if (kw.length < 2) continue;
          if (name.includes(kw)) score += 15;
          if (desc.includes(kw)) score += 8;
        }
        // Drop products that don't match at all when a query is provided
        if (score === 0) return false;
      }

      if (args.minPrice !== undefined && p.price < (args.minPrice as number)) {
        return false;
      }
      if (args.maxPrice !== undefined && p.price > (args.maxPrice as number)) {
        return false;
      }

      (p as ScoredProduct)._score = score;
      return true;
    }) as ScoredProduct[];

    // Suppliers per CATEGORY (many products not linked directly)
    // Using improved scoring based on category + name/description matching
    const categoryToSuppliers = new Map<string, any[]>();
    const categoriesForMapping = Array.from(
      new Set(
        scored
          .map((p) => (p.category || "").toString())
          .filter((c) => c && c.trim().length > 0)
      )
    );

    for (const cat of categoriesForMapping) {
      try {
        const candidates = await ctx.runQuery(
          internal.suppliers._getSuppliersByCategory,
          { category: cat, limit: 50 }
        );
        if (candidates.length > 0) {
          // Filter out service category suppliers
          const productSuppliers = candidates.filter((s: any) => !isServiceCategory(s.category));
          
          if (productSuppliers.length > 0) {
            // Score and sort suppliers using the new relevance scoring
            const scoredSuppliers = productSuppliers.map((s: any) => {
              // Get the product that triggered this category search
              const matchingProduct = scored.find(p => p.category === cat);
              const { score, matchDetails } = calculateSupplierRelevanceScore(
                s,
                cat,
                keywords,
                matchingProduct?.name || '',
                matchingProduct?.description
              );
              return {
                ...s,
                _supplierScore: score,
                _matchDetails: matchDetails,
              };
            });
            
            // Sort by the new relevance score
            const sorted = scoredSuppliers.sort((a: any, b: any) => {
              const scoreDiff = (b._supplierScore || 0) - (a._supplierScore || 0);
              if (scoreDiff !== 0) return scoreDiff;
              
              // Fallback to verified/rating sorting
              const aVerified = a.verified && a.approved ? 1 : 0;
              const bVerified = b.verified && b.approved ? 1 : 0;
              if (bVerified !== aVerified) return bVerified - aVerified;
              
              const aRating = a.rating ?? 0;
              const bRating = b.rating ?? 0;
              if (bRating !== aRating) return bRating - aRating;
              
              return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
            });
            
            categoryToSuppliers.set(cat, sorted);
          }
        }
      } catch {
        // ignore category mapping failures
      }
    }

    // Attach suppliers snapshots (all potential suppliers for the product's category)
    scored = scored
      .map((p) => {
        const list =
          p.category && typeof p.category === "string"
            ? categoryToSuppliers.get(p.category) || []
            : [];
        return { ...p, _suppliers: list } as ScoredProduct;
      })
      .filter((p) => {
        if (args.verifiedSupplier) {
          const list = p._suppliers || [];
          return list.some(
            (s: any) => s.verified === true && s.approved === true
          );
        }
        return true;
      });

    // Sorting
    scored.sort((a, b) => {
      if (sortBy === "price_asc") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === "price_desc") {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === "newest") {
        return (b.created_at || "").localeCompare(a.created_at || "");
      }

      // default: relevance (then rating, then newest)
      const scoreDiff = (b._score || 0) - (a._score || 0);
      if (scoreDiff !== 0) return scoreDiff;

      // Use supplier relevance scores for sorting
      const aSupplierScore = a._suppliers?.[0]?._supplierScore || 0;
      const bSupplierScore = b._suppliers?.[0]?._supplierScore || 0;
      if (bSupplierScore !== aSupplierScore) return bSupplierScore - aSupplierScore;

      const aRating =
        (a._suppliers && a._suppliers[0]?.rating) != null
          ? a._suppliers[0].rating
          : 0;
      const bRating =
        (b._suppliers && b._suppliers[0]?.rating) != null
          ? b._suppliers[0].rating
          : 0;
      if (bRating !== aRating) return bRating - aRating;

      return (b.created_at || "").localeCompare(a.created_at || "");
    });

    const total = scored.length;
    const page = scored.slice(offset, offset + limit).map((p) => {
      const { _score, _suppliers, ...productData } = p;

      const supplierSnapshots =
        (_suppliers || []).map((s: any) => ({
          id: s._id,
          name: s.business_name,
          rating: s.rating,
          reviews_count: s.reviews_count,
          verified: s.verified,
          location: s.location,
          city: s.city,
          state: s.state,
          category: s.category,
          matchScore: s._supplierScore || 0,
          matchConfidence: (s._supplierScore || 0) > 50 ? 'high' : (s._supplierScore || 0) > 25 ? 'medium' : 'low',
        })) ?? [];

      const primarySupplier = supplierSnapshots[0] || null;

      return {
        ...productData,
        supplier: primarySupplier,
        potentialSuppliers: supplierSnapshots,
        relevanceScore: _score,
      };
    });

    return { products: page, total };
  },
});
