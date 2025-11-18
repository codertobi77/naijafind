import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to check if user is admin
async function isAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;

  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("email"), identity.email ?? ""))
    .first();

  return user?.is_admin === true || user?.user_type === 'admin';
}

// Get all active categories (public query)
export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .filter(q => q.eq(q.field("is_active"), true))
      .collect();

    // Sort by order field if available, otherwise by name
    return categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return Number(a.order) - Number(b.order);
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

// Get all categories including inactive ones (admin only)
export const getAllCategoriesAdmin = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Non autorisé - Admin uniquement");
    }

    const categories = await ctx.db
      .query("categories")
      .collect();

    return categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return Number(a.order) - Number(b.order);
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

// Add a new category (admin only)
export const addCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    image: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    order: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Non autorisé - Admin uniquement");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // Check if category already exists
    const existing = await ctx.db
      .query("categories")
      .filter(q => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error("Une catégorie avec ce nom existe déjà");
    }

    const now = new Date().toISOString();
    const userId = identity.subject;

    const id = await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      image: args.image,
      is_active: args.is_active ?? true,
      order: args.order !== undefined ? args.order : undefined,
      created_at: now,
      created_by: userId,
    });

    return { id };
  },
});

// Update a category (admin only)
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    image: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    order: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Non autorisé - Admin uniquement");
    }

    const { id, ...updates } = args;
    const category = await ctx.db.get(id);

    if (!category) {
      throw new Error("Catégorie non trouvée");
    }

    // If name is being updated, check for duplicates
    if (updates.name && updates.name !== category.name) {
      const existing = await ctx.db
        .query("categories")
        .filter(q => q.eq(q.field("name"), updates.name))
        .first();

      if (existing) {
        throw new Error("Une catégorie avec ce nom existe déjà");
      }
    }

    const patchData: any = {};
    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.description !== undefined) patchData.description = updates.description;
    if (updates.icon !== undefined) patchData.icon = updates.icon;
    if (updates.image !== undefined) patchData.image = updates.image;
    if (updates.is_active !== undefined) patchData.is_active = updates.is_active;
    if (updates.order !== undefined) patchData.order = updates.order;

    await ctx.db.patch(id, patchData);

    return { success: true };
  },
});

// Delete a category (admin only)
export const deleteCategory = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error("Non autorisé - Admin uniquement");
    }

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Catégorie non trouvée");
    }

    // Check if any suppliers are using this category
    const suppliersWithCategory = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("category"), category.name))
      .first();

    if (suppliersWithCategory) {
      throw new Error("Impossible de supprimer cette catégorie : des fournisseurs l'utilisent encore");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

