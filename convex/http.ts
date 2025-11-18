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

// No custom auth HTTP routes needed with Clerk + Convex client integration

export default http;
