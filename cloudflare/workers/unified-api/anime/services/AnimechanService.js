const Cache = require('../../core/cache/Cache');

/**
 * Service pour interagir avec l'API Animechan (citations d'anime)
 */
class AnimechanService {
  constructor(baseUrl = 'https://animechan.xyz/api') {
    this.baseUrl = baseUrl;
    this.cache = new Cache();
    this.source = 'animechan';
  }

  /**
   * Effectue une requête à l'API Animechan avec gestion du cache
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
    
    const cacheKey = `animechan_api_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
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
   * Récupère une citation aléatoire
   * @returns {Promise<Object>} - Une citation aléatoire
   */
  async getRandomQuote() {
    return await this.fetchFromAPI('/random');
  }

  /**
   * Récupère plusieurs citations aléatoires
   * @param {number} count - Le nombre de citations à récupérer (max 10)
   * @returns {Promise<Array<Object>>} - Les citations aléatoires
   */
  async getRandomQuotes(count = 10) {
    // Limiter le nombre de citations à 10 (limite de l'API)
    const safeCount = Math.min(Math.max(1, count), 10);
    return await this.fetchFromAPI(`/quotes/${safeCount}`);
  }

  /**
   * Récupère une citation aléatoire d'un anime spécifique
   * @param {string} anime - Le nom de l'anime
   * @returns {Promise<Object>} - Une citation aléatoire de l'anime
   */
  async getQuoteByAnime(anime) {
    return await this.fetchFromAPI('/random/anime', { title: anime });
  }

  /**
   * Récupère plusieurs citations d'un anime spécifique
   * @param {string} anime - Le nom de l'anime
   * @param {number} page - Le numéro de page
   * @returns {Promise<Array<Object>>} - Les citations de l'anime
   */
  async getQuotesByAnime(anime, page = 1) {
    return await this.fetchFromAPI('/quotes/anime', { title: anime, page });
  }

  /**
   * Récupère une citation aléatoire d'un personnage spécifique
   * @param {string} character - Le nom du personnage
   * @returns {Promise<Object>} - Une citation aléatoire du personnage
   */
  async getQuoteByCharacter(character) {
    return await this.fetchFromAPI('/random/character', { name: character });
  }

  /**
   * Récupère plusieurs citations d'un personnage spécifique
   * @param {string} character - Le nom du personnage
   * @param {number} page - Le numéro de page
   * @returns {Promise<Array<Object>>} - Les citations du personnage
   */
  async getQuotesByCharacter(character, page = 1) {
    return await this.fetchFromAPI('/quotes/character', { name: character, page });
  }
}

module.exports = AnimechanService;
