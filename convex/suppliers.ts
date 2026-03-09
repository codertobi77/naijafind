import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ==========================================
// INTELLIGENT SEARCH UTILITIES
// Inspired by Google and Alibaba search systems
// ==========================================

// Common stop words to filter out (English & French)
const STOP_WORDS = new Set([
  // English
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
  'or', 'but', 'not', 'this', 'have', 'had', 'what', 'when', 'where', 'who',
  'which', 'their', 'said', 'each', 'which', 'she', 'do', 'how', 'if', 'up',
  'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make',
  'like', 'into', 'has', 'him', 'time', 'two', 'more', 'go', 'no', 'way',
  'could', 'my', 'than', 'first', 'water', 'been', 'call', 'now', 'find',
  'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part', 'over',
  'such', 'take', 'only', 'little', 'work', 'know', 'place', 'year', 'live',
  'back', 'give', 'most', 'very', 'after', 'thing', 'our', 'just', 'name',
  'good', 'sentence', 'man', 'think', 'say', 'great', 'where', 'help',
  'through', 'much', 'before', 'move', 'right', 'too', 'any', 'same',
  'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around',
  'farm', 'three', 'small', 'set', 'put', 'end', 'does', 'another', 'well',
  'large', 'must', 'big', 'even', 'land', 'here', 'did', 'why', 'went',
  'men', 'read', 'need', 'different', 'home', 'us', 'move', 'try', 'kind',
  'hand', 'picture', 'again', 'change', 'off', 'play', 'spell', 'air',
  'away', 'animal', 'house', 'point', 'page', 'letter', 'mother', 'answer',
  'found', 'study', 'still', 'learn', 'should', 'america', 'world', 'high',
  'every', 'near', 'add', 'food', 'between', 'own', 'below', 'country',
  'plant', 'last', 'school', 'father', 'keep', 'tree', 'never', 'start',
  'city', 'earth', 'eyes', 'light', 'thought', 'head', 'under', 'story',
  'saw', 'left', "don't", 'few', 'while', 'along', 'might', 'close',
  'something', 'seem', 'next', 'hard', 'open', 'example', 'begin', 'life',
  'always', 'those', 'both', 'paper', 'together', 'got', 'group', 'often',
  'run', 'important', 'until', 'children', 'side', 'feet', 'car', 'mile',
  'night', 'walk', 'white', 'sea', 'began', 'grow', 'took', 'river',
  'four', 'carry', 'state', 'once', 'book', 'hear', 'stop', 'without',
  'second', 'late', 'miss', 'idea', 'enough', 'eat', 'face', 'watch',
  'far', 'indian', 'real', 'almost', 'let', 'above', 'girl', 'sometimes',
  'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'being',
  'leave', 'family', "it's", 'body', 'music', 'color', 'stand', 'sun',
  'questions', 'fish', 'area', 'mark', 'dog', 'horse', 'birds', 'problem',
  'complete', 'room', 'knew', 'since', 'ever', 'piece', 'told', 'usually',
  'didn', 'friends', 'easy', 'heard', 'order', 'red', 'door', 'sure',
  'become', 'top', 'ship', 'across', 'today', 'during', 'short', 'better',
  'best', 'however', 'low', 'hours', 'black', 'products', 'happened',
  'whole', 'measure', 'remember', 'early', 'waves', 'reached', 'listen',
  'wind', 'rock', 'space', 'covered', 'fast', 'several', 'hold', 'himself',
  'toward', 'five', 'step', 'morning', 'passed', 'vowel', 'true', 'hundred',
  'against', 'pattern', 'numeral', 'table', 'north', 'slowly', 'money',
  'map', 'farm', 'pull', 'voice', 'seen', 'cold', 'cried', 'plan', 'notice',
  'south', 'sing', 'war', 'ground', 'fall', 'king', 'town', 'i’ll', 'unit',
  'figure', 'certain', 'field', 'travel', 'wood', 'fire', 'upon', 'done',
  'english', 'road', 'half', 'ten', 'fly', 'gave', 'box', 'finally', 'wait',
  'correct', 'oh', 'quickly', 'person', 'became', 'shown', 'minutes',
  'strong', 'verb', 'stars', 'front', 'feel', 'fact', 'inches', 'street',
  'decided', 'contain', 'course', 'surface', 'produce', 'building', 'ocean',
  'class', 'note', 'nothing', 'rest', 'carefully', 'scientists', 'inside',
  'wheels', 'stay', 'green', 'known', 'island', 'week', 'less', 'machine',
  'base', 'ago', 'stood', 'plane', 'system', 'behind', 'ran', 'round',
  'boat', 'game', 'force', 'understand', 'warm', 'common', 'bring',
  'explain', 'dry', 'though', 'language', 'shape', 'deep', 'thousands',
  'yes', 'clear', 'equation', 'yet', 'government', ' filled', 'heat',
  'full', 'hot', 'check', 'object', 'am', 'rule', 'among', 'noun', 'power',
  'cannot', 'able', 'six', 'size', 'dark', 'ball', 'material', 'special',
  'heavy', 'fine', 'pair', 'circle', 'include', 'built', 'can't', 'matter',
  'square', 'syllables', 'perhaps', 'bill', 'felt', 'suddenly', 'test',
  'direction', 'center', 'farmers', 'ready', 'anything', 'divided', 'general',
  'energy', 'subject', 'europe', 'moon', 'region', 'return', 'believe',
  'dance', 'members', 'picked', 'simple', 'cells', 'paint', 'mind', 'cause',
  'love', 'cause', 'rain', 'exercise', 'eggs', 'train', 'blue', 'wish',
  'drop', 'developed', 'window', 'difference', 'distance', 'heart', 'sit',
  'sum', 'summer', 'wall', 'forest', 'probably', 'legs', 'sat', 'main',
  'wide', 'written', 'length', 'returned', 'nature', 'arms', 'brother',
  'race', 'present', 'beautiful', 'store', 'job', 'edge', 'past', 'sign',
  'record', 'finished', 'discovered', 'wild', 'happy', 'beside', 'gone',
  'sky', 'grass', 'million', 'west', 'lay', 'weather', 'root', 'instruments',
  'meet', 'third', 'months', 'paragraph', 'raised', 'represent', 'soft',
  'whether', 'clothes', 'flowers', 'should', 'teacher', 'held', 'describe',
  'drive', 'cross', 'speak', 'solve', 'appear', 'metal', 'son', 'either',
  'ice', 'sleep', 'village', 'factors', 'result', 'jumped', 'snow', 'ride',
  'care', 'floor', 'hill', 'pushed', 'baby', 'buy', 'century', 'outside',
  'everything', 'tall', 'already', 'instead', 'phrase', 'soil', 'bed',
  ' reached', 'members', 'add', 'belong', 'safe', 'interest', 'gold',
  'continue', 'west', 'keep', 'real', 'pounds', 'latin', 'mass', 'solid',
  'sounds', 'bottom', 'wind', 'were', 'negative', 'positive', 'specific',
  'information', 'map', 'upon', 'space', 'heard', 'main', 'matter', 'center',
  'reached', 'table', 'value', 'town', 'located', 'certain', 'paper', 'east',
  'whose', 'shown', 'built', 'middle', 'stay', 'close', 'late', 'itself',
  'found', 'hard', 'display', 'surface', 'strong', 'sense', 'service',
  'given', 'lines', 'product', 'website', 'pressure', 'support', 'certain',
  'higher', 'simple', 'future', 'various', 'require', 'along', 'results',
  'action', 'physical', 'report', 'matter', 'inside', 'method', 'scale',
  'rate', 'base', 'therefore', 'post', 'east', 'according', 'range', 'events',
  'light', 'thing', 'told', 'major', 'close', 'terms', 'receive', 'simple',
  'process', 'share', 'makes', 'building', 'range', 'built', 'certain',
  'price', 'according', 'told', 'plus', 'post', 'sold', 'shown', 'standard',
  'industry', 'basis', 'outside', 'makes', 'based', 'taking', 'means',
  'cannot', 'provide', 'within', 'coming', 'using', 'effect', 'working',
  'further', 'help', 'business', 'issue', 'large', 'small', 'medium',
  'extra', 'size', 'sizes', 'new', 'old', 'brand', 'genuine', 'authentic',
  'original', 'quality', 'high', 'low', 'best', 'better', 'good', 'nice',
  // French
  'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'donc', 'or',
  'ni', 'car', 'de', 'du', 'des', 'à', 'au', 'aux', 'en', 'par', 'pour',
  'avec', 'sans', 'sur', 'sous', 'dans', 'chez', 'vers', 'entre', 'parmi',
  'contre', 'devant', 'derrière', 'après', 'avant', 'pendant', 'durant',
  'depuis', 'jusque', 'jusqu', 'voici', 'voilà', 'ce', 'cet', 'cette', 'ces',
  'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'ma', 'ta', 'sa', 'mes',
  'tes', 'ses', 'nos', 'vos', 'leurs', 'qui', 'que', 'quoi', 'dont', 'où',
  'quand', 'comment', 'pourquoi', 'combien', 'quel', 'quelle', 'quels',
  'quelles', 'comme', 'tel', 'telle', 'tels', 'telles', 'tout', 'toute',
  'tous', 'toutes', 'autre', 'autres', 'même', 'mêmes', 'plusieurs', 'aucun',
  'aucune', 'nul', 'nulle', 'personne', 'rien', 'chacun', 'chacune', 'certains',
  'certaine', 'certains', 'certaines', 'tellement', 'trop', 'plus', 'moins',
  'assez', 'très', 'peu', 'beaucoup', 'tant', 'tel', 'telle', 'tels', 'telles',
  'alors', 'ainsi', 'aussi', 'donc', 'pourtant', 'cependant', 'néanmoins',
  'toutefois', 'quoique', 'bien', 'mal', 'oui', 'non', 'si', 'sûrement',
  'peut-être', 'probablement', 'vraiment', 'certainement', 'absolument',
  'totalement', 'complètement', 'entièrement', 'particulièrement', 'surtout',
  'notamment', 'souvent', 'toujours', 'jamais', 'parfois', 'rarement',
  'maintenant', 'aujourd', 'hui', 'hier', 'demain', 'déjà', 'encore',
  'bientôt', 'tôt', 'tard', 'autrefois', 'jadis', 'voici', 'voilà', 'ci',
  'là', 'y', 'en', 'lui', 'elle', 'eux', 'elles', 'soi', 'moi', 'toi', 'se',
  'me', 'te', 'se', 'nous', 'vous', 'se', 'je', 'tu', 'il', 'elle', 'on',
  'nous', 'vous', 'ils', 'elles', 'ne', 'pas', 'plus', 'point', 'jamais',
  'guère', 'aucunement', 'nullement', 'être', 'avoir', 'faire', 'aller',
  'venir', 'pouvoir', 'savoir', 'falloir', 'voir', 'vouloir', 'falloir',
  'sembler', 'paraître', 'devenir', 'rester', 'demeurer', 'paraître',
  'suffire', 'falloir', 'pleuvoir', 'neiger', 'falloir'
]);

