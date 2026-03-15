#!/usr/bin/env node

/**
 * Script CLI pour calculer les correspondances fournisseur pour TOUS les produits
 * Gère le timeout en exécutant des batches successifs jusqu'à complétion
 * Usage: npm run migrate:matches
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Calcul des correspondances - Produits par lots          ║');
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

    // Configuration
    const batchSize = parseInt(await question('📦 Taille des lots [50]: ') || '50', 10);
    const autoApprove = await question('✅ Approuver automatiquement les correspondances "high" ? (oui/non) [oui]: ');
    const maxBatches = parseInt(await question('🔄 Nombre maximum de batches [100]: ') || '100', 10);

    const autoApproveBool = autoApprove.toLowerCase() !== 'non' && autoApprove.toLowerCase() !== 'n' && autoApprove.toLowerCase() !== 'no';

    console.log('\n⚙️  Configuration:');
    console.log(`   • Taille des lots: ${batchSize}`);
    console.log(`   • Auto-approbation: ${autoApproveBool ? 'oui' : 'non'}`);
    console.log(`   • Maximum batches: ${maxBatches}`);
    console.log('');

    const confirm = await question('▶️  Lancer le calcul ? (oui/non): ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Opération annulée');
      process.exit(0);
    }

    console.log('\n⏳ Démarrage du traitement par batches...\n');

    let totalProcessed = 0;
    let totalMatchesCreated = 0;
    let totalMatchesUpdated = 0;
    let totalErrors = 0;
    let batchCount = 0;
    let hasMore = true;

    while (hasMore && batchCount < maxBatches) {
      batchCount++;
      
      console.log(`\n📦 Batch ${batchCount}/${maxBatches}...`);

      // Construire les arguments en JSON
      const args = JSON.stringify({
        batchSize: batchSize,
        onlyWithoutMatches: true, // Uniquement les produits sans correspondances
        autoApproveHighConfidence: autoApproveBool
      });

      try {
        // Appeler l'action
        const result = execSync(
          `npx convex run productMigration:computeMatchesForAllProductsCLI '${args}' --prod`,
          {
            encoding: 'utf-8',
            cwd: process.cwd()
          }
        );

        // Parse result
        const resultObj = JSON.parse(result);
        
        if (resultObj.success) {
          const processed = resultObj.totalProcessed || 0;
          const created = resultObj.matchesCreated || 0;
          const updated = resultObj.matchesUpdated || 0;
          const errors = resultObj.errors?.length || 0;
          const remaining = resultObj.remainingProducts;

          totalProcessed += processed;
          totalMatchesCreated += created;
          totalMatchesUpdated += updated;
          totalErrors += errors;

          console.log(`   ✅ Traités: ${processed} | Créés: ${created} | Mis à jour: ${updated} | Erreurs: ${errors}`);

          hasMore = remaining === 'more products remain';
          
          if (hasMore) {
            console.log(`   ⏳ Pause de 1 seconde avant le prochain batch...`);
            await sleep(1000);
          }
        } else {
          console.error(`   ❌ Erreur: ${resultObj.error || 'Erreur inconnue'}`);
          totalErrors++;
          hasMore = false;
        }
      } catch (error) {
        console.error(`   ❌ Erreur d'exécution: ${error.message || error}`);
        totalErrors++;
        
        // Check if it's a timeout error
        if (error.message && error.message.includes('timeout')) {
          console.error(`   ⚠️  Timeout détecté. Le batch a pris trop de temps.`);
          console.error(`   💡 Essayez avec une taille de lot plus petite (ex: 10)`);
          hasMore = false;
        } else {
          throw error; // Re-throw other errors
        }
      }
    }

    // Résumé final
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RÉSUMÉ FINAL                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`   Batches exécutés: ${batchCount}`);
    console.log(`   Produits traités: ${totalProcessed}`);
    console.log(`   Correspondances créées: ${totalMatchesCreated}`);
    console.log(`   Correspondances mises à jour: ${totalMatchesUpdated}`);
    console.log(`   Erreurs totales: ${totalErrors}`);
    
    if (hasMore) {
      console.log(`\n   ⚠️  Attention: Tous les produits n'ont pas été traités`);
      console.log(`      Relancez la commande pour continuer`);
    } else {
      console.log(`\n   ✅ Terminé! Tous les produits ont été traités`);
    }
    
    console.log('');

  } catch (error) {
    console.error('\n❌ Erreur générale:');
    console.error(error.stderr || error.message || error);
    
    console.error('\n💡 Solutions possibles:');
    console.error('   • Réduisez la taille des lots: utilisez 20 au lieu de 50');
    console.error('   • Vérifiez votre connexion internet');
    console.error('   • Vérifiez que vous êtes connecté: npx convex login');
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
