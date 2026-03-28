import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Product Dictionary for Search Enhancement
 * Embedded dictionary data for use in Convex actions
 * 
 * This file contains key terms and synonyms from the full dictionary
 * optimized for search expansion.
 */

// Core dictionary data embedded for Convex use
const dictionaryTerms: Record<string, { synonyms: string[]; related: string[] }> = {
  // Beauty & Cosmetics
  "skincare": { synonyms: ["skin care", "beauty", "facial", "face care"], related: ["beauty", "cosmetics", "personal care"] },
  "makeup": { synonyms: ["cosmetics", "maquillage", "beauty products"], related: ["beauty", "face", "glamour"] },
  "lipstick": { synonyms: ["lip color", "lip tint", "rouge"], related: ["makeup", "beauty", "lips"] },
  "foundation": { synonyms: ["base", "makeup base", "concealer"], related: ["makeup", "face", "cosmetics"] },
  "shampoo": { synonyms: ["hair wash", "cleanser", "hair care"], related: ["beauty", "hair", "personal care"] },
  "perfume": { synonyms: ["fragrance", "scent", "parfum", "cologne"], related: ["beauty", "luxury", "personal care"] },
  
  // Fashion
  "clothing": { synonyms: ["apparel", "garments", "wear", "attire", "fashion"], related: ["fashion", "textile", "style"] },
  "dress": { synonyms: ["gown", "frock", "robe", "outfit"], related: ["fashion", "women", "clothing"] },
  "shirt": { synonyms: ["blouse", "top", "button-up", "chemise"], related: ["fashion", "men", "clothing"] },
  "shoes": { synonyms: ["footwear", "boots", "sneakers", "sandals"], related: ["fashion", "accessories", "leather"] },
  "handbag": { synonyms: ["purse", "bag", "tote", "clutch"], related: ["fashion", "accessories", "leather"] },
  "jewelry": { synonyms: ["jewellery", "accessories", "ornaments", "gems"], related: ["fashion", "luxury", "gold"] },
  "fabric": { synonyms: ["textile", "cloth", "material", "woven"], related: ["fashion", "manufacturing", "cotton"] },
  
  // Electronics
  "phone": { synonyms: ["mobile", "smartphone", "cell", "handset", "device"], related: ["electronics", "tech", "communication"] },
  "laptop": { synonyms: ["notebook", "computer", "portable", "pc"], related: ["electronics", "tech", "computing"] },
  "television": { synonyms: ["tv", "screen", "display", "monitor"], related: ["electronics", "home", "entertainment"] },
  "camera": { synonyms: ["dslr", "digital", "camcorder", "gopro"], related: ["electronics", "photography", "video"] },
  "headphones": { synonyms: ["earphones", "headset", "airpods", "earbuds"], related: ["electronics", "audio", "music"] },
  "charger": { synonyms: ["adapter", "power supply", "cable", "usb"], related: ["electronics", "accessories", "power"] },
  "battery": { synonyms: ["power bank", "cell", "accumulator", "lithium"], related: ["electronics", "power", "energy"] },
  
  // Food
  "rice": { synonyms: ["grain", "paddy", "basmati", "jasmine"], related: ["food", "agriculture", "staple"] },
  "flour": { synonyms: ["wheat", "meal", "powder", "semolina"], related: ["food", "baking", "grain"] },
  "oil": { synonyms: ["cooking oil", "vegetable oil", "palm oil", "olive oil"], related: ["food", "cooking", "fat"] },
  "sugar": { synonyms: ["sweetener", "sucrose", "cane sugar", "beet sugar"], related: ["food", "sweet", "baking"] },
  "milk": { synonyms: ["dairy", "cream", "yogurt", "cheese"], related: ["food", "dairy", "beverage"] },
  "meat": { synonyms: ["beef", "pork", "chicken", "lamb", "protein"], related: ["food", "protein", "fresh"] },
  "fruit": { synonyms: ["fresh fruit", "produce", "citrus", "tropical"], related: ["food", "fresh", "healthy"] },
  "vegetable": { synonyms: ["veggie", "produce", "greens", "salad"], related: ["food", "fresh", "healthy"] },
  "spice": { synonyms: ["seasoning", "herb", "pepper", "cinnamon"], related: ["food", "flavor", "cooking"] },
  "beverage": { synonyms: ["drink", "juice", "soda", "water"], related: ["food", "liquid", "refreshment"] },
  
  // Packaging
  "box": { synonyms: ["carton", "case", "container", "package"], related: ["packaging", "shipping", "storage"] },
  "bag": { synonyms: ["sack", "pouch", "sachet", "wrapper"], related: ["packaging", "flexible", "retail"] },
  "bottle": { synonyms: ["jar", "container", "flask", "vial"], related: ["packaging", "liquid", "beverage"] },
  "label": { synonyms: ["sticker", "tag", "mark", "brand"], related: ["packaging", "printing", "identification"] },
  "tape": { synonyms: ["adhesive", "seal", "packing tape", "duct tape"], related: ["packaging", "sealing", "shipping"] },
  "pallet": { synonyms: ["skid", "platform", "rack", "tote"], related: ["packaging", "logistics", "shipping"] },
  "wrapper": { synonyms: ["film", "foil", "cover", "sleeve"], related: ["packaging", "protection", "food"] },
  
  // IT
  "software": { synonyms: ["program", "application", "app", "system"], related: ["it", "computer", "digital"] },
  "hardware": { synonyms: ["equipment", "device", "components", "parts"], related: ["it", "computer", "physical"] },
  "server": { synonyms: ["host", "mainframe", "datacenter", "cloud"], related: ["it", "infrastructure", "network"] },
  "database": { synonyms: ["db", "storage", "data", "repository"], related: ["it", "software", "information"] },
  "security": { synonyms: ["cybersecurity", "protection", "firewall", "antivirus"], related: ["it", "safety", "network"] },
  "cloud": { synonyms: ["saas", "hosting", "aws", "azure", "online"], related: ["it", "storage", "computing"] },
  "network": { synonyms: ["wifi", "internet", "lan", "connection"], related: ["it", "communication", "infrastructure"] },
  
  // Automotive
  "engine": { synonyms: ["motor", "powertrain", "combustion", "diesel"], related: ["auto", "car", "mechanic"] },
  "tire": { synonyms: ["tyre", "wheel", "rubber", "pneumatic"], related: ["auto", "car", "safety"] },
  "brake": { synonyms: ["braking system", "disc", "pads", "calipers"], related: ["auto", "safety", "stopping"] },
  "battery": { synonyms: ["car battery", "accumulator", "12v", "lead acid"], related: ["auto", "electrical", "power"] },
  "oil": { synonyms: ["motor oil", "lubricant", "engine oil", "synthetic"], related: ["auto", "maintenance", "fluid"] },
  "parts": { synonyms: ["spare parts", "components", "accessories", "replacement"], related: ["auto", "repair", "service"] },
  "filter": { synonyms: ["air filter", "oil filter", "fuel filter", "cabin filter"], related: ["auto", "maintenance", "cleaning"] },
  
  // Construction
  "cement": { synonyms: ["concrete", "binder", "portland", "opc"], related: ["btp", "building", "construction"] },
  "steel": { synonyms: ["rebar", "iron", "metal", "reinforcement"], related: ["btp", "structure", "building"] },
  "brick": { synonyms: ["block", "masonry", "clay", "wall"], related: ["btp", "building", "masonry"] },
  "wood": { synonyms: ["timber", "lumber", "plywood", "mdf"], related: ["btp", "building", "framing"] },
  "roof": { synonyms: ["roofing", "tile", "sheet", "shingle"], related: ["btp", "building", "covering"] },
  "pipe": { synonyms: ["tube", "pvc", "conduit", "plumbing"], related: ["btp", "building", "infrastructure"] },
  "paint": { synonyms: ["coating", "primer", "emulsion", "finish"], related: ["btp", "building", "decoration"] },
  "glass": { synonyms: ["window", "glazing", "pane", "mirror"], related: ["btp", "building", "transparent"] },
  "tile": { synonyms: ["ceramic", "porcelain", "flooring", "wall"], related: ["btp", "building", "finish"] },
  
  // Metal
  "aluminum": { synonyms: ["aluminium", "al", "light metal", "bauxite"], related: ["metal", "lightweight", "industry"] },
  "copper": { synonyms: ["cu", "bronze", "brass", "wire"], related: ["metal", "electrical", "conductive"] },
  "iron": { synonyms: ["fe", "cast iron", "wrought", "ferrous"], related: ["metal", "steel", "heavy"] },
  "gold": { synonyms: ["precious metal", "au", "bullion", "karat"], related: ["metal", "jewelry", "investment"] },
  "silver": { synonyms: ["ag", "precious", "sterling", "bullion"], related: ["metal", "jewelry", "industrial"] },
  "zinc": { synonyms: ["zn", "galvanized", "coating", "die cast"], related: ["metal", "coating", "protection"] },
  "scrap": { synonyms: ["waste", "recycling", "secondary", "raw"], related: ["metal", "recycling", "sustainable"] },
  
  // Hospitality
  "furniture": { synonyms: ["furnishings", "fixture", "cabinet", "bed"], related: ["hospitality", "hotel", "interior"] },
  "linen": { synonyms: ["bedding", "sheets", "towels", "fabric"], related: ["hospitality", "hotel", "textile"] },
  "amenities": { synonyms: ["toiletries", "supplies", "guest", "comfort"], related: ["hospitality", "hotel", "service"] },
  "equipment": { synonyms: ["appliance", "machine", "device", "tool"], related: ["hospitality", "hotel", "kitchen"] },
  "kitchen": { synonyms: ["culinary", "cooking", "food prep", "catering"], related: ["hospitality", "restaurant", "food"] },
  "cleaning": { synonyms: ["housekeeping", "sanitation", "maintenance", "hygiene"], related: ["hospitality", "hotel", "service"] },
  "spa": { synonyms: ["wellness", "massage", "relaxation", "therapy"], related: ["hospitality", "luxury", "health"] },
};

