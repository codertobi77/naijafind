// ==========================================
// EMAIL — utilitaires du journal des envois (helpers purs)
// ==========================================
// Aucune fonction Convex n'est enregistrée ici : ce module n'existe dans
// ApiFromModules que comme objet vide — son import `internal` ne crée
// donc aucun cycle de types. C'est ce qui permet à sendEmail.ts de rester
// un module terminal (sans import api) : l'enregistrement d'internalActions
// dans un module qui importe `internal` déclenche la cascade TS2589
// (cf. emailLog.ts / paymentsData.ts pour le pattern complet).

import { internal } from "./_generated/api";

/**
 * Journalisation best-effort d'une tentative d'envoi d'email (table
 * email_log via emailLog._logEmailSend). Un échec du log ne remonte
 * jamais (console.error uniquement).
 */
export async function logEmailSend(
  ctx: any,
  entry: {
    to: string;
    subject: string;
    status: "sent" | "failed";
    resendId?: string;
    error?: string;
  }
): Promise<void> {
  try {
    await ctx.runMutation(internal.emailLog._logEmailSend, entry);
  } catch (logError) {
    console.error("Failed to schedule email_log write:", logError);
  }
}
