// Service API centralisé pour FloDrama
// Fusionne les fonctionnalités de ApiService, ProxyService et CachedProxyService

/**
 * Service de gestion des appels API avec fonctionnalités de cache et de proxy
 * @class ApiService
 */
export class ApiService {
  /**
   * Constructeur du service API
   * @param {Object} config - Configuration du service
   * @param {string} config.baseUrl - URL de base de l'API
   * @param {number} config.cacheDuration - Durée de cache en millisecondes (défaut: 5 minutes)
   * @param {boolean} config.useProxy - Utiliser un proxy pour les requêtes (défaut: false)
   * @param {string} config.proxyUrl - URL du proxy à utiliser
   */
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://api.flodrama.com/v1';
    this.cacheDuration = config.cacheDuration || 5 * 60 * 1000; // 5 minutes par défaut
    this.useProxy = config.useProxy || false;
    this.proxyUrl = config.proxyUrl || 'https://proxy.flodrama.com';
    
    // Cache pour les requêtes
    this.cache = {
      get: new Map(),
      post: new Map(),
      put: new Map(),
      delete: new Map()
    };
    
    // Headers par défaut
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('ApiService initialisé');
  }
  
  /**
   * Définir les headers par défaut
   * @param {Object} headers - Headers à définir
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
  
  /**
   * Ajouter un token d'authentification aux headers
   * @param {string} token - Token d'authentification
   */
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }
  
  /**
   * Générer une clé de cache pour une requête
   * @param {string} method - Méthode HTTP
   * @param {string} url - URL de la requête
   * @param {Object} params - Paramètres de la requête
   * @returns {string} - Clé de cache
   * @private
   */
  _getCacheKey(method, url, params) {
    return `${method}:${url}:${JSON.stringify(params || {})}`;
  }
  
  /**
   * Vérifier si une requête est en cache et valide
   * @param {string} method - Méthode HTTP
   * @param {string} url - URL de la requête
   * @param {Object} params - Paramètres de la requête
   * @returns {Object|null} - Données en cache ou null
   * @private
   */
  _getFromCache(method, url, params) {
    const key = this._getCacheKey(method, url, params);
    const cachedData = this.cache[method.toLowerCase()].get(key);
    
    if (cachedData && (Date.now() - cachedData.timestamp < this.cacheDuration)) {
      console.log(`Utilisation du cache pour ${method} ${url}`);
      return cachedData.data;
    }
    
    return null;
  }
  
  /**
   * Mettre en cache les données d'une requête
   * @param {string} method - Méthode HTTP
   * @param {string} url - URL de la requête
   * @param {Object} params - Paramètres de la requête
   * @param {Object} data - Données à mettre en cache
   * @private
   */
  _setCache(method, url, params, data) {
    const key = this._getCacheKey(method, url, params);
    this.cache[method.toLowerCase()].set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Effectuer une requête via un proxy
   * @param {string} url - URL de la requête
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Réponse de la requête
   * @private
   */
  async _fetchWithProxy(url, options) {
    const proxyOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        method: options.method,
        headers: options.headers,
        body: options.body
      })
    };
    
    const response = await fetch(this.proxyUrl, proxyOptions);
    
    if (!response.ok) {
      throw new Error(`Erreur proxy: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Effectuer une requête HTTP
   * @param {string} method - Méthode HTTP
   * @param {string} endpoint - Endpoint de l'API
   * @param {Object} options - Options de la requête
   * @param {Object} options.params - Paramètres de la requête
   * @param {Object} options.data - Données à envoyer
   * @param {Object} options.headers - Headers supplémentaires
   * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
   * @returns {Promise<Object>} - Réponse de la requête
   * @private
   */
  async _request(method, endpoint, options = {}) {
    const { params, data, headers = {}, useCache = true } = options;
    
    // Construire l'URL complète
    let url = `${this.baseUrl}${endpoint}`;
    
    // Ajouter les paramètres à l'URL si nécessaire
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url = `${url}?${queryParams.toString()}`;
    }
    
    // Vérifier le cache si applicable
    if (useCache && ['GET'].includes(method)) {
      const cachedData = this._getFromCache(method, url, params);
      if (cachedData) return cachedData;
    }
    
    // Préparer les options de la requête
    const requestOptions = {
      method,
      headers: { ...this.defaultHeaders, ...headers }
    };
    
    // Ajouter le corps de la requête si nécessaire
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    
    try {
      // Effectuer la requête (avec ou sans proxy)
      let response;
      
      if (this.useProxy) {
        response = await this._fetchWithProxy(url, requestOptions);
      } else {
        const fetchResponse = await fetch(url, requestOptions);
        
        if (!fetchResponse.ok) {
          throw new Error(`Erreur HTTP: ${fetchResponse.status} ${fetchResponse.statusText}`);
        }
        
        response = await fetchResponse.json();
      }
      
      // Mettre en cache la réponse si applicable
      if (useCache && ['GET'].includes(method)) {
        this._setCache(method, url, params, response);
      }
      
      return response;
    } catch (error) {
      console.error(`Erreur lors de la requête ${method} ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Effectuer une requête GET
   * @param {string} endpoint - Endpoint de l'API
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Réponse de la requête
   */
  async get(endpoint, options = {}) {
    return this._request('GET', endpoint, options);
  }
  
  /**
   * Effectuer une requête POST
   * @param {string} endpoint - Endpoint de l'API
   * @param {Object} data - Données à envoyer
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Réponse de la requête
   */
  async post(endpoint, data, options = {}) {
    return this._request('POST', endpoint, { ...options, data });
  }
  
  /**
   * Effectuer une requête PUT
   * @param {string} endpoint - Endpoint de l'API
   * @param {Object} data - Données à envoyer
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Réponse de la requête
   */
  async put(endpoint, data, options = {}) {
    return this._request('PUT', endpoint, { ...options, data });
  }
  
  /**
   * Effectuer une requête DELETE
   * @param {string} endpoint - Endpoint de l'API
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Réponse de la requête
   */
  async delete(endpoint, options = {}) {
    return this._request('DELETE', endpoint, options);
  }
  
  /**
   * Vider le cache
   * @param {string} method - Méthode HTTP spécifique à vider (optionnel)
   */
  clearCache(method) {
    if (method) {
      this.cache[method.toLowerCase()].clear();
    } else {
      Object.values(this.cache).forEach(cache => cache.clear());
    }
    console.log('Cache API vidé');
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default ApiService;
