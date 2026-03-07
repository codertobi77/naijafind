import { internalMutation, internalQuery, mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Helper function to normalize strings for category matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Helper function to require admin authentication
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Non autorisé");

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();

  if (!user || !user.is_admin) {
    throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
  }
  return user;
}

// Type for supplier import data
interface SupplierImportData {
  user_email?: string;
  user_firstName?: string;
  user_lastName?: string;
  user_phone?: string;
  supplier_business_name: string;
  supplier_email?: string;
  supplier_phone?: string;
  supplier_category: string;
  supplier_description?: string;
  supplier_address?: string;
  supplier_city: string;
  supplier_state: string;
  supplier_country?: string;
  supplier_website?: string;
  supplier_business_type?: string;
  supplier_verified?: boolean;
  supplier_approved?: boolean;
  supplier_featured?: boolean;
  supplier_image?: string;
  supplier_imageGallery?: string[];
  supplier_business_hours?: Record<string, string>;
  supplier_social_links?: Record<string, string>;
  supplier_latitude?: number;
  supplier_longitude?: number;
}

// Helper function to import a single supplier with shared category cache
async function importSingleSupplierInternal(
  ctx: any, 
  args: SupplierImportData, 
  allCategories: any[], 
  now: string,
  skipNotification: boolean = false,
  categoryMaps?: { exact: Map<string, any>, normalized: Map<string, any> }
) {
  const userEmail = args.user_email || (args.user_phone ? `${args.user_phone.replace(/\D/g, '')}@phone.local` : `supplier-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@import.local`);
  const supplierEmail = args.supplier_email || userEmail;

  let user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", userEmail))
    .first();

  let userId: string;

  if (user) {
    userId = user._id;
    if (user.user_type !== 'supplier') {
      await ctx.db.patch(userId, {
        user_type: 'supplier',
        firstName: args.user_firstName || user.firstName,
        lastName: args.user_lastName || user.lastName,
        phone: args.user_phone || user.phone,
      });
    }
  } else {
    userId = await ctx.db.insert("users", {
      email: userEmail,
      firstName: args.user_firstName,
      lastName: args.user_lastName,
      phone: args.user_phone,
      user_type: 'supplier',
      is_admin: false,
      created_at: now,
    });
  }

  const existingSupplier = await ctx.db
    .query("suppliers")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .first();

  if (existingSupplier) {
    throw new Error(`Un fournisseur existe déjà pour l'utilisateur ${userEmail}`);
  }

  // Build category maps if not provided (for single imports or backward compatibility)
  const categoryByExact = categoryMaps?.exact ?? new Map<string, any>();
  const categoryByNormalized = categoryMaps?.normalized ?? new Map<string, any>();
  
  // If maps not provided, populate them from allCategories
  if (!categoryMaps) {
    for (const cat of allCategories) {
      categoryByExact.set(cat.name.toLowerCase().trim(), cat);
      categoryByNormalized.set(normalizeString(cat.name), cat);
    }
  }

  const input = (args.supplier_category ?? "").trim();
  let categoryName = input || "Autre";

  if (input) {
    const exact = categoryByExact.get(input.toLowerCase());
    const norm = categoryByNormalized.get(normalizeString(input));
    const matchedCategory = exact ?? norm;

    if (matchedCategory) {
      categoryName = matchedCategory.name;
    } else {
      // Fallback: use "Autre" category if it exists, otherwise default to "Autre" string
      const autreCategory = categoryByNormalized.get("autre") || categoryByNormalized.get("other");
      categoryName = autreCategory?.name || "Autre";
    }
  } else {
    categoryName = "Autre";
  }

  const defaultBusinessHours = {
    monday: "08:00-18:00",
    tuesday: "08:00-18:00",
    wednesday: "08:00-18:00",
    thursday: "08:00-18:00",
    friday: "08:00-18:00",
    saturday: "09:00-17:00",
    sunday: "closed"
  };

  const supplierId = await ctx.db.insert("suppliers", {
    userId: userId,
    business_name: args.supplier_business_name,
    email: supplierEmail,
    phone: args.supplier_phone,
    description: args.supplier_description,
    category: categoryName,
    address: args.supplier_address,
    city: args.supplier_city,
    state: args.supplier_state,
    country: args.supplier_country,
    location: `${args.supplier_city}, ${args.supplier_state}`,
    website: args.supplier_website,
    business_type: args.supplier_business_type || 'products',
    verified: args.supplier_verified ?? false,
    approved: args.supplier_approved ?? true,
    featured: args.supplier_featured ?? false,
    image: args.supplier_image,
    imageGallery: args.supplier_imageGallery,
    business_hours: args.supplier_business_hours || defaultBusinessHours,
    rating: args.supplier_rating ?? 0,
    reviews_count: args.supplier_reviews ? BigInt(args.supplier_reviews) : 0n,
    latitude: args.supplier_latitude,
    longitude: args.supplier_longitude,
    created_at: now,
    updated_at: now,
  });

  if (!skipNotification) {
    await ctx.db.insert('notifications', {
      userId: userId,
      type: 'system',
      title: 'Bienvenue sur Suji !',
      message: `Votre entreprise "${args.supplier_business_name}" a été créée avec succès.`,
      data: { supplierId, type: 'supplier_created' },
      read: false,
      actionUrl: '/dashboard',
      createdAt: now,
    });
  }

  return {
    success: true,
    userId,
    supplierId,
    message: `Fournisseur "${args.supplier_business_name}" créé avec succès`,
  };
}

