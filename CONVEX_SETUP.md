# Convex Setup Guide

This project uses Convex as the primary backend and database. Follow these steps to set up Convex authentication and database.

## Prerequisites

- Node.js installed
- Clerk account (for authentication)
- Convex account

## Setup Steps

### 1. Install Convex CLI

```bash
npm install -g convex
```

### 2. Initialize Convex

If not already initialized, run:

```bash
npx convex dev
```

This will:
- Create a Convex project if you don't have one
- Link your local project to Convex
- Deploy your schema and functions

### 3. Configure Clerk Authentication

#### Step 3.1: Get your Clerk Issuer URL

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to: **Configure → JWT Templates → Default**
4. Copy the **Issuer** URL (format: `https://[your-instance].clerk.accounts.dev`)

#### Step 3.2: Set Environment Variable in Convex

**Option A: Via Convex Dashboard (Recommended)**

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings → Environment Variables**
4. Click **Add Environment Variable**
5. Set:
   - Name: `CLERK_ISSUER_URL`
   - Value: Your Clerk Issuer URL (e.g., `https://firm-cowbird-57.clerk.accounts.dev`)
6. Click **Save**

**Option B: Via CLI**

```bash
npx convex env set CLERK_ISSUER_URL "https://[your-instance].clerk.accounts.dev"
```

Replace `[your-instance]` with your actual Clerk instance subdomain.

### 4. Verify Configuration

After setting the environment variable, restart your Convex development server:

```bash
npx convex dev
```

Your authentication should now work correctly. Functions using `ctx.auth.getUserIdentity()` will receive the authenticated user's information.

### 5. Initialize Database (Optional)

To populate initial categories or create an admin user, you can use the provided scripts:

```bash
# Create admin user
npm run create-admin

# Or manually call Convex functions via dashboard
```

## Troubleshooting

### Authentication returns null

If `ctx.auth.getUserIdentity()` returns null:

1. Check that `CLERK_ISSUER_URL` is set correctly in Convex Dashboard
2. Verify the Issuer URL matches exactly what's in your Clerk Dashboard
3. Restart your Convex development server
4. Clear browser cache and re-login

### Schema deployment fails

If schema deployment fails:

1. Make sure you have the latest Convex CLI: `npm install -g convex@latest`
2. Check for syntax errors in `convex/schema.ts`
3. Run `npx convex dev --clear-deployment` to force a clean deployment

## Running the Application

1. Start Convex development server:
   ```bash
   npx convex dev
   ```

2. In a separate terminal, start the React development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173` (or the port shown in terminal)

## Key Files

- `convex/auth.config.ts` - Clerk authentication configuration
- `convex/schema.ts` - Database schema definition
- `convex/` - All backend functions (queries and mutations)
- `src/convexClient.ts` - Convex client configuration

## Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Clerk + Convex Integration](https://docs.convex.dev/auth/clerk)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