// Product type keywords for category inference
const PRODUCT_TYPE_PATTERNS: Record<string, string[]> = {
  'electronics': ['fan', 'phone', 'laptop', 'computer', 'tv', 'television', 'radio', 'speaker', 'camera', 'charger', 'battery', 'solar', 'panel', 'usb', 'electronic', 'gadget', 'device', 'appliance', 'tech'],
  'home': ['furniture', 'chair', 'table', 'bed', 'sofa', 'cabinet', 'shelf', 'dresser', 'mattress', 'pillow', 'blanket', 'curtain', 'carpet', 'rug', 'lamp', 'light', 'mirror', 'clock', 'decor'],
  'kitchen': ['cooker', 'pot', 'pan', 'plate', 'bowl', 'cup', 'glass', 'utensil', 'knife', 'spoon', 'fork', 'blender', 'mixer', 'grinder', 'fridge', 'refrigerator', 'microwave', 'oven', 'stove', 'burner', 'gas', 'kitchen', 'cooking'],
  'clothing': ['shirt', 'dress', 'pants', 'trousers', 'skirt', 'jacket', 'coat', 'shoe', 'boot', 'sandal', 'slipper', 'hat', 'cap', 'bag', 'purse', 'wallet', 'belt', 'scarf', 'tie', 'sock', 'underwear', 'cloth', 'fabric', 'textile', 'garment', 'wear', 'fashion', 'apparel'],
  'food': ['rice', 'bean', 'yam', 'cassava', 'plantain', 'banana', 'mango', 'orange', 'apple', 'tomato', 'pepper', 'onion', 'garlic', 'ginger', 'oil', 'palm', 'vegetable', 'fruit', 'meat', 'fish', 'chicken', 'beef', 'snack', 'drink', 'beverage', 'water', 'juice', 'food', 'grocery', 'grain', 'flour', 'spice', 'seasoning'],
  'beauty': ['cream', 'lotion', 'soap', 'shampoo', 'conditioner', 'perfume', 'makeup', 'cosmetic', 'hair', 'skin', 'beauty', 'care', 'oil', 'gel', 'powder', 'deodorant'],
  'health': ['medicine', 'drug', 'pill', 'tablet', 'syrup', 'vitamin', 'supplement', 'medical', 'health', 'clinic', 'pharmacy', 'hospital', 'doctor', 'nurse', 'treatment'],
  'construction': ['cement', 'sand', 'gravel', 'stone', 'brick', 'block', 'tile', 'roof', 'iron', 'steel', 'metal', 'wood', 'timber', 'plank', 'nail', 'screw', 'wire', 'pipe', 'paint', 'construction', 'building', 'material'],
  'automotive': ['car', 'vehicle', 'tire', 'tyre', 'wheel', 'rim', 'battery', 'oil', 'lubricant', 'part', 'spare', 'engine', 'motor', 'automotive', 'garage', 'mechanic'],
  'sports': ['ball', 'bat', 'racket', 'net', 'goal', 'jersey', 'sport', 'exercise', 'fitness', 'gym', 'equipment'],
  'office': ['paper', 'pen', 'pencil', 'eraser', 'ruler', 'notebook', 'book', 'file', 'folder', 'stapler', 'tape', 'glue', 'marker', 'highlighter', 'desk', 'chair', 'office', 'stationery'],
  'agriculture': ['seed', 'fertilizer', 'pesticide', 'herbicide', 'insecticide', 'tool', 'hoe', 'shovel', 'rake', 'machete', 'cutlass', 'sprayer', 'farm', 'agriculture', 'crop', 'livestock'],
};

