import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Fusionner les champs d'authTables avec nos champs personnalisés
  users: defineTable({
    // Champs de Convex Auth (optionnels dans authTables)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Nos champs personnalisés
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    user_type: v.optional(v.string()), // 'user' | 'supplier'
    created_at: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  authSessions: authTables.authSessions,
  authAccounts: authTables.authAccounts,
  authRefreshTokens: authTables.authRefreshTokens,
  authVerificationCodes: authTables.authVerificationCodes,
  suppliers: defineTable({
    userId: v.string(), // id de l'utilisateur propriétaire
    business_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    rating: v.optional(v.float64()),
    reviews_count: v.optional(v.int64()),
    verified: v.optional(v.boolean()),
    logo_url: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    business_hours: v.optional(v.record(v.string(), v.string())),
    social_links: v.optional(v.record(v.string(), v.string())),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("userId", ["userId"]), // Index unique pour garantir 1 supplier par user
  products: defineTable({
    supplierId: v.string(),
    name: v.string(),
    price: v.float64(),
    stock: v.int64(),
    status: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }),
  orders: defineTable({
    supplierId: v.string(),
    order_number: v.string(),
    total_amount: v.float64(),
    status: v.string(),
    payment_status: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }),
  reviews: defineTable({
    supplierId: v.string(),
    userId: v.string(),
    rating: v.float64(),
    comment: v.optional(v.string()),
    response: v.optional(v.string()),
    status: v.optional(v.string()),
    created_at: v.string(),
  }),
});
