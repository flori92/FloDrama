/**
 * Script de scraping hybride pour FloDrama
 * 
 * Ce script utilise une approche hybride pour récupérer les métadonnées,
 * en combinant des requêtes directes et des requêtes via proxy,
 * avec une gestion robuste des erreurs.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
// const { parse: parseHTML } = require('node-html-parser');
const SmartScrapingService = require('../services/SmartScrapingService.cjs');

// Configuration
const CONFIG = {
  // Nombre d'éléments à récupérer pour chaque catégorie
  maxItems: 50,
  
  // Répertoire de sortie pour les données scrapées
  outputDir: path.join(__dirname, '../../data'),
  
  // Préfixe pour les fichiers de sortie
  filePrefix: `${new Date().toISOString().split('T')[0]}_flodrama`,
  
  // Délai entre les requêtes (en ms) pour éviter d'être bloqué
  requestDelay: 3000,
  
  // Timeout pour chaque requête (en ms)
  requestTimeout: 15000,
  
  // Sources directes (sans proxy) pour les animés
  animeSources: [
    {
      name: 'NekoSama',
      baseUrl: 'https://www.neko-sama.org',
      popularUrl: 'https://www.neko-sama.org/anime',
      searchUrl: 'https://www.neko-sama.org/anime/search',
      selector: {
        container: '.anime-card',
        title: '.title',
        image: '.cover img',
        link: 'a',
        rating: '.rating'
      }
    },
    {
      name: 'AnimeSama',
      baseUrl: 'https://anime-sama.fr',
      popularUrl: 'https://anime-sama.fr/catalogue',
      searchUrl: 'https://anime-sama.fr/search',
      selector: {
        container: '.card',
        title: '.card-title',
        image: '.card-img-top',
        link: 'a',
        rating: '.rating'
      }
    }
  ],
  
  // Sources directes pour les dramas
  dramaSources: [
    {
      name: 'MyDramaList',
      baseUrl: 'https://mydramalist.com',
      popularUrl: 'https://mydramalist.com/shows/top',
      searchUrl: 'https://mydramalist.com/search',
      selector: {
        container: '.box',
        title: '.title a',
        image: '.lazy',
        link: '.title a',
        rating: '.score'
      }
    }
  ],
  
  // Sources directes pour Bollywood
  bollywoodSources: [
    {
      name: 'Bollywood',
      baseUrl: 'https://www.bollywoodhungama.com',
      popularUrl: 'https://www.bollywoodhungama.com/movies/top-100-movies/',
      searchUrl: 'https://www.bollywoodhungama.com/search',
      selector: {
        container: '.movies-listing li',
        title: 'h3',
        image: 'img',
        link: 'a',
        rating: '.rating'
      }
    }
  ],
  
  // API TMDB pour enrichir les données
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    apiKey: '3b5caee89d6f1ccfb03cb837adb8e9e1', // Clé publique pour TMDB
    popularMoviesUrl: '/movie/popular',
    popularTvUrl: '/tv/popular',
    searchUrl: '/search/multi',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500'
  }
};

// Fonction utilitaire pour attendre un certain temps
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour créer le répertoire de sortie s'il n'existe pas
const ensureOutputDir = () => {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`✅ Répertoire de sortie créé: ${CONFIG.outputDir}`);
  }
};

// Fonction pour sauvegarder les données dans un fichier JSON
const saveToJson = (data, category) => {
  const filename = `${CONFIG.filePrefix}_${category}.json`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Données sauvegardées dans: ${filepath}`);
  
  return filepath;
};

// Fonction pour effectuer une requête HTTP avec gestion des erreurs
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Ajouter un timeout pour éviter que la requête ne reste bloquée
      const response = await axios({
        url,
        ...options,
        timeout: CONFIG.requestTimeout
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Tentative ${attempt + 1}/${maxRetries} échouée pour ${url}: ${error.message}`);
      lastError = error;
      
      // Attendre avant de réessayer
      if (attempt < maxRetries - 1) {
        await sleep(CONFIG.requestDelay);
      }
    }
  }
  
  throw new Error(`Échec après ${maxRetries} tentatives: ${lastError.message}`);
};

// Fonction pour récupérer des données depuis TMDB
const fetchFromTMDB = async (endpoint, params = {}) => {
  const url = `${CONFIG.tmdb.baseUrl}${endpoint}`;
  
  try {
    const data = await fetchWithRetry(url, {
      params: {
        api_key: CONFIG.tmdb.apiKey,
        language: 'fr-FR',
        ...params
      }
    });
    
    return data;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération depuis TMDB: ${error.message}`);
    return null;
  }
};

// Fonction pour récupérer les films populaires depuis TMDB
const getPopularMoviesFromTMDB = async () => {
  console.log('🔍 Récupération des films populaires depuis TMDB...');
  
  try {
    const data = await fetchFromTMDB(CONFIG.tmdb.popularMoviesUrl, { page: 1 });
    
    if (!data || !data.results) {
      throw new Error('Données invalides reçues de TMDB');
    }
    
    const movies = data.results.map(movie => ({
      id: `tmdb-${movie.id}`,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      image: movie.poster_path ? `${CONFIG.tmdb.imageBaseUrl}${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `${CONFIG.tmdb.imageBaseUrl}${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      rating: movie.vote_average,
      url: `https://www.themoviedb.org/movie/${movie.id}`,
      type: 'movie',
      source: 'TMDB'
    }));
    
    console.log(`✅ ${movies.length} films populaires récupérés depuis TMDB`);
    return movies;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des films populaires depuis TMDB:', error.message);
    return [];
  }
};

// Fonction pour récupérer les séries populaires depuis TMDB
const getPopularTVFromTMDB = async () => {
  console.log('🔍 Récupération des séries populaires depuis TMDB...');
  
  try {
    const data = await fetchFromTMDB(CONFIG.tmdb.popularTvUrl, { page: 1 });
    
    if (!data || !data.results) {
      throw new Error('Données invalides reçues de TMDB');
    }
    
    const tvShows = data.results.map(show => ({
      id: `tmdb-${show.id}`,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      image: show.poster_path ? `${CONFIG.tmdb.imageBaseUrl}${show.poster_path}` : null,
      backdrop: show.backdrop_path ? `${CONFIG.tmdb.imageBaseUrl}${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      rating: show.vote_average,
      url: `https://www.themoviedb.org/tv/${show.id}`,
      type: 'drama',
      source: 'TMDB'
    }));
    
    console.log(`✅ ${tvShows.length} séries populaires récupérées depuis TMDB`);
    return tvShows;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des séries populaires depuis TMDB:', error.message);
    return [];
  }
};

// Fonction pour rechercher des contenus via TMDB
const searchTMDB = async (query) => {
  console.log(`🔍 Recherche sur TMDB pour: "${query}"...`);
  
  try {
    const data = await fetchFromTMDB(CONFIG.tmdb.searchUrl, { query });
    
    if (!data || !data.results) {
      throw new Error('Données invalides reçues de TMDB');
    }
    
    const results = data.results.map(item => {
      // Déterminer le type de contenu
      let type = 'other';
      if (item.media_type === 'movie') type = 'movie';
      else if (item.media_type === 'tv') type = 'drama';
      
      return {
        id: `tmdb-${item.id}`,
        title: item.title || item.name,
        originalTitle: item.original_title || item.original_name,
        overview: item.overview,
        image: item.poster_path ? `${CONFIG.tmdb.imageBaseUrl}${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `${CONFIG.tmdb.imageBaseUrl}${item.backdrop_path}` : null,
        releaseDate: item.release_date || item.first_air_date,
        rating: item.vote_average,
        url: `https://www.themoviedb.org/${item.media_type}/${item.id}`,
        type,
        source: 'TMDB'
      };
    }).filter(item => item.title && item.image);
    
    console.log(`✅ ${results.length} résultats trouvés sur TMDB pour "${query}"`);
    return results;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche sur TMDB pour "${query}":`, error.message);
    return [];
  }
};

// Fonction pour récupérer des données via SmartScrapingService avec gestion des erreurs
const fetchViaSmartScraping = async (method, ...args) => {
  try {
    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), CONFIG.requestTimeout)
    );
    
    const resultPromise = SmartScrapingService[method](...args);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    return result;
  } catch (error) {
    console.error(`❌ Erreur lors de l'appel à SmartScrapingService.${method}:`, error.message);
    return [];
  }
};

// Fonction pour récupérer les dramas populaires
const getPopularDramas = async () => {
  console.log('🔍 Récupération des dramas populaires...');
  
  try {
    // Essayer d'abord via SmartScrapingService
    const dramas = await fetchViaSmartScraping('getPopularDramas', 1);
    
    if (dramas && dramas.length > 0) {
      console.log(`✅ ${dramas.length} dramas populaires récupérés via SmartScrapingService`);
      return dramas.slice(0, CONFIG.maxItems);
    }
    
    // Si ça échoue, essayer via TMDB
    console.log('⚠️ Échec de SmartScrapingService, utilisation de TMDB comme fallback...');
    const tvShows = await getPopularTVFromTMDB();
    
    console.log(`✅ ${tvShows.length} dramas populaires récupérés via TMDB`);
    return tvShows.slice(0, CONFIG.maxItems);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dramas populaires:', error.message);
    return [];
  }
};

// Fonction pour récupérer les films populaires
const getPopularMovies = async () => {
  console.log('🔍 Récupération des films populaires...');
  
  try {
    // Essayer d'abord via SmartScrapingService
    const movies = await fetchViaSmartScraping('getPopularMovies', 1);
    
    if (movies && movies.length > 0) {
      console.log(`✅ ${movies.length} films populaires récupérés via SmartScrapingService`);
      return movies.slice(0, CONFIG.maxItems);
    }
    
    // Si ça échoue, essayer via TMDB
    console.log('⚠️ Échec de SmartScrapingService, utilisation de TMDB comme fallback...');
    const tmdbMovies = await getPopularMoviesFromTMDB();
    
    console.log(`✅ ${tmdbMovies.length} films populaires récupérés via TMDB`);
    return tmdbMovies.slice(0, CONFIG.maxItems);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des films populaires:', error.message);
    return [];
  }
};

// Fonction pour récupérer les animés populaires
const getPopularAnimes = async () => {
  console.log('🔍 Récupération des animés populaires...');
  
  try {
    // Essayer d'abord via SmartScrapingService
    const animes = await fetchViaSmartScraping('getPopularAnimes', 1);
    
    if (animes && animes.length > 0) {
      console.log(`✅ ${animes.length} animés populaires récupérés via SmartScrapingService`);
      return animes.slice(0, CONFIG.maxItems);
    }
    
    // Si ça échoue, essayer via TMDB
    console.log('⚠️ Échec de SmartScrapingService, recherche d\'animés sur TMDB...');
    const animeKeywords = ['anime', 'animation japonaise', 'manga'];
    
    let tmdbAnimes = [];
    for (const keyword of animeKeywords) {
      const results = await searchTMDB(keyword);
      tmdbAnimes = [...tmdbAnimes, ...results];
      await sleep(CONFIG.requestDelay);
    }
    
    // Dédupliquer les résultats
    const uniqueAnimes = [];
    const seenIds = new Set();
    
    for (const anime of tmdbAnimes) {
      if (!seenIds.has(anime.id)) {
        uniqueAnimes.push({
          ...anime,
          type: 'anime'
        });
        seenIds.add(anime.id);
      }
    }
    
    console.log(`✅ ${uniqueAnimes.length} animés populaires récupérés via TMDB`);
    return uniqueAnimes.slice(0, CONFIG.maxItems);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des animés populaires:', error.message);
    return [];
  }
};

// Fonction pour rechercher des contenus
const searchContent = async (query) => {
  console.log(`🔍 Recherche de contenus pour: "${query}"...`);
  
  try {
    // Essayer d'abord via SmartScrapingService
    const results = await fetchViaSmartScraping('searchAll', query);
    
    if (results && (results.dramas?.length > 0 || results.animes?.length > 0 || results.movies?.length > 0)) {
      const allResults = [
        ...(results.dramas || []),
        ...(results.animes || []),
        ...(results.movies || [])
      ];
      
      console.log(`✅ ${allResults.length} résultats trouvés via SmartScrapingService pour "${query}"`);
      return allResults;
    }
    
    // Si ça échoue, essayer via TMDB
    console.log('⚠️ Échec de SmartScrapingService, utilisation de TMDB comme fallback...');
    const tmdbResults = await searchTMDB(query);
    
    console.log(`✅ ${tmdbResults.length} résultats trouvés via TMDB pour "${query}"`);
    return tmdbResults;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche pour "${query}":`, error.message);
    return [];
  }
};

// Fonction pour enrichir les données avec des recherches spécifiques
const enrichWithSearches = async (existingData) => {
  console.log('🔍 Enrichissement des données avec des recherches spécifiques...');
  
  const searchTerms = [
    // Dramas coréens populaires
    'squid game', 'vincenzo', 'crash landing on you', 'itaewon class',
    // Animés populaires
    'attack on titan', 'demon slayer', 'jujutsu kaisen', 'one piece',
    // Films populaires
    'parasite', 'train to busan',
    // Bollywood
    'rrr', 'bahubali', '3 idiots'
  ];
  
  const searchResults = [];
  const existingTitles = new Set(existingData.map(item => item.title?.toLowerCase()));
  
  for (const term of searchTerms) {
    console.log(`  🔎 Recherche pour: "${term}"...`);
    
    try {
      const results = await searchContent(term);
      
      // Filtrer les doublons
      const newResults = results.filter(item => 
        item.title && !existingTitles.has(item.title.toLowerCase())
      );
      
      if (newResults.length > 0) {
        console.log(`  ✅ ${newResults.length} nouveaux résultats trouvés pour "${term}"`);
        searchResults.push(...newResults);
        
        // Ajouter les nouveaux titres à l'ensemble des titres existants
        newResults.forEach(item => {
          if (item.title) {
            existingTitles.add(item.title.toLowerCase());
          }
        });
      } else {
        console.log(`  ℹ️ Aucun nouveau résultat pour "${term}"`);
      }
      
      // Attendre entre chaque recherche pour éviter d'être bloqué
      await sleep(CONFIG.requestDelay);
    } catch (error) {
      console.error(`  ❌ Erreur lors de la recherche pour "${term}":`, error.message);
    }
  }
  
  console.log(`✅ ${searchResults.length} nouveaux éléments ajoutés par recherche`);
  return searchResults;
};

// Fonction pour générer un fichier de métadonnées consolidé
const generateMetadataFile = (data) => {
  const metadata = {
    totalItems: data.length,
    categories: {
      dramas: data.filter(item => item.type === 'drama').length,
      movies: data.filter(item => item.type === 'movie').length,
      animes: data.filter(item => item.type === 'anime').length,
      other: data.filter(item => !item.type || !['drama', 'movie', 'anime'].includes(item.type)).length
    },
    sources: {},
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  // Compter les éléments par source
  data.forEach(item => {
    if (item.source) {
      metadata.sources[item.source] = (metadata.sources[item.source] || 0) + 1;
    }
  });
  
  const filename = `${CONFIG.filePrefix}_metadata.json`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`✅ Métadonnées sauvegardées dans: ${filepath}`);
  
  return metadata;
};

// Fonction principale pour exécuter le scraping hybride
async function runHybridScraping() {
  console.log('🚀 Démarrage du scraping hybride pour FloDrama...\n');
  
  // Étape 1: Créer le répertoire de sortie
  ensureOutputDir();
  
  // Étape 2: Récupérer les données de base
  const dramas = await getPopularDramas();
  await sleep(CONFIG.requestDelay);
  
  const movies = await getPopularMovies();
  await sleep(CONFIG.requestDelay);
  
  const animes = await getPopularAnimes();
  await sleep(CONFIG.requestDelay);
  
  // Étape 3: Fusionner les données de base
  let allData = [
    ...dramas,
    ...movies,
    ...animes
  ];
  
  console.log(`✅ Données de base récupérées: ${allData.length} éléments au total`);
  
  // Étape 4: Enrichir avec des recherches spécifiques
  const searchResults = await enrichWithSearches(allData);
  allData = [...allData, ...searchResults];
  
  // Étape 5: Dédupliquer les données
  const uniqueData = [];
  const seenTitles = new Set();
  
  allData.forEach(item => {
    if (item.title && !seenTitles.has(item.title.toLowerCase())) {
      uniqueData.push(item);
      seenTitles.add(item.title.toLowerCase());
    }
  });
  
  console.log(`✅ Données dédupliquées: ${uniqueData.length} éléments uniques`);
  
  // Étape 6: Sauvegarder les données par catégorie
  const dramasData = uniqueData.filter(item => item.type === 'drama');
  const moviesData = uniqueData.filter(item => item.type === 'movie');
  const animesData = uniqueData.filter(item => item.type === 'anime');
  
  saveToJson(dramasData, 'dramas');
  saveToJson(moviesData, 'movies');
  saveToJson(animesData, 'animes');
  saveToJson(uniqueData, 'all');
  
  // Étape 7: Générer un fichier de métadonnées
  generateMetadataFile(uniqueData);
  
  console.log('\n🏁 Scraping hybride terminé avec succès!');
  console.log(`📊 Statistiques:`);
  console.log(`  - Dramas: ${dramasData.length}`);
  console.log(`  - Films: ${moviesData.length}`);
  console.log(`  - Animés: ${animesData.length}`);
  console.log(`  - Total: ${uniqueData.length}`);
  
  // Étape 8: Afficher les instructions pour déployer les données sur AWS
  console.log('\n📤 Pour déployer ces données sur AWS:');
  console.log(`  1. Compresser le dossier: zip -r ${CONFIG.filePrefix}.zip ${CONFIG.outputDir}`);
  console.log('  2. Télécharger le fichier ZIP sur S3: aws s3 cp flodrama-data.zip s3://flodrama-assets/data/');
  console.log('  3. Mettre à jour la référence dans l\'application: AWS_DATA_URL=https://flodrama-assets.s3.amazonaws.com/data/latest.json');
}

// Exécution du scraping hybride
runHybridScraping().catch(error => {
  console.error('❌ Erreur lors du scraping hybride:', error.message);
});
