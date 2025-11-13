// Clerk authentication configuration for Convex
// 
// This file configures Convex to accept and validate JWT tokens from Clerk.
//
// IMPORTANT SETUP STEPS:
// ======================
// 1. Find your Clerk Issuer URL:
//    - Go to https://dashboard.clerk.com
//    - Select your application
//    - Navigate to: Configure → JWT Templates → Default
//    - Copy the "Issuer" URL (format: https://[your-instance].clerk.accounts.dev)
//
// 2. Option A - Use Environment Variable (RECOMMENDED):
//    Set in Convex Dashboard:
//      - Go to https://dashboard.convex.dev
//      - Select your project → Settings → Environment Variables
//      - Add: CLERK_ISSUER_URL = "https://[your-instance].clerk.accounts.dev"
//    
//    OR set via CLI:
//      npx convex env set CLERK_ISSUER_URL "https://[your-instance].clerk.accounts.dev"
//    
//    Then use in code:
//      domain: process.env.CLERK_ISSUER_URL,
//
// 3. Option B - Hardcode (for testing only):
//    Replace the domain value below with your actual Issuer URL
//
// Without proper configuration, ctx.auth.getUserIdentity() will return null.

export default {
  providers: [
    {
      // Replace with your Clerk Issuer URL or use environment variable
      domain: process.env.CLERK_ISSUER_URL || "https://firm-cowbird-57.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