/**
 * Extract meaningful keywords from a search query
 * Handles long product names like "Fan 16 Inch Solar powered Rechargeable..."
 */
function extractKeywords(query: string): string[] {
  if (!query) return [];
  
  // Normalize: lowercase, remove extra spaces
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Split by common delimiters
  const tokens = normalized.split(/[\s,;:\-|\/\(\)\[\]\{\}_\*\.]+/);
  
  // Filter out stop words, empty strings, and single characters
  const keywords = tokens.filter(token => 
    token.length > 1 && 
    !STOP_WORDS.has(token) &&
    !/^\d+$/.test(token) // Remove pure numbers
  );
  
  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Extract n-grams (word combinations) for better matching
 * e.g., "solar fan" from "Solar powered Rechargeable Fan"
 */
function extractNGrams(keywords: string[], n: number = 2): string[] {
  if (keywords.length < n) return [];
  
  const ngrams: string[] = [];
  for (let i = 0; i <= keywords.length - n; i++) {
    ngrams.push(keywords.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Infer category from search keywords based on product patterns
 */
function inferCategoryFromKeywords(keywords: string[]): string | null {
  const keywordSet = new Set(keywords);
  
  for (const [category, patterns] of Object.entries(PRODUCT_TYPE_PATTERNS)) {
    const matchCount = patterns.filter(p => keywordSet.has(p)).length;
    if (matchCount > 0) {
      return category;
    }
  }
  return null;
}

/**
 * Calculate relevance score for a supplier based on search keywords
 * Returns score and match details
 */
function calculateRelevanceScore(
  supplier: any,
  keywords: string[],
  targetCategories: Set<string>,
  matchingProducts: any[]
): { score: number; matchDetails: string[] } {
  let score = 0;
  const matchDetails: string[] = [];
  const supplierCategory = (supplier.category || '').toLowerCase();
  const supplierName = (supplier.business_name || '').toLowerCase();
  const supplierDesc = (supplier.description || '').toLowerCase();
  
  // 1. CATEGORY MATCH (Highest priority - 50 points)
  if (targetCategories.size > 0) {
    const categoryMatch = Array.from(targetCategories).some(targetCat => 
      supplierCategory === targetCat || 
      supplierCategory.includes(targetCat) ||
      targetCat.includes(supplierCategory)
    );
    if (categoryMatch) {
      score += 50;
      matchDetails.push('category');
    }
  }
  
  // 2. PRODUCT NAME/DESCRIPTION KEYWORD MATCH (30 points each keyword)
  const bigrams = extractNGrams(keywords, 2);
  const trigrams = extractNGrams(keywords, 3);
  
  for (const product of matchingProducts) {
    const productName = (product.name || '').toLowerCase();
    const productDesc = (product.description || '').toLowerCase();
    
    // Bigram matching in product name (high value)
    for (const bigram of bigrams) {
      if (productName.includes(bigram)) {
        score += 30;
        matchDetails.push(`product_bigram:${bigram}`);
      }
    }
    
    // Single keyword matching
    for (const keyword of keywords) {
      if (keyword.length < 3) continue; // Skip short keywords
      
      if (productName.includes(keyword)) {
        score += 20;
        matchDetails.push(`product_keyword:${keyword}`);
      }
      if (productDesc.includes(keyword)) {
        score += 10;
        matchDetails.push(`product_desc:${keyword}`);
      }
    }
  }
  
  // 3. SUPPLIER NAME MATCH (20 points each keyword)
  for (const keyword of keywords) {
    if (keyword.length < 3) continue;
    
    if (supplierName.includes(keyword)) {
      score += 20;
      matchDetails.push(`supplier_name:${keyword}`);
    }
  }
  
  // 4. SUPPLIER DESCRIPTION MATCH (10 points each keyword)
  for (const keyword of keywords) {
    if (keyword.length < 3) continue;
    
    if (supplierDesc.includes(keyword)) {
      score += 10;
      matchDetails.push(`supplier_desc:${keyword}`);
    }
  }
  
  // 5. BOOST for exact phrase match in supplier name
  const searchPhrase = keywords.join(' ');
  if (supplierName.includes(searchPhrase)) {
    score += 40;
    matchDetails.push('exact_name_match');
  }
  
  return { score, matchDetails };
}

/**
 * Fuzzy matching: check if word is similar (for typos)
 * Simple implementation using Levenshtein distance concept
 */
function isSimilar(word1: string, word2: string, threshold: number = 2): boolean {
  if (Math.abs(word1.length - word2.length) > threshold) return false;
  
  let differences = 0;
  const maxLen = Math.max(word1.length, word2.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
      if (differences > threshold) return false;
    }
  }
  
  return differences <= threshold;
}

export const getAllSuppliers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .take(limit);
    
    return suppliers;
  }
});