/**
 * Expand a search query using the dictionary
 * Returns expanded terms with synonyms
 */
function expandQueryWithDictionary(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const expanded = new Set<string>(words);
  
  for (const word of words) {
    // Direct match
    const entry = dictionaryTerms[word];
    if (entry) {
      expanded.add(word);
      entry.synonyms.forEach(s => expanded.add(s.toLowerCase()));
      entry.related.forEach(r => expanded.add(r.toLowerCase()));
    }
    
    // Partial match in keys
    for (const [key, value] of Object.entries(dictionaryTerms)) {
      if (key.includes(word) || word.includes(key)) {
        expanded.add(key);
        value.synonyms.forEach(s => expanded.add(s.toLowerCase()));
      }
      // Check synonyms
      for (const syn of value.synonyms) {
        if (syn.includes(word) || word.includes(syn)) {
          expanded.add(key);
          expanded.add(syn.toLowerCase());
        }
      }
    }
  }
  
  return Array.from(expanded);
}

/**
 * Calculate semantic relevance score using dictionary
 */
function calculateSemanticScore(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  let score = 0;
  
  // Direct match
  if (textLower.includes(queryLower)) {
    score += 10;
  }
  
  // Expanded terms match
  const expandedTerms = expandQueryWithDictionary(query);
  for (const term of expandedTerms) {
    if (textLower.includes(term)) {
      score += 5;
    }
  }
  
  return score;
}

