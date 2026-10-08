import { internalAction } from "./_generated/server";
import { v } from "convex/values";
// logSend (journalisation email_log) vient de ./emailLogUtils : ce fichier ne
// doit PAS importer `internal` (api) — sendEmail.ts reste un module terminal,
// sinon l'enregistrement des internalActions déclenche la cascade TS2589
// (cf. emailLog.ts / paymentsData.ts, même pattern).
import { logEmailSend as logSend } from "./emailLogUtils";

/**
 * Internal action to send emails using Resend API
 * This is called by other mutations via scheduler
 *
 * Variables d'environnement Convex attendues :
 *   RESEND_API_KEY, FROM_EMAIL (ex: noreply@suji.ng)
 */
export const sendEmailAction = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    // NB : v.any() et non v.optional(v.string()) — un validateur VOptional
    // dans les args d'une internalAction déclenche TS2589 dans ce codebase
    // (ApiFromModules très large). v.any() accepte undefined : absent = sans
    // reply-to (géré dans le corps du handler).
    reply_to: v.any(),
  },
  // Annotation de retour explicite : casse la boucle d'inférence TS2589
  // (même pattern que purchaseRequests.ts _getRequestById).
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; error?: string; emailId?: string }> => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      await logSend(ctx, {
        to: args.to,
        subject: args.subject,
        status: "failed",
        error: "RESEND_API_KEY not configured",
      });
      return { success: false, error: "Email service not configured" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: args.to,
          subject: args.subject,
          html: args.html,
          ...(args.reply_to ? { reply_to: args.reply_to } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Resend API error:", error);
        const message = (error as { message?: string }).message || "Failed to send email";
        await logSend(ctx, {
          to: args.to,
          subject: args.subject,
          status: "failed",
          error: message,
        });
        return { success: false, error: message };
      }

      const data = await response.json();
      await logSend(ctx, {
        to: args.to,
        subject: args.subject,
        status: "sent",
        resendId: data.id,
      });
      return { success: true, emailId: data.id };
    } catch (error) {
      console.error("Failed to send email:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
      await logSend(ctx, {
        to: args.to,
        subject: args.subject,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Internal action : envoi par lots via l'endpoint batch Resend
 * (https://api.resend.com/emails/batch, limite 100 destinataires par appel).
 * Utilisée par la newsletter (chunks de 100). Journalise une ligne
 * email_log par destinataire.
 */
export const sendEmailBatchAction = internalAction({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
  },
  // Annotation de retour explicite (cf. sendEmailAction) : évite TS2589.
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; error?: string; sent: number }> => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      for (const recipient of args.to) {
        await logSend(ctx, {
          to: recipient,
          subject: args.subject,
          status: "failed",
          error: "RESEND_API_KEY not configured",
        });
      }
      return { success: false, error: "Email service not configured", sent: 0 };
    }

    try {
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
        args.to.map((recipient: string) => ({
            from: FROM_EMAIL,
            to: recipient,
            subject: args.subject,
            html: args.html,
          }))
        ),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Resend batch API error:", error);
        const message = (error as { message?: string }).message || "Failed to send batch";
        for (const recipient of args.to) {
          await logSend(ctx, {
            to: recipient,
            subject: args.subject,
            status: "failed",
            error: message,
          });
        }
        return { success: false, error: message, sent: 0 };
      }

      // Réponse attendue : un tableau [{ id, to }, ...] dans l'ordre des envois.
      let results: { id?: string; to?: string }[] = [];
      try {
        results = await response.json();
      } catch {
        results = [];
      }
      for (let i = 0; i < args.to.length; i++) {
        const recipient = args.to[i];
        const match = results.find((r) => r.to === recipient) ?? results[i];
        await logSend(ctx, {
          to: recipient,
          subject: args.subject,
          status: "sent",
          resendId: match?.id,
        });
      }
      return { success: true, sent: args.to.length };
    } catch (error) {
      console.error("Failed to send batch email:", error);
      for (const recipient of args.to) {
        await logSend(ctx, {
          to: recipient,
          subject: args.subject,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        sent: 0,
      };
    }
  },
});
