const FilmApiService = require('../services/FilmApiService');
const FilmScraperService = require('../services/FilmScraperService');
const { testFilms } = require('../data/test-data');

/**
 * Contrôleur pour gérer les requêtes liées aux films
 * Combine API publiques et scraping pour robustesse et fallback
 */
class FilmController {
  constructor() {
    this.filmApiService = new FilmApiService();
    this.filmScraperService = new FilmScraperService();
  }

  /**
   * Récupère les films populaires
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films populaires
   */
  async getPopularFilms(limit = 15) {
    // 1. Essayer via le scraping (prioritaire pour les films asiatiques)
    try {
      const scraped = await this.filmScraperService.scrapePopularFilms(limit);
      if (Array.isArray(scraped) && scraped.length > 0) {
        console.log(`[FilmController] Films populaires récupérés par scraping: ${scraped.length}`);
        return scraped.slice(0, limit);
      }
    } catch (error) {
      console.log(`[FilmController] Erreur Scraping populaire: ${error.message}`);
    }
    
    // 2. Fallback via l'API
    try {
      const apiResults = await this.filmApiService.getPopularFilms(limit);
      if (Array.isArray(apiResults) && apiResults.length > 0) {
        console.log(`[FilmController] Films populaires récupérés par API: ${apiResults.length}`);
        return apiResults.slice(0, limit);
      }
    } catch (error) {
      console.log(`[FilmController] Erreur API populaire: ${error.message}`);
    }
    
    // 3. Fallback vide
    return [];
  }

  /**
   * Recherche des films
   * @param {Object} params - Les paramètres de recherche
   * @returns {Promise<Array>} - Les résultats de la recherche
   */
  async searchFilms(params) {
    // 1. Essayer via le scraping (prioritaire pour les films asiatiques)
    try {
      const scraped = await this.filmScraperService.scrapeFilmSearch(params);
      if (Array.isArray(scraped) && scraped.length > 0) {
        console.log(`[FilmController] Recherche films récupérés par scraping: ${scraped.length}`);
        return scraped;
      }
    } catch (error) {
      console.log(`[FilmController] Erreur Scraping search: ${error.message}`);
    }
    
    // 2. Fallback via l'API
    try {
      const apiResults = await this.filmApiService.searchFilms(params);
      if (Array.isArray(apiResults) && apiResults.length > 0) {
        console.log(`[FilmController] Recherche films récupérés par API: ${apiResults.length}`);
        return apiResults;
      }
    } catch (error) {
      console.log(`[FilmController] Erreur API search: ${error.message}`);
    }
    
    return [];
  }

  /**
   * Récupère un film par ID
   * @param {string|number} id - L'ID du film
   * @returns {Promise<Object|null>} - Le film ou null
   */
  async getFilmById(id) {
    try {
      const apiResult = await this.filmApiService.getFilmById(id);
      if (apiResult) {
        return apiResult;
      }
    } catch (error) {
      console.log(`[FilmController] Erreur API getById: ${error.message}`);
    }
    try {
      const scraped = await this.filmScraperService.scrapeFilmById(id);
      if (scraped) {
        return scraped;
      }
    } catch (error) {
      console.log(`[FilmController] Erreur Scraping getById: ${error.message}`);
    }
    return null;
  }

  /**
   * Récupère les films tendance
   * @param {Object} request - La requête avec les paramètres
   * @returns {Promise<Object>} - Les films tendance
   */
  async getTrendingMovies(request) {
    const limit = parseInt(request?.query?.limit) || 15;
    console.log(`[FilmController] Récupération des films tendance, limit: ${limit}`);
    
    let movies = [];
    
    // 1. Essayer via le scraping (prioritaire pour les films asiatiques)
    try {
      const scraped = await this.filmScraperService.scrapeTrendingFilms(limit);
      if (Array.isArray(scraped) && scraped.length > 0) {
        console.log(`[FilmController] Films tendance récupérés par scraping: ${scraped.length}`);
        movies = scraped.slice(0, limit);
        return { data: movies };
      }
    } catch (error) {
      console.log(`[FilmController] Erreur Scraping tendance: ${error.message}`);
    }
    
    // 2. Fallback via l'API
    try {
      const apiResults = await this.filmApiService.getTrendingFilms(limit);
      if (Array.isArray(apiResults) && apiResults.length > 0) {
        console.log(`[FilmController] Films tendance récupérés par API: ${apiResults.length}`);
        movies = apiResults.slice(0, limit);
        return { data: movies };
      }
    } catch (error) {
      console.log(`[FilmController] Erreur API tendance: ${error.message}`);
    }
    
    // 3. Fallback avec données de test
    console.log(`[FilmController] Utilisation des données de test pour les films tendance`);
    return { data: testFilms.slice(0, limit) };
  }

  /**
   * Récupère les films récents
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array>} - Les films récents
   */
  async getRecentMovies(limit = 15) {
    // 1. Essayer via le scraping (prioritaire pour les films asiatiques)
    try {
      const scraped = await this.filmScraperService.scrapeRecentFilms(limit);
      if (Array.isArray(scraped) && scraped.length > 0) {
        console.log(`[FilmController] Films récents récupérés par scraping: ${scraped.length}`);
        return scraped.slice(0, limit);
      }
    } catch (error) {
      console.log(`[FilmController] Erreur Scraping récents: ${error.message}`);
    }
    
    // 2. Fallback via l'API
    try {
      const apiResults = await this.filmApiService.getRecentFilms(limit);
      if (Array.isArray(apiResults) && apiResults.length > 0) {
        console.log(`[FilmController] Films récents récupérés par API: ${apiResults.length}`);
        return apiResults.slice(0, limit);
      }
    } catch (error) {
      console.log(`[FilmController] Erreur API récents: ${error.message}`);
    }
    
    // 3. Fallback avec données de test
    console.log(`[FilmController] Utilisation des données de test pour les films récents`);
    return testFilms.slice(0, limit);
  }

  /**
   * Récupère les films par genre
   * @param {string} genre - Le genre des films à récupérer
   * @param {number} page - La page à récupérer
   * @param {number} limit - Le nombre de films par page
   * @returns {Promise<Object>} - Les films du genre spécifié
   */
  async getMoviesByGenre(genre, page = 1, limit = 20) {
    try {
      const results = await this.filmApiService.getFilmsByGenre(genre, page, limit);
      return { data: results, page, total_pages: Math.ceil(results.length / limit) };
    } catch (error) {
      console.log(`[FilmController] Erreur API getByGenre: ${error.message}`);
      return { data: [], page: 1, total_pages: 0 };
    }
  }

  /**
   * Récupère les liens de streaming pour un film
   * @param {string|number} id - L'ID du film
   * @returns {Promise<Object>} - Les liens de streaming
   */
  async getMovieStreaming(id) {
    try {
      const streaming = await this.filmScraperService.scrapeFilmStreaming(id);
      return { data: streaming || [] };
    } catch (error) {
      console.log(`[FilmController] Erreur Scraping streaming: ${error.message}`);
      return { data: [] };
    }
  }

  /**
   * Alias pour getPopularFilms pour compatibilité avec l'API
   */
  async getPopularMovies(limit = 15) {
    return this.getPopularFilms(limit);
  }

  /**
   * Alias pour searchFilms pour compatibilité avec l'API
   */
  async searchMovies(params) {
    return { data: await this.searchFilms(params) };
  }

  /**
   * Alias pour getFilmById pour compatibilité avec l'API
   */
  async getMovieById(id) {
    return { data: await this.getFilmById(id) };
  }
}

module.exports = FilmController;
