/**
 * Serveur de relais local pour le scraping FloDrama
 * 
 * Ce script permet de lancer un serveur local qui simule le service Render
 * pour tester le scraping sans dépendre du service distant.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { execSync } = require('child_process');

// Ajouter le plugin stealth à puppeteer pour contourner les détections
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const API_KEY = process.env.API_KEY || 'rnd_DJfpQC9gEu4KgTRvX8iQzMXxrteP';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '3e4d90cc981d3f782559d1748c99528c'; // Clé API TMDB par défaut
const OUTPUT_DIR = path.join(__dirname, 'relay-output');
const FLODRAMA_OUTPUT_DIR = path.join(__dirname, 'output');
const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  '--disable-translate',
  '--hide-scrollbars',
  '--metrics-recording-only',
  '--mute-audio',
  '--safebrowsing-disable-auto-update'
];

// Limites de scraping pour éviter les blocages
const SCRAPING_LIMITS = {
  MAX_PAGES_PER_SOURCE: 50,
  DELAY_BETWEEN_PAGES: 2000, // ms
  TIMEOUT: 60000 // ms
};

// Configuration des sources avec les sélecteurs appropriés
// Focus sur les sources validées pour FloDrama (basé sur l'analyse Python)
const SOURCE_CONFIG = {
  // Sources de dramas asiatiques
  'voirdrama': {
    selectors: {
      main: 'div.wrap, div.body-wrap, div.c-header__top',
      wait: 'div.site-content'
    },
    baseUrl: 'https://voirdrama.org/dramas/',
    type: 'drama',
    priority: 1
  },
  'dramacool': {
    selectors: {
      main: '.list-drama-item',
      wait: '.list-episode-item'
    },
    baseUrl: 'https://dramacool.cr/most-popular-drama',
    type: 'drama',
    priority: 1
  },
  'mydramalist': {
    selectors: {
      main: '.box',
      wait: '#content'
    },
    baseUrl: 'https://mydramalist.com/shows/top',
    type: 'drama',
    priority: 1
  },
  'asianwiki': {
    selectors: {
      main: '.thumbinner, .gallerybox, .wikia-gallery-item',
      wait: '.cf-wrapper, #content'
    },
    baseUrl: 'https://asianwiki.com/Main_Page',
    type: 'drama',
    priority: 2
  },
  
  // Sources d'animes
  'animesama': {
    selectors: {
      main: '#list_catalog a',
      wait: '#blocEntier'
    },
    baseUrl: 'https://anime-sama.fr/catalogue/',
    type: 'anime',
    priority: 1
  },
  'nekosama': {
    selectors: {
      main: '.vrd_posts_carousel_slide, .picture-content, .vrd_subsite_grid',
      wait: '.vrd_posts_carousel_wrap, .main-content-col'
    },
    baseUrl: 'https://www.neko-sama.org/',
    type: 'anime',
    priority: 1
  },
  'voiranime': {
    selectors: {
      main: '.c-blog__inner, .body-wrap, .c-blog-listing',
      wait: '.c-blog-listing, .body-wrap'
    },
    baseUrl: 'https://v6.voiranime.com/',
    type: 'anime',
    priority: 1
  },
  'animevostfr': {
    selectors: {
      main: '.ml-item',
      wait: '.movies-list'
    },
    baseUrl: 'https://animevostfr.tv/animes/',
    type: 'anime',
    priority: 2
  },
  'otakufr': {
    selectors: {
      main: '.ml-item',
      wait: '.movies-list'
    },
    baseUrl: 'https://otakufr.co/anime/',
    type: 'anime',
    priority: 2
  },
  'vostfree': {
    selectors: {
      main: '.ml-item',
      wait: '.movies-list'
    },
    baseUrl: 'https://vostfree.cx/animes/',
    type: 'anime',
    priority: 2
  },
  
  // Sources de films
  'filmcomplet': {
    selectors: {
      main: '.ml-item',
      wait: '.movies-list'
    },
    baseUrl: 'https://www.filmcomplet.tv/films/',
    type: 'film',
    priority: 1
  },
  'streamingdivx': {
    selectors: {
      main: '.vrd_posts_carousel_slide, .picture-content, .cactus-row',
      wait: '.cactus-container, .main-content-col'
    },
    baseUrl: 'https://www.streamingdivx.fr/',
    type: 'film',
    priority: 1
  },
  'streamingcommunity': {
    selectors: {
      main: '.film-item',
      wait: '.film-list'
    },
    baseUrl: 'https://streamingcommunity.best/film/',
    type: 'film',
    priority: 2
  },
  'filmapik': {
    selectors: {
      main: '.ml-item',
      wait: '.movies-list'
    },
    baseUrl: 'https://filmapik.website/movies/',
    type: 'film',
    priority: 2
  },
  
  // Sources de bollywood
  'hindilinks4u': {
    selectors: {
      main: '.ml-item',
      wait: '.movies-list'
    },
    baseUrl: 'https://www.hindilinks4u.to/category/bollywood-movies/',
    type: 'bollywood',
    priority: 1
  },
  'bollystream': {
    selectors: {
      main: 'a.masvideos-LoopTvShow-link, a.masvideos-LoopMovie-link, .tv-show-poster-container, .movie-poster-container',
      wait: '.container, .home-section, .tv-shows, .movies'
    },
    baseUrl: 'https://bollystream.eu/tv-show-genre/series-indiennes, https://bollystream.eu/tv-show-genre/series-pakistanaises, https://bollystream.eu/tv-shows, https://bollystream.eu/movie-genre/bollywood, https://bollystream.eu/movie-genre/films-bollywood-version-francaise',
    type: 'bollywood',
    priority: 1
  },
};

// Middleware pour l'authentification
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token !== API_KEY) {
    return res.status(403).json({ error: 'Clé API invalide' });
  }
  
  next();
};

// Configuration de l'application
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Créer les dossiers de sortie s'ils n'existent pas
fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(FLODRAMA_OUTPUT_DIR);

// Route pour vérifier le statut du service
app.get('/status', authenticate, (req, res) => {
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);
  
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: uptimeFormatted,
    mode: 'local'
  });
});

// Route pour lister les sources supportées
app.get('/sources', authenticate, (req, res) => {
  res.json({
    sources: [
      'allocine-films',
      'allocine-series',
      'senscritique-films',
      'senscritique-series',
      'imdb-films',
      'imdb-series',
      'tmdb-films',
      'tmdb-series',
      'dramacool',
      'mydramalist',
      'myanimelist',
      'bollywood'
    ]
  });
});

// Route principale pour le scraping
app.post('/scrape', authenticate, (req, res) => {
  // Répondre immédiatement pour éviter les timeouts
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  res.status(202).json({
    status: 'processing',
    message: 'Requête de scraping acceptée et en cours de traitement',
    requestId: requestId
  });
  
  // Traiter la requête en arrière-plan
  processScrapingRequest(req.body, requestId);
});

// Fonction pour traiter les requêtes de scraping en arrière-plan
async function processScrapingRequest(body, requestId) {
  const startTime = Date.now();
  let { source, type, urls, selectors, pagination, minItems } = body;
  
  if (!source) {
    console.error(`❌ Source non spécifiée`);
    return;
  }
  
  // Utiliser la configuration prédéfinie pour la source si disponible
  const sourceConfig = SOURCE_CONFIG[source];
  if (sourceConfig) {
    console.log(`ℹ️ Utilisation de la configuration prédéfinie pour ${source}`);
    type = type || sourceConfig.type;
    selectors = selectors || sourceConfig.selectors;
    
    // Si aucune URL n'est spécifiée, utiliser l'URL de base de la configuration
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      urls = [sourceConfig.baseUrl];
    }
    
    // Configuration de pagination par défaut si non spécifiée
    if (!pagination) {
      pagination = {
        pattern: 'page={page}',
        max: 3,
        offsetMultiplier: 1
      };
    }
  }
  
  // Vérifier que les paramètres nécessaires sont disponibles
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    console.error(`❌ URLs non spécifiées pour la source ${source}`);
    return;
  }
  
  console.log(`📌 Démarrage du scraping réel pour ${source} (${type || 'inconnu'})`);
  console.log(`🔗 URLs: ${urls.join(', ')}`);
  
  try {
    // Créer un dossier temporaire pour les résultats
    const tempOutputDir = path.join(OUTPUT_DIR, source);
    fs.ensureDirSync(tempOutputDir);
    
    // Créer un fichier de configuration pour le scraping
    const configFile = path.join(tempOutputDir, 'config.json');
    fs.writeJsonSync(configFile, {
      source,
      type,
      urls,
      selectors,
      pagination,
      minItems,
      timestamp: new Date().toISOString()
    }, { spaces: 2 });
    
    // Lancer le navigateur avec les options stealth
    console.log(`🚀 Lancement du navigateur pour ${source}...`);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: BROWSER_ARGS
    });
    
    try {
      // Récupérer les données par scraping réel
      const results = await scrapeWithPuppeteer(browser, source, type, urls, selectors, pagination, minItems);
      
      // Sauvegarder les résultats
      if (results && results.length > 0) {
        console.log(`✅ ${results.length} éléments récupérés pour ${source}`);
        
        // Sauvegarder les résultats dans le dossier temporaire
        fs.writeJsonSync(path.join(tempOutputDir, `${source}.json`), results, { spaces: 2 });
        
        // Copier les résultats vers le dossier de sortie de FloDrama
        const flodramaOutputDir = path.join(__dirname, 'output');
        fs.ensureDirSync(flodramaOutputDir);
        fs.writeJsonSync(path.join(flodramaOutputDir, `${source}.json`), results, { spaces: 2 });
        
        // Mettre à jour le fichier global.json
        updateGlobalJson(results, type);
      } else {
        console.warn(`⚠️ Aucun élément récupéré pour ${source}`);
        
        // Si le scraping réel échoue, utiliser des données de secours depuis TMDB
        console.log(`🔄 Tentative de récupération de données depuis TMDB pour ${source}...`);
        const fallbackResults = await getFallbackDataFromTMDB(source, type);
        
        if (fallbackResults && fallbackResults.length > 0) {
          console.log(`✅ ${fallbackResults.length} éléments récupérés depuis TMDB pour ${source}`);
          
          // Sauvegarder les résultats de secours
          fs.writeJsonSync(path.join(tempOutputDir, `${source}-tmdb-fallback.json`), fallbackResults, { spaces: 2 });
          fs.writeJsonSync(path.join(flodramaOutputDir, `${source}.json`), fallbackResults, { spaces: 2 });
          
          // Mettre à jour le fichier global.json
          updateGlobalJson(fallbackResults, type);
        } else {
          console.error(`❌ Échec de la récupération de données pour ${source}, même via TMDB`);
        }
      }
    } finally {
      // Fermer le navigateur dans tous les cas
      await browser.close();
      console.log(`🔒 Navigateur fermé pour ${source}`);
    }
    
    console.log(`✅ Traitement terminé pour ${source} en ${(Date.now() - startTime) / 1000}s`);
  } catch (error) {
    console.error(`⚠️ Erreur lors du traitement de ${source}: ${error.message}`);
    console.error(error.stack);
  }
}

// Fonction pour mettre à jour le fichier global.json de manière optimisée pour les grands volumes
function updateGlobalJson(results, type) {
  try {
    const globalFilePath = path.join(FLODRAMA_OUTPUT_DIR, 'global.json');
    const globalIndexPath = path.join(FLODRAMA_OUTPUT_DIR, 'global-index.json');
    
    // Utiliser un index pour suivre les IDs déjà présents et éviter de charger tout le fichier
    let existingIds = new Set();
    
    // Charger l'index s'il existe
    if (fs.existsSync(globalIndexPath)) {
      try {
        const indexData = fs.readJsonSync(globalIndexPath);
        existingIds = new Set(indexData.ids || []);
      } catch (error) {
        console.error(`⚠️ Erreur lors de la lecture de l'index: ${error.message}`);
      }
    }
    
    // Initialiser le fichier global s'il n'existe pas
    if (!fs.existsSync(globalFilePath)) {
      fs.writeJsonSync(globalFilePath, { items: [] }, { spaces: 2 });
    }
    
    // Filtrer les nouveaux éléments pour éviter les doublons
    const newItems = [];
    const newIds = [];
    
    if (Array.isArray(results)) {
      for (const item of results) {
        if (!existingIds.has(item.id)) {
          newItems.push(item);
          newIds.push(item.id);
          existingIds.add(item.id);
        }
      }
    }
    
    // Ajouter les nouveaux éléments au fichier global par lots pour éviter les problèmes de mémoire
    if (newItems.length > 0) {
      // Lire le début du fichier pour obtenir la structure
      const fileContent = fs.readFileSync(globalFilePath, 'utf8');
      const fileLines = fileContent.split('\n');
      const hasItems = fileContent.includes('"items": [');
      
      // Ouvrir le fichier en mode écriture
      const fileStream = fs.createWriteStream(globalFilePath, { flags: 'w' });
      
      // Écrire le début du fichier
      if (hasItems) {
        // Trouver la position du tableau d'items
        let itemsStartIndex = -1;
        for (let i = 0; i < fileLines.length; i++) {
          if (fileLines[i].includes('"items": [')) {
            itemsStartIndex = i;
            break;
          }
        }
        
        if (itemsStartIndex >= 0) {
          // Écrire jusqu'au début du tableau
          for (let i = 0; i <= itemsStartIndex; i++) {
            fileStream.write(fileLines[i] + '\n');
          }
          
          // Vérifier si le tableau est vide
          const isEmptyArray = fileLines[itemsStartIndex + 1].trim().startsWith(']');
          
          // Si le tableau n'est pas vide, ajouter une virgule
          if (!isEmptyArray) {
            // Ajouter les éléments existants
            let i = itemsStartIndex + 1;
            while (i < fileLines.length && !fileLines[i].trim().startsWith(']')) {
              fileStream.write(fileLines[i] + '\n');
              i++;
            }
            
            // Ajouter une virgule avant les nouveaux éléments
            fileStream.write(',\n');
          }
        }
      } else {
        // Créer une nouvelle structure
        fileStream.write('{\n  "items": [\n');
      }
      
      // Ajouter les nouveaux éléments par lots
      const BATCH_SIZE = 100;
      for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
        const batch = newItems.slice(i, i + BATCH_SIZE);
        const batchContent = batch.map(item => JSON.stringify(item, null, 2)).join(',\n');
        fileStream.write(batchContent);
        
        // Ajouter une virgule si ce n'est pas le dernier lot
        if (i + BATCH_SIZE < newItems.length) {
          fileStream.write(',\n');
        }
      }
      
      // Fermer le tableau et l'objet
      fileStream.write('\n  ]\n}');
      fileStream.end();
      
      // Mettre à jour l'index
      fs.writeJsonSync(globalIndexPath, { ids: Array.from(existingIds) });
      
      console.log(`✅ Fichier global.json mis à jour avec ${newItems.length} nouveaux éléments`);
      
      // Mettre à jour les fichiers par catégorie
      updateCategoryFile(type, newItems);
    } else {
      console.log(`ℹ️ Aucun nouvel élément à ajouter au fichier global.json`);
    }
  } catch (error) {
    console.error(`⚠️ Erreur lors de la mise à jour du fichier global.json: ${error.message}`);
    console.error(error.stack);
  }
}

// Fonction pour mettre à jour les fichiers par catégorie de manière optimisée
function updateCategoryFile(category, results) {
  if (!category || !Array.isArray(results) || results.length === 0) {
    return;
  }
  
  try {
    const categoryFilePath = path.join(FLODRAMA_OUTPUT_DIR, `${category}.json`);
    const categoryIndexPath = path.join(FLODRAMA_OUTPUT_DIR, `${category}-index.json`);
    
    // Utiliser un index pour suivre les IDs déjà présents
    let existingIds = new Set();
    
    // Charger l'index s'il existe
    if (fs.existsSync(categoryIndexPath)) {
      try {
        const indexData = fs.readJsonSync(categoryIndexPath);
        existingIds = new Set(indexData.ids || []);
      } catch (error) {
        console.error(`⚠️ Erreur lors de la lecture de l'index pour ${category}: ${error.message}`);
      }
    }
    
    // Initialiser le fichier de catégorie s'il n'existe pas
    if (!fs.existsSync(categoryFilePath)) {
      fs.writeJsonSync(categoryFilePath, { items: [] }, { spaces: 2 });
    }
    
    // Filtrer les nouveaux éléments pour éviter les doublons
    const newItems = [];
    const newIds = [];
    
    for (const item of results) {
      if (!existingIds.has(item.id)) {
        newItems.push(item);
        newIds.push(item.id);
        existingIds.add(item.id);
      }
    }
    
    // Ajouter les nouveaux éléments au fichier de catégorie par lots
    if (newItems.length > 0) {
      // Lire le début du fichier pour obtenir la structure
      const fileContent = fs.readFileSync(categoryFilePath, 'utf8');
      const fileLines = fileContent.split('\n');
      const hasItems = fileContent.includes('"items": [');
      
      // Ouvrir le fichier en mode écriture
      const fileStream = fs.createWriteStream(categoryFilePath, { flags: 'w' });
      
      // Écrire le début du fichier
      if (hasItems) {
        // Trouver la position du tableau d'items
        let itemsStartIndex = -1;
        for (let i = 0; i < fileLines.length; i++) {
          if (fileLines[i].includes('"items": [')) {
            itemsStartIndex = i;
            break;
          }
        }
        
        if (itemsStartIndex >= 0) {
          // Écrire jusqu'au début du tableau
          for (let i = 0; i <= itemsStartIndex; i++) {
            fileStream.write(fileLines[i] + '\n');
          }
          
          // Vérifier si le tableau est vide
          const isEmptyArray = fileLines[itemsStartIndex + 1].trim().startsWith(']');
          
          // Si le tableau n'est pas vide, ajouter une virgule
          if (!isEmptyArray) {
            // Ajouter les éléments existants
            let i = itemsStartIndex + 1;
            while (i < fileLines.length && !fileLines[i].trim().startsWith(']')) {
              fileStream.write(fileLines[i] + '\n');
              i++;
            }
            
            // Ajouter une virgule avant les nouveaux éléments
            fileStream.write(',\n');
          }
        }
      } else {
        // Créer une nouvelle structure
        fileStream.write('{\n  "items": [\n');
      }
      
      // Ajouter les nouveaux éléments par lots
      const BATCH_SIZE = 100;
      for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
        const batch = newItems.slice(i, i + BATCH_SIZE);
        const batchContent = batch.map(item => JSON.stringify(item, null, 2)).join(',\n');
        fileStream.write(batchContent);
        
        // Ajouter une virgule si ce n'est pas le dernier lot
        if (i + BATCH_SIZE < newItems.length) {
          fileStream.write(',\n');
        }
      }
      
      // Fermer le tableau et l'objet
      fileStream.write('\n  ]\n}');
      fileStream.end();
      
      // Mettre à jour l'index
      fs.writeJsonSync(categoryIndexPath, { ids: Array.from(existingIds) });
      
      console.log(`✅ Fichier ${category}.json mis à jour avec ${newItems.length} nouveaux éléments`);
    } else {
      console.log(`ℹ️ Aucun nouvel élément à ajouter au fichier ${category}.json`);
    }
  } catch (error) {
    console.error(`⚠️ Erreur lors de la mise à jour du fichier ${category}.json: ${error.message}`);
    console.error(error.stack);
  }
}

// Fonction pour générer des données fictives plus réalistes et en grande quantité
function generateMockData(source, type, count = 500) {
  // Définir le nombre d'éléments à générer en fonction de la source
  let itemCount = count;
  
  // Ajuster le nombre d'éléments selon la source pour simuler des données réelles
  switch(source) {
    case 'dramacool':
    case 'mydramalist':
      itemCount = 2000; // Sources de dramas avec beaucoup de contenu
      break;
    case 'myanimelist':
      itemCount = 3000; // Source d'animes avec énormément de contenu
      break;
    case 'imdb-films':
    case 'tmdb-films':
      itemCount = 2500; // Sources de films avec beaucoup de contenu
      break;
    case 'allocine-films':
    case 'allocine-series':
      itemCount = 1500; // Sources françaises avec moins de contenu
      break;
    case 'bollywood':
      itemCount = 800; // Source spécialisée avec moins de contenu
      break;
    default:
      itemCount = 500; // Valeur par défaut pour les autres sources
  }
  
  console.log(`✨ Génération de ${itemCount} éléments pour ${source}...`);
  
  const results = [];
  const categories = ['drama', 'anime', 'film', 'bollywood'];
  const currentType = type || (categories.includes(source) ? source : 'film');
  
  // Données réalistes pour chaque type
  const dramaGenres = ['Romance', 'Comédie', 'Action', 'Thriller', 'Historique', 'Médical', 'Fantastique', 'Policier'];
  const animeGenres = ['Shonen', 'Shojo', 'Seinen', 'Mecha', 'Fantasy', 'Isekai', 'Slice of Life', 'Action'];
  const filmGenres = ['Action', 'Comédie', 'Drame', 'Science-Fiction', 'Horreur', 'Aventure', 'Animation', 'Thriller'];
  const bollywoodGenres = ['Masala', 'Romance', 'Action', 'Drame', 'Comédie', 'Historique', 'Biopic', 'Musical'];
  
  // Noms réalistes selon le type
  const dramaNames = [
    'Love in Seoul', 'Hospital Playlist', 'The Heirs', 'Crash Landing on You', 'Itaewon Class',
    'Eternal Love', 'A Love So Beautiful', 'The Untamed', 'Go Ahead', 'Nirvana in Fire',
    'Tokyo Love Story', 'Alice in Borderland', 'Midnight Diner', 'Hanzawa Naoki', 'Giri/Haji'
  ];
  
  const animeNames = [
    'Attack on Titan', 'My Hero Academia', 'Demon Slayer', 'One Piece', 'Naruto',
    'Jujutsu Kaisen', 'Violet Evergarden', 'Your Lie in April', 'Steins;Gate', 'Death Note',
    'Fullmetal Alchemist', 'Hunter x Hunter', 'Spy x Family', 'Chainsaw Man', 'Tokyo Ghoul'
  ];
  
  const filmNames = [
    'Inception', 'The Shawshank Redemption', 'Parasite', 'Interstellar', 'The Dark Knight',
    'Pulp Fiction', 'The Godfather', 'Avengers: Endgame', 'La La Land', 'The Matrix',
    'Joker', 'The Grand Budapest Hotel', 'Mad Max: Fury Road', 'Get Out', 'Whiplash'
  ];
  
  const bollywoodNames = [
    'Dilwale Dulhania Le Jayenge', 'Kabhi Khushi Kabhie Gham', '3 Idiots', 'Dangal', 'PK',
    'Bajrangi Bhaijaan', 'Lagaan', 'Devdas', 'Kuch Kuch Hota Hai', 'Dil Chahta Hai',
    'Queen', 'Gully Boy', 'Andhadhun', 'Zindagi Na Milegi Dobara', 'Barfi!'
  ];
  
  // Générer les données
  for (let i = 0; i < itemCount; i++) {
    // Choisir les données appropriées selon le type
    let nameBase, genreList;
    
    switch(currentType) {
      case 'drama':
        nameBase = dramaNames;
        genreList = dramaGenres;
        break;
      case 'anime':
        nameBase = animeNames;
        genreList = animeGenres;
        break;
      case 'bollywood':
        nameBase = bollywoodNames;
        genreList = bollywoodGenres;
        break;
      case 'film':
      default:
        nameBase = filmNames;
        genreList = filmGenres;
    }
    
    // Générer un ID unique
    const id = `${source}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}-${i}`;
    
    // Générer un titre réaliste
    const baseName = nameBase[Math.floor(Math.random() * nameBase.length)];
    const title = i < nameBase.length ? 
      baseName : 
      `${baseName} ${Math.floor(i / nameBase.length) + 1}`;
    
    // Générer une année réaliste (entre 1990 et 2025)
    const year = 1990 + Math.floor(Math.random() * 36);
    
    // Générer une note réaliste (entre 1 et 5 avec une distribution plus réaliste)
    // La plupart des notes sont entre 3 et 4.5
    const ratingBase = 3 + (Math.random() * 1.5);
    const rating = Math.min(5, Math.max(1, ratingBase)).toFixed(1);
    
    // Sélectionner 1 à 3 genres aléatoires
    const genreCount = 1 + Math.floor(Math.random() * 3);
    const genres = [];
    for (let j = 0; j < genreCount; j++) {
      const genre = genreList[Math.floor(Math.random() * genreList.length)];
      if (!genres.includes(genre)) {
        genres.push(genre);
      }
    }
    
    // Générer une description réaliste
    const descriptions = [
      `Une histoire captivante qui suit ${title} dans une aventure inoubliable.`,
      `${title} raconte l'histoire de personnages complexes dans un monde en constante évolution.`,
      `Dans ${title}, découvrez une intrigue passionnante mêlant ${genres.join(' et ')}.`,
      `${title} est une œuvre ${genres[0].toLowerCase()} qui a marqué l'année ${year}.`,
      `Considéré comme un chef-d'œuvre du genre ${genres[0]}, ${title} vous transportera dans un univers unique.`
    ];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Créer l'objet final
    const item = {
      id,
      title,
      originalTitle: title,
      year,
      rating,
      type: currentType,
      source,
      url: `https://example.com/${source}/${id}`,
      image: `https://picsum.photos/seed/${id}/300/450`,
      description,
      genres,
      timestamp: new Date().toISOString()
    };
    
    results.push(item);
  }
  
  return results;
}

/**
 * Effectue le scraping d'une source avec Puppeteer
 * @param {Browser} browser - Instance du navigateur Puppeteer
 * @param {string} source - Nom de la source
 * @param {string} type - Type de contenu (film, drama, anime, etc.)
 * @param {Array<string>} urls - URLs à scraper
 * @param {Object} selectors - Sélecteurs CSS pour extraire les données
 * @param {Object} pagination - Configuration de pagination
 * @param {number} minItems - Nombre minimum d'éléments à récupérer
 * @returns {Promise<Array>} - Tableau d'éléments récupérés
 */
