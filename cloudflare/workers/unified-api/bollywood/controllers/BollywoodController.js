const BollywoodService = require('../services/BollywoodService');
const BollywoodApiService = require('../services/BollywoodApiService');
const BollywoodScraperService = require('../services/BollywoodScraperService');
const StreamingSourcesService = require('../../core/services/StreamingSourcesService');
const StreamingProxyService = require('../../anime/services/StreamingProxyService');

/**
 * Contrôleur pour gérer les requêtes liées aux films Bollywood
 * Utilise plusieurs services en cascade pour assurer la disponibilité des données
 */
class BollywoodController {
  constructor() {
    // Services principaux
    this.bollywoodService = new BollywoodService();
    this.bollywoodApiService = new BollywoodApiService();
    this.bollywoodScraperService = new BollywoodScraperService();
    
    // Services auxiliaires
    this.streamingSourcesService = new StreamingSourcesService();
    this.streamingProxyService = new StreamingProxyService();
    
    // Ordre des services pour le fallback
    this.services = [
      this.bollywoodApiService,  // TMDB avec filtres Bollywood (principal)
      this.bollywoodService,     // API Bollywood originale (fallback 1)
      this.bollywoodScraperService // Scraping des sites Bollywood (fallback 2)
    ];
  }

  /**
   * Récupère un film Bollywood par son ID
   * @param {string|number} id - L'ID du film
   * @returns {Promise<Object>} - Le film récupéré
   */
  async getMovieById(id) {
    // Tentative en cascade sur tous les services disponibles
    for (const service of this.services) {
      try {
        const movie = await service.getMovie(id);
        if (movie) {
          console.log(`Film Bollywood ${id} trouvé via ${service.constructor.name}`);
          return movie;
        }
      } catch (error) {
        console.log(`Erreur pour le film Bollywood ${id} via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a fonctionné
    console.log(`Film Bollywood ${id} non trouvé sur tous les services`);
    throw new Error(`Film non trouvé: ${id}`);
  }

  /**
   * Recherche des films Bollywood
   * @param {Object} params - Les paramètres de recherche
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchMovies(params) {
    const { q, page = 1, limit = 20 } = params;
    
    // Si pas de terme de recherche, retourner un tableau vide
    if (!q) {
      return { data: [] };
    }
    
    // Tentative en cascade sur tous les services disponibles
    for (const service of this.services) {
      try {
        const result = await service.searchMovies(q, page, limit);
        if (result && result.data && result.data.length > 0) {
          console.log(`Recherche Bollywood pour "${q}" réussie via ${service.constructor.name}`);
          return result;
        }
      } catch (error) {
        console.log(`Erreur pour la recherche Bollywood "${q}" via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a retourné de résultats
    console.log(`Aucun résultat pour la recherche Bollywood "${q}" sur tous les services`);
    return { data: [] };
  }

  /**
   * Récupère les films Bollywood en tendance
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films en tendance
   */
  async getTrendingMovies(limit = 15) {
    // Tentative en cascade sur tous les services disponibles
    for (const service of this.services) {
      try {
        const movies = await service.getTrendingMovies(limit);
        if (movies && movies.length > 0) {
          console.log(`Films Bollywood en tendance trouvés via ${service.constructor.name}`);
          return movies;
        }
      } catch (error) {
        console.log(`Erreur pour les films Bollywood en tendance via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a fonctionné
    console.log(`Aucun film Bollywood en tendance trouvé sur tous les services`);
    return [];
  }

  /**
   * Récupère les films Bollywood récents
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films récents
   */
  async getRecentMovies(limit = 15) {
    // Tentative en cascade sur tous les services disponibles
    for (const service of this.services) {
      try {
        // Utiliser getRecentMovies ou scrapeRecentFilms selon le service
        const methodName = service === this.bollywoodScraperService ? 'scrapeRecentFilms' : 'getRecentMovies';
        const movies = await service[methodName](limit);
        
        if (movies && movies.length > 0) {
          console.log(`Films Bollywood récents trouvés via ${service.constructor.name}`);
          return movies;
        }
      } catch (error) {
        console.log(`Erreur pour les films Bollywood récents via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a fonctionné
    console.log(`Aucun film Bollywood récent trouvé sur tous les services`);
    return [];
  }

  /**
   * Récupère les films Bollywood populaires
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films populaires
   */
  async getPopularMovies(limit = 15) {
    // Tentative en cascade sur tous les services disponibles
    for (const service of this.services) {
      try {
        // Utiliser getPopularMovies ou scrapePopularFilms selon le service
        const methodName = service === this.bollywoodScraperService ? 'scrapePopularFilms' : 'getPopularMovies';
        const movies = await service[methodName](limit);
        
        if (movies && movies.length > 0) {
          console.log(`Films Bollywood populaires trouvés via ${service.constructor.name}`);
          return movies;
        }
      } catch (error) {
        console.log(`Erreur pour les films Bollywood populaires via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a fonctionné
    console.log(`Aucun film Bollywood populaire trouvé sur tous les services`);
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
    // Tentative en cascade sur tous les services disponibles
    for (const service of this.services) {
      try {
        // Utiliser getMoviesByGenre ou getFilmsByGenre selon le service
        const methodName = service === this.bollywoodScraperService ? 'getFilmsByGenre' : 'getMoviesByGenre';
        const result = await service[methodName](genre, page, limit);
        
        if (result && ((result.data && result.data.length > 0) || (Array.isArray(result) && result.length > 0))) {
          console.log(`Films Bollywood du genre ${genre} trouvés via ${service.constructor.name}`);
          
          // Normaliser le format de retour
          if (Array.isArray(result)) {
            return { 
              data: result,
              page: page,
              total_pages: 1,
              total_results: result.length
            };
          }
          
          return result;
        }
      } catch (error) {
        console.log(`Erreur pour les films Bollywood du genre ${genre} via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a fonctionné
    console.log(`Aucun film Bollywood du genre ${genre} trouvé sur tous les services`);
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
    // Tentative en cascade sur les services qui supportent cette fonctionnalité
    const supportedServices = [this.bollywoodApiService, this.bollywoodService];
    
    for (const service of supportedServices) {
      try {
        const result = await service.getMoviesByActor(actor, page, limit);
        
        if (result && result.data && result.data.length > 0) {
          console.log(`Films Bollywood de l'acteur ${actor} trouvés via ${service.constructor.name}`);
          return result;
        }
      } catch (error) {
        console.log(`Erreur pour les films Bollywood de l'acteur ${actor} via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a fonctionné
    console.log(`Aucun film Bollywood de l'acteur ${actor} trouvé sur tous les services`);
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
    // Tentative en cascade sur les services qui supportent cette fonctionnalité
    const supportedServices = [this.bollywoodApiService, this.bollywoodService];
    
    for (const service of supportedServices) {
      try {
        const result = await service.getMoviesByDirector(director, page, limit);
        
        if (result && result.data && result.data.length > 0) {
          console.log(`Films Bollywood du réalisateur ${director} trouvés via ${service.constructor.name}`);
          return result;
        }
      } catch (error) {
        console.log(`Erreur pour les films Bollywood du réalisateur ${director} via ${service.constructor.name}: ${error.message}`);
        // Continue avec le service suivant
      }
    }
    
    // Si on arrive ici, aucun service n'a fonctionné
    console.log(`Aucun film Bollywood du réalisateur ${director} trouvé sur tous les services`);
    return { data: [] };
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
      
      // Essayer d'abord avec le service de scraping dédié
      try {
        if (this.bollywoodScraperService) {
          const streamingInfo = await this.bollywoodScraperService.getStreamingSources(id, movie.title);
          
          if (streamingInfo && streamingInfo.found && streamingInfo.sources && streamingInfo.sources.length > 0) {
            // Optimiser les sources avec le proxy
            streamingInfo.sources = this.streamingProxyService.optimizeSources(
              streamingInfo.sources, 
              streamingInfo.referer || `https://api.flodrama.com/api/bollywood/${id}`
            );
            
            console.log(`Sources de streaming pour le film Bollywood ${id} trouvées via le scraper`);
            return streamingInfo;
          }
        }
      } catch (error) {
        console.log(`Erreur lors de la récupération des sources via le scraper pour ${id}: ${error.message}`);
        // Continue avec le service générique
      }
      
      // Fallback: Rechercher les sources de streaming avec le service générique
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