// Import a single supplier with user
export const importSupplier = internalMutation({
  args: {
    user_email: v.optional(v.string()),
    user_firstName: v.optional(v.string()),
    user_lastName: v.optional(v.string()),
    user_phone: v.optional(v.string()),
    supplier_business_name: v.string(),
    supplier_email: v.optional(v.string()),
    supplier_phone: v.optional(v.string()),
    supplier_category: v.string(),
    supplier_description: v.optional(v.string()),
    supplier_address: v.optional(v.string()),
    supplier_city: v.string(),
    supplier_state: v.string(),
    supplier_country: v.optional(v.string()),
    supplier_website: v.optional(v.string()),
    supplier_business_type: v.optional(v.string()),
    supplier_verified: v.optional(v.boolean()),
    supplier_approved: v.optional(v.boolean()),
    supplier_featured: v.optional(v.boolean()),
    supplier_image: v.optional(v.string()),
    supplier_imageGallery: v.optional(v.array(v.string())),
    supplier_business_hours: v.optional(v.record(v.string(), v.string())),
    supplier_social_links: v.optional(v.record(v.string(), v.string())),
    supplier_latitude: v.optional(v.float64()),
    supplier_longitude: v.optional(v.float64()),
    supplier_rating: v.optional(v.float64()),
    supplier_reviews: v.optional(v.number()),
    supplier_google_place_id: v.optional(v.string()),
    supplier_source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Fetch categories once for single import
    const allCategories = await ctx.db
      .query("categories")
      .withIndex("is_active", (q: any) => q.eq("is_active", true))
      .take(100);
    
    return await importSingleSupplierInternal(ctx, args, allCategories, now, false);
  },
});

