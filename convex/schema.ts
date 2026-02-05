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
    image: v.optional(v.string()), // Profile image URL
    imageGallery: v.optional(v.array(v.string())), // Array of gallery image URLs
    business_hours: v.optional(v.record(v.string(), v.string())),
    social_links: v.optional(v.record(v.string(), v.string())),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("userId", ["userId"]) // Index pour garantir 1 supplier par user (application-level enforced)
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
  })
    .index("supplierId", ["supplierId"])
    .index("userId", ["userId"])
    .index("created_at", ["created_at"]),
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    image: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    order: v.optional(v.float64()),
    created_at: v.string(),
    created_by: v.optional(v.string()), // userId de l'admin qui a créé
  })
    .index("name", ["name"])
    .index("is_active", ["is_active"]),
  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    type: v.string(), // 'general' | 'supplier' | 'technical' | 'partnership' | 'feedback'
    status: v.string(), // 'pending' | 'in_progress' | 'resolved'
    created_at: v.string(),
  })
    .index("email", ["email"])
    .index("status", ["status"])
    .index("created_at", ["created_at"]),
  messages: defineTable({
    supplierId: v.string(),
    senderName: v.string(),
    senderEmail: v.string(),
    senderPhone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
    status: v.string(), // 'unread' | 'read' | 'replied'
    created_at: v.string(),
  })
    .index("supplierId", ["supplierId"])
    .index("status", ["status"])
    .index("created_at", ["created_at"]),
  verification_tokens: defineTable({
    userId: v.string(),
    email: v.string(),
    token: v.string(),
    type: v.string(), // 'email' | 'supplier_verification'
    expiresAt: v.string(),
    created_at: v.string(),
  })
    .index("token", ["token"])
    .index("userId", ["userId"])
    .index("email", ["email"]),
  password_reset_tokens: defineTable({
    userId: v.string(),
    email: v.string(),
    token: v.string(),
    expiresAt: v.string(),
    created_at: v.string(),
  })
    .index("token", ["token"])
    .index("email", ["email"]),
  verification_documents: defineTable({
    supplierId: v.string(),
    documentType: v.string(), // 'business_registration' | 'tax_certificate' | 'id_card' | 'proof_of_address'
    documentUrl: v.string(),
    documentName: v.string(),
    status: v.string(), // 'pending' | 'approved' | 'rejected'
    rejectionReason: v.optional(v.string()),
    uploadedAt: v.string(),
    reviewedAt: v.optional(v.string()),
    reviewedBy: v.optional(v.string()), // userId of admin who reviewed
  })
    .index("supplierId", ["supplierId"])
    .index("status", ["status"]),
  rate_limit_attempts: defineTable({
    identifier: v.string(), // email or IP address
    action: v.string(), // 'contact_form', 'supplier_message', etc.
    timestamp: v.number(),
  })
    .index("identifier_action", ["identifier", "action"])
    .index("timestamp", ["timestamp"]),
});
