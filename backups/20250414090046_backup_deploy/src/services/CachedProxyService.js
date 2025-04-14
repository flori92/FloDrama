/**
 * CachedProxyService.js
 * 
 * Service intelligent pour accéder aux données pré-scrapées et utiliser le proxy Puppeteer
 * comme solution de secours si nécessaire.
 * 
 * Ce service tente d'abord d'accéder aux données pré-scrapées pour les sources populaires
 * avant de recourir au proxy Puppeteer, améliorant ainsi les performances et l'expérience utilisateur.
 */

import ProxyService from './ProxyService';

class CachedProxyService {
  constructor() {
    this.proxyService = new ProxyService();
    this.proxyBaseUrl = process.env.REACT_APP_PUPPETEER_PROXY_URL || 'http://localhost:3000';
    this.sources = {
      popular: {
        name: 'popular',
        url: 'https://source-site.com/popular',
        selector: '.popular-items'
      },
      popularMovies: {
        name: 'popular-movies',
        url: 'https://source-site.com/movies/popular',
        selector: '.movie-items'
      },
      popularKshows: {
        name: 'popular-kshows',
        url: 'https://source-site.com/kshows/popular',
        selector: '.kshow-items'
      }
    };
    
    // Statistiques d'utilisation pour le monitoring
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      proxyFallbacks: 0,
      errors: 0
    };
  }

  /**
   * Récupère les données depuis le cache ou via le proxy
   * @param {string} sourceName - Nom de la source à récupérer
   * @param {boolean} forceRefresh - Force un rafraîchissement des données
   * @returns {Promise<Object>} - Données récupérées
   */
  async getDataFromSource(sourceName, forceRefresh = false) {
    try {
      // Vérifier si la source existe
      const source = Object.values(this.sources).find(s => s.name === sourceName);
      if (!source) {
        throw new Error(`Source '${sourceName}' non trouvée`);
      }

      // Si forceRefresh est true, forcer un rafraîchissement des données
      if (forceRefresh) {
        return await this.refreshSourceData(sourceName);
      }

      // Essayer d'abord d'accéder aux données pré-scrapées
      try {
        const response = await fetch(`${this.proxyBaseUrl}/cached/${sourceName}`);
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des données en cache: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Si les données sont expirées mais existent, les utiliser quand même
        // mais déclencher un rafraîchissement en arrière-plan
        if (data.cacheStatus === 'expired') {
          // Déclencher un rafraîchissement en arrière-plan
          this.refreshSourceData(sourceName).catch(err => {
            console.error(`Erreur lors du rafraîchissement en arrière-plan: ${err.message}`);
          });
        }
        
        this.stats.cacheHits++;
        return data;
      } catch (cacheError) {
        console.warn(`Impossible d'accéder aux données en cache pour ${sourceName}: ${cacheError.message}`);
        this.stats.cacheMisses++;
        
        // Si les données en cache ne sont pas disponibles, utiliser le proxy
        return await this.fallbackToProxy(source);
      }
    } catch (error) {
      this.stats.errors++;
      console.error(`Erreur dans getDataFromSource pour ${sourceName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Force un rafraîchissement des données pour une source
   * @param {string} sourceName - Nom de la source à rafraîchir
   * @returns {Promise<Object>} - Données rafraîchies
   */
  async refreshSourceData(sourceName) {
    try {
      const response = await fetch(`${this.proxyBaseUrl}/refresh/${sourceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors du rafraîchissement des données: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erreur lors du rafraîchissement des données pour ${sourceName}: ${error.message}`);
      
      // Si le rafraîchissement échoue, essayer d'utiliser le proxy directement
      const source = Object.values(this.sources).find(s => s.name === sourceName);
      if (source) {
        return await this.fallbackToProxy(source);
      }
      
      throw error;
    }
  }

  /**
   * Utilise le proxy comme solution de secours
   * @param {Object} source - Configuration de la source
   * @returns {Promise<Object>} - Données récupérées via le proxy
   */
  async fallbackToProxy(source) {
    try {
      this.stats.proxyFallbacks++;
      console.log(`Utilisation du proxy pour ${source.name} comme solution de secours`);
      
      // Utiliser le service de proxy existant
      const response = await this.proxyService.fetch(source.url);
      
      if (!response || !response.content) {
        throw new Error(`Réponse du proxy invalide pour ${source.url}`);
      }
      
      // Créer un DOM temporaire pour extraire les éléments
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.content, 'text/html');
      
      // Extraire les éléments selon le sélecteur
      const elements = doc.querySelectorAll(source.selector);
      const items = Array.from(elements).map(el => {
        return {
          text: el.textContent.trim(),
          html: el.innerHTML,
          href: el.querySelector('a') ? el.querySelector('a').href : null,
          src: el.querySelector('img') ? el.querySelector('img').src : null
        };
      });
      
      // Formater les données de la même manière que le service de cache
      return {
        source: source.name,
        items,
        timestamp: new Date().toISOString(),
        fromProxy: true
      };
    } catch (error) {
      console.error(`Erreur lors de l'utilisation du proxy pour ${source.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les contenus populaires
   * @param {boolean} forceRefresh - Force un rafraîchissement des données
   * @returns {Promise<Object>} - Données des contenus populaires
   */
  async getPopular(forceRefresh = false) {
    return await this.getDataFromSource('popular', forceRefresh);
  }

  /**
   * Récupère les films populaires
   * @param {boolean} forceRefresh - Force un rafraîchissement des données
   * @returns {Promise<Object>} - Données des films populaires
   */
  async getPopularMovies(forceRefresh = false) {
    return await this.getDataFromSource('popular-movies', forceRefresh);
  }

  /**
   * Récupère les K-shows populaires
   * @param {boolean} forceRefresh - Force un rafraîchissement des données
   * @returns {Promise<Object>} - Données des K-shows populaires
   */
  async getPopularKshows(forceRefresh = false) {
    return await this.getDataFromSource('popular-kshows', forceRefresh);
  }

  /**
   * Recherche des dramas par mot-clé
   * @param {string} keyword - Mot-clé de recherche
   * @returns {Promise<Object>} - Résultats de la recherche
   */
  async searchDramas(keyword) {
    // La recherche utilise toujours le proxy car elle est dynamique
    try {
      const searchUrl = `https://source-site.com/search?q=${encodeURIComponent(keyword)}`;
      const response = await this.proxyService.fetch(searchUrl);
      
      if (!response || !response.content) {
        throw new Error(`Réponse du proxy invalide pour la recherche: ${keyword}`);
      }
      
      // Créer un DOM temporaire pour extraire les éléments
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.content, 'text/html');
      
      // Extraire les éléments de recherche (à adapter selon la structure du site)
      const elements = doc.querySelectorAll('.search-results .item');
      const items = Array.from(elements).map(el => {
        return {
          text: el.textContent.trim(),
          html: el.innerHTML,
          href: el.querySelector('a') ? el.querySelector('a').href : null,
          src: el.querySelector('img') ? el.querySelector('img').src : null
        };
      });
      
      return {
        keyword,
        items,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.stats.errors++;
      console.error(`Erreur lors de la recherche pour "${keyword}": ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'utilisation du service
   * @returns {Object} - Statistiques d'utilisation
   */
  getStats() {
    return {
      ...this.stats,
      timestamp: new Date().toISOString(),
      cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
    };
  }

  /**
   * Vérifie l'état du service de proxy
   * @returns {Promise<Object>} - État du service
   */
  async checkProxyStatus() {
    try {
      const response = await fetch(`${this.proxyBaseUrl}/info`);
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification du statut du proxy: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de la vérification du statut du proxy: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default CachedProxyService;