// Bulk import suppliers (admin only) - OPTIMIZED as Action for bandwidth efficiency
// Actions don't have reactive overhead, perfect for bulk operations
export const bulkImportSuppliers = action({
  args: {
    suppliers: v.array(v.object({
      user_email: v.optional(v.string()),
      user_firstName: v.optional(v.string()),
      user_lastName: v.optional(v.string()),
      user_phone: v.optional(v.string()),
      supplier_business_name: v.string(),
      supplier_email: v.optional(v.string()),
      supplier_phone: v.optional(v.string()),
      supplier_category: v.string(),
      supplier_description: v.optional(v.string()),
      supplier_address: v.optional(v.string()),
      supplier_city: v.string(),
      supplier_state: v.string(),
      supplier_country: v.optional(v.string()),
      supplier_website: v.optional(v.string()),
      supplier_business_type: v.optional(v.string()),
      supplier_verified: v.optional(v.boolean()),
      supplier_approved: v.optional(v.boolean()),
      supplier_featured: v.optional(v.boolean()),
      supplier_image: v.optional(v.string()),
      supplier_imageGallery: v.optional(v.array(v.string())),
      supplier_business_hours: v.optional(v.record(v.string(), v.string())),
      supplier_social_links: v.optional(v.record(v.string(), v.string())),
      supplier_latitude: v.optional(v.float64()),
      supplier_longitude: v.optional(v.float64()),
      supplier_rating: v.optional(v.float64()),
      supplier_reviews: v.optional(v.number()),
      supplier_google_place_id: v.optional(v.string()),
      supplier_source: v.optional(v.string()),
    })),
    skipNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin via internal mutation
    await ctx.runMutation(internal.adminImport.verifyAdminAction, {});

    const BATCH_SIZE_LIMIT = 50;
    
    // Enforce batch size limit to prevent bandwidth issues
    if (args.suppliers.length > BATCH_SIZE_LIMIT) {
      throw new Error(`Trop de fournisseurs à importer. Limite: ${BATCH_SIZE_LIMIT} par batch. Reçu: ${args.suppliers.length}`);
    }

    const now = new Date().toISOString();
    const skipNotifications = args.skipNotifications ?? true; // Default to skipping for bulk

    // Cache categories once for all imports in this batch (reduces bandwidth)
    const allCategories = await ctx.runQuery(internal.adminImport.getCategoriesForImport, {});

    const categoryByExact = new Map<string, any>();
    const categoryByNormalized = new Map<string, any>();

    for (const cat of allCategories) {
      categoryByExact.set(cat.name.toLowerCase().trim(), cat);
      categoryByNormalized.set(normalizeString(cat.name), cat);
    }

    const results = {
      success: [] as any[],
      errors: [] as any[],
      total: args.suppliers.length,
      created: 0,
      failed: 0,
    };

    // Process suppliers sequentially but with shared category cache
    for (const supplierData of args.suppliers) {
      try {
        // Convert category maps to record format for serialization
        const exactRecord: Record<string, string> = {};
        const normalizedRecord: Record<string, string> = {};
        
        categoryByExact.forEach((value, key) => {
          exactRecord[key] = value.name;
        });
        categoryByNormalized.forEach((value, key) => {
          normalizedRecord[key] = value.name;
        });
        
        const result = await ctx.runMutation(
          internal.adminImport.importSingleSupplierInternalAction,
          {
            ...supplierData,
            skipNotifications,
            categoryMaps: {
              exact: exactRecord,
              normalized: normalizedRecord,
            },
            now,
          }
        );
        results.success.push(result);
        results.created++;
      } catch (error: any) {
        results.errors.push({
          supplier: supplierData.supplier_business_name,
          email: supplierData.user_email,
          error: error.message,
        });
        results.failed++;
      }
    }

    return results;
  },
});

