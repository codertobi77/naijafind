import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get all search suggestions from the database
 * Returns unique values for: products, suppliers, categories, and locations
 */
export const getSearchSuggestions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 100);

    // Get all approved suppliers
    const suppliers = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("approved"), true))
      .collect();

    // Get all products
    const products = await ctx.db.query("products").collect();

    // Get all active categories
    const categories = await ctx.db
      .query("categories")
      .filter(q => q.eq(q.field("is_active"), true))
      .collect();

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
 * Search suggestions with query filter
 * Returns filtered suggestions based on user input
 */
export const searchSuggestionsWithQuery = query({
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
      .filter(q => q.eq(q.field("approved"), true))
      .collect();

    // Get all products
    const products = await ctx.db.query("products").collect();

    // Get all active categories
    const categories = await ctx.db
      .query("categories")
      .filter(q => q.eq(q.field("is_active"), true))
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
