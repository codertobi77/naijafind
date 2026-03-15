#!/usr/bin/env node

/**
 * Script CLI pour vérifier le statut réel de la migration
 * Usage: npm run migrate:status
 *
 * Compatible avec la nouvelle version de:
 * productMigration:getMigrationStatusCLI
 *
 * Ce script affiche :
 * - les vrais totaux produits / candidats
 * - l'avancement de la migration
 * - la couverture des matches
 * - ce qu'il reste à faire
 * - un diagnostic global lisible
 */

import { execSync } from "child_process";

function runConvex(functionName, args = {}) {
  const serializedArgs = JSON.stringify(args).replace(/'/g, "'\\''");
  const command =
    Object.keys(args).length > 0
      ? `npx convex run ${functionName} '${serializedArgs}' --prod`
      : `npx convex run ${functionName} --prod`;

  const raw = execSync(command, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Impossible de parser la réponse JSON de ${functionName}.\n\nSortie brute:\n${raw}`
    );
  }
}

function formatNumber(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatPercent(value) {
  const n = Number(value || 0);
  return `${n}%`;
}

function yesNo(value) {
  return value ? "oui" : "non";
}

function statusIcon(ok) {
  return ok ? "✅" : "⏳";
}

function printHeader() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Statut de la migration                                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}

function printSection(title) {
  console.log(`\n${title}`);
}

function printLine(label, value) {
  console.log(`   • ${label}: ${value}`);
}

try {
  printHeader();

  try {
    execSync("npx convex --version", { stdio: "ignore" });
  } catch {
    console.error("❌ La CLI Convex n'est pas disponible.");
    console.error("   Assure-toi d'avoir installé les dépendances : npm install");
    process.exit(1);
  }

  console.log("⏳ Récupération du statut...\n");

  const status = runConvex("productMigration:getMigrationStatusCLI");

  if (!status || typeof status !== "object") {
    console.error("❌ Réponse invalide reçue depuis Convex.");
    process.exit(1);
  }

  const totals = status.totals || {};
  const remaining = status.remaining || {};
  const progress = status.progress || {};
  const health = status.health || {};
  const interpretation = status.interpretation || {};

  printSection("📦 Produits");
  printLine("Total produits", formatNumber(totals.totalProducts));
  printLine("Produits migrés", formatNumber(totals.migratedProducts));
  printLine("Produits recherchables", formatNumber(totals.searchableProducts));
  printLine(
    "Produits avec originalLanguage",
    formatNumber(totals.productsWithOriginalLang)
  );
  printLine(
    "Produits avec keywords",
    formatNumber(totals.productsWithKeywords)
  );

  printSection("🔗 Correspondances");
  printLine("Candidats totaux", formatNumber(totals.totalCandidates));
  printLine("Candidats approuvés", formatNumber(totals.approvedCandidates));
  printLine(
    "Produits avec au moins un candidat",
    formatNumber(totals.productsWithCandidates)
  );
  printLine(
    "Produits avec au moins un candidat approuvé",
    formatNumber(totals.productsWithApprovedCandidates)
  );

  printSection("📈 Progression");
  printLine("Migration complète", formatPercent(progress.migrationPercent));
  printLine("Produits recherchables", formatPercent(progress.searchablePercent));
  printLine(
    "Champ originalLanguage",
    formatPercent(progress.originalLanguagePercent)
  );
  printLine("Champ keywords", formatPercent(progress.keywordsPercent));
  printLine(
    "Produits avec candidats",
    formatPercent(progress.productsWithCandidatesPercent)
  );
  printLine(
    "Produits avec candidats approuvés",
    formatPercent(progress.productsWithApprovedCandidatesPercent)
  );
  printLine(
    "Couverture des matches sur les produits recherchables",
    formatPercent(progress.searchableCoveragePercent)
  );
  printLine(
    "Couverture des matches approuvés sur les produits recherchables",
    formatPercent(progress.approvedCoveragePercent)
  );

  printSection("🧩 Reste à faire");
  printLine(
    "Produits restant à migrer",
    formatNumber(remaining.productsRemainingForMigration)
  );
  printLine(
    "Produits recherchables sans candidat",
    formatNumber(remaining.searchableRemainingForMatching)
  );
  printLine(
    "Produits recherchables sans candidat approuvé",
    formatNumber(remaining.searchableRemainingForApprovedMatches)
  );

  printSection("🩺 Santé du système");
  printLine(
    "Migration terminée",
    `${statusIcon(health.migrationComplete)} ${yesNo(health.migrationComplete)}`
  );
  printLine(
    "Matching terminé",
    `${statusIcon(health.matchingComplete)} ${yesNo(health.matchingComplete)}`
  );
  printLine(
    "Couverture approuvée complète",
    `${statusIcon(health.approvalCoverageComplete)} ${yesNo(
      health.approvalCoverageComplete
    )}`
  );
  printLine(
    "Prêt pour la recherche",
    `${statusIcon(health.readyForSearch)} ${yesNo(health.readyForSearch)}`
  );

  if (interpretation.note) {
    printSection("📝 Interprétation");
    console.log(`   ${interpretation.note}`);
  }

  printSection("🚦 Diagnostic");
  if (health.migrationComplete && health.matchingComplete) {
    console.log("   ✅ La migration et le matching semblent terminés.");
  } else if (health.migrationComplete && !health.matchingComplete) {
    console.log("   ⏳ Les produits sont migrés, mais le matching n'est pas encore complet.");
    console.log("   Lance : npm run migrate:matches:alt");
  } else {
    console.log("   ⏳ La migration produits n'est pas encore complète.");
    console.log("   Lance : npm run migrate:products");
  }

  if (!health.readyForSearch) {
    console.log("   ⚠️ Le système n'est pas encore pleinement prêt pour la recherche.");
  }

  console.log("");
} catch (error) {
  console.error("\n❌ Erreur:");
  console.error(error?.stderr || error?.message || String(error));

  console.error("\n💡 Vérifications utiles:");
  console.error("   • npx convex login");
  console.error("   • backend Convex bien déployé");
  console.error("   • getMigrationStatusCLI mis à jour côté productMigration.ts");
  console.error("   • format JSON retourné par la query");

  process.exit(1);
}