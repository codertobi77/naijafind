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
    tokenIdentifier: v.optional(v.string()), // Auth provider ID (e.g., auth0|...)
  })
    .index("email", ["email"]) 
    .index("phone", ["phone"])
    .index("tokenIdentifier", ["tokenIdentifier"]),
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
    country: v.optional(v.string()),
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
    business_type: v.optional(v.string()), // 'products' or 'services'
    created_at: v.string(),
    updated_at: v.string(),
    claimStatus: v.optional(v.string()), // 'pending', 'approved', 'rejected'
    claimId: v.optional(v.string()), // Reference to supplierClaims
  })
    .index("userId", ["userId"])
    .index("approved", ["approved"])
    .index("featured", ["featured"])
    .index("claimStatus", ["claimStatus"]),
  products: defineTable({
    supplierId: v.string(),
    name: v.string(),
    price: v.float64(),
    stock: v.int64(),
    status: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("supplierId", ["supplierId"])
    .index("status", ["status"])
    .index("category", ["category"]),
  reviews: defineTable({
    supplierId: v.string(),
    userId: v.string(),
    rating: v.float64(),
    comment: v.optional(v.string()),
    response: v.optional(v.string()),
    status: v.optional(v.string()),
    sourceLanguage: v.optional(v.string()), // Langue détectée du commentaire (ex: 'en', 'fr', 'es')
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
  // Newsletter subscriptions
  newsletter_subscriptions: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    sector: v.optional(v.string()),
    status: v.string(), // 'active' | 'unsubscribed' | 'bounced'
    subscribedAt: v.string(),
    unsubscribedAt: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("status", ["status"]),
  // Notifications system for users and suppliers
  notifications: defineTable({
    userId: v.string(), // Recipient user ID
    type: v.string(), // 'order', 'review', 'message', 'system', 'verification', 'approval'
    title: v.string(),
    message: v.string(),
    data: v.optional(v.record(v.string(), v.any())), // Additional data (orderId, reviewId, etc.)
    read: v.boolean(),
    actionUrl: v.optional(v.string()), // Optional link to navigate to
    createdAt: v.string(),
  })
    .index("userId", ["userId"])
    .index("userId_read", ["userId", "read"])
    .index("createdAt", ["createdAt"]),
  // Ad banners for homepage and other pages
  ad_banners: defineTable({
    name: v.string(), // Banner name/title
    image: v.string(), // Image URL or base64
    link: v.optional(v.string()), // Optional click-through URL
    position: v.string(), // 'homepage_top', 'homepage_bottom', 'sidebar', etc.
    is_active: v.boolean(),
    order: v.optional(v.number()), // Display order
    start_date: v.optional(v.string()), // Optional start date (ISO string)
    end_date: v.optional(v.string()), // Optional end date (ISO string)
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("position", ["position"])
    .index("is_active", ["is_active"])
    .index("position_active", ["position", "is_active"]),
  // Supplier claims for business ownership verification
  supplierClaims: defineTable({
    supplierId: v.id("suppliers"),
    userId: v.string(),
    userEmail: v.string(),
    supplierEmail: v.string(),
    status: v.string(), // 'pending', 'approved', 'rejected'
    claimedAt: v.string(),
    verifiedAt: v.optional(v.string()),
    verifiedBy: v.optional(v.string()), // userId of admin who verified
    notes: v.optional(v.string()),
  })
    .index("supplierId", ["supplierId"])
    .index("userId", ["userId"])
    .index("status", ["status"]),
  // Bulk import jobs for tracking scheduled imports
  importJobs: defineTable({
    status: v.string(), // 'pending', 'processing', 'completed', 'failed'
    totalSuppliers: v.number(),
    processedSuppliers: v.number(),
    successCount: v.number(),
    errorCount: v.number(),
    errors: v.optional(v.array(v.object({ supplier: v.string(), error: v.string() }))),
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
    scheduledBy: v.string(), // admin userId
  })
    .index("status", ["status"])
    .index("scheduledBy", ["scheduledBy"]),
  // Bulk import jobs for tracking scheduled product imports
  productImportJobs: defineTable({
    status: v.string(), // 'pending', 'processing', 'completed', 'failed'
    totalProducts: v.number(),
    processedProducts: v.number(),
    successCount: v.number(),
    errorCount: v.number(),
    errors: v.optional(v.array(v.object({ product: v.string(), error: v.string() }))),
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
    scheduledBy: v.string(), // admin userId
  })
    .index("status", ["status"])
    .index("scheduledBy", ["scheduledBy"]),
  // Global statistics counters
  stats: defineTable({
    key: v.string(), // 'totalSuppliers', 'totalUsers', 'totalReviews', 'totalProducts', 'pendingSuppliers', 'approvedSuppliers', 'featuredSuppliers', etc.
    value: v.number(), // the counter value
    category: v.optional(v.string()), // 'global', 'category', 'supplier' for grouping
    metadata: v.optional(v.record(v.string(), v.any())), // extra data like category name, supplierId, etc.
    updatedAt: v.string(),
  })
    .index("key", ["key"])
    .index("category", ["category"]),
});
