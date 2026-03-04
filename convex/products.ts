import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const products = await ctx.db
      .query("products")
      .filter(q => q.eq(q.field("supplierId"), supplier._id as unknown as string))
      .collect();

    return products;
  }
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    price: v.float64(),
    stock: v.int64(),
    status: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const now = new Date().toISOString();
    const id = await ctx.db.insert("products", {
      supplierId: supplier._id as unknown as string,
      name: args.name,
      price: args.price,
      stock: args.stock,
      status: args.status,
      category: args.category,
      description: args.description,
      images: args.images,
      created_at: now,
      updated_at: now,
    });
    return { success: true, id };
  }
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.float64()),
    stock: v.optional(v.int64()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const prod = await ctx.db.get(args.id);
    if (!prod) throw new Error("Produit introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || prod.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.patch(args.id, {
      name: args.name ?? prod.name,
      price: args.price ?? prod.price,
      stock: args.stock ?? prod.stock,
      status: args.status ?? prod.status,
      category: args.category !== undefined ? args.category : prod.category,
      description: args.description !== undefined ? args.description : prod.description,
      images: args.images !== undefined ? args.images : prod.images,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  }
});

// Query admin : lister tous les produits
export const listAllProductsAdmin = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier si admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email ?? ""))
      .first();
    if (!user || (!user.is_admin && user.user_type !== 'admin')) {
      throw new Error("Non autorisé - Admin uniquement");
    }
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const products = await ctx.db.query("products").take(limit);
    return products;
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const prod = await ctx.db.get(id);
    if (!prod) throw new Error("Produit introuvable");

    const supplier = await ctx.db.query("suppliers").filter(q => q.eq(q.field("userId"), identity.subject)).first();
    if (!supplier || prod.supplierId !== (supplier._id as unknown as string)) throw new Error("Accès refusé");

    await ctx.db.delete(id);
    return { success: true };
  }
});

export const listProductsBySupplier = query({
  args: { supplierId: v.string() },
  handler: async (ctx, args) => {
    // Get supplier by ID to verify existence
    const supplier = await ctx.db.get(args.supplierId as Id<"suppliers">);
    if (!supplier) throw new Error("Supplier not found");
    
    // Get products for this supplier
    const products = await ctx.db
      .query("products")
      .filter(q => q.eq(q.field("supplierId"), args.supplierId))
      .collect();

    return products;
  }
});
