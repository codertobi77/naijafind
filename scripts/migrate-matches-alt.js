#!/usr/bin/env node

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

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Calcul des correspondances                               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    execSync("npx convex --version", { stdio: "ignore" });

    const batchSize = parseInt((await question("📦 Taille des lots [10]: ")) || "10", 10);
    const autoApprove = await question("✅ Auto-approbation high ? (oui/non) [oui]: ");
    const maxBatches = parseInt((await question("🔄 Nombre maximum de batches [200]: ")) || "200", 10);

    const autoApproveBool = !["non", "n", "no"].includes(autoApprove.toLowerCase());

    const confirm = await question("▶️  Lancer le calcul ? (oui/non): ");
    if (!["oui", "o", "yes", "y"].includes(confirm.toLowerCase())) {
      console.log("\n❌ Opération annulée");
      process.exit(0);
    }

    let totalProcessed = 0;
    let totalMatchesCreated = 0;
    let totalMatchesUpdated = 0;
    let totalErrors = 0;
    let batchCount = 0;
    let hasMore = true;
    let currentCursor = null;

    while (hasMore && batchCount < maxBatches) {
      batchCount++;

      const argsObj = {
        batchSize,
        onlyWithoutMatches: false,
        autoApproveHighConfidence: autoApproveBool,
      };

      if (currentCursor) {
        argsObj.startCursor = currentCursor;
      }

      const result = execSync(
        `npx convex run productMigration:computeMatchesForAllProductsCLI '${JSON.stringify(argsObj)}' --prod`,
        {
          encoding: "utf-8",
          cwd: process.cwd(),
        }
      );

      const data = JSON.parse(result);

      totalProcessed += data.totalProcessed || 0;
      totalMatchesCreated += data.matchesCreated || 0;
      totalMatchesUpdated += data.matchesUpdated || 0;
      totalErrors += data.errors?.length || 0;

      currentCursor = data.nextCursor || null;
      hasMore = data.hasMore === true;

      console.log(
        `Batch ${batchCount}: traités=${data.totalProcessed || 0}, créés=${data.matchesCreated || 0}, mis à jour=${data.matchesUpdated || 0}, erreurs=${data.errors?.length || 0}`
      );

      if (hasMore && currentCursor) {
        await sleep(1000);
      }
    }

    console.log("\nRésumé :");
    console.log(`  • Batches: ${batchCount}`);
    console.log(`  • Produits traités: ${totalProcessed}`);
    console.log(`  • Matches créés: ${totalMatchesCreated}`);
    console.log(`  • Matches mis à jour: ${totalMatchesUpdated}`);
    console.log(`  • Erreurs: ${totalErrors}`);
    console.log(`  • Terminé: ${hasMore ? "non" : "oui"}`);
  } catch (error) {
    console.error("\n❌ Erreur:", error.stderr || error.message || error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();