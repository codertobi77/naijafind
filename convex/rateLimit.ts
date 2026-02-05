import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Rate limiting for spam protection
 * Tracks attempts per IP/user and prevents excessive requests
 */

export const checkRateLimit = query({
  args: {
    identifier: v.string(), // email or IP address
    action: v.string(), // 'contact_form', 'supplier_message', etc.
    limit: v.optional(v.number()), // Max attempts (default: 5)
    windowMinutes: v.optional(v.number()), // Time window in minutes (default: 60)
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const windowMinutes = args.windowMinutes || 60;
    const windowMs = windowMinutes * 60 * 1000;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Count recent attempts
    const attempts = await ctx.db
      .query("rate_limit_attempts")
      .filter((q) =>
        q.and(
          q.eq(q.field("identifier"), args.identifier),
          q.eq(q.field("action"), args.action),
          q.gt(q.field("timestamp"), windowStart)
        )
      )
      .collect();

    const allowed = attempts.length < limit;
    
    return {
      allowed,
      remaining: Math.max(0, limit - attempts.length),
      resetAt: attempts.length > 0 
        ? new Date(attempts[0].timestamp + windowMs).toISOString()
        : new Date(now + windowMs).toISOString(),
    };
  },
});

export const recordAttempt = mutation({
  args: {
    identifier: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("rate_limit_attempts", {
      identifier: args.identifier,
      action: args.action,
      timestamp: Date.now(),
    });
  },
});

export const cleanupOldAttempts = mutation({
  args: {
    olderThanMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const minutes = args.olderThanMinutes || 120; // Default: 2 hours
    const cutoff = Date.now() - (minutes * 60 * 1000);

    const oldAttempts = await ctx.db
      .query("rate_limit_attempts")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();

    for (const attempt of oldAttempts) {
      await ctx.db.delete(attempt._id);
    }

    return { deleted: oldAttempts.length };
  },
});
