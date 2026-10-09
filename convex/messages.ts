import { query, mutation } from "./_generated/server";
import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getSiteUrl } from "./moneroo";
import { supplierReplyTemplate } from "./emailTemplates";

// ==========================================
// INTERNAL FUNCTIONS FOR SUPPLIER DEDUPLICATION
// ==========================================

/**
 * Internal query: Get messages by supplier ID
 */
export const getMessagesBySupplierIdInternal = internalQuery({
  args: {
    supplierId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();
  },
});

/**
 * Internal mutation: Update message supplier ID
 */
export const updateMessageSupplierInternal = internalMutation({
  args: {
    messageId: v.string(),
    newSupplierId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId as Id<"messages">, {
      supplierId: args.newSupplierId,
    });
  },
});

// ==========================================
// PUBLIC FUNCTIONS FOR SUPPLIER DASHBOARD CHAT
// ==========================================

/**
 * Get all messages for the logged-in supplier
 */
export const getSupplierMessages = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();

    if (!supplier) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("supplierId", (q) => q.eq("supplierId", supplier._id as unknown as string))
      .collect();

    // Sort by created_at descending
    return messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
});

/**
 * Get all replies for a message thread
 */
export const getMessageReplies = query({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const replies = await ctx.db
      .query("message_replies")
      .withIndex("messageId", (q) => q.eq("messageId", args.messageId))
      .collect();

    // Sort by created_at ascending
    return replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
});

/**
 * Mark a message as read
 */
export const markMessageAsRead = mutation({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId as Id<"messages">);
    if (!message) throw new Error("Message not found");

    if (message.status === "unread") {
      await ctx.db.patch(args.messageId as Id<"messages">, {
        status: "read",
      });
    }

    return { success: true };
  },
});

/**
 * Reply to a buyer's message and notify them via Resend
 */
export const replyToMessage = mutation({
  args: {
    messageId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .first();

    if (!supplier) throw new Error("Supplier profile not found");

    const originalMessage = await ctx.db.get(args.messageId as Id<"messages">);
    if (!originalMessage) throw new Error("Original message not found");

    // Insert reply in database
    await ctx.db.insert("message_replies", {
      messageId: args.messageId,
      senderType: "supplier",
      senderName: supplier.business_name,
      message: args.message,
      created_at: new Date().toISOString(),
    });

    // Update original message status to replied
    await ctx.db.patch(args.messageId as Id<"messages">, {
      status: "replied",
    });

    // Send email reply to buyer via Resend (template brandé Suji, reply_to fournisseur)
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction as any, {
        to: originalMessage.senderEmail,
        subject: `[Suji] Réponse de ${supplier.business_name} à votre demande`,
        html: supplierReplyTemplate({
          siteUrl: getSiteUrl(),
          supplierName: supplier.business_name,
          customerName: originalMessage.senderName,
          originalSubject: originalMessage.subject,
          message: args.message,
          supplierEmail: supplier.email,
        }),
        reply_to: supplier.email,
      });
    } catch (emailError) {
      console.error("Failed to send email notification for supplier reply:", emailError);
    }

    return { success: true };
  },
});
