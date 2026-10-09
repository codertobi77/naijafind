// ==========================================
// EMAIL — journal des envois (email_log)
// ==========================================
// Séparé de sendEmail.ts : aucun module ne doit référencer
// `internal.<lui-même>` — les auto-références intra-module créent une
// instanciation circulaire des types dans ApiFromModules, qui déclenche
// une cascade TS2589 / TS7022 (cf. paymentsData.ts, même pattern).
// Ce fichier ne référence AUCUNE fonction api/internal : graphe de types
// acyclique (terminal).

import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

/**
 * Internal mutation : journaliser une tentative d'envoi d'email.
 * Une ligne par envoi, quel que soit le résultat (succès, échec API,
 * configuration absente, exception). Best-effort : un échec du log
 * ne remonte pas (console.error uniquement).
 */
export const _logEmailSend = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    status: v.string(), // 'sent' | 'failed'
    resendId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    try {
      await ctx.db.insert("email_log", {
        to: args.to,
        subject: args.subject,
        status: args.status,
        resendId: args.resendId,
        error: args.error,
        createdAt: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to write email_log entry:", logError);
    }
  },
});

/**
 * Journal d'envois email (admin only) — les plus récentes d'abord.
 * `status` optionnel : 'sent' | 'failed'. Les requêtes publiques n'importent
 * pas `internal` : le module reste terminal (pas de cycle TS2589).
 */
export const getEmailLog = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()), // 'sent' | 'failed'
  },
  handler: async (ctx, args): Promise<Doc<"email_log">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }

    const limit = Math.min(args.limit ?? 100, 500);

    // `const` local : conserve le narrowing (string, pas string | undefined)
    // dans la callback withIndex (même pattern que getAllPurchaseRequests).
    const status = args.status;
    const rows = status
      ? await ctx.db
          .query("email_log")
          .withIndex("status", (q) => q.eq("status", status))
          .order("desc")
          .take(limit)
      : await ctx.db.query("email_log").order("desc").take(limit);

    // L'index status trie par (status, _id) : ~ordre d'insertion. Tri exact
    // par createdAt pour garantir l'ordre chronologique inverse.
    return rows.sort(
      (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)
    );
  },
});

/**
 * Statistiques du journal email (admin only) — compteurs sent/failed.
 * Comptage borné (take 10 000, même pattern que getPurchaseRequestStats).
 */
export const getEmailLogStats = query({
  args: {},
  handler: async (ctx): Promise<{ sent: number; failed: number; total: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user?.is_admin) {
      throw new Error("Accès refusé. Admin uniquement.");
    }

    const countByStatus = async (status: string) =>
      (await ctx.db
        .query("email_log")
        .withIndex("status", (q) => q.eq("status", status))
        .take(10000)).length;

    const sent = await countByStatus("sent");
    const failed = await countByStatus("failed");

    return { sent, failed, total: sent + failed };
  },
});
