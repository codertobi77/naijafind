/**
 * Product Dictionary for Search Enhancement
 * Comprehensive dictionary with 10,000+ product terms with synonyms and associations
 * Organized by supplier categories from the database
 * 
 * Categories:
 * - Beauté & Cosmétique
 * - Mode
 * - Électronique
 * - Agroalimentaire
 * - Packaging
 * - IT
 * - Auto
 * - BTP (Construction)
 * - Acier & Métal
 * - Hôtellerie
 */

import beautyCosmeticsTerms from './terms/beautyCosmeticsTerms';
import fashionTerms from './terms/fashionTerms';
import electronicsTerms from './terms/electronicsTerms';
import foodTerms from './terms/foodTerms';
import packagingTerms from './terms/packagingTerms';
import itTerms from './terms/itTerms';
import automotiveTerms from './terms/automotiveTerms';
import constructionTerms from './terms/constructionTerms';
import metalTerms from './terms/metalTerms';
import hospitalityTerms from './terms/hospitalityTerms';

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

// Combined dictionary with all terms
export const allProductTerms: ProductTerm[] = [
  ...beautyCosmeticsTerms,
  ...fashionTerms,
  ...electronicsTerms,
  ...foodTerms,
  ...packagingTerms,
  ...itTerms,
  ...automotiveTerms,
  ...constructionTerms,
  ...metalTerms,
  ...hospitalityTerms,
];

// Main dictionary organized by categories
export const productDictionary: Record<string, CategoryDictionary> = {
  "beauty_cosmetics": {
    name: "Beauté & Cosmétique",
    terms: beautyCosmeticsTerms
  },
  "fashion": {
    name: "Mode",
    terms: fashionTerms
  },
  "electronics": {
    name: "Électronique",
    terms: electronicsTerms
  },
  "food": {
    name: "Agroalimentaire",
    terms: foodTerms
  },
  "packaging": {
    name: "Packaging",
    terms: packagingTerms
  },
  "it": {
    name: "IT",
    terms: itTerms
  },
  "automotive": {
    name: "Auto",
    terms: automotiveTerms
  },
  "construction": {
    name: "BTP",
    terms: constructionTerms
  },
  "metal": {
    name: "Acier & Métal",
    terms: metalTerms
  },
  "hospitality": {
    name: "Hôtellerie",
    terms: hospitalityTerms
  }
};

// Statistics
export const dictionaryStats = {
  totalTerms: allProductTerms.length,
  categoryCount: Object.keys(productDictionary).length,
  categories: Object.entries(productDictionary).map(([key, value]) => ({
    key,
    name: value.name,
    termCount: value.terms.length
  }))
};

// Search helper functions
export function findTermByKeyword(keyword: string): ProductTerm[] {
  const lowerKeyword = keyword.toLowerCase();
  return allProductTerms.filter(term => 
    term.term.toLowerCase().includes(lowerKeyword) ||
    term.synonyms.some(s => s.toLowerCase().includes(lowerKeyword)) ||
    term.relatedTerms.some(r => r.toLowerCase().includes(lowerKeyword))
  );
}

export function findTermsByCategory(category: string): ProductTerm[] {
  return allProductTerms.filter(term => term.category === category);
}

export function findTermsBySubcategory(subcategory: string): ProductTerm[] {
  return allProductTerms.filter(term => term.subcategory === subcategory);
}

export function getAllSynonyms(term: string): string[] {
  const found = allProductTerms.find(t => 
    t.term.toLowerCase() === term.toLowerCase() ||
    t.synonyms.some(s => s.toLowerCase() === term.toLowerCase())
  );
  return found ? [found.term, ...found.synonyms] : [term];
}

export function getRelatedTerms(term: string): string[] {
  const found = allProductTerms.find(t => 
    t.term.toLowerCase() === term.toLowerCase() ||
    t.synonyms.some(s => s.toLowerCase() === term.toLowerCase())
  );
  return found ? found.relatedTerms : [];
}

// Export for search enhancement
export function expandSearchQuery(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/);
  const expanded: Set<string> = new Set(terms);
  
  terms.forEach(term => {
    const matches = findTermByKeyword(term);
    matches.forEach(match => {
      expanded.add(match.term.toLowerCase());
      match.synonyms.forEach(s => expanded.add(s.toLowerCase()));
    });
  });
  
  return Array.from(expanded);
}

export default productDictionary;
