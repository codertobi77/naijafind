import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Email service using Resend
 * This requires backend implementation for security
 * Resend API key should be stored in Convex environment variables
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
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
        to: "contact@Olufinja.com",
        subject: `[Contact Form] ${args.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${args.name} (${args.email})</p>
          <p><strong>Subject:</strong> ${args.subject}</p>
          <p><strong>Type:</strong> ${args.type || "general"}</p>
          <p><strong>Message:</strong></p>
          <p>${args.message}</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send contact email:", emailError);
    }
    
    console.log("Contact form submission received:", contactId);

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
    const supplier = await ctx.db
      .query("suppliers")
      .filter((q) => q.eq(q.field("_id"), args.supplierId as any))
      .first();
      
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

    // Send email notification to supplier
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
        to: supplier.email,
        subject: `[Olufinja] New message from ${args.senderName}`,
        html: `
          <h2>New Message for ${supplier.business_name}</h2>
          <p><strong>From:</strong> ${args.senderName}</p>
          <p><strong>Email:</strong> ${args.senderEmail}</p>
          ${args.senderPhone ? `<p><strong>Phone:</strong> ${args.senderPhone}</p>` : ""}
          <p><strong>Subject:</strong> ${args.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${args.message}</p>
          <hr>
          <p><small>Reply to this message by responding directly to this email or contact ${args.senderEmail}</small></p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send supplier notification:", emailError);
    }
    
    console.log("Supplier contact message received:", messageId);

    return { success: true, id: messageId };
  },
});

export const sendVerificationEmail = mutation({
  args: {
    email: v.string(),
    userId: v.string(),
    verificationType: v.string(), // "email" | "supplier_verification"
  },
  handler: async (ctx, args) => {
    // Generate verification token
    const verificationToken = generateVerificationToken();
    
    // Store verification token
    await ctx.db.insert("verification_tokens", {
      userId: args.userId,
      email: args.email,
      token: verificationToken,
      type: args.verificationType,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      created_at: new Date().toISOString(),
    });

    // Send verification email using Resend
    const verificationLink = `https://Olufinja.com/verify?token=${verificationToken}`;
    
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
        to: args.email,
        subject: "Verify your Olufinja account",
        html: `
          <h2>Welcome to Olufinja!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <hr>
          <p><small>If you didn't create an account on Olufinja, please ignore this email.</small></p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }
    
    console.log("Verification email sent to:", args.email);

    return { success: true, token: verificationToken };
  },
});

export const sendPasswordResetEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true };
    }

    // Generate reset token
    const resetToken = generateVerificationToken();

    // Store reset token
    await ctx.db.insert("password_reset_tokens", {
      userId: user._id as unknown as string,
      email: args.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
      created_at: new Date().toISOString(),
    });

    // Send password reset email using Resend
    const resetLink = `https://Olufinja.com/reset-password?token=${resetToken}`;
    
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
        to: args.email,
        subject: "Reset your Olufinja password",
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to create a new password:</p>
          <p><a href="${resetLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <hr>
          <p><small>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</small></p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }
    
    console.log("Password reset email sent to:", args.email);

    return { success: true };
  },
});

export const sendSupplierApprovalEmail = mutation({
  args: {
    supplierId: v.string(),
    approved: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    // Get supplier details from suppliers table
    const supplier = await ctx.db
      .query("suppliers")
      .filter((q) => q.eq(q.field("_id"), args.supplierId as any))
      .first();
      
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Send approval/rejection email using Resend
    const emailSubject = args.approved 
      ? "Your Olufinja supplier account has been approved!" 
      : "Update on your Olufinja supplier application";
    
    const dashboardLink = "https://Olufinja.com/dashboard";
    const emailHtml = args.approved
      ? `
        <h2>Congratulations! Your supplier account is now active</h2>
        <p>Dear ${supplier.business_name},</p>
        <p>We're excited to inform you that your supplier account has been approved and is now active on Olufinja!</p>
        <p>You can now:</p>
        <ul>
          <li>Access your full dashboard</li>
          <li>List your products and services</li>
          <li>Receive customer inquiries</li>
          <li>Build your business presence</li>
        </ul>
        <p><a href="${dashboardLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Go to Dashboard</a></p>
        <p>Best regards,<br>The Olufinja Team</p>
      `
      : `
        <h2>Update on your supplier application</h2>
        <p>Dear ${supplier.business_name},</p>
        <p>Thank you for your interest in joining Olufinja. After reviewing your application, we need you to provide additional information or make some updates before we can approve your account.</p>
        ${args.reason ? `<p><strong>Reason:</strong> ${args.reason}</p>` : ""}
        <p>Please review your application and make the necessary updates. If you have any questions, feel free to contact our support team.</p>
        <p><a href="${dashboardLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Review Application</a></p>
        <p>Best regards,<br>The Olufinja Team</p>
      `;
    
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
        to: supplier.email,
        subject: emailSubject,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }
    
    console.log("Supplier approval email sent:", supplier.email);

    return { success: true };
  },
});

