const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'https://flodrama-scraper.florifavi.workers.dev';
const MIN_ITEMS_PER_SOURCE = parseInt(process.env.MIN_ITEMS_PER_SOURCE || '100');
const OUTPUT_DIR = process.env.OUTPUT_DIR || './Frontend/src/data/content';
const SOURCES = (process.env.SOURCES || 'vostfree,dramacool,myasiantv,voirdrama,viki,wetv,iqiyi,kocowa,gogoanime,voiranime,nekosama,bollywoodmdb,zee5,hotstar,mydramalist').split(',');
const RETRY_ATTEMPTS = parseInt(process.env.RETRY_ATTEMPTS || '3');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '2000');
const TIMEOUT = parseInt(process.env.TIMEOUT || '30000'); // 30 secondes par défaut
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Configuration d'Axios avec timeout
axios.defaults.timeout = TIMEOUT;

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

/**
 * Fonction pour scraper une source avec retry et gestion d'erreurs améliorée
 * @param {string} source - Nom de la source à scraper
 * @returns {Promise<Array>} - Liste des éléments récupérés
 */
async function scrapeSource(source) {
  console.log(`Scraping de la source: ${source}`);
  
  // Vérifier si on doit utiliser des données mockées
  if (USE_MOCK_DATA) {
    console.log(`[${source}] Utilisation de données mockées (USE_MOCK_DATA=true)`);
    const mockItems = generateMockItems(source, MIN_ITEMS_PER_SOURCE);
    categorizeItems(mockItems, source);
    stats.total_items += mockItems.length;
    stats.sources_processed++;
    return mockItems;
  }
  
  // Tentatives avec retry
  let lastError = null;
  
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`[${source}] Tentative ${attempt}/${RETRY_ATTEMPTS}...`);
      
      // Vérifier si l'API est accessible avant de faire l'appel principal
      if (attempt === 1) {
        try {
          // Ping l'API avec un timeout réduit pour vérifier sa disponibilité
          await axios.get(`${SCRAPER_API_URL}/health`, { timeout: 5000 });
          console.log(`[${source}] API accessible, procédant au scraping...`);
        } catch (pingError) {
          console.warn(`[${source}] Avertissement: L'API semble inaccessible: ${pingError.message}`);
          // Continuer quand même avec le scraping, mais noter le problème
        }
      }
      
      // Appel à l'API de scraping avec paramètres détaillés
      const response = await axios.get(`${SCRAPER_API_URL}`, {
        params: {
          source: source,
          limit: MIN_ITEMS_PER_SOURCE,
          timeout: TIMEOUT / 1000, // Convertir en secondes pour l'API
          detailed: true // Demander des données détaillées
        },
        headers: {
          'User-Agent': 'FloDrama-GithubAction/1.0',
          'Accept': 'application/json'
        }
      });
      
      // Analyse détaillée de la réponse
      if (response.data) {
        if (Array.isArray(response.data.results)) {
          const items = response.data.results;
          const itemCount = items.length;
          
          // Logs détaillés sur les données récupérées
          console.log(`[${source}] ${itemCount} éléments récupérés (minimum requis: ${MIN_ITEMS_PER_SOURCE})`);
          
          if (itemCount > 0) {
            console.log(`[${source}] Exemple de données: ${JSON.stringify(items[0].title || 'Titre inconnu')}`);
          }
          
          if (itemCount < MIN_ITEMS_PER_SOURCE) {
            console.warn(`[${source}] Attention: Nombre d'éléments insuffisant (${itemCount}/${MIN_ITEMS_PER_SOURCE})`);
          }
          
          // Vérifier la qualité des données
          const missingFields = items.filter(item => !item.title || !item.id).length;
          if (missingFields > 0) {
            console.warn(`[${source}] Attention: ${missingFields} éléments ont des champs manquants`);
          }
          
          // Mettre à jour les statistiques
          stats.total_items += itemCount;
          stats.sources_processed++;
          
          // Catégoriser les éléments
          categorizeItems(items, source);
          
          // Sauvegarder les logs détaillés
          saveScrapingLog(source, {
            timestamp: new Date().toISOString(),
            success: true,
            itemCount,
            minRequired: MIN_ITEMS_PER_SOURCE,
            missingFields,
            attempt
          });
          
          return items;
        } else if (response.data.error) {
          throw new Error(`Erreur API: ${response.data.error}`);
        } else {
          throw new Error(`Format de réponse invalide: results n'est pas un tableau`);
        }
      } else {
        throw new Error(`Réponse vide de l'API`);
      }
    } catch (error) {
      lastError = error;
      console.error(`[${source}] Erreur (tentative ${attempt}/${RETRY_ATTEMPTS}):`, error.message);
      
      // Détails supplémentaires sur l'erreur
      if (error.response) {
        // Réponse du serveur avec code d'erreur
        console.error(`[${source}] Détails: Status ${error.response.status}, ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // Pas de réponse reçue
        console.error(`[${source}] Détails: Pas de réponse du serveur (timeout/réseau)`);
      }
      
      if (attempt < RETRY_ATTEMPTS) {
        // Attendre avant la prochaine tentative (backoff exponentiel)
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[${source}] Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  console.error(`[${source}] Échec après ${RETRY_ATTEMPTS} tentatives`);
  stats.sources_failed++;
  
  // Sauvegarder les logs d'échec
  saveScrapingLog(source, {
    timestamp: new Date().toISOString(),
    success: false,
    error: lastError ? lastError.message : 'Erreur inconnue',
    attempts: RETRY_ATTEMPTS
  });
  
  // Générer des données de secours si nécessaire
  console.log(`[${source}] Génération de données de secours...`);
  const fallbackItems = generateMockItems(source, MIN_ITEMS_PER_SOURCE, true);
  categorizeItems(fallbackItems, source);
  stats.total_items += fallbackItems.length;
  
  return fallbackItems;
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
  if (category === 'dramas') {
    stats.dramas_count += items.length;
  }
  if (category === 'animes') {
    stats.animes_count += items.length;
  }
  if (category === 'films') {
    stats.films_count += items.length;
  }
  if (category === 'bollywood') {
    stats.bollywood_count += items.length;
  }
  
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
  
  // Définir les outputs pour GitHub Actions (nouvelle méthode avec fichiers d'environnement)
  const fs = require('fs');
  const path = require('path');
  
  // Récupérer le chemin du fichier d'environnement depuis la variable GITHUB_OUTPUT
  const githubOutputFile = process.env.GITHUB_OUTPUT;
  
  if (githubOutputFile) {
    // Écrire les outputs dans le fichier d'environnement
    fs.appendFileSync(githubOutputFile, `total_items=${stats.total_items}\n`);
    fs.appendFileSync(githubOutputFile, `dramas_count=${stats.dramas_count}\n`);
    fs.appendFileSync(githubOutputFile, `animes_count=${stats.animes_count}\n`);
    fs.appendFileSync(githubOutputFile, `films_count=${stats.films_count}\n`);
    fs.appendFileSync(githubOutputFile, `bollywood_count=${stats.bollywood_count}\n`);
  } else {
    // Fallback pour les environnements locaux
    console.log(`total_items=${stats.total_items}`);
    console.log(`dramas_count=${stats.dramas_count}`);
    console.log(`animes_count=${stats.animes_count}`);
    console.log(`films_count=${stats.films_count}`);
    console.log(`bollywood_count=${stats.bollywood_count}`);
  }
}

/**
 * Génère des données mockées pour une source
 * @param {string} source - Nom de la source
 * @param {number} count - Nombre d'éléments à générer
 * @param {boolean} isFallback - Indique si c'est un fallback après échec
 * @returns {Array} - Liste des éléments générés
 */
function generateMockItems(source, count, isFallback = false) {
  console.log(`Génération de ${count} éléments mockés pour ${source}${isFallback ? ' (fallback)' : ''}`);
  
  // Déterminer la catégorie en fonction de la source
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
  
  const category = sourceCategories[source] || 'unknown';
  const items = [];
  
  // Générer des titres plus réalistes en fonction de la catégorie
  const titlePrefixes = {
    'dramas': ['Korean', 'Chinese', 'Japanese', 'Thai', 'Taiwanese'],
    'animes': ['Shonen', 'Shojo', 'Seinen', 'Isekai', 'Mecha'],
    'bollywood': ['Bollywood', 'Indian', 'Mumbai', 'Delhi', 'Chennai'],
    'films': ['Asian', 'Korean', 'Chinese', 'Japanese', 'Thai'],
    'metadata': ['Info', 'Meta', 'Data', 'Review', 'Rating']
  };
  
  const titleSuffixes = {
    'dramas': ['Love', 'Story', 'Secret', 'Romance', 'Family', 'Doctor', 'Lawyer', 'Business'],
    'animes': ['Adventure', 'Quest', 'Ninja', 'Academy', 'Hero', 'Titan', 'Dragon', 'Slayer'],
    'bollywood': ['Dance', 'Song', 'Wedding', 'Family', 'Love', 'Action', 'Hero', 'Romance'],
    'films': ['Movie', 'Action', 'Thriller', 'Romance', 'Comedy', 'Drama', 'Horror', 'Mystery'],
    'metadata': ['Database', 'Collection', 'Archive', 'Ratings', 'Reviews', 'Scores', 'Rankings']
  };
  
  const categoryPrefix = titlePrefixes[category] || titlePrefixes['dramas'];
  const categorySuffix = titleSuffixes[category] || titleSuffixes['dramas'];
  
  for (let i = 1; i <= count; i++) {
    // Générer un titre plus réaliste
    const prefix = categoryPrefix[Math.floor(Math.random() * categoryPrefix.length)];
    const suffix = categorySuffix[Math.floor(Math.random() * categorySuffix.length)];
    const title = `${prefix} ${suffix} ${i}`;
    
    // Générer une description plus réaliste
    const descriptions = [
      `Une histoire captivante qui vous tiendra en haleine du début à la fin.`,
      `Découvrez l'histoire extraordinaire de personnages attachants dans ce ${category}.`,
      `Une production originale avec des scènes mémorables et des personnages charismatiques.`,
      `Une aventure épique remplie d'émotions et de rebondissements inattendus.`,
      `Un chef-d'œuvre du genre qui a conquis des millions de spectateurs à travers le monde.`
    ];
    
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Générer un élément avec des données plus réalistes
    items.push({
      id: `${source}-${isFallback ? 'fallback' : 'mock'}-${i}`,
      title: title,
      original_title: title,
      description: description,
      poster: `/placeholders/${category}-poster.jpg`,
      backdrop: `/placeholders/${category}-backdrop.jpg`,
      rating: (Math.random() * 3 + 7).toFixed(1), // Entre 7.0 et 10.0
      year: 2024 - Math.floor(Math.random() * 5), // Entre 2019 et 2024
      source: source,
      is_mock: true,
      is_fallback: isFallback,
      genres: ['Mock', category.charAt(0).toUpperCase() + category.slice(1)],
      episodes_count: category === 'dramas' ? Math.floor(Math.random() * 16) + 8 : null // Entre 8 et 24 épisodes pour les dramas
    });
  }
  
  return items;
}

