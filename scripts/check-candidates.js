#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier les candidats existants
 */

import { execSync } from 'child_process';

try {
  console.log('\n🔍 Vérification des candidats existants...\n');

  // Compter le nombre total de candidats
  const countResult = execSync(
    `npx convex run --prod 'return await db.query("productSupplierCandidates").take(10000).then(cs => cs.length)'`,
    { encoding: 'utf-8' }
  );
  
  const totalCount = parseInt(countResult.trim(), 10);
  console.log(`📊 Total de candidats: ${totalCount}`);

  // Vérifier combien de produits uniques ont des candidats
  const uniqueProductsResult = execSync(
    `npx convex run --prod 'return await db.query("productSupplierCandidates").take(10000).then(cs => new Set(cs.map(c => c.productId.toString())).size)'`,
    { encoding: 'utf-8' }
  );
  
  const uniqueProducts = parseInt(uniqueProductsResult.trim(), 10);
  console.log(`🎯 Produits avec candidats: ${uniqueProducts}`);

  // Voir un échantillon
  const sampleResult = execSync(
    `npx convex run --prod 'return await db.query("productSupplierCandidates").take(5).then(cs => JSON.stringify(cs.map(c => ({productId: c.productId, supplierId: c.supplierId, score: c.matchScore}))))'`,
    { encoding: 'utf-8' }
  );
  
  console.log('\n📋 Échantillon de candidats:');
  const sample = JSON.parse(sampleResult.trim());
  sample.forEach((c, i) => {
    console.log(`   ${i + 1}. Produit: ${c.productId}, Fournisseur: ${c.supplierId}, Score: ${c.score}`);
  });

  // Vérifier les 10 premiers produits isSearchable
  const searchableResult = execSync(
    `npx convex run --prod 'return await db.query("products").withIndex("isSearchable", q => q.eq("isSearchable", true)).take(10).then(ps => JSON.stringify(ps.map(p => ({id: p._id, name: p.name}))))'`,
    { encoding: 'utf-8' }
  );
  
  console.log('\n🔍 10 premiers produits isSearchable:');
  const searchable = JSON.parse(searchableResult.trim());
  searchable.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.id} - ${p.name}`);
  });

} catch (error) {
  console.error('\n❌ Erreur:');
  console.error(error.stderr || error.message);
}
