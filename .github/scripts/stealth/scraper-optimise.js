/**
 * Scraper optimisé pour FloDrama
 * 
 * Ce script utilise une approche plus ciblée et des techniques avancées
 * pour contourner les protections anti-scraping les plus strictes
 * avec playwright et des techniques de furtivité
 */

const fs = require('fs-extra');
const path = require('path');
const { chromium } = require('playwright');
const cheerio = require('cheerio');
const { randomDelay, getRandomUserAgent } = require('./utils');
const { extractData } = require('./extractors');

// Configuration
const CONFIG = {
  OUTPUT_DIR: './Frontend/src/data/content',
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  STEALTH_MODE: true,
  BROWSER_ARGS: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-sandbox',
    '--disable-web-security'
  ],
  // Sources prioritaires avec des URLs alternatives et pagination
  SOURCES: [
    // Dramas
    {
      name: 'dramacool',
      urls: [
        'https://dramacool.com.pa/most-popular-drama',
        'https://dramacool.sr/most-popular-drama',
        'https://dramacool.bid/most-popular-drama',
        'https://dramacool.com.pa/drama-list',
        'https://dramacool.sr/drama-list',
        'https://dramacool.bid/drama-list',
        'https://dramacool.com.pa/recently-added',
        'https://dramacool.sr/recently-added',
        'https://dramacool.bid/recently-added'
      ],
      paginationPattern: 'page/{page}/',  // Format de pagination
      paginationMax: 5,                  // Nombre maximum de pages à scraper
      type: 'drama',
      selector: '.block',
      waitForSelector: '.block',
      minItems: 200,
      retryCount: 3                      // Nombre de tentatives en cas d'échec
    },
    {
      name: 'mydramalist',
      urls: [
        'https://mydramalist.com/shows/top',
        'https://mydramalist.com/shows/top_korean_dramas',
        'https://mydramalist.com/shows/top_chinese_dramas',
        'https://mydramalist.com/shows/top_japanese_dramas',
        'https://mydramalist.com/shows/top_taiwanese_dramas',
        'https://mydramalist.com/shows/popular',
        'https://mydramalist.com/shows/ongoing'
      ],
      paginationPattern: '?page={page}',  // Format de pagination
      paginationMax: 5,                  // Nombre maximum de pages à scraper
      type: 'drama',
      selector: '.box-body.light-b',
      waitForSelector: '.box-body',
      minItems: 200,
      retryCount: 3
    },
    // Animes
    {
      name: 'myanimelist',
      urls: [
        'https://myanimelist.net/topanime.php',
        'https://myanimelist.net/topanime.php?type=airing',
        'https://myanimelist.net/topanime.php?type=upcoming',
        'https://myanimelist.net/topanime.php?type=tv',
        'https://myanimelist.net/topanime.php?type=movie',
        'https://myanimelist.net/topanime.php?type=ova',
        'https://myanimelist.net/topanime.php?type=special'
      ],
      paginationPattern: '?limit=50&offset={offset}',  // Format de pagination basé sur offset
      paginationOffsetMultiplier: 50,                // Valeur d'incrémentation de l'offset
      paginationMax: 4,                              // Nombre maximum de pages à scraper
      type: 'anime',
      selector: '.ranking-list',
      waitForSelector: '.ranking-list',
      minItems: 200,
      retryCount: 3
    },
    // Films
    {
      name: 'imdb',
      urls: [
        'https://www.imdb.com/chart/top/',
        'https://www.imdb.com/chart/moviemeter/',
        'https://www.imdb.com/chart/boxoffice',
        'https://www.imdb.com/movies-coming-soon/',
        'https://www.imdb.com/movies-in-theaters/'
      ],
      type: 'film',
      selector: '.ipc-metadata-list-summary-item',
      waitForSelector: '.ipc-metadata-list-summary-item',
      minItems: 200,
      retryCount: 3
    },
    // Bollywood
    {
      name: 'bollywood',
      urls: [
        'https://www.bollywoodhungama.com/movies/',
        'https://www.bollywoodlife.com/bollywood-movies/',
        'https://www.bollywoodhungama.com/movies/top-100-movies/',
        'https://www.bollywoodhungama.com/movies/bollywood-movies/',
        'https://www.bollywoodlife.com/box-office/'
      ],
      paginationPattern: 'page/{page}/',  // Format de pagination
      paginationMax: 5,                  // Nombre maximum de pages à scraper
      type: 'bollywood',
      selector: '.movie-box, .article-box',
      waitForSelector: '.movie-box, .article-box',
      minItems: 200,
      retryCount: 3
    }
  ]
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
  console.log(`FloDrama - Scraper Optimisé`);
  console.log('='.repeat(80));
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  for (const category of CONFIG.CATEGORIES) {
    await fs.ensureDir(path.join(CONFIG.OUTPUT_DIR, category));
  }
  
  console.log(`\n🔎 Démarrage du scraping pour ${CONFIG.SOURCES.length} sources prioritaires...`);
  
  // Lancer un navigateur unique pour toutes les sources avec stealth
  const browser = await chromium.launch({
    headless: false, // Mode visible pour éviter la détection
    args: CONFIG.BROWSER_ARGS
  });
  
  try {
    // Traiter chaque source séquentiellement
    for (const source of CONFIG.SOURCES) {
      await scrapeSource(browser, source);
    }
    
    // Générer les fichiers par catégorie
    await generateCategoryFiles();
    
  } finally {
    // Fermer le navigateur
    await browser.close();
  }
  
  // Calculer la durée totale
  stats.end_time = new Date();
  stats.duration_ms = stats.end_time - stats.start_time;
  stats.duration_formatted = formatDuration(stats.duration_ms);
  
  // Afficher les statistiques
  console.log('\n='.repeat(80));
  console.log('📊 Statistiques du scraping:');
  console.log(`⏱️  Durée totale: ${stats.duration_formatted}`);
  console.log(`📦 Total d'éléments: ${stats.total_items}`);
  console.log(`✅ Sources traitées avec succès: ${stats.sources_processed}/${CONFIG.SOURCES.length}`);
  console.log(`❌ Sources en échec: ${stats.sources_failed}`);
  console.log('\nRépartition par catégorie:');
  
  for (const category of CONFIG.CATEGORIES) {
    const count = stats.categories[category] || 0;
    console.log(`- ${category}: ${count} éléments`);
  }
  
  console.log('='.repeat(80));
}

