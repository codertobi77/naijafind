#!/usr/bin/env node

/**
 * Script CLI pour vérifier le statut de la migration
 * Usage: npm run migrate:status
 * 
 * Affiche les statistiques de migration
 */

import { execSync } from 'child_process';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  Statut de la migration                                    ║');
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

  console.log('⏳ Récupération du statut...\n');

  // Exécuter la query
  const result = execSync(
    'npx convex run productMigration:getMigrationStatusCLI --prod',
    {
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd()
    }
  );

  // Parser le résultat
  const status = JSON.parse(result);

  if (status) {
    console.log('📊 Statistiques:\n');
    console.log('   Produits:');
    console.log(`      • Total: ${status.total?.products || 0}`);
    console.log(`      • Recherchables: ${status.total?.searchableProducts || 0}`);
    console.log(`      • Avec langue définie: ${status.total?.productsWithOriginalLang || 0}`);
    
    console.log('\n   Correspondances:');
    console.log(`      • Total candidats: ${status.total?.candidates || 0}`);
    console.log(`      • Approuvés: ${status.total?.approvedCandidates || 0}`);
    console.log(`      • Produits avec correspondances: ${status.total?.productsWithCandidates || 0}`);

    console.log('\n   Progression:');
    console.log(`      • Produits migrés: ${status.progress?.productsMigratedPercent || 0}%`);
    console.log(`      • Produits avec matches: ${status.progress?.productsWithMatchesPercent || 0}%`);

    console.log('\n   État:');
    if (status.readyForSearch) {
      console.log('      ✅ Système prêt pour la recherche !');
    } else {
      console.log('      ⏳ Migration en cours ou incomplète');
      console.log('         Lancer: npm run migrate:full');
    }

    console.log('\n');
  } else {
    console.log('❌ Impossible de récupérer le statut');
  }

} catch (error) {
  console.error('\n❌ Erreur:');
  console.error(error.stderr || error.message || error);
  
  console.error('\n💡 Solutions possibles:');
  console.error('   • Vérifiez que vous êtes connecté: npx convex login');
  console.error('   • Vérifiez que le schéma est déployé: npx convex dev');
  
  process.exit(1);
}
