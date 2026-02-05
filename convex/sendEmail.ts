import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal action to send emails using Resend API
 * This is called by other mutations via scheduler
 */
export const sendEmailAction = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Access environment variables through Convex's context
    // Note: Set these in your Convex dashboard under Settings > Environment Variables
    const RESEND_API_KEY = (ctx as any).RESEND_API_KEY;
    const FROM_EMAIL = (ctx as any).FROM_EMAIL || "onboarding@resend.dev";
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: args.from || FROM_EMAIL,
          to: args.to,
          subject: args.subject,
          html: args.html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Resend API error:", error);
        return { success: false, error: error.message || "Failed to send email" };
      }

      const data = await response.json();
      console.log("Email sent successfully:", data.id);
      return { success: true, emailId: data.id };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});
