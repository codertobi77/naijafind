import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Parcours « demandes d'achat » du dashboard (fournisseurs ET acheteurs).
 *
 * Pattern d'identité post-Phase-1 (cf. convex/purchaseRequests.ts) :
 *   const identity = await ctx.auth.getUserIdentity();
 *   if (!identity) throw new Error("Non autorisé");
 * Les comparaisons userId se font sur `identity.tokenIdentifier` (PAS `subject`).
 *
 * NB : chaque handler porte une annotation de retour explicite. Sans elle,
 * l'inférence du wrapper `query()` explose (TS2589 « Type instantiation is
 * excessively deep ») et la codegen retombe sur `any` dans api.d.ts.
 *
 * De même, les types de retour sont des interfaces « plates » écrites
 * champ par champ : PAS d'intersection `Doc<...> & {...}` ni de spread
 * `...request`.
 *
 * Écart documenté (audit Phase 3) : malgré ces précautions, l'enregistrement
 * du module dans l'union api.d.ts (ApiFromModules) fait émettre 11×TS2589
 * aux sites `query()` — même phénomène que les 6 modules convex déjà
 * touchés (sendEmail ×2, rateLimit ×4, searchNative ×22, searchSuggestions
 * ×39, statsOptimized ×23, statsCron ×60, soit 150 TS2589 pré-existants).
 * C'est un seuil de complexité GLOBAL de l'union, pas une propriété de ce
 * module : un retour flat minimaliste le déclenche aussi, et une copie
 * byte-identique NON enregistrée dans api.d.ts ne produit aucune erreur.
 * Conséquence pour les consommateurs : le `_returnType` dégénère en `any`
 * sous tsc — les pages importent donc les types plats exportés ci-dessous
 * et annotent explicitement leurs callbacks.
 *
 * Les mutations de référence (submitQuote, deletePurchaseRequest,
 * updatePurchaseRequestStatus) vivent dans convex/purchaseRequests.ts et sont
 * réutilisées depuis l'UI — elles ne sont PAS dupliquées ici.
 */

/**
 * Miroir « plat » de la table purchaseRequests (champs requis + champs
 * optionnels explicitement `| undefined`), sans passer par Doc<>.
 */
export type PurchaseRequestSummary = {
  _id: Id<"purchaseRequests">;
  _creationTime: number;
  description: string;
  quantity: number;
  unit: string;
  budget: string | undefined;
  whatsapp: string;
  attachment: string | undefined;
  location: string | undefined;
  currency: string | undefined;
  additionalInfo: string | undefined;
  contactName: string | undefined;
  contactEmail: string | undefined;
  contactPhone: string | undefined;
  preferredDeliveryDate: string | undefined;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type OpenPurchaseRequest = {
  _id: Id<"purchaseRequests">;
  _creationTime: number;
  description: string;
  quantity: number;
  unit: string;
  budget: string | undefined;
  whatsapp: string;
  attachment: string | undefined;
  location: string | undefined;
  currency: string | undefined;
  additionalInfo: string | undefined;
  contactName: string | undefined;
  contactEmail: string | undefined;
  contactPhone: string | undefined;
  preferredDeliveryDate: string | undefined;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
};

export type MyPurchaseRequest = {
  _id: Id<"purchaseRequests">;
  _creationTime: number;
  description: string;
  quantity: number;
  unit: string;
  budget: string | undefined;
  whatsapp: string;
  attachment: string | undefined;
  location: string | undefined;
  currency: string | undefined;
  additionalInfo: string | undefined;
  contactName: string | undefined;
  contactEmail: string | undefined;
  contactPhone: string | undefined;
  preferredDeliveryDate: string | undefined;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  quotesCount: number;
};

type SupplierSummary = {
  _id: Id<"suppliers">;
  business_name: string;
  city: string;
  state: string;
  verified: boolean;
  logo_url: string | null;
};

export type PublicQuote = {
  _id: Id<"quotes">;
  _creationTime: number;
  requestId: Id<"purchaseRequests">;
  supplierId: Id<"suppliers">;
  supplierName: string;
  supplierEmail: string;
  price: number;
  currency: string;
  deliveryTime: string;
  message: string;
  validUntil: string | undefined;
  status: string;
  createdAt: string;
  isMine: boolean;
  supplier: SupplierSummary | null;
};

export type PurchaseRequestDetail = {
  request: PurchaseRequestSummary;
  quotes: PublicQuote[];
  isOwner: boolean;
};

export type SupplierProfileSummary = {
  _id: Id<"suppliers">;
  business_name: string;
  city: string;
  state: string;
  verified: boolean;
  approved: boolean;
};

/**
 * Demandes d'achat ouvertes (status 'pending'), les plus récentes d'abord,
 * destinées aux fournisseurs qui veulent y répondre.
 *
 * NB : il n'existe pas d'index composite status+createdAt (le schéma est
 * figé), on lit donc un échantillon borné via l'index `status` puis on trie
 * par `createdAt` décroissant en mémoire.
 */
export const getOpenPurchaseRequests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<OpenPurchaseRequest[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    // Échantillon borné (≤ 200 lignes) pour rester léger.
    const pending = await ctx.db
      .query("purchaseRequests")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .take(200);

    // Les dates ISO se trient lexicographiquement.
    const requests = [...pending].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
    );

    return requests.slice(0, limit).map(
      (request): OpenPurchaseRequest => ({
        _id: request._id,
        _creationTime: request._creationTime,
        description: request.description,
        quantity: request.quantity,
        unit: request.unit,
        budget: request.budget,
        whatsapp: request.whatsapp,
        attachment: request.attachment,
        location: request.location,
        currency: request.currency,
        additionalInfo: request.additionalInfo,
        contactName: request.contactName,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
        preferredDeliveryDate: request.preferredDeliveryDate,
        status: request.status,
        userId: request.userId,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        isOwner: request.userId === identity.tokenIdentifier,
      })
    );
  },
});

