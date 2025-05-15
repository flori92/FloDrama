/**
 * Scraper avancé pour FloDrama
 * 
 * Ce script utilise des techniques avancées pour contourner les protections anti-scraping
 * et récupérer des milliers de contenus pour l'application FloDrama
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const { fetchHtml } = require('./utils');
const { selectExtractor } = require('./extractors');
const { ALL_SOURCES, BACKUP_SOURCES } = require('./sources');

// Configuration
const CONFIG = {
  OUTPUT_DIR: './Frontend/src/data/content',
  SEARCH_DIR: './Frontend/src/data/search',
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  PARALLEL_SCRAPING: false,
  MAX_CONCURRENT_SOURCES: 2,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000
};

// Statistiques
const stats = {
  total_items: 0,
  sources_processed: 0,
  sources_failed: 0,
  categories: {},
  start_time: new Date()
};

/**
 * Fonction principale
 */
async function main() {
  console.log('='.repeat(80));
  console.log(`FloDrama - Scraper Avancé`);
  console.log('='.repeat(80));
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  await fs.ensureDir(CONFIG.SEARCH_DIR);
  
  for (const category of CONFIG.CATEGORIES) {
    await fs.ensureDir(path.join(CONFIG.OUTPUT_DIR, category));
  }
  
  console.log(`\n🔍 Démarrage du scraping pour ${ALL_SOURCES.length} sources...`);
  
  // Scraper chaque source
  if (CONFIG.PARALLEL_SCRAPING) {
    // Scraping parallèle (limité)
    const chunks = chunkArray(ALL_SOURCES, CONFIG.MAX_CONCURRENT_SOURCES);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(source => scrapeSource(source)));
    }
  } else {
    // Scraping séquentiel
    for (const source of ALL_SOURCES) {
      await scrapeSource(source);
    }
  }
  
  // Générer les fichiers par catégorie
  await generateCategoryFiles();
  
  // Générer l'index de recherche
  await generateSearchIndex();
  
  // Calculer la durée totale
  stats.end_time = new Date();
  stats.duration_ms = stats.end_time - stats.start_time;
  stats.duration_formatted = formatDuration(stats.duration_ms);
  
  // Afficher les statistiques
  console.log('\n📊 Statistiques du scraping:');
  console.log(`⏱️ Durée totale: ${stats.duration_formatted}`);
  console.log(`📦 Total d'éléments: ${stats.total_items}`);
  console.log(`✅ Sources traitées: ${stats.sources_processed}/${ALL_SOURCES.length}`);
  console.log(`❌ Sources en échec: ${stats.sources_failed}`);
  
  // Afficher les statistiques par catégorie
  console.log('\n📂 Statistiques par catégorie:');
  for (const [category, count] of Object.entries(stats.categories)) {
    console.log(`- ${category}: ${count} éléments`);
  }
  
  console.log('\n✨ Scraping terminé avec succès!');
}

/**
 * Scrape une source spécifique
 * @param {Object} source - Configuration de la source
 * @returns {Promise<boolean>} - Succès ou échec
 */
async function scrapeSource(source) {
  console.log(`\n🔍 Scraping de ${source.name}...`);
  
  const allItems = [];
  let success = false;
  
  // Parcourir toutes les URLs de la source
  for (const url of source.urls) {
    try {
      console.log(`[${source.name}] Scraping de ${url}`);
      
      // Récupérer le HTML
      const html = await fetchHtml(url, {
        usePlaywright: source.usePlaywright,
        waitForSelector: source.waitForSelector,
        blockResources: true
      });
      
      if (!html) {
        console.error(`[${source.name}] Impossible de récupérer le HTML de ${url}`);
        continue;
      }
      
      // Extraire les données
      const items = selectExtractor(source.name, html, { url });
      
      console.log(`[${source.name}] ${items.length} éléments récupérés depuis ${url}`);
      
      if (items.length > 0) {
        allItems.push(...items);
        success = true;
      }
    } catch (error) {
      console.error(`[${source.name}] Erreur lors du scraping de ${url}: ${error.message}`);
    }
  }
  
  // Vérifier si nous avons assez d'éléments
  if (allItems.length < source.minItems && BACKUP_SOURCES.some(s => s.name.includes(source.name))) {
    console.log(`[${source.name}] Pas assez d'éléments (${allItems.length}/${source.minItems}), essai des sources de secours...`);
    
    // Essayer les sources de secours
    const backupSource = BACKUP_SOURCES.find(s => s.name.includes(source.name));
    
    if (backupSource) {
      for (const url of backupSource.urls) {
        try {
          console.log(`[${source.name}] Scraping de la source de secours ${url}`);
          
          // Récupérer le HTML
          const html = await fetchHtml(url, {
            usePlaywright: backupSource.usePlaywright,
            waitForSelector: backupSource.waitForSelector,
            blockResources: true
          });
          
          if (!html) {
            console.error(`[${source.name}] Impossible de récupérer le HTML de ${url}`);
            continue;
          }
          
          // Extraire les données
          const items = selectExtractor(source.name, html, { url });
          
          console.log(`[${source.name}] ${items.length} éléments récupérés depuis la source de secours ${url}`);
          
          if (items.length > 0) {
            allItems.push(...items);
            success = true;
          }
        } catch (error) {
          console.error(`[${source.name}] Erreur lors du scraping de la source de secours ${url}: ${error.message}`);
        }
      }
    }
  }
  
  // Dédupliquer les éléments par ID
  const uniqueItems = [];
  const seenIds = new Set();
  
  for (const item of allItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }
  
  console.log(`[${source.name}] ${uniqueItems.length} éléments uniques après déduplication`);
  
  // Sauvegarder les données
  if (uniqueItems.length > 0) {
    await saveData(source.name, uniqueItems);
    
    // Mettre à jour les statistiques
    stats.total_items += uniqueItems.length;
    stats.sources_processed++;
    
    // Mettre à jour les statistiques par catégorie
    const category = source.type || 'unknown';
    stats.categories[category] = (stats.categories[category] || 0) + uniqueItems.length;
    
    return true;
  } else {
    console.error(`[${source.name}] Échec: aucun élément récupéré`);
    stats.sources_failed++;
    return false;
  }
}

