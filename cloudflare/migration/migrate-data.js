/**
 * Script de migration des données de Supabase vers Cloudflare D1
 * 
 * Ce script permet de migrer les données de Supabase vers Cloudflare D1
 * en utilisant l'accès direct PostgreSQL et l'API Cloudflare D1.
 */

// Importation des dépendances
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Chargement des variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL;

// Configuration Cloudflare
const D1_DATABASE_NAME = 'flodrama-db';

// Tables à migrer
const TABLES = ['dramas', 'films', 'animes', 'bollywood', 'scraping_logs'];

// Mapping des colonnes pour chaque table (colonnes à conserver pour D1)
// Basé sur l'analyse du schéma PostgreSQL et du schéma D1
const COLUMN_MAPPINGS = {
  dramas: ['id', 'title', 'description', 'poster', 'backdrop', 'rating', 'year', 'created_at', 'updated_at'],
  films: ['id', 'title', 'description', 'poster', 'backdrop', 'rating', 'year', 'created_at', 'updated_at'],
  animes: ['id', 'title', 'description', 'poster', 'backdrop', 'rating', 'year', 'created_at', 'updated_at'],
  bollywood: ['id', 'title', 'description', 'poster', 'backdrop', 'rating', 'year', 'created_at', 'updated_at'],
  scraping_logs: ['id', 'source', 'content_type', 'status', 'items_count', 'errors_count', 'duration', 'success', 'details', 'created_at']
};

// Pool de connexion PostgreSQL (pour accès direct)
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Fonction principale
 */
async function main() {
  // Vérifier si le mode distant est activé
  const isRemote = process.argv.includes('--remote');
  const remoteFlag = isRemote ? '--remote' : '';
  
  console.log(`🚀 Démarrage de la migration Supabase vers Cloudflare D1 ${isRemote ? '(DISTANT)' : '(LOCAL)'}`);
  
  try {
    // Test de connexion à PostgreSQL
    console.log('📡 Test de connexion à PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connexion à PostgreSQL établie avec succès');
    
    // Migration des données pour chaque table
    for (const table of TABLES) {
      console.log(`\n📋 Migration de la table ${table}...`);
      
      // Récupération des données depuis PostgreSQL avec seulement les colonnes nécessaires
      const columns = COLUMN_MAPPINGS[table].join(', ');
      console.log(`📥 Récupération des données depuis PostgreSQL (colonnes: ${columns})...`);
      const result = await client.query(`SELECT ${columns} FROM ${table}`);
      const data = result.rows;
      console.log(`✅ ${data.length} enregistrements récupérés`);
      
      if (data.length === 0) {
        console.log(`⚠️ Aucune donnée à migrer pour la table ${table}`);
        continue;
      }
      
      // Création du fichier SQL pour l'insertion des données
      console.log(`📝 Création du fichier SQL pour l'insertion des données...`);
      const sqlFile = path.resolve(__dirname, `${table}_data.sql`);
      
      // Vider la table avant d'insérer de nouvelles données
      let sqlContent = `DELETE FROM ${table};\n`;
      
      // Génération des requêtes INSERT
      for (const row of data) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object' && value instanceof Date) return `'${value.toISOString()}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          return value;
        }).join(', ');
        
        sqlContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
      }
      
      fs.writeFileSync(sqlFile, sqlContent);
      console.log(`✅ Fichier SQL créé avec succès : ${sqlFile}`);
      
      // Exécution du fichier SQL sur Cloudflare D1
      console.log(`📤 Exécution du fichier SQL sur Cloudflare D1 ${isRemote ? '(DISTANT)' : '(LOCAL)'}...`);
      const command = `npx wrangler d1 execute ${D1_DATABASE_NAME} --file=${sqlFile} ${remoteFlag}`;
      
      await new Promise((resolve, reject) => {
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Erreur lors de l'exécution de la commande : ${error.message}`);
            console.error(`Stderr : ${stderr}`);
            reject(error);
            return;
          }
          
          console.log(`✅ Données insérées avec succès dans Cloudflare D1 ${isRemote ? '(DISTANT)' : '(LOCAL)'}`);
          console.log(stdout);
          resolve();
        });
      });
    }
    
    // Libération de la connexion PostgreSQL
    client.release();
    
    console.log('\n🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error(`❌ Erreur lors de la migration: ${error}`);
    throw error;
  } finally {
    // Fermeture du pool de connexion
    await pool.end();
  }
}

// Exécution de la fonction principale
main().catch(error => {
  console.error(`❌ Erreur fatale: ${error}`);
  process.exit(1);
});
