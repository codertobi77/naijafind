import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const supplierId = supplier._id;
    const products = await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", supplierId))
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
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    const now = new Date().toISOString();
    const id = await ctx.db.insert("products", {
      supplierId: supplier._id,
      name: args.name,
      price: args.price,
      stock: args.stock,
      status: args.status,
      category: args.category,
      description: args.description,
      images: args.images,
      isSearchable: true, // Automatically make active products searchable
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

    const supplier = await ctx.db.query("suppliers").withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier)).first();
    if (!supplier || prod.supplierId !== supplier._id) throw new Error("Accès refusé");

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
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
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

// Query admin : get filtered products using indexes
export const getFilteredProducts = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    supplierId: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    minPrice: v.optional(v.float64()),
    maxPrice: v.optional(v.float64()),
    sortBy: v.optional(v.string()), // 'name', 'price', 'created_at', 'stock'
    sortOrder: v.optional(v.string()), // 'asc', 'desc'
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier si admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();
    if (!user || (!user.is_admin && user.user_type !== 'admin')) {
      throw new Error("Non autorisé - Admin uniquement");
    }

    const limit = Math.min(args.limit ?? 2000, 2000);
    const sortBy = args.sortBy || 'created_at';
    const sortOrder = args.sortOrder || 'desc';
    let products: any[] = [];

    // Use index-based filtering when possible
    if (args.status) {
      // Use status index
      products = await ctx.db
        .query("products")
        .withIndex("status", (q) => q.eq("status", args.status as string ?? ""))
        .take(limit);
    } else if (args.category) {
      // Use category index
      const category = args.category as string;
      products = await ctx.db
        .query("products")
        .withIndex("category", (q) => q.eq("category", category))
        .take(limit);
    } else if (args.supplierId) {
      // Use supplierId index
      products = await ctx.db
        .query("products")
        .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId!))
        .take(limit);
    } else {
      // No index filter, fetch all
      products = await ctx.db
        .query("products")
        .take(limit);
    }

    // Apply additional filters in memory
    if (args.category && !args.status) {
      products = products.filter(p => p.category === args.category);
    }
    if (args.supplierId && !args.status && !args.category) {
      products = products.filter(p => p.supplierId === args.supplierId);
    }
    if (args.status && args.category) {
      products = products.filter(p => p.category === args.category);
    }

    // Apply price range filter
    if (args.minPrice !== undefined) {
      products = products.filter(p => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      products = products.filter(p => p.price <= args.maxPrice!);
    }

    // Apply search filter
    if (args.searchQuery && args.searchQuery.trim()) {
      const q = args.searchQuery.toLowerCase().trim();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    products.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'stock':
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        case 'created_at':
        default:
          comparison = (a.created_at || '').localeCompare(b.created_at || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    return products;
  }
});

/**
 * Internal query: base products loader for search
 * Uses indexes and returns only fields needed by searchProducts action.
 * Now supports filtering by inferred categories for better relevance.
 */
export const _getProductsForSearchBase = internalQuery({
  args: {
    category: v.optional(v.string()),
    inferredCategories: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Allow fetching up to 10000 products to accommodate all products (7753 total)
    const limit = Math.min(args.limit ?? 1000, 10000);
    
    // If inferred categories are provided, try to fetch products from those categories first
    if (args.inferredCategories && args.inferredCategories.length > 0 && !args.category) {
      const products: any[] = [];
      const seenIds = new Set<string>();
      
      for (const inferredCat of args.inferredCategories.slice(0, 5)) { // Limit to top 5 categories
        const catProducts = await ctx.db
          .query("products")
          .withIndex("category", (q2) => q2.eq("category", inferredCat))
          .take(Math.floor(limit / args.inferredCategories.length) + 50);
        
        for (const p of catProducts) {
          if (!seenIds.has(p._id)) {
            seenIds.add(p._id);
            products.push(p);
          }
        }
      }
      
      // If we found products in inferred categories, return them
      if (products.length > 0) {
        return products.slice(0, limit).map((p) => ({
          _id: p._id,
          name: p.name,
          description: p.description,
          price: p.price,
          status: p.status,
          category: p.category,
          images: p.images,
          supplierId: (p as any).supplierId,
          created_at: (p as any).created_at,
        }));
      }
    }
    
    // Fallback to original behavior
    const q = ctx.db.query("products");

    const products = args.category && args.category.trim()
      ? await ctx.db
          .query("products")
          .withIndex("category", (q2) => q2.eq("category", args.category!))
          .take(limit)
      : await q.take(limit);

    return products.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      status: p.status,
      category: p.category,
      images: p.images,
      supplierId: (p as any).supplierId,
      created_at: (p as any).created_at,
    }));
  },
});

/**
 * Internal query: get product by ID for sourcing system
 */
export const _getProductByIdInternal = internalQuery({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    
    return {
      _id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      keywords: product.keywords,
      status: product.status,
      isSearchable: product.isSearchable,
      images: product.images,
      supplierId: product.supplierId,
    };
  },
});
// Categories that are service-based and should be excluded from product search
const SERVICE_CATEGORIES = new Set([
  'hôtellerie',
  'hotellerie',
  'hotel',
  'hôtel',
  'hospitality',
  'tourism',
  'tourisme',
  'restaurant',
  'catering',
  'traiteur',
  'event',
  'événementiel',
  'evenementiel',
  'wedding',
  'mariage',
  'beauty salon',
  'salon de beauté',
  'hair salon',
  'coiffure',
  'spa',
  'wellness',
  'bien-être',
  'bien etre',
  'cleaning service',
  'nettoyage',
  'security',
  'sécurité',
  'consulting',
  'conseil',
  'audit',
  'legal',
  'avocat',
  'lawyer',
  'accounting',
  'comptabilité',
  'training',
  'formation',
  'education',
  'education',
  'transport service',
  'logistics service',
  'insurance',
  'assurance',
  'banking',
  'banque',
  'finance service',
  'real estate service',
  'immobilier service',
]);