/**
 * Sauvegarde les données dans un fichier JSON
 * @param {string} sourceName - Nom de la source
 * @param {Array} items - Éléments à sauvegarder
 */
async function saveData(sourceName, items) {
  try {
    const outputFile = path.join(CONFIG.OUTPUT_DIR, `${sourceName}.json`);
    await fs.writeJson(outputFile, items, { spaces: 2 });
    console.log(`[${sourceName}] Données sauvegardées dans ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de la sauvegarde des données: ${error.message}`);
    return false;
  }
}

/**
 * Génère des fichiers par catégorie
 */
async function generateCategoryFiles() {
  console.log('\n📂 Génération des fichiers par catégorie...');
  
  // Récupérer tous les fichiers JSON sources
  const sourceFiles = await fs.readdir(CONFIG.OUTPUT_DIR);
  const jsonFiles = sourceFiles.filter(file => 
    file.endsWith('.json') && 
    !file.includes('index') && 
    !file.startsWith('.')
  );
  
  // Collecter tous les éléments par catégorie
  const categorizedItems = {};
  CONFIG.CATEGORIES.forEach(category => {
    categorizedItems[category] = [];
  });
  
  // Parcourir tous les fichiers sources
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(CONFIG.OUTPUT_DIR, file);
      const data = await fs.readJson(filePath);
      
      // Vérifier si les données sont un tableau ou un objet avec une propriété results
      const items = Array.isArray(data) ? data : (data.results || []);
      
      if (items.length === 0) {
        console.warn(`⚠️ Aucun élément trouvé dans ${file}`);
        continue;
      }
      
      // Catégoriser les éléments
      items.forEach(item => {
        // Déterminer la catégorie de l'élément
        let category = item.type || 'unknown';
        
        // Mapper les types spécifiques aux catégories générales
        if (['kdrama', 'cdrama', 'jdrama', 'drama', 'series'].includes(category)) {
          category = 'drama';
        } else if (['anime', 'animation'].includes(category)) {
          category = 'anime';
        } else if (['film', 'movie', 'movies'].includes(category)) {
          category = 'film';
        } else if (['bollywood', 'indian'].includes(category)) {
          category = 'bollywood';
        }
        
        // Ajouter l'élément à sa catégorie si elle est supportée
        if (CONFIG.CATEGORIES.includes(category)) {
          categorizedItems[category].push(item);
        }
      });
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${file}: ${error.message}`);
    }
  }
  
  // Générer les fichiers par catégorie
  for (const category of CONFIG.CATEGORIES) {
    const items = categorizedItems[category];
    
    if (items.length === 0) {
      console.warn(`⚠️ Aucun élément pour la catégorie ${category}`);
      continue;
    }
    
    console.log(`📦 Génération des fichiers pour ${category}: ${items.length} éléments`);
    
    // Trier les éléments par année (décroissant) puis par note (décroissant)
    items.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.rating - a.rating;
    });
    
    // Générer le fichier index.json
    const categoryDir = path.join(CONFIG.OUTPUT_DIR, category);
    await fs.ensureDir(categoryDir);
    
    const indexFile = path.join(categoryDir, 'index.json');
    await fs.writeJson(indexFile, {
      count: items.length,
      results: items,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier index généré: ${indexFile} (${items.length} éléments)`);
    
    // Générer le fichier trending.json
    const trendingItems = [...items]
      .sort((a, b) => {
        const currentYear = new Date().getFullYear();
        const aIsRecent = a.year >= currentYear - 2;
        const bIsRecent = b.year >= currentYear - 2;
        
        if (aIsRecent !== bIsRecent) return aIsRecent ? -1 : 1;
        return b.rating - a.rating;
      })
      .slice(0, 20);
    
    const trendingFile = path.join(categoryDir, 'trending.json');
    await fs.writeJson(trendingFile, {
      count: trendingItems.length,
      results: trendingItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier trending généré: ${trendingFile} (${trendingItems.length} éléments)`);
    
    // Générer le fichier hero_banner.json
    const heroBannerItems = [...items]
      .filter(item => item.backdrop && item.poster)
      .sort((a, b) => {
        const currentYear = new Date().getFullYear();
        const aIsVeryRecent = a.year >= currentYear;
        const bIsVeryRecent = b.year >= currentYear;
        
        if (aIsVeryRecent !== bIsVeryRecent) return aIsVeryRecent ? -1 : 1;
        return b.rating - a.rating;
      })
      .slice(0, 5);
    
    const heroBannerFile = path.join(categoryDir, 'hero_banner.json');
    await fs.writeJson(heroBannerFile, {
      count: heroBannerItems.length,
      results: heroBannerItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier hero_banner généré: ${heroBannerFile} (${heroBannerItems.length} éléments)`);
  }
  
  // Générer un fichier global pour toutes les catégories
  const globalFile = path.join(CONFIG.OUTPUT_DIR, 'global.json');
  await fs.writeJson(globalFile, {
    total_items: Object.values(categorizedItems).reduce((total, items) => total + items.length, 0),
    categories: Object.fromEntries(
      Object.entries(categorizedItems).map(([category, items]) => [category, items.length])
    ),
    updated_at: new Date().toISOString()
  }, { spaces: 2 });
  
  console.log(`✅ Fichier global généré: ${globalFile}`);
}

