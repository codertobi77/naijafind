#!/usr/bin/env node

/**
 * Script CLI pour migration complète (produits + correspondances)
 *
 * Cette version :
 * - orchestre elle-même la phase 1 et la phase 2
 * - gère les curseurs de reprise
 * - boucle jusqu'à la fin réelle du dataset
 * - affiche un résumé fiable
 *
 * Pré-requis :
 * - migrateAllProductsCLI doit renvoyer :
 *   { success, totalProcessed, migrated, errors, attempts, completed, finalCursor }
 *
 * - computeMatchesForAllProductsCLI doit renvoyer :
 *   { success, totalProcessed, matchesCreated, matchesUpdated, errors, nextCursor, hasMore }
 */

import { execSync } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseYesNo(input, defaultValue = true) {
  const value = String(input || "").trim().toLowerCase();

  if (!value) return defaultValue;
  if (["oui", "o", "yes", "y"].includes(value)) return true;
  if (["non", "n", "no"].includes(value)) return false;

  return defaultValue;
}

function safeParseInt(value, fallback) {
  const parsed = parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function runConvex(functionName, args) {
  const serializedArgs = JSON.stringify(args).replace(/'/g, "'\\''");
  const command = `npx convex run ${functionName} '${serializedArgs}' --prod`;

  const raw = execSync(command, {
    encoding: "utf-8",
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Impossible de parser la réponse JSON de ${functionName}.\nSortie brute:\n${raw}`
    );
  }
}

function printSection(title) {
  console.log("\n" + "═".repeat(63));
  console.log(title);
  console.log("═".repeat(63));
}

function printKeyValue(label, value) {
  console.log(`  • ${label}: ${value}`);
}

async function runPhase1({
  defaultLanguage,
  batchSize,
  maxBatches,
  delayMs,
}) {
  printSection("PHASE 1 — Migration des produits");

  let batchCount = 0;
  let completed = false;
  let currentCursor = null;

  const totals = {
    totalProcessed: 0,
    migrated: 0,
    errors: [],
  };

  while (!completed && batchCount < maxBatches) {
    batchCount++;

    const args = {
      defaultLanguage,
      batchSize,
      ...(currentCursor ? { startCursor: currentCursor } : {}),
    };

    console.log(`\n[Phase 1] Batch ${batchCount}...`);
    if (currentCursor) {
      console.log(`  Cursor de reprise: ${currentCursor}`);
    }

    const result = runConvex("productMigration:migrateAllProductsCLI", args);

    totals.totalProcessed += result.totalProcessed || 0;
    totals.migrated += result.migrated || 0;
    totals.errors.push(...(result.errors || []));

    completed = result.completed === true;
    currentCursor = result.finalCursor || null;

    printKeyValue("Traités (batch)", result.totalProcessed || 0);
    printKeyValue("Migrés (batch)", result.migrated || 0);
    printKeyValue("Erreurs (batch)", (result.errors || []).length);
    printKeyValue("Terminé", completed ? "oui" : "non");

    if (!completed && batchCount < maxBatches) {
      await sleep(delayMs);
    }
  }

  return {
    success: true,
    batches: batchCount,
    completed,
    finalCursor: currentCursor,
    ...totals,
  };
}

async function runPhase2({
  batchSize,
  autoApproveHighConfidence,
  maxBatches,
  delayMs,
}) {
  printSection("PHASE 2 — Calcul des correspondances");

  let batchCount = 0;
  let hasMore = true;
  let currentCursor = null;

  const totals = {
    totalProcessed: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    errors: [],
  };

  while (hasMore && batchCount < maxBatches) {
    batchCount++;

    const args = {
      batchSize,
      onlyWithoutMatches: false,
      autoApproveHighConfidence,
      ...(currentCursor ? { startCursor: currentCursor } : {}),
    };

    console.log(`\n[Phase 2] Batch ${batchCount}...`);
    if (currentCursor) {
      console.log(`  Cursor de reprise: ${currentCursor}`);
    }

    const result = runConvex(
      "productMigration:computeMatchesForAllProductsCLI",
      args
    );

    totals.totalProcessed += result.totalProcessed || 0;
    totals.matchesCreated += result.matchesCreated || 0;
    totals.matchesUpdated += result.matchesUpdated || 0;
    totals.errors.push(...(result.errors || []));

    currentCursor = result.nextCursor || null;
    hasMore = result.hasMore === true;

    printKeyValue("Produits traités (batch)", result.totalProcessed || 0);
    printKeyValue("Matches créés (batch)", result.matchesCreated || 0);
    printKeyValue("Matches mis à jour (batch)", result.matchesUpdated || 0);
    printKeyValue("Erreurs (batch)", (result.errors || []).length);
    printKeyValue("Reste des produits", hasMore ? "oui" : "non");

    if (hasMore && batchCount < maxBatches) {
      await sleep(delayMs);
    }
  }

  return {
    success: true,
    batches: batchCount,
    completed: !hasMore,
    finalCursor: currentCursor,
    ...totals,
  };
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Migration complète - Produits + Correspondances          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    try {
      execSync("npx convex --version", { stdio: "ignore" });
    } catch {
      console.error("\n❌ La CLI Convex n'est pas disponible.");
      console.error("   Installe les dépendances puis réessaie.");
      process.exit(1);
    }

    const defaultLanguage =
      (await question("\n🌍 Langue par défaut (en/fr) [en]: ")).trim() || "en";

    const productBatchSize = safeParseInt(
      await question("📦 Taille des lots - produits [100]: "),
      100
    );

    const matchBatchSize = safeParseInt(
      await question("📦 Taille des lots - correspondances [10]: "),
      10
    );

    const autoApproveHighConfidence = parseYesNo(
      await question(
        '✅ Auto-approuver les correspondances "high" ? (oui/non) [oui]: '
      ),
      true
    );

    const maxProductBatches = safeParseInt(
      await question("🔄 Nombre max de batches produits [200]: "),
      200
    );

    const maxMatchBatches = safeParseInt(
      await question("🔄 Nombre max de batches correspondances [500]: "),
      500
    );

    const delayMs = safeParseInt(
      await question("⏱️  Pause entre batches en ms [1000]: "),
      1000
    );

    printSection("Configuration");
    printKeyValue("Langue par défaut", defaultLanguage);
    printKeyValue("Batch produits", productBatchSize);
    printKeyValue("Batch correspondances", matchBatchSize);
    printKeyValue(
      "Auto-approbation high",
      autoApproveHighConfidence ? "oui" : "non"
    );
    printKeyValue("Max batches produits", maxProductBatches);
    printKeyValue("Max batches correspondances", maxMatchBatches);
    printKeyValue("Pause entre batches", `${delayMs} ms`);

    const confirm = parseYesNo(
      await question("\n▶️  Lancer la migration complète ? (oui/non): "),
      false
    );

    if (!confirm) {
      console.log("\n❌ Migration annulée.");
      process.exit(0);
    }

    const startedAt = Date.now();

    const phase1 = await runPhase1({
      defaultLanguage,
      batchSize: productBatchSize,
      maxBatches: maxProductBatches,
      delayMs,
    });

    const phase2 = await runPhase2({
      batchSize: matchBatchSize,
      autoApproveHighConfidence,
      maxBatches: maxMatchBatches,
      delayMs,
    });

    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);

    printSection("Résumé final");

    console.log("\nPHASE 1 — Produits");
    printKeyValue("Batches exécutés", phase1.batches);
    printKeyValue("Produits traités", phase1.totalProcessed);
    printKeyValue("Produits migrés", phase1.migrated);
    printKeyValue("Erreurs", phase1.errors.length);
    printKeyValue("Terminée", phase1.completed ? "oui" : "non");
    printKeyValue("Dernier curseur", phase1.finalCursor || "aucun");

    console.log("\nPHASE 2 — Correspondances");
    printKeyValue("Batches exécutés", phase2.batches);
    printKeyValue("Produits traités", phase2.totalProcessed);
    printKeyValue("Matches créés", phase2.matchesCreated);
    printKeyValue("Matches mis à jour", phase2.matchesUpdated);
    printKeyValue("Erreurs", phase2.errors.length);
    printKeyValue("Terminée", phase2.completed ? "oui" : "non");
    printKeyValue("Dernier curseur", phase2.finalCursor || "aucun");

    console.log("\nGLOBAL");
    printKeyValue(
      "Erreurs totales",
      phase1.errors.length + phase2.errors.length
    );
    printKeyValue("Durée approx.", `${durationSeconds} s`);

    if (phase1.completed && phase2.completed) {
      console.log("\n✅ Migration complète terminée correctement.");
    } else {
      console.log("\n⚠️  Migration incomplète.");
      console.log("   Relance le script pour poursuivre.");
    }

    console.log("\n📊 Vérifie ensuite le statut avec: npm run migrate:status");
  } catch (error) {
    console.error("\n❌ Erreur lors de la migration:");
    console.error(error?.stderr || error?.message || String(error));

    console.error("\n💡 Pistes de vérification:");
    console.error("   • npx convex login");
    console.error("   • npx convex dev ou déploiement correct du backend");
    console.error("   • cohérence des retours JSON des actions Convex");
    console.error("   • logs Convex côté serveur");

    process.exit(1);
  } finally {
    rl.close();
  }
}

main();