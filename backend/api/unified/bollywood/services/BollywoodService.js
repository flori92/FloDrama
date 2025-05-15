const Cache = require('../../core/cache/Cache');
const Bollywood = require('../../core/models/Bollywood');

/**
 * Service pour interagir avec l'API Bollywood
 */
class BollywoodService {
  constructor(baseUrl = 'https://bollywood-api.vercel.app/api') {
    this.baseUrl = baseUrl;
    this.cache = new Cache();
    this.source = 'bollywood-api';
  }

  /**
   * Effectue une requête à l'API Bollywood avec gestion du cache
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
    
    const cacheKey = `bollywood_api_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
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
   * Récupère les informations d'un film Bollywood par son ID
   * @param {string} id - L'ID du film
   * @returns {Promise<Bollywood>} - Le film récupéré
   */
  async getMovie(id) {
    const data = await this.fetchFromAPI(`/movies/${id}`);
    
    if (data && data.data) {
      return new Bollywood(data.data, this.source);
    }
    
    throw new Error('Film non trouvé');
  }

  /**
   * Recherche des films Bollywood
   * @param {string} query - Le terme de recherche
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchMovies(query, page = 1, limit = 20) {
    const data = await this.fetchFromAPI('/movies', { 
      q: query,
      page,
      limit
    });
    
    if (data && data.data) {
      return {
        ...data,
        data: data.data.map(item => new Bollywood(item, this.source))
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère les films Bollywood en tendance
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films en tendance
   */
  async getTrendingMovies(limit = 15) {
    const data = await this.fetchFromAPI('/trending', { limit });
    
    if (data && data.data) {
      return data.data.map(item => {
        const movie = new Bollywood(item, this.source);
        movie.is_trending = true;
        return movie;
      });
    }
    
    return [];
  }

  /**
   * Récupère les films Bollywood récents
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films récents
   */
  async getRecentMovies(limit = 15) {
    const data = await this.fetchFromAPI('/recent', { limit });
    
    if (data && data.data) {
      return data.data.map(item => new Bollywood(item, this.source));
    }
    
    return [];
  }

  /**
   * Récupère les films Bollywood populaires
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films populaires
   */
  async getPopularMovies(limit = 15) {
    const data = await this.fetchFromAPI('/popular', { limit });
    
    if (data && data.data) {
      return data.data.map(item => new Bollywood(item, this.source));
    }
    
    return [];
  }

  /**
   * Récupère les films Bollywood par genre
   * @param {string} genre - Le genre
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films du genre
   */
  async getMoviesByGenre(genre, page = 1, limit = 20) {
    const data = await this.fetchFromAPI('/genres', { 
      genre,
      page,
      limit
    });
    
    if (data && data.data) {
      return {
        ...data,
        data: data.data.map(item => new Bollywood(item, this.source))
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère les films Bollywood par acteur
   * @param {string} actor - L'acteur
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films de l'acteur
   */
  async getMoviesByActor(actor, page = 1, limit = 20) {
    const data = await this.fetchFromAPI('/actors', { 
      actor,
      page,
      limit
    });
    
    if (data && data.data) {
      return {
        ...data,
        data: data.data.map(item => new Bollywood(item, this.source))
      };
    }
    
    return { data: [] };
  }

  /**
   * Récupère les films Bollywood par réalisateur
   * @param {string} director - Le réalisateur
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films du réalisateur
   */
  async getMoviesByDirector(director, page = 1, limit = 20) {
    const data = await this.fetchFromAPI('/directors', { 
      director,
      page,
      limit
    });
    
    if (data && data.data) {
      return {
        ...data,
        data: data.data.map(item => new Bollywood(item, this.source))
      };
    }
    
    return { data: [] };
  }
}

module.exports = BollywoodService;