export const sendWelcomeEmail = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    userType: v.string(),
  },
  handler: async (ctx, args) => {
    // Send welcome email using Resend
    const isSupplier = args.userType === "supplier";
    const baseUrl = "https://Olufinja.com";
    const welcomeHtml = `
      <h2>Welcome to Olufinja${args.firstName ? `, ${args.firstName}` : ""}!</h2>
      <p>We're thrilled to have you join our community.</p>
      ${isSupplier ? `
        <p>As a supplier, you can now:</p>
        <ul>
          <li>Create your business profile</li>
          <li>Showcase your products and services</li>
          <li>Connect with customers across Nigeria</li>
          <li>Grow your business presence online</li>
        </ul>
        <p><a href="${baseUrl}/auth/supplier-setup" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Complete Your Profile</a></p>
      ` : `
        <p>Start exploring thousands of suppliers and businesses across Nigeria.</p>
        <p><a href="${baseUrl}/search" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Find Suppliers</a></p>
      `}
      <p>If you have any questions, our support team is always here to help.</p>
      <p>Best regards,<br>The Olufinja Team</p>
    `;
    
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
        to: args.email,
        subject: "Welcome to Olufinja!",
        html: welcomeHtml,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }
    
    console.log("Welcome email sent to:", args.email);

    return { success: true };
  },
});

// Helper function to generate verification tokens
function generateVerificationToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

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
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
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
        await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
          to: normalizedEmail,
          subject: "Welcome back to Olufinja newsletter!",
          html: `
            <h2>Welcome back!</h2>
            <p>Hi ${args.name || "there"},</p>
            <p>You've successfully resubscribed to the Olufinja newsletter. We're excited to have you back!</p>
            <p>You'll now receive:</p>
            <ul>
              <li>Exclusive supplier offers and deals</li>
              <li>New supplier announcements</li>
              <li>Industry insights and trends</li>
              <li>Tips for finding the best suppliers in Nigeria</li>
            </ul>
            <p>Best regards,<br>The Olufinja Team</p>
          `,
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
      console.log("Scheduling welcome email for:", normalizedEmail);
      const jobId = await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
        to: normalizedEmail,
        subject: "Welcome to Olufinja newsletter!",
        html: `
          <h2>Welcome to Olufinja!</h2>
          <p>Hi ${args.name || "there"},</p>
          <p>Thank you for subscribing to our newsletter. You're now part of a community that stays informed about the best suppliers and businesses in Nigeria.</p>
          <p>Here's what you can expect:</p>
          <ul>
            <li>Exclusive offers from verified suppliers</li>
            <li>New supplier spotlights</li>
            <li>Industry news and updates</li>
            <li>Tips for business growth</li>
          </ul>
          <p><a href="https://Olufinja.com/search" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Start Exploring</a></p>
          <p>Best regards,<br>The Olufinja Team</p>
        `,
      });
      console.log("Welcome email scheduled successfully, job ID:", jobId);
    } catch (emailError) {
      console.error("Failed to schedule welcome email:", emailError);
    }
    
    console.log("Newsletter subscription created:", subscriptionId);
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
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
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
 * Admin only function
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
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    
    if (!user || !user.is_admin) {
      throw new Error("Access denied. Admin only.");
    }
    
    // Get all active subscribers
    const subscribers = await ctx.db
      .query("newsletter_subscriptions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    if (subscribers.length === 0) {
      return { success: true, sent: 0, message: "No active subscribers" };
    }
    
    // Schedule emails for each subscriber (batch processing)
    let scheduledCount = 0;
    for (const subscriber of subscribers) {
      try {
        await ctx.scheduler.runAfter(0, internal.sendEmail.sendEmailAction, {
          to: subscriber.email,
          subject: args.subject,
          html: args.html,
        });
        scheduledCount++;
      } catch (error) {
        console.error(`Failed to schedule email for ${subscriber.email}:`, error);
      }
    }
    
    console.log(`Newsletter scheduled for ${scheduledCount} subscribers`);
    return { 
      success: true, 
      sent: scheduledCount, 
      total: subscribers.length,
      message: `Newsletter scheduled for ${scheduledCount} subscribers` 
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
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    
    if (!user || !user.is_admin) {
      throw new Error("Access denied. Admin only.");
    }
    
    let query = ctx.db.query("newsletter_subscriptions");
    
    if (args.status && args.status !== "all") {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const subscribers = await query.collect();
    return { success: true, subscribers, count: subscribers.length };
  },
});