/**
 * Génère un index de recherche
 */
async function generateSearchIndex() {
  console.log('\n🔍 Génération de l\'index de recherche...');
  
  // Récupérer tous les éléments par catégorie
  const allItems = [];
  
  for (const category of CONFIG.CATEGORIES) {
    try {
      const indexFile = path.join(CONFIG.OUTPUT_DIR, category, 'index.json');
      
      if (await fs.pathExists(indexFile)) {
        const data = await fs.readJson(indexFile);
        const items = data.results || [];
        
        // Ajouter la catégorie à chaque élément
        items.forEach(item => {
          item.category = category;
        });
        
        allItems.push(...items);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la lecture de ${category}/index.json: ${error.message}`);
    }
  }
  
  console.log(`📦 Génération de l'index de recherche pour ${allItems.length} éléments`);
  
  // Créer un index de recherche simplifié
  const searchIndex = allItems.map(item => ({
    id: item.id,
    title: item.title,
    original_title: item.original_title,
    year: item.year,
    type: item.type,
    category: item.category,
    language: item.language,
    source: item.source,
    poster: item.poster
  }));
  
  // Sauvegarder l'index de recherche
  const searchIndexFile = path.join(CONFIG.SEARCH_DIR, 'index.json');
  await fs.ensureDir(CONFIG.SEARCH_DIR);
  await fs.writeJson(searchIndexFile, {
    count: searchIndex.length,
    results: searchIndex,
    updated_at: new Date().toISOString()
  }, { spaces: 2 });
  
  console.log(`✅ Index de recherche généré: ${searchIndexFile} (${searchIndex.length} éléments)`);
  
  // Générer des index par catégorie
  for (const category of CONFIG.CATEGORIES) {
    const categoryItems = searchIndex.filter(item => item.category === category);
    
    if (categoryItems.length === 0) {
      console.warn(`⚠️ Aucun élément pour l'index de recherche de la catégorie ${category}`);
      continue;
    }
    
    const categorySearchFile = path.join(CONFIG.SEARCH_DIR, `${category}.json`);
    await fs.writeJson(categorySearchFile, {
      count: categoryItems.length,
      results: categoryItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Index de recherche pour ${category} généré: ${categorySearchFile} (${categoryItems.length} éléments)`);
  }
}

/**
 * Divise un tableau en chunks
 * @param {Array} array - Tableau à diviser
 * @param {number} chunkSize - Taille des chunks
 * @returns {Array} - Tableau de chunks
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Formate une durée en millisecondes en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Durée formatée
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Exécuter la fonction principale
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
