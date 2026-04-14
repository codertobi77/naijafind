#!/usr/bin/env node
/**
 * Clear all products from Convex - USE WITH CAUTION!
 * Also clears productSupplierCandidates
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function countProducts(isProd) {
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
  const justCount = args.includes('--count') || args.includes('--dry-run');
  
  // Just count products without deleting
  if (justCount) {
    console.log('\n📊 Comptage des produits existants...\n');
    const count = await countProducts(isProd);
    if (count !== null) {
      console.log(`   Produits en base: ${count}`);
      console.log(`   Environ: ${Math.ceil(count / 100)} batches d'import`);
    } else {
      console.log('   ❌ Impossible de compter (vérifiez que Convex est accessible)');
    }
    rl.close();
    process.exit(0);
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ⚠️  SUPPRESSION DE TOUS LES PRODUITS                      ║');
  console.log('║                                                            ║');
  console.log('║  Cette opération est IRRÉVERSIBLE!                         ║');
  console.log('║  Tous les produits et candidats fournisseurs seront        ║');
  console.log('║  définitivement supprimés.                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Show count first
  const existingCount = await countProducts(isProd);
  if (existingCount !== null && existingCount > 0) {
    console.log(`📊 Produits à supprimer: ${existingCount}\n`);
  }
  
  if (!skipConfirm) {
    const answer1 = await question(`▶️  Êtes-vous sûr de vouloir tout supprimer ${isProd ? 'en PRODUCTION' : 'en LOCAL'} ? (oui/non): `);
    if (!['oui', 'o', 'yes', 'y'].includes(answer1.toLowerCase())) {
      console.log('\n❌ Opération annulée');
      rl.close();
      process.exit(0);
    }
    
    const answer2 = await question(`▶️  Tapez "DELETE" pour confirmer: `);
    if (answer2 !== 'DELETE') {
      console.log('\n❌ Opération annulée');
      rl.close();
      process.exit(0);
    }
  }
  
  console.log('\n🗑️  Suppression en cours...\n');
  
  const prodFlag = isProd ? ' --prod' : '';
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
      console.log('✅ Suppression terminée !');
      console.log(`   • Produits supprimés: ${data.productsDeleted}`);
      console.log(`   • Candidats supprimés: ${data.candidatesDeleted}`);
      console.log(`   • Batches: ${data.batches}`);
    } else {
      console.log('\n❌ Erreur:', data.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erreur:', error.stderr || error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
