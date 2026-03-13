#!/usr/bin/env node

/**
 * Script CLI pour migration complète (produits + correspondances)
 * Usage: npm run migrate:full
 * 
 * Ce script exécute les deux phases de migration
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
  console.log('║  Migration complète - Produit + Correspondances            ║');
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
    const defaultLang = await question('🌍 Langue par défaut (en/fr) [en]: ') || 'en';
    const productBatchSize = parseInt(await question('📦 Taille des lots - produits [100]: ') || '100', 10);
    const matchBatchSize = parseInt(await question('📦 Taille des lots - correspondances [50]: ') || '50', 10);
    const autoApprove = await question('✅ Auto-approuver les correspondances "high" ? (oui/non) [oui]: ');

    const autoApproveBool = autoApprove.toLowerCase() !== 'non' && autoApprove.toLowerCase() !== 'n' && autoApprove.toLowerCase() !== 'no';

    console.log('\n⚙️  Configuration:');
    console.log(`   • Langue par défaut: ${defaultLang}`);
    console.log(`   • Lots produits: ${productBatchSize}`);
    console.log(`   • Lots correspondances: ${matchBatchSize}`);
    console.log(`   • Auto-approbation: ${autoApproveBool ? 'oui' : 'non'}`);
    console.log('');

    const confirm = await question('▶️  Lancer la migration complète ? (oui/non): ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Migration annulée');
      process.exit(0);
    }

    console.log('\n⏳ Migration en cours... Cela peut prendre plusieurs minutes.\n');

    // Tous les arguments pour la migration complète
    const args = JSON.stringify({
      defaultLanguage: defaultLang,
      productBatchSize: productBatchSize,
      matchBatchSize: matchBatchSize,
      autoApproveHighConfidence: autoApproveBool
    });

    execSync(
      `npx convex run productMigration:runFullMigrationCLI '${args}' --prod`,
      {
        encoding: 'utf-8',
        stdio: 'inherit',
        cwd: process.cwd()
      }
    );

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration complète terminée !');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📊 Vérifiez le statut avec: npm run migrate:status');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:');
    console.error(error.stderr || error.message || error);
    
    console.error('\n💡 Solutions possibles:');
    console.error('   • Vérifiez que vous êtes connecté: npx convex login');
    console.error('   • Vérifiez que le schéma est déployé: npx convex dev');
    console.error('   • Vérifiez les logs Convex pour plus de détails');
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
