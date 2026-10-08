import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getSiteUrl } from "./moneroo";
import { isNotifiableUserId } from "./notificationUtils";
import {
  contactEmailTemplate,
  newsletterCampaignTemplate,
  newsletterWelcomeBackTemplate,
  newsletterWelcomeTemplate,
  supplierMessageTemplate,
} from "./emailTemplates";

// Destinataire interne configurable via la variable d'environnement Convex :
//   npx convex env set CONTACT_EMAIL suji@olufona.com --prod
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "suji@olufona.com";

// Taille maximale d'un lot Resend (limite de l'endpoint batch : 100 envois).
const BATCH_SIZE = 100;

/**
 * Email service using Resend
 * La clé RESEND_API_KEY doit être stockée dans les variables d'environnement Convex.
 * Chaque envoi est journalisé dans la table email_log par sendEmailAction.
 */

export const sendContactEmail = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store contact form submission in database
    const contactId = await ctx.db.insert("contacts", {
      name: args.name,
      email: args.email,
      subject: args.subject,
      message: args.message,
      type: args.type || "general",
      status: "pending",
      created_at: new Date().toISOString(),
    });

    // Send email using Resend via HTTP action
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction as any, {
        to: CONTACT_EMAIL,
        subject: `[Formulaire de contact] ${args.subject}`,
        html: contactEmailTemplate({
          siteUrl: getSiteUrl(),
          name: args.name,
          email: args.email,
          subject: args.subject,
          type: args.type || "general",
          message: args.message,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send contact email:", emailError);
    }

    return { success: true, id: contactId };
  },
});

export const sendSupplierContactEmail = mutation({
  args: {
    supplierId: v.string(),
    senderName: v.string(),
    senderEmail: v.string(),
    senderPhone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Get supplier details from suppliers table
    const supplier = await ctx.db.get(args.supplierId as Id<"suppliers">);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Store message in database
    const messageId = await ctx.db.insert("messages", {
      supplierId: args.supplierId,
      senderName: args.senderName,
      senderEmail: args.senderEmail,
      senderPhone: args.senderPhone,
      subject: args.subject,
      message: args.message,
      status: "unread",
      created_at: new Date().toISOString(),
    });

    // Send email notification to supplier (répondre au client via reply_to)
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction as any, {
        to: supplier.email,
        subject: `[Suji] Nouveau message de ${args.senderName}`,
        html: supplierMessageTemplate({
          siteUrl: getSiteUrl(),
          supplierName: supplier.business_name,
          senderName: args.senderName,
          senderEmail: args.senderEmail,
          senderPhone: args.senderPhone,
          subject: args.subject,
          message: args.message,
        }),
        reply_to: args.senderEmail,
      });
    } catch (emailError) {
      console.error("Failed to send supplier notification:", emailError);
    }

    // Notification in-app pour le fournisseur (même pattern que admin.ts approveSupplier)
    if (isNotifiableUserId(supplier.userId)) {
      try {
        await ctx.db.insert("notifications", {
          userId: supplier.userId,
          type: "message",
          title: "Nouveau message",
          message: `${args.senderName} vous a envoyé un message : « ${args.subject} »`,
          data: {
            messageId: messageId as unknown as string,
            senderName: args.senderName,
            senderEmail: args.senderEmail,
          },
          read: false,
          actionUrl: "/dashboard",
          createdAt: new Date().toISOString(),
        });
      } catch (notifError) {
        console.error("Failed to create supplier message notification:", notifError);
      }
    }

    return { success: true, id: messageId };
  },
});

/**
 * Newsletter subscription
 * Subscribe an email to the newsletter
 */