// Import single supplier via admin API (with admin auth and notification)
export const importSingleSupplier = mutation({
  args: {
    user_email: v.optional(v.string()),
    user_firstName: v.optional(v.string()),
    user_lastName: v.optional(v.string()),
    user_phone: v.optional(v.string()),
    supplier_business_name: v.string(),
    supplier_email: v.optional(v.string()),
    supplier_phone: v.optional(v.string()),
    supplier_category: v.string(),
    supplier_description: v.optional(v.string()),
    supplier_address: v.optional(v.string()),
    supplier_city: v.string(),
    supplier_state: v.string(),
    supplier_country: v.optional(v.string()),
    supplier_website: v.optional(v.string()),
    supplier_business_type: v.optional(v.string()),
    supplier_verified: v.optional(v.boolean()),
    supplier_approved: v.optional(v.boolean()),
    supplier_featured: v.optional(v.boolean()),
    supplier_image: v.optional(v.string()),
    supplier_imageGallery: v.optional(v.array(v.string())),
    supplier_business_hours: v.optional(v.record(v.string(), v.string())),
    supplier_social_links: v.optional(v.record(v.string(), v.string())),
    supplier_latitude: v.optional(v.float64()),
    supplier_longitude: v.optional(v.float64()),
    supplier_rating: v.optional(v.float64()),
    supplier_reviews: v.optional(v.number()),
    supplier_google_place_id: v.optional(v.string()),
    supplier_source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const now = new Date().toISOString();
    const allCategories = await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .take(100);
    
    return await importSingleSupplierInternal(ctx, args, allCategories, now, false);
  },
});

// Generated API reference for internal calls
import { api } from "./_generated/api";

