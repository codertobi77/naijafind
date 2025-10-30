import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ensureUser = mutation({
  args: {
    user_type: v.string(), // 'user' | 'supplier'
    phone: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const existing = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email ?? ""))
      .first();

    const now = new Date().toISOString();
    if (existing) {
      // S'assurer que created_at existe, sinon l'ajouter
      const patchData: any = {};
      
      // Ne mettre à jour user_type que s'il n'existe pas déjà
      if (!existing.user_type) {
        patchData.user_type = args.user_type;
      }
      
      // Mettre à jour les autres champs s'ils sont fournis et différents
      if (args.phone && args.phone !== existing.phone) {
        patchData.phone = args.phone;
      }
      if (args.firstName && args.firstName !== existing.firstName) {
        patchData.firstName = args.firstName;
      }
      if (args.lastName && args.lastName !== existing.lastName) {
        patchData.lastName = args.lastName;
      }
      
      if (!existing.created_at) {
        patchData.created_at = now;
      }
      
      // Ne patcher que si on a des changements à faire
      if (Object.keys(patchData).length > 0) {
        await ctx.db.patch(existing._id, patchData);
      }
      
      return { id: existing._id };
    }

    const id = await ctx.db.insert("users", {
      email: identity.email ?? "",
      user_type: args.user_type,
      phone: args.phone,
      firstName: args.firstName,
      lastName: args.lastName,
      created_at: now,
    });
    return { id };
  }
});

export const signUpBuyer = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // S'assurer que l'utilisateur existe et a le type buyer
    await ensureUser.handler(ctx, { 
      user_type: 'user',
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
    });
    
    return { success: true };
  }
});

export const signUpSupplier = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    business_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // S'assurer que l'utilisateur existe et a le type supplier
    await ensureUser.handler(ctx, { 
      user_type: 'supplier', 
      phone: args.phone,
      firstName: args.firstName,
      lastName: args.lastName,
    });

    const existingSupplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();
    if (existingSupplier) {
      return { id: existingSupplier._id };
    }

    const now = new Date().toISOString();
    const id = await ctx.db.insert("suppliers", {
      userId: identity.subject,
      business_name: args.business_name,
      email: args.email,
      phone: args.phone,
      description: args.description,
      category: args.category,
      address: args.address,
      city: args.city,
      state: args.state,
      location: `${args.city}, ${args.state}`,
      website: args.website,
      rating: 0,
      reviews_count: 0,
      verified: false,
      created_at: now,
      updated_at: now,
    });

    return { id };
  }
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email ?? ""))
      .first();

    const supplier = await ctx.db
      .query("suppliers")
      .filter(q => q.eq(q.field("userId"), identity.subject))
      .first();

    return { user, supplier };
  }
});
