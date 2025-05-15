const Cache = require('../../core/cache/Cache');
const Anime = require('../../core/models/Anime');

/**
 * Service pour interagir avec l'API Anime (itzzzme/anime-api)
 */
class AnimeApiService {
  constructor(baseUrl = 'https://anime-api.vercel.app/api') {
    this.baseUrl = baseUrl;
    this.cache = new Cache();
    this.source = 'anime-api';
  }

  /**
   * Effectue une requête à l'API Anime avec gestion du cache
   * @param {string} endpoint - L'endpoint à appeler
   * @param {Object} params - Les paramètres de la requête
   * @param {number} cacheTTL - Durée de vie du cache en secondes
   * @returns {Promise<Object>} - La réponse de l'API
   */
  async fetchFromAPI(endpoint, params = {}, cacheTTL = 86400) {
    // Construire l'URL avec les paramètres
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const cacheKey = `anime_api_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Vérifier le cache
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Effectuer la requête
    const response = await fetch(url.toString());
    
    // Vérifier si la requête a réussi
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur: ${response.status} ${response.statusText}`);
    }
    
    // Parser la réponse
    const data = await response.json();
    
    // Mettre en cache
    await this.cache.set(cacheKey, JSON.stringify(data), cacheTTL);
    
    return data;
  }

  /**
   * Récupère les informations d'un anime par son ID
   * @param {string} id - L'ID de l'anime
   * @returns {Promise<Anime>} - L'anime récupéré
   */
  async getAnime(id) {
    const data = await this.fetchFromAPI(`/anime/${id}`);
    
    if (data && data.success && data.data) {
      return new Anime(data.data, this.source);
    }
    
    throw new Error('Anime non trouvé');
  }

  /**
   * Récupère les épisodes d'un anime
   * @param {string} id - L'ID de l'anime
   * @returns {Promise<Object>} - Les épisodes récupérés
   */
  async getAnimeEpisodes(id) {
    const data = await this.fetchFromAPI(`/anime/${id}/episodes`);
    return data;
  }

  /**
   * Récupère les personnages d'un anime
   * @param {string} id - L'ID de l'anime
   * @returns {Promise<Object>} - Les personnages récupérés
   */
  async getAnimeCharacters(id) {
    const data = await this.fetchFromAPI(`/anime/${id}/characters`);
    return data;
  }

  /**
   * Récupère les informations de streaming d'un anime
   * @param {string} id - L'ID de l'anime
   * @param {number} episode - Le numéro de l'épisode
   * @returns {Promise<Object>} - Les informations de streaming
   */
  async getAnimeStreaming(id, episode) {
    const data = await this.fetchFromAPI(`/anime/${id}/streaming/${episode}`);
    return data;
  }

  /**
   * Recherche des animes
   * @param {string} query - Le terme de recherche
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchAnime(query) {
    const data = await this.fetchFromAPI('/search', { q: query });
    
    if (data && data.success && data.data) {
      return {
        ...data,
        data: data.data.map(item => new Anime(item, this.source))
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère les animes en tendance
   * @returns {Promise<Array<Anime>>} - Les animes en tendance
   */
  async getTrendingAnime() {
    const data = await this.fetchFromAPI('/trending');
    
    if (data && data.success && data.data) {
      return data.data.map(item => {
        const anime = new Anime(item, this.source);
        anime.is_trending = true;
        return anime;
      });
    }
    
    return [];
  }

  /**
   * Récupère les animes récents
   * @returns {Promise<Array<Anime>>} - Les animes récents
   */
  async getRecentAnime() {
    const data = await this.fetchFromAPI('/recent');
    
    if (data && data.success && data.data) {
      return data.data.map(item => new Anime(item, this.source));
    }
    
    return [];
  }

  /**
   * Récupère les animes populaires
   * @returns {Promise<Array<Anime>>} - Les animes populaires
   */
  async getPopularAnime() {
    const data = await this.fetchFromAPI('/popular');
    
    if (data && data.success && data.data) {
      return data.data.map(item => new Anime(item, this.source));
    }
    
    return [];
  }

  /**
   * Récupère les animes par catégorie
   * @param {string} category - La catégorie
   * @returns {Promise<Array<Anime>>} - Les animes de la catégorie
   */
  async getAnimeByCategory(category) {
    const data = await this.fetchFromAPI(`/category/${category}`);
    
    if (data && data.success && data.data) {
      return data.data.map(item => new Anime(item, this.source));
    }
    
    return [];
  }
}

module.exports = AnimeApiService;
