const BollywoodService = require('../services/BollywoodService');
const StreamingSourcesService = require('../../core/services/StreamingSourcesService');
const StreamingProxyService = require('../../anime/services/StreamingProxyService');

/**
 * Contrôleur pour gérer les requêtes liées aux films Bollywood
 */
class BollywoodController {
  constructor() {
    this.bollywoodService = new BollywoodService();
    this.streamingSourcesService = new StreamingSourcesService();
    this.streamingProxyService = new StreamingProxyService();
  }

  /**
   * Récupère un film Bollywood par son ID
   * @param {string|number} id - L'ID du film
   * @returns {Promise<Object>} - Le film récupéré
   */
  async getMovieById(id) {
    try {
      return await this.bollywoodService.getMovie(id);
    } catch (error) {
      console.log(`Erreur pour le film Bollywood ${id}: ${error.message}`);
      throw new Error(`Film non trouvé: ${id}`);
    }
  }

  /**
   * Recherche des films Bollywood
   * @param {Object} params - Les paramètres de recherche
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchMovies(params) {
    const { q, page = 1, limit = 20 } = params;
    
    try {
      // Si nous avons un terme de recherche, effectuer la recherche
      if (q) {
        return await this.bollywoodService.searchMovies(q, page, limit);
      }
      
      // Sinon, retourner un tableau vide
      return { data: [] };
    } catch (error) {
      console.log(`Erreur pour la recherche de films Bollywood: ${error.message}`);
      return { data: [] };
    }
  }

  /**
   * Récupère les films Bollywood en tendance
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films en tendance
   */
  async getTrendingMovies(limit = 15) {
    try {
      return await this.bollywoodService.getTrendingMovies(limit);
    } catch (error) {
      console.log(`Erreur pour les films Bollywood en tendance: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films Bollywood récents
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films récents
   */
  async getRecentMovies(limit = 15) {
    try {
      return await this.bollywoodService.getRecentMovies(limit);
    } catch (error) {
      console.log(`Erreur pour les films Bollywood récents: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films Bollywood populaires
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films populaires
   */
  async getPopularMovies(limit = 15) {
    try {
      return await this.bollywoodService.getPopularMovies(limit);
    } catch (error) {
      console.log(`Erreur pour les films Bollywood populaires: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les films Bollywood par genre
   * @param {string} genre - Le genre
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films du genre
   */
  async getMoviesByGenre(genre, page = 1, limit = 20) {
    try {
      return await this.bollywoodService.getMoviesByGenre(genre, page, limit);
    } catch (error) {
      console.log(`Erreur pour les films Bollywood du genre ${genre}: ${error.message}`);
      return { data: [] };
    }
  }

  /**
   * Récupère les films Bollywood par acteur
   * @param {string} actor - L'acteur
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films de l'acteur
   */
  async getMoviesByActor(actor, page = 1, limit = 20) {
    try {
      return await this.bollywoodService.getMoviesByActor(actor, page, limit);
    } catch (error) {
      console.log(`Erreur pour les films Bollywood de l'acteur ${actor}: ${error.message}`);
      return { data: [] };
    }
  }

  /**
   * Récupère les films Bollywood par réalisateur
   * @param {string} director - Le réalisateur
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les films du réalisateur
   */
  async getMoviesByDirector(director, page = 1, limit = 20) {
    try {
      return await this.bollywoodService.getMoviesByDirector(director, page, limit);
    } catch (error) {
      console.log(`Erreur pour les films Bollywood du réalisateur ${director}: ${error.message}`);
      return { data: [] };
    }
  }

  /**
   * Récupère les informations de streaming d'un film Bollywood
   * @param {string|number} id - L'ID du film
   * @returns {Promise<Object>} - Les informations de streaming
   */
  async getMovieStreaming(id) {
    try {
      // Récupérer les informations du film
      const movie = await this.getMovieById(id);
      
      // Rechercher les sources de streaming
      const streamingInfo = await this.streamingSourcesService.findBollywoodStreamingSources(movie);
      
      // Optimiser les sources avec le proxy
      if (streamingInfo && streamingInfo.sources) {
        streamingInfo.sources = this.streamingProxyService.optimizeSources(
          streamingInfo.sources, 
          streamingInfo.referer || `https://api.flodrama.com/api/bollywood/${id}`
        );
      }
      
      return streamingInfo;
    } catch (error) {
      console.log(`Erreur pour le streaming du film Bollywood ${id}: ${error.message}`);
      throw new Error(`Informations de streaming non trouvées pour le film: ${id}`);
    }
  }
}

module.exports = BollywoodController;
