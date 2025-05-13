const Cache = require('../../core/cache/Cache');

/**
 * Service pour scraper des sites de films (fallback si API KO)
 * Utilise l'endpoint interne de scraping Cloudflare pour les films
 * Gère les tentatives multiples en cas d'échec (notamment pour KissAsian)
 */
class FilmScraperService {
  constructor() {
    // URL de base pour l'API de scraping Cloudflare
    this.scrapingBaseUrl = 'https://flodrama-content-api.florifavi.workers.dev/api/scrape/films';
    this.cache = new Cache();
    
    // Configuration des tentatives
    this.maxRetries = 5;         // Nombre maximum de tentatives
    this.retryDelay = 1000;      // Délai initial entre les tentatives (1s)
    this.retryBackoffFactor = 2; // Facteur de multiplication du délai à chaque tentative
  }

  /**
   * Méthode utilitaire pour effectuer des tentatives multiples sur une requête
   * @param {Function} requestFn - Fonction à exécuter avec tentatives
   * @param {string} operationName - Nom de l'opération pour le logging
   * @returns {Promise<any>} - Résultat de la requête
   * @private
   */
  async _retryRequest(requestFn, operationName) {
    let lastError;
    let delay = this.retryDelay;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Si c'est la dernière tentative, on propage l'erreur
        if (attempt === this.maxRetries) {
          console.error(`[FilmScraperService] Échec définitif de ${operationName} après ${attempt} tentatives: ${error.message}`);
          throw error;
        }
        
        // Log de l'échec et préparation de la prochaine tentative
        console.warn(`[FilmScraperService] Tentative ${attempt}/${this.maxRetries} échouée pour ${operationName}: ${error.message}. Nouvelle tentative dans ${delay}ms...`);
        
        // Attendre avant la prochaine tentative avec backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= this.retryBackoffFactor;
      }
    }
    
    // On ne devrait jamais arriver ici, mais au cas où
    throw lastError;
  }

  /**
   * Récupère les films populaires via scraping
   * @param {number} limit - Nombre de films à récupérer
   * @returns {Promise<Array>} - Liste des films populaires
   */
  async scrapePopularFilms(limit = 15) {
    try {
      // Clé de cache pour les films populaires
      const cacheKey = `scraped_popular_films_${limit}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Fonction de requête avec tentatives
      const fetchPopularFilms = async () => {
        const response = await fetch(`${this.scrapingBaseUrl}/popular?limit=${limit}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data.data) ? data.data : [];
      };
      
      // Exécuter la requête avec tentatives
      const results = await this._retryRequest(
        fetchPopularFilms,
        `scraping des films populaires (limit=${limit})`
      );
      
      // Mettre en cache les résultats (12 heures)
      if (results.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(results), 43200);
      }
      
      return results;
    } catch (error) {
      console.error(`[FilmScraperService] Erreur scrapePopularFilms: ${error.message}`);
      return [];
    }
  }

  /**
   * Recherche des films via scraping
   * @param {Object} params - Paramètres de recherche (q: terme de recherche)
   * @returns {Promise<Array>} - Résultats de la recherche
   */
  async scrapeSearchFilms(params) {
    try {
      const query = params.q || '';
      if (!query) {
        return [];
      }
      
      // Clé de cache pour la recherche
      const cacheKey = `scraped_search_films_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Fonction de requête avec tentatives
      const fetchSearchResults = async () => {
        const response = await fetch(`${this.scrapingBaseUrl}/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data.data) ? data.data : [];
      };
      
      // Exécuter la requête avec tentatives
      const results = await this._retryRequest(
        fetchSearchResults,
        `recherche de films (query="${query}")`
      );
      
      // Mettre en cache les résultats (6 heures)
      if (results.length > 0) {
        await this.cache.set(cacheKey, JSON.stringify(results), 21600);
      }
      
      return results;
    } catch (error) {
      console.error(`[FilmScraperService] Erreur scrapeSearchFilms: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère les détails d'un film par son ID via scraping
   * @param {string|number} id - ID du film
   * @returns {Promise<Object|null>} - Détails du film ou null
   */
  async scrapeFilmById(id) {
    try {
      if (!id) {
        return null;
      }
      
      // Clé de cache pour les détails du film
      const cacheKey = `scraped_film_${id}`;
      
      // Vérifier le cache
      const cachedData = await this.cache.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // Fonction de requête avec tentatives
      const fetchFilmDetails = async () => {
        const response = await fetch(`${this.scrapingBaseUrl}/${id}`);
        
        // Cas spécial: 404 signifie que le film n'existe pas, pas une erreur de scraping
        if (response.status === 404) {
          // On retourne un objet spécial pour indiquer un 404 légitime
          return { _notFound: true };
        }
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      };
      
      // Exécuter la requête avec tentatives
      let data;
      try {
        data = await this._retryRequest(
          fetchFilmDetails,
          `récupération du film (id=${id})`
        );
        
        // Si c'est un 404 légitime, on retourne null
        if (data && data._notFound) {
          return null;
        }
      } catch (error) {
        // Log spécifique pour KissAsian si pertinent
        if (error.message.includes('KissAsian')) {
          console.error(`[FilmScraperService] Échec du scraping de KissAsian pour le film ${id}: ${error.message}`);
        }
        throw error; // Propager l'erreur pour le bloc catch externe
      }
      
      // Mettre en cache les résultats (24 heures)
      if (data) {
        await this.cache.set(cacheKey, JSON.stringify(data), 86400);
      }
      
      return data;
    } catch (error) {
      console.error(`[FilmScraperService] Erreur scrapeFilmById: ${error.message}`);
      return null;
    }
  }
}

module.exports = FilmScraperService;
