import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to ensure user exists
async function ensureUserHelper(ctx: any, args: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Non autorisé");

  // Use email from args if provided, otherwise use identity email
  const userEmail = args.email || identity.email;
  
  const existing = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("email"), userEmail ?? ""))
    .first();

  const now = new Date().toISOString();
  if (existing) {
    // S'assurer que created_at existe, sinon l'ajouter
    const patchData: any = {};
    
    // Mettre à jour user_type même s'il existe déjà (permettre le changement de rôle)
    // Mais seulement si un user_type est fourni dans les arguments
    if (args.user_type && args.user_type !== existing.user_type) {
      patchData.user_type = args.user_type;
      // Si c'est un admin, mettre aussi is_admin
      if (args.user_type === 'admin') {
        patchData.is_admin = true;
      }
      // Si ce n'est pas un admin, s'assurer que is_admin est false
      else if (existing.is_admin) {
        patchData.is_admin = false;
      }
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
    
    // Return the updated user data
    const updatedUser = await ctx.db.get(existing._id);
    const supplier = await ctx.db
      .query("suppliers")
      .filter((q: any) => q.eq(q.field("userId"), identity.subject))
      .first();
    
    return { user: updatedUser, supplier };
  }

  const id = await ctx.db.insert("users", {
    email: userEmail ?? "",
    user_type: args.user_type,
    is_admin: args.user_type === 'admin',
    phone: args.phone,
    firstName: args.firstName,
    lastName: args.lastName,
    created_at: now,
  });
  
  // Return the created user data
  const newUser = await ctx.db.get(id);
  return { user: newUser, supplier: null };
}

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
    await ensureUserHelper(ctx, { 
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
    country: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    website: v.optional(v.string()),
    image: v.optional(v.string()),
    imageGallery: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // S'assurer que l'utilisateur existe et a le type supplier
    await ensureUserHelper(ctx, { 
      user_type: 'supplier', 
      phone: args.phone,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email, // Add email to ensureUserHelper call
    });

    // Application-level enforcement: Check for existing supplier profile for this user
    const existingSupplier = await ctx.db
      .query("suppliers")
      .filter((q: any) => q.eq(q.field("userId"), identity.subject))
      .first();
    
    // If supplier already exists, throw an error to prevent duplicate creation
    if (existingSupplier) {
      throw new Error("Un profil fournisseur existe déjà pour cet utilisateur");
    }

    // Default business hours
    const defaultBusinessHours = {
      monday: "08:00-18:00",
      tuesday: "08:00-18:00",
      wednesday: "08:00-18:00",
      thursday: "08:00-18:00",
      friday: "08:00-18:00",
      saturday: "09:00-17:00",
      sunday: "closed"
    };

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
      country: args.country,
      latitude: args.latitude,
      longitude: args.longitude,
      location: `${args.city}, ${args.state}`,
      website: args.website,
      image: args.image,
      imageGallery: args.imageGallery,
      business_hours: defaultBusinessHours,
      rating: 0,
      reviews_count: 0n,
      verified: false,
      approved: false, // Set to false by default - requires admin approval
      featured: false, // Set to false by default - requires admin to feature
      created_at: now,
      updated_at: now,
    });

    return { id };
  }
});

export const ensureUser = mutation({
  args: {
    user_type: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ensureUserHelper(ctx, args);
  }
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Use the same email logic as in ensureUserHelper
    const userEmail = identity.email;
    
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("email"), userEmail ?? ""))
      .first();

    const supplier = await ctx.db
      .query("suppliers")
      .filter((q: any) => q.eq(q.field("userId"), identity.subject))
      .first();

    return { user, supplier };
  }
});