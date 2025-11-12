// Configuration de l'authentification Clerk pour Convex
// 
// Ce fichier configure Convex pour accepter et valider les tokens JWT de Clerk.
//
// IMPORTANT: Remplacez l'Issuer URL par votre propre URL de Clerk.
// Vous pouvez trouver votre Issuer URL dans le Dashboard Clerk sous:
//   Configure → JWT Templates → Issuer
//
// Format typique: https://[votre-instance].clerk.accounts.dev
//
// Vous pouvez aussi utiliser une variable d'environnement:
//   npx convex env set CLERK_ISSUER_URL "https://votre-instance.clerk.accounts.dev"
// Puis utiliser: domain: process.env.CLERK_ISSUER_URL

export default {
  providers: [
    {
      // Remplacez cette URL par votre Issuer URL de Clerk
      domain: "https://firm-cowbird-57.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