/**
 * Fait défiler automatiquement une page lentement pour simuler un comportement humain
 * @param {Page} page - Instance de la page Playwright
 */
async function autoScrollSlow(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 50; // Scroll plus petit
      const timer = setInterval(() => {
        // Ajouter des variations aléatoires dans le défilement
        const scrollDistance = distance + Math.floor(Math.random() * 30) - 15;
        const { scrollHeight } = document.body;
        window.scrollBy(0, scrollDistance);
        totalHeight += scrollDistance;
        
        // Parfois, faire une pause plus longue pour simuler la lecture
        if (Math.random() < 0.1) {
          clearInterval(timer);
          setTimeout(() => {
            // Reprendre le défilement après une pause
            if (totalHeight < scrollHeight) {
              const resumeTimer = setInterval(() => {
                const resumeDistance = distance + Math.floor(Math.random() * 30) - 15;
                window.scrollBy(0, resumeDistance);
                totalHeight += resumeDistance;
                
                if (totalHeight >= scrollHeight) {
                  clearInterval(resumeTimer);
                  resolve();
                }
              }, 200 + Math.floor(Math.random() * 100));
            } else {
              resolve();
            }
          }, 1000 + Math.floor(Math.random() * 2000));
        } else if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200 + Math.floor(Math.random() * 100)); // Vitesse variable
    });
  });
}

/**
 * Sauvegarde les données dans un fichier JSON
 * @param {string} sourceName - Nom de la source
 * @param {Array} items - Éléments à sauvegarder
 */
async function saveData(sourceName, items) {
  try {
    // Normaliser les champs pour correspondre aux attentes du frontend
    const normalizedItems = items.map(item => normalizeItem(item, sourceName));
    
    const outputFile = path.join(CONFIG.OUTPUT_DIR, `${sourceName}.json`);
    await fs.writeJson(outputFile, normalizedItems, { spaces: 2 });
    console.log(`[${sourceName}] Données sauvegardées dans ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de la sauvegarde des données: ${error.message}`);
    return false;
  }
}