const SERVICE_CATEGORIES_ARRAY = Array.from(SERVICE_CATEGORIES);
const serviceCategoryCache = new Map<string, boolean>();

// ==========================================
// KNOWLEDGE BASE: Category-Keyword Mapping
// Maps search keywords to potential product categories
// ==========================================
interface CategoryKeywordMap {
  [keyword: string]: string[];
}

const CATEGORY_KEYWORDS: CategoryKeywordMap = {
  // Agroalimentaire
  'riz': ['Agroalimentaire', 'Céréales'],
  'rice': ['Agroalimentaire', 'Céréales'],
  'maïs': ['Agroalimentaire', 'Céréales'],
  'mais': ['Agroalimentaire', 'Céréales'],
  'corn': ['Agroalimentaire', 'Céréales'],
  'blé': ['Agroalimentaire', 'Céréales'],
  'ble': ['Agroalimentaire', 'Céréales'],
  'wheat': ['Agroalimentaire', 'Céréales'],
  'sorgho': ['Agroalimentaire', 'Céréales'],
  'millet': ['Agroalimentaire', 'Céréales'],
  'farine': ['Agroalimentaire', 'Transformation'],
  'flour': ['Agroalimentaire', 'Transformation'],
  'huile': ['Agroalimentaire', 'Huiles'],
  'oil': ['Agroalimentaire', 'Huiles'],
  'palm': ['Agroalimentaire', 'Huiles'],
  'soja': ['Agroalimentaire', 'Légumineuses'],
  'soy': ['Agroalimentaire', 'Légumineuses'],
  'arachide': ['Agroalimentaire', 'Légumineuses'],
  'groundnut': ['Agroalimentaire', 'Légumineuses'],
  'noix': ['Agroalimentaire', 'Fruits secs'],
  'nuts': ['Agroalimentaire', 'Fruits secs'],
  'fruit': ['Agroalimentaire', 'Fruits'],
  'légume': ['Agroalimentaire', 'Légumes'],
  'legume': ['Agroalimentaire', 'Légumes'],
  'vegetable': ['Agroalimentaire', 'Légumes'],
  'piment': ['Agroalimentaire', 'Condiments'],
  'pepper': ['Agroalimentaire', 'Condiments'],
  'tomate': ['Agroalimentaire', 'Légumes'],
  'tomato': ['Agroalimentaire', 'Légumes'],
  'oignon': ['Agroalimentaire', 'Légumes'],
  'onion': ['Agroalimentaire', 'Légumes'],
  'gingembre': ['Agroalimentaire', 'Épices'],
  'ginger': ['Agroalimentaire', 'Épices'],
  'manioc': ['Agroalimentaire', 'Tubercules'],
  'cassava': ['Agroalimentaire', 'Tubercules'],
  'igname': ['Agroalimentaire', 'Tubercules'],
  'yam': ['Agroalimentaire', 'Tubercules'],
  'patate': ['Agroalimentaire', 'Tubercules'],
  'banane': ['Agroalimentaire', 'Fruits'],
  'banana': ['Agroalimentaire', 'Fruits'],
  'ananas': ['Agroalimentaire', 'Fruits'],
  'pineapple': ['Agroalimentaire', 'Fruits'],
  'mangue': ['Agroalimentaire', 'Fruits'],
  'mango': ['Agroalimentaire', 'Fruits'],
  'cacao': ['Agroalimentaire', 'Cash crops'],
  'cocoa': ['Agroalimentaire', 'Cash crops'],
  'café': ['Agroalimentaire', 'Cash crops'],
  'coffee': ['Agroalimentaire', 'Cash crops'],
  'coton': ['Agroalimentaire', 'Fibres'],
  'cotton': ['Agroalimentaire', 'Fibres'],
  'sucre': ['Agroalimentaire', 'Sucrerie'],
  'sugar': ['Agroalimentaire', 'Sucrerie'],
  'lait': ['Agroalimentaire', 'Produits laitiers'],
  'milk': ['Agroalimentaire', 'Produits laitiers'],
  'viande': ['Agroalimentaire', 'Élevage'],
  'meat': ['Agroalimentaire', 'Élevage'],
  'poisson': ['Agroalimentaire', 'Pêche'],
  'fish': ['Agroalimentaire', 'Pêche'],
  'poulet': ['Agroalimentaire', 'Élevage'],
  'chicken': ['Agroalimentaire', 'Élevage'],
  'œuf': ['Agroalimentaire', 'Élevage'],
  'oeuf': ['Agroalimentaire', 'Élevage'],
  'egg': ['Agroalimentaire', 'Élevage'],
  'miel': ['Agroalimentaire', 'Apiculture'],
  'honey': ['Agroalimentaire', 'Apiculture'],
  'jus': ['Agroalimentaire', 'Boissons'],
  'juice': ['Agroalimentaire', 'Boissons'],
  'bière': ['Agroalimentaire', 'Boissons'],
  'beer': ['Agroalimentaire', 'Boissons'],

  // Textile & Habillement
  'tissu': ['Textile', 'Habillement'],
  'fabric': ['Textile', 'Habillement'],
  'textile': ['Textile', 'Habillement'],
  'coton': ['Textile', 'Fibres'],
  'cotton': ['Textile', 'Fibres'],
  'wax': ['Textile', 'Habillement'],
  'pagne': ['Textile', 'Habillement'],
  'habillement': ['Textile', 'Habillement'],
  'clothing': ['Textile', 'Habillement'],
  'vêtement': ['Textile', 'Habillement'],
  'vetement': ['Textile', 'Habillement'],
  'mode': ['Textile', 'Habillement'],
  'fashion': ['Textile', 'Habillement'],
  'chaussure': ['Textile', 'Chaussures'],
  'shoe': ['Textile', 'Chaussures'],
  'sac': ['Textile', 'Maroquinerie'],
  'bag': ['Textile', 'Maroquinerie'],
  'cuir': ['Textile', 'Maroquinerie'],
  'leather': ['Textile', 'Maroquinerie'],

  // Construction & BTP
  'ciment': ['Construction', 'Matériaux'],
  'cement': ['Construction', 'Matériaux'],
  'brique': ['Construction', 'Matériaux'],
  'brick': ['Construction', 'Matériaux'],
  'sable': ['Construction', 'Matériaux'],
  'sand': ['Construction', 'Matériaux'],
  'gravier': ['Construction', 'Matériaux'],
  'gravel': ['Construction', 'Matériaux'],
  'acier': ['Construction', 'Métallurgie'],
  'steel': ['Construction', 'Métallurgie'],
  'fer': ['Construction', 'Métallurgie'],
  'iron': ['Construction', 'Métallurgie'],
  'béton': ['Construction', 'Matériaux'],
  'beton': ['Construction', 'Matériaux'],
  'concrete': ['Construction', 'Matériaux'],
  'bois': ['Construction', 'Bois'],
  'wood': ['Construction', 'Bois'],
  'planche': ['Construction', 'Bois'],
  'plank': ['Construction', 'Bois'],
  'tuile': ['Construction', 'Couverture'],
  'tile': ['Construction', 'Couverture'],
  'tole': ['Construction', 'Couverture'],
  'tôle': ['Construction', 'Couverture'],
  'sheet': ['Construction', 'Couverture'],
  'peinture': ['Construction', 'Finitions'],
  'paint': ['Construction', 'Finitions'],
  'carrelage': ['Construction', 'Finitions'],
  'ceramic': ['Construction', 'Finitions'],
  'plomberie': ['Construction', 'Équipements'],
  'plumbing': ['Construction', 'Équipements'],
  'électricité': ['Construction', 'Équipements'],
  'electricity': ['Construction', 'Équipements'],
  'électric': ['Construction', 'Équipements'],

  // Chimie & Plastique
  'plastique': ['Chimie', 'Plastique'],
  'plastic': ['Chimie', 'Plastique'],
  'pétrole': ['Chimie', 'Pétrochimie'],
  'petrol': ['Chimie', 'Pétrochimie'],
  'oil': ['Chimie', 'Pétrochimie'],
  'engrais': ['Chimie', 'Agrochimie'],
  'fertilizer': ['Chimie', 'Agrochimie'],
  'pesticide': ['Chimie', 'Agrochimie'],
  'produit chimique': ['Chimie', 'Chimie industrielle'],
  'chemical': ['Chimie', 'Chimie industrielle'],
  'caoutchouc': ['Chimie', 'Caoutchouc'],
  'rubber': ['Chimie', 'Caoutchouc'],
  'peinture': ['Chimie', 'Peintures'],
  'paint': ['Chimie', 'Peintures'],
  'détergent': ['Chimie', 'Produits ménagers'],
  'detergent': ['Chimie', 'Produits ménagers'],
  'savon': ['Chimie', 'Produits ménagers'],
  'soap': ['Chimie', 'Produits ménagers'],
  'cosmétique': ['Chimie', 'Cosmétiques'],
  'cosmetic': ['Chimie', 'Cosmétiques'],
  'beauté': ['Chimie', 'Cosmétiques'],
  'beauty': ['Chimie', 'Cosmétiques'],
  'parfum': ['Chimie', 'Parfumerie'],
  'perfume': ['Chimie', 'Parfumerie'],

  // Électronique & Électricité
  'électronique': ['Électronique', 'Équipements'],
  'electronique': ['Électronique', 'Équipements'],
  'electronics': ['Électronique', 'Équipements'],
  'téléphone': ['Électronique', 'Télécommunications'],
  'telephone': ['Électronique', 'Télécommunications'],
  'phone': ['Électronique', 'Télécommunications'],
  'mobile': ['Électronique', 'Télécommunications'],
  'ordinateur': ['Électronique', 'Informatique'],
  'computer': ['Électronique', 'Informatique'],
  'ordinateur': ['Électronique', 'Informatique'],
  'laptop': ['Électronique', 'Informatique'],
  'tv': ['Électronique', 'Audiovisuel'],
  'télévision': ['Électronique', 'Audiovisuel'],
  'television': ['Électronique', 'Audiovisuel'],
  'radio': ['Électronique', 'Audiovisuel'],
  'électroménager': ['Électronique', 'Électroménager'],
  'electromenager': ['Électronique', 'Électroménager'],
  'appliance': ['Électronique', 'Électroménager'],
  'frigo': ['Électronique', 'Électroménager'],
  'refrigerator': ['Électronique', 'Électroménager'],
  'climatisation': ['Électronique', 'Électroménager'],
  'ac': ['Électronique', 'Électroménager'],
  'air conditioner': ['Électronique', 'Électroménager'],
  'solaire': ['Électronique', 'Énergie'],
  'solar': ['Électronique', 'Énergie'],
  'panneau': ['Électronique', 'Énergie'],
  'panel': ['Électronique', 'Énergie'],
  'batterie': ['Électronique', 'Stockage'],
  'battery': ['Électronique', 'Stockage'],
  'câble': ['Électronique', 'Câblerie'],
  'cable': ['Électronique', 'Câblerie'],
  'composant': ['Électronique', 'Composants'],
  'component': ['Électronique', 'Composants'],
  'carte': ['Électronique', 'Composants'],
  'board': ['Électronique', 'Composants'],
  'circuit': ['Électronique', 'Composants'],
  'led': ['Électronique', 'Éclairage'],
  'ampoule': ['Électronique', 'Éclairage'],
  'light': ['Électronique', 'Éclairage'],

  // Minerais & Mines
  'or': ['Mines', 'Minerais'],
  'gold': ['Mines', 'Minerais'],
  'diamant': ['Mines', 'Minerais'],
  'diamond': ['Mines', 'Minerais'],
  'pierre': ['Mines', 'Minerais'],
  'stone': ['Mines', 'Minerais'],
  'minerai': ['Mines', 'Minerais'],
  'ore': ['Mines', 'Minerais'],
  'charbon': ['Mines', 'Énergie'],
  'coal': ['Mines', 'Énergie'],
  'zinc': ['Mines', 'Minerais'],
  'cuivre': ['Mines', 'Minerais'],
  'copper': ['Mines', 'Minerais'],
  'aluminium': ['Mines', 'Minerais'],
  'aluminum': ['Mines', 'Minerais'],
  'manganèse': ['Mines', 'Minerais'],
  'manganese': ['Mines', 'Minerais'],
  'nickel': ['Mines', 'Minerais'],
  'cobalt': ['Mines', 'Minerais'],
  'lithium': ['Mines', 'Minerais'],
  'granite': ['Mines', 'Pierres'],
  'marbre': ['Mines', 'Pierres'],
  'marble': ['Mines', 'Pierres'],
  'bauxite': ['Mines', 'Minerais'],

  // Énergie
  'énergie': ['Énergie', 'Production'],
  'energie': ['Énergie', 'Production'],
  'energy': ['Énergie', 'Production'],
  'pétrole': ['Énergie', 'Hydrocarbures'],
  'petrol': ['Énergie', 'Hydrocarbures'],
  'oil': ['Énergie', 'Hydrocarbures'],
  'gaz': ['Énergie', 'Hydrocarbures'],
  'gas': ['Énergie', 'Hydrocarbures'],
  'solaire': ['Énergie', 'Renouvelable'],
  'solar': ['Énergie', 'Renouvelable'],
  'éolien': ['Énergie', 'Renouvelable'],
  'wind': ['Énergie', 'Renouvelable'],
  'biogaz': ['Énergie', 'Renouvelable'],
  'biogas': ['Énergie', 'Renouvelable'],
  'biomasse': ['Énergie', 'Renouvelable'],
  'biomass': ['Énergie', 'Renouvelable'],
  'électricité': ['Énergie', 'Distribution'],
  'electricity': ['Énergie', 'Distribution'],
  'générateur': ['Énergie', 'Équipements'],
  'generator': ['Énergie', 'Équipements'],
  'transfo': ['Énergie', 'Équipements'],
  'transformer': ['Énergie', 'Équipements'],

  // Transport & Logistique (produits uniquement)
  'véhicule': ['Automobile', 'Véhicules'],
  'vehicule': ['Automobile', 'Véhicules'],
  'vehicle': ['Automobile', 'Véhicules'],
  'voiture': ['Automobile', 'Véhicules'],
  'car': ['Automobile', 'Véhicules'],
  'moto': ['Automobile', 'Motos'],
  'motorcycle': ['Automobile', 'Motos'],
  'camion': ['Automobile', 'Poids lourds'],
  'truck': ['Automobile', 'Poids lourds'],
  'bus': ['Automobile', 'Transport'],
  'pièce': ['Automobile', 'Pièces détachées'],
  'piece': ['Automobile', 'Pièces détachées'],
  'part': ['Automobile', 'Pièces détachées'],
  'pneu': ['Automobile', 'Pneumatiques'],
  'pneumatic': ['Automobile', 'Pneumatiques'],
  'tire': ['Automobile', 'Pneumatiques'],
  'batterie': ['Automobile', 'Pièces'],
  'battery': ['Automobile', 'Pièces'],
  'huile': ['Automobile', 'Lubrifiants'],
  'oil': ['Automobile', 'Lubrifiants'],
  'lubrifiant': ['Automobile', 'Lubrifiants'],
  'lubricant': ['Automobile', 'Lubrifiants'],
  'équipement': ['Automobile', 'Accessoires'],
  'equipment': ['Automobile', 'Accessoires'],

  // Santé & Pharmacie
  'médicament': ['Pharmacie', 'Médicaments'],
  'medicament': ['Pharmacie', 'Médicaments'],
  'drug': ['Pharmacie', 'Médicaments'],
  'pharma': ['Pharmacie', 'Médicaments'],
  'vaccin': ['Pharmacie', 'Vaccins'],
  'vaccine': ['Pharmacie', 'Vaccins'],
  'dispositif médical': ['Médical', 'Dispositifs'],
  'medical device': ['Médical', 'Dispositifs'],
  'matériel médical': ['Médical', 'Équipements'],
  'medical equipment': ['Médical', 'Équipements'],
  'laboratoire': ['Médical', 'Laboratoire'],
  'laboratory': ['Médical', 'Laboratoire'],
  'test': ['Médical', 'Diagnostics'],
  'diagnostic': ['Médical', 'Diagnostics'],
  'masque': ['Médical', 'Protection'],
  'mask': ['Médical', 'Protection'],
  'gant': ['Médical', 'Protection'],
  'glove': ['Médical', 'Protection'],
  'seringue': ['Médical', 'Consommables'],
  'syringe': ['Médical', 'Consommables'],

  // Bois & Meuble
  'bois': ['Bois', 'Bois brut'],
  'wood': ['Bois', 'Bois brut'],
  'forêt': ['Bois', 'Exploitation'],
  'forest': ['Bois', 'Exploitation'],
  'meuble': ['Bois', 'Meubles'],
  'furniture': ['Bois', 'Meubles'],
  'contreplaqué': ['Bois', 'Panneaux'],
  'plywood': ['Bois', 'Panneaux'],
  'mdf': ['Bois', 'Panneaux'],
  'charbon': ['Bois', 'Combustible'],
  'charcoal': ['Bois', 'Combustible'],

  // Artisanat & Décoration
  'artisanat': ['Artisanat', 'Produits artisanaux'],
  'craft': ['Artisanat', 'Produits artisanaux'],
  'décoration': ['Artisanat', 'Décoration'],
  'decoration': ['Artisanat', 'Décoration'],
  'céramique': ['Artisanat', 'Céramiques'],
  'ceramic': ['Artisanat', 'Céramiques'],
  'poterie': ['Artisanat', 'Poterie'],
  'pottery': ['Artisanat', 'Poterie'],
  'tissage': ['Artisanat', 'Textile artisanal'],
  'weaving': ['Artisanat', 'Textile artisanal'],
  'cuir': ['Artisanat', 'Maroquinerie'],
  'leather': ['Artisanat', 'Maroquinerie'],
  'bijou': ['Artisanat', 'Bijouterie'],
  'jewelry': ['Artisanat', 'Bijouterie'],
  'perle': ['Artisanat', 'Bijouterie'],
  'bead': ['Artisanat', 'Bijouterie'],

  // Emballage
  'emballage': ['Emballage', 'Emballages'],
  'packaging': ['Emballage', 'Emballages'],
  'carton': ['Emballage', 'Carton'],
  'cardboard': ['Emballage', 'Carton'],
  'plastique': ['Emballage', 'Plastique'],
  'plastic': ['Emballage', 'Plastique'],
  'bouteille': ['Emballage', 'Bouteilles'],
  'bottle': ['Emballage', 'Bouteilles'],
  'sachet': ['Emballage', 'Sachets'],
  'pouch': ['Emballage', 'Sachets'],
  'étiquette': ['Emballage', 'Étiquettes'],
  'label': ['Emballage', 'Étiquettes'],

  // Papeterie
  'papier': ['Papeterie', 'Papier'],
  'paper': ['Papeterie', 'Papier'],
  'cahier': ['Papeterie', 'Fournitures'],
  'notebook': ['Papeterie', 'Fournitures'],
  'stylo': ['Papeterie', 'Fournitures'],
  'pen': ['Papeterie', 'Fournitures'],
  'carton': ['Papeterie', 'Carton'],

  // Import/Export général
  'import': ['Import/Export', 'Services'],
  'export': ['Import/Export', 'Services'],
  'commerce': ['Import/Export', 'Commerce'],
  'trading': ['Import/Export', 'Commerce'],
  'fret': ['Import/Export', 'Logistique'],
  'freight': ['Import/Export', 'Logistique'],
  'douane': ['Import/Export', 'Services'],
  'custom': ['Import/Export', 'Services'],
};

