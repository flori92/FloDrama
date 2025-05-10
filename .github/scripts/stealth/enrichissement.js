/**
 * Module d'enrichissement des données pour FloDrama
 * 
 * Ce module permet d'enrichir les données scrapées avec des métadonnées
 * supplémentaires comme des posters de haute qualité, des affiches,
 * des URLs de trailers et d'autres informations importantes
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const CONFIG = require('./config');
const { randomDelay, generateUniqueId } = require('./utils');

/**
 * Client pour l'API TMDB
 */
class TMDBClient {
  constructor(debug = false) {
    this.debug = debug;
    this.baseUrl = CONFIG.ENRICHMENT_APIS.TMDB.baseUrl;
    this.apiKey = CONFIG.ENRICHMENT_APIS.TMDB.apiKey;
    this.imageBaseUrl = CONFIG.ENRICHMENT_APIS.TMDB.imageBaseUrl;
    this.posterSize = CONFIG.ENRICHMENT_APIS.TMDB.posterSize;
    this.backdropSize = CONFIG.ENRICHMENT_APIS.TMDB.backdropSize;
  }

  /**
   * Log de debug
   */
  log(message) {
    if (this.debug) {
      console.log(`[TMDB] ${message}`);
    }
  }

  /**
   * Recherche un film ou une série
   */
  async search(title, type = 'movie', year = null) {
    try {
      const endpoint = type === 'movie' ? 'searchMovie' : 'searchTv';
      const url = `${this.baseUrl}${CONFIG.ENRICHMENT_APIS.TMDB.endpoints[endpoint]}`;
      
      this.log(`Recherche de "${title}" (${type}) sur TMDB...`);
      
      const params = {
        api_key: this.apiKey,
        query: title,
        language: 'fr-FR',
        include_adult: false
      };
      
      if (year) {
        params.year = year;
      }
      
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        this.log(`${response.data.results.length} résultats trouvés pour "${title}"`);
        return response.data.results[0];
      }
      
      this.log(`Aucun résultat trouvé pour "${title}"`);
      return null;
    } catch (error) {
      console.error(`[TMDB] Erreur lors de la recherche de "${title}": ${error.message}`);
      return null;
    }
  }

  /**
   * Récupère les détails d'un film ou d'une série
   */
  async getDetails(id, type = 'movie') {
    try {
      const endpoint = type === 'movie' ? 'movieDetails' : 'tvDetails';
      const url = `${this.baseUrl}${CONFIG.ENRICHMENT_APIS.TMDB.endpoints[endpoint]}${id}`;
      
      this.log(`Récupération des détails pour l'ID ${id} (${type})...`);
      
      const params = {
        api_key: this.apiKey,
        language: 'fr-FR',
        append_to_response: 'videos,images,credits'
      };
      
      const response = await axios.get(url, { params });
      
      if (response.data) {
        this.log(`Détails récupérés pour l'ID ${id}`);
        return response.data;
      }
      
      this.log(`Aucun détail trouvé pour l'ID ${id}`);
      return null;
    } catch (error) {
      console.error(`[TMDB] Erreur lors de la récupération des détails pour l'ID ${id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Récupère les vidéos d'un film ou d'une série
   */
  async getVideos(id, type = 'movie') {
    try {
      const endpoint = type === 'movie' ? 'movieVideos' : 'tvVideos';
      const url = `${this.baseUrl}${CONFIG.ENRICHMENT_APIS.TMDB.endpoints[endpoint].replace('{id}', id)}`;
      
      this.log(`Récupération des vidéos pour l'ID ${id} (${type})...`);
      
      const params = {
        api_key: this.apiKey,
        language: 'fr-FR'
      };
      
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        this.log(`${response.data.results.length} vidéos trouvées pour l'ID ${id}`);
        return response.data.results;
      }
      
      this.log(`Aucune vidéo trouvée pour l'ID ${id}`);
      return [];
    } catch (error) {
      console.error(`[TMDB] Erreur lors de la récupération des vidéos pour l'ID ${id}: ${error.message}`);
      return [];
    }
  }

  /**
   * Construit l'URL d'une image
   */
  getImageUrl(path, type = 'poster') {
    if (!path) return null;
    
    const size = type === 'poster' ? this.posterSize : this.backdropSize;
    return `${this.imageBaseUrl}/${size}${path}`;
  }
}

