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
    console.log("sendEmailAction called with:", { to: args.to, subject: args.subject });
    
    // Access environment variables through process.env
    // Note: Set these in your Convex dashboard under Settings > Environment Variables
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.VITE_FROM_EMAIL || "onboarding@resend.dev";
    
    console.log("Environment check - RESEND_API_KEY exists:", !!RESEND_API_KEY);
    console.log("Environment check - FROM_EMAIL:", FROM_EMAIL);
    
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

      console.log("Response received from Resend API:", response);

      if (!response.ok) {
        const error = await response.json();
        console.error("Resend API error:", error);
        return { success: false, error: error.message || "Failed to send email" };
      }

      const data = await response.json();
      console.log("Email sent successfully:", data.id);
      console.log("Email sending details:", data);
      return { success: true, emailId: data.id };
    } catch (error) {
      console.error("Failed to send email:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});