// Reverse mapping: category -> keywords
const REVERSE_CATEGORY_MAP: { [category: string]: string[] } = {};
for (const [keyword, categories] of Object.entries(CATEGORY_KEYWORDS)) {
  const kwLower = keyword.toLowerCase();
  for (const cat of categories) {
    if (!REVERSE_CATEGORY_MAP[cat]) {
      REVERSE_CATEGORY_MAP[cat] = [];
    }
    if (!REVERSE_CATEGORY_MAP[cat].includes(kwLower)) {
      REVERSE_CATEGORY_MAP[cat].push(kwLower);
    }
  }
}

// Pre-calculate sorted compound terms (longest first) to match "dispositif médical" before "médical"
const SORTED_COMPOUND_TERMS = Object.keys(CATEGORY_KEYWORDS)
  .filter(kw => kw.includes(' '))
  .sort((a, b) => b.length - a.length);

const STOP_WORDS = new Set([
  "a","an","the","and","or","of","for","to","in","on","avec","pour","de","des","du","la","le","les","un","une","et","ou","dans","sur","je","tu","il","elle","nous","vous","ils","elles"
]);

/**
 * Check if a category is a service category (should be excluded from product search)
 */
function isServiceCategory(category: string | undefined): boolean {
  if (!category) return false;
  const catLower = category.toLowerCase().trim();

  const cached = serviceCategoryCache.get(catLower);
  if (cached !== undefined) return cached;

  const isService = SERVICE_CATEGORIES.has(catLower) ||
         SERVICE_CATEGORIES_ARRAY.some(sc => catLower.includes(sc));

  serviceCategoryCache.set(catLower, isService);
  return isService;
}