async function scrapeWithPuppeteer(browser, source, type, urls, selectors, pagination, minItems = 10) {
  console.log(`🔍 Début du scraping pour ${source} avec Puppeteer`);
  
  const allItems = [];
  const mainSelector = selectors?.main || '.card';
  const waitSelector = selectors?.wait || mainSelector;
  
  // Traiter chaque URL
  for (const baseUrl of urls) {
    try {
      console.log(`🔗 Traitement de l'URL: ${baseUrl}`);
      
      // Déterminer les pages à scraper
      const pagesToScrape = [];
      
      // Ajouter l'URL de base
      pagesToScrape.push(baseUrl);
      
      // Ajouter les URLs de pagination si configurées
      if (pagination && pagination.pattern && pagination.max > 1) {
        const maxPages = Math.min(pagination.max || 1, SCRAPING_LIMITS.MAX_PAGES_PER_SOURCE);
        const offsetMultiplier = pagination.offsetMultiplier || 1;
        
        for (let i = 1; i < maxPages; i++) {
          const offset = i * offsetMultiplier;
          const pageUrl = baseUrl.includes('?') 
            ? `${baseUrl}&${pagination.pattern.replace('{page}', offset)}` 
            : `${baseUrl}?${pagination.pattern.replace('{page}', offset)}`;
          
          pagesToScrape.push(pageUrl);
        }
      }
      
      // Scraper chaque page
      for (let i = 0; i < pagesToScrape.length; i++) {
        const pageUrl = pagesToScrape[i];
        console.log(`📟 Scraping de la page ${i+1}/${pagesToScrape.length}: ${pageUrl}`);
        
        // Créer une nouvelle page
        const page = await browser.newPage();
        
        try {
          // Configurer la page
          await page.setViewport({ width: 1920, height: 1080 });
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          
          // Définir un timeout pour la navigation
          await page.setDefaultNavigationTimeout(60000);
          
          // Intercepter les requêtes pour bloquer les ressources inutiles
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
              req.abort();
            } else {
              req.continue();
            }
          });
          
          // Naviguer vers l'URL
          await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
          
          // Attendre que le sélecteur soit présent
          try {
            await page.waitForSelector(waitSelector, { timeout: SCRAPING_LIMITS.TIMEOUT });
          } catch (error) {
            console.warn(`⚠️ Sélecteur ${waitSelector} non trouvé sur ${pageUrl}`);
            continue; // Passer à l'URL suivante
          }
          
          // Faire défiler la page pour charger tout le contenu
          await autoScrollSlow(page);
          
          // Extraire les données
          const pageItems = await page.evaluate((selector, sourceName, contentType) => {
            const elements = Array.from(document.querySelectorAll(selector));
            return elements.map((el, index) => {
              // Extraire les informations de base
              const titleEl = el.querySelector('h2, h3, .title, [class*="title"], [class*="name"]') || el;
              const title = titleEl.innerText.trim();
              
              // Générer un ID unique
              const id = `${sourceName}-${Date.now()}-${index}`;
              
              // Extraire l'URL
              const linkEl = el.querySelector('a') || el.closest('a');
              const url = linkEl ? linkEl.href : window.location.href;
              
              // Extraire l'image
              const imgEl = el.querySelector('img');
              const image = imgEl ? imgEl.src : '';
              
              // Extraire la description
              const descEl = el.querySelector('.description, [class*="description"], [class*="overview"], p');
              const description = descEl ? descEl.innerText.trim() : '';
              
              // Extraire l'année
              const yearEl = el.querySelector('.year, [class*="year"], [class*="date"]');
              let year = yearEl ? yearEl.innerText.trim() : '';
              
              // Essayer d'extraire l'année depuis le texte
              if (!year) {
                const yearMatch = el.innerText.match(/(19|20)\d{2}/);
                year = yearMatch ? yearMatch[0] : '';
              }
              
              // Extraire la note
              const ratingEl = el.querySelector('.rating, [class*="rating"], [class*="score"], [class*="note"]');
              let rating = ratingEl ? ratingEl.innerText.trim() : '';
              
              // Normaliser la note sur 5
              if (rating) {
                const ratingValue = parseFloat(rating.replace(',', '.'));
                if (!isNaN(ratingValue)) {
                  // Si la note est sur 10, la convertir sur 5
                  if (ratingValue > 5 && ratingValue <= 10) {
                    rating = (ratingValue / 2).toFixed(1);
                  } else {
                    rating = ratingValue.toFixed(1);
                  }
                }
              }
              
              // Extraire les genres
              const genreEls = el.querySelectorAll('.genre, [class*="genre"], [class*="category"], [class*="tag"]');
              const genres = Array.from(genreEls).map(g => g.innerText.trim()).filter(Boolean);
              
              return {
                id,
                title,
                originalTitle: title,
                year: year ? parseInt(year, 10) : null,
                rating,
                type: contentType,
                source: sourceName,
                url,
                image,
                description,
                genres,
                timestamp: new Date().toISOString()
              };
            }).filter(item => item.title); // Filtrer les éléments sans titre
          }, mainSelector, source, type);
          
          console.log(`✅ ${pageItems.length} éléments récupérés sur la page ${i+1}`);
          
          // Ajouter les éléments au tableau global
          allItems.push(...pageItems);
          
          // Si on a suffisamment d'éléments, arrêter le scraping
          if (allItems.length >= minItems) {
            console.log(`✅ Nombre minimum d'éléments atteint (${allItems.length} >= ${minItems})`);
            break;
          }
          
          // Attendre un délai entre les pages pour éviter d'être bloqué
          if (i < pagesToScrape.length - 1) {
            console.log(`⏳ Attente de ${SCRAPING_LIMITS.DELAY_BETWEEN_PAGES}ms avant la page suivante...`);
            await new Promise(resolve => setTimeout(resolve, SCRAPING_LIMITS.DELAY_BETWEEN_PAGES));
          }
        } catch (error) {
          console.error(`⚠️ Erreur lors du scraping de ${pageUrl}: ${error.message}`);
        } finally {
          // Fermer la page dans tous les cas
          await page.close();
        }
      }
    } catch (error) {
      console.error(`⚠️ Erreur lors du traitement de l'URL ${baseUrl}: ${error.message}`);
    }
  }
  
  console.log(`📊 Total: ${allItems.length} éléments récupérés pour ${source}`);
  return allItems;
}

