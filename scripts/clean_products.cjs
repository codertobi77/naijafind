#!/usr/bin/env node
/**
 * Clean and process products from documents.jsonl
 * - Minify product names without losing information
 * - Add descriptions
 * - Remove duplicates and non-usable products
 */

const fs = require('fs');
const readline = require('readline');

const INPUT_FILE = '/home/tobi/naijafind/documents.jsonl';
const OUTPUT_FILE = '/home/tobi/naijafind/documents_cleaned.jsonl';
const STATS_FILE = '/home/tobi/naijafind/cleaning_stats.json';

// Track stats
const stats = {
  total: 0,
  kept: 0,
  removed: {
    duplicate: 0,
    invalidName: 0,
    invalidPrice: 0,
    invalidCategory: 0,
    noImage: 0,
    nonUsable: 0
  },
  categories: {}
};

// Track seen products for deduplication
const seenNames = new Set();
const seenIds = new Set();

// Invalid price thresholds (detect likely errors)
const MAX_REASONABLE_PRICE = 100000000; // 100M NGN
const MIN_REASONABLE_PRICE = 50; // 50 NGN

// Non-usable patterns in names
const NON_USABLE_PATTERNS = [
  /^test$/i,
  /^sample$/i,
  /^demo$/i,
  /^(undefined|null|none)$/i,
  /^\s*$/  // empty or whitespace only
];

// Common words to remove for minification (marketing fluff)
const REDUNDANT_WORDS = [
  'high quality', 'premium', 'original', 'authentic', 'genuine',
  'brand new', 'new arrival', 'hot sale', 'best seller', 'top rated',
  'fancy', 'elegant', 'exquisite', 'luxury', 'deluxe',
  'for sale', 'buy now', 'order now', 'limited stock'
];

/**
 * Clean and minify product name
 * Remove redundant words while keeping key info (brand, model, specs, color, size)
 */
function minifyName(name) {
  if (!name || typeof name !== 'string') return null;
  
  let cleaned = name
    .replace(/\s+/g, ' ')  // normalize whitespace
    .trim();
  
  // Remove redundant marketing words (case insensitive)
  REDUNDANT_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove trailing punctuation
  cleaned = cleaned.replace(/[,:;-]+$/, '').trim();
  
  return cleaned;
}

/**
 * Generate description from product name and category
 */
function generateDescription(product) {
  const name = product.name || '';
  const category = product.category || '';
  const specs = [];
  
  // Extract common specs from name
  const sizeMatch = name.match(/(\d+\s*(?:cm|mm|m|inch|in|ft|\"|'|x\s*\d+))/i);
  if (sizeMatch) specs.push(`Dimensions: ${sizeMatch[1]}`);
  
  const capacityMatch = name.match(/(\d+\s*(?:ml|l|kg|g|oz|lb|cl))/i);
  if (capacityMatch) specs.push(`Capacity: ${capacityMatch[1]}`);
  
  const wattMatch = name.match(/(\d+\s*(?:w|watt|v|volt|ah))/i);
  if (wattMatch) specs.push(`Power: ${wattMatch[1]}`);
  
  const piecesMatch = name.match(/(\d+\s*(?:pcs|pieces?|packs?|sets?))/i);
  if (piecesMatch) specs.push(`Quantity: ${piecesMatch[1]}`);
  
  // Build description
  let desc = `${category ? category + ' - ' : ''}${name}`;
  if (specs.length > 0) {
    desc += ` | ${specs.join(', ')}`;
  }
  
  return desc;
}

/**
 * Check if product is usable/valid
 */
function isUsable(product) {
  // Must have name
  if (!product.name || typeof product.name !== 'string') {
    return { usable: false, reason: 'invalidName' };
  }
  
  const name = product.name.trim();
  
  // Name must be meaningful
  if (name.length < 3) {
    return { usable: false, reason: 'invalidName' };
  }
  
  // Check non-usable patterns
  for (const pattern of NON_USABLE_PATTERNS) {
    if (pattern.test(name)) {
      return { usable: false, reason: 'nonUsable' };
    }
  }
  
  // Must have valid price
  const price = parseFloat(product.price);
  if (isNaN(price) || price < MIN_REASONABLE_PRICE || price > MAX_REASONABLE_PRICE) {
    return { usable: false, reason: 'invalidPrice' };
  }
  
  // Must have category
  if (!product.category || typeof product.category !== 'string') {
    return { usable: false, reason: 'invalidCategory' };
  }
  
  // Must have at least one image
  if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
    return { usable: false, reason: 'noImage' };
  }
  
  return { usable: true, reason: null };
}

/**
 * Check for duplicates (by normalized name)
 */
function isDuplicate(product) {
  // Check by ID
  if (seenIds.has(product._id)) {
    return true;
  }
  
  // Check by normalized name
  const normalizedName = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')  // remove all non-alphanumeric
    .trim();
  
  if (seenNames.has(normalizedName)) {
    return true;
  }
  
  return false;
}

/**
 * Process a single product
 */
function processProduct(product) {
  stats.total++;
  
  // Check if usable
  const usability = isUsable(product);
  if (!usability.usable) {
    stats.removed[usability.reason]++;
    return null;
  }
  
  // Check for duplicates
  if (isDuplicate(product)) {
    stats.removed.duplicate++;
    return null;
  }
  
  // Mark as seen
  seenIds.add(product._id);
  const normalizedName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  seenNames.add(normalizedName);
  
  // Minify name
  const minifiedName = minifyName(product.name);
  if (!minifiedName || minifiedName.length < 3) {
    stats.removed.invalidName++;
    return null;
  }
  
  // Create cleaned product
  const cleaned = {
    ...product,
    name: minifiedName,
    description: generateDescription(product)
  };
  
  // Track category stats
  stats.categories[product.category] = (stats.categories[product.category] || 0) + 1;
  stats.kept++;
  
  return cleaned;
}

/**
 * Main processing function
 */
async function processFile() {
  const inputStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const outputStream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });
  
  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity
  });
  
  console.log('Processing products...');
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const product = JSON.parse(line);
      const cleaned = processProduct(product);
      
      if (cleaned) {
        outputStream.write(JSON.stringify(cleaned) + '\n');
      }
      
      // Progress indicator every 1000
      if (stats.total % 1000 === 0) {
        process.stdout.write(`\rProcessed: ${stats.total}, Kept: ${stats.kept}`);
      }
    } catch (err) {
      console.error(`\nError parsing line: ${err.message}`);
      stats.removed.invalidName++;
    }
  }
  
  outputStream.end();
  
  // Write stats
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  
  console.log('\n\n=== Cleaning Complete ===');
  console.log(`Total processed: ${stats.total}`);
  console.log(`Products kept: ${stats.kept}`);
  console.log(`Products removed:`);
  console.log(`  - Duplicates: ${stats.removed.duplicate}`);
  console.log(`  - Invalid names: ${stats.removed.invalidName}`);
  console.log(`  - Invalid prices: ${stats.removed.invalidPrice}`);
  console.log(`  - Invalid categories: ${stats.removed.invalidCategory}`);
  console.log(`  - No images: ${stats.removed.noImage}`);
  console.log(`  - Non-usable: ${stats.removed.nonUsable}`);
  console.log(`\nTop categories:`);
  const sortedCats = Object.entries(stats.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  sortedCats.forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count}`);
  });
  console.log(`\nOutput written to: ${OUTPUT_FILE}`);
  console.log(`Stats written to: ${STATS_FILE}`);
}

processFile().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
