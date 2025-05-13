const FilmApiService = require('../services/FilmApiService');
const FilmScraperService = require('../services/FilmScraperService');

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
}

module.exports = FilmController;
