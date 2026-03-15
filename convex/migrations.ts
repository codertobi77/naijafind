import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);

// ==========================================
// MIGRATION 1: Add isSearchable field
// ==========================================
/**
 * Migration pour ajouter le champ isSearchable aux produits
 * Défaut: true pour tous les produits existants
 */
export const setDefaultIsSearchable = migrations.define({
  table: "products",
  migrateOne: async (ctx, product) => {
    if (product.isSearchable === undefined || product.isSearchable === null) {
      return { isSearchable: true };
    }
    // No changes needed
  },
});

// ==========================================
// MIGRATION 2: Add originalLanguage field
// ==========================================
/**
 * Migration pour ajouter le champ originalLanguage
 * Détecte automatiquement la langue (fr/en) basée sur le contenu
 */
export const setOriginalLanguage = migrations.define({
  table: "products",
  migrateOne: async (ctx, product) => {
    if (product.originalLanguage === undefined) {
      // Simple language detection
      const textToCheck = `${product.name} ${product.description || ""}`.toLowerCase();
      const frenchWords = ["le", "la", "les", "un", "une", "des", "et", "pour", "dans", "avec", "chez"];
      const hasFrenchWords = frenchWords.some((word) => textToCheck.includes(` ${word} `));
      
      return {
        originalLanguage: hasFrenchWords ? "fr" : "en",
      };
    }
    // No changes needed
  },
});

// ==========================================
// MIGRATION 3: Add keywords field
// ==========================================
/**
 * Migration pour ajouter le champ keywords
 * Génère des mots-clés de recherche basés sur le nom, la description et la catégorie
 */
export const setKeywords = migrations.define({
  table: "products",
  migrateOne: async (ctx, product) => {
    if (product.keywords === undefined) {
      const keywords: string[] = [];
      
      // Add name words
      const nameWords = product.name
        .toLowerCase()
        .split(/[\s,;:\-\|\/\(\)\[\]\{\}_\*\.]+/)
        .filter((w) => w.length > 2);
      keywords.push(...nameWords);
      
      // Add category
      if (product.category) {
        keywords.push(product.category.toLowerCase());
        
        // Category-specific keywords
        const categoryKeywords: Record<string, string[]> = {
          electronics: ["electronic", "device", "gadget", "tech"],
          it: ["computer", "software", "hardware", "it", "technology"],
          food: ["food", "agriculture", "agro", "organic", "fresh"],
          agroalimentaire: ["food", "agriculture", "agro", "organic", "fresh"],
          beauty: ["cosmetic", "beauty", "care", "personal care"],
          santé: ["health", "medical", "care", "wellness"],
          construction: ["building", "construction", "material", "btp"],
          btp: ["building", "construction", "material", "infrastructure"],
          clothing: ["clothing", "fashion", "apparel", "textile"],
          automotive: ["auto", "car", "vehicle", "automotive", "parts"],
          auto: ["auto", "car", "vehicle", "automotive", "parts"],
          sports: ["sport", "fitness", "equipment", "activity"],
          home: ["furniture", "home", "interior", "decor"],
          kitchen: ["kitchen", "cooking", "appliance", "culinary"],
        };
        
        const catLower = product.category.toLowerCase();
        const related = categoryKeywords[catLower];
        if (related) {
          keywords.push(...related);
        }
      }
      
      // Extract keywords from description
      if (product.description) {
        const commonStopWords = new Set([
          "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
          "of", "with", "by", "from", "up", "about", "into", "through",
          "le", "la", "les", "un", "une", "des", "et", "pour", "dans", "avec",
        ]);
        
        const descWords = product.description
          .toLowerCase()
          .split(/[\s,;:\-\|\/\(\)\[\]\{\}_\*\.]+/)
          .filter((w) => w.length > 3)
          .filter((w) => !commonStopWords.has(w));
        
        keywords.push(...descWords.slice(0, 10));
      }
      
      // Remove duplicates and limit to 20
      const uniqueKeywords = [...new Set(keywords)].slice(0, 20);
      
      return { keywords: uniqueKeywords };
    }
    // No changes needed
  },
});

// ==========================================
// MIGRATION 4: Complete product migration
// ==========================================
/**
 * Migration complète qui ajoute tous les champs en une seule passe
 * Plus efficace que d'exécuter les 3 migrations séparément
 */
export const completeProductMigration = migrations.define({
  table: "products",
  migrateOne: async (ctx, product) => {
    const updates: Record<string, any> = {};
    let needsUpdate = false;
    
    // Add isSearchable
    if (product.isSearchable === undefined || product.isSearchable === null) {
      updates.isSearchable = true;
      needsUpdate = true;
    }
    
    // Add originalLanguage
    if (product.originalLanguage === undefined) {
      const textToCheck = `${product.name} ${product.description || ""}`.toLowerCase();
      const frenchWords = ["le", "la", "les", "un", "une", "des", "et", "pour", "dans", "avec", "chez"];
      const hasFrenchWords = frenchWords.some((word) => textToCheck.includes(` ${word} `));
      updates.originalLanguage = hasFrenchWords ? "fr" : "en";
      needsUpdate = true;
    }
    
    // Add keywords
    if (product.keywords === undefined) {
      const keywords: string[] = [];
      
      // Name words
      const nameWords = product.name
        .toLowerCase()
        .split(/[\s,;:\-\|\/\(\)\[\]\{\}_\*\.]+/)
        .filter((w) => w.length > 2);
      keywords.push(...nameWords);
      
      // Category
      if (product.category) {
        keywords.push(product.category.toLowerCase());
        
        const categoryKeywords: Record<string, string[]> = {
          electronics: ["electronic", "device", "gadget", "tech"],
          it: ["computer", "software", "hardware", "it", "technology"],
          food: ["food", "agriculture", "agro", "organic", "fresh"],
          agroalimentaire: ["food", "agriculture", "agro", "organic", "fresh"],
          beauty: ["cosmetic", "beauty", "care", "personal care"],
          santé: ["health", "medical", "care", "wellness"],
          construction: ["building", "construction", "material", "btp"],
          btp: ["building", "construction", "material", "infrastructure"],
          clothing: ["clothing", "fashion", "apparel", "textile"],
          automotive: ["auto", "car", "vehicle", "automotive", "parts"],
          auto: ["auto", "car", "vehicle", "automotive", "parts"],
          sports: ["sport", "fitness", "equipment", "activity"],
          home: ["furniture", "home", "interior", "decor"],
          kitchen: ["kitchen", "cooking", "appliance", "culinary"],
        };
        
        const catLower = product.category.toLowerCase();
        const related = categoryKeywords[catLower];
        if (related) {
          keywords.push(...related);
        }
      }
      
      // Description words
      if (product.description) {
        const commonStopWords = new Set([
          "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
          "of", "with", "by", "from", "up", "about", "into", "through",
          "le", "la", "les", "un", "une", "des", "et", "pour", "dans", "avec",
        ]);
        
        const descWords = product.description
          .toLowerCase()
          .split(/[\s,;:\-\|\/\(\)\[\]\{\}_\*\.]+/)
          .filter((w) => w.length > 3)
          .filter((w) => !commonStopWords.has(w));
        
        keywords.push(...descWords.slice(0, 10));
      }
      
      // Remove duplicates and limit to 20 - ensure plain array
      updates.keywords = Array.from(new Set(keywords)).slice(0, 20);
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      return updates;
    }
    
    // Return undefined if no updates needed
    return undefined;
  },
});
