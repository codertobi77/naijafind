import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { resolve } from "path";

// Charger les variables d'environnement depuis .env
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    });
  } catch {
    // ignore si pas de fichier .env
  }
}

loadEnv();

// Détecter si on veut la prod
const args = process.argv.slice(2);
const isProd = args.includes("--prod");

const CONVEX_URL = isProd
  ? (process.env.VITE_CONVEX_URL?.replace('.cloud', '.site') || process.env.CONVEX_URL)
  : (process.env.CONVEX_URL || process.env.VITE_CONVEX_URL);

if (!CONVEX_URL) {
  console.error("❌ Erreur: CONVEX_URL ou VITE_CONVEX_URL doit être défini");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function runDeduplication() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");

  console.log(`🔍 Mode: ${dryRun ? "DRY RUN (prévisualisation)" : "EXÉCUTION RÉELLE"}`);
  console.log("⏳ Analyse des doublons en cours...\n");

  try {
    // Étape 1: Dry run pour voir les doublons
    const result = await client.action("suppliers:removeDuplicateSuppliers", {
      dryRun,
    });

    console.log("=".repeat(60));
    console.log("📊 RÉSULTATS");
    console.log("=".repeat(60));
    console.log(`
📦 Total suppliers: ${result.totalSuppliers}
📋 Groupes de doublons: ${result.duplicateGroups}
🗑️ Suppliers à supprimer: ${result.duplicatesToRemove || 0}`);

    if (result.duplicateGroups > 0) {
      console.log("\n📋 Détails des doublons trouvés:");
      result.details?.forEach((d, i) => {
        console.log(`\n  ${i + 1}. ${d.businessName}`);
        console.log(`     └─ Garder: ${d.keepId} (score: ${d.keepScore})`);
        console.log(`     └─ Supprimer: ${d.deleteCount} supplier(s)`);
        console.log(`     └─ IDs: ${d.deleteIds.slice(0, 3).join(", ")}${d.deleteIds.length > 3 ? "..." : ""}`);
      });
    }

    if (!dryRun && result.summary) {
      console.log("\n✅ OPÉRATION EFFECTUÉE:");
      console.log(`   ${result.summary}`);
    }

    if (result.errors?.length > 0) {
      console.log("\n⚠️ ERREURS RENCONTRÉES:");
      result.errors.forEach((e) => console.log(`   - ${e}`));
    }

    console.log("\n" + "=".repeat(60));

    if (dryRun && result.duplicatesToRemove > 0) {
      console.log("\n💡 Pour exécuter réellement la suppression, ajoute --execute:");
      console.log(`   node scripts/dedup-suppliers.js --execute`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("\n❌ ERREUR:", error.message || error);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

runDeduplication();
