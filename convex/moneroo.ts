// ==========================================
// MONEROO — helpers partagés
// ==========================================
// Ce fichier n'exporte QUE des fonctions/constantes simples (aucune fonction
// Convex) : il est donc hors du type ApiFromModules (cf. convex/pricing.ts).
// Importé par payments.ts et paymentsProcessing.ts.

const MONEROO_API_BASE = "https://api.moneroo.io/v1";

export function getMonerooSecretKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) {
    throw new Error("MONEROO_SECRET_KEY non configuré");
  }
  return key;
}

/** URL publique du frontend (pages de retour de paiement). */
export function getSiteUrl(): string {
  const url = process.env.SITE_URL;
  if (!url) {
    throw new Error("SITE_URL non configuré");
  }
  return url.replace(/\/+$/, "");
}

export interface MonerooCustomer {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

/** Initialise un paiement auprès de Moneroo et renvoie l'URL de checkout. */
export async function initializeMonerooPayment(input: {
  amount: number;
  currency: string;
  description: string;
  customer: MonerooCustomer;
  metadata: Record<string, string>;
}): Promise<{ id: string; checkoutUrl: string }> {
  const requestBody = {
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    return_url: `${getSiteUrl()}/payment/success`,
    customer: input.customer,
    metadata: input.metadata,
  };

  const response = await fetch(`${MONEROO_API_BASE}/payments/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getMonerooSecretKey()}`,
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Moneroo API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data?.data?.id || !data?.data?.checkout_url) {
    throw new Error("Réponse invalide de l'API Moneroo");
  }

  return { id: data.data.id, checkoutUrl: data.data.checkout_url };
}

/** Vérifie le statut réel d'un paiement auprès de Moneroo. */
export async function fetchMonerooVerification(
  monerooPaymentId: string
): Promise<string> {
  const response = await fetch(
    `${MONEROO_API_BASE}/payments/${monerooPaymentId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getMonerooSecretKey()}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Moneroo API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data?.data?.status ?? "unknown";
}

/** Mappe le statut Moneroo vers notre statut interne. */
export function mapMonerooStatus(
  status: string
): "completed" | "failed" | "pending" {
  switch (status) {
    case "success":
      return "completed";
    case "failed":
    case "cancelled":
      return "failed";
    default:
      return "pending";
  }
}
