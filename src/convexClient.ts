import { ConvexReactClient } from "convex/react";

// Remplace par ton URL de déploiement Convex si défini (variable d'env ou hardcoded)
const convexUrl = import.meta.env.VITE_CONVEX_URL || "";

export const convex = new ConvexReactClient(convexUrl);