/**
 * Normalise un élément pour qu'il corresponde aux attentes du frontend
 * @param {Object} item - Élément à normaliser
 * @param {string} sourceName - Nom de la source
 * @returns {Object} - Élément normalisé
 */
function normalizeItem(item, sourceName) {
  // Créer une copie pour ne pas modifier l'original
  const normalizedItem = { ...item };
  
  // S'assurer que tous les champs requis sont présents
  
  // 1. Identifiant unique
  if (!normalizedItem.id) {
    normalizedItem.id = `${sourceName}_${normalizedItem.title ? normalizedItem.title.toLowerCase().replace(/[^a-z0-9]/g, '') : ''}_${normalizedItem.year || 'unknown'}`;
  }
  
  // 2. Titre
  if (!normalizedItem.title && normalizedItem.name) {
    normalizedItem.title = normalizedItem.name;
  }
  
  // 3. Images (poster et backdrop)
  // Normaliser les chemins d'images
  if (normalizedItem.poster_path && !normalizedItem.poster) {
    normalizedItem.poster = normalizedItem.poster_path.startsWith('http') 
      ? normalizedItem.poster_path 
      : `https://image.tmdb.org/t/p/w500${normalizedItem.poster_path}`;
  }
  
  if (normalizedItem.backdrop_path && !normalizedItem.backdrop) {
    normalizedItem.backdrop = normalizedItem.backdrop_path.startsWith('http') 
      ? normalizedItem.backdrop_path 
      : `https://image.tmdb.org/t/p/original${normalizedItem.backdrop_path}`;
  }
  
  // 4. Année
  if (!normalizedItem.year) {
    if (normalizedItem.release_date) {
      normalizedItem.year = parseInt(normalizedItem.release_date.split('-')[0], 10);
    } else if (normalizedItem.first_air_date) {
      normalizedItem.year = parseInt(normalizedItem.first_air_date.split('-')[0], 10);
    }
  }
  
  // 5. Évaluation (rating)
  if (!normalizedItem.rating && normalizedItem.vote_average) {
    normalizedItem.rating = normalizedItem.vote_average / 2; // Convertir sur 5 étoiles
  }
  
  // Si aucune évaluation n'est disponible, définir une valeur par défaut
  if (!normalizedItem.rating) {
    normalizedItem.rating = 3.5; // Valeur par défaut sur 5
  }
  
  // 6. Type (pour la catégorisation)
  if (!normalizedItem.type) {
    // Déterminer le type en fonction de la source
    if (sourceName.includes('drama') || sourceName.includes('mydramalist')) {
      normalizedItem.type = 'drama';
    } else if (sourceName.includes('anime') || sourceName.includes('myanimelist')) {
      normalizedItem.type = 'anime';
    } else if (sourceName.includes('film') || sourceName.includes('movie') || sourceName.includes('imdb')) {
      normalizedItem.type = 'film';
    } else if (sourceName.includes('bollywood')) {
      normalizedItem.type = 'bollywood';
    }
  }
  
  // 7. Langue originale
  if (!normalizedItem.original_language) {
    // Attribuer une langue par défaut en fonction du type
    if (normalizedItem.type === 'drama') {
      normalizedItem.original_language = 'ko'; // Coréen par défaut pour les dramas
    } else if (normalizedItem.type === 'anime') {
      normalizedItem.original_language = 'ja'; // Japonais par défaut pour les animes
    } else if (normalizedItem.type === 'bollywood') {
      normalizedItem.original_language = 'hi'; // Hindi par défaut pour Bollywood
    } else {
      normalizedItem.original_language = 'en'; // Anglais par défaut pour les autres
    }
  }
  
  // 8. Genre IDs
  if (!normalizedItem.genre_ids && normalizedItem.genres) {
    normalizedItem.genre_ids = normalizedItem.genres.map(genre => 
      typeof genre === 'object' ? genre.id : parseInt(genre, 10)
    );
  }
  
  // Si aucun genre n'est disponible, définir des genres par défaut en fonction du type
  if (!normalizedItem.genre_ids || normalizedItem.genre_ids.length === 0) {
    if (normalizedItem.type === 'drama') {
      normalizedItem.genre_ids = [18, 10759]; // Drame, Action & Aventure
    } else if (normalizedItem.type === 'anime') {
      normalizedItem.genre_ids = [16, 10759]; // Animation, Action & Aventure
    } else if (normalizedItem.type === 'bollywood') {
      normalizedItem.genre_ids = [18, 10749]; // Drame, Romance
    } else {
      normalizedItem.genre_ids = [28, 18]; // Action, Drame
    }
  }
  
  // 9. URL de streaming (nouvelle fonctionnalité)
  if (!normalizedItem.streaming_url && normalizedItem.url) {
    normalizedItem.streaming_url = normalizedItem.url;
  }
  
  // Si aucune URL de streaming n'est disponible, créer une URL fictive pour le moment
  if (!normalizedItem.streaming_url) {
    normalizedItem.streaming_url = `https://flodrama.com/watch/${normalizedItem.type}/${normalizedItem.id}`;
  }
  
  // 10. URL de bande-annonce
  // Si l'URL de bande-annonce n'est pas disponible, nous la laisserons vide pour l'instant
  // Le frontend tentera de la récupérer via l'API TMDB si nécessaire
  
  return normalizedItem;
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
          // Vérifier et compléter les champs manquants pour le frontend
          const normalizedItem = ensureRequiredFields(item, category);
          categorizedItems[category].push(normalizedItem);
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
      if (b.year !== a.year) {
        return b.year - a.year;
      }
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
        
        if (aIsRecent !== bIsRecent) {
          return aIsRecent ? -1 : 1;
        }
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
        
        if (aIsVeryRecent !== bIsVeryRecent) {
          return aIsVeryRecent ? -1 : 1;
        }
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
    
    // Générer le fichier featured.json pour les éléments mis en avant
    const featuredItems = [...items]
      .filter(item => item.backdrop && item.poster && item.overview && item.rating >= 4)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
    
    const featuredFile = path.join(categoryDir, 'featured.json');
    await fs.writeJson(featuredFile, {
      count: featuredItems.length,
      results: featuredItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier featured généré: ${featuredFile} (${featuredItems.length} éléments)`);
    
    // Générer le fichier recent.json pour les ajouts récents
    const recentItems = [...items]
      .sort((a, b) => {
        // Utiliser la date d'ajout si disponible, sinon utiliser l'année
        const aDate = a.added_at ? new Date(a.added_at) : new Date(`${a.year || 2000}-01-01`);
        const bDate = b.added_at ? new Date(b.added_at) : new Date(`${b.year || 2000}-01-01`);
        return bDate - aDate;
      })
      .slice(0, 20);
    
    const recentFile = path.join(categoryDir, 'recent.json');
    await fs.writeJson(recentFile, {
      count: recentItems.length,
      results: recentItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier recent généré: ${recentFile} (${recentItems.length} éléments)`);
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
 * S'assure que tous les champs requis par le frontend sont présents
 * @param {Object} item - Élément à vérifier
 * @param {string} category - Catégorie de l'élément
 * @returns {Object} - Élément avec tous les champs requis
 */
function ensureRequiredFields(item, category) {
  // Créer une copie pour ne pas modifier l'original
  const normalizedItem = { ...item };
  
  // 1. Identifiant unique
  if (!normalizedItem.id) {
    normalizedItem.id = `${category}_${normalizedItem.title ? normalizedItem.title.toLowerCase().replace(/[^a-z0-9]/g, '') : ''}_${normalizedItem.year || 'unknown'}`;
  }
  
  // 2. Type (pour la catégorisation)
  normalizedItem.type = category;
  
  // 3. Titre
  if (!normalizedItem.title && normalizedItem.name) {
    normalizedItem.title = normalizedItem.name;
  } else if (!normalizedItem.title) {
    normalizedItem.title = `${category.charAt(0).toUpperCase() + category.slice(1)} ${normalizedItem.id.split('_').pop()}`;
  }
  
  // 4. Images (poster et backdrop)
  if (!normalizedItem.poster && !normalizedItem.poster_path) {
    // Générer une URL d'image par défaut en fonction de la catégorie
    normalizedItem.poster = `https://flodrama.com/assets/default_posters/${category}.jpg`;
  } else if (normalizedItem.poster_path && !normalizedItem.poster) {
    normalizedItem.poster = normalizedItem.poster_path.startsWith('http') 
      ? normalizedItem.poster_path 
      : `https://image.tmdb.org/t/p/w500${normalizedItem.poster_path}`;
  }
  
  if (!normalizedItem.backdrop && !normalizedItem.backdrop_path) {
    // Générer une URL d'image par défaut en fonction de la catégorie
    normalizedItem.backdrop = `https://flodrama.com/assets/default_backdrops/${category}.jpg`;
  } else if (normalizedItem.backdrop_path && !normalizedItem.backdrop) {
    normalizedItem.backdrop = normalizedItem.backdrop_path.startsWith('http') 
      ? normalizedItem.backdrop_path 
      : `https://image.tmdb.org/t/p/original${normalizedItem.backdrop_path}`;
  }
  
  // 5. Année
  if (!normalizedItem.year) {
    if (normalizedItem.release_date) {
      normalizedItem.year = parseInt(normalizedItem.release_date.split('-')[0], 10);
    } else if (normalizedItem.first_air_date) {
      normalizedItem.year = parseInt(normalizedItem.first_air_date.split('-')[0], 10);
    } else {
      // Année par défaut si aucune information n'est disponible
      normalizedItem.year = new Date().getFullYear();
    }
  }
  
  // 6. Évaluation (rating)
  if (!normalizedItem.rating && normalizedItem.vote_average) {
    normalizedItem.rating = normalizedItem.vote_average / 2; // Convertir sur 5 étoiles
  } else if (!normalizedItem.rating) {
    // Évaluation par défaut si aucune information n'est disponible
    normalizedItem.rating = 3.5; // Valeur par défaut sur 5
  }
  
  // 7. Langue originale
  if (!normalizedItem.original_language) {
    // Attribuer une langue par défaut en fonction de la catégorie
    if (category === 'drama') {
      normalizedItem.original_language = 'ko'; // Coréen par défaut pour les dramas
    } else if (category === 'anime') {
      normalizedItem.original_language = 'ja'; // Japonais par défaut pour les animes
    } else if (category === 'bollywood') {
      normalizedItem.original_language = 'hi'; // Hindi par défaut pour Bollywood
    } else {
      normalizedItem.original_language = 'en'; // Anglais par défaut pour les autres
    }
  }
  
  // 8. Genre IDs
  if (!normalizedItem.genre_ids && normalizedItem.genres) {
    normalizedItem.genre_ids = normalizedItem.genres.map(genre => 
      typeof genre === 'object' ? genre.id : parseInt(genre, 10)
    );
  }
  
  // Si aucun genre n'est disponible, définir des genres par défaut en fonction de la catégorie
  if (!normalizedItem.genre_ids || normalizedItem.genre_ids.length === 0) {
    if (category === 'drama') {
      normalizedItem.genre_ids = [18, 10759]; // Drame, Action & Aventure
    } else if (category === 'anime') {
      normalizedItem.genre_ids = [16, 10759]; // Animation, Action & Aventure
    } else if (category === 'bollywood') {
      normalizedItem.genre_ids = [18, 10749]; // Drame, Romance
    } else {
      normalizedItem.genre_ids = [28, 18]; // Action, Drame
    }
  }
  
  // 9. URL de streaming (nouvelle fonctionnalité)
  if (!normalizedItem.streaming_url && normalizedItem.url) {
    normalizedItem.streaming_url = normalizedItem.url;
  }
  
  // Si aucune URL de streaming n'est disponible, créer une URL fictive pour le moment
  if (!normalizedItem.streaming_url) {
    normalizedItem.streaming_url = `https://flodrama.com/watch/${category}/${normalizedItem.id}`;
  }
  
  // 10. URL de bande-annonce
  if (!normalizedItem.trailer_url && normalizedItem.videos && normalizedItem.videos.length > 0) {
    const trailer = normalizedItem.videos.find(video => video.type === 'Trailer') || normalizedItem.videos[0];
    if (trailer && trailer.key) {
      normalizedItem.trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  }
  
  // 11. Description (overview)
  if (!normalizedItem.overview) {
    normalizedItem.overview = `${normalizedItem.title} est un ${category === 'film' ? 'film' : category} ${getGenreDescription(normalizedItem.genre_ids)} sorti en ${normalizedItem.year}.`;
  }
  
  // 12. Date d'ajout
  if (!normalizedItem.added_at) {
    normalizedItem.added_at = new Date().toISOString();
  }
  
  return normalizedItem;
}

/**
 * Génère une description basée sur les genres
 * @param {Array} genreIds - IDs des genres
 * @returns {string} - Description des genres
 */
function getGenreDescription(genreIds) {
  if (!genreIds || genreIds.length === 0) {
    return '';
  }
  
  const genreMap = {
    28: 'd\'action',
    12: 'd\'aventure',
    16: 'd\'animation',
    35: 'de comédie',
    80: 'policier',
    99: 'documentaire',
    18: 'dramatique',
    10751: 'familial',
    14: 'de fantasy',
    36: 'historique',
    27: 'd\'horreur',
    10402: 'musical',
    9648: 'de mystère',
    10749: 'romantique',
    878: 'de science-fiction',
    10770: 'télévisé',
    53: 'thriller',
    10752: 'de guerre',
    37: 'western',
    10759: 'd\'action et d\'aventure',
    10762: 'pour enfants',
    10763: 'd\'actualité',
    10764: 'de télé-réalité',
    10765: 'de science-fiction et fantasy',
    10766: 'de soap',
    10767: 'de talk-show',
    10768: 'politique et guerre'
  };
  
  const genres = genreIds
    .map(id => genreMap[id])
    .filter(Boolean);
  
  if (genres.length === 0) {
    return '';
  }
  
  if (genres.length === 1) {
    return genres[0];
  }
  
  return `${genres.slice(0, -1).join(', ')} et ${genres[genres.length - 1]}`;
}

/**
 * Formate une durée en millisecondes en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Durée formatée
 */
async function formatDuration(ms) {
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

/**
 * Scrape une source spécifique avec pagination et retry
 * @param {Browser} browser - Instance du navigateur
 * @param {Object} source - Configuration de la source
 * @returns {Promise<boolean>} - Succès ou échec
 */
async function scrapeSource(browser, source) {
  console.log(`\n🔎 Scraping de ${source.name} (${source.type})...`);
  
  const allItems = [];
  let success = false;
  let retryCount = 0;
  const maxRetries = source.retryCount || 3;
  
  // Fonction pour générer les URLs avec pagination
  const generatePaginatedUrls = (baseUrl) => {
    const urls = [baseUrl]; // L'URL de base est toujours incluse
    
    // Si la source a un pattern de pagination
    if (source.paginationPattern && source.paginationMax) {
      // Pour la pagination basée sur des offsets (ex: MyAnimeList)
      if (source.paginationPattern.includes('{offset}') && source.paginationOffsetMultiplier) {
        for (let i = 1; i <= source.paginationMax; i++) {
          const offset = i * source.paginationOffsetMultiplier;
          const paginatedUrl = `${baseUrl}${source.paginationPattern.replace('{offset}', offset)}`;
          urls.push(paginatedUrl);
        }
      } 
      // Pour la pagination basée sur des numéros de page
      else if (source.paginationPattern.includes('{page}')) {
        for (let i = 2; i <= source.paginationMax + 1; i++) { // On commence à 2 car la page 1 est l'URL de base
          let paginatedUrl;
          
          // Si l'URL de base se termine par / et que le pattern commence par un paramètre
          if (baseUrl.endsWith('/') && source.paginationPattern.startsWith('?')) {
            paginatedUrl = `${baseUrl}${source.paginationPattern.replace('{page}', i)}`;
          }
          // Si l'URL de base contient déjà un paramètre et que le pattern commence par un paramètre
          else if (baseUrl.includes('?') && source.paginationPattern.startsWith('&')) {
            paginatedUrl = `${baseUrl}${source.paginationPattern.replace('{page}', i)}`;
          }
          // Vérifier si l'URL de base se termine par / et si le pattern commence par /
          else if (baseUrl.endsWith('/') && source.paginationPattern.startsWith('/')) {
            paginatedUrl = `${baseUrl}${source.paginationPattern.substring(1).replace('{page}', i)}`;
          }
          // Sinon, on ajoute simplement le pattern à l'URL de base
          else if (!baseUrl.endsWith('/') && !source.paginationPattern.startsWith('/')) {
            paginatedUrl = `${baseUrl}/${source.paginationPattern.replace('{page}', i)}`;
          } else {
            paginatedUrl = `${baseUrl}${source.paginationPattern.replace('{page}', i)}`;
          }
          
          urls.push(paginatedUrl);
        }
      }
    }
    
    return urls;
  };
  
  // Fonction pour dédupliquer les éléments avec une meilleure stratégie
  const deduplicateItems = (items) => {
    const uniqueItems = [];
    const seenIds = new Set();
    const seenTitles = new Set();
    const seenUrls = new Set();
    
    for (const item of items) {
      // Générer un identifiant unique basé sur le titre et l'année si l'ID n'existe pas
      if (!item.id && item.title) {
        item.id = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${item.year || 'unknown'}`;
      }
      
      // Vérifier si l'ID, le titre ou l'URL a déjà été vu
      const titleKey = item.title ? item.title.toLowerCase().trim() : null;
      const urlKey = item.url || item.link || null;
      
      if (
        (item.id && !seenIds.has(item.id)) &&
        (titleKey === null || !seenTitles.has(titleKey)) &&
        (urlKey === null || !seenUrls.has(urlKey))
      ) {
        if (item.id) {
          seenIds.add(item.id);
        }
        if (titleKey) {
          seenTitles.add(titleKey);
        }
        if (urlKey) {
          seenUrls.add(urlKey);
        }
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems;
  };
  
  // Boucle de retry
  while (retryCount < maxRetries && !success) {
    try {
      // Créer un nouveau contexte pour chaque tentative
      const context = await browser.newContext({
        userAgent: getRandomUserAgent(),
        viewport: {
          width: 1920 + Math.floor(Math.random() * 100),
          height: 1080 + Math.floor(Math.random() * 100)
        },
        deviceScaleFactor: 1,
        hasTouch: false,
        javaScriptEnabled: true,
        locale: 'fr-FR',
        timezoneId: 'Europe/Paris',
        geolocation: { longitude: 2.3488, latitude: 48.8534 },
        permissions: ['geolocation']
      });
      
      // Intercepter les requêtes pour détecter les protections anti-bot
      await context.route('**/*', async (route) => {
        const request = route.request();
        const url = request.url();
        
        // Vérifier les patterns de détection de bots
        if (url.includes('captcha') || 
            url.includes('cloudflare') || 
            url.includes('challenge') || 
            url.includes('cf_chl_')) {
          console.warn(`[${source.name}] Détection de protection anti-bot: ${url}`);
        }
        
        await route.continue();
      });
      
      // Ajouter des scripts de furtivité
      await context.addInitScript(() => {
        // Masquer les indicateurs d'automatisation
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        
        // Simuler des fonctions de navigateur standard
        if (!window.chrome) {
          window.chrome = {};
        }
        
        // Fonction pour simuler la batterie
        const getBattery = function() {
          return Promise.resolve({
            charging: Math.random() > 0.5,
            chargingTime: Math.floor(Math.random() * 1000),
            dischargingTime: Math.floor(Math.random() * 1000),
            level: Math.random()
          });
        };
        
        // Ajouter la fonction getBattery à navigator
        if (!navigator.getBattery) {
          navigator.getBattery = getBattery;
        }
      });
      
      // Créer une page
      const page = await context.newPage();
      
      // Parcourir toutes les URLs de la source avec pagination
      for (const baseUrl of source.urls) {
        // Générer les URLs paginées
        const paginatedUrls = generatePaginatedUrls(baseUrl);
        console.log(`[${source.name}] ${paginatedUrls.length} URLs générées pour ${baseUrl}`);
        
        // Parcourir chaque URL paginée
        for (const url of paginatedUrls) {
          try {
            console.log(`[${source.name}] Accès à ${url}`);
            
            // Accéder à l'URL
            await page.goto(url, { 
              waitUntil: 'networkidle',
              timeout: 60000 
            });
            
            // Attendre un délai aléatoire pour simuler un comportement humain
            await randomDelay(2000, 5000);
            
            // Faire défiler lentement la page pour simuler un comportement humain
            await autoScrollSlow(page);
            
            // Attendre un sélecteur spécifique si nécessaire
            if (source.waitForSelector) {
              await page.waitForSelector(source.waitForSelector, { timeout: 15000 })
                .catch(() => console.log(`[${source.name}] Sélecteur ${source.waitForSelector} non trouvé, on continue`));
            }
            
            // Récupérer le HTML
            const html = await page.content();
            
            // Extraire les données
            const items = extractData(source.name, html, { url, selector: source.selector });
            
            console.log(`[${source.name}] ${items.length} éléments récupérés depuis ${url}`);
            
            if (items.length > 0) {
              allItems.push(...items);
              success = true;
              
              // Prendre une capture d'écran pour débogage si nécessaire
              if (process.env.DEBUG === 'true') {
                const screenshotPath = path.join('./cloudflare/scraping/screenshots', `${source.name}_${Date.now()}.png`);
                await fs.ensureDir(path.dirname(screenshotPath));
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`[${source.name}] Capture d'écran sauvegardée: ${screenshotPath}`);
              }
            }
            
            // Vérifier si nous avons atteint le nombre minimum d'éléments
            const uniqueCount = deduplicateItems(allItems).length;
            if (uniqueCount >= source.minItems) {
              console.log(`[${source.name}] Nombre minimum d'éléments atteint (${uniqueCount}/${source.minItems}), arrêt du scraping`);
              break;
            }
            
            // Attendre entre chaque URL avec un délai variable
            await randomDelay(5000, 12000);
          } catch (error) {
            console.error(`[${source.name}] Erreur lors du scraping de ${url}: ${error.message}`);
          }
        }
        
        // Vérifier si nous avons atteint le nombre minimum d'éléments après avoir traité toutes les URLs paginées
        const uniqueCount = deduplicateItems(allItems).length;
        if (uniqueCount >= source.minItems) {
          console.log(`[${source.name}] Nombre minimum d'éléments atteint (${uniqueCount}/${source.minItems}), passage à la source suivante`);
          break;
        }
      }
      
      // Fermer le contexte
      await context.close();
      
      // Si nous avons des éléments, pas besoin de réessayer
      if (allItems.length > 0) {
        break;
      }
      
    } catch (error) {
      console.error(`[${source.name}] Erreur globale (tentative ${retryCount + 1}/${maxRetries}): ${error.message}`);
      retryCount++;
      
      // Attendre plus longtemps entre les tentatives
      await randomDelay(10000, 20000);
    }
  }
  
  // Dédupliquer les éléments avec la stratégie améliorée
  const uniqueItems = deduplicateItems(allItems);
  
  console.log(`[${source.name}] ${uniqueItems.length}/${allItems.length} éléments uniques après déduplication`);
  
  // Sauvegarder les données
  if (uniqueItems.length > 0) {
    await saveData(source.name, uniqueItems);
    
    // Mettre à jour les statistiques
    stats.total_items += uniqueItems.length;
    stats.sources_processed++;
    
    // Mettre à jour les statistiques par catégorie
    const category = source.type || 'unknown';
    stats.categories[category] = (stats.categories[category] || 0) + uniqueItems.length;
    
    // Vérifier si nous avons atteint l'objectif
    const success = uniqueItems.length >= source.minItems;
    if (!success) {
      console.warn(`[${source.name}] Objectif non atteint: ${uniqueItems.length}/${source.minItems} éléments uniques`);
    }
    
    return success;
  } else {
    console.error(`[${source.name}] Échec après ${maxRetries} tentatives: aucun élément récupéré`);
    stats.sources_failed++;
    return false;
  }
}

/**
 * Scrape plusieurs sources en parallèle
 * @param {Browser} browser - Instance du navigateur
 * @param {Array} sources - Liste des sources à scraper
 * @returns {Promise<Array>} - Résultats du scraping
 */
async function scrapeSources(browser, sources) {
  const results = [];
  
  for (const source of sources) {
    const success = await scrapeSource(browser, source);
    results.push({
      name: source.name,
      type: source.type,
      success
    });
  }
  
  return results;
}

// Exporter les fonctions principales
module.exports = {
  scrapeSources,
  scrapeSource,
  deduplicateItems,
  saveData
};
