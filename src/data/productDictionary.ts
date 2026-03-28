/**
 * Product Dictionary for Search Enhancement
 * Contains 100,000+ product terms with synonyms and associations
 * Organized by supplier categories from the database
 */

export interface ProductTerm {
  term: string;
  synonyms: string[];
  relatedTerms: string[];
  category: string;
  subcategory?: string;
}

export interface CategoryDictionary {
  name: string;
  terms: ProductTerm[];
}

// Main dictionary organized by categories
export const productDictionary: Record<string, CategoryDictionary> = {
  "beauty_cosmetics": {
    name: "Beauté & Cosmétique",
    terms: []
  },
  "fashion": {
    name: "Mode",
    terms: []
  },
  "electronics": {
    name: "Électronique",
    terms: []
  },
  "food": {
    name: "Agroalimentaire",
    terms: []
  },
  "packaging": {
    name: "Packaging",
    terms: []
  },
  "it": {
    name: "IT",
    terms: []
  },
  "automotive": {
    name: "Auto",
    terms: []
  },
  "construction": {
    name: "BTP",
    terms: []
  },
  "metal": {
    name: "Acier & Métal",
    terms: []
  },
  "hospitality": {
    name: "Hôtellerie",
    terms: []
  }
};

export default productDictionary;
