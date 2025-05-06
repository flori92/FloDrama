/**
 * Script de migration des données mockées vers Cloudflare D1
 * 
 * Ce script prend les données mockées du fichier index.js et les insère dans la base de données D1.
 * Pour l'exécuter : npx wrangler d1 execute flodrama-db --file=./scripts/migrate-to-d1.js
 */

// Importation des données mockées
const { mockData } = require('../src/mock-data');

// Fonction principale de migration
async function migrateMockDataToD1(db) {
  console.log('Début de la migration des données mockées vers D1...');
  
  try {
    // Migration des dramas
    await migrateCategory(db, 'dramas', mockData.drama);
    
    // Migration des films
    await migrateCategory(db, 'films', mockData.film);
    
    // Migration des animes
    await migrateCategory(db, 'animes', mockData.anime);
    
    // Migration des bollywood
    await migrateCategory(db, 'bollywood', mockData.bollywood);
    
    console.log('Migration terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la migration :', error);
  }
}

// Fonction pour migrer une catégorie de contenu
async function migrateCategory(db, tableName, items) {
  console.log(`Migration de ${items.length} éléments vers la table ${tableName}...`);
  
  // Vérifier si la table existe
  const tableExists = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`).first();
  
  if (!tableExists) {
    console.error(`La table ${tableName} n'existe pas !`);
    return;
  }
  
  // Pour chaque élément, insérer dans la base de données
  for (const item of items) {
    try {
      // Préparer les données pour l'insertion
      const data = prepareDataForInsertion(tableName, item);
      
      // Construire la requête SQL d'insertion
      const { sql, params } = buildInsertQuery(tableName, data);
      
      // Exécuter la requête
      await db.prepare(sql).bind(...params).run();
      
      console.log(`Élément ${item.id} inséré avec succès dans ${tableName}`);
    } catch (error) {
      console.error(`Erreur lors de l'insertion de l'élément ${item.id} dans ${tableName} :`, error);
    }
  }
}

// Fonction pour préparer les données pour l'insertion
function prepareDataForInsertion(tableName, item) {
  // Copier l'objet pour ne pas modifier l'original
  const data = { ...item };
  
  // Convertir les tableaux en JSON
  if (data.genres && Array.isArray(data.genres)) {
    data.genres = JSON.stringify(data.genres);
  }
  
  // Adapter les noms de champs selon la table
  if (tableName === 'dramas' || tableName === 'animes') {
    // Renommer episodeCount en episode_count
    if (data.episodeCount !== undefined) {
      data.episode_count = data.episodeCount;
      delete data.episodeCount;
    }
    
    // Renommer seasonCount en season_count
    if (data.seasonCount !== undefined) {
      data.season_count = data.seasonCount;
      delete data.seasonCount;
    }
  }
  
  return data;
}

// Fonction pour construire la requête SQL d'insertion
function buildInsertQuery(tableName, data) {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(data);
  
  const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
  
  return { sql, params: values };
}

// Exporter la fonction pour l'utiliser avec Wrangler
module.exports = migrateMockDataToD1;

// Si le script est exécuté directement
if (require.main === module) {
  console.log('Ce script doit être exécuté via wrangler d1 execute');
}
