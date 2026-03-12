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
 * Helper: extract simple keywords from a search query
 * (lighter version than suppliers.ts, enough for product text search)
 */
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
          const sorted = candidates.slice().sort((a: any, b: any) => {
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
