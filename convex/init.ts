import { mutation, internalMutation } from "./_generated/server";
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

// Fonction helper partagée pour créer les catégories
async function createCategories(ctx: any, userId: string) {
  const now = new Date().toISOString();

  const categories = [
      {
        name: 'Agriculture',
        description: 'Produits agricoles, équipements, semences et services',
        icon: 'ri-plant-line',
        is_active: true,
        order: BigInt(1),
      },
      {
        name: 'Textile',
        description: 'Tissus, vêtements, accessoires de mode',
        icon: 'ri-shirt-line',
        is_active: true,
        order: BigInt(2),
      },
      {
        name: 'Électronique',
        description: 'Appareils électroniques, composants, accessoires',
        icon: 'ri-smartphone-line',
        is_active: true,
        order: BigInt(3),
      },
      {
        name: 'Alimentation',
        description: 'Produits alimentaires, boissons, épices',
        icon: 'ri-restaurant-line',
        is_active: true,
        order: BigInt(4),
      },
      {
        name: 'Construction',
        description: 'Matériaux de construction, outils, équipements',
        icon: 'ri-building-line',
        is_active: true,
        order: BigInt(5),
      },
      {
        name: 'Automobile',
        description: 'Véhicules, pièces détachées, accessoires auto',
        icon: 'ri-car-line',
        is_active: true,
        order: BigInt(6),
      },
      {
        name: 'Santé & Beauté',
        description: 'Produits de santé, cosmétiques, bien-être',
        icon: 'ri-heart-pulse-line',
        is_active: true,
        order: BigInt(7),
      },
      {
        name: 'Éducation',
        description: 'Livres, fournitures scolaires, équipements éducatifs',
        icon: 'ri-book-line',
        is_active: true,
        order: BigInt(8),
      },
      {
        name: 'Services',
        description: 'Services professionnels, consulting, maintenance',
        icon: 'ri-service-line',
        is_active: true,
        order: BigInt(9),
      },
    ];

    // Vérifier quelles catégories existent déjà
    const existingCategories = await ctx.db.query("categories").collect();
    const existingNames = new Set(existingCategories.map((c: any) => c.name));

    const created: string[] = [];
    const skipped: string[] = [];

    for (const category of categories) {
      if (existingNames.has(category.name)) {
        skipped.push(category.name);
        continue;
      }

      try {
        await ctx.db.insert("categories", {
          name: category.name,
          description: category.description,
          icon: category.icon,
          is_active: category.is_active,
          order: category.order,
          created_at: now,
          created_by: userId,
        });
        created.push(category.name);
      } catch (error) {
        console.error(`Erreur lors de la création de la catégorie ${category.name}:`, error);
      }
    }

    return {
      success: true,
      created,
      skipped,
      message: `${created.length} catégories créées, ${skipped.length} déjà existantes`,
    };
}

// Fonction helper pour créer des catégories personnalisées
async function createCustomCategories(ctx: any, userId: string, categories: any[]) {
  const now = new Date().toISOString();
  
  // Vérifier quelles catégories existent déjà
  const existingCategories = await ctx.db.query("categories").collect();
  const existingNames = new Set(existingCategories.map((c: any) => c.name));

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const category of categories) {
    // Skip if category already exists
    if (existingNames.has(category.name)) {
      skipped.push(category.name);
      continue;
    }

    try {
      // Validate required fields
      if (!category.name) {
        errors.push(`Category missing name: ${JSON.stringify(category)}`);
        continue;
      }

      await ctx.db.insert("categories", {
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
        is_active: category.is_active !== undefined ? category.is_active : true,
        order: category.order !== undefined ? Number(category.order) : undefined,
        created_at: now,
        created_by: userId,
      });
      created.push(category.name);
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
      errors.push(`Error creating category ${category.name}: ${error.message}`);
    }
  }

  return {
    success: true,
    created: created.length,
    skipped: skipped.length,
    errors,
    message: `${created.length} categories created, ${skipped.length} already existed`,
  };
}

// Script d'initialisation INTERNE pour créer les catégories de base
// Cette fonction est appelée par la route HTTP /init (sans authentification)
export const initCategoriesInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await createCategories(ctx, "system");
  },
});

// Script d'initialisation INTERNE pour créer des catégories personnalisées
// Cette fonction est appelée par la route HTTP /categories/init (sans authentification)
export const initCustomCategoriesInternal = internalMutation({
  args: {
    categories: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    return await createCustomCategories(ctx, "system", args.categories);
  },
});

// Mutation publique pour l'initialisation (sans vérification d'authentification)
// Permet d'initialiser la base de données avant la création d'utilisateurs admin
export const initCategories = mutation({
  args: {},
  handler: async (ctx) => {
    return await createCategories(ctx, "system");
  },
});

// Helper pour obtenir le nombre de suppliers par catégorie
export const getCategoryStats = mutation({
  args: {},
  handler: async (ctx) => {
    const allSuppliers = await ctx.db.query("suppliers").collect();
    const categoryCounts: Record<string, number> = {};

    for (const supplier of allSuppliers) {
      const category = supplier.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }

    return categoryCounts;
  },
});

// Migration helper to set default values for boolean fields
export const migrateSupplierBooleans = mutation({
  args: {},
  handler: async (ctx) => {
    const allSuppliers = await ctx.db.query("suppliers").collect();
    let migratedCount = 0;

    for (const supplier of allSuppliers) {
      const updateFields: any = {};
      
      // Set default values for boolean fields if undefined
      if (supplier.verified === undefined || supplier.verified === null) {
        updateFields.verified = false;
      }
      if (supplier.approved === undefined || supplier.approved === null) {
        updateFields.approved = false;
      }
      if (supplier.featured === undefined || supplier.featured === null) {
        updateFields.featured = false;
      }
      
      // Only update if we have fields to update
      if (Object.keys(updateFields).length > 0) {
        await ctx.db.patch(supplier._id, updateFields);
        migratedCount++;
      }
    }

    return {
      success: true,
      migrated: migratedCount,
      total: allSuppliers.length,
      message: `Migrated ${migratedCount} suppliers out of ${allSuppliers.length}`
    };
  }
});

