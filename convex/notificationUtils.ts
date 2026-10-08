// ==========================================
// NOTIFICATIONS — helpers partagés (fonctions pures)
// ==========================================
// Ce fichier n'exporte QUE des fonctions pures (aucune fonction Convex),
// sur le pattern de convex/moneroo.ts : importable depuis n'importe quel
// module Convex ou test vitest sans casser le type ApiFromModules.

/**
 * Un identifiant d'utilisateur est-il notifiable ?
 *
 * false pour :
 *  - 'anonymous' (demande d'achat soumise sans connexion) ;
 *  - '' / null / undefined (valeurs vides ou absentes) ;
 *  - tout identifiant préfixé 'guest:' (paiement Xpress d'un invité,
 *    cf. payments.ts initializeXpressPayment : userId = `guest:${email}`).
 *
 * true pour tout autre identifiant (tokenIdentifier Clerk, _id legacy
 * des fournisseurs importés — réparé à la connexion par la réconciliation
 * de ensureUserHelper).
 */
export function isNotifiableUserId(
  userId: string | undefined | null
): boolean {
  if (!userId) return false;
  if (userId === "anonymous") return false;
  if (userId.startsWith("guest:")) return false;
  return true;
}
