/**
 * Service pour communiquer avec l'API du service de scraping
 */
import { getConfig } from '../config';

class ApiService {
  constructor() {
    this.baseUrl = getConfig('API_BASE_URL') || 'http://localhost:4000/api';
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes en millisecondes
  }

  /**
   * Effectue une requête vers l'API
   * @param {string} endpoint - Point d'entrée de l'API
   * @param {Object} options - Options de la requête
   * @returns {Promise<any>} Données de la réponse
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de la requête API ${url}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les contenus populaires depuis l'API
   * @param {string} type - Type de contenu (movie, series, anime)
   * @param {number} limit - Nombre d'éléments à récupérer
   * @param {boolean} forceRefresh - Forcer le rafraîchissement du cache
   * @returns {Promise<Array>} Liste des contenus populaires
   */
  async getPopularContent(type = null, limit = 20, forceRefresh = false) {
    const cacheKey = `popular-${type || 'all'}-${limit}`;
    
    // Vérifier le cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < this.cacheDuration) {
        return cachedData.data;
      }
    }
    
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (limit) params.append('limit', limit);
      
      // Effectuer la requête
      const data = await this.request(`/content/popular?${params.toString()}`);
      
      // Mettre en cache les données
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des contenus populaires:', error);
      
      // En cas d'erreur, retourner les données en cache si disponibles
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // Sinon, retourner un tableau vide
      return [];
    }
  }

  /**
   * Récupère les contenus par type depuis l'API
   * @param {string} type - Type de contenu (movie, series, anime)
   * @param {string} category - Catégorie (popular, trending, etc.)
   * @param {number} limit - Nombre d'éléments à récupérer
   * @param {boolean} forceRefresh - Forcer le rafraîchissement du cache
   * @returns {Promise<Array>} Liste des contenus
   */
  async getContentByType(type, category = null, limit = 20, forceRefresh = false) {
    const cacheKey = `type-${type}-${category || 'all'}-${limit}`;
    
    // Vérifier le cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < this.cacheDuration) {
        return cachedData.data;
      }
    }
    
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (limit) params.append('limit', limit);
      
      // Effectuer la requête
      const data = await this.request(`/content/by-type/${type}?${params.toString()}`);
      
      // Mettre en cache les données
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des contenus de type ${type}:`, error);
      
      // En cas d'erreur, retourner les données en cache si disponibles
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // Sinon, retourner un tableau vide
      return [];
    }
  }

  /**
   * Recherche des contenus depuis l'API
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de contenu (movie, series, anime)
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} Liste des contenus correspondants
   */
  async searchContent(query, type = null, limit = 20) {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      params.append('query', query);
      if (type) params.append('type', type);
      if (limit) params.append('limit', limit);
      
      // Effectuer la requête
      return await this.request(`/content/search?${params.toString()}`);
    } catch (error) {
      console.error(`Erreur lors de la recherche de "${query}":`, error);
      return [];
    }
  }

  /**
   * Récupère un contenu par ID depuis l'API
   * @param {string} id - ID du contenu
   * @returns {Promise<Object>} Détails du contenu
   */
  async getContentById(id) {
    const cacheKey = `content-${id}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < this.cacheDuration) {
        return cachedData.data;
      }
    }
    
    try {
      // Effectuer la requête
      const data = await this.request(`/content/${id}`);
      
      // Mettre en cache les données
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du contenu ${id}:`, error);
      
      // En cas d'erreur, retourner les données en cache si disponibles
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // Sinon, retourner null
      return null;
    }
  }

  /**
   * Déclenche un scraping manuel via l'API
   * @param {string} source - Source à scraper (optionnel)
   * @returns {Promise<Object>} Résultat du scraping
   */
  async triggerScraping(source = null) {
    try {
      const body = source ? { source } : {};
      
      return await this.request('/scraper/run', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Erreur lors du déclenchement du scraping:', error);
      throw error;
    }
  }

  /**
   * Récupère le statut du dernier scraping
   * @returns {Promise<Object>} Statut du scraping
   */
  async getScrapingStatus() {
    try {
      return await this.request('/scraper/status');
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du scraping:', error);
      return {
        status: 'error',
        lastRun: null,
        nextRun: null,
        error: error.message
      };
    }
  }
}

// Exporter une instance unique du service
export default new ApiService();
