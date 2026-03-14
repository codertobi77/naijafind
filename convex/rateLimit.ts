import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

    // Count recent attempts using compound index
    const attempts = await ctx.db
      .query("rate_limit_attempts")
      .withIndex("identifier_action", (q) => 
        q.eq("identifier", args.identifier).eq("action", args.action)
      )
      .filter((q) => q.gt(q.field("timestamp"), windowStart))
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
      .withIndex("timestamp", (q) => q.lt("timestamp", cutoff))
      .collect();

    for (const attempt of oldAttempts) {
      await ctx.db.delete(attempt._id);
    }

    return { deleted: oldAttempts.length };
  },
});

/**
 * Action wrapper for checking and recording rate limit in one call
 * Returns true if allowed, throws error if rate limited
 */
export const enforceRateLimit = action({
  args: {
    identifier: v.string(),
    action: v.string(),
    limit: v.optional(v.number()),
    windowMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runQuery(internal.rateLimit.checkRateLimitInternal, {
      identifier: args.identifier,
      action: args.action,
      limit: args.limit,
      windowMinutes: args.windowMinutes,
    });

    if (!result.allowed) {
      throw new Error(
        `Trop de tentatives. Veuillez attendre jusqu'à ${new Date(result.resetAt).toLocaleTimeString()}`
      );
    }

    // Record this attempt
    await ctx.runMutation(internal.rateLimit.recordAttemptInternal, {
      identifier: args.identifier,
      action: args.action,
    });

    return { allowed: true, remaining: result.remaining };
  },
});

// Internal helpers for action usage
export const checkRateLimitInternal = query({
  args: {
    identifier: v.string(),
    action: v.string(),
    limit: v.optional(v.number()),
    windowMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const windowMinutes = args.windowMinutes || 60;
    const windowMs = windowMinutes * 60 * 1000;
    const now = Date.now();
    const windowStart = now - windowMs;

    const attempts = await ctx.db
      .query("rate_limit_attempts")
      .withIndex("identifier_action", (q) => 
        q.eq("identifier", args.identifier).eq("action", args.action)
      )
      .filter((q) => q.gt(q.field("timestamp"), windowStart))
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

export const recordAttemptInternal = mutation({
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
