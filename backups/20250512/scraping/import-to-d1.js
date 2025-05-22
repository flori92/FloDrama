/**
 * Script d'importation des données enrichies vers Cloudflare D1
 * 
 * Ce script prend les données enrichies et les importe dans la base de données
 * Cloudflare D1 pour être utilisées par l'API et le frontend.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ENRICHED_DATA_DIR = path.join(__dirname, '../../.github/scripts/enrichment/enriched');
const TEMP_SQL_DIR = path.join(__dirname, './temp_sql');
const D1_DATABASE_NAME = 'flodrama-content';

// Création du dossier temporaire pour les fichiers SQL
fs.ensureDirSync(TEMP_SQL_DIR);

/**
 * Fonction principale d'importation
 */
async function importToD1() {
  console.log('📦 Démarrage de l\'importation des données vers Cloudflare D1...');
  
  try {
    // Vérification que les données enrichies existent
    if (!fs.existsSync(ENRICHED_DATA_DIR)) {
      console.error(`❌ Le dossier des données enrichies n'existe pas: ${ENRICHED_DATA_DIR}`);
      process.exit(1);
    }
    
    // Récupération des fichiers de données enrichies
    const files = await fs.readdir(ENRICHED_DATA_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.warn('⚠️ Aucun fichier de données enrichies trouvé.');
      process.exit(0);
    }
    
    console.log(`📂 ${jsonFiles.length} fichiers trouvés pour l'importation.`);
    
    // Statistiques d'importation
    let stats = {
      totalFiles: jsonFiles.length,
      totalItems: 0,
      importedItems: 0,
      failedItems: 0
    };
    
    // Traitement de chaque fichier
    for (const file of jsonFiles) {
      console.log(`📄 Traitement du fichier: ${file}`);
      
      // Lecture du fichier
      const filePath = path.join(ENRICHED_DATA_DIR, file);
      const data = await fs.readJson(filePath);
      
      // Vérification de la structure des données
      if (!Array.isArray(data.items)) {
        console.warn(`⚠️ Structure invalide dans ${file}, passage au fichier suivant.`);
        continue;
      }
      
      // Extraction du type de contenu à partir du nom de fichier
      const contentType = file.replace('.json', '').toLowerCase();
      
      // Génération du fichier SQL pour ce type de contenu
      const sqlFilePath = path.join(TEMP_SQL_DIR, `${contentType}.sql`);
      const sqlStatements = [];
      
      // Ajout de la transaction SQL
      sqlStatements.push('BEGIN TRANSACTION;');
      
      // Suppression des données existantes pour ce type
      sqlStatements.push(`DELETE FROM content WHERE type = '${contentType}';`);
      
      // Préparation des insertions
      for (const item of data.items) {
        stats.totalItems++;
        
        try {
          // Préparation des données pour l'insertion
          const insertData = prepareItemForInsert(item, contentType);
          
          // Génération de la requête SQL
          const insertSql = generateInsertSql(insertData);
          sqlStatements.push(insertSql);
          
          stats.importedItems++;
        } catch (error) {
          console.error(`❌ Erreur lors de la préparation de l'élément pour l'insertion:`, error.message);
          stats.failedItems++;
        }
      }
      
      // Finalisation de la transaction
      sqlStatements.push('COMMIT;');
      
      // Écriture du fichier SQL
      await fs.writeFile(sqlFilePath, sqlStatements.join('\n'));
      
      console.log(`✅ Fichier SQL généré: ${sqlFilePath}`);
      
      // Exécution du fichier SQL avec wrangler
      try {
        console.log(`🔄 Exécution du fichier SQL pour ${contentType}...`);
        execSync(`wrangler d1 execute ${D1_DATABASE_NAME} --file=${sqlFilePath}`, { stdio: 'inherit' });
        console.log(`✅ Données ${contentType} importées avec succès dans D1.`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution du fichier SQL pour ${contentType}:`, error.message);
      }
    }
    
    // Génération des index et vues
    console.log('🔄 Génération des index et vues...');
    await generateIndexesAndViews();
    
    // Rapport final
    console.log('\n📊 Rapport d\'importation:');
    console.log(`- Fichiers traités: ${stats.totalFiles}`);
    console.log(`- Total d'éléments: ${stats.totalItems}`);
    console.log(`- Éléments importés: ${stats.importedItems}`);
    console.log(`- Échecs d'importation: ${stats.failedItems}`);
    
    console.log('\n✅ Importation terminée avec succès!');
    
    // Nettoyage des fichiers temporaires
    await fs.remove(TEMP_SQL_DIR);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation des données:', error);
    process.exit(1);
  }
}

/**
 * Prépare un élément pour l'insertion en base de données
 * @param {Object} item - L'élément à préparer
 * @param {string} contentType - Le type de contenu
 * @returns {Object} - L'élément préparé pour l'insertion
 */
function prepareItemForInsert(item, contentType) {
  // Création d'un objet avec les champs nécessaires pour la base de données
  const insertData = {
    id: item.id || generateUniqueId(),
    title: item.title || '',
    original_title: item.original_title || item.title || '',
    type: contentType,
    source: item.source || '',
    url: item.url || '',
    poster_url: item.poster_path || item.poster_url || '',
    backdrop_url: item.backdrop_path || item.backdrop_url || '',
    description: item.overview || item.description || '',
    year: item.year || (item.release_date ? parseInt(item.release_date.substring(0, 4)) : null),
    rating: item.vote_average || item.rating || 0,
    genres: Array.isArray(item.genres) ? JSON.stringify(item.genres) : '[]',
    streaming_urls: Array.isArray(item.streaming_urls) ? JSON.stringify(item.streaming_urls) : '[]',
    trailer: item.trailer ? JSON.stringify(item.trailer) : null,
    cast: Array.isArray(item.cast) ? JSON.stringify(item.cast) : '[]',
    tmdb_id: item.tmdb_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_enriched: item.is_enriched ? 1 : 0
  };
  
  return insertData;
}

/**
 * Génère une requête SQL INSERT pour un élément
 * @param {Object} item - L'élément préparé pour l'insertion
 * @returns {string} - La requête SQL INSERT
 */
function generateInsertSql(item) {
  const columns = Object.keys(item).join(', ');
  const values = Object.values(item).map(value => {
    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    return value;
  }).join(', ');
  
  return `INSERT INTO content (${columns}) VALUES (${values});`;
}

/**
 * Génère un identifiant unique
 * @returns {string} - Identifiant unique
 */
function generateUniqueId() {
  return `id_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Génère les index et vues dans la base de données
 */
async function generateIndexesAndViews() {
  const sqlFilePath = path.join(TEMP_SQL_DIR, 'indexes_and_views.sql');
  
  // Création des index et vues
  const sql = `
-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_year ON content(year);
CREATE INDEX IF NOT EXISTS idx_content_rating ON content(rating);
CREATE INDEX IF NOT EXISTS idx_content_tmdb_id ON content(tmdb_id);

-- Vue pour les contenus les plus populaires
CREATE VIEW IF NOT EXISTS popular_content AS
SELECT * FROM content
WHERE rating > 7.0
ORDER BY rating DESC, year DESC
LIMIT 100;

-- Vue pour les contenus récents
CREATE VIEW IF NOT EXISTS recent_content AS
SELECT * FROM content
WHERE year >= (SELECT strftime('%Y', 'now') - 2)
ORDER BY year DESC, rating DESC
LIMIT 100;

-- Vue pour les contenus par type
CREATE VIEW IF NOT EXISTS content_by_type AS
SELECT type, COUNT(*) as count
FROM content
GROUP BY type;
  `;
  
  // Écriture du fichier SQL
  await fs.writeFile(sqlFilePath, sql);
  
  // Exécution du fichier SQL avec wrangler
  try {
    execSync(`wrangler d1 execute ${D1_DATABASE_NAME} --file=${sqlFilePath}`, { stdio: 'inherit' });
    console.log('✅ Index et vues générés avec succès.');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des index et vues:', error.message);
  }
}

// Exécution du script
importToD1().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
