#!/usr/bin/env node

/**
 * Script CLI pour continuer la migration des produits restants
 * Usage: npm run migrate:continue
 * 
 * Ce script exécute la migration en boucle jusqu'à ce que tous les produits soient migrés
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getMigrationStatus() {
  try {
    const result = execSync(
      `npx convex run productMigration:getMigrationStatusCLI --prod`,
      {
        encoding: 'utf-8',
        cwd: process.cwd()
      }
    );
    // Parse the JSON result from the output
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du statut:', error.message);
    return null;
  }
}

async function runMigrationBatch(defaultLang, batchSize, startCursor = null) {
  const args = {
    defaultLanguage: defaultLang,
    batchSize: batchSize
  };
  
  // Ne pas inclure startCursor s'il est null
  if (startCursor) {
    args.startCursor = startCursor;
  }

  try {
    const result = execSync(
      `npx convex run productMigration:migrateAllProductsCLI '${JSON.stringify(args)}' --prod`,
      {
        encoding: 'utf-8',
        cwd: process.cwd()
      }
    );
    
    // Parse the JSON result
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    return null;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Continuation de la migration des produits                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Vérifier que la CLI Convex est disponible
    try {
      execSync('npx convex --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ La CLI Convex n\'est pas disponible');
      console.error('   Assurez-vous d\'avoir installé les dépendances: npm install');
      process.exit(1);
    }

    // Afficher le statut actuel
    console.log('📊 Vérification du statut actuel...\n');
    const status = await getMigrationStatus();
    
    if (status && status.total) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📈 Statut de la migration:');
      console.log(`   • Total produits: ${status.total.products}`);
      console.log(`   • Produits migrés (searchable): ${status.total.searchableProducts}`);
      console.log(`   • Produits avec langue: ${status.total.productsWithOriginalLang}`);
      console.log(`   • Candidats fournisseurs: ${status.total.candidates}`);
      console.log(`   • Progression: ${status.progress.productsMigratedPercent}%`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const remaining = status.total.products - status.total.searchableProducts;
      
      if (remaining === 0) {
        console.log('✅ Tous les produits sont déjà migrés !');
        process.exit(0);
      }

      console.log(`⏳ Produits restants à migrer: ${remaining}\n`);

      // Configuration
      const defaultLang = await question('🌍 Langue par défaut (en/fr) [en]: ') || 'en';
      const batchSize = parseInt(await question('📦 Taille des lots [200]: ') || '200', 10);

      console.log('\n⚙️  Configuration:');
      console.log(`   • Langue par défaut: ${defaultLang}`);
      console.log(`   • Taille des lots: ${batchSize}`);
      console.log(`   • Produits restants: ${remaining}`);
      console.log('');

      const confirm = await question('▶️  Lancer la migration continue ? (oui/non): ');
      if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('\n❌ Migration annulée');
        process.exit(0);
      }

      console.log('\n⏳ Migration en cours... Cela peut prendre plusieurs minutes.\n');

      // Exécuter la migration en boucle jusqu'à ce que tous les produits soient migrés
      let totalMigrated = 0;
      let batchCount = 0;
      let consecutiveEmptyBatches = 0;
      const MAX_EMPTY_BATCHES = 3; // Plus strict car on utilise le curseur maintenant
      let currentCursor = null;

      while (consecutiveEmptyBatches < MAX_EMPTY_BATCHES) {
        batchCount++;
        console.log(`\n📦 Batch ${batchCount}${currentCursor ? ' (reprise)' : ''}...`);
        
        const result = await runMigrationBatch(defaultLang, batchSize, currentCursor);
        
        if (result) {
          const batchMigrated = result.migrated || 0;
          totalMigrated += batchMigrated;
          
          // Mettre à jour le curseur pour le prochain appel
          if (result.finalCursor) {
            currentCursor = result.finalCursor;
          }
          
          if (batchMigrated === 0) {
            consecutiveEmptyBatches++;
          } else {
            consecutiveEmptyBatches = 0;
          }
          
          console.log(`   ✓ Migrés dans ce batch: ${batchMigrated}`);
          console.log(`   ✓ Total migré: ${totalMigrated}/${remaining}`);
          console.log(`   ✓ Restants estimés: ${Math.max(0, remaining - totalMigrated)}`);
          console.log(`   ✓ Curseur: ${currentCursor ? currentCursor.substring(0, 20) + '...' : 'null'}`);
          
          if (result.errors && result.errors.length > 0) {
            console.log(`   ⚠️ Erreurs: ${result.errors.length}`);
          }

          // Si tous les produits sont migrés, on s'arrête
          if (totalMigrated >= remaining || result.completed === true) {
            if (totalMigrated >= remaining) {
              console.log('\n🎉 Tous les produits ont été migrés !');
            } else {
              console.log('\n✅ Migration terminée par completion');
            }
            break;
          }
        } else {
          console.log('   ⚠️ Aucun résultat, tentative de continuation...');
          consecutiveEmptyBatches++;
        }

        // Pause entre les batches
        if (consecutiveEmptyBatches < MAX_EMPTY_BATCHES) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Migration terminée !');
      console.log(`   • Total migré: ${totalMigrated} produits`);
      console.log(`   • Batches exécutés: ${batchCount}`);
      
      // Afficher le statut final
      const finalStatus = await getMigrationStatus();
      if (finalStatus) {
        console.log(`   • Progression finale: ${finalStatus.progress.productsMigratedPercent}%`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } else {
      console.error('❌ Impossible de récupérer le statut de migration');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message || error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
