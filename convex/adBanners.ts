import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all ad banners
export const getAllBanners = query({
  args: {},
  handler: async (ctx) => {
    const banners = await ctx.db.query("ad_banners").order("desc").take(100);
    return banners;
  },
});

// Get active banners by position
export const getActiveBannersByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    const banners = await ctx.db
      .query("ad_banners")
      .withIndex("position_active", (q) =>
        q.eq("position", args.position).eq("is_active", true)
      )
      .order("asc")
      .take(10);
    return banners;
  },
});

// Add new banner
export const addBanner = mutation({
  args: {
    name: v.string(),
    image: v.string(),
    link: v.optional(v.string()),
    position: v.string(),
    is_active: v.boolean(),
    order: v.optional(v.number()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const bannerId = await ctx.db.insert("ad_banners", {
      ...args,
      created_at: now,
      updated_at: now,
    });
    return { success: true, bannerId };
  },
});

// Update banner
export const updateBanner = mutation({
  args: {
    id: v.id("ad_banners"),
    name: v.string(),
    image: v.string(),
    link: v.optional(v.string()),
    position: v.string(),
    is_active: v.boolean(),
    order: v.optional(v.number()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const banner = await ctx.db.get(id);
    if (!banner) {
      throw new Error("Banner not found");
    }
    await ctx.db.patch(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  },
});

// Delete banner
export const deleteBanner = mutation({
  args: { id: v.id("ad_banners") },
  handler: async (ctx, args) => {
    const banner = await ctx.db.get(args.id);
    if (!banner) {
      throw new Error("Banner not found");
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Toggle banner active status
export const toggleBannerStatus = mutation({
  args: { id: v.id("ad_banners"), is_active: v.boolean() },
  handler: async (ctx, args) => {
    const banner = await ctx.db.get(args.id);
    if (!banner) {
      throw new Error("Banner not found");
    }
    await ctx.db.patch(args.id, {
      is_active: args.is_active,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  },
});
