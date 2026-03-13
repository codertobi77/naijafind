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

    const onlyWithoutMatchesBool = onlyWithoutMatches.toLowerCase() !== 'non' && onlyWithoutMatches.toLowerCase() !== 'n' && onlyWithoutMatches.toLowerCase() !== 'no';
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

    // Construire les arguments en JSON
    const args = JSON.stringify({
      batchSize: batchSize,
      onlyWithoutMatches: onlyWithoutMatchesBool,
      autoApproveHighConfidence: autoApproveBool
    });

    // Utiliser npx convex run pour exécuter l'action
    execSync(
      `npx convex run productMigration:computeMatchesForAllProductsCLI '${args}' --prod`,
      {
        encoding: 'utf-8',
        stdio: 'inherit',
        cwd: process.cwd()
      }
    );

    console.log('\n✅ Calcul terminé !');

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
