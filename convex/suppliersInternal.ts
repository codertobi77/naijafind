import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ==========================================
// INTERNAL QUERIES FOR SUPPLIER MANAGEMENT
// ==========================================

/**
 * Récupérer tous les suppliers (pour l'action de dédoublonnage)
 */
export const getAllSuppliersInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("suppliers").collect();
  },
});

/**
 * Récupérer les candidates par supplierId
 */
export const getCandidatesBySupplierIdInternal = internalQuery({
  args: {
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productSupplierCandidates")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
  },
});

/**
 * Vérifier si un candidat existe déjà pour un produit/supplier
 */
export const getCandidateByProductAndSupplierInternal = internalQuery({
  args: {
    productId: v.string(),
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productSupplierCandidates")
      .withIndex("productId", (q) => 
        q.eq("productId", args.productId as Id<"products">)
      )
      .filter((q) => q.eq(q.field("supplierId"), args.supplierId as Id<"suppliers">))
      .first();
  },
});

// ==========================================
// INTERNAL MUTATIONS FOR SUPPLIER MANAGEMENT
// ==========================================

/**
 * Supprimer un supplier (usage interne pour dédoublonnage)
 */
export const deleteSupplierInternal = internalMutation({
  args: {
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.supplierId as Id<"suppliers">);
  },
});

/**
 * Mettre à jour le supplierId d'un candidate
 */
export const updateCandidateSupplierInternal = internalMutation({
  args: {
    candidateId: v.string(),
    newSupplierId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId as Id<"productSupplierCandidates">, {
      supplierId: args.newSupplierId as Id<"suppliers">,
      updatedAt: new Date().toISOString(),
    });
  },
});

/**
 * Supprimer un candidate
 */
export const deleteCandidateInternal = internalMutation({
  args: {
    candidateId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.candidateId as Id<"productSupplierCandidates">);
  },
});
