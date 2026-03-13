#!/usr/bin/env node

/**
 * Script CLI pour migrer tous les produits (ajoute isSearchable, originalLanguage, keywords)
 * Usage: npm run migrate:products
 * 
 * Ce script utilise la CLI Convex pour exécuter l'action de migration
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
  console.log('║  Migration des produits - Système de sourcing              ║');
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
    const batchSize = parseInt(await question('📦 Taille des lots [100]: ') || '100', 10);

    console.log('\n⚙️  Configuration:');
    console.log(`   • Langue par défaut: ${defaultLang}`);
    console.log(`   • Taille des lots: ${batchSize}`);
    console.log('');

    const confirm = await question('▶️  Lancer la migration ? (oui/non): ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Migration annulée');
      process.exit(0);
    }

    console.log('\n⏳ Migration en cours... Cela peut prendre plusieurs minutes.\n');

    // Utiliser npx convex run pour exécuter l'action
    // Les arguments doivent être passés en JSON
    const args = JSON.stringify({
      defaultLanguage: defaultLang,
      batchSize: batchSize
    });

    execSync(
      `npx convex run productMigration:migrateAllProductsCLI '${args}' --prod`,
      {
        encoding: 'utf-8',
        stdio: 'inherit',
        cwd: process.cwd()
      }
    );

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
