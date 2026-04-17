import { v } from "convex/values";
import { query, action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Internal query: Get approved suppliers with minimal fields (light version)
 * Only returns fields needed for search suggestions
 */
export const _getApprovedSuppliersLight = internalQuery({
  args: {},
  handler: async (ctx) => {
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .take(5000); // Limit to prevent timeout
    
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

    // Use internal queries to fetch data server-side - PARALLELIZED for performance
    const [suppliers, products, categories] = await Promise.all([
      ctx.runQuery(internal.searchSuggestions._getApprovedSuppliersLight, {}),
      ctx.runQuery(internal.searchSuggestions._getProductsLight, { limit: 1000 }),
      ctx.runQuery(internal.searchSuggestions._getActiveCategoriesLight, {})
    ]);

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

    // Build list of queries to search - original + translated
    let queryTranslations: string[] = [searchQuery];
    
    // If query is long enough, try to translate for bilingual search
    if (searchQuery.length >= 2) {
      try {
        // If user is searching in French, also search in English and vice versa
        const otherLanguage = userLanguage === 'fr' ? 'en' : 'fr';
        
        const translationResult = await ctx.runAction(internal.translation.translateText, {
          text: searchQuery,
          targetLang: otherLanguage,
          sourceLang: userLanguage,
        });
        
        if (translationResult.success && translationResult.translatedText) {
          // Add the translated query to our search terms
          const translatedQuery = translationResult.translatedText.toLowerCase().trim();
          if (translatedQuery !== searchQuery) {
            queryTranslations.push(translatedQuery);
          }
        }
      } catch (error) {
        // If translation fails, continue with original query only
        console.log("Translation failed, using original query:", error);
      }
    }

    // Get initial data server-side - PARALLELIZED to reduce total RTT
    const [suppliers, products, categories] = await Promise.all([
      ctx.runQuery(internal.searchSuggestions.getApprovedSuppliers, {}),
      ctx.runQuery(internal.searchSuggestions.getAllProducts, {}),
      ctx.runQuery(internal.searchSuggestions.getActiveCategories, {})
    ]);

    // Track product categories for supplier suggestions
    const matchedProductCategories = new Set<string>();

    // Build suggestions with scoring
    interface Suggestion {
      text: string;
      score: number;
      type: 'supplier' | 'product' | 'category';
    }
    
    const suggestions: Suggestion[] = [];
    const seenTexts = new Set<string>(); // For O(1) deduplication

    // Add matching supplier names
    suppliers.forEach((s: any) => {
      if (!s.business_name) return;
      const nameLower = s.business_name.toLowerCase();
      
      // Check against all query translations
      for (const query of queryTranslations) {
        if (nameLower.includes(query)) {
          const score = nameLower === query ? 100 : nameLower.startsWith(query) ? 80 : 50;
          suggestions.push({
            text: s.business_name,
            score,
            type: 'supplier',
          });
          seenTexts.add(nameLower);
          break; // Only add once per supplier
        }
      }
    });

    // Add matching product names and track their categories
    products.forEach((p: any) => {
      if (!p.name) return;
      const nameLower = p.name.toLowerCase();
      
      for (const query of queryTranslations) {
        if (nameLower.includes(query)) {
          const score = nameLower === query ? 100 : nameLower.startsWith(query) ? 80 : 50;
          suggestions.push({
            text: p.name,
            score,
            type: 'product',
          });
          seenTexts.add(nameLower);
          // Track category for supplier suggestions
          if (p.category) {
            matchedProductCategories.add(p.category);
          }
          break;
        }
      }
    });

    // Add suppliers from matched product categories - PARALLELIZED to avoid N+1 problem
    const categorySuppliersResults = await Promise.all(
      Array.from(matchedProductCategories).map(category =>
        ctx.runQuery(internal.searchSuggestions.getSuppliersByCategory, { category })
      )
    );

    categorySuppliersResults.forEach(categorySuppliers => {
      categorySuppliers.forEach((s: any) => {
        if (!s.business_name) return;
        const nameLower = s.business_name.toLowerCase();
        // Avoid duplicates using Set for O(1) lookup
        if (!seenTexts.has(nameLower)) {
          suggestions.push({
            text: s.business_name,
            score: 45, // Slightly lower score than direct matches
            type: 'supplier',
          });
          seenTexts.add(nameLower);
        }
      });
    });

    // Add matching category names
    categories.forEach((c: any) => {
      if (!c.name) return;
      const nameLower = c.name.toLowerCase();
      
      for (const query of queryTranslations) {
        if (nameLower.includes(query)) {
          const score = nameLower === query ? 100 : nameLower.startsWith(query) ? 90 : 60;
          suggestions.push({
            text: c.name,
            score,
            type: 'category',
          });
          break;
        }
      }
    });

    // Build location suggestions
    const locations: string[] = [];

    suppliers.forEach((s: any) => {
      for (const query of queryTranslations) {
        if (s.city?.toLowerCase().includes(query)) {
          locations.push(s.city);
          break;
        }
        if (s.state?.toLowerCase().includes(query)) {
          locations.push(s.state);
          break;
        }
      }
    });

    // Sort suggestions by score (descending) and ensure final deduplication
    // Already mostly deduplicated via seenTexts, but final pass for safety and sorting
    const finalSeen = new Set<string>();
    const sortedSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .filter((item) => {
        const lower = item.text.toLowerCase();
        if (finalSeen.has(lower)) return false;
        finalSeen.add(lower);
        return true;
      })
      .slice(0, limit);

    // Remove duplicate locations and limit results
    const uniqueLocations = [...new Set(locations)].slice(0, limit);

    return {
      suggestions: sortedSuggestions.map(s => s.text),
      locations: uniqueLocations,
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
