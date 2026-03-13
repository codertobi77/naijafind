import { mutation, action, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ==========================================
// PRODUCT TRANSLATION WITH DEEPL
// ==========================================

/**
 * Supported target languages for product translation
 * Must align with DEEPL_TARGET_LANG_MAP in translation.ts
 */
const SUPPORTED_PRODUCT_LANGUAGES = [
  "en", "fr", "de", "es", "it", "pt", "nl", "pl", "ru", "ja", "zh",
] as const;

type SupportedLanguage = typeof SUPPORTED_PRODUCT_LANGUAGES[number];

/**
 * Helper: Check if language is supported for product translation
 */
function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_PRODUCT_LANGUAGES.includes(lang as SupportedLanguage);
}

// ==========================================
// INTERNAL MUTATIONS
// ==========================================

/**
 * Internal: Upsert product translation
 */
export const _upsertProductTranslation = internalMutation({
  args: {
    productId: v.id("products"),
    language: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    translatedBy: v.union(v.literal("deepl"), v.literal("manual"), v.literal("import")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check if translation exists
    const existing = await ctx.db
      .query("productTranslations")
      .withIndex("productId_language", (q) =>
        q.eq("productId", args.productId).eq("language", args.language)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name ?? existing.name,
        description: args.description ?? existing.description,
        shortDescription: args.shortDescription ?? existing.shortDescription,
        keywords: args.keywords ?? existing.keywords,
        translatedAt: now,
        translatedBy: args.translatedBy,
        translationStatus: "completed",
      });
      return { id: existing._id, action: "updated" };
    } else {
      const id = await ctx.db.insert("productTranslations", {
        productId: args.productId,
        language: args.language,
        name: args.name,
        description: args.description,
        shortDescription: args.shortDescription,
        keywords: args.keywords,
        translatedAt: now,
        translatedBy: args.translatedBy,
        translationStatus: "completed",
      });
      return { id, action: "created" };
    }
  },
});

// ==========================================
// PUBLIC ACTIONS FOR TRANSLATION
// ==========================================

/**
 * Action: Translate a single product field using DeepL
 * Call this to explicitly translate product content
 */
export const translateProductField = action({
  args: {
    productId: v.id("products"),
    field: v.union(v.literal("name"), v.literal("description"), v.literal("shortDescription")),
    targetLang: v.string(),
    sourceLang: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isSupportedLanguage(args.targetLang)) {
      return {
        success: false,
        error: `Unsupported language: ${args.targetLang}`,
      };
    }

    // Get product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Get text to translate
    let textToTranslate: string | null = null;
    switch (args.field) {
      case "name":
        textToTranslate = product.name;
        break;
      case "description":
        textToTranslate = product.description;
        break;
      case "shortDescription":
        textToTranslate = product.shortDescription;
        break;
    }

    if (!textToTranslate || textToTranslate.trim().length === 0) {
      return {
        success: false,
        error: `Field ${args.field} is empty`,
      };
    }

    // Call DeepL translation
    const translation = await ctx.runAction(internal.translation.translateText, {
      text: textToTranslate,
      targetLang: args.targetLang,
      sourceLang: args.sourceLang || product.originalLanguage || undefined,
    });

    if (!translation.success) {
      return {
        success: false,
        error: translation.error || "Translation failed",
      };
    }

    // Store translation
    await ctx.runMutation(internal.productTranslation._upsertProductTranslation, {
      productId: args.productId,
      language: args.targetLang,
      ...(args.field === "name" && { name: translation.translatedText }),
      ...(args.field === "description" && { description: translation.translatedText }),
      ...(args.field === "shortDescription" && {
        shortDescription: translation.translatedText,
      }),
      translatedBy: "deepl",
    });

    return {
      success: true,
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
    };
  },
});

/**
 * Action: Translate all translatable fields of a product
 * More efficient than calling translateProductField multiple times
 */