// Query admin : lister toutes les galeries (imageGallery de chaque fournisseur)
export const listAllGalleriesAdmin = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .take(limit);
    // Map to only return needed fields
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      imageGallery: s.imageGallery || [],
    }));
  }
});

export const getSupplierDetails = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const supplier = await ctx.db.get(id as any).catch(async () => {
      // fallback: try find by field id stored elsewhere
      const byFilter = await ctx.db.query("suppliers").filter(q => q.eq(q.field("_id"), id as any)).first();
      return byFilter ?? null;
    });

    const s = supplier ?? await ctx.db.get(id as any);
    if (!s) {
      return { supplier: null, reviews: [] };
    }

    const reviews = await ctx.db.query("reviews").withIndex("supplierId", (q) => q.eq("supplierId", s._id as unknown as string)).collect();
    return { supplier: s, reviews };
  }
});

export const updateSupplierProfile = mutation({
  args: {
    business_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    country: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    website: v.optional(v.string()),
    image: v.optional(v.string()),
    imageGallery: v.optional(v.array(v.string())),
    business_hours: v.optional(v.record(v.string(), v.string())),
    social_links: v.optional(v.record(v.string(), v.string())),
    business_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const userId = identity.subject;
    // Application-level enforcement: Check for existing supplier profile for this user
    const supplier = await ctx.db.query("suppliers").withIndex("userId", (q) => q.eq("userId", userId)).first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    // Ensure we're not trying to change the userId (which should be immutable)
    if (supplier.userId !== userId) {
      throw new Error("Tentative de modification non autorisée du profil fournisseur");
    }

    // Default business hours if none provided
    const defaultBusinessHours = {
      monday: "08:00-18:00",
      tuesday: "08:00-18:00",
      wednesday: "08:00-18:00",
      thursday: "08:00-18:00",
      friday: "08:00-18:00",
      saturday: "09:00-17:00",
      sunday: "closed"
    };

    const businessHoursToSave = args.business_hours || supplier.business_hours || defaultBusinessHours;

    await ctx.db.patch(supplier._id, {
      business_name: args.business_name,
      email: args.email,
      phone: args.phone,
      description: args.description,
      category: args.category,
      address: args.address,
      city: args.city,
      state: args.state,
      country: args.country,
      latitude: args.latitude,
      longitude: args.longitude,
      location: `${args.city}, ${args.state}`,
      website: args.website,
      image: args.image,
      imageGallery: args.imageGallery,
      business_hours: businessHoursToSave,
      social_links: args.social_links,
      business_type: args.business_type,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  }
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(v: number) { return v * Math.PI / 180; }

/**
 * Internal query: Search suppliers with minimal fields for action processing
 * Returns only necessary fields to minimize bandwidth
 */
export const _searchSuppliersInternal = internalQuery({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5000;
    const offset = args.offset ?? 0;
    
    // Get approved suppliers with minimal fields
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .take(limit);
    
    // Return only necessary fields
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      description: s.description,
      category: s.category,
      city: s.city,
      state: s.state,
      location: s.location,
      rating: s.rating,
      reviews_count: s.reviews_count,
      verified: s.verified,
      featured: s.featured,
      approved: s.approved,
      image: s.image,
      logo_url: s.logo_url,
      latitude: s.latitude,
      longitude: s.longitude,
      phone: s.phone,
      email: s.email,
    }));
  },
});

