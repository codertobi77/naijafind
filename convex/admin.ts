import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Créer un utilisateur admin (sans authentification requise pour l'initialisation)
// Cette fonction interne est appelée par la route HTTP /admin/create
export const createAdmin = internalMutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier si l'utilisateur existe déjà
    const existing = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), args.email))
      .first();

    const now = new Date().toISOString();

    if (existing) {
      // Mettre à jour l'utilisateur existant pour le rendre admin
      await ctx.db.patch(existing._id, {
        user_type: 'admin',
        is_admin: true,
        firstName: args.firstName || existing.firstName,
        lastName: args.lastName || existing.lastName,
        phone: args.phone || existing.phone,
      });
      return {
        success: true,
        message: `L'utilisateur ${args.email} est maintenant admin`,
        id: existing._id,
      };
    } else {
      // Créer un nouvel utilisateur admin
      // Note: L'utilisateur devra s'inscrire via Clerk avec cet email
      const id = await ctx.db.insert("users", {
        email: args.email,
        user_type: 'admin',
        is_admin: true,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        created_at: now,
      });
      return {
        success: true,
        message: `Utilisateur admin créé pour ${args.email}. L'utilisateur devra s'inscrire via Clerk avec cet email.`,
        id,
      };
    }
  },
});

