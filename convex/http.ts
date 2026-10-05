import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Route pour initialiser la base de données (sans authentification requise)
// Utilisation: POST /init ou GET /init
http.route({
  path: "/init",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Appeler la mutation d'initialisation interne (sans authentification)
      const result = await ctx.runMutation(internal.init.initCategoriesInternal, {});
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          created: result.created,
          skipped: result.skipped,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Erreur lors de l'initialisation",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Route GET pour faciliter l'initialisation depuis le navigateur
http.route({
  path: "/init",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const result = await ctx.runMutation(internal.init.initCategoriesInternal, {});
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          created: result.created,
          skipped: result.skipped,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Erreur lors de l'initialisation",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// Route pour créer un admin (sans authentification requise pour l'initialisation)
http.route({
  path: "/admin/create",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Corps de requête JSON invalide",
          }),
          {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const { email, firstName, lastName, phone } = body || {};

      if (!email) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Email requis",
          }),
          {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Appeler la mutation pour créer l'admin
      const result = await ctx.runMutation(internal.admin.createAdmin, {
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      });

      return new Response(
        JSON.stringify(result || { success: true, message: "Admin créé avec succès" }),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error: any) {
      console.error("Erreur dans /admin/create:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Erreur lors de la création de l'admin",
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

// Route for initializing categories with custom data (admin only)
http.route({
  path: "/categories/init",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid JSON request body",
          }),
          {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const { categories } = body || {};
      
      if (!categories || !Array.isArray(categories)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Categories array is required",
          }),
          {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Call the internal mutation to initialize categories
      const result = await ctx.runMutation(internal.init.initCustomCategoriesInternal, {
        categories,
      });

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error: any) {
      console.error("Error in /categories/init:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Error initializing categories",
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

// Route for migrating supplier boolean fields
http.route({
  path: "/suppliers/migrate-booleans",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Call the internal mutation to migrate supplier boolean fields
      const result = await ctx.runMutation(internal.init.migrateSupplierBooleans, {});
      
      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error: any) {
      console.error("Error in /suppliers/migrate-booleans:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Error migrating supplier boolean fields",
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }),
});

// ==========================================
// WEBHOOK MONEROO (notifications de paiement)
// ==========================================

/**
 * Health check du webhook (GET) — permet de vérifier que la route est joignable.
 */
http.route({
  path: "/webhooks/moneroo",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

/**
 * Webhook Moneroo (POST) :
 * - signature X-Moneroo-Signature = HMAC-SHA256 du corps BRUT avec
 *   MONEROO_WEBHOOK_SECRET (vérifié via Web Crypto avant tout traitement) ;
 * - traitement délégué à l'action interne idempotente _processMonerooWebhook,
 *   qui re-vérifie le statut réel auprès de Moneroo avant tout crédit ;
 * - répond 200 rapide (< 3s) ; en cas d'échec 500 → Moneroo réessaie (3×/10 min).
 */
http.route({
  path: "/webhooks/moneroo",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.MONEROO_WEBHOOK_SECRET;
    if (!secret) {
      return new Response(
        JSON.stringify({ success: false, error: "Webhook non configuré" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Corps brut indispensable au calcul de la signature HMAC
    const rawBody = await request.text();
    const signature = request.headers.get("X-Moneroo-Signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ success: false, error: "Signature manquante" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // HMAC-SHA256 du corps brut (Web Crypto API)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );
    const expected = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expected !== signature.trim().toLowerCase()) {
      return new Response(
        JSON.stringify({ success: false, error: "Signature invalide" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "JSON invalide" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const event = typeof payload?.event === "string" ? payload.event : null;
    const monerooPaymentId = payload?.data?.id ?? payload?.id ?? null;
    if (!event || typeof monerooPaymentId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Payload invalide" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      const result = await ctx.runAction(
        internal.paymentsProcessing._processMonerooWebhook,
        { event, monerooPaymentId }
      );
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Webhook Moneroo:", error);
      // 500 → Moneroo réessaie automatiquement (3× / 10 min)
      return new Response(
        JSON.stringify({ success: false, error: error.message || "Erreur interne" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// No custom auth HTTP routes needed with Clerk + Convex client integration

export default http;