/**
 * Infer categories from search keywords using the knowledge base
 * Returns an array of category names that match the keywords
 */
function inferCategoriesFromKeywords(keywords: string[]): string[] {
  const inferredCategories = new Set<string>();
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Direct match in CATEGORY_KEYWORDS
    if (CATEGORY_KEYWORDS[keywordLower]) {
      for (const cat of CATEGORY_KEYWORDS[keywordLower]) {
        inferredCategories.add(cat);
      }
    }
    
    // Partial match (keyword contains known term)
    for (const [knownKeyword, categories] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywordLower.includes(knownKeyword) || knownKeyword.includes(keywordLower)) {
        for (const cat of categories) {
          inferredCategories.add(cat);
        }
      }
    }
  }
  
  return Array.from(inferredCategories);
}

/**
 * Calculate supplier relevance score based on product category and search query
 * Uses category matching, name/description similarity, and keyword extraction
 */
function calculateSupplierRelevanceScore(
  supplier: any,
  productCategory: string | undefined,
  searchKeywords: string[],
  productName: string,
  productDescription?: string
): { score: number; matchDetails: string[] } {
  let score = 0;
  const matchDetails: string[] = [];
  
  const supplierCategory = (supplier.category || '').toLowerCase();
  const supplierName = (supplier.business_name || '').toLowerCase();
  const supplierDesc = (supplier.description || '').toLowerCase();
  const prodCat = (productCategory || '').toLowerCase();
  const prodName = productName.toLowerCase();
  // Note: prodDesc available for future use
  
  // 1. CATEGORY MATCH (Highest priority - 40 points)
  if (prodCat && supplierCategory) {
    if (supplierCategory === prodCat) {
      score += 40;
      matchDetails.push('exact_category_match');
    } else if (supplierCategory.includes(prodCat) || prodCat.includes(supplierCategory)) {
      score += 30;
      matchDetails.push('partial_category_match');
    }
  }
  
  // 2. PRODUCT NAME MATCH IN SUPPLIER NAME/DESCRIPTION (20-25 points)
  // Extract key terms from product name (excluding common words)
  const productKeyTerms = prodName
    .split(/[\s,;:\-|\/\(\)\[\]\{\}_\*\.]+/)
    .filter(term => term.length > 2 && !['the', 'and', 'for', 'with', 'de', 'et', 'pour', 'avec'].includes(term));
  
  for (const term of productKeyTerms) {
    if (supplierName.includes(term)) {
      score += 25;
      matchDetails.push(`supplier_name_match:${term}`);
    }
    if (supplierDesc.includes(term)) {
      score += 15;
      matchDetails.push(`supplier_desc_match:${term}`);
    }
  }
  
  // 3. SEARCH KEYWORD MATCHES (10-15 points each)
  for (const keyword of searchKeywords) {
    if (keyword.length < 2) continue;
    const kw = keyword.toLowerCase();
    
    if (supplierName.includes(kw)) {
      score += 15;
      matchDetails.push(`keyword_name:${kw}`);
    }
    if (supplierDesc.includes(kw)) {
      score += 10;
      matchDetails.push(`keyword_desc:${kw}`);
    }
    if (supplierCategory.includes(kw)) {
      score += 12;
      matchDetails.push(`keyword_category:${kw}`);
    }
  }
  
  // 4. VERIFIED/APPROVED BOOST (10 points)
  if (supplier.verified && supplier.approved) {
    score += 10;
    matchDetails.push('verified_boost');
  }

  return { score, matchDetails };
}

