#!/usr/bin/env node

/**
 * Script CLI pour calculer les correspondances fournisseurs pour tous les produits
 * Usage: npm run migrate:matches
 * 
 * Ce script utilise la CLI Convex pour exécuter l'action de matching
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

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Calcul des correspondances fournisseurs                   ║');
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
    const onlyWithoutMatches = await question('⚡ Uniquement les produits sans correspondances ? (oui/non) [oui]: ');
    const autoApprove = await question('✅ Approuver automatiquement les correspondances "high" ? (oui/non) [oui]: ');

    const onlyWithoutMatchesBool = onlyWithoutMatches.toLowerCase() === 'oui' || onlyWithoutMatches.toLowerCase() === 'o' || onlyWithoutMatches.toLowerCase() === 'yes' || onlyWithoutMatches.toLowerCase() === 'y';
    const autoApproveBool = autoApprove.toLowerCase() !== 'non' && autoApprove.toLowerCase() !== 'n' && autoApprove.toLowerCase() !== 'no';

    console.log('\n⚙️  Configuration:');
    console.log(`   • Taille des lots: ${batchSize}`);
    console.log(`   • Uniquement sans correspondances: ${onlyWithoutMatchesBool ? 'oui' : 'non'}`);
    console.log(`   • Auto-approbation: ${autoApproveBool ? 'oui' : 'non'}`);
    console.log('');

    const confirm = await question('▶️  Lancer le calcul ? (oui/non): ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Opération annulée');
      process.exit(0);
    }

    console.log('\n⏳ Calcul en cours... Cela peut prendre plusieurs minutes.\n');

    // Loop until all products are processed
    let totalProcessed = 0;
    let totalMatchesCreated = 0;
    let totalMatchesUpdated = 0;
    let totalErrors = 0;
    let batchCount = 0;
    let hasMore = true;

    while (hasMore) {
      batchCount++;
      
      // Construire les arguments en JSON
      const args = JSON.stringify({
        batchSize: batchSize,
        onlyWithoutMatches: onlyWithoutMatchesBool,
        autoApproveHighConfidence: autoApproveBool
      });

      // Appeler l'action
      const result = execSync(
        `npx convex run productMigration:computeMatchesForAllProductsCLI '${args}' --prod`,
        {
          encoding: 'utf-8',
          stdio: 'pipe',
          cwd: process.cwd()
        }
      );

      // Parse result
      let parsedResult;
      try {
        // Extract JSON from output
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log(`   Lot ${batchCount}: résultat brut`);
      }

      if (parsedResult) {
        totalProcessed += parsedResult.totalProcessed || 0;
        totalMatchesCreated += parsedResult.matchesCreated || 0;
        totalMatchesUpdated += parsedResult.matchesUpdated || 0;
        totalErrors += parsedResult.errors?.length || 0;

        console.log(`   Lot ${batchCount}: +${parsedResult.totalProcessed || 0} produits, +${parsedResult.matchesCreated || 0} matches créés`);

        if (parsedResult.remainingProducts === 'all done' || parsedResult.totalProcessed === 0) {
          hasMore = false;
        }
      } else {
        console.log(`   Lot ${batchCount}: terminé`);
        hasMore = false;
      }

      // Safety limit - max 1000 batches
      if (batchCount >= 1000) {
        console.log('\n⚠️  Limite de lots atteinte (1000), arrêt');
        break;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Calcul terminé !');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   • Lots traités: ${batchCount}`);
    console.log(`   • Produits traités: ${totalProcessed}`);
    console.log(`   • Matches créés: ${totalMatchesCreated}`);
    console.log(`   • Matches mis à jour: ${totalMatchesUpdated}`);
    console.log(`   • Erreurs: ${totalErrors}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Erreur lors du calcul:');
    console.error(error.stderr || error.message || error);
    
    console.error('\n💡 Solutions possibles:');
    console.error('   • Vérifiez que vous êtes connecté: npx convex login');
    console.error('   • Vérifiez que les produits sont migrés: npm run migrate:products');
    console.error('   • Vérifiez les logs Convex pour plus de détails');
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
