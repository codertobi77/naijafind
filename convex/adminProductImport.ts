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
    
    // If not found by email, try by business name using the new index
    if (!supplier && args.supplier_business_name) {
      supplier = await ctx.db
        .query("suppliers")
        .withIndex("business_name", (q: any) => q.eq("business_name", args.supplier_business_name))
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

// Create import items from product data
export const createProductImportItems = internalMutation({
  args: {
    jobId: v.id("productImportJobs"),
    items: v.array(v.object({
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
    now: v.string(),
  },
  handler: async (ctx, args) => {
    let insertedCount = 0;
    for (const item of args.items) {
      await ctx.db.insert("productImportItems", {
        jobId: args.jobId,
        name: item.name,
        price: item.price,
        stock: item.stock,
        status: "pending",
        category: item.category,
        description: item.description,
        images: item.images,
        supplier_email: item.supplier_email,
        supplier_business_name: item.supplier_business_name,
        createdAt: args.now,
      });
      insertedCount++;
    }
    return { insertedCount };
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
    
    // Count pending items using index
    const pendingItems = await ctx.db
      .query("productImportItems")
      .withIndex("jobId_status", (q) => 
        q.eq("jobId", args.jobId).eq("status", "pending")
      )
      .collect();
    
    return {
      ...job,
      pendingCount: pendingItems.length,
    };
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

// Query to get errors for a job
export const getProductImportJobErrors = query({
  args: {
    jobId: v.id("productImportJobs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const errors = await ctx.db
      .query("productImportErrors")
      .withIndex("jobId", (q) => q.eq("jobId", args.jobId))
      .order("desc")
      .take(args.limit ?? 100);
    return errors;
  },
});

// ============================================================================
// BULK PRODUCT IMPORT WITH SCHEDULER
// ============================================================================

// Action to start bulk product import - saves to DB and schedules processing
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

    // Save all products to productImportItems table in batches
    const SAVE_BATCH_SIZE = 100;
    for (let i = 0; i < args.products.length; i += SAVE_BATCH_SIZE) {
      const batch = args.products.slice(i, i + SAVE_BATCH_SIZE);
      await ctx.runMutation(internal.adminProductImport.createProductImportItems, {
        jobId,
        items: batch,
        now,
      });
    }

    // Schedule first processing batch
    await ctx.scheduler.runAfter(0, internal.adminProductImport.processProductImportBatch, {
      jobId,
      now,
    });

    return {
      success: true,
      jobId,
      message: `Import scheduled: ${args.products.length} products saved to database for processing`,
    };
  },
});

// Internal mutation to process a batch of pending items from DB
export const processProductImportBatch = internalMutation({
  args: {
    jobId: v.id("productImportJobs"),
    now: v.string(),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 5; // Small batch to limit memory per execution
    
    // Fetch categories using index (efficient)
    const allCategories = await ctx.db
      .query("categories")
      .withIndex("is_active", (q) => q.eq("is_active", true))
      .take(50);

    // Get pending items for this job (limited batch, indexed query)
    const pendingItems = await ctx.db
      .query("productImportItems")
      .withIndex("jobId_status", (q) => 
        q.eq("jobId", args.jobId).eq("status", "pending")
      )
      .take(BATCH_SIZE);

    // If no pending items, mark job as completed
    if (pendingItems.length === 0) {
      const job = await ctx.db.get(args.jobId);
      if (job && job.status === "processing") {
        await ctx.db.patch(args.jobId, {
          status: "completed",
          completedAt: args.now,
        });
      }
      return {
        success: true,
        processed: 0,
        hasMore: false,
      };
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each pending item
    for (const item of pendingItems) {
      try {
        const result = await importSingleProductInternal(
          ctx,
          {
            name: item.name,
            price: item.price,
            stock: item.stock,
            status: (item.status as any) || 'active',
            category: item.category,
            description: item.description,
            images: item.images,
            supplier_email: item.supplier_email,
            supplier_business_name: item.supplier_business_name,
          },
          allCategories,
          args.now
        );
        
        if (result.success) {
          successCount++;
          // Update item status to completed
          await ctx.db.patch(item._id, {
            status: "completed",
            processedAt: args.now,
          });
        } else {
          errorCount++;
          // Update item status to error
          await ctx.db.patch(item._id, {
            status: "error",
            errorMessage: result.error || 'Unknown error',
            processedAt: args.now,
          });
          // Log detailed error to productImportErrors
          await ctx.db.insert("productImportErrors", {
            jobId: args.jobId,
            productName: item.name,
            supplierEmail: item.supplier_email,
            supplierBusinessName: item.supplier_business_name,
            errorType: 'validation',
            errorMessage: result.error || 'Unknown error',
            rowData: {
              name: item.name,
              price: item.price,
              stock: item.stock,
              category: item.category,
            },
            createdAt: args.now,
          });
        }
      } catch (error: any) {
        errorCount++;
        // Update item status to error
        await ctx.db.patch(item._id, {
          status: "error",
          errorMessage: error.message,
          processedAt: args.now,
        });
        // Log detailed error to productImportErrors
        await ctx.db.insert("productImportErrors", {
          jobId: args.jobId,
          productName: item.name,
          supplierEmail: item.supplier_email,
          supplierBusinessName: item.supplier_business_name,
          errorType: 'server_error',
          errorMessage: error.message,
          rowData: {
            name: item.name,
            price: item.price,
            stock: item.stock,
            category: item.category,
          },
          createdAt: args.now,
        });
      }
    }

    // Update job progress
    const job = await ctx.db.get(args.jobId);
    if (job) {
      const newProcessed = job.processedProducts + pendingItems.length;
      const isComplete = pendingItems.length < BATCH_SIZE;
      
      await ctx.db.patch(args.jobId, {
        processedProducts: newProcessed,
        successCount: job.successCount + successCount,
        errorCount: job.errorCount + errorCount,
        status: isComplete ? "completed" : "processing",
        completedAt: isComplete ? args.now : undefined,
      });

      // Schedule next batch if not complete
      if (!isComplete) {
        await ctx.scheduler.runAfter(0, internal.adminProductImport.processProductImportBatch, {
          jobId: args.jobId,
          now: args.now,
        });
      }
    }

    return {
      success: true,
      processed: pendingItems.length,
      successCount,
      errorCount,
      hasMore: pendingItems.length === BATCH_SIZE,
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
      .withIndex("is_active", (q) => q.eq("is_active", true))
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
