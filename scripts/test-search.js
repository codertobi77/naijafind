#!/usr/bin/env node

/**
 * Script de test rapide pour vérifier la recherche
 */

import { execSync } from 'child_process';

try {
  console.log('\n🧪 Test de la fonction de recherche...\n');

  // Test 1: Compter TOUS les produits (sans filtre isSearchable)
  console.log('📊 Test 1: Nombre total de produits...');
  const totalResult = execSync(
    `npx convex run --prod productMigration:_countAllProducts`,
    { encoding: 'utf-8' }
  );
  console.log(`   Total: ${totalResult.trim()}`);

  // Test 2: Vérifier combien ont isSearchable=true
  console.log('\n📊 Test 2: Produits avec isSearchable=true...');
  const searchableResult = execSync(
    `npx convex run --prod productMigration:_countSearchableProducts`,
    { encoding: 'utf-8' }
  );
  console.log(`   isSearchable=true: ${searchableResult.trim()}`);

  // Test 3: Debug candidates
  console.log('\n📊 Test 3: Statistiques des candidats...');
  try {
    const debugResult = execSync(
      `npx convex run --prod productMigration:_debugCandidates`,
      { encoding: 'utf-8' }
    );
    console.log(debugResult);
  } catch (error) {
    console.log('   Fonction non disponible ou erreur');
  }

  console.log('\n✅ Tests terminés!\n');

} catch (error) {
  console.error('\n❌ Erreur:');
  console.error(error.stderr || error.message);
  process.exit(1);
}
