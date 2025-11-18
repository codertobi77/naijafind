import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    user_type: v.optional(v.string()), // 'user' | 'supplier' | 'admin'
    is_admin: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
  })
    .index("email", ["email"]) 
    .index("phone", ["phone"]),
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
    verified: v.boolean(),
    approved: v.boolean(), // Supplier approval status: false (pending approval), true (approved)
    featured: v.boolean(), // Featured business status: false (not featured), true (featured)
    logo_url: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    business_hours: v.optional(v.record(v.string(), v.string())),
    social_links: v.optional(v.record(v.string(), v.string())),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("userId", ["userId"]) // Index unique pour garantir 1 supplier par user
    .index("approved", ["approved"])
    .index("featured", ["featured"]), // Index pour améliorer les performances des requêtes
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
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    order: v.optional(v.float64()),
    created_at: v.string(),
    created_by: v.optional(v.string()), // userId de l'admin qui a créé
  })
    .index("name", ["name"])
    .index("is_active", ["is_active"]),
});
