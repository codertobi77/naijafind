import { internalMutation, internalQuery, mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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

// Type for product import data
interface ProductImportData {
  name: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  category?: string;
  description?: string;
  images?: string[];
  supplier_email?: string;
  supplier_business_name?: string;
}

// Helper function to import a single product
async function importSingleProductInternal(
  ctx: any,
  args: ProductImportData,
  allCategories: any[],
  now: string
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    // Find supplier by email or business name
    let supplier: any = null;
    
    if (args.supplier_email) {
      // First try to find user by email
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", args.supplier_email))
        .first();
      
      if (user) {
        // Find supplier by userId
        supplier = await ctx.db
          .query("suppliers")
          .withIndex("userId", (q: any) => q.eq("userId", user._id))
          .first();
      }
    }
    
    // If not found by email, try by business name
    if (!supplier && args.supplier_business_name) {
      supplier = await ctx.db
        .query("suppliers")
        .filter((q: any) => q.eq(q.field("business_name"), args.supplier_business_name))
        .first();
    }

    // Validate category if provided
    let categoryName = args.category;
    if (categoryName) {
      const matchedCategory = allCategories.find(
        (cat: any) => cat.name.toLowerCase() === categoryName?.toLowerCase()
      );
      if (matchedCategory) {
        categoryName = matchedCategory.name;
      } else {
        // Default to first category if not found
        categoryName = allCategories[0]?.name || 'General';
      }
    } else {
      categoryName = allCategories[0]?.name || 'General';
    }

    // Create the product
    const productData: any = {
      supplierId: supplier?._id || 'unassigned',
      name: args.name,
      price: args.price,
      stock: BigInt(args.stock),
      status: args.status || 'active',
      category: categoryName,
      description: args.description,
      images: args.images,
      created_at: now,
      updated_at: now,
    };

    const productId = await ctx.db.insert("products", productData);

    // Update global stats
    await ctx.scheduler.runAfter(0, internal.stats.incrementStat, {
      key: "totalProducts",
      amount: 1,
      category: "global",
    });

    return {
      success: true,
      productId: productId as string,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// PRODUCT IMPORT JOB MANAGEMENT
// ============================================================================

// Create a new product import job
export const createProductImportJob = internalMutation({
  args: {
    totalProducts: v.number(),
    scheduledBy: v.id("users"),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("productImportJobs", {
      status: "processing",
      totalProducts: args.totalProducts,
      processedProducts: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startedAt: args.now,
      scheduledBy: args.scheduledBy,
    });
  },
});

// Query to get product import job status
export const getProductImportJobStatus = query({
  args: {
    jobId: v.id("productImportJobs"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    return job;
  },
});

// Query to list all product import jobs
export const listProductImportJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const jobs = await ctx.db
      .query("productImportJobs")
      .order("desc")
      .take(args.limit ?? 20);
    return jobs;
  },
});

// ============================================================================
// BULK PRODUCT IMPORT WITH SCHEDULER
// ============================================================================

// Action to start bulk product import using scheduler for resource management
export const startBulkProductImport = action({
  args: {
    products: v.array(v.object({
      name: v.string(),
      price: v.number(),
      stock: v.number(),
      status: v.optional(v.string()),
      category: v.optional(v.string()),
      description: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      supplier_email: v.optional(v.string()),
      supplier_business_name: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Verify admin via internal mutation
    const user = await ctx.runMutation(internal.adminProductImport.verifyAdminAction, {});
    const now = new Date().toISOString();

    // Create import job record
    const jobId = await ctx.runMutation(internal.adminProductImport.createProductImportJob, {
      totalProducts: args.products.length,
      scheduledBy: user._id,
      now,
    });

    const CHUNK_SIZE = 10; // Process 10 products at a time to limit resource consumption
    const chunks: any[][] = [];
    
    for (let i = 0; i < args.products.length; i += CHUNK_SIZE) {
      chunks.push(args.products.slice(i, i + CHUNK_SIZE));
    }

    // Schedule each chunk with runAfter (scheduler)
    for (let index = 0; index < chunks.length; index++) {
      await ctx.scheduler.runAfter(0, internal.adminProductImport.processProductImportChunk, {
        jobId,
        chunkIndex: index,
        totalChunks: chunks.length,
        products: chunks[index],
      });
    }

    return {
      success: true,
      jobId,
      message: `Import scheduled: ${args.products.length} products in ${chunks.length} chunks`,
    };
  },
});

// Internal mutation to process a chunk of products
export const processProductImportChunk = internalMutation({
  args: {
    jobId: v.id("productImportJobs"),
    chunkIndex: v.number(),
    totalChunks: v.number(),
    products: v.array(v.object({
      name: v.string(),
      price: v.number(),
      stock: v.number(),
      status: v.optional(v.string()),
      category: v.optional(v.string()),
      description: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      supplier_email: v.optional(v.string()),
      supplier_business_name: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Fetch all categories once per chunk (for efficiency)
    const allCategories = await ctx.db
      .query("categories")
      .filter(q => q.eq(q.field("is_active"), true))
      .take(100);

    let successCount = 0;
    let errorCount = 0;
    const errors: { product: string; error: string }[] = [];

    // Process each product in the chunk
    for (const productData of args.products) {
      try {
        const result = await importSingleProductInternal(
          ctx,
          {
            name: productData.name,
            price: productData.price,
            stock: productData.stock,
            status: (productData.status as any) || 'active',
            category: productData.category,
            description: productData.description,
            images: productData.images,
            supplier_email: productData.supplier_email,
            supplier_business_name: productData.supplier_business_name,
          },
          allCategories,
          now
        );
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push({
            product: productData.name,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error: any) {
        errorCount++;
        errors.push({
          product: productData.name,
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
        processedProducts: job.processedProducts + args.products.length,
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
      processed: args.products.length,
      successCount,
      errorCount,
    };
  },
});

// ============================================================================
// INTERNAL HELPERS
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

// Get categories for import (called from actions)
export const getCategoriesForImport = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .take(100);
  },
});

// Import single product via admin API
export const importSingleProduct = mutation({
  args: {
    name: v.string(),
    price: v.float64(),
    stock: v.int64(),
    status: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    supplier_email: v.optional(v.string()),
    supplier_business_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const now = new Date().toISOString();
    const allCategories = await ctx.db
      .query("categories")
      .filter(q => q.eq(q.field("is_active"), true))
      .take(100);
    
    const result = await importSingleProductInternal(
      ctx,
      {
        name: args.name,
        price: args.price,
        stock: Number(args.stock),
        status: args.status as any,
        category: args.category,
        description: args.description,
        images: args.images,
        supplier_email: args.supplier_email,
        supplier_business_name: args.supplier_business_name,
      },
      allCategories,
      now
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Import failed');
    }
    
    return { success: true, productId: result.productId };
  },
});
