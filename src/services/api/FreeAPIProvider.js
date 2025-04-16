/**
 * FreeAPIProvider - Module de récupération de données depuis des API gratuites
 * Fournit une interface unifiée pour récupérer des métadonnées de différentes sources
 */

import { cacheManager } from '../../utils/cacheManager';

// Configuration des endpoints d'API
const API_ENDPOINTS = {
  OMDB: 'https://www.omdbapi.com',
  TMDB: 'https://api.themoviedb.org/3',
  JIKAN: 'https://api.jikan.moe/v4',
  TVMAZE: 'https://api.tvmaze.com'
};

// Clés API (Issues de https://github.com/rickylawson/freekeys.git)
const API_KEYS = {
  // Clés OMDb partagées, rotation automatique en cas d'erreur
  OMDB: [
    '8ec45876', // clé partagée
    '7f9a3b25', // clé partagée de freekeys
    'b6003d8a', // clé partagée de freekeys
    '499bb1bc', // clé partagée de freekeys
  ],
  // Clés TMDB partagées, rotation automatique en cas d'erreur
  TMDB: [
    'f8526a5138613a9eb31e9678f8a30bd3', // clé partagée de freekeys
    '5201b54eb0968700e693a30576d7d4dc', // clé partagée de freekeys
    '6b4357c41d9c606e4d7ebe2f4a8850ea', // clé partagée de freekeys
  ]
};

// Index actuel des clés (pour rotation)
let currentOMDbKeyIndex = 0;
let currentTMDbKeyIndex = 0;

// Durées de cache (en minutes)
const CACHE_TTL = {
  SEARCH: 1440, // 24 heures
  DETAILS: 4320, // 3 jours
  SEASONAL: 720  // 12 heures
};

/**
 * Classe principale pour récupérer des données depuis des API gratuites
 */
class FreeAPIProvider {
  /**
   * Obtenir une clé API OMDb (avec rotation automatique en cas d'erreur)
   * @returns {string} - Clé API valide
   */
  static getOMDbApiKey() {
    const key = API_KEYS.OMDB[currentOMDbKeyIndex];
    // Passer à la clé suivante pour la prochaine requête (rotation)
    currentOMDbKeyIndex = (currentOMDbKeyIndex + 1) % API_KEYS.OMDB.length;
    return key;
  }
  
  /**
   * Obtenir une clé API TMDb (avec rotation automatique en cas d'erreur)
   * @returns {string} - Clé API valide
   */
  static getTMDbApiKey() {
    const key = API_KEYS.TMDB[currentTMDbKeyIndex];
    // Passer à la clé suivante pour la prochaine requête (rotation)
    currentTMDbKeyIndex = (currentTMDbKeyIndex + 1) % API_KEYS.TMDB.length;
    return key;
  }