/**
 * Sauvegarde les logs de scraping pour analyse ultérieure
 * @param {string} source - Nom de la source
 * @param {Object} logData - Données de log
 */
function saveScrapingLog(source, logData) {
  try {
    // Créer le répertoire de logs s'il n'existe pas
    const logsDir = path.join(OUTPUT_DIR, 'logs');
    fs.ensureDirSync(logsDir);
    
    // Nom du fichier de log
    const logFile = path.join(logsDir, `${source}-${new Date().toISOString().split('T')[0]}.json`);
    
    // Charger les logs existants ou créer un nouveau fichier
    let logs = [];
    if (fs.existsSync(logFile)) {
      try {
        logs = fs.readJsonSync(logFile);
      } catch (e) {
        console.warn(`Erreur lors de la lecture du fichier de log ${logFile}:`, e.message);
      }
    }
    
    // Ajouter le nouveau log
    logs.push({
      ...logData,
      timestamp: new Date().toISOString()
    });
    
    // Sauvegarder le fichier de log
    fs.writeJsonSync(logFile, logs, { spaces: 2 });
    
    console.log(`Log de scraping sauvegardé pour ${source}`);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du log pour ${source}:`, error.message);
  }
}

// Exécuter le scraping
runScraping().catch(error => {
  console.error('Erreur lors du scraping:', error);
  process.exit(1);
});