/**
 * Enhanced keyword extraction with multi-word term support
 * Extracts both individual words and compound terms
 */
function extractSearchKeywords(query: string): string[] {
  if (!query) return [];
  
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
  
  // Extract compound terms first (multi-word keywords from knowledge base)
  const compoundKeywords: string[] = [];
  
  let workingText = normalized;
  for (const term of SORTED_COMPOUND_TERMS) {
    if (workingText.includes(term)) {
      compoundKeywords.push(term);
      workingText = workingText.replace(term, ' ');
    }
  }
  
  // Extract individual tokens from remaining text
  const tokens = workingText.split(/[\s,;:\-|\/\(\)\[\]\{\}_\*\.]+/);
  const singleKeywords = tokens.filter(
    (t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t)
  );
  
  return [...new Set([...compoundKeywords, ...singleKeywords])];
}

/**
 * Calculate product relevance score based on pre-lowercased strings
 * Optimized to avoid redundant .toLowerCase() calls
 */
function calculateProductRelevanceScoreOptimized(
  pName: string,
  pDesc: string,
  pCategory: string,
  pKeywords: string[] | undefined,
  fullQueryLower: string,
  keywords: string[],
  inferredCategories: string[],
  inferredCategoriesLower: string[]
): number {
  let score = 0;
  
  // 1. EXACT NAME MATCH (highest priority)
  if (pName === fullQueryLower) {
    score += 100;
  } else if (pName.includes(fullQueryLower)) {
    score += 50;
  }
  
  // 2. INDIVIDUAL KEYWORD MATCHES IN NAME/DESCRIPTION
  for (const kw of keywords) {
    if (kw.length < 2) continue;
    
    if (pName.includes(kw)) {
      score += 20;
      // Bonus if keyword is at start of name
      if (pName.startsWith(kw)) score += 10;
    }
    if (pDesc.includes(kw)) {
      score += 10;
    }
  }
  
  // 3. INFERRED CATEGORY MATCHING (major boost)
  if (inferredCategories.length > 0 && pCategory) {
    for (let i = 0; i < inferredCategories.length; i++) {
      const inferredCat = inferredCategories[i];
      const inferredCatLower = inferredCategoriesLower[i];
      
      // Exact category match
      if (pCategory === inferredCatLower) {
        score += 60;
      }
      // Partial category match
      else if (pCategory.includes(inferredCatLower) || inferredCatLower.includes(pCategory)) {
        score += 40;
      }
      
      // Check if product name contains keywords associated with inferred category
      const relatedKeywords = REVERSE_CATEGORY_MAP[inferredCat] || [];
      for (const relatedKw of relatedKeywords) {
        if (pName.includes(relatedKw)) {
          score += 15;
        }
      }
    }
  }
  
  // 4. KEYWORD MATCH IN PRODUCT KEYWORDS FIELD (if exists)
  if (pKeywords && Array.isArray(pKeywords)) {
    for (const kw of keywords) {
      if (pKeywords.some((pk: string) => pk.toLowerCase().includes(kw))) {
        score += 25;
      }
    }
  }
  
  return score;
}