export const translateProduct = action({
  args: {
    productId: v.id("products"),
    targetLang: v.string(),
    translateName: v.optional(v.boolean()),
    translateDescription: v.optional(v.boolean()),
    translateShortDescription: v.optional(v.boolean()),
    translateKeywords: v.optional(v.boolean()),
    sourceLang: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isSupportedLanguage(args.targetLang)) {
      return {
        success: false,
        error: `Unsupported language: ${args.targetLang}`,
      };
    }

    // Get product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const sourceLang = args.sourceLang || product.originalLanguage || "en";

    // Build list of texts to translate
    const textsToTranslate: string[] = [];
    const fieldMap: { field: string; index: number }[] = [];

    if (args.translateName !== false && product.name) {
      fieldMap.push({ field: "name", index: textsToTranslate.length });
      textsToTranslate.push(product.name);
    }

    if (args.translateDescription !== false && product.description) {
      fieldMap.push({ field: "description", index: textsToTranslate.length });
      textsToTranslate.push(product.description);
    }

    if (args.translateShortDescription !== false && product.shortDescription) {
      fieldMap.push({ field: "shortDescription", index: textsToTranslate.length });
      textsToTranslate.push(product.shortDescription);
    }

    // Keywords need individual translation
    const originalKeywords = product.keywords || [];
    const keywordStartIndex = textsToTranslate.length;
    if (args.translateKeywords !== false && originalKeywords.length > 0) {
      for (const kw of originalKeywords) {
        textsToTranslate.push(kw);
      }
    }

    if (textsToTranslate.length === 0) {
      return {
        success: false,
        error: "No content to translate",
      };
    }

    // Call batch translation
    const batchResult = await ctx.runAction(internal.translation.translateBatch, {
      texts: textsToTranslate,
      targetLang: args.targetLang,
      sourceLang,
    });

    if (!batchResult.success || !batchResult.translations) {
      return {
        success: false,
        error: batchResult.error || "Batch translation failed",
      };
    }

    // Build translation payload
    const translationPayload: {
      name?: string;
      description?: string;
      shortDescription?: string;
      keywords?: string[];
    } = {};

    for (const mapping of fieldMap) {
      const translation = batchResult.translations[mapping.index];
      if (translation) {
        switch (mapping.field) {
          case "name":
            translationPayload.name = translation.translatedText;
            break;
          case "description":
            translationPayload.description = translation.translatedText;
            break;
          case "shortDescription":
            translationPayload.shortDescription = translation.translatedText;
            break;
        }
      }
    }

    // Process keywords
    if (args.translateKeywords !== false && originalKeywords.length > 0) {
      const translatedKeywords: string[] = [];
      for (let i = 0; i < originalKeywords.length; i++) {
        const translation = batchResult.translations[keywordStartIndex + i];
        if (translation) {
          translatedKeywords.push(translation.translatedText);
        }
      }
      if (translatedKeywords.length > 0) {
        translationPayload.keywords = translatedKeywords;
      }
    }

    // Store translation
    await ctx.runMutation(internal.productTranslation._upsertProductTranslation, {
      productId: args.productId,
      language: args.targetLang,
      ...translationPayload,
      translatedBy: "deepl",
    });

    return {
      success: true,
      fieldsTranslated: fieldMap.map((f) => f.field),
      keywordsTranslated: translationPayload.keywords?.length || 0,
    };
  },
});

/**
 * Action: Translate multiple products at once (admin batch operation)
 * Use with caution - respects DeepL API limits
 */
export const batchTranslateProducts = action({
  args: {
    productIds: v.array(v.id("products")),
    targetLang: v.string(),
    fields: v.optional(
      v.object({
        name: v.optional(v.boolean()),
        description: v.optional(v.boolean()),
        shortDescription: v.optional(v.boolean()),
        keywords: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await ctx.runQuery(internal.users._getUserByEmail, {
      email: identity.email ?? "",
    });

    if (!user?.is_admin && user?.user_type !== "admin") {
      return { success: false, error: "Admin only" };
    }

    if (!isSupportedLanguage(args.targetLang)) {
      return {
        success: false,
        error: `Unsupported language: ${args.targetLang}`,
      };
    }

    const results: { productId: string; success: boolean; error?: string }[] = [];

    // Process in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < args.productIds.length; i += BATCH_SIZE) {
      const batch = args.productIds.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (productId) => {
          try {
            const result = await ctx.runAction(
              internal.productTranslation.translateProduct,
              {
                productId,
                targetLang: args.targetLang,
                translateName: args.fields?.name ?? true,
                translateDescription: args.fields?.description ?? true,
                translateShortDescription: args.fields?.shortDescription ?? true,
                translateKeywords: args.fields?.keywords ?? true,
              }
            );

            results.push({
              productId,
              success: result.success,
              error: result.error,
            });
          } catch (error) {
            results.push({
              productId,
              success: false,
              error: String(error),
            });
          }
        })
      );

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < args.productIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return {
      success: true,
      totalProcessed: results.length,
      successCount,
      failureCount,
      results,
    };
  },
});

// ==========================================
// PUBLIC QUERIES
// ==========================================

/**
 * Query: Get product translation for a specific language
 * Returns null if no translation exists
 */
export const getProductTranslation = query({
  args: {
    productId: v.id("products"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const translation = await ctx.db
      .query("productTranslations")
      .withIndex("productId_language", (q) =>
        q.eq("productId", args.productId).eq("language", args.language)
      )
      .first();

    if (!translation || translation.translationStatus !== "completed") {
      return null;
    }

    return {
      productId: translation.productId,
      language: translation.language,
      name: translation.name,
      description: translation.description,
      shortDescription: translation.shortDescription,
      keywords: translation.keywords,
      translatedAt: translation.translatedAt,
      translatedBy: translation.translatedBy,
    };
  },
});

/**
 * Query: Get all translations for a product
 */
export const getProductAllTranslations = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const translations = await ctx.db
      .query("productTranslations")
      .withIndex("productId", (q) => q.eq("productId", args.productId))
      .collect();

    return translations
      .filter((t) => t.translationStatus === "completed")
      .map((t) => ({
        language: t.language,
        name: t.name,
        description: t.description,
        shortDescription: t.shortDescription,
        keywords: t.keywords,
        translatedAt: t.translatedAt,
        translatedBy: t.translatedBy,
      }));
  },
});

