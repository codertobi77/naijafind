import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl || !/^https?:\/\//.test(convexUrl)) {
    throw new Error("VITE_CONVEX_URL is missing or not an absolute URL (must start with http/https)");
}

export const convex = new ConvexReactClient(convexUrl);
