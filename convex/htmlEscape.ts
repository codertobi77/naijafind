/**
 * Échappe les caractères spéciaux HTML pour éviter toute injection HTML
 * dans les emails construits par interpolation de template strings.
 */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