/**
 * Internal query: Get products with minimal fields for search
 */
export const _getProductsForSearch = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;
    const products = await ctx.db.query("products").take(limit);
    
    return products.map(p => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      supplierId: p.supplierId,
      category: p.category,
    }));
  },
});

/**
 * Internal query: Get categories with minimal fields for search
 */
export const _getCategoriesForSearch = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500;
    const categories = await ctx.db.query("categories").take(limit);
    
    return categories.map(c => ({
      _id: c._id,
      name: c.name,
      description: c.description,
    }));
  },
});

/**
 * Search suppliers by PRODUCT - GOOGLE/ALIBABA STYLE INTELLIGENT SEARCH
 * 
 * Features:
 * 1. Keyword extraction from long product names (e.g., "Fan 16 Inch Solar powered..." → ["fan", "solar", "rechargeable"])
 * 2. N-gram matching for better semantic understanding (e.g., "solar fan", "standing fan")
 * 3. Category inference from keywords
 * 4. Relevance scoring with multiple factors:
 *    - Category match: 50 points (highest priority)
 *    - Product keyword match: 20-30 points
 *    - Supplier name match: 20 points
 *    - Supplier description match: 10 points
 * 5. Multi-level results:
 *    - Priority 1: Suppliers in matching category
 *    - Priority 2: Suppliers with affinity (name/description match) even if not in category
 * 
 * Examples:
 * - Search "Fan 16 Inch Solar" → finds category "Electronics" → returns Electronics suppliers first
 *   + suppliers with "fan" or "solar" in name/description even if different category
 * - Search "rice" → finds category "Food" → returns Food suppliers
 */
