#!/usr/bin/env node

/**
 * Script interactif pour créer un utilisateur admin dans Convex
 * Usage: npm run create-admin
 *    ou: node scripts/create-admin.js
 */

import readline from 'readline';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getConvexUrl() {
  // 1. Essayer de lire depuis les fichiers .env
  const envFiles = ['.env.local', '.env', '.env.production'];
  for (const envFile of envFiles) {
    const envPath = join(process.cwd(), envFile);
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, 'utf-8');
        // Chercher VITE_CONVEX_URL
        const match = content.match(/VITE_CONVEX_URL\s*=\s*(.+)/);
        if (match && match[1]) {
          const url = match[1].trim().replace(/['"]/g, '');
          if (url && url !== '') {
            return url;
          }
        }
      } catch (error) {
        // Ignorer les erreurs de lecture
      }
    }
  }

  // 2. Essayer de récupérer via la CLI Convex (npx convex deployment url)
  try {
    // Convex peut stocker l'URL dans le dossier .convex
    const convexDir = join(process.cwd(), '.convex');
    if (existsSync(convexDir)) {
      // Chercher dans les fichiers de configuration Convex
      try {
        const output = execSync('npx convex deployment ls', { 
          encoding: 'utf-8', 
          stdio: 'pipe',
          timeout: 10000,
          cwd: process.cwd()
        });
        
        // Extraire l'URL du déploiement actif
        const urlMatch = output.match(/https:\/\/[^\s]+\.convex\.site/);
        if (urlMatch) {
          return urlMatch[0];
        }
      } catch (error) {
        // Ignorer si la commande échoue
      }
    }
  } catch (error) {
    // Ignorer les erreurs
  }

  // 3. Essayer depuis les variables d'environnement du système
  if (process.env.VITE_CONVEX_URL) {
    return process.env.VITE_CONVEX_URL;
  }

  return null;
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║     Script de création d\'administrateur NaijaFind    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  try {
    // Récupérer l'URL Convex automatiquement
    let convexUrl = await getConvexUrl();
    
    if (!convexUrl) {
      // Si on ne trouve pas l'URL, demander à l'utilisateur
      convexUrl = await question('🌐 URL de votre endpoint Convex (ex: https://votre-projet.convex.site): ');
      
      if (!convexUrl.trim()) {
        console.error('❌ URL requise');
        process.exit(1);
      }
    } else {
      console.log(`🌐 URL Convex détectée: ${convexUrl}`);
    }

    // Nettoyer l'URL - Convex utilise .cloud pour l'API mais .convex.site pour les routes HTTP
    let cleanUrl = convexUrl.trim().replace(/\/$/, '');
    
    // Si l'URL se termine par .convex.cloud, la convertir en .convex.site pour les routes HTTP
    if (cleanUrl.includes('.convex.cloud')) {
      cleanUrl = cleanUrl.replace('.convex.cloud', '.convex.site');
    }
    
    const endpoint = `${cleanUrl}/admin/create`;
    
    console.log(`🔗 Endpoint: ${endpoint}`);

    // Demander l'email
    const email = await question('📧 Email de l\'administrateur: ');
    
    if (!email.trim()) {
      console.error('❌ Email requis');
      process.exit(1);
    }

    // Valider le format email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.error('❌ Format d\'email invalide');
      process.exit(1);
    }

    // Demander les informations optionnelles
    const firstName = await question('👤 Prénom (optionnel): ');
    const lastName = await question('👤 Nom (optionnel): ');
    const phone = await question('📱 Téléphone (optionnel): ');

    console.log('\n⏳ Création de l\'administrateur en cours...\n');

    // Appeler l'endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    });

    // Vérifier le status code
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    // Lire la réponse
    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Réponse vide du serveur');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Réponse invalide du serveur (pas de JSON): ${responseText.substring(0, 200)}`);
    }

    if (data.success) {
      console.log('✅ Succès !\n');
      console.log(`📝 ${data.message}\n`);
      console.log('📌 Prochaines étapes:');
      console.log(`   1. L'utilisateur doit s'inscrire via Clerk avec l'email: ${email.trim()}`);
      console.log('   2. Une fois inscrit, il pourra choisir le rôle "Administrateur"');
      console.log('   3. Il sera ensuite redirigé vers /admin\n');
    } else {
      console.error('❌ Erreur:', data.error || 'Erreur inconnue');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    
    // Afficher plus de détails si c'est une erreur de réseau
    if (error.message.includes('fetch')) {
      console.error('\n💡 Vérifiez:');
      console.error('   • Que votre projet Convex est déployé');
      console.error('   • Que vous êtes connecté à Internet');
      console.error('   • Que l\'URL est correcte et accessible\n');
    } else if (error.message.includes('JSON') || error.message.includes('réponse')) {
      console.error('\n💡 Le serveur a retourné une réponse invalide.');
      console.error('   • Vérifiez que la route /admin/create existe');
      console.error('   • Vérifiez les logs Convex pour plus de détails');
      console.error(`   • Testez manuellement: curl -X POST ${cleanUrl}/admin/create -H "Content-Type: application/json" -d '{"email":"test@example.com"}'\n`);
    } else {
      console.error('\n💡 Vérifiez:');
      console.error('   • Que votre projet Convex est déployé');
      console.error('   • Que l\'URL est correcte');
      console.error('   • Que la route /admin/create est accessible\n');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Vérifier si fetch est disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Node.js 18+ est requis (pour fetch)');
  console.error('   Ou installez node-fetch: npm install node-fetch');
  process.exit(1);
}

main();