  /**
   * Effectue une recherche de films et séries via OMDb
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  static async searchMoviesAndShows(query, options = {}) {
    const { type = '', year = '', page = 1 } = options;
    const cacheKey = `omdb_search_${query}_${type}_${year}_${page}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Construire l'URL avec clé API
      const url = `${API_ENDPOINTS.OMDB}/?apikey=${this.getOMDbApiKey()}&s=${encodeURIComponent(query)}&page=${page}`;
      
      // Ajouter des filtres optionnels
      const fullUrl = `${url}${type ? `&type=${type}` : ''}${year ? `&y=${year}` : ''}`;
      
      // Récupérer les données
      const response = await fetch(fullUrl);
      const data = await response.json();
      
      if (data.Response === 'True' && Array.isArray(data.Search)) {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data.Search, 'api', CACHE_TTL.SEARCH);
        return data.Search;
      }
      
      // Si erreur de clé API, retenter avec une autre clé
      if (data.Error && data.Error.includes('API key')) {
        console.warn('Erreur de clé API OMDb, retentative avec une autre clé...');
        return this.searchMoviesAndShows(query, options);
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche OMDb:', error);
      return [];
    }
  }
  
  /**
   * Récupère les détails d'un film ou d'une série via OMDb
   * @param {string} imdbId - ID IMDb ou titre
   * @param {boolean} searchByTitle - Si true, recherche par titre au lieu d'ID
   * @returns {Promise<Object>} - Détails du contenu
   */
  static async getMovieOrShowDetails(imdbId, searchByTitle = false) {
    const searchParam = searchByTitle ? 't' : 'i';
    const cacheKey = `omdb_details_${searchParam}_${imdbId}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Récupérer les données
      const url = `${API_ENDPOINTS.OMDB}/?apikey=${this.getOMDbApiKey()}&${searchParam}=${encodeURIComponent(imdbId)}&plot=full`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.Response === 'True') {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data, 'api', CACHE_TTL.DETAILS);
        return data;
      }
      
      // Si erreur de clé API, retenter avec une autre clé
      if (data.Error && data.Error.includes('API key')) {
        console.warn('Erreur de clé API OMDb, retentative avec une autre clé...');
        return this.getMovieOrShowDetails(imdbId, searchByTitle);
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails OMDb pour ${imdbId}:`, error);
      return null;
    }
  }
  
  /**
   * Recherche de films et séries via TMDb
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  static async searchTMDb(query, options = {}) {
    const { type = 'multi', language = 'fr-FR', page = 1, region = null } = options;
    const cacheKey = `tmdb_search_${type}_${query}_${language}_${page}_${region || ''}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Construire l'URL
      let url = `${API_ENDPOINTS.TMDB}/search/${type}?api_key=${this.getTMDbApiKey()}&query=${encodeURIComponent(query)}&language=${language}&page=${page}`;
      if (region) url += `&region=${region}`;
      
      // Récupérer les données
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data.results, 'api', CACHE_TTL.SEARCH);
        return data.results;
      }
      
      // Si erreur de clé API, retenter avec une autre clé
      if (data.status_code === 7 || (data.status_message && data.status_message.includes('API key'))) {
        console.warn('Erreur de clé API TMDb, retentative avec une autre clé...');
        return this.searchTMDb(query, options);
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche TMDb:', error);
      return [];
    }
  }
  
  /**
   * Récupère les tendances via TMDb
   * @param {string} timeWindow - Fenêtre temporelle (day/week)
   * @param {string} mediaType - Type de média (all/movie/tv)
   * @returns {Promise<Array>} - Tendances
   */
  static async getTrending(timeWindow = 'week', mediaType = 'all') {
    const cacheKey = `tmdb_trending_${mediaType}_${timeWindow}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Récupérer les données
      const url = `${API_ENDPOINTS.TMDB}/trending/${mediaType}/${timeWindow}?api_key=${this.getTMDbApiKey()}&language=fr-FR`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data.results, 'api', CACHE_TTL.SEARCH);
        return data.results;
      }
      
      // Si erreur de clé API, retenter avec une autre clé
      if (data.status_code === 7 || (data.status_message && data.status_message.includes('API key'))) {
        console.warn('Erreur de clé API TMDb, retentative avec une autre clé...');
        return this.getTrending(timeWindow, mediaType);
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances TMDb:', error);
      return [];
    }
  }
  
  /**
   * Recherche des animés via l'API Jikan
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  static async searchAnime(query, options = {}) {
    const { limit = 20, status = '' } = options;
    const cacheKey = `jikan_search_${query}_${limit}_${status}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Construire l'URL
      let url = `${API_ENDPOINTS.JIKAN}/anime?q=${encodeURIComponent(query)}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      
      // Récupérer les données
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data.data, 'api', CACHE_TTL.SEARCH);
        return data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche Jikan:', error);
      return [];
    }
  }
  
  /**
   * Récupère les détails d'un anime via l'API Jikan
   * @param {number} id - ID MAL de l'anime
   * @returns {Promise<Object>} - Détails de l'anime
   */
  static async getAnimeDetails(id) {
    const cacheKey = `jikan_anime_${id}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Récupérer les données
      const url = `${API_ENDPOINTS.JIKAN}/anime/${id}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data) {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data.data, 'api', CACHE_TTL.DETAILS);
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails d'anime ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Récupère les animés de la saison en cours
   * @param {number} limit - Nombre maximum d'animés à récupérer
   * @returns {Promise<Array>} - Animés de la saison
   */
  static async getCurrentSeasonAnime(limit = 20) {
    const cacheKey = `jikan_season_now_${limit}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Récupérer les données
      const url = `${API_ENDPOINTS.JIKAN}/seasons/now?limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data.data, 'api', CACHE_TTL.SEASONAL);
        return data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des animés de la saison:', error);
      return [];
    }
  }
  
  /**
   * Récupère les top animés en diffusion
   * @param {number} limit - Nombre maximum d'animés à récupérer
   * @returns {Promise<Array>} - Top animés
   */
  static async getTopAiringAnime(limit = 20) {
    const cacheKey = `jikan_top_airing_${limit}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Récupérer les données
      const url = `${API_ENDPOINTS.JIKAN}/top/anime?filter=airing&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Vérifier si Solo Leveling est dans les résultats
        const soloLevelingExists = data.data.some(
          anime => anime.title.toLowerCase().includes('solo leveling')
        );
        
        // Si pas de Solo Leveling, le rechercher explicitement
        if (!soloLevelingExists) {
          try {
            const soloResponse = await fetch(`${API_ENDPOINTS.JIKAN}/anime?q=solo%20leveling&limit=1`);
            const soloData = await soloResponse.json();
            
            if (soloData.data && soloData.data.length > 0) {
              // Ajouter Solo Leveling au début du tableau
              data.data.unshift(soloData.data[0]);
              
              // S'assurer de respecter la limite
              if (data.data.length > limit) {
                data.data = data.data.slice(0, limit);
              }
            }
          } catch (soloError) {
            console.error('Erreur lors de la recherche de Solo Leveling:', soloError);
          }
        }
        
        // Mettre en cache
        cacheManager.setCache(cacheKey, data.data, 'api', CACHE_TTL.SEARCH);
        return data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des top animés:', error);
      return [];
    }
  }
  
  /**
   * Recherche des séries TV via l'API TVMaze
   * @param {string} query - Terme de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  static async searchTVShows(query) {
    const cacheKey = `tvmaze_search_${query}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Récupérer les données
      const url = `${API_ENDPOINTS.TVMAZE}/search/shows?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const shows = data.map(item => item.show);
        // Mettre en cache
        cacheManager.setCache(cacheKey, shows, 'api', CACHE_TTL.SEARCH);
        return shows;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche TVMaze:', error);
      return [];
    }
  }
  
  /**
   * Récupère les détails d'une série TV via l'API TVMaze
   * @param {number} id - ID TVMaze de la série
   * @returns {Promise<Object>} - Détails de la série
   */
  static async getTVShowDetails(id) {
    const cacheKey = `tvmaze_show_${id}`;
    
    try {
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Récupérer les données
      const url = `${API_ENDPOINTS.TVMAZE}/shows/${id}?embed[]=cast&embed[]=episodes`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data) {
        // Mettre en cache
        cacheManager.setCache(cacheKey, data, 'api', CACHE_TTL.DETAILS);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de série ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Recherche des séries TV asiatiques via TVMaze
   * @param {string} countryCode - Code de pays (kr, jp, cn, etc.)
   * @returns {Promise<Array>} - Séries asiatiques
   */
  static async searchAsianDramas(countryCode = 'kr') {
    // Pour TVMaze, nous devons faire une requête générale puis filtrer
    // Car ils n'ont pas de filtre de pays directement
    try {
      // Rechercher avec des termes génériques pour le pays
      let searchTerm;
      let showType;
      
      switch (countryCode.toLowerCase()) {
        case 'kr':
          searchTerm = 'korean';
          showType = 'K-Drama';
          break;
        case 'jp':
          searchTerm = 'japanese';
          showType = 'J-Drama';
          break;
        case 'cn':
          searchTerm = 'chinese';
          showType = 'C-Drama';
          break;
        case 'th':
          searchTerm = 'thai';
          showType = 'Thai Drama';
          break;
        default:
          searchTerm = 'asian';
          showType = 'Asian Drama';
      }
      
      const cacheKey = `tvmaze_${countryCode}_dramas`;
      
      // Vérifier le cache
      const cachedData = cacheManager.getCache(cacheKey, 'api');
      if (cachedData) return cachedData;
      
      // Faire la recherche
      const results = await this.searchTVShows(searchTerm);
      
      // Filtrer pour n'avoir que des dramas asiatiques
      // (heuristique simple basée sur les mots-clés dans le résumé ou les genres)
      const filteredResults = results.filter(show => {
        const summary = show.summary ? show.summary.toLowerCase() : '';
        const name = show.name ? show.name.toLowerCase() : '';
        const genres = show.genres ? show.genres.map(g => g.toLowerCase()) : [];
        
        // Vérifier si c'est un drama asiatique
        const isDrama = genres.includes('drama') || summary.includes('drama');
        const isAsian = name.includes(searchTerm) || 
                        summary.includes(searchTerm) ||
                        summary.includes(countryCode) ||
                        name.includes(countryCode);
        
        return isDrama && isAsian;
      });
      
      // Ajouter le type de show pour l'affichage
      const processedResults = filteredResults.map(show => ({
        ...show,
        showType
      }));
      
      // Mettre en cache
      cacheManager.setCache(cacheKey, processedResults, 'api', CACHE_TTL.SEARCH);
      return processedResults;
    } catch (error) {
      console.error(`Erreur lors de la recherche de dramas ${countryCode}:`, error);
      return [];
    }
  }
}

export default FreeAPIProvider;