export const searchSuppliers = action({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    lat: v.optional(v.float64()),
    lng: v.optional(v.float64()),
    radiusKm: v.optional(v.float64()),
    minRating: v.optional(v.float64()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.int64()),
    offset: v.optional(v.int64()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || 'relevance';

    // Fetch all data needed for intelligent search
    const suppliers = await ctx.runQuery(internal.suppliers._searchSuppliersInternal, {
      limit: 5000,
      offset: 0,
    });

    const categories = await ctx.runQuery(internal.suppliers._getCategoriesForSearch, { limit: 500 });
    const products = await ctx.runQuery(internal.suppliers._getProductsForSearch, { limit: 1000 });

    let scoredSuppliers: Array<any & { _score: number; _matchDetails: string[] }> = [];

    // ==========================================
    // INTELLIGENT SEARCH ALGORITHM
    // ==========================================
    
    if (args.q && args.q.trim()) {
      const rawQuery = args.q.trim();
      
      // STEP 1: Extract meaningful keywords from the query
      // Handles long product names like "Fan 16 Inch Solar powered Rechargeable..."
      const keywords = extractKeywords(rawQuery);
      const bigrams = extractNGrams(keywords, 2);
      const trigrams = extractNGrams(keywords, 3);
      
      // STEP 2: Find matching products using keyword + n-gram matching
      const matchingProducts = products.filter(product => {
        const productName = (product.name || '').toLowerCase();
        const productDesc = (product.description || '').toLowerCase();
        
        // Check for bigram matches (higher confidence)
        for (const bigram of bigrams) {
          if (productName.includes(bigram) || productDesc.includes(bigram)) {
            return true;
          }
        }
        
        // Check for individual keyword matches
        for (const keyword of keywords) {
          if (keyword.length < 3) continue; // Skip short keywords
          if (productName.includes(keyword) || productDesc.includes(keyword)) {
            return true;
          }
        }
        
        return false;
      });
      
      // STEP 3: Determine target categories
      let targetCategories: Set<string> = new Set();
      
      // From matching products
      matchingProducts.forEach(product => {
        if (product.category) {
          targetCategories.add(product.category.toLowerCase());
        }
      });
      
      // From direct category name matching
      const queryLower = rawQuery.toLowerCase();
      categories.forEach(cat => {
        const catName = (cat.name || '').toLowerCase();
        const catDesc = (cat.description || '').toLowerCase();
        
        // Check if query contains category name or vice versa
        if (queryLower.includes(catName) || catName.includes(queryLower) ||
            (catDesc && (queryLower.includes(catDesc) || catDesc.includes(queryLower)))) {
          targetCategories.add(catName);
        }
        
        // Check individual keywords against category
        for (const keyword of keywords) {
          if (keyword.length >= 3 && (catName.includes(keyword) || (catDesc && catDesc.includes(keyword)))) {
            targetCategories.add(catName);
          }
        }
      });
      
      // Infer category from keywords (e.g., "fan" → electronics)
      const inferredCategory = inferCategoryFromKeywords(keywords);
      if (inferredCategory) {
        targetCategories.add(inferredCategory);
      }
      
      // STEP 4: Calculate relevance scores for ALL suppliers
      scoredSuppliers = suppliers.map(supplier => {
        const { score, matchDetails } = calculateRelevanceScore(
          supplier,
          keywords,
          targetCategories,
          matchingProducts
        );
        
        return {
          ...supplier,
          _score: score,
          _matchDetails: matchDetails,
        };
      });
      
      // Filter out suppliers with 0 relevance unless we have very few results
      const suppliersWithScore = scoredSuppliers.filter(s => s._score > 0);
      
      // If we have no matches, fall back to basic text search
      if (suppliersWithScore.length === 0) {
        const fallbackQuery = rawQuery.toLowerCase();
        scoredSuppliers = suppliers
          .filter(s => 
            (s.business_name?.toLowerCase().includes(fallbackQuery)) ||
            (s.description?.toLowerCase().includes(fallbackQuery)) ||
            (s.category?.toLowerCase().includes(fallbackQuery))
          )
          .map(s => ({ ...s, _score: 1, _matchDetails: ['fallback_match'] }));
      } else {
        scoredSuppliers = suppliersWithScore;
      }
      
    } else {
      // No search query - return all suppliers with default score
      scoredSuppliers = suppliers.map(s => ({ ...s, _score: 0, _matchDetails: [] }));
    }

    // ==========================================
    // APPLY FILTERS
    // ==========================================
    
    // Apply explicit category filter
    if (args.category) {
      scoredSuppliers = scoredSuppliers.filter(s => s.category === args.category);
    }

    // Apply location filter
    if (args.location) {
      const loc = args.location.toLowerCase();
      scoredSuppliers = scoredSuppliers.filter(s => 
        (s.location || '').toLowerCase().includes(loc) ||
        (s.city || '').toLowerCase().includes(loc) ||
        (s.state || '').toLowerCase().includes(loc)
      );
    }

    // Apply rating filter
    if (args.minRating && args.minRating > 0) {
      scoredSuppliers = scoredSuppliers.filter(s => (s.rating ?? 0) >= (args.minRating as number));
    }

    // Apply verified filter
    if (args.verified) {
      scoredSuppliers = scoredSuppliers.filter(s => s.approved === true);
    }

    // Apply distance filter
    if (args.lat !== undefined && args.lng !== undefined) {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const radius = args.radiusKm ?? 50;

      scoredSuppliers = scoredSuppliers
        .map(s => {
          if (s.latitude != null && s.longitude != null) {
            const d = haversineKm(lat, lng, s.latitude, s.longitude);
            return { ...s, distance: d };
          }
          return { ...s, distance: Number.POSITIVE_INFINITY };
        })
        .filter(s => s.distance <= radius);
    }

    // ==========================================
    // SORT RESULTS
    // ==========================================
    
    scoredSuppliers.sort((a, b) => {
      // First priority: Featured suppliers
      const featuredA = a.featured ? 1 : 0;
      const featuredB = b.featured ? 1 : 0;
      if (featuredB !== featuredA) {
        return featuredB - featuredA;
      }
      
      // Second priority: Relevance score (for intelligent search)
      if (sortBy === 'relevance') {
        const scoreDiff = (b._score ?? 0) - (a._score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        
        // Within same score, sort by rating then reviews
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      }
      
      // Other sort options
      if (sortBy === 'distance') {
        const distA = (a as any).distance ?? Number.POSITIVE_INFINITY;
        const distB = (b as any).distance ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      } else if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      } else if (sortBy === 'reviews') {
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      } else if (sortBy === 'alpha_asc') {
        return (a.business_name || '').localeCompare(b.business_name || '');
      } else if (sortBy === 'alpha_desc') {
        return (b.business_name || '').localeCompare(a.business_name || '');
      }
      
      // Default fallback
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
    });

    // ==========================================
    // PREPARE RESULTS
    // ==========================================
    
    const total = scoredSuppliers.length;
    const sliced = scoredSuppliers.slice(offset, offset + limit).map(s => {
      // Remove internal scoring fields from response
      const { _score, _matchDetails, ...supplierData } = s;
      return {
        ...supplierData,
        relevanceScore: _score, // Include score for UI display if needed
        matchDetails: _matchDetails, // Include match reasons
      };
    });
    
    return { suppliers: sliced, total };
  },
});

