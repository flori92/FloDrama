/**
 * Script de migration des images et assets vers Cloudflare R2
 * 
 * Ce script télécharge les images depuis les URLs d'origine
 * et les upload vers Cloudflare R2, puis met à jour les URLs
 * dans la base de données D1.
 */

const { Pool } = require('pg');
// Importation correcte de node-fetch pour les versions récentes
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Chargement des variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration PostgreSQL (source)
const DATABASE_URL = process.env.DATABASE_URL;

// Configuration Cloudflare (destination)
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '42fc982266a2c31b942593b18097e4b3';

// Configuration Cloudflare
const D1_DATABASE_NAME = 'flodrama-db';
const R2_BUCKET_NAME = 'flodrama-storage';

// Définition des types d'assets à migrer
const ASSET_TYPES = ['poster', 'backdrop', 'image_url'];

// Pool de connexion PostgreSQL
const pgPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(url, outputPath) {
  if (!url) return null;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Erreur lors du téléchargement de l'image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const buffer = await response.buffer();
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    console.error(`Erreur lors du téléchargement de l'image: ${error.message}`);
    return null;
  }
}

/**
 * Upload un fichier vers Cloudflare R2
 */
async function uploadToR2(filePath, key) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Le fichier ${filePath} n'existe pas`);
  }
  
  try {
    // Construction de la commande wrangler pour uploader vers R2
    const command = `npx wrangler r2 object put flodrama-storage/${key} --file=${filePath}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Erreur lors de l'upload vers R2: ${error.message}`);
          return reject(error);
        }
        
        if (stderr && !stderr.includes('Success')) {
          console.error(`Erreur standard R2: ${stderr}`);
          return reject(new Error(stderr));
        }
        
        // Construction de l'URL publique R2
        const r2Url = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/flodrama-storage/${key}`;
        console.log(`✅ Fichier uploadé vers R2: ${r2Url}`);
        resolve(r2Url);
      });
    });
  } catch (error) {
    console.error(`❌ Erreur lors de l'upload vers R2: ${error.message}`);
    throw error;
  }
}

/**
 * Met à jour l'URL d'un asset dans la base de données D1
 */
async function updateUrlInD1(tableName, itemId, columnName, newUrl) {
  try {
    // Construction de la commande wrangler pour exécuter une requête SQL sur D1
    const command = `npx wrangler d1 execute flodrama-db --command="UPDATE ${tableName} SET ${columnName} = '${newUrl}' WHERE id = '${itemId}';"`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Erreur standard: ${stderr}`);
          return reject(new Error(stderr));
        }
        
        console.log(`📊 Résultat de la mise à jour: ${stdout}`);
        resolve(true);
      });
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour dans D1: ${error.message}`);
    return false;
  }
}

/**
 * Fonction principale pour le traitement des tables
 */
async function migrateAssetsForTable(tableName, imageColumns = ['poster', 'backdrop', 'image_url']) {
  console.log(`📋 Migration des assets pour la table ${tableName}...`);
  
  try {
    // Vérification des colonnes disponibles dans la table
    const columnCheck = await pgPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);
    
    const availableColumns = columnCheck.rows.map(row => row.column_name);
    
    // Filtrer les colonnes d'image qui existent réellement dans la table
    const validImageColumns = imageColumns.filter(col => availableColumns.includes(col));
    
    if (validImageColumns.length === 0) {
      console.log(`⚠️ Aucune colonne d'image valide trouvée dans la table ${tableName}`);
      return;
    }
    
    // Construction de la requête SELECT avec uniquement les colonnes qui existent
    const selectColumns = ['id', ...validImageColumns].join(', ');
    
    // Récupération des données
    const { rows } = await pgPool.query(`SELECT ${selectColumns} FROM ${tableName}`);
    console.log(`📊 ${rows.length} éléments trouvés`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Traitement de chaque élément
    for (const item of rows) {
      console.log(`\n🔄 Traitement de l'élément ${item.id}`);
      
      // Pour chaque colonne d'image valide
      for (const column of validImageColumns) {
        const originalUrl = item[column];
        
        if (!originalUrl) {
          console.log(`⚠️ Pas d'URL pour ${column}`);
          continue;
        }
        
        console.log(`🌐 URL d'origine pour ${column}: ${originalUrl}`);
        
        try {
          // Construction du chemin de stockage dans R2
          const r2Key = `${column}s/${tableName}/${item.id}_${column}${path.extname(originalUrl) || '.jpg'}`;
          const tempFilePath = path.join(__dirname, 'temp', `${item.id}_${column}${path.extname(originalUrl) || '.jpg'}`);
          
          // Téléchargement de l'image
          console.log(`📥 Téléchargement de l'image...`);
          const response = await fetch(originalUrl);
          
          if (!response.ok) {
            throw new Error(`Statut HTTP: ${response.status}`);
          }
          
          // Sauvegarde en local
          const buffer = await response.buffer();
          fs.writeFileSync(tempFilePath, buffer);
          
          // Upload vers R2
          console.log(`📤 Upload vers R2...`);
          await uploadToR2(tempFilePath, r2Key);
          
          // Construction de la nouvelle URL
          const newUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/flodrama-storage/${r2Key}`;
          
          // Mise à jour dans D1
          console.log(`🔄 Mise à jour de l'URL dans D1...`);
          await updateUrlInD1(tableName, item.id, column, newUrl);
          
          console.log(`✅ Migration réussie pour ${column}`);
          successCount++;
          
          // Suppression du fichier temporaire
          fs.unlinkSync(tempFilePath);
        } catch (error) {
          console.log(`❌ Échec du téléchargement pour ${originalUrl}`);
          console.error(`Erreur lors du téléchargement de l'image: ${error.message}`);
          failureCount++;
        }
      }
    }
    
    console.log(`\n📊 Statistiques pour ${tableName}:`);
    console.log(`✅ ${successCount} assets migrés avec succès`);
    console.log(`❌ ${failureCount} échecs`);
  } catch (error) {
    console.log(`❌ Erreur lors de la migration: ${error.message}`);
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de la migration des assets vers Cloudflare R2');
  
  try {
    // Tables contenant des assets
    const tables = ['dramas', 'films', 'animes', 'bollywood'];
    
    for (const table of tables) {
      await migrateAssetsForTable(table);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de la migration: ${error.message}`);
    throw error;
  } finally {
    await pgPool.end();
  }
  
  console.log('\n🎉 Migration des assets terminée !');
}

// Exécution de la fonction principale
main().catch(error => {
  console.error(`❌ Erreur fatale: ${error}`);
  process.exit(1);
});
