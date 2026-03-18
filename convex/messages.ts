import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ==========================================
// INTERNAL FUNCTIONS FOR SUPPLIER DEDUPLICATION
// ==========================================

/**
 * Internal query: Get messages by supplier ID
 */
export const getMessagesBySupplierIdInternal = internalQuery({
  args: {
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
  },
});

/**
 * Internal mutation: Update message supplier ID
 */
export const updateMessageSupplierInternal = internalMutation({
  args: {
    messageId: v.string(),
    newSupplierId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId as Id<"messages">, {
      supplierId: args.newSupplierId,
    });
  },
});