/**
 * Récupère des données de secours depuis TMDB
 * @param {string} source - Nom de la source
 * @param {string} type - Type de contenu (film, drama, anime, etc.)
 * @returns {Promise<Array>} - Tableau d'éléments récupérés
 */
async function getFallbackDataFromTMDB(source, type) {
  console.log(`🌐 Récupération de données depuis TMDB pour ${source} (${type})`);
  
  // Utiliser la clé API TMDB configurée globalement
  if (!TMDB_API_KEY) {
    console.warn(`⚠️ Clé API TMDB non disponible, impossible de récupérer des données de secours`);
    return [];
  }
  
  try {
    // Déterminer le type de contenu pour TMDB
    let endpoint = '';
    let mediaType = '';
    
    if (type === 'film' || type === 'movie' || source.includes('film')) {
      endpoint = 'movie/popular';
      mediaType = 'film';
    } else if (type === 'drama' || type === 'series' || source.includes('series')) {
      endpoint = 'tv/popular';
      mediaType = 'drama';
    } else if (type === 'anime' || source.includes('anime')) {
      // Pour les animes, on utilise une recherche spécifique
      endpoint = 'discover/tv';
      mediaType = 'anime';
    } else {
      endpoint = 'trending/all/week';
      mediaType = type || 'film';
    }
    
    // Construire l'URL de l'API
    let apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`;
    
    // Ajouter des paramètres spécifiques pour les animes
    if (mediaType === 'anime') {
      apiUrl += '&with_keywords=210024|287501&with_original_language=ja';
    }
    
    console.log(`🔗 Appel API TMDB: ${endpoint}`);
    
    // Faire la requête à l'API TMDB
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Erreur API TMDB: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    console.log(`✅ ${results.length} éléments récupérés depuis TMDB`);
    
    // Transformer les données au format attendu
    return results.map((item, index) => {
      const title = item.title || item.name || '';
      const originalTitle = item.original_title || item.original_name || title;
      const year = item.release_date || item.first_air_date 
        ? new Date(item.release_date || item.first_air_date).getFullYear() 
        : null;
      
      return {
        id: `${source}-tmdb-${item.id || Date.now() + index}`,
        title,
        originalTitle,
        year,
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : null,
        type: mediaType,
        source: `${source}-tmdb`,
        url: `https://www.themoviedb.org/${item.media_type || (mediaType === 'film' ? 'movie' : 'tv')}/${item.id}`,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        description: item.overview || '',
        genres: [], // Les genres nécessiteraient un appel supplémentaire
        timestamp: new Date().toISOString()
      };
    }).filter(item => item.title); // Filtrer les éléments sans titre
  } catch (error) {
    console.error(`⚠️ Erreur lors de la récupération des données depuis TMDB: ${error.message}`);
    return [];
  }
}

/**
 * Fait défiler automatiquement une page lentement pour simuler un comportement humain
 * @param {Page} page - Instance de la page Puppeteer
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
      }, 100 + Math.floor(Math.random() * 50));
    });
  });
}

// Fonction pour formater le temps d'activité
function formatUptime(uptime) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}j ${hours}h ${minutes}m ${seconds}s`;
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur de relais local démarré sur le port ${PORT}`);
  console.log(`📌 URL: http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`📂 Dossier de sortie: ${OUTPUT_DIR}`);
  console.log(`📂 Dossier FloDrama: ${FLODRAMA_OUTPUT_DIR}`);
});

// Gérer les erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error(`❌ Erreur non capturée: ${error.message}`);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', promise);
  console.error('Raison:', reason);
});
