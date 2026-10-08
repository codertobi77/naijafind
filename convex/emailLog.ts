// ==========================================
// EMAIL — journal des envois (email_log)
// ==========================================
// Séparé de sendEmail.ts : aucun module ne doit référencer
// `internal.<lui-même>` — les auto-références intra-module créent une
// instanciation circulaire des types dans ApiFromModules, qui déclenche
// une cascade TS2589 / TS7022 (cf. paymentsData.ts, même pattern).
// Ce fichier ne référence AUCUNE fonction api/internal : graphe de types
// acyclique (terminal).

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
