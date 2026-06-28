import { v } from "convex/values";
import { query, action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Internal query: Get approved suppliers with minimal fields (light version)
 * Only returns fields needed for search suggestions
 */
export const _getApprovedSuppliersLight = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5000;
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .take(limit); // Limit to prevent timeout
    
    // Return only necessary fields to minimize bandwidth
    return suppliers.map(s => ({
      business_name: s.business_name,
      city: s.city,
      state: s.state,
      category: s.category,
    }));
  },
});

/**
 * Internal query: Get products with minimal fields (light version)
 * Only returns fields needed for search suggestions
 */
export const _getProductsLight = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const products = await ctx.db.query("products").take(limit);
    
    // Return only necessary fields to minimize bandwidth
    return products.map(p => ({
      name: p.name,
      category: p.category,
      supplierId: p.supplierId,
    }));
  },
});

/**
 * Internal query: Get active categories with minimal fields (light version)
 */
export const _getActiveCategoriesLight = internalQuery({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .collect();
    
    // Return only necessary fields to minimize bandwidth
    return categories.map(c => ({
      name: c.name,
    }));
  },
});

// Internal query to get approved suppliers (full version for search with query)
export const getApprovedSuppliers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .collect();
  },
});

// Internal query to get all products
export const getAllProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

// Internal query to get active categories
export const getActiveCategories = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .collect();
  },
});

// Internal query to get suppliers by category
export const getSuppliersByCategory = internalQuery({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .filter((q) => q.eq(q.field("category"), args.category))
      .take(10);
  },
});

/**
 * Get all search suggestions from the database - OPTIMIZED ACTION VERSION
 * Uses internal queries to minimize bandwidth
 * Returns unique values for: products, suppliers, categories, and locations
 */
export const getSearchSuggestions = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 100);

    // Use internal queries to fetch data server-side
    const suppliers = await ctx.runQuery(internal.searchSuggestions._getApprovedSuppliersLight, {});
    const products = await ctx.runQuery(internal.searchSuggestions._getProductsLight, { limit: 1000 });
    const categories = await ctx.runQuery(internal.searchSuggestions._getActiveCategoriesLight, {});

    // Extract unique supplier business names
    const supplierNames = suppliers
      .map(s => s.business_name)
      .filter((name): name is string => !!name && name.trim() !== '');

    // Extract unique product names
    const productNames = products
      .map(p => p.name)
      .filter((name): name is string => !!name && name.trim() !== '');

    // Extract unique category names
    const categoryNames = categories
      .map(c => c.name)
      .filter((name): name is string => !!name && name.trim() !== '');

    // Extract unique cities and states for location suggestions
    const cities = suppliers
      .map(s => s.city)
      .filter((city): city is string => !!city && city.trim() !== '');

    const states = suppliers
      .map(s => s.state)
      .filter((state): state is string => !!state && state.trim() !== '');

    // Combine all suggestions and remove duplicates
    const searchTerms = [...new Set([...supplierNames, ...productNames, ...categoryNames])];

    // Combine locations and remove duplicates
    const locations = [...new Set([...cities, ...states])];

    return {
      searchTerms: searchTerms.slice(0, limit),
      locations: locations.slice(0, limit),
      categories: categoryNames,
    };
  },
});

/**
 * Search suggestions with query filter - BILINGUAL VERSION
 * Returns filtered suggestions based on user input with translation support
 * Allows French and English speakers to search without language constraints
 */
