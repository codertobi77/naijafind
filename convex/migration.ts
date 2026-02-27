import { v } from 'convex/values';
import { mutation } from './_generated/server';

/**
 * Bulk import data for migration purposes
 * Use with caution - only for admin/migration operations
 */
export const bulkImport = mutation({
  args: {
    table: v.string(),
    data: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { table, data } = args;
    
    // Validate table name
    const validTables = [
      'users',
      'categories', 
      'suppliers',
      'products',
      'reviews',
      'contacts',
      'messages',
      'verification_tokens',
      'password_reset_tokens',
      'verification_documents',
      'rate_limit_attempts',
      'newsletter_subscriptions',
      'notifications',
    ];
    
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    
    const results = {
      inserted: 0,
      errors: [] as string[],
    };
    
    for (const record of data) {
      try {
        // Remove any _id or _creationTime if present
        const { _id, _creationTime, ...cleanRecord } = record;
        
        // Insert the record
        await ctx.db.insert(table as any, cleanRecord);
        results.inserted++;
      } catch (error) {
        results.errors.push(`Failed to insert record: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return results;
  },
});

/**
 * Clear all data from a table (use with extreme caution!)
 */
export const clearTable = mutation({
  args: {
    table: v.string(),
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error('Must set confirm: true to clear table');
    }
    
    const validTables = [
      'users',
      'categories',
      'suppliers',
      'products',
      'reviews',
      'contacts',
      'messages',
      'verification_tokens',
      'password_reset_tokens',
      'verification_documents',
      'rate_limit_attempts',
      'newsletter_subscriptions',
      'notifications',
    ];
    
    if (!validTables.includes(args.table)) {
      throw new Error(`Invalid table name: ${args.table}`);
    }
    
    // Get all records from the table
    const records = await ctx.db.query(args.table as any).collect();
    
    let deleted = 0;
    for (const record of records) {
      await ctx.db.delete(record._id);
      deleted++;
    }
    
    return { deleted };
  },
});

/**
 * Get table stats for verification
 */
export const getTableStats = mutation({
  args: {
    table: v.string(),
  },
  handler: async (ctx, args) => {
    const validTables = [
      'users',
      'categories',
      'suppliers',
      'products',
      'reviews',
      'contacts',
      'messages',
      'verification_tokens',
      'password_reset_tokens',
      'verification_documents',
      'rate_limit_attempts',
      'newsletter_subscriptions',
      'notifications',
    ];
    
    if (!validTables.includes(args.table)) {
      throw new Error(`Invalid table name: ${args.table}`);
    }
    
    const records = await ctx.db.query(args.table as any).collect();
    
    return {
      table: args.table,
      count: records.length,
      sample: records.slice(0, 3).map(r => {
        const { _creationTime, ...rest } = r;
        return rest;
      }),
    };
  },
});