/**
 * Query: Get product with fallback translation
 * Returns the product with translated fields if available,
 * otherwise returns original fields
 */
export const getProductWithTranslation = query({
  args: {
    productId: v.id("products"),
    language: v.string(),
    fallbackToOriginal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    // If requesting original language, return as-is
    if (product.originalLanguage === args.language) {
      return {
        ...product,
        _displayLanguage: args.language,
        _translationApplied: false,
      };
    }

    // Try to get translation
    const translation = await ctx.db
      .query("productTranslations")
      .withIndex("productId_language", (q) =>
        q.eq("productId", args.productId).eq("language", args.language)
      )
      .first();

    if (translation && translation.translationStatus === "completed") {
      return {
        ...product,
        name: translation.name || product.name,
        description: translation.description || product.description,
        shortDescription: translation.shortDescription || product.shortDescription,
        keywords: translation.keywords || product.keywords,
        _displayLanguage: args.language,
        _translationApplied: true,
      };
    }

    // No translation - return original or null based on fallback setting
    if (args.fallbackToOriginal !== false) {
      return {
        ...product,
        _displayLanguage: product.originalLanguage || "en",
        _translationApplied: false,
      };
    }

    return null;
  },
});

// ==========================================
// ADMIN MUTATIONS
// ==========================================

/**
 * Mutation: Manually set a product translation
 * Use this for manual corrections or import workflows
 */
export const setProductTranslation = mutation({
  args: {
    productId: v.id("products"),
    language: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user?.is_admin && user?.user_type !== "admin") {
      throw new Error("Admin only");
    }

    await ctx.runMutation(internal.productTranslation._upsertProductTranslation, {
      productId: args.productId,
      language: args.language,
      name: args.name,
      description: args.description,
      shortDescription: args.shortDescription,
      keywords: args.keywords,
      translatedBy: "manual",
    });

    return { success: true };
  },
});

/**
 * Mutation: Delete a product translation
 */
export const deleteProductTranslation = mutation({
  args: {
    productId: v.id("products"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    if (!user?.is_admin && user?.user_type !== "admin") {
      throw new Error("Admin only");
    }

    const translation = await ctx.db
      .query("productTranslations")
      .withIndex("productId_language", (q) =>
        q.eq("productId", args.productId).eq("language", args.language)
      )
      .first();

    if (translation) {
      await ctx.db.delete(translation._id);
    }

    return { success: true };
  },
});

/**
 * Mutation: Set a product's original language
 * This should be called when creating/updating products
 */
export const setProductOriginalLanguage = mutation({
  args: {
    productId: v.id("products"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify ownership (supplier or admin)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    // Check if user owns this product or is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    const isAdmin = user?.is_admin || user?.user_type === "admin";
    const isOwner = product.supplierId === identity.subject; // Simplified check

    if (!isAdmin && !isOwner) {
      throw new Error("Not authorized to modify this product");
    }

    await ctx.db.patch(args.productId, {
      originalLanguage: args.language,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  },
});
