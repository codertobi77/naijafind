import { describe, it, expect } from 'vitest';
import {
  contactEmailTemplate,
  contactConfirmationTemplate,
  supplierMessageTemplate,
  supplierReplyTemplate,
  newsletterWelcomeTemplate,
  newsletterWelcomeBackTemplate,
  newsletterUnsubscribeTemplate,
  newsletterCampaignTemplate,
  xpressGuestReceiptTemplate,
  subscriptionExpiryReminderTemplate,
  newsletterUnsubscribeUrl,
  genericUnsubscribeUrl,
} from '../../../convex/emailTemplates';
import { escapeHtml } from '../../../convex/htmlEscape';

const SITE_URL = 'https://suji.ng';

describe('emailTemplates — layout commun', () => {
  it("inclut le footer « L'équipe Suji » avec l'URL du site", () => {
    const html = contactEmailTemplate({
      siteUrl: SITE_URL,
      name: 'Awa',
      email: 'awa@example.com',
      subject: 'Bonjour',
      type: 'general',
      message: 'Coucou',
    });
    expect(html).toContain(`L'équipe Suji`);
    expect(html).toContain(SITE_URL);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it("n'affiche pas de lien de désinscription en dehors de la newsletter", () => {
    const html = contactEmailTemplate({
      siteUrl: SITE_URL,
      name: 'Awa',
      email: 'awa@example.com',
      subject: 'Bonjour',
      type: 'general',
      message: 'Coucou',
    });
    expect(html).not.toContain('Se désabonner');
  });
});

describe('emailTemplates — échappement HTML', () => {
  it('échappe les caractères HTML injectés dans le message de contact', () => {
    const html = contactEmailTemplate({
      siteUrl: SITE_URL,
      name: 'Awa <b>Boom</b>',
      email: 'awa@example.com',
      subject: '<script>alert(1)</script>',
      type: 'general',
      message: 'Texte <img src=x onerror=alert(1)> & "quotes"',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    // Chaîne échappée calculée (jamais d'entité littérale dans ce fichier)
    expect(html).toContain(escapeHtml('<script>'));
    expect(html).toContain(escapeHtml('"'));
  });

  it('échappe le contenu du message fournisseur', () => {
    const html = supplierMessageTemplate({
      siteUrl: SITE_URL,
      supplierName: 'Suji Corp',
      senderName: 'Awa',
      senderEmail: 'awa@example.com',
      subject: 'Devis',
      message: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain(escapeHtml('<script>'));
  });
});

describe('emailTemplates — liens de désinscription', () => {
  it("newsletterUnsubscribeUrl encode l'email du destinataire", () => {
    const url = newsletterUnsubscribeUrl(SITE_URL, 'awa+tag@example.com');
    expect(url).toBe(`${SITE_URL}/newsletter/unsubscribe?email=awa%2Btag%40example.com`);
  });

  it('genericUnsubscribeUrl pointe vers la page sans paramètre', () => {
    expect(genericUnsubscribeUrl(SITE_URL)).toBe(`${SITE_URL}/newsletter/unsubscribe`);
  });

  it("l'email de bienvenue contient le lien de désinscription personnalisé", () => {
    const html = newsletterWelcomeTemplate({
      siteUrl: SITE_URL,
      email: 'awa@example.com',
    });
    expect(html).toContain(`${SITE_URL}/newsletter/unsubscribe?email=awa%40example.com`);
    expect(html).toContain('Se désabonner de la newsletter');
  });

  it("l'email de retour contient le lien de désinscription personnalisé", () => {
    const html = newsletterWelcomeBackTemplate({
      siteUrl: SITE_URL,
      email: 'awa@example.com',
    });
    expect(html).toContain(`${SITE_URL}/newsletter/unsubscribe?email=awa%40example.com`);
  });

  it('la campagne encapsule le HTML admin avec le lien générique', () => {
    const html = newsletterCampaignTemplate({
      siteUrl: SITE_URL,
      subject: 'Nouveautés du mois',
      html: '<p>Contenu admin <strong>enrichi</strong></p>',
    });
    expect(html).toContain('<p>Contenu admin <strong>enrichi</strong></p>');
    expect(html).toContain(`${SITE_URL}/newsletter/unsubscribe`);
    expect(html).toContain('Nouveautés du mois');
  });

  it('la confirmation de désinscription ne propose pas de lien pré-rempli', () => {
    const html = newsletterUnsubscribeTemplate({
      siteUrl: SITE_URL,
      email: 'awa@example.com',
    });
    expect(html).toContain('Désinscription confirmée');
    expect(html).not.toContain('unsubscribe?email=');
  });
});

describe('emailTemplates — reçu Xpress invité', () => {
  it('mentionne le montant, le délai 48-72h et le lien du site', () => {
    const html = xpressGuestReceiptTemplate({
      siteUrl: SITE_URL,
      amount: 15000,
      currency: 'XOF',
    });
    // fr-FR : séparateur de milliers = espace insécable (U+00A0 ou U+202F selon ICU)
    expect(html).toMatch(/15[\s\u00A0\u202F]000\s*XOF/);
    expect(html).toContain('48 à 72 heures');
    expect(html).toContain(SITE_URL);
  });

  it('ne mentionne plus « Nigeria »', () => {
    const html = xpressGuestReceiptTemplate({
      siteUrl: SITE_URL,
      amount: 15000,
      currency: 'XOF',
    });
    expect(html.toLowerCase()).not.toContain('nigeria');
  });
});

describe("emailTemplates — rappel d'expiration", () => {
  it('mentionne le statut concerné, la date et renvoie vers le dashboard', () => {
    const html = subscriptionExpiryReminderTemplate({
      siteUrl: SITE_URL,
      kind: 'vitrine',
      expiresAt: '2026-10-11T00:00:00.000Z',
    });
    expect(html).toContain('votre statut Vitrine');
    expect(html).toContain('2026-10-11');
    expect(html).toContain(`${SITE_URL}/dashboard`);
  });

  it('formule le rappel pour un abonnement', () => {
    const html = subscriptionExpiryReminderTemplate({
      siteUrl: SITE_URL,
      kind: 'abonnement',
      expiresAt: '2026-10-11T00:00:00.000Z',
    });
    expect(html).toContain('votre abonnement');
  });
});

describe("emailTemplates — accusé de réception contact", () => {
  it("salue l'expéditeur, mentionne son sujet et ne propose pas de désinscription", () => {
    const html = contactConfirmationTemplate({
      siteUrl: SITE_URL,
      name: 'Awa',
      subject: 'Demande de partenariat',
    });
    expect(html).toContain('Bonjour Awa');
    expect(html).toContain('Demande de partenariat');
    expect(html).not.toContain('Se désabonner');
  });

  it('échappe le nom et le sujet injectés', () => {
    const html = contactConfirmationTemplate({
      siteUrl: SITE_URL,
      name: 'Awa <b>X</b>',
      subject: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain(escapeHtml('<script>'));
  });
});

describe('emailTemplates — réponse fournisseur', () => {
  it("inclut le fournisseur, le sujet d'origine, la réponse et l'email de contact", () => {
    const html = supplierReplyTemplate({
      siteUrl: SITE_URL,
      supplierName: 'Suji Corp',
      customerName: 'Awa',
      originalSubject: 'Devis machine',
      message: 'Bonjour, voici notre proposition.',
      supplierEmail: 'contact@suji-corp.example',
    });
    expect(html).toContain('Suji Corp');
    expect(html).toContain('Devis machine');
    expect(html).toContain('Bonjour, voici notre proposition.');
    expect(html).toContain('mailto:contact@suji-corp.example');
    expect(html).not.toContain('Se désabonner');
  });

  it('échappe le message du fournisseur', () => {
    const html = supplierReplyTemplate({
      siteUrl: SITE_URL,
      supplierName: 'Suji Corp',
      customerName: 'Awa',
      originalSubject: 'Devis',
      message: '<script>alert("xss")</script>',
      supplierEmail: 'contact@suji-corp.example',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain(escapeHtml('<script>'));
  });
});

describe('emailTemplates — message fournisseur', () => {
  it('inclut le téléphone quand il est fourni', () => {
    const html = supplierMessageTemplate({
      siteUrl: SITE_URL,
      supplierName: 'Suji Corp',
      senderName: 'Awa',
      senderEmail: 'awa@example.com',
      senderPhone: '+225 07 00 00 00 00',
      subject: 'Devis',
      message: 'Bonjour, je souhaite un devis.',
    });
    expect(html).toContain('+225 07 00 00 00 00');
  });

  it('omet la ligne téléphone quand il est absent', () => {
    const html = supplierMessageTemplate({
      siteUrl: SITE_URL,
      supplierName: 'Suji Corp',
      senderName: 'Awa',
      senderEmail: 'awa@example.com',
      subject: 'Devis',
      message: 'Bonjour, je souhaite un devis.',
    });
    expect(html).not.toContain('Téléphone');
  });
});