// Scheduler-based bulk import: Start the import job and schedule chunks
// CONVERTED TO ACTION for better bandwidth handling of large imports
export const startBulkImport = action({
  args: {
    suppliers: v.array(v.object({
      user_email: v.optional(v.string()),
      user_firstName: v.optional(v.string()),
      user_lastName: v.optional(v.string()),
      user_phone: v.optional(v.string()),
      supplier_business_name: v.string(),
      supplier_email: v.optional(v.string()),
      supplier_phone: v.optional(v.string()),
      supplier_category: v.string(),
      supplier_description: v.optional(v.string()),
      supplier_address: v.optional(v.string()),
      supplier_city: v.string(),
      supplier_state: v.string(),
      supplier_country: v.optional(v.string()),
      supplier_website: v.optional(v.string()),
      supplier_business_type: v.optional(v.string()),
      supplier_verified: v.optional(v.boolean()),
      supplier_approved: v.optional(v.boolean()),
      supplier_featured: v.optional(v.boolean()),
      supplier_image: v.optional(v.string()),
      supplier_imageGallery: v.optional(v.array(v.string())),
      supplier_business_hours: v.optional(v.record(v.string(), v.string())),
      supplier_social_links: v.optional(v.record(v.string(), v.string())),
      supplier_latitude: v.optional(v.float64()),
      supplier_longitude: v.optional(v.float64()),
      supplier_rating: v.optional(v.float64()),
      supplier_reviews: v.optional(v.number()),
      supplier_google_place_id: v.optional(v.string()),
      supplier_source: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Verify admin via internal mutation
    const user = await ctx.runMutation(internal.adminImport.verifyAdminAction, {});
    const now = new Date().toISOString();

    // Create import job record via internal mutation
    const jobId = await ctx.runMutation(internal.adminImport.createImportJob, {
      totalSuppliers: args.suppliers.length,
      scheduledBy: user._id,
      now,
    });

    const CHUNK_SIZE = 15; // Process 15 suppliers at a time
    const chunks: any[][] = [];
    
    for (let i = 0; i < args.suppliers.length; i += CHUNK_SIZE) {
      chunks.push(args.suppliers.slice(i, i + CHUNK_SIZE));
    }

    // Schedule each chunk with runAfter (scheduler still works from actions)
    for (let index = 0; index < chunks.length; index++) {
      await ctx.scheduler.runAfter(0, internal.adminImport.processImportChunk, {
        jobId,
        chunkIndex: index,
        totalChunks: chunks.length,
        suppliers: chunks[index],
      });
    }

    return {
      success: true,
      jobId,
      message: `Import scheduled: ${args.suppliers.length} suppliers in ${chunks.length} chunks`,
    };
  },
});

// Internal mutation to process a chunk of suppliers
export const processImportChunk = internalMutation({
  args: {
    jobId: v.id("importJobs"),
    chunkIndex: v.number(),
    totalChunks: v.number(),
    suppliers: v.array(v.object({
      user_email: v.optional(v.string()),
      user_firstName: v.optional(v.string()),
      user_lastName: v.optional(v.string()),
      user_phone: v.optional(v.string()),
      supplier_business_name: v.string(),
      supplier_email: v.optional(v.string()),
      supplier_phone: v.optional(v.string()),
      supplier_category: v.string(),
      supplier_description: v.optional(v.string()),
      supplier_address: v.optional(v.string()),
      supplier_city: v.string(),
      supplier_state: v.string(),
      supplier_country: v.optional(v.string()),
      supplier_website: v.optional(v.string()),
      supplier_business_type: v.optional(v.string()),
      supplier_verified: v.optional(v.boolean()),
      supplier_approved: v.optional(v.boolean()),
      supplier_featured: v.optional(v.boolean()),
      supplier_image: v.optional(v.string()),
      supplier_imageGallery: v.optional(v.array(v.string())),
      supplier_business_hours: v.optional(v.record(v.string(), v.string())),
      supplier_social_links: v.optional(v.record(v.string(), v.string())),
      supplier_latitude: v.optional(v.float64()),
      supplier_longitude: v.optional(v.float64()),
      supplier_rating: v.optional(v.float64()),
      supplier_reviews: v.optional(v.number()),
      supplier_google_place_id: v.optional(v.string()),
      supplier_source: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Fetch all categories once per chunk
    const allCategories = await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .take(100);

    // Build category maps for O(1) lookups
    const categoryByExact = new Map<string, any>();
    const categoryByNormalized = new Map<string, any>();
    for (const cat of allCategories) {
      categoryByExact.set(cat.name.toLowerCase().trim(), cat);
      categoryByNormalized.set(normalizeString(cat.name), cat);
    }

    const categoryMaps = { exact: categoryByExact, normalized: categoryByNormalized };

    let successCount = 0;
    let errorCount = 0;
    const errors: { supplier: string; error: string }[] = [];

    // Process each supplier in the chunk
    for (const supplierData of args.suppliers) {
      try {
        await importSingleSupplierInternal(
          ctx,
          supplierData,
          allCategories,
          now,
          true, // skipNotifications
          categoryMaps
        );
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({
          supplier: supplierData.supplier_business_name,
          error: error.message,
        });
      }
    }

    // Update job progress
    const job = await ctx.db.get(args.jobId);
    if (job) {
      const updatedErrors = [...(job.errors || []), ...errors];
      const isComplete = args.chunkIndex === args.totalChunks - 1;
      
      await ctx.db.patch(args.jobId, {
        processedSuppliers: job.processedSuppliers + args.suppliers.length,
        successCount: job.successCount + successCount,
        errorCount: job.errorCount + errorCount,
        errors: updatedErrors.slice(0, 100), // Keep last 100 errors
        status: isComplete ? "completed" : "processing",
        completedAt: isComplete ? now : undefined,
      });
    }

    return {
      success: true,
      chunkIndex: args.chunkIndex,
      processed: args.suppliers.length,
      successCount,
      errorCount,
    };
  },
});

// Query to get import job status
export const getImportJobStatus = query({
  args: {
    jobId: v.id("importJobs"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    return job;
  },
});

// Query to list all import jobs
export const listImportJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const jobs = await ctx.db
      .query("importJobs")
      .order("desc")
      .take(args.limit ?? 20);
    return jobs;
  },
});

// ============================================================================
// INTERNAL HELPERS FOR ACTIONS - These support the bandwidth-optimized actions
// ============================================================================

// Internal mutation to verify admin authentication (called from actions)
export const verifyAdminAction = internalMutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Non autorisé");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    return { _id: user._id, email: user.email };
  },
});

// Internal query to get categories for import (called from actions)
export const getCategoriesForImport = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .take(100);
  },
});