export const subscribeToNewsletter = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    sector: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Normalize email
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if email already exists
    const existing = await ctx.db
      .query("newsletter_subscriptions")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      if (existing.status === "active") {
        return { success: true, message: "Email already subscribed", alreadySubscribed: true };
      }
      // Reactivate if previously unsubscribed
      await ctx.db.patch(existing._id, {
        status: "active",
        name: args.name || existing.name,
        sector: args.sector || existing.sector,
        subscribedAt: new Date().toISOString(),
        unsubscribedAt: undefined,
      });

      // Send welcome back email
      try {
        await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction as any, {
          to: normalizedEmail,
          subject: "Bon retour dans la newsletter Suji !",
          html: newsletterWelcomeBackTemplate({
            siteUrl: getSiteUrl(),
            name: args.name,
            email: normalizedEmail,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send welcome back email:", emailError);
      }

      return { success: true, message: "Successfully resubscribed", alreadySubscribed: false };
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("newsletter_subscriptions", {
      email: normalizedEmail,
      name: args.name,
      sector: args.sector,
      status: "active",
      subscribedAt: new Date().toISOString(),
    });

    // Send welcome email
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction as any, {
        to: normalizedEmail,
        subject: "Bienvenue dans la newsletter Suji !",
        html: newsletterWelcomeTemplate({
          siteUrl: getSiteUrl(),
          name: args.name,
          email: normalizedEmail,
        }),
      });
    } catch (emailError) {
      console.error("Failed to schedule welcome email:", emailError);
    }

    return { success: true, id: subscriptionId, message: "Successfully subscribed", alreadySubscribed: false };
  },
});

/**
 * Unsubscribe from newsletter
 */
export const unsubscribeFromNewsletter = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    const subscription = await ctx.db
      .query("newsletter_subscriptions")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!subscription) {
      return { success: false, message: "Email not found" };
    }

    await ctx.db.patch(subscription._id, {
      status: "unsubscribed",
      unsubscribedAt: new Date().toISOString(),
    });

    return { success: true, message: "Successfully unsubscribed" };
  },
});

/**
 * Send newsletter to all active subscribers
 * Admin only function — envoi par lots via l'endpoint batch Resend
 * (chunks de BATCH_SIZE, une action planifiée par chunk).
 */
export const sendNewsletter = mutation({
  args: {
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || !user.is_admin) {
      throw new Error("Access denied. Admin only.");
    }

    // Get all active subscribers
    const subscribers = await ctx.db
      .query("newsletter_subscriptions")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    if (subscribers.length === 0) {
      return { success: true, sent: 0, message: "No active subscribers" };
    }

    // Encapsuler le contenu admin dans le layout Suji avec pied de page
    // de désinscription (lien générique : la page gère la saisie de l'email,
    // un lien par destinataire étant impossible en envoi par lots).
    const html = newsletterCampaignTemplate({
      siteUrl: getSiteUrl(),
      subject: args.subject,
      html: args.html,
    });

    // Envoi par chunks de BATCH_SIZE destinataires (limite Resend batch : 100)
    let scheduledCount = 0;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const chunk = subscribers.slice(i, i + BATCH_SIZE).map((s) => s.email);
      try {
        await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailBatchAction as any, {
          to: chunk,
          subject: args.subject,
          html,
        });
        scheduledCount += chunk.length;
      } catch (error) {
        console.error(`Failed to schedule newsletter batch ${i / BATCH_SIZE}:`, error);
      }
    }

    return {
      success: true,
      sent: scheduledCount,
      total: subscribers.length,
      message: `Newsletter scheduled for ${scheduledCount} subscribers`,
    };
  },
});

/**
 * Get newsletter subscribers (admin only)
 */
export const getNewsletterSubscribers = mutation({
  args: {
    status: v.optional(v.string()), // 'active' | 'unsubscribed' | 'all'
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();

    if (!user || !user.is_admin) {
      throw new Error("Access denied. Admin only.");
    }

    let query;
    if (args.status && args.status !== "all") {
      query = ctx.db.query("newsletter_subscriptions").withIndex("status", (q) => q.eq("status", args.status));
    } else {
      query = ctx.db.query("newsletter_subscriptions");
    }

    const subscribers = await query.collect();
    return { success: true, subscribers, count: subscribers.length };
  },
});
