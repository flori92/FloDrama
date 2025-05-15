const Cache = require('../../core/cache/Cache');
const Anime = require('../../core/models/Anime');

/**
 * Service pour interagir avec l'API Jikan (MyAnimeList)
 */
class JikanService {
  constructor(baseUrl = 'https://api.jikan.moe/v4') {
    this.baseUrl = baseUrl;
    this.cache = new Cache();
    this.source = 'jikan';
    
    // Limites de l'API Jikan
    this.rateLimit = {
      perMinute: 60,
      perSecond: 3,
      lastRequest: 0
    };
  }

  /**
   * Gère la limitation de débit de l'API
   * @returns {Promise<void>}
   */
  async handleRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimit.lastRequest;
    
    // Si moins de 350ms se sont écoulées depuis la dernière requête (~ 3 requêtes par seconde)
    if (timeSinceLastRequest < 350) {
      await new Promise(resolve => setTimeout(resolve, 350 - timeSinceLastRequest));
    }
    
    this.rateLimit.lastRequest = Date.now();
  }

  /**
   * Effectue une requête à l'API Jikan avec gestion du cache et des limites de débit
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
    
    const cacheKey = `jikan_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Vérifier le cache
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Gérer la limitation de débit
    await this.handleRateLimit();
    
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
   * @param {number} id - L'ID de l'anime
   * @returns {Promise<Anime>} - L'anime récupéré
   */
  async getAnime(id) {
    const data = await this.fetchFromAPI(`/anime/${id}`);
    
    if (data && data.data) {
      return new Anime(data.data, this.source);
    }
    
    throw new Error('Anime non trouvé');
  }

  /**
   * Récupère les informations complètes d'un anime par son ID
   * @param {number} id - L'ID de l'anime
   * @returns {Promise<Anime>} - L'anime récupéré avec toutes les informations
   */
  async getAnimeFullById(id) {
    const data = await this.fetchFromAPI(`/anime/${id}/full`);
    
    if (data && data.data) {
      return new Anime(data.data, this.source);
    }
    
    throw new Error('Anime non trouvé');
  }

  /**
   * Récupère les épisodes d'un anime
   * @param {number} id - L'ID de l'anime
   * @param {number} page - Le numéro de page
   * @returns {Promise<Object>} - Les épisodes récupérés
   */
  async getAnimeEpisodes(id, page = 1) {
    const data = await this.fetchFromAPI(`/anime/${id}/episodes`, { page });
    return data;
  }

  /**
   * Récupère les personnages d'un anime
   * @param {number} id - L'ID de l'anime
   * @returns {Promise<Object>} - Les personnages récupérés
   */
  async getAnimeCharacters(id) {
    const data = await this.fetchFromAPI(`/anime/${id}/characters`);
    return data;
  }

  /**
   * Recherche des animes
   * @param {Object} params - Les paramètres de recherche
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchAnime(params = {}) {
    const data = await this.fetchFromAPI('/anime', params);
    
    if (data && data.data) {
      return {
        ...data,
        data: data.data.map(item => new Anime(item, this.source))
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère un anime aléatoire
   * @returns {Promise<Anime>} - Un anime aléatoire
   */
  async getRandomAnime() {
    const data = await this.fetchFromAPI('/random/anime');
    
    if (data && data.data) {
      return new Anime(data.data, this.source);
    }
    
    throw new Error('Anime non trouvé');
  }

  /**
   * Récupère les animes en tendance (top anime)
   * @param {string} filter - Filtre (airing, upcoming, etc.)
   * @param {number} page - Numéro de page
   * @returns {Promise<Object>} - Les animes en tendance
   */
  async getTopAnime(filter = 'bypopularity', page = 1) {
    const data = await this.fetchFromAPI('/top/anime', { filter, page });
    
    if (data && data.data) {
      return {
        ...data,
        data: data.data.map(item => {
          const anime = new Anime(item, this.source);
          anime.is_trending = true;
          return anime;
        })
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère les recommandations pour un anime
   * @param {number} id - L'ID de l'anime
   * @returns {Promise<Object>} - Les recommandations
   */
  async getAnimeRecommendations(id) {
    const data = await this.fetchFromAPI(`/anime/${id}/recommendations`);
    return data;
  }
}

module.exports = JikanService;
