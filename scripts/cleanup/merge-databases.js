#!/usr/bin/env node

/**
 * Script pour fusionner les bases de données redondantes
 * Ce script migre les données de flodrama-database vers flodrama-db
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Utilisation des noms des bases de données
  sourceDb: 'flodrama-database',  // 7 tables
  targetDb: 'flodrama-db',        // 9 tables
  backupDir: path.join(__dirname, '../../backups')
};

// Créer le dossier de sauvegarde si nécessaire
if (!fs.existsSync(CONFIG.backupDir)) {
  fs.mkdirSync(CONFIG.backupDir, { recursive: true });
}

/**
 * Exécute une commande shell de manière synchrone
 * @param {string} command - Commande à exécuter
 * @returns {string} Sortie de la commande
 */
function runCommand(command) {
  console.log(`Exécution: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    return output ? output.toString() : '';
  } catch (error) {
    console.error(`Erreur lors de l'exécution: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Sauvegarde une base de données
 * @param {string} dbName - Nom de la base de données
 */
function backupDatabase(dbName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(CONFIG.backupDir, `${dbName}-${timestamp}.sql`);
  
  console.log(`\n🔵 Sauvegarde de la base de données ${dbName}...`);
  runCommand(`npx wrangler d1 export ${dbName} --output=${backupFile}`);
  console.log(`✅ Sauvegarde de ${dbName} terminée: ${backupFile}`);
  
  return backupFile;
}

/**
 * Récupère la liste des tables d'une base de données
 * @param {string} dbName - Nom de la base de données
 * @returns {string[]} Liste des noms de tables
 */
function getTableList(dbName) {
  console.log(`\n🔵 Récupération des tables de ${dbName}...`);
  const output = runCommand(`npx wrangler d1 execute ${dbName} --command="SELECT name FROM sqlite_master WHERE type='table';" --json`);
  
  try {
    const result = JSON.parse(output);
    if (result && result.results && result.results.length > 0) {
      // Vérifier si le résultat est un tableau d'objets ou un tableau de tableaux
      if (Array.isArray(result.results[0])) {
        // Format: [{"name": "table1"}, {"name": "table2"}]
        return result.results[0]
          .map(row => row.name)
          .filter(name => name && name !== '_cf_METADATA');
      } else {
        // Format: [["table1"], ["table2"]]
        return result.results
          .map(row => row[0])
          .filter(name => name && name !== '_cf_METADATA');
      }
    }
  } catch (e) {
    console.error('Erreur lors de l\'analyse des tables:', e);
    console.error('Sortie brute:', output);
  }
  
  console.log('Aucune table trouvée dans la base source');
  return [];
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log('🚀 Début de la fusion des bases de données');
  
  try {
    // 1. Sauvegarder les bases de données
    console.log('\n📦 Création des sauvegardes...');
    backupDatabase(CONFIG.sourceDb);
    backupDatabase(CONFIG.targetDb);
    
    // 2. Récupérer la liste des tables de la source
    const tables = getTableList(CONFIG.sourceDb);
    
    if (tables.length === 0) {
      console.error('Aucune table trouvée dans la base source');
      return;
    }
    
    // 3. Afficher le résumé avant de commencer
    console.log('\n🔄 Début de la fusion des données');
    console.log(`Source:      ${CONFIG.sourceDbName} (${CONFIG.sourceDb})`);
    console.log(`Destination: ${CONFIG.targetDbName} (${CONFIG.targetDb})`);
    console.log(`Tables à fusionner: ${tables.join(', ')}`);
    console.log('\nDébut de la fusion des tables...');
    
    for (const table of tables) {
      console.log(`\n🔄 Fusion de la table ${table}...`);
      
      // Créer un dump de la table source
      const dumpFile = path.join(CONFIG.backupDir, `dump-${table}.sql`);
      runCommand(`npx wrangler d1 execute ${CONFIG.sourceDb} --command=".output ${dumpFile}"`);
      runCommand(`npx wrangler d1 execute ${CONFIG.sourceDb} --command=".dump ${table}"`);
      
      // Importer dans la base cible
      runCommand(`npx wrangler d1 execute ${CONFIG.targetDb} --file=${dumpFile}`);
      
      // Supprimer le fichier temporaire
      fs.unlinkSync(dumpFile);
      
      console.log(`✅ Table ${table} fusionnée avec succès`);
    }
    
    console.log('\n✨ Fusion terminée avec succès !');
    console.log(`Les données de ${CONFIG.sourceDb} ont été fusionnées dans ${CONFIG.targetDb}`);
    console.log(`Des sauvegardes ont été créées dans: ${CONFIG.backupDir}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la fusion des bases de données:', error);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = {
  backupDatabase,
  getTableList,
};
