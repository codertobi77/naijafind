import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upload verification document for supplier
 */
export const uploadVerificationDocument = mutation({
  args: {
    supplierId: v.string(),
    documentType: v.string(),
    documentUrl: v.string(),
    documentName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // Verify that the supplier belongs to the current user
    const supplier = await ctx.db.get(args.supplierId as any) as any;
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }

    if (supplier.userId !== identity.subject) {
      throw new Error("Vous n'êtes pas autorisé à télécharger des documents pour ce fournisseur");
    }

    // Check if document already exists
    const existingDoc = await ctx.db
      .query("verification_documents")
      .filter((q) => 
        q.and(
          q.eq(q.field("supplierId"), args.supplierId),
          q.eq(q.field("documentType"), args.documentType)
        )
      )
      .first();

    if (existingDoc) {
      // Update existing document
      await ctx.db.patch(existingDoc._id, {
        documentUrl: args.documentUrl,
        documentName: args.documentName,
        status: "pending",
        uploadedAt: new Date().toISOString(),
        reviewedAt: undefined,
        reviewedBy: undefined,
        rejectionReason: undefined,
      });
      return { success: true, documentId: existingDoc._id };
    }

    // Create new document
    const documentId = await ctx.db.insert("verification_documents", {
      supplierId: args.supplierId,
      documentType: args.documentType,
      documentUrl: args.documentUrl,
      documentName: args.documentName,
      status: "pending",
      uploadedAt: new Date().toISOString(),
    });

    return { success: true, documentId };
  },
});

/**
 * Get verification documents for a supplier
 */
export const getVerificationDocuments = query({
  args: { supplierId: v.string() },
  handler: async (ctx, { supplierId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // Verify access
    const supplier = await ctx.db.get(supplierId as any) as any;
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }

    // Check if user is admin or supplier owner
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    const isAdmin = user?.is_admin === true;
    const isOwner = supplier.userId === identity.subject;

    if (!isAdmin && !isOwner) {
      throw new Error("Accès non autorisé");
    }

    const documents = await ctx.db
      .query("verification_documents")
      .filter((q) => q.eq(q.field("supplierId"), supplierId))
      .collect();

    return documents;
  },
});

/**
 * Admin: Review verification document
 */
export const reviewVerificationDocument = mutation({
  args: {
    documentId: v.string(),
    status: v.string(), // 'approved' | 'rejected'
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const document = await ctx.db.get(args.documentId as any) as any;
    if (!document) {
      throw new Error("Document non trouvé");
    }

    await ctx.db.patch(args.documentId as any, {
      status: args.status,
      rejectionReason: args.rejectionReason,
      reviewedAt: new Date().toISOString(),
      reviewedBy: identity.subject,
    });

    // Check if all required documents are approved
    const supplierId = (document as any).supplierId;
    const allDocuments = await ctx.db
      .query("verification_documents")
      .filter((q) => q.eq(q.field("supplierId"), supplierId))
      .collect();

    const requiredDocTypes = ["business_registration", "tax_certificate", "id_card"];
    const approvedDocs = allDocuments.filter(doc => doc.status === "approved");
    const hasAllRequired = requiredDocTypes.every(type => 
      approvedDocs.some(doc => doc.documentType === type)
    );

    // Update supplier verification status
    if (hasAllRequired) {
      await ctx.db.patch(supplierId as any, {
        verified: true,
        updated_at: new Date().toISOString(),
      });
    }

    return { success: true, allDocumentsApproved: hasAllRequired };
  },
});

/**
 * Admin: Get all pending verification documents
 */
export const getPendingVerificationDocuments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const pendingDocuments = await ctx.db
      .query("verification_documents")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Enrich with supplier information
    const documentsWithSupplier = await Promise.all(
      pendingDocuments.map(async (doc) => {
        const supplier = await ctx.db.get(doc.supplierId as any) as any;
        return {
          ...doc,
          supplierName: (supplier as any)?.business_name || "Unknown",
          supplierEmail: (supplier as any)?.email || "Unknown",
        };
      })
    );

    return documentsWithSupplier;
  },
});

/**
 * Get verification status for a supplier
 */
export const getVerificationStatus = query({
  args: { supplierId: v.string() },
  handler: async (ctx, { supplierId }) => {
    const documents = await ctx.db
      .query("verification_documents")
      .filter((q) => q.eq(q.field("supplierId"), supplierId))
      .collect();

    const requiredDocTypes = [
      { type: "business_registration", label: "Business Registration" },
      { type: "tax_certificate", label: "Tax Certificate" },
      { type: "id_card", label: "ID Card" },
      { type: "proof_of_address", label: "Proof of Address (Optional)" },
    ];

    const status = requiredDocTypes.map(docType => {
      const doc = documents.find(d => d.documentType === docType.type);
      return {
        type: docType.type,
        label: docType.label,
        uploaded: !!doc,
        status: doc?.status || "not_uploaded",
        rejectionReason: doc?.rejectionReason,
      };
    });

    const requiredUploaded = status
      .filter(s => s.type !== "proof_of_address")
      .every(s => s.uploaded);

    const allApproved = status
      .filter(s => s.type !== "proof_of_address")
      .every(s => s.status === "approved");

    return {
      documents: status,
      requiredUploaded,
      allApproved,
      canBeVerified: requiredUploaded && allApproved,
    };
  },
});