/**
 * Enrichit les données d'un élément
 */
async function enrichItem(item, category, debug = false) {
  try {
    if (debug) {
      console.log(`[ENRICHISSEMENT] Enrichissement de "${item.title}" (${category})...`);
    }
    
    // Initialiser le client TMDB
    const tmdbClient = new TMDBClient(debug);
    
    // Déterminer le type TMDB en fonction de la catégorie
    const tmdbType = category === 'film' || category === 'bollywood' ? 'movie' : 'tv';
    
    // Rechercher l'élément sur TMDB
    const searchResult = await tmdbClient.search(item.title, tmdbType, item.year);
    
    if (!searchResult) {
      if (debug) {
        console.log(`[ENRICHISSEMENT] Aucun résultat TMDB pour "${item.title}"`);
      }
      return item;
    }
    
    // Récupérer les détails complets
    const details = await tmdbClient.getDetails(searchResult.id, tmdbType);
    
    if (!details) {
      if (debug) {
        console.log(`[ENRICHISSEMENT] Aucun détail TMDB pour "${item.title}"`);
      }
      return item;
    }
    
    // Enrichir l'élément avec les données TMDB
    const enrichedItem = {
      ...item,
      tmdb_id: details.id,
      title: item.title || details.title || details.name,
      original_title: details.original_title || details.original_name,
      overview: details.overview,
      poster: tmdbClient.getImageUrl(details.poster_path) || item.poster,
      backdrop: tmdbClient.getImageUrl(details.backdrop_path, 'backdrop'),
      rating: item.rating || (details.vote_average ? parseFloat((details.vote_average / 2).toFixed(1)) : 0),
      year: item.year || (details.release_date ? parseInt(details.release_date.substring(0, 4)) : (details.first_air_date ? parseInt(details.first_air_date.substring(0, 4)) : null)),
      genres: details.genres ? details.genres.map(genre => genre.name) : [],
      runtime: details.runtime || (details.episode_run_time ? details.episode_run_time[0] : null),
      status: details.status,
      content_type: category,
      source: item.source
    };
    
    // Récupérer les vidéos (trailers)
    const videos = await tmdbClient.getVideos(searchResult.id, tmdbType);
    
    if (videos && videos.length > 0) {
      // Filtrer pour ne garder que les trailers YouTube
      const trailers = videos.filter(video => 
        video.site === 'YouTube' && 
        (video.type === 'Trailer' || video.type === 'Teaser')
      );
      
      if (trailers.length > 0) {
        enrichedItem.trailer = `https://www.youtube.com/watch?v=${trailers[0].key}`;
        enrichedItem.trailer_thumbnail = `https://img.youtube.com/vi/${trailers[0].key}/maxresdefault.jpg`;
      }
    }
    
    // Ajouter les acteurs principaux
    if (details.credits && details.credits.cast) {
      enrichedItem.cast = details.credits.cast.slice(0, 5).map(actor => ({
        name: actor.name,
        character: actor.character,
        profile: tmdbClient.getImageUrl(actor.profile_path, 'poster')
      }));
    }
    
    if (debug) {
      console.log(`[ENRICHISSEMENT] "${item.title}" enrichi avec succès`);
    }
    
    return enrichedItem;
  } catch (error) {
    console.error(`[ENRICHISSEMENT] Erreur lors de l'enrichissement de "${item.title}": ${error.message}`);
    return item;
  }
}

/**
 * Enrichit une liste d'éléments
 */
async function enrichItems(items, category, debug = false) {
  const enrichedItems = [];
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`[ENRICHISSEMENT] Enrichissement de ${items.length} éléments (${category})...`);
  
  for (let i = 0; i < items.length; i++) {
    try {
      // Afficher la progression
      if (debug || i % 10 === 0) {
        console.log(`[ENRICHISSEMENT] Progression: ${i + 1}/${items.length} (${Math.round((i + 1) / items.length * 100)}%)`);
      }
      
      // Enrichir l'élément
      const enrichedItem = await enrichItem(items[i], category, debug);
      enrichedItems.push(enrichedItem);
      
      // Incrémenter le compteur de succès
      successCount++;
      
      // Attendre un délai aléatoire pour éviter de surcharger l'API
      await randomDelay(500, 1500);
    } catch (error) {
      console.error(`[ENRICHISSEMENT] Erreur lors de l'enrichissement de l'élément ${i}: ${error.message}`);
      enrichedItems.push(items[i]);
      errorCount++;
    }
  }
  
  console.log(`[ENRICHISSEMENT] ${successCount} éléments enrichis avec succès, ${errorCount} erreurs`);
  
  return enrichedItems;
}