// Legacy query version - now with intelligent product search
export const searchSuppliersQuery = query({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    lat: v.optional(v.float64()),
    lng: v.optional(v.float64()),
    radiusKm: v.optional(v.float64()),
    minRating: v.optional(v.float64()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.int64()),
    offset: v.optional(v.int64()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Redirect to action via internal query
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || 'relevance';

    // Use internal query to fetch suppliers
    const suppliers = await ctx.runQuery(internal.suppliers._searchSuppliersInternal, {
      limit: 5000,
      offset: 0,
    });

    // Fetch categories for intelligent search
    const categories = await ctx.runQuery(internal.suppliers._getCategoriesForSearch, { limit: 500 });

    // Fetch products for intelligent category matching
    const products = await ctx.runQuery(internal.suppliers._getProductsForSearch, { limit: 1000 });

    let all = [...suppliers];

    // Determine target categories based on search query
    let targetCategories: Set<string> = new Set();
    let searchQueryUsed = false;

    if (args.q && args.q.trim()) {
      const q = args.q.toLowerCase().trim();
      searchQueryUsed = true;
      
      // STRATEGY 1: Find products matching the query → get their categories
      const productMatchingCategories = new Set<string>();
      products.forEach(product => {
        if (product.name?.toLowerCase().includes(q) || 
            product.description?.toLowerCase().includes(q)) {
          if (product.category) {
            productMatchingCategories.add(product.category.toLowerCase());
          }
        }
      });
      
      // STRATEGY 2: Find categories directly matching the query
      const directMatchingCategories = new Set<string>();
      categories.forEach(cat => {
        if (cat.name?.toLowerCase().includes(q) || 
            cat.description?.toLowerCase().includes(q)) {
          directMatchingCategories.add(cat.name.toLowerCase());
        }
      });
      
      // Combine all matching categories
      targetCategories = new Set([...productMatchingCategories, ...directMatchingCategories]);
      
      // If no category match found, fall back to traditional supplier name/description search
      if (targetCategories.size === 0) {
        all = all.filter(s =>
          (s.business_name?.toLowerCase().includes(q)) ||
          (s.description?.toLowerCase().includes(q))
        );
      } else {
        // Filter suppliers by matching categories
        all = all.filter(s => {
          const supplierCategory = s.category?.toLowerCase() || '';
          return Array.from(targetCategories).some(targetCat => 
            supplierCategory === targetCat || supplierCategory.includes(targetCat)
          );
        });
      }
    }

    // Apply explicit category filter if provided (and no search query used)
    if (args.category && !searchQueryUsed) {
      all = all.filter(s => s.category === args.category);
    }

    if (args.location) {
      const loc = args.location.toLowerCase();
      all = all.filter(s => (s.location || "").toLowerCase().includes(loc));
    }

    if (args.minRating && args.minRating > 0) {
      all = all.filter(s => (s.rating ?? 0) >= (args.minRating as number));
    }

    if (args.verified) {
      all = all.filter(s => s.approved === true);
    }

    if (args.lat !== undefined && args.lng !== undefined) {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const radius = args.radiusKm ?? 50;

      all = all
        .map(s => {
          if (s.latitude != null && s.longitude != null) {
            const d = haversineKm(lat, lng, s.latitude, s.longitude);
            return { ...s, distance: d } as typeof s & { distance: number };
          }
          return { ...s, distance: Number.POSITIVE_INFINITY } as typeof s & { distance: number };
        })
        .filter(s => s.distance <= radius);
    }

    // Apply sorting
    all = all.sort((a, b) => {
      const featuredA = a.featured ? 1 : 0;
      const featuredB = b.featured ? 1 : 0;
      
      if (featuredB !== featuredA) {
        return featuredB - featuredA;
      }
      
      if (sortBy === 'distance') {
        const distA = (a as any).distance ?? Number.POSITIVE_INFINITY;
        const distB = (b as any).distance ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      } else if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      } else if (sortBy === 'reviews') {
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      } else if (sortBy === 'alpha_asc') {
        return (a.business_name || '').localeCompare(b.business_name || '');
      } else if (sortBy === 'alpha_desc') {
        return (b.business_name || '').localeCompare(a.business_name || '');
      }
      
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
    });

    const total = all.length;
    const sliced = all.slice(offset, offset + limit);
    return { suppliers: sliced, total };
  },
});

// Mutation for claiming a supplier/business
export const claimSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    userEmail: v.string(),
    claimedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Find the user in our database
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    
    // Get the supplier
    const supplier = await ctx.db.get(args.supplierId);
    
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Check if supplier is already claimed
    if (supplier.userId && supplier.userId !== user._id) {
      throw new Error("Cette entreprise a déjà été réclamée");
    }
    
    // Verify email matches (basic validation)
    const supplierEmail = (supplier.email || "").toLowerCase();
    const claimerEmail = args.userEmail.toLowerCase();
    // Email validation can be extended here
    void supplierEmail;
    void claimerEmail;
    
    // Create a claim record
    const claimId = await ctx.db.insert("supplierClaims", {
      supplierId: args.supplierId,
      userId: user._id,
      userEmail: args.userEmail,
      supplierEmail: supplier.email || "",
      status: "pending", // pending, approved, rejected
      claimedAt: args.claimedAt,
      verifiedAt: undefined,
      verifiedBy: undefined,
      notes: "",
    });
    
    // Update supplier with pending claim status
    await ctx.db.patch(args.supplierId, {
      claimStatus: "pending",
      claimId: claimId,
    });
    
    return { 
      success: true, 
      claimId,
      message: "Demande de réclamation soumise avec succès" 
    };
  }
});