export const searchSuggestionsWithQuery = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    userLanguage: v.optional(v.string()), // 'en', 'fr', etc.
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();
    const limit = Number(args.limit ?? 10);
    const userLanguage = args.userLanguage || 'en';

    if (!searchQuery) {
      return { suggestions: [], locations: [], translationsUsed: false };
    }

    // PERFORMANCE OPTIMIZATION: Parallelize translation and data fetching
    const [translationResult, suppliers, products, categories] = await Promise.all([
      searchQuery.length >= 2
        ? ctx.runAction(internal.translation.translateText, {
            text: searchQuery,
            targetLang: userLanguage === 'fr' ? 'en' : 'fr',
            sourceLang: userLanguage,
          }).catch(err => {
            console.log("Translation failed, using original query:", err);
            return { success: false, translatedText: null };
          })
        : Promise.resolve({ success: false, translatedText: null }),
      // Use LIGHT queries to reduce memory and bandwidth
      ctx.runQuery(internal.searchSuggestions._getApprovedSuppliersLight, { limit: 5000 }),
      ctx.runQuery(internal.searchSuggestions._getProductsLight, { limit: 1000 }),
      ctx.runQuery(internal.searchSuggestions._getActiveCategoriesLight, {})
    ]);

    // Build list of queries to search - original + translated
    const queryTranslations: string[] = [searchQuery];
    if (translationResult.success && translationResult.translatedText) {
      const translatedQuery = translationResult.translatedText.toLowerCase().trim();
      if (translatedQuery !== searchQuery) {
        queryTranslations.push(translatedQuery);
      }
    }

    // PERFORMANCE OPTIMIZATION: Pre-calculate category to suppliers mapping to avoid N+1 queries
    const categoryToSuppliers = new Map<string, any[]>();
    suppliers.forEach(s => {
      if (s.category) {
        if (!categoryToSuppliers.has(s.category)) {
          categoryToSuppliers.set(s.category, []);
        }
        // Limit to 10 suppliers per category in the map to match previous behavior
        const list = categoryToSuppliers.get(s.category)!;
        if (list.length < 10) {
          list.push(s);
        }
      }
    });

    // Track product categories for supplier suggestions
    const matchedProductCategories = new Set<string>();

    // Build suggestions with scoring
    interface Suggestion {
      text: string;
      score: number;
      type: 'supplier' | 'product' | 'category';
    }
    
    const suggestions: Suggestion[] = [];
    const seenTexts = new Set<string>();

    // Helper to add unique suggestions
    const addSuggestion = (text: string, score: number, type: 'supplier' | 'product' | 'category') => {
      const textLower = text.toLowerCase();
      if (!seenTexts.has(textLower)) {
        suggestions.push({ text, score, type });
        seenTexts.add(textLower);
        return true;
      }
      return false;
    };

    // Add matching supplier names
    for (const s of suppliers) {
      if (!s.business_name) continue;
      const nameLower = s.business_name.toLowerCase();
      
      for (const query of queryTranslations) {
        if (nameLower.includes(query)) {
          const score = nameLower === query ? 100 : nameLower.startsWith(query) ? 80 : 50;
          addSuggestion(s.business_name, score, 'supplier');
          break;
        }
      }
    }

    // Add matching product names and track their categories
    for (const p of products) {
      if (!p.name) continue;
      const nameLower = p.name.toLowerCase();
      
      for (const query of queryTranslations) {
        if (nameLower.includes(query)) {
          const score = nameLower === query ? 100 : nameLower.startsWith(query) ? 80 : 50;
          addSuggestion(p.name, score, 'product');
          if (p.category) {
            matchedProductCategories.add(p.category);
          }
          break;
        }
      }
    }

    // PERFORMANCE OPTIMIZATION: Use the pre-calculated Map instead of N+1 database queries
    for (const category of matchedProductCategories) {
      const categorySuppliers = categoryToSuppliers.get(category) || [];
      categorySuppliers.forEach((s: any) => {
        if (s.business_name) {
          addSuggestion(s.business_name, 45, 'supplier');
        }
      });
    }

    // Add matching category names
    for (const c of categories) {
      if (!c.name) continue;
      const nameLower = c.name.toLowerCase();
      
      for (const query of queryTranslations) {
        if (nameLower.includes(query)) {
          const score = nameLower === query ? 100 : nameLower.startsWith(query) ? 90 : 60;
          addSuggestion(c.name, score, 'category');
          break;
        }
      }
    }

    // Build location suggestions
    const locations: string[] = [];
    const seenLocations = new Set<string>();

    for (const s of suppliers) {
      for (const query of queryTranslations) {
        if (s.city?.toLowerCase().includes(query)) {
          if (!seenLocations.has(s.city)) {
            locations.push(s.city);
            seenLocations.add(s.city);
          }
          break;
        }
        if (s.state?.toLowerCase().includes(query)) {
          if (!seenLocations.has(s.state)) {
            locations.push(s.state);
            seenLocations.add(s.state);
          }
          break;
        }
      }
      // Early break if we have enough locations
      if (locations.length >= limit) break;
    }

    // Sort suggestions by score (descending)
    // Deduplication was already handled by addSuggestion
    const sortedSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      suggestions: sortedSuggestions.map(s => s.text),
      locations: locations.slice(0, limit),
      translationsUsed: queryTranslations.length > 1,
      originalQuery: searchQuery,
    };
  },
});

/**
 * Legacy query version for backward compatibility (without translation)
 * Use searchSuggestionsWithQuery action for bilingual support
 */
export const searchSuggestionsWithQueryBasic = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();
    const limit = Number(args.limit ?? 10);

    if (!searchQuery) {
      return { suggestions: [], locations: [] };
    }

    // Get all approved suppliers
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .collect();

    // Get all products
    const products = await ctx.db.query("products").collect();

    // Get all active categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .collect();

    // Build suggestions
    const suggestions: string[] = [];

    // Add matching supplier names
    suppliers.forEach(s => {
      if (s.business_name?.toLowerCase().includes(searchQuery)) {
        suggestions.push(s.business_name);
      }
    });

    // Add matching product names
    products.forEach(p => {
      if (p.name?.toLowerCase().includes(searchQuery)) {
        suggestions.push(p.name);
      }
    });

    // Add matching category names
    categories.forEach(c => {
      if (c.name?.toLowerCase().includes(searchQuery)) {
        suggestions.push(c.name);
      }
    });

    // Build location suggestions
    const locations: string[] = [];

    suppliers.forEach(s => {
      if (s.city?.toLowerCase().includes(searchQuery)) {
        locations.push(s.city);
      }
      if (s.state?.toLowerCase().includes(searchQuery)) {
        locations.push(s.state);
      }
    });

    // Remove duplicates and limit results
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, limit);
    const uniqueLocations = [...new Set(locations)].slice(0, limit);

    return {
      suggestions: uniqueSuggestions,
      locations: uniqueLocations,
    };
  },
});