/**
 * Enrichit les données d'une source
 */
async function enrichSource(sourceName, category, debug = false) {
  try {
    console.log(`[ENRICHISSEMENT] Enrichissement de la source ${sourceName} (${category})...`);
    
    // Chemin du fichier source
    const sourcePath = path.join(CONFIG.TEMP_DIR, `${sourceName}.json`);
    
    // Vérifier si le fichier existe
    if (!await fs.pathExists(sourcePath)) {
      console.error(`[ENRICHISSEMENT] Fichier source introuvable: ${sourcePath}`);
      return false;
    }
    
    // Charger les données
    const sourceData = await fs.readJson(sourcePath);
    
    // Extraire les éléments
    const items = Array.isArray(sourceData) ? sourceData : (sourceData.data || sourceData.results || []);
    
    if (items.length === 0) {
      console.warn(`[ENRICHISSEMENT] Aucun élément trouvé dans ${sourcePath}`);
      return false;
    }
    
    // Enrichir les éléments
    const enrichedItems = await enrichItems(items, category, debug);
    
    // Sauvegarder les données enrichies
    const outputPath = path.join(CONFIG.OUTPUT_DIR, `${sourceName}_enriched.json`);
    await fs.writeJson(outputPath, enrichedItems, { spaces: 2 });
    
    console.log(`[ENRICHISSEMENT] Données enrichies sauvegardées dans ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`[ENRICHISSEMENT] Erreur lors de l'enrichissement de la source ${sourceName}: ${error.message}`);
    return false;
  }
}

/**
 * Enrichit les données de toutes les sources d'une catégorie
 */
async function enrichCategory(category, debug = false) {
  try {
    console.log(`[ENRICHISSEMENT] Enrichissement de la catégorie ${category}...`);
    
    // Récupérer les sources de la catégorie
    const sources = CONFIG.SOURCES[category] || [];
    
    if (sources.length === 0) {
      console.warn(`[ENRICHISSEMENT] Aucune source définie pour la catégorie ${category}`);
      return false;
    }
    
    // Enrichir chaque source
    let successCount = 0;
    
    for (const source of sources) {
      if (source.enrichData) {
        const success = await enrichSource(source.name, category, debug);
        
        if (success) {
          successCount++;
        }
      }
    }
    
    console.log(`[ENRICHISSEMENT] ${successCount}/${sources.length} sources enrichies pour la catégorie ${category}`);
    
    return successCount > 0;
  } catch (error) {
    console.error(`[ENRICHISSEMENT] Erreur lors de l'enrichissement de la catégorie ${category}: ${error.message}`);
    return false;
  }
}

/**
 * Enrichit les données de toutes les catégories
 */
async function enrichAllData(debug = false) {
  try {
    console.log(`[ENRICHISSEMENT] Enrichissement de toutes les données...`);
    
    // Créer les répertoires nécessaires
    await fs.ensureDir(CONFIG.OUTPUT_DIR);
    
    // Enrichir chaque catégorie
    let successCount = 0;
    
    for (const category of CONFIG.CATEGORIES) {
      const success = await enrichCategory(category, debug);
      
      if (success) {
        successCount++;
      }
    }
    
    console.log(`[ENRICHISSEMENT] ${successCount}/${CONFIG.CATEGORIES.length} catégories enrichies`);
    
    return successCount > 0;
  } catch (error) {
    console.error(`[ENRICHISSEMENT] Erreur lors de l'enrichissement des données: ${error.message}`);
    return false;
  }
}

module.exports = {
  TMDBClient,
  enrichItem,
  enrichItems,
  enrichSource,
  enrichCategory,
  enrichAllData
};
