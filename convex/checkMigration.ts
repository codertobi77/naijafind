import { query } from "./_generated/server.js";
import { v } from "convex/values";

export const checkProductMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    // Get sample of products
    const products = await ctx.db.query("products").take(10);
    
    let withIsSearchable = 0;
    let withoutIsSearchable = 0;
    let total = 0;
    
    for (const p of products) {
      total++;
      if (p.isSearchable === true) {
        withIsSearchable++;
      } else if (p.isSearchable === undefined || p.isSearchable === null) {
        withoutIsSearchable++;
      }
    }
    
    // Count totals
    const [totalProducts, searchableCount] = await Promise.all([
      ctx.db.query("products").collect().then(p => p.length),
      ctx.db.query("products")
        .filter(q => q.eq(q.field("isSearchable"), true))
        .collect()
        .then(p => p.length),
    ]);
    
    return {
      sampleSize: total,
      withIsSearchable,
      withoutIsSearchable,
      totalProducts,
      searchableCount,
      needingMigration: totalProducts - searchableCount,
      percentMigrated: Math.round((searchableCount / totalProducts) * 100),
    };
  },
});
