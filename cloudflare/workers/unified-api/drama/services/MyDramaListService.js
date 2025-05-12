const Cache = require('../../core/cache/Cache');
const Drama = require('../../core/models/Drama');

/**
 * Service pour interagir avec l'API MyDramaList
 */
class MyDramaListService {
  constructor(baseUrl = 'https://mydramalist.github.io/MDL-API') {
    this.baseUrl = baseUrl;
    this.cache = new Cache();
    this.source = 'mydramalist';
    
    // Clé API fictive (à remplacer par une vraie clé si disponible)
    // Utilisation de l'objet global env pour Cloudflare Workers au lieu de process.env
    this.apiKey = (typeof env !== 'undefined' && env.MYDRAMALIST_API_KEY) ? env.MYDRAMALIST_API_KEY : '';
  }

  /**
   * Effectue une requête à l'API MyDramaList avec gestion du cache
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
    
    // Ajouter la clé API si disponible
    if (this.apiKey) {
      url.searchParams.append('apikey', this.apiKey);
    }
    
    const cacheKey = `mdl_api_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Vérifier le cache
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Effectuer la requête
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FloDrama/1.0'
      }
    });
    
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
   * Récupère les informations d'un drama par son ID
   * @param {string|number} id - L'ID du drama
   * @returns {Promise<Drama>} - Le drama récupéré
   */
  async getDrama(id) {
    const data = await this.fetchFromAPI(`/drama/${id}`);
    
    if (data) {
      return new Drama(data, this.source);
    }
    
    throw new Error('Drama non trouvé');
  }

  /**
   * Recherche des dramas
   * @param {string} query - Le terme de recherche
   * @param {number} page - Le numéro de page
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchDramas(query, page = 1) {
    const data = await this.fetchFromAPI('/search', { 
      q: query,
      page
    });
    
    if (data && data.results) {
      return {
        data: data.results.map(item => new Drama(item, this.source)),
        pagination: {
          current_page: page,
          total_pages: data.total_pages || 1,
          total_results: data.total_results || data.results.length
        }
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère les dramas en tendance
   * @param {number} limit - Le nombre de dramas à récupérer
   * @returns {Promise<Array<Drama>>} - Les dramas en tendance
   */
  async getTrendingDramas(limit = 15) {
    const data = await this.fetchFromAPI('/trending', { limit });
    
    if (data && data.results) {
      return data.results.slice(0, limit).map(item => {
        const drama = new Drama(item, this.source);
        drama.is_trending = true;
        return drama;
      });
    }
    
    return [];
  }

  /**
   * Récupère les dramas récents
   * @param {number} limit - Le nombre de dramas à récupérer
   * @returns {Promise<Array<Drama>>} - Les dramas récents
   */
  async getRecentDramas(limit = 15) {
    const data = await this.fetchFromAPI('/recent', { limit });
    
    if (data && data.results) {
      return data.results.slice(0, limit).map(item => new Drama(item, this.source));
    }
    
    return [];
  }

  /**
   * Récupère les dramas populaires
   * @param {number} limit - Le nombre de dramas à récupérer
   * @returns {Promise<Array<Drama>>} - Les dramas populaires
   */
  async getPopularDramas(limit = 15) {
    const data = await this.fetchFromAPI('/popular', { limit });
    
    if (data && data.results) {
      return data.results.slice(0, limit).map(item => new Drama(item, this.source));
    }
    
    return [];
  }

  /**
   * Récupère les dramas par genre
   * @param {string} genre - Le genre
   * @param {number} page - Le numéro de page
   * @returns {Promise<Object>} - Les dramas du genre
   */
  async getDramasByGenre(genre, page = 1) {
    const data = await this.fetchFromAPI('/genre', { 
      genre,
      page
    });
    
    if (data && data.results) {
      return {
        data: data.results.map(item => new Drama(item, this.source)),
        pagination: {
          current_page: page,
          total_pages: data.total_pages || 1,
          total_results: data.total_results || data.results.length
        }
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère les dramas par pays
   * @param {string} country - Le pays
   * @param {number} page - Le numéro de page
   * @returns {Promise<Object>} - Les dramas du pays
   */
  async getDramasByCountry(country, page = 1) {
    const data = await this.fetchFromAPI('/country', { 
      country,
      page
    });
    
    if (data && data.results) {
      return {
        data: data.results.map(item => new Drama(item, this.source)),
        pagination: {
          current_page: page,
          total_pages: data.total_pages || 1,
          total_results: data.total_results || data.results.length
        }
      };
    }
    
    return { data: [] };
  }
}

module.exports = MyDramaListService;