/**
 * Action: Expand search query with dictionary synonyms
 */
export const expandSearchQuery = action({
  args: {
    query: v.string(),
  },
  handler: async (_ctx, args) => {
    const expanded = expandQueryWithDictionary(args.query);
    
    return {
      original: args.query,
      expanded,
      count: expanded.length,
    };
  },
});

/**
 * Action: Get related terms for a product term
 */
export const getRelatedTerms = action({
  args: {
    term: v.string(),
  },
  handler: async (_ctx, args) => {
    const termLower = args.term.toLowerCase();
    const entry = dictionaryTerms[termLower];
    
    if (!entry) {
      // Try to find partial match
      for (const [key, value] of Object.entries(dictionaryTerms)) {
        if (key.includes(termLower) || termLower.includes(key)) {
          return {
            term: args.term,
            found: true,
            synonyms: value.synonyms,
            related: value.related,
            category: value.related[0] || "general",
          };
        }
      }
      
      return {
        term: args.term,
        found: false,
        synonyms: [],
        related: [],
        category: null,
      };
    }
    
    return {
      term: args.term,
      found: true,
      synonyms: entry.synonyms,
      related: entry.related,
      category: entry.related[0] || "general",
    };
  },
});

/**
 * Action: Enhanced search with dictionary expansion
 * This action takes a query, expands it using the dictionary,
 * and returns expanded search terms for better matching
 */
export const enhanceSearchQuery = action({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const expanded = expandQueryWithDictionary(args.query);
    
    // Group by relevance
    const exactMatches: string[] = [];
    const synonymMatches: string[] = [];
    const relatedMatches: string[] = [];
    
    const queryWords = args.query.toLowerCase().split(/\s+/);
    
    for (const term of expanded) {
      if (queryWords.some(qw => term === qw)) {
        exactMatches.push(term);
      } else if (queryWords.some(qw => dictionaryTerms[qw]?.synonyms.includes(term))) {
        synonymMatches.push(term);
      } else {
        relatedMatches.push(term);
      }
    }
    
    return {
      original: args.query,
      expanded,
      exactMatches,
      synonymMatches,
      relatedMatches,
      suggestedCategory: args.category || detectCategory(args.query),
    };
  },
});

/**
 * Detect category from query using dictionary
 */
function detectCategory(query: string): string | null {
  const queryLower = query.toLowerCase();
  const scores: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(dictionaryTerms)) {
    if (queryLower.includes(key)) {
      const category = value.related[0] || "general";
      scores[category] = (scores[category] || 0) + 1;
    }
    
    for (const syn of value.synonyms) {
      if (queryLower.includes(syn.toLowerCase())) {
        const category = value.related[0] || "general";
        scores[category] = (scores[category] || 0) + 1;
      }
    }
  }
  
  // Return category with highest score
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Action: Score text relevance using dictionary
 */
export const scoreTextRelevance = action({
  args: {
    query: v.string(),
    text: v.string(),
  },
  handler: async (_ctx, args) => {
    const score = calculateSemanticScore(args.query, args.text);
    const expanded = expandQueryWithDictionary(args.query);
    
    // Find which terms matched
    const textLower = args.text.toLowerCase();
    const matchedTerms = expanded.filter(term => textLower.includes(term.toLowerCase()));
    
    return {
      score,
      matchedTerms,
      expandedTerms: expanded,
    };
  },
});

// Export dictionary for use in other modules
export { dictionaryTerms, expandQueryWithDictionary, calculateSemanticScore };
