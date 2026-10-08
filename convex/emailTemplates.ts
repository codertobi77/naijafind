// ==========================================
// TEMPLATES D'EMAILS — module de fonctions pures
// ==========================================
// Ce fichier n'exporte QUE des fonctions pures (aucune fonction Convex),
// sur le pattern de convex/moneroo.ts : importable partout (emails.ts,
// payments.ts, paymentsProcessing.ts, tests vitest) sans casser le type
// ApiFromModules.

import { escapeHtml } from "./htmlEscape";

/** Couleur de marque (vert Suji, aligné sur green-600 du site). */
const BRAND_COLOR = "#16a34a";

/**
 * Layout HTML commun à tous les emails Suji.
 * - `unsubscribeUrl` : affiche le pied de page de désinscription (newsletter).
 */
function wrapLayout(options: {
  title: string;
  bodyHtml: string;
  siteUrl: string;
  unsubscribeUrl?: string;
}): string {
  const { title, bodyHtml, siteUrl, unsubscribeUrl } = options;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:20px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;text-decoration:none;">Suji</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${escapeHtml(title)}</h1>
              <div style="font-size:14px;line-height:1.6;color:#374151;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                L'équipe Suji — <a href="${siteUrl}" style="color:${BRAND_COLOR};text-decoration:none;">${siteUrl}</a>
              </p>
              ${unsubscribeUrl
                ? `<p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">
                     <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Se désabonner de la newsletter</a>
                   </p>`
                : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Bouton d'appel à l'action stylé (utilisé dans le corps des templates). */
function ctaButton(label: string, url: string): string {
  return `<p style="margin:24px 0;">
    <a href="${url}" style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">${escapeHtml(label)}</a>
  </p>`;
}

/** Lien de désinscription newsletter, personnalisé par destinataire. */
export function newsletterUnsubscribeUrl(siteUrl: string, email: string): string {
  return `${siteUrl}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
}

/** Lien de désinscription générique (campagne envoyée en batch : même HTML pour tous). */
export function genericUnsubscribeUrl(siteUrl: string): string {
  return `${siteUrl}/newsletter/unsubscribe`;
}

/**
 * Reçu interne : soumission du formulaire de contact de la page Contact.
 * Envoyé à CONTACT_EMAIL pour information.
 */
export function contactEmailTemplate(args: {
  siteUrl: string;
  name: string;
  email: string;
  subject: string;
  type: string;
  message: string;
}): string {
  const body = `
    <p><strong>De :</strong> ${escapeHtml(args.name)} (${escapeHtml(args.email)})</p>
    <p><strong>Sujet :</strong> ${escapeHtml(args.subject)}</p>
    <p><strong>Type :</strong> ${escapeHtml(args.type)}</p>
    <p><strong>Message :</strong></p>
    <p style="white-space:pre-wrap;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">${escapeHtml(args.message)}</p>
  `;
  return wrapLayout({
    title: "Nouvelle demande de contact",
    bodyHtml: body,
    siteUrl: args.siteUrl,
  });
}

/**
 * Message d'un client à un fournisseur (formulaire de contact de la page
 * fournisseur). `reply_to` est géré par l'appelant.
 */
export function supplierMessageTemplate(args: {
  siteUrl: string;
  supplierName: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
}): string {
  const body = `
    <p>Bonjour <strong>${escapeHtml(args.supplierName)}</strong>,</p>
    <p>Vous avez reçu un nouveau message via votre page Suji :</p>
    <p><strong>De :</strong> ${escapeHtml(args.senderName)}</p>
    <p><strong>Email :</strong> ${escapeHtml(args.senderEmail)}</p>
    ${args.senderPhone ? `<p><strong>Téléphone :</strong> ${escapeHtml(args.senderPhone)}</p>` : ""}
    <p><strong>Sujet :</strong> ${escapeHtml(args.subject)}</p>
    <p><strong>Message :</strong></p>
    <p style="white-space:pre-wrap;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">${escapeHtml(args.message)}</p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">Répondez directement à cet email pour contacter l'expéditeur.</p>
  `;
  return wrapLayout({
    title: "Nouveau message client",
    bodyHtml: body,
    siteUrl: args.siteUrl,
  });
}

/** Bienvenue newsletter (première inscription). */
export function newsletterWelcomeTemplate(args: {
  siteUrl: string;
  name?: string;
  email: string;
}): string {
  const body = `
    <p>Bonjour${args.name ? ` ${escapeHtml(args.name)}` : ""},</p>
    <p>Merci de votre inscription à la newsletter Suji ! Vous recevrez désormais :</p>
    <ul>
      <li>Les nouveaux fournisseurs vérifiés de la plateforme</li>
      <li>Des offres exclusives de nos partenaires</li>
      <li>Des conseils pour sourcer plus efficacement</li>
    </ul>
    ${ctaButton("Explorer Suji", `${args.siteUrl}/search`)}
  `;
  return wrapLayout({
    title: "Bienvenue dans la newsletter Suji",
    bodyHtml: body,
    siteUrl: args.siteUrl,
    unsubscribeUrl: newsletterUnsubscribeUrl(args.siteUrl, args.email),
  });
}

/** Retour newsletter (ré-abonnement après désinscription). */
export function newsletterWelcomeBackTemplate(args: {
  siteUrl: string;
  name?: string;
  email: string;
}): string {
  const body = `
    <p>Bonjour${args.name ? ` ${escapeHtml(args.name)}` : ""},</p>
    <p>Votre ré-abonnement à la newsletter Suji est confirmé. Contents de vous revoir !</p>
    ${ctaButton("Explorer Suji", `${args.siteUrl}/search`)}
  `;
  return wrapLayout({
    title: "Bon retour parmi nous",
    bodyHtml: body,
    siteUrl: args.siteUrl,
    unsubscribeUrl: newsletterUnsubscribeUrl(args.siteUrl, args.email),
  });
}

/** Confirmation de désinscription newsletter. */
export function newsletterUnsubscribeTemplate(args: {
  siteUrl: string;
  email: string;
}): string {
  const body = `
    <p>Bonjour,</p>
    <p>Vous avez été désabonné de la newsletter Suji. Vous ne recevrez plus de prochains envois.</p>
    <p>Si c'était une erreur, réabonnez-vous à tout moment depuis le site :</p>
    ${ctaButton("Retourner sur Suji", args.siteUrl)}
  `;
  return wrapLayout({
    title: "Désinscription confirmée",
    bodyHtml: body,
    siteUrl: args.siteUrl,
  });
}

/**
 * Campagne newsletter envoyée par l'admin : encapsule le HTML fourni
 * (même contenu pour tous les destinataires) et ajoute le pied de page
 * de désinscription avec lien générique (la page gère la saisie de l'email).
 */
export function newsletterCampaignTemplate(args: {
  siteUrl: string;
  subject: string;
  html: string;
}): string {
  return wrapLayout({
    title: args.subject,
    bodyHtml: args.html,
    siteUrl: args.siteUrl,
    unsubscribeUrl: genericUnsubscribeUrl(args.siteUrl),
  });
}

/**
 * Reçu de paiement Xpress (invité sans compte) : 15 000 XOF, 48-72h.
 */
export function xpressGuestReceiptTemplate(args: {
  siteUrl: string;
  amount: number;
  currency: string;
}): string {
  const body = `
    <p>Bonjour,</p>
    <p>Nous confirmons la réception de votre paiement <strong>Xpress</strong> de
    <strong>${args.amount.toLocaleString("fr-FR")} ${escapeHtml(args.currency)}</strong>.</p>
    <p>Votre demande d'achat sera traitée <strong>en priorité sous 48 à 72 heures</strong>.
    Notre équipe vous contactera à cette adresse email dès qu'une proposition est disponible.</p>
    <p>Si vous avez une question, répondez simplement à cet email.</p>
    ${ctaButton("Voir le site Suji", args.siteUrl)}
  `;
  return wrapLayout({
    title: "Paiement Xpress confirmé",
    bodyHtml: body,
    siteUrl: args.siteUrl,
  });
}

/**
 * Rappel avant expiration (Vitrine ou abonnement) — cron quotidien.
 */
export function subscriptionExpiryReminderTemplate(args: {
  siteUrl: string;
  kind: "vitrine" | "abonnement";
  expiresAt: string;
}): string {
  const label =
    args.kind === "vitrine"
      ? "votre statut Vitrine"
      : "votre abonnement";
  const body = `
    <p>Bonjour,</p>
    <p>Un petit rappel : <strong>${label} expire le ${escapeHtml(args.expiresAt)}</strong>.</p>
    <p>Pour continuer à profiter de vos avantages (visibilité renforcée, traitement prioritaire),
    renouvelez depuis votre tableau de bord :</p>
    ${ctaButton("Renouveler sur Suji", `${args.siteUrl}/dashboard`)}
    <p style="color:#6b7280;font-size:12px;">Si aucune action n'est entreprise, le statut repassera automatiquement au plan gratuit à l'échéance.</p>
  `;
  return wrapLayout({
    title: "Votre statut expire bientôt",
    bodyHtml: body,
    siteUrl: args.siteUrl,
  });
}
