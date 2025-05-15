/**
 * Service pour scraper les films Bollywood à partir de sources externes
 * Utilise les sources validées BollyPlay et HindiLinks4U
 */

const Cache = require('../../core/cache/Cache');
const Bollywood = require('../../core/models/Bollywood');
const fetch = require('node-fetch');

class BollywoodScraperService {
  constructor() {
    this.cache = new Cache();
    this.source = 'bollywood-scraper';
    
    // Configuration des sources de streaming validées pour Bollywood
    this.streamingSources = [
      {
        name: 'bollyplay',
        baseUrl: 'https://bollyplay.app',
        alternativeDomains: ['bollyplay.tv', 'bollyplay.cc', 'bollyplay.film'],
        searchEndpoint: '/search/',
        needsCloudflareBypass: true,
        expirationHours: 12,
        testUrl: 'https://bollyplay.app/movies/pathaan-2023/',
        waitSelector: '.movies-list',
        mainSelector: '.ml-item'
      },
      {
        name: 'hindilinks4u',
        baseUrl: 'https://hindilinks4u.skin',
        alternativeDomains: ['hindilinks4u.to', 'hindilinks4u.co', 'hindilinks4u.app'],
        searchEndpoint: '/?s=',
        needsCloudflareBypass: true,
        expirationHours: 12,
        testUrl: 'https://hindilinks4u.skin/jawan-2023-hindi-movie/',
        waitSelector: '.film-list',
        mainSelector: '.film-item'
      }
    ];
    
    // URL de l'API de scraping Cloudflare Worker
    this.scraperApiUrl = 'https://flodrama-scraper.florifavi.workers.dev';
  }

  /**
   * Effectue une requête au service de scraping avec gestion du cache
   * @param {string} endpoint - Le endpoint de l'API
   * @param {Object} params - Les paramètres de la requête
   * @returns {Promise<Object>} - La réponse de l'API
   * @private
   */
  async _fetchFromScraper(endpoint, params = {}) {
    // Construire l'URL avec les paramètres
    const url = new URL(`${this.scraperApiUrl}${endpoint}`);
    
    // Ajouter les paramètres spécifiques
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
    
    // Créer une clé de cache
    const cacheKey = `bollywood_scraper_${url.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Vérifier le cache
    const cachedData = await this.cache.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    try {
      // Effectuer la requête
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Erreur API Scraper: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Mettre en cache les résultats (12 heures)
      await this.cache.set(cacheKey, JSON.stringify(data), 43200);
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la requête au scraper: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convertit un film scrapé en objet Bollywood
   * @param {Object} scrapedMovie - Le film scrapé
   * @returns {Bollywood} - L'objet Bollywood
   * @private
   */
  _convertToBollywood(scrapedMovie) {
    return new Bollywood({
      id: scrapedMovie.id || `scraper-${Date.now()}`,
      title: scrapedMovie.title || '',
      original_title: scrapedMovie.original_title || scrapedMovie.title || '',
      overview: scrapedMovie.overview || scrapedMovie.description || '',
      poster_path: scrapedMovie.poster_path || scrapedMovie.poster || '',
      backdrop_path: scrapedMovie.backdrop_path || scrapedMovie.backdrop || '',
      release_date: scrapedMovie.release_date || '',
      year: scrapedMovie.year || (scrapedMovie.release_date ? new Date(scrapedMovie.release_date).getFullYear() : null),
      vote_average: scrapedMovie.vote_average || scrapedMovie.rating || 0,
      vote_count: scrapedMovie.vote_count || 0,
      popularity: scrapedMovie.popularity || 0,
      adult: scrapedMovie.adult || false,
      genres: scrapedMovie.genres || [],
      production_company: scrapedMovie.production_company || '',
      language: 'Hindi',
      cast: Array.isArray(scrapedMovie.cast) ? scrapedMovie.cast : [],
      director: scrapedMovie.director || '',
      music_director: scrapedMovie.music_director || '',
      is_trending: scrapedMovie.is_trending || false,
      is_featured: scrapedMovie.is_featured || false,
      source_url: scrapedMovie.source_url || '',
      source_name: scrapedMovie.source_name || this.source
    }, this.source);
  }

  /**
   * Scrape les films Bollywood populaires
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films populaires
   */
  async scrapePopularFilms(limit = 15) {
    try {
      const cacheKey = `bollywood_popular_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Récupérer les films populaires depuis le scraper
      const data = await this._fetchFromScraper('/scrape/bollywood/popular', { limit });
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Format de réponse invalide du scraper');
      }
      
      // Convertir les résultats
      const results = data.results
        .map(movie => this._convertToBollywood(movie))
        .slice(0, limit);
      
