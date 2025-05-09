const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'https://flodrama-scraper.florifavi.workers.dev';
const MIN_ITEMS_PER_SOURCE = parseInt(process.env.MIN_ITEMS_PER_SOURCE || '100');
const OUTPUT_DIR = process.env.OUTPUT_DIR || './Frontend/src/data/content';
const SOURCES = (process.env.SOURCES || '').split(',');

// Statistiques
let stats = {
  total_items: 0,
  dramas_count: 0,
  animes_count: 0,
  films_count: 0,
  bollywood_count: 0,
  sources_processed: 0,
  sources_failed: 0
};

// Créer le répertoire de sortie s'il n'existe pas
fs.ensureDirSync(OUTPUT_DIR);

// Fonction pour scraper une source
async function scrapeSource(source) {
  console.log(`Scraping de la source: ${source}`);
  
  try {
    // Appel à l'API de scraping
    const response = await axios.get(`${SCRAPER_API_URL}?source=${source}&limit=${MIN_ITEMS_PER_SOURCE}`);
    
    if (response.data && Array.isArray(response.data.results)) {
      const items = response.data.results;
      console.log(`${items.length} éléments récupérés depuis ${source}`);
      
      // Mettre à jour les statistiques
      stats.total_items += items.length;
      stats.sources_processed++;
      
      // Catégoriser les éléments
      categorizeItems(items, source);
      
      return items;
    } else {
      throw new Error(`Format de réponse invalide pour ${source}`);
    }
  } catch (error) {
    console.error(`Erreur lors du scraping de ${source}:`, error.message);
    stats.sources_failed++;
    return [];
  }
}

// Fonction pour catégoriser les éléments
function categorizeItems(items, source) {
  // Mapper les sources aux catégories
  const sourceCategories = {
    'vostfree': 'dramas',
    'dramacool': 'dramas',
    'myasiantv': 'dramas',
    'voirdrama': 'dramas',
    'viki': 'dramas',
    'wetv': 'dramas',
    'iqiyi': 'dramas',
    'kocowa': 'dramas',
    'gogoanime': 'animes',
    'voiranime': 'animes',
    'nekosama': 'animes',
    'bollywoodmdb': 'bollywood',
    'zee5': 'bollywood',
    'hotstar': 'bollywood',
    'mydramalist': 'metadata'
  };
  
  // Déterminer la catégorie en fonction de la source
  const category = sourceCategories[source] || 'unknown';
  
  // Mettre à jour les compteurs par catégorie
  if (category === 'dramas') stats.dramas_count += items.length;
  if (category === 'animes') stats.animes_count += items.length;
  if (category === 'films') stats.films_count += items.length;
  if (category === 'bollywood') stats.bollywood_count += items.length;
  
  // Sauvegarder les éléments dans le fichier correspondant à la source
  const outputFile = path.join(OUTPUT_DIR, `${source}.json`);
  fs.writeJsonSync(outputFile, { results: items }, { spaces: 2 });
  console.log(`Données sauvegardées dans ${outputFile}`);
}

// Fonction principale pour exécuter le scraping sur toutes les sources
async function runScraping() {
  console.log(`Début du scraping pour ${SOURCES.length} sources...`);
  
  // Scraper chaque source en parallèle avec une limite de concurrence
  const concurrencyLimit = 3; // Limiter à 3 sources simultanées pour éviter les problèmes
  
  for (let i = 0; i < SOURCES.length; i += concurrencyLimit) {
    const batch = SOURCES.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map(scrapeSource));
  }
  
  // Sauvegarder les statistiques
  console.log('Scraping terminé. Statistiques:');
  console.log(stats);
  
  // Définir les outputs pour GitHub Actions
  console.log(`::set-output name=total_items::${stats.total_items}`);
  console.log(`::set-output name=dramas_count::${stats.dramas_count}`);
  console.log(`::set-output name=animes_count::${stats.animes_count}`);
  console.log(`::set-output name=films_count::${stats.films_count}`);
  console.log(`::set-output name=bollywood_count::${stats.bollywood_count}`);
}

// Exécuter le scraping
runScraping().catch(error => {
  console.error('Erreur lors du scraping:', error);
  process.exit(1);
});
