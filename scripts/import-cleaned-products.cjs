#!/usr/bin/env node
/**
 * Import cleaned products into Convex
 * Reads documents_cleaned.jsonl and imports via adminProductImport:bulkImportCLI
 */

const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');

const INPUT_FILE = '/home/tobi/naijafind/products_documents_shortened.jsonl';

// Batch size for import (max 100 per batch for bulk import)
const BATCH_SIZE = 100;

/**
 * Count products in file
 */
async function countProducts() {
  const countStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const countRl = readline.createInterface({ input: countStream });
  let count = 0;
  for await (const line of countRl) {
    if (line.trim()) count++;
  }
  return count;
}

/**
 * Preview products (dry run)
 */
async function dryRun(maxPreview = 10) {
  console.log('\n📋 MODE DRY RUN - Aperçu des produits à importer\n');
  
  const inputStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: inputStream });
  
  let count = 0;
  let categories = {};
  let sampleProducts = [];
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const product = JSON.parse(line);
      count++;
      
      // Count by category
      const cat = product.category || 'Unknown';
      categories[cat] = (categories[cat] || 0) + 1;
      
      // Collect samples
      if (sampleProducts.length < maxPreview) {
        sampleProducts.push({
          name: product.name,
          category: product.category,
          price: product.price,
          description: product.description?.substring(0, 80) + '...'
        });
      }
    } catch (err) {
      // Skip invalid lines
    }
  }
  
  console.log(`Total: ${count} produits\n`);
  
  console.log('📊 Répartition par catégorie:');
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  sortedCats.slice(0, 10).forEach(([cat, num]) => {
    console.log(`   • ${cat}: ${num}`);
  });
  if (sortedCats.length > 10) {
    console.log(`   • ... et ${sortedCats.length - 10} autres`);
  }
  
  console.log(`\n📝 Exemples (${sampleProducts.length} premiers):\n`);
  sampleProducts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name}`);
    console.log(`      Cat: ${p.category} | Prix: ${p.price} NGN`);
    console.log(`      Desc: ${p.description}`);
    console.log();
  });
  
  return count;
}

/**
 * Transform a product from JSONL format to Convex import format
 */
function transformProduct(product) {
  return {
    name: product.name,
    price: product.price,
    stock: Math.floor(Number(product.stock)) || 0,
    status: product.status || 'active',
    category: product.category,
    description: product.description,
    images: product.images || [],
    supplier_email: undefined, // Will be unassigned
    supplier_business_name: undefined,
  };
}

/**
 * Import a batch of products via Convex CLI using importFromCLI action
 * No browser auth required - for local dev and initial data import
 */
function importBatch(products, isProd = false) {
  const prodFlag = isProd ? ' --prod' : '';
  
  // Build JSON and escape for shell - use single quotes to preserve spaces
  const jsonStr = JSON.stringify({ products });
  // Escape single quotes in the JSON by replacing ' with '\''
  const escapedJson = jsonStr.replace(/'/g, "'\\''");
  
  try {
    const result = execSync(
      `npx convex run adminProductImport:importFromCLI '${escapedJson}'${prodFlag}`,
      {
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error('   ❌ Import failed:', error.stderr || error.message);
    throw error;
  }
}

/**
 * Main import function
 */
async function clearProducts(isProd) {
  console.log('\n🗑️  Suppression des produits existants...');
  
  const prodFlag = isProd ? ' --prod' : '';
  
  // Build JSON and escape for shell
  const jsonStr = JSON.stringify({ confirm: 'DELETE_ALL' });
  const escapedJson = jsonStr.replace(/'/g, "'\\''");
  
  try {
    const result = execSync(
      `npx convex run adminProductImport:clearAllProductsCLI '${escapedJson}'${prodFlag}`,
      {
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: 'pipe'
      }
    );
    
    const data = JSON.parse(result);
    if (data.success) {
      console.log(`   ✓ ${data.productsDeleted} produits supprimés`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('   ❌ Erreur lors de la suppression:', error.stderr || error.message);
    return false;
  }
}

async function countExistingProducts(isProd) {
  const prodFlag = isProd ? ' --prod' : '';
  
  try {
    const result = execSync(
      `npx convex run productMigration:getMigrationStatusCLI '${JSON.stringify({})}'${prodFlag}`,
      {
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: 'pipe'
      }
    );
    const data = JSON.parse(result);
    return data.totals?.totalProducts || 0;
  } catch (e) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isProd = args.includes('--prod');
  const skipConfirm = args.includes('--yes');
  const shouldClear = args.includes('--clear');
  const isDryRun = args.includes('--dry-run') || args.includes('--preview');
  const showStatus = args.includes('--status') || args.includes('--info');
  
  // Show current status and exit
  if (showStatus) {
    console.log('\n📊 État actuel de la base Convex\n');
    const fileCount = await countProducts();
    const dbCount = await countExistingProducts(isProd);
    
    console.log(`   Fichier à importer: ${fileCount} produits`);
    if (dbCount !== null) {
      console.log(`   Produits en base: ${dbCount}`);
      console.log(`   Différence: ${fileCount - dbCount}`);
    } else {
      console.log(`   ❌ Impossible de compter les produits en base`);
    }
    process.exit(0);
  }
  
  // Dry run mode - just preview file contents
  if (isDryRun) {
    await dryRun(10);
    console.log('\n✅ Dry run terminé. Aucune modification effectuée.');
    console.log('   Utilisez sans --dry-run pour importer réellement.');
    
    // Also show existing count
    const dbCount = await countExistingProducts(isProd);
    if (dbCount !== null) {
      console.log(`\n   Produits existants en base: ${dbCount}`);
    }
    process.exit(0);
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Import des produits nettoyés dans Convex                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Show existing products count
  const existingCount = await countExistingProducts(isProd);
  if (existingCount !== null && existingCount > 0) {
    console.log(`📊 Produits existants en base: ${existingCount}`);
    if (!shouldClear) {
      console.log(`   ⚠️  Les nouveaux produits s'ajouteront aux existants.`);
      console.log(`   Utilisez --clear pour remplacer les existants.\n`);
    } else {
      console.log();
    }
  }
  
  // Clear existing products if requested
  if (shouldClear) {
    if (!skipConfirm) {
      const readlineSync = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readlineSync.question(`⚠️  Supprimer tous les produits existants avant l'import ? (oui/non): `, resolve);
      });
      readlineSync.close();
      
      if (['oui', 'o', 'yes', 'y'].includes(answer.toLowerCase())) {
        const cleared = await clearProducts(isProd);
        if (!cleared) {
          console.log('\n❌ Échec de la suppression, arrêt de l\'import');
          process.exit(1);
        }
      }
    } else {
      const cleared = await clearProducts(isProd);
      if (!cleared) {
        console.log('\n❌ Échec de la suppression, arrêt de l\'import');
        process.exit(1);
      }
    }
  }
  
  // Count total products
  console.log('📊 Comptage des produits...');
  let totalProducts = 0;
  const countStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const countRl = readline.createInterface({ input: countStream });
  for await (const line of countRl) {
    if (line.trim()) totalProducts++;
  }
  
  console.log(`   Total: ${totalProducts} produits à importer`);
  console.log(`   Environ: ${Math.ceil(totalProducts / BATCH_SIZE)} batches`);
  
  if (!skipConfirm) {
    const readlineSync = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readlineSync.question(`\n▶️  Lancer l'import ${isProd ? 'en PRODUCTION' : 'en LOCAL'} ? (oui/non): `, resolve);
    });
    readlineSync.close();
    
    if (!['oui', 'o', 'yes', 'y'].includes(answer.toLowerCase())) {
      console.log('\n❌ Import annulé');
      process.exit(0);
    }
  }
  
  console.log('\n🚀 Démarrage de l\'import...\n');
  
  // Process file
  const inputStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: inputStream });
  
  let batch = [];
  let batchCount = 0;
  let totalImported = 0;
  let totalFailed = 0;
  let processed = 0;
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    try {
      const product = JSON.parse(line);
      batch.push(transformProduct(product));
      processed++;
      
      // Process batch when full
      if (batch.length >= BATCH_SIZE) {
        batchCount++;
        process.stdout.write(`\r📦 Batch ${batchCount}: ${processed}/${totalProducts}`);
        
        try {
          const result = importBatch(batch, isProd);
          if (result.success) {
            totalImported += result.imported || 0;
            totalFailed += result.failed || 0;
          } else {
            totalFailed += batch.length;
          }
        } catch (error) {
          console.error(`\n   ❌ Erreur batch ${batchCount}:`, error.message);
          totalFailed += batch.length;
        }
        
        batch = [];
      }
    } catch (err) {
      console.error(`\n❌ Erreur parsing ligne:`, err.message);
      totalFailed++;
    }
  }
  
  // Process remaining products
  if (batch.length > 0) {
    batchCount++;
    process.stdout.write(`\r📦 Batch ${batchCount}: ${processed}/${totalProducts}`);
    
    try {
      const result = importBatch(batch, isProd);
      if (result.success) {
        totalImported += result.imported || 0;
        totalFailed += result.failed || 0;
      } else {
        totalFailed += batch.length;
      }
    } catch (error) {
      console.error(`\n   ❌ Erreur batch ${batchCount}:`, error.message);
      totalFailed += batch.length;
    }
  }
  
  console.log('\n\n✅ Import terminé !');
  console.log(`   • Produits importés: ${totalImported}`);
  console.log(`   • Échecs: ${totalFailed}`);
  console.log(`   • Batches: ${batchCount}`);
  
  if (totalFailed > 0) {
    console.log('\n⚠️  Certains produits n\'ont pas pu être importés.');
    console.log('   Vérifiez les logs ci-dessus pour les erreurs.');
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Erreur fatale:', err.message);
  process.exit(1);
});