/**
 * Public action: Alibaba-style product search with category-centric matching.
 * - Text search on product name/description
 * - Optional strict category filter
 * - Optional price range
 * - Optional filter on verified+approved suppliers
 */
export const searchProducts = action({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    minPrice: v.optional(v.float64()),
    maxPrice: v.optional(v.float64()),
    verifiedSupplier: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.string()), // 'relevance' | 'price_asc' | 'price_desc' | 'newest'
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || "relevance";

    const hasQuery = !!(args.q && args.q.trim());
    const keywords = hasQuery ? extractSearchKeywords(args.q!) : [];
    
    // Infer categories from search keywords (e.g., "riz" -> ["Agroalimentaire", "Céréales"])
    const inferredCategories = hasQuery ? inferCategoriesFromKeywords(keywords) : [];
    const inferredCategoriesLower = inferredCategories.map(cat => cat.toLowerCase());

    // Hard cap to keep memory bounded (applied inside internal query)
    // Increased to 10000 to accommodate all products (7753 total)
    const RAW_LIMIT = 10000;
    const rawProducts = await ctx.runQuery(
      internal.products._getProductsForSearchBase,
      {
        category: args.category,
        inferredCategories: inferredCategories.length > 0 ? inferredCategories : undefined,
        limit: RAW_LIMIT,
      }
    );

    type ScoredProduct = any & {
      _score: number;
      _suppliers?: any[] | null;
    };

    // OPTIMIZATION: Combine all filtering and scoring into a single pass loop
    const fullQueryLower = hasQuery ? args.q!.toLowerCase().trim() : "";
    const scored: ScoredProduct[] = [];

    for (const p of rawProducts) {
      const pCategory = (p.category || "").toLowerCase();

      // 1. Filter out service categories
      if (isServiceCategory(pCategory)) continue;

      const pName = (p.name || "").toLowerCase();
      const pDesc = (p.description || "").toLowerCase();

      // 2. Filter by name match if query exists
      if (hasQuery && !pName.includes(fullQueryLower)) continue;

      // 3. Price filters
      if (args.minPrice !== undefined && p.price < args.minPrice) continue;
      if (args.maxPrice !== undefined && p.price > args.maxPrice) continue;

      // 4. Calculate relevance score
      const score = hasQuery 
        ? calculateProductRelevanceScoreOptimized(
            pName,
            pDesc,
            pCategory,
            (p as any).keywords,
            fullQueryLower,
            keywords,
            inferredCategories,
            inferredCategoriesLower
          )
        : 0;

      // 5. Relevance threshold for queries
      if (hasQuery && score < 10) continue;

      scored.push({
        ...p,
        _score: score,
        _suppliers: null
      });
    }

    // Suppliers per CATEGORY
    const categoryToSuppliers = new Map<string, any[]>();
    
    // Combine product categories with inferred categories for coverage
    const productCategories = scored
      .map((p) => (p.category || "").toString())
      .filter((c) => c && c.trim().length > 0);
    
    const categoriesForMapping = Array.from(
      new Set([...productCategories, ...inferredCategories])
    );
    console.log(`Categories for mapping: ${categoriesForMapping.join(',')}`);

    // Pre-calculate matching product per category for O(1) lookup in supplier scoring loop
    const categoryToProductMap = new Map<string, any>();
    for (const p of scored) {
      if (p.category && !categoryToProductMap.has(p.category)) {
        categoryToProductMap.set(p.category, p);
      }
    }

    // Parallelize supplier fetching to reduce wall-clock time from sequential RTTs
    await Promise.all(categoriesForMapping.map(async (cat) => {
      try {
        const candidates = await ctx.runQuery(
          internal.suppliers._getSuppliersByCategory,
          { category: cat as string, limit: 50 }
        );
        if (candidates.length > 0) {
          // Filter out service category suppliers - ONLY if the target category itself isn't a service category
          const isTargetService = isServiceCategory(cat as string);
          const productSuppliers = candidates.filter((s: any) => {
            if (isTargetService) return true; // Keep all if we're explicitly looking for services
            return !isServiceCategory(s.category);
          });
          
          if (productSuppliers.length > 0) {
            // Score and sort suppliers using the new relevance scoring
            const scoredSuppliers = productSuppliers.map((s: any) => {
              // O(1) Lookup: Get the product that triggered this category search
              const matchingProduct = categoryToProductMap.get(cat as string);
              let score = 0;
              let matchDetails: string[] = [];
              try {
                const result = calculateSupplierRelevanceScore(
                  s,
                  cat as string,
                  keywords,
                  matchingProduct?.name || '',
                  matchingProduct?.description
                );
                score = result.score;
                matchDetails = result.matchDetails;
              } catch (err) {
                console.error(`Error calculating relevance score for supplier ${s._id}:`, err);
                score = 1;
                matchDetails = ['error_fallback'];
              }
              return {
                ...s,
                _supplierScore: score,
                _matchDetails: matchDetails,
              };
            });
            
            // Sort by the new relevance score
            const sorted = scoredSuppliers.sort((a: any, b: any) => {
              const scoreDiff = (b._supplierScore || 0) - (a._supplierScore || 0);
              if (scoreDiff !== 0) return scoreDiff;
              
              // Fallback to verified/rating sorting
              const aVerified = a.verified && a.approved ? 1 : 0;
              const bVerified = b.verified && b.approved ? 1 : 0;
              if (bVerified !== aVerified) return bVerified - aVerified;
              
              const aRating = a.rating ?? 0;
              const bRating = b.rating ?? 0;
              if (bRating !== aRating) return bRating - aRating;
              
              return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
            });
            
            categoryToSuppliers.set(cat as string, sorted);
          }
        }
      } catch (err) {
        console.error(`Error fetching suppliers for category "${cat}":`, err);
      }
    }));

    // Attach suppliers snapshots (all potential suppliers for the product's category)
    console.log(`Attaching suppliers to ${scored.length} products. Category map has ${categoryToSuppliers.size} categories`);

    // Cache for fallback suppliers to avoid redundant database queries
    let fallbackSuppliers: any[] | null = null;

    // Helper to get fallback suppliers lazily
    const getFallbackSuppliers = async () => {
      if (fallbackSuppliers) return fallbackSuppliers;

      console.log("Fetching fallback suppliers...");
      try {
        const result = await ctx.runQuery(internal.suppliers._getSuppliersPaginated, { limit: 50 });
        fallbackSuppliers = result.page.map(s => ({
          ...s,
          _supplierScore: 1, // Base score for fallback
          _matchDetails: ['fallback_match']
        }));
        return fallbackSuppliers;
      } catch (err) {
        console.error("Error fetching fallback suppliers:", err);
        return [];
      }
    };

    const finalScoredProducts: ScoredProduct[] = [];
    for (const p of scored) {
      let list: any[] = [];

      // Try exact category match first
      if (p.category && typeof p.category === "string") {
        list = categoryToSuppliers.get(p.category) || [];

        // If no exact match, try case-insensitive match
        if (list.length === 0) {
          const prodCatLower = p.category.toLowerCase().trim();
          for (const [mapCat, suppliers] of categoryToSuppliers.entries()) {
            if (mapCat.toLowerCase().trim() === prodCatLower) {
              list = suppliers;
              console.log(
                `Case-insensitive match: "${p.category}" -> "${mapCat}" (${suppliers.length} suppliers)`
              );
              break;
            }
          }
        }
      }

      // Fallback: if no suppliers for this category, fetch some approved ones
      if (list.length === 0) {
        list = await getFallbackSuppliers();
        console.log(
          `No suppliers for category "${p.category}", using ${list.length} fallback suppliers`
        );
      }

      console.log(
        `Product "${p.name}" (category: ${p.category}): ${list.length} suppliers attached`
      );

      finalScoredProducts.push({ ...p, _suppliers: list } as ScoredProduct);
    }

    scored = finalScoredProducts
      .filter((p) => {
        if (args.verifiedSupplier) {
          const list = p._suppliers || [];
          return list.some(
            (s: any) => s.verified === true && s.approved === true
          );
        }
        return true;
      });

    // Sorting
    scored.sort((a, b) => {
      if (sortBy === "price_asc") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === "price_desc") {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === "newest") {
        return (b.created_at || "").localeCompare(a.created_at || "");
      }

      // default: relevance (then rating, then newest)
      const scoreDiff = (b._score || 0) - (a._score || 0);
      if (scoreDiff !== 0) return scoreDiff;

      // Use supplier relevance scores for sorting
      const aSupplierScore = a._suppliers?.[0]?._supplierScore || 0;
      const bSupplierScore = b._suppliers?.[0]?._supplierScore || 0;
      if (bSupplierScore !== aSupplierScore) return bSupplierScore - aSupplierScore;

      const aRating =
        (a._suppliers && a._suppliers[0]?.rating) != null
          ? a._suppliers[0].rating
          : 0;
      const bRating =
        (b._suppliers && b._suppliers[0]?.rating) != null
          ? b._suppliers[0].rating
          : 0;
      if (bRating !== aRating) return bRating - aRating;

      return (b.created_at || "").localeCompare(a.created_at || "");
    });

    const total = scored.length;
    const page = scored.slice(offset, offset + limit).map((p) => {
      const { _score, _suppliers, ...productData } = p;

      const supplierSnapshots =
        (_suppliers || []).map((s: any) => ({
          id: s._id,
          name: s.business_name,
          rating: s.rating,
          reviews_count: s.reviews_count,
          verified: s.verified,
          location: s.location,
          city: s.city,
          state: s.state,
          category: s.category,
          matchScore: s._supplierScore || 0,
          matchConfidence: (s._supplierScore || 0) > 50 ? 'high' : (s._supplierScore || 0) > 25 ? 'medium' : 'low',
        })) ?? [];

      const primarySupplier = supplierSnapshots[0] || null;

      return {
        ...productData,
        supplier: primarySupplier,
        potentialSuppliers: supplierSnapshots,
        relevanceScore: _score,
      };
    });

    return { products: page, total };
  },
});

// ==========================================
// INTERNAL FUNCTIONS FOR SUPPLIER DEDUPLICATION
// ==========================================

/**
 * Internal query: Get products by supplier ID
 */
export const getProductsBySupplierIdInternal = internalQuery({
  args: {
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
  },
});

/**
 * Internal mutation: Update product supplier ID
 */
export const updateProductSupplierInternal = internalMutation({
  args: {
    productId: v.string(),
    newSupplierId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId as any, {
      supplierId: args.newSupplierId,
      updated_at: new Date().toISOString(),
    });
  },
});
