// Clerk authentication configuration
// 
// With ConvexProviderWithClerk, authentication is primarily handled on the client side.
// The Issuer URL should be configured in the Convex Dashboard:
//   1. Go to Settings → Environment Variables
//   2. Add: CLERK_ISSUER_URL = "https://your-instance.clerk.accounts.dev"
//
// Alternatively, you can set it via CLI:
//   npx convex env set CLERK_ISSUER_URL "https://your-instance.clerk.accounts.dev"
//
// The Issuer URL is used by Convex to validate JWT tokens from Clerk.
// With ConvexProviderWithClerk, tokens are automatically sent with each request,
// and Convex validates them using the configured Issuer URL.

// No explicit server-side auth configuration needed when using ConvexProviderWithClerk.
// The authentication flow:
//   1. User authenticates via Clerk (client-side)
//   2. ConvexProviderWithClerk automatically includes Clerk tokens in requests
//   3. Convex validates tokens using the Issuer URL configured in the dashboard
//   4. ctx.auth.getUserIdentity() returns the authenticated user identity