// Internal mutation to create import job (called from actions)
export const createImportJob = internalMutation({
  args: {
    totalSuppliers: v.number(),
    scheduledBy: v.id("users"),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("importJobs", {
      status: "processing",
      totalSuppliers: args.totalSuppliers,
      processedSuppliers: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startedAt: args.now,
      scheduledBy: args.scheduledBy,
    });
  },
});

// Internal mutation for single supplier import from actions
export const importSingleSupplierInternalAction = internalMutation({
  args: {
    user_email: v.optional(v.string()),
    user_firstName: v.optional(v.string()),
    user_lastName: v.optional(v.string()),
    user_phone: v.optional(v.string()),
    supplier_business_name: v.string(),
    supplier_email: v.optional(v.string()),
    supplier_phone: v.optional(v.string()),
    supplier_category: v.string(),
    supplier_description: v.optional(v.string()),
    supplier_address: v.optional(v.string()),
    supplier_city: v.string(),
    supplier_state: v.string(),
    supplier_country: v.optional(v.string()),
    supplier_website: v.optional(v.string()),
    supplier_business_type: v.optional(v.string()),
    supplier_verified: v.optional(v.boolean()),
    supplier_approved: v.optional(v.boolean()),
    supplier_featured: v.optional(v.boolean()),
    supplier_image: v.optional(v.string()),
    supplier_imageGallery: v.optional(v.array(v.string())),
    supplier_business_hours: v.optional(v.record(v.string(), v.string())),
    supplier_social_links: v.optional(v.record(v.string(), v.string())),
    supplier_latitude: v.optional(v.float64()),
    supplier_longitude: v.optional(v.float64()),
    supplier_rating: v.optional(v.float64()),
    supplier_reviews: v.optional(v.number()),
    supplier_google_place_id: v.optional(v.string()),
    supplier_source: v.optional(v.string()),
    skipNotifications: v.boolean(),
    categoryMaps: v.record(v.string(), v.record(v.string(), v.string())),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    // Reconstruct category maps from serialized record
    const categoryByExact = new Map<string, any>();
    const categoryByNormalized = new Map<string, any>();
    
    // Parse the category maps from the serialized format
    for (const [key, value] of Object.entries(args.categoryMaps)) {
      if (key === 'exact') {
        for (const [catKey, catValue] of Object.entries(value)) {
          categoryByExact.set(catKey, { name: catValue });
        }
      } else if (key === 'normalized') {
        for (const [catKey, catValue] of Object.entries(value)) {
          categoryByNormalized.set(catKey, { name: catValue });
        }
      }
    }
    
    const allCategories = Array.from(categoryByExact.values());
    
    // Build the supplier data object
    const supplierData: SupplierImportData = {
      user_email: args.user_email,
      user_firstName: args.user_firstName,
      user_lastName: args.user_lastName,
      user_phone: args.user_phone,
      supplier_business_name: args.supplier_business_name,
      supplier_email: args.supplier_email,
      supplier_phone: args.supplier_phone,
      supplier_category: args.supplier_category,
      supplier_description: args.supplier_description,
      supplier_address: args.supplier_address,
      supplier_city: args.supplier_city,
      supplier_state: args.supplier_state,
      supplier_country: args.supplier_country,
      supplier_website: args.supplier_website,
      supplier_business_type: args.supplier_business_type,
      supplier_verified: args.supplier_verified,
      supplier_approved: args.supplier_approved,
      supplier_featured: args.supplier_featured,
      supplier_image: args.supplier_image,
      supplier_imageGallery: args.supplier_imageGallery,
      supplier_business_hours: args.supplier_business_hours,
      supplier_social_links: args.supplier_social_links,
      supplier_latitude: args.supplier_latitude,
      supplier_longitude: args.supplier_longitude,
    };

    const categoryMaps = { exact: categoryByExact, normalized: categoryByNormalized };
    
    return await importSingleSupplierInternal(
      ctx,
      supplierData,
      allCategories,
      args.now,
      args.skipNotifications,
      categoryMaps
    );
  },
});