/**
 * Demandes d'achat créées par l'utilisateur connecté
 * (userId === identity.tokenIdentifier), avec le nombre de devis reçus.
 */
export const getMyPurchaseRequests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<MyPurchaseRequest[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    const requests = await ctx.db
      .query("purchaseRequests")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(limit);

    // Les dates ISO se trient lexicographiquement.
    const sorted = [...requests].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
    );

    return Promise.all(
      sorted.map(async (request): Promise<MyPurchaseRequest> => {
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("requestId", (q) => q.eq("requestId", request._id))
          .take(100);
        return {
          _id: request._id,
          _creationTime: request._creationTime,
          description: request.description,
          quantity: request.quantity,
          unit: request.unit,
          budget: request.budget,
          whatsapp: request.whatsapp,
          attachment: request.attachment,
          location: request.location,
          currency: request.currency,
          additionalInfo: request.additionalInfo,
          contactName: request.contactName,
          contactEmail: request.contactEmail,
          contactPhone: request.contactPhone,
          preferredDeliveryDate: request.preferredDeliveryDate,
          status: request.status,
          userId: request.userId,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          quotesCount: quotes.length,
        };
      })
    );
  },
});

/**
 * Détail d'une demande d'achat avec ses devis, enrichis des infos
 * fournisseur (business_name, localisation, vérification, logo).
 *
 * Règles de visibilité des devis :
 * - propriétaire de la demande → tous les devis reçus ;
 * - autre utilisateur authentifié (ex. fournisseur) → uniquement les devis
 *   soumis depuis SES propres profils fournisseurs (on ne divulgue pas les
 *   prix des concurrents).
 */
export const getPurchaseRequestDetail = query({
  args: {
    requestId: v.id("purchaseRequests"),
  },
  handler: async (ctx, args): Promise<PurchaseRequestDetail | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return null;
    }

    const isOwner = request.userId === identity.tokenIdentifier;

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("requestId", (q) => q.eq("requestId", args.requestId))
      .take(50);

    // Annotation explicite : la résolution de `Promise.all` sur les types
    // de l'api dégénère en `any` (cf. écart TS2589 en tête de fichier), ce
    // qui rendrait les callbacks suivants implicitement `any` (TS7006).
    const enriched: Array<{
      quote: Doc<"quotes">;
      supplier: Doc<"suppliers"> | null;
      ownedByMe: boolean;
    }> = await Promise.all(
      quotes.map(async (quote) => {
        const supplier = await ctx.db.get(quote.supplierId);
        return {
          quote,
          supplier,
          ownedByMe: supplier ? supplier.userId === identity.tokenIdentifier : false,
        };
      })
    );

    // Tri par date décroissante (les dates ISO se trient lexicographiquement).
    const visibleQuotes: PublicQuote[] = enriched
      .sort((a, b) =>
        a.quote.createdAt < b.quote.createdAt
          ? 1
          : a.quote.createdAt > b.quote.createdAt
            ? -1
            : 0
      )
      .filter((entry) => isOwner || entry.ownedByMe)
      .map(
        (entry): PublicQuote => ({
          _id: entry.quote._id,
          _creationTime: entry.quote._creationTime,
          requestId: entry.quote.requestId,
          supplierId: entry.quote.supplierId,
          supplierName: entry.quote.supplierName,
          supplierEmail: entry.quote.supplierEmail,
          price: entry.quote.price,
          currency: entry.quote.currency,
          deliveryTime: entry.quote.deliveryTime,
          message: entry.quote.message,
          validUntil: entry.quote.validUntil,
          status: entry.quote.status,
          createdAt: entry.quote.createdAt,
          isMine: entry.ownedByMe,
          supplier: entry.supplier
            ? {
                _id: entry.supplier._id,
                business_name: entry.supplier.business_name,
                city: entry.supplier.city,
                state: entry.supplier.state,
                verified: entry.supplier.verified,
                logo_url: entry.supplier.logo_url ?? entry.supplier.image ?? null,
              }
            : null,
        })
      );

    return {
      request: {
        _id: request._id,
        _creationTime: request._creationTime,
        description: request.description,
        quantity: request.quantity,
        unit: request.unit,
        budget: request.budget,
        whatsapp: request.whatsapp,
        attachment: request.attachment,
        location: request.location,
        currency: request.currency,
        additionalInfo: request.additionalInfo,
        contactName: request.contactName,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
        preferredDeliveryDate: request.preferredDeliveryDate,
        status: request.status,
        userId: request.userId,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
      quotes: visibleQuotes,
      isOwner,
    };
  },
});

/**
 * Profils fournisseurs de l'utilisateur connecté (un user peut en gérer
 * plusieurs). Utilisé par le formulaire de devis pour choisir le profil
 * au nom duquel soumettre.
 */
export const getMySupplierProfiles = query({
  args: {},
  handler: async (ctx): Promise<SupplierProfileSummary[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Non autorisé");
    }

    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .take(20);

    return suppliers.map(
      (supplier): SupplierProfileSummary => ({
        _id: supplier._id,
        business_name: supplier.business_name,
        city: supplier.city,
        state: supplier.state,
        verified: supplier.verified,
        approved: supplier.approved,
      })
    );
  },
});