      // Mettre en cache les résultats (6 heures)
      await this.cache.set(cacheKey, JSON.stringify(results), 21600);
      
      return results;
    } catch (error) {
      console.error(`Erreur lors du scraping des films populaires: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape les films Bollywood récents
   * @param {number} limit - Le nombre de films à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films récents
   */
  async scrapeRecentFilms(limit = 15) {
    try {
      const cacheKey = `bollywood_recent_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Récupérer les films récents depuis le scraper
      const data = await this._fetchFromScraper('/scrape/bollywood/recent', { limit });
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Format de réponse invalide du scraper');
      }
      
      // Convertir les résultats
      const results = data.results
        .map(movie => this._convertToBollywood(movie))
        .slice(0, limit);
      
      // Mettre en cache les résultats (6 heures)
      await this.cache.set(cacheKey, JSON.stringify(results), 21600);
      
      return results;
    } catch (error) {
      console.error(`Erreur lors du scraping des films récents: ${error.message}`);
      return [];
    }
  }

  /**
   * Recherche des films Bollywood par mot-clé
   * @param {string} query - Le terme de recherche
   * @param {number} limit - Le nombre de résultats à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films trouvés
   */
  async searchFilms(query, limit = 15) {
    try {
      const cacheKey = `bollywood_search_${query.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Récupérer les résultats de recherche depuis le scraper
      const data = await this._fetchFromScraper('/scrape/bollywood/search', { 
        query, 
        limit 
      });
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Format de réponse invalide du scraper');
      }
      
      // Convertir les résultats
      const results = data.results
        .map(movie => this._convertToBollywood(movie))
        .slice(0, limit);
      
      // Mettre en cache les résultats (6 heures)
      await this.cache.set(cacheKey, JSON.stringify(results), 21600);
      
      return results;
    } catch (error) {
      console.error(`Erreur lors de la recherche de films: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape les détails d'un film Bollywood spécifique
   * @param {string} id - L'identifiant du film
   * @returns {Promise<Bollywood|null>} - Les détails du film
   */
  async scrapeFilmDetails(id) {
    try {
      const cacheKey = `bollywood_details_${id}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Récupérer les détails du film depuis le scraper
      const data = await this._fetchFromScraper('/scrape/bollywood/details', { id });
      
      if (!data || !data.movie) {
        throw new Error('Format de réponse invalide du scraper');
      }
      
      // Convertir le résultat
      const result = this._convertToBollywood(data.movie);
      
      // Mettre en cache les résultats (12 heures)
      await this.cache.set(cacheKey, JSON.stringify(result), 43200);
      
      return result;
    } catch (error) {
      console.error(`Erreur lors du scraping des détails du film ${id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Récupère les informations de streaming pour un film Bollywood
   * @param {string} id - L'identifiant du film
   * @param {string} title - Le titre du film (pour la recherche)
   * @returns {Promise<Object>} - Les informations de streaming
   */
  async getStreamingSources(id, title) {
    try {
      const cacheKey = `bollywood_streaming_${id}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Récupérer les sources de streaming depuis le scraper
      const data = await this._fetchFromScraper('/scrape/bollywood/streaming', { 
        id, 
        title 
      });
      
      if (!data) {
        throw new Error('Format de réponse invalide du scraper');
      }
      
      // Mettre en cache les résultats (6 heures)
      await this.cache.set(cacheKey, JSON.stringify(data), 21600);
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des sources de streaming pour ${id}: ${error.message}`);
      return {
        found: false,
        sources: []
      };
    }
  }

  /**
   * Récupère les films Bollywood par genre
   * @param {string} genre - Le genre recherché
   * @param {number} limit - Le nombre de résultats à récupérer
   * @returns {Promise<Array<Bollywood>>} - Les films du genre
   */
  async getFilmsByGenre(genre, limit = 15) {
    try {
      const cacheKey = `bollywood_genre_${genre.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Récupérer les films par genre depuis le scraper
      const data = await this._fetchFromScraper('/scrape/bollywood/genre', { 
        genre, 
        limit 
      });
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Format de réponse invalide du scraper');
      }
      
      // Convertir les résultats
      const results = data.results
        .map(movie => this._convertToBollywood(movie))
        .slice(0, limit);
      
      // Mettre en cache les résultats (12 heures)
      await this.cache.set(cacheKey, JSON.stringify(results), 43200);
      
      return results;
    } catch (error) {
      console.error(`Erreur lors de la récupération des films du genre ${genre}: ${error.message}`);
      return [];
    }
  }
}

module.exports = BollywoodScraperService;
