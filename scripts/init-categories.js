#!/usr/bin/env node

/**
 * Script to initialize categories in Convex database
 * Usage: npm run init-categories
 *    or: node scripts/init-categories.js
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
  // 1. Try to read from .env files
  const envFiles = ['.env.local', '.env', '.env.production'];
  for (const envFile of envFiles) {
    const envPath = join(process.cwd(), envFile);
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, 'utf-8');
        // Look for VITE_CONVEX_URL
        const match = content.match(/VITE_CONVEX_URL\s*=\s*(.+)/);
        if (match && match[1]) {
          const url = match[1].trim().replace(/['"]/g, '');
          if (url && url !== '') {
            return url;
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }
  }

  // 2. Try to get from Convex CLI (npx convex deployment url)
  try {
    // Convex may store URL in .convex directory
    const convexDir = join(process.cwd(), '.convex');
    if (existsSync(convexDir)) {
      // Look in Convex config files
      try {
        const output = execSync('npx convex deployment ls', { 
          encoding: 'utf-8', 
          stdio: 'pipe',
          timeout: 10000,
          cwd: process.cwd()
        });
        
        // Extract active deployment URL
        const urlMatch = output.match(/https:\/\/[^\s]+\.convex\.site/);
        if (urlMatch) {
          return urlMatch[0];
        }
      } catch (error) {
        // Ignore if command fails
      }
    }
  } catch (error) {
    // Ignore errors
  }

  // 3. Try from system environment variables
  if (process.env.VITE_CONVEX_URL) {
    return process.env.VITE_CONVEX_URL;
  }

  return null;
}

// Default categories to initialize
const DEFAULT_CATEGORIES = [
  { name: "Restaurants", description: "Food and dining establishments", icon: "🍽️", order: 1 },
  { name: "Hotels", description: "Accommodation services", icon: "🏨", order: 2 },
  { name: "Transport", description: "Transportation services", icon: "🚗", order: 3 },
  { name: "Shopping", description: "Retail stores and shopping centers", icon: "🛍️", order: 4 },
  { name: "Healthcare", description: "Medical and healthcare providers", icon: "🏥", order: 5 },
  { name: "Education", description: "Schools and educational institutions", icon: "📚", order: 6 },
  { name: "Entertainment", description: "Leisure and entertainment venues", icon: "🎬", order: 7 },
  { name: "Services", description: "Professional services and contractors", icon: "💼", order: 8 },
  { name: "Technology", description: "IT and technology companies", icon: "💻", order: 9 },
  { name: "Finance", description: "Banks and financial institutions", icon: "🏦", order: 10 }
];

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║      Script d\'initialisation des catégories Olufinja    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  try {
    // Get Convex URL automatically
    let convexUrl = await getConvexUrl();
    
    if (!convexUrl) {
      // If we can't find the URL, ask the user
      convexUrl = await question('🌐 URL de votre endpoint Convex (ex: https://votre-projet.convex.site): ');
      
      if (!convexUrl.trim()) {
        console.error('❌ URL requise');
        process.exit(1);
      }
    } else {
      console.log(`🌐 URL Convex détectée: ${convexUrl}`);
    }

    // Clean URL - Convex uses .cloud for API but .convex.site for HTTP routes
    let cleanUrl = convexUrl.trim().replace(/\/$/, '');
    
    // Convert .convex.cloud to .convex.site for HTTP routes if needed
    if (cleanUrl.includes('.convex.cloud')) {
      cleanUrl = cleanUrl.replace('.convex.cloud', '.convex.site');
    }
    
    const endpoint = `${cleanUrl}/categories/init`;
    
    console.log(`🔗 Endpoint: ${endpoint}`);

    // Ask if user wants to use default categories or provide their own
    console.log('\n📋 Catégories par défaut:');
    DEFAULT_CATEGORIES.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} - ${cat.description}`);
    });

    const useDefaults = await question('\nSouhaitez-vous utiliser ces catégories par défaut ? (o/n): ');
    
    let categoriesToSend = [];
    
    if (useDefaults.toLowerCase().startsWith('o')) {
      categoriesToSend = DEFAULT_CATEGORIES;
    } else {
      console.log('\nVeuillez entrer vos propres catégories (laissez vide pour terminer):');
      let adding = true;
      let order = 1;
      
      while (adding) {
        const name = await question(`Nom de la catégorie #${order} (ou vide pour terminer): `);
        if (!name.trim()) {
          adding = false;
          continue;
        }
        
        const description = await question('Description (optionnel): ');
        const icon = await question('Icône (optionnel, ex: 🍽️): ');
        
        categoriesToSend.push({
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          order: order
        });
        
        order++;
      }
    }

    if (categoriesToSend.length === 0) {
      console.log('❌ Aucune catégorie à initialiser');
      process.exit(1);
    }

    console.log(`\n⏳ Initialisation de ${categoriesToSend.length} catégories...\n`);

    // Call the endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories: categoriesToSend
      }),
    });

    // Check status code
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    // Read response
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
      console.log(`📊 ${data.created} catégories créées`);
      
      if (data.errors && data.errors.length > 0) {
        console.log('\n⚠️  Erreurs lors de la création:');
        data.errors.forEach(err => {
          console.log(`   • ${err}`);
        });
      }
    } else {
      console.error('❌ Erreur:', data.error || 'Erreur inconnue');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    
    // Show more details for network errors
    if (error.message.includes('fetch')) {
      console.error('\n💡 Vérifiez:');
      console.error('   • Que votre projet Convex est déployé');
      console.error('   • Que vous êtes connecté à Internet');
      console.error('   • Que l\'URL est correcte et accessible\n');
    } else if (error.message.includes('JSON') || error.message.includes('réponse')) {
      console.error('\n💡 Le serveur a retourné une réponse invalide.');
      console.error('   • Vérifiez que la route /categories/init existe');
      console.error('   • Vérifiez les logs Convex pour plus de détails');
      console.error('   • Testez manuellement avec curl en utilisant votre URL Convex\n');
    } else {
      console.error('\n💡 Vérifiez:');
      console.error('   • Que votre projet Convex est déployé');
      console.error('   • Que l\'URL est correcte');
      console.error('   • Que la route /categories/init est accessible\n');
    }
    process.exit(1);  } finally {
    rl.close();
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Node.js 18+ est requis (pour fetch)');
  console.error('   Ou installez node-fetch: npm install node-fetch');
  process.exit(1);
}

main();