// Admin: Get filtered suppliers using indexes
export const getFilteredSuppliers = query({
  args: {
    approved: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const limit = Math.min(args.limit ?? 500, 500);
    let suppliers: any[] = [];

    // Use index-based filtering when possible
    if (args.approved !== undefined && args.featured !== undefined) {
      // When both approved and featured are specified, use approved index first
      // then filter by featured
      const byApproved = await ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
        .take(limit);
      suppliers = byApproved.filter(s => s.featured === args.featured);
    } else if (args.approved !== undefined) {
      // Use approved index
      suppliers = await ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
        .take(limit);
    } else if (args.featured !== undefined) {
      // Use featured index
      suppliers = await ctx.db
        .query("suppliers")
        .withIndex("featured", (q) => q.eq("featured", args.featured as boolean))
        .take(limit);
    } else {
      // No index filter, fetch all
      suppliers = await ctx.db
        .query("suppliers")
        .take(limit);
    }

    // Apply category filter in memory if specified
    if (args.category) {
      suppliers = suppliers.filter(s => s.category === args.category);
    }

    // Apply search filter in memory if specified
    if (args.searchQuery && args.searchQuery.trim()) {
      const q = args.searchQuery.toLowerCase().trim();
      suppliers = suppliers.filter(s => 
        s.business_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q)
      );
    }

    return suppliers;
  },
});

// Admin: Get all suppliers with pagination (no limit)
export const getAllSuppliersPaginated = query({
  args: {
    paginationOpts: v.object({
      cursor: v.union(v.null(), v.optional(v.string())),
      id: v.optional(v.number()),
      numItems: v.number(),
    }),
    approved: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const numItems = Math.min(args.paginationOpts.numItems, 500);
    const cursor = args.paginationOpts.cursor || undefined;

    // If filters are applied, use index queries (no pagination cursor support for filtered results)
    if (args.approved !== undefined || args.featured !== undefined || args.category || args.searchQuery) {
      let suppliers: any[] = [];
      const limit = 1000; // Higher limit for filtered results

      // Use index-based filtering when possible
      if (args.approved !== undefined && args.featured !== undefined) {
        const byApproved = await ctx.db
          .query("suppliers")
          .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
          .take(limit);
        suppliers = byApproved.filter(s => s.featured === args.featured);
      } else if (args.approved !== undefined) {
        suppliers = await ctx.db
          .query("suppliers")
          .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
          .take(limit);
      } else if (args.featured !== undefined) {
        suppliers = await ctx.db
          .query("suppliers")
          .withIndex("featured", (q) => q.eq("featured", args.featured as boolean))
          .take(limit);
      } else {
        suppliers = await ctx.db
          .query("suppliers")
          .take(limit);
      }

      // Apply category filter in memory if specified
      if (args.category) {
        const categoryLower = args.category.toLowerCase().trim();
        suppliers = suppliers.filter(s => 
          s.category?.toLowerCase().trim() === categoryLower
        );
      }

      // Apply search filter in memory if specified
      if (args.searchQuery && args.searchQuery.trim()) {
        const q = args.searchQuery.toLowerCase().trim();
        suppliers = suppliers.filter(s => 
          s.business_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q)
        );
      }

      // Return in paginated format
      return {
        page: suppliers,
        continueCursor: null, // No pagination for filtered results
        isDone: true,
      };
    }

    // No filters - use paginate for efficient fetching of all suppliers
    const result = await ctx.db
      .query("suppliers")
      .paginate({ cursor, numItems });

    return result;
  },
});

// Admin: Get all pending supplier claims
export const getPendingClaims = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get all pending claims
    const claims = await ctx.db
      .query("supplierClaims")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();
    
    // Get supplier details for each claim
    const claimsWithDetails = await Promise.all(
      claims.map(async (claim) => {
        const supplier = await ctx.db.get(claim.supplierId);
          
        const claimant = await ctx.db.get(claim.userId as Id<"users">);
          
        return {
          ...claim,
          supplier: supplier ? {
            _id: supplier._id,
            business_name: supplier.business_name,
            email: supplier.email,
            phone: supplier.phone,
            city: supplier.city,
            state: supplier.state,
          } : null,
          claimant: claimant ? {
            _id: claimant._id,
            email: claimant.email,
            firstName: claimant.firstName,
            lastName: claimant.lastName,
          } : null,
        };
      })
    );
    
    return claimsWithDetails;
  }
});

// Admin: Approve a supplier claim
export const approveClaim = mutation({
  args: {
    claimId: v.id("supplierClaims"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!admin || !admin.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get the claim
    const claim = await ctx.db.get(args.claimId);
      
    if (!claim) {
      throw new Error("Demande de réclamation non trouvée");
    }
    
    if (claim.status !== "pending") {
      throw new Error("Cette demande a déjà été traitée");
    }
    
    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "approved",
      verifiedAt: new Date().toISOString(),
      verifiedBy: admin._id,
      notes: args.notes || "",
    });
    
    // Update supplier: assign to the claiming user
    await ctx.db.patch(claim.supplierId, {
      userId: claim.userId,
      claimStatus: "approved",
      claimId: args.claimId,
      verified: true,
      approved: true,
      updated_at: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: "Demande de réclamation approuvée avec succès" 
    };
  }
});

// Admin: Reject a supplier claim
export const rejectClaim = mutation({
  args: {
    claimId: v.id("supplierClaims"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!admin || !admin.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get the claim
    const claim = await ctx.db.get(args.claimId);
      
    if (!claim) {
      throw new Error("Demande de réclamation non trouvée");
    }
    
    if (claim.status !== "pending") {
      throw new Error("Cette demande a déjà été traitée");
    }
    
    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "rejected",
      verifiedAt: new Date().toISOString(),
      verifiedBy: admin._id,
      notes: args.notes || "",
    });
    
    // Update supplier: reset claim status
    await ctx.db.patch(claim.supplierId, {
      claimStatus: undefined,
      claimId: undefined,
      updated_at: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: "Demande de réclamation refusée" 
    };
  }
});


