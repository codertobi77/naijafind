#!/usr/bin/env node
/**
 * Convex Data Migration Tool
 * 
 * Usage:
 * 1. Export from dev:  node scripts/migrate-convex-data.js export --env dev --output ./migration-data
 * 2. Import to prod:   node scripts/migrate-convex-data.js import --env prod --input ./migration-data
 * 
 * Prerequisites:
 * - Install convex CLI: npm install -g convex
 * - Login to convex: npx convex login
 * - Set CONVEX_PROJECT environment variable or use --project flag
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TABLES = [
  'users',
  'categories',
  'suppliers',
  'products',
  'reviews',
  'contacts',
  'messages',
  'verification_tokens',
  'password_reset_tokens',
  'verification_documents',
  'rate_limit_attempts',
  'newsletter_subscriptions',
  'notifications',
];

const DEPENDENCIES = {
  users: [],
  categories: [],
  suppliers: ['users'],
  products: ['suppliers'],
  reviews: ['suppliers', 'users'],
  contacts: [],
  messages: ['suppliers'],
  verification_tokens: ['users'],
  password_reset_tokens: ['users'],
  verification_documents: ['suppliers'],
  rate_limit_attempts: [],
  newsletter_subscriptions: [],
  notifications: ['users'],
};

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: options.silent ? 'pipe' : 'inherit', ...options });
  } catch (error) {
    if (options.ignoreError) return null;
    console.error(`Command failed: ${command}`);
    throw error;
  }
}

function getProjectId() {
  const projectFlag = process.argv.find(arg => arg.startsWith('--project='));
  if (projectFlag) return projectFlag.split('=')[1];
  
  const envProject = process.env.CONVEX_PROJECT;
  if (envProject) return envProject;
  
  // Try to read from .env.local or convex.json
  try {
    const convexJson = JSON.parse(fs.readFileSync('./convex.json', 'utf-8'));
    return convexJson.project;
  } catch {
    // ignore
  }
  
  return null;
}

function getEnv() {
  const envFlag = process.argv.find(arg => arg.startsWith('--env='));
  return envFlag ? envFlag.split('=')[1] : 'dev';
}

function getOutputDir() {
  const outputFlag = process.argv.find(arg => arg.startsWith('--output='));
  return outputFlag ? outputFlag.split('=')[1] : './migration-data';
}

function getInputDir() {
  const inputFlag = process.argv.find(arg => arg.startsWith('--input='));
  return inputFlag ? inputFlag.split('=')[1] : './migration-data';
}

function validateProject(projectId) {
  if (!projectId) {
    console.error('❌ Error: Convex project ID is required.');
    console.error('   Set it via:');
    console.error('   - --project=<project-id> flag');
    console.error('   - CONVEX_PROJECT environment variable');
    console.error('   - convex.json file');
    process.exit(1);
  }
}

async function exportTable(projectId, env, table, outputDir) {
  console.log(`📤 Exporting ${table} from ${env}...`);
  
  const tempFile = path.join(outputDir, `${table}.json`);
  
  try {
    // Use convex data export command
    const result = exec(
      `npx convex data export ${table} --project ${projectId} --env ${env}`,
      { silent: true }
    );
    
    if (result) {
      fs.writeFileSync(tempFile, result);
      const data = JSON.parse(result);
      console.log(`   ✅ Exported ${Array.isArray(data) ? data.length : 0} records`);
      return data;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not export ${table} (may be empty or not exist)`);
    fs.writeFileSync(tempFile, '[]');
    return [];
  }
}

async function exportAll(projectId, env, outputDir) {
  console.log(`\n🚀 Starting export from ${env} environment\n`);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const metadata = {
    exportedAt: new Date().toISOString(),
    sourceEnv: env,
    projectId: projectId,
    tables: {},
  };
  
  // Export in dependency order
  for (const table of TABLES) {
    const data = await exportTable(projectId, env, table, outputDir);
    metadata.tables[table] = { count: Array.isArray(data) ? data.length : 0 };
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`\n✅ Export complete! Data saved to: ${outputDir}`);
  console.log(`\nSummary:`);
  for (const [table, info] of Object.entries(metadata.tables)) {
    console.log(`   ${table}: ${info.count} records`);
  }
}

async function importTable(projectId, env, table, inputDir) {
  console.log(`📥 Importing ${table} to ${env}...`);
  
  const dataFile = path.join(inputDir, `${table}.json`);
  
  if (!fs.existsSync(dataFile)) {
    console.log(`   ⚠️  No data file found for ${table}`);
    return 0;
  }
  
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`   ℹ️  No records to import for ${table}`);
    return 0;
  }
  
  // Remove _id and _creationTime fields for new inserts
  const cleanedData = data.map(record => {
    const { _id, _creationTime, ...rest } = record;
    return rest;
  });
  
  // Write to a temporary file for import
  const tempImportFile = path.join(inputDir, `${table}_import.json`);
  fs.writeFileSync(tempImportFile, JSON.stringify(cleanedData));
  
  try {
    // Use the import mutation via convex CLI
    // First, we need to chunk the data for large imports
    const CHUNK_SIZE = 50;
    let importedCount = 0;
    
    for (let i = 0; i < cleanedData.length; i += CHUNK_SIZE) {
      const chunk = cleanedData.slice(i, i + CHUNK_SIZE);
      const chunkFile = path.join(inputDir, `${table}_chunk_${i}.json`);
      fs.writeFileSync(chunkFile, JSON.stringify(chunk));
      
      try {
        exec(
          `npx convex run admin:bulkImport --project ${projectId} --env ${env} --data '${JSON.stringify({ table, data: chunk })}'`,
          { silent: true }
        );
        importedCount += chunk.length;
      } catch (error) {
        console.error(`   ❌ Failed to import chunk ${i / CHUNK_SIZE + 1}: ${error.message}`);
      }
      
      // Clean up chunk file
      fs.unlinkSync(chunkFile);
    }
    
    console.log(`   ✅ Imported ${importedCount}/${data.length} records`);
    return importedCount;
  } catch (error) {
    console.error(`   ❌ Error importing ${table}: ${error.message}`);
    return 0;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempImportFile)) {
      fs.unlinkSync(tempImportFile);
    }
  }
}

async function importAll(projectId, env, inputDir) {
  console.log(`\n🚀 Starting import to ${env} environment\n`);
  
  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Input directory not found: ${inputDir}`);
    process.exit(1);
  }
  
  const metadataFile = path.join(inputDir, 'metadata.json');
  if (fs.existsSync(metadataFile)) {
    const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
    console.log(`📋 Source: ${metadata.sourceEnv} (exported at ${metadata.exportedAt})\n`);
  }
  
  const results = {};
  
  // Import in dependency order
  for (const table of TABLES) {
    results[table] = await importTable(projectId, env, table, inputDir);
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`\nSummary:`);
  for (const [table, count] of Object.entries(results)) {
    console.log(`   ${table}: ${count} records imported`);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (!command || !['export', 'import'].includes(command)) {
    console.log(`
Convex Data Migration Tool

Usage:
  node scripts/migrate-convex-data.js export [options]
  node scripts/migrate-convex-data.js import [options]

Options:
  --project=<id>    Convex project ID (or set CONVEX_PROJECT env var)
  --env=<env>       Environment: dev | prod (default: dev for export, prod for import)
  --output=<dir>    Output directory for export (default: ./migration-data)
  --input=<dir>     Input directory for import (default: ./migration-data)

Examples:
  # Export from dev
  node scripts/migrate-convex-data.js export --env dev --output ./migration-data

  # Import to prod
  node scripts/migrate-convex-data.js import --env prod --input ./migration-data

Prerequisites:
  - npm install -g convex
  - npx convex login
`);
    process.exit(0);
  }
  
  const projectId = getProjectId();
  validateProject(projectId);
  
  const env = getEnv();
  
  if (command === 'export') {
    const outputDir = getOutputDir();
    await exportAll(projectId, env, outputDir);
  } else if (command === 'import') {
    const inputDir = getInputDir();
    await importAll(projectId, env, inputDir);
  }
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
