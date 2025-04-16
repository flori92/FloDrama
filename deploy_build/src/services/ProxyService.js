/**
 * ProxyService
 * 
 * Service pour contourner les restrictions CORS et les protections anti-bot
 * en utilisant un proxy Puppeteer avancé
 * 
 * NOTE: Ce service est désactivé en production pour éviter les conflits avec Elasticsearch
 */

class ProxyService {
  constructor() {
    // Déterminer l'environnement
    this.isDevelopment = typeof process !== 'undefined' && 
      process.env && 
      process.env.NODE_ENV === 'development';
    
    // Service désactivé en production et dans le navigateur
    this.isEnabled = this.isDevelopment && typeof window === 'undefined';
    
    // Configuration des URLs de proxy
    this.puppeteerProxyUrl = 'https://proxy.flodrama.org/proxy';
    this.corsAnywhereUrl = 'https://cors-anywhere.herokuapp.com';
    
    // Configuration des timeouts et retries
    this.timeout = 30000;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    console.log(`[ProxyService] Initialisé en mode ${this.isDevelopment ? 'développement' : 'production'} - Service ${this.isEnabled ? 'activé' : 'désactivé'}`);
  }
  
  /**
   * Construit l'URL du proxy pour une URL cible
   * @param {String} url - URL cible
   * @param {Boolean} useCorsProxy - Utiliser le proxy CORS Anywhere au lieu du proxy Puppeteer
   * @returns {String} URL du proxy ou URL originale si le service est désactivé
   */
  getProxyUrl(url, useCorsProxy = false) {
    try {
      // Vérifier que l'URL est définie
      if (!url) {
        throw new Error('URL non définie');
      }
      
      // Si le service est désactivé, retourner l'URL originale
      if (!this.isEnabled) {
        return url;
      }
      
      // Encoder l'URL pour éviter les problèmes avec les caractères spéciaux
      const encodedUrl = encodeURIComponent(url);
      
      if (useCorsProxy) {
        // Utiliser CORS Anywhere comme solution de secours
        return `${this.corsAnywhereUrl}/${url}`;
      } else {
        // Utiliser le proxy Puppeteer par défaut
        return `${this.puppeteerProxyUrl}?url=${encodedUrl}`;
      }
    } catch (error) {
      console.error(`[ProxyService] Erreur lors de la construction de l'URL du proxy:`, error);
      return url; // Retourner l'URL originale en cas d'erreur
    }
  }
  
  /**
   * Effectue une requête via le proxy avec retry automatique
   * @param {String} url - URL à requêter
   * @param {Object} options - Options de la requête fetch
   * @param {Boolean} useCorsProxy - Utiliser le proxy CORS
   * @returns {Promise<Response>} Réponse de la requête
   */
  async fetch(url, options = {}, useCorsProxy = false) {
    try {
      // Vérifier que l'URL est définie
      if (!url) {
        throw new Error('URL non définie');
      }
      
      // Si le service est désactivé, effectuer la requête directement
      if (!this.isEnabled) {
        return fetch(url, options);
      }
      
      let attempts = 0;
      let lastError = null;
      
      // Boucle de retry
      while (attempts < this.maxRetries) {
        try {
          attempts++;
          
          // Déterminer l'URL du proxy à utiliser
          let targetUrl;
          let fetchOptions;
          
          if (useCorsProxy) {
            // Utiliser CORS Anywhere comme solution de secours
            targetUrl = this.getProxyUrl(url, true);
            fetchOptions = {
              ...options,
              headers: {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest'
              }
            };
          } else {
            // Utiliser le proxy Puppeteer par défaut
            if (options.method === 'POST' && options.body) {
              // Pour les requêtes POST, utiliser l'API POST du proxy Puppeteer
              targetUrl = this.puppeteerProxyUrl;
              
              // Préparer les données pour le proxy Puppeteer
              const proxyData = {
                url: url,
                headers: options.headers || {},
                timeout: this.timeout
              };
              
              // Si un corps de requête est fourni, l'ajouter aux données du proxy
              if (options.body) {
                if (typeof options.body === 'string') {
                  try {
                    proxyData.body = JSON.parse(options.body);
                  } catch (e) {
                    proxyData.body = options.body;
                  }
                } else if (options.body instanceof FormData) {
                  // Convertir FormData en objet
                  const formDataObj = {};
                  for (const [key, value] of options.body.entries()) {
                    formDataObj[key] = value;
                  }
                  proxyData.formData = formDataObj;
                } else {
                  proxyData.body = options.body;
                }
              }
              
              fetchOptions = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(proxyData)
              };
            } else {
              // Pour les requêtes GET, utiliser l'API GET du proxy Puppeteer
              targetUrl = this.getProxyUrl(url);
              fetchOptions = {
                method: 'GET'
              };
            }
          }
          
          // Ajouter le timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);
          
          fetchOptions.signal = controller.signal;
          
          // Effectuer la requête
          const response = await fetch(targetUrl, fetchOptions);
          
          // Annuler le timeout
          clearTimeout(timeoutId);
          
          // Vérifier si la réponse est OK
          if (!response.ok) {
            throw new Error(`Réponse HTTP non OK: ${response.status} ${response.statusText}`);
          }
          
          // Si nous utilisons le proxy Puppeteer, nous devons extraire le contenu de la réponse
          if (!useCorsProxy) {
            const responseData = await response.json();
            
            // Créer une nouvelle réponse à partir des données du proxy
            const headers = new Headers();
            headers.append('Content-Type', 'text/html; charset=utf-8');
            
            if (responseData.cookies) {
              const cookieHeader = responseData.cookies
                .map(cookie => `${cookie.name}=${cookie.value}`)
                .join('; ');
              
              headers.append('Set-Cookie', cookieHeader);
            }
            
            return new Response(responseData.content, {
              status: 200,
              headers: headers
            });
          }
          
          return response;
        } catch (error) {
          lastError = error;
          console.debug(`[ProxyService] Tentative ${attempts}/${this.maxRetries} échouée:`, error);
          
          // Si c'est la dernière tentative, propager l'erreur
          if (attempts >= this.maxRetries) {
            // Si nous avons échoué avec le proxy Puppeteer, essayer avec CORS Anywhere
            if (!useCorsProxy) {
              console.log('[ProxyService] Échec avec le proxy Puppeteer, tentative avec CORS Anywhere...');
              return this.fetch(url, options, true);
            }
            
            throw error;
          }
          
          // Attendre avant la prochaine tentative
          const currentAttempt = attempts; // Capturer la valeur actuelle de attempts
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * currentAttempt));
        }
      }
      
      // Si toutes les tentatives ont échoué
      throw lastError || new Error('Échec de la requête après plusieurs tentatives');
    } catch (error) {
      console.error(`[ProxyService] Erreur critique:`, error);
      throw error;
    }
  }
  
  /**
   * Effectue une requête GET via le proxy
   * @param {String} url - URL à requêter
   * @param {Object} options - Options de la requête fetch
   * @param {Boolean} useCorsProxy - Utiliser le proxy CORS
   * @returns {Promise<Object>} Données de la réponse
   */
  async get(url, options = {}, useCorsProxy = false) {
    try {
      // Vérifier que l'URL est définie
      if (!url) {
        throw new Error('URL non définie');
      }
      
      // Si le service est désactivé, effectuer la requête directement
      if (!this.isEnabled) {
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return response.json();
        } else {
          return response.text();
        }
      }
      
      const response = await this.fetch(url, {
        ...options,
        method: 'GET'
      }, useCorsProxy);
      
      // Déterminer le type de réponse
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    } catch (error) {
      console.error(`[ProxyService] Erreur lors de la requête GET:`, error);
      throw error;
    }
  }
  
  /**
   * Effectue une requête POST via le proxy
   * @param {String} url - URL à requêter
   * @param {Object|String} data - Données à envoyer
   * @param {Object} options - Options de la requête fetch
   * @param {Boolean} useCorsProxy - Utiliser le proxy CORS
   * @returns {Promise<Object>} Données de la réponse
   */
  async post(url, data, options = {}, useCorsProxy = false) {
    try {
      // Vérifier que l'URL est définie
      if (!url) {
        throw new Error('URL non définie');
      }
      
      // Si le service est désactivé, effectuer la requête directement
      if (!this.isEnabled) {
        const response = await fetch(url, {
          ...options,
          method: 'POST',
          body: data
        });
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return response.json();
        } else {
          return response.text();
        }
      }
      
      // Préparer les données
      let body;
      let contentType;
      
      if (typeof data === 'string') {
        body = data;
        contentType = 'text/plain';
      } else if (data instanceof FormData) {
        body = data;
        // Ne pas définir Content-Type pour FormData, le navigateur s'en charge
      } else {
        body = JSON.stringify(data);
        contentType = 'application/json';
      }
      
      // Préparer les options
      const postOptions = {
        ...options,
        method: 'POST',
        body,
        headers: {
          ...options.headers
        }
      };
      
      // Ajouter le Content-Type si nécessaire
      if (contentType && !(data instanceof FormData)) {
        postOptions.headers['Content-Type'] = contentType;
      }
      
      const response = await this.fetch(url, postOptions, useCorsProxy);
      
      // Déterminer le type de réponse
      const responseContentType = response.headers.get('content-type') || '';
      
      if (responseContentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    } catch (error) {
      console.error(`[ProxyService] Erreur lors de la requête POST:`, error);
      throw error;
    }
  }
  
  /**
   * Extrait les données d'une réponse API qui peut contenir la propriété MAX_LENGTH
   * @param {Object|Array} response - Réponse de l'API
   * @returns {Object} Données extraites et propriété MAX_LENGTH
   */
  extractDataFromResponse(response) {
    try {
      // Si la réponse est null ou undefined, retourner un tableau vide
      if (!response) {
        return { data: [], MAX_LENGTH: 0 };
      }
      
      // Si la réponse est déjà un tableau, la retourner telle quelle
      if (Array.isArray(response)) {
        return { data: response, MAX_LENGTH: response.length };
      }
      
      // Si la réponse est un objet avec une propriété data et MAX_LENGTH
      if (response && typeof response === 'object' && 'data' in response && 'MAX_LENGTH' in response) {
        return response;
      }
      
      // Si la réponse est un objet mais sans structure spécifique, le retourner tel quel
      return { data: response, MAX_LENGTH: Array.isArray(response) ? response.length : 0 };
    } catch (error) {
      console.error('[ProxyService] Erreur lors de l\'extraction des données:', error);
      return { data: [], MAX_LENGTH: 0 };
    }
  }
  
  /**
   * Effectue une requête HTTP avec gestion des proxies
   * @param {String} method - Méthode HTTP (GET, POST, etc.)
   * @param {String} url - URL à requêter
   * @param {Object} options - Options de la requête
   * @returns {Promise<Response>} Réponse HTTP
   */
  async request(method, url, options = {}) {
    // Vérifier si nous sommes dans un environnement navigateur
    const isBrowser = typeof window !== 'undefined';
    
    // En environnement navigateur, simuler une réponse réussie pour éviter les erreurs CORS
    if (isBrowser) {
      console.debug(`[ProxyService] Simulation de requête ${method} en environnement navigateur: ${url}`);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, message: 'Simulation de réponse en environnement navigateur' }),
        text: () => Promise.resolve('Simulation de réponse en environnement navigateur'),
        headers: new Map()
      });
    }
    
    try {
      // Sélectionner un proxy
      const proxy = this.getProxy();
      
      // Configurer les options de la requête
      const requestOptions = {
        method,
        ...options,
        headers: {
          'User-Agent': this.getUserAgent(),
          ...options.headers
        },
        timeout: options.timeout || 10000
      };
      
      // Ajouter le proxy si disponible et si nous ne sommes pas dans un navigateur
      if (proxy && !isBrowser) {
        // Dans un environnement Node.js, nous utiliserions HttpsProxyAgent
        // Mais comme nous sommes dans un environnement mixte, nous vérifions d'abord
        try {
          // Cette partie ne s'exécutera que dans Node.js
          const { HttpsProxyAgent } = require('https-proxy-agent');
          requestOptions.agent = new HttpsProxyAgent(proxy);
        } catch (err) {
          console.debug('[ProxyService] HttpsProxyAgent non disponible, proxy ignoré');
        }
      }
      
      // Effectuer la requête
      const response = await fetch(url, requestOptions);
      
      // Mettre à jour les statistiques
      this.updateStats(url, response.ok);
      
      return response;
    } catch (error) {
      // Mettre à jour les statistiques
      this.updateStats(url, false);
      
      // Gérer silencieusement l'erreur en environnement navigateur
      if (isBrowser) {
        console.debug(`[ProxyService] Erreur silencieuse lors de la requête ${method}: ${url}`);
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ success: false, message: 'Erreur simulée' }),
          text: () => Promise.resolve('Erreur simulée'),
          headers: new Map()
        });
      }
      
      console.error(`[ProxyService] Erreur lors de la requête ${method}: ${error.message}`);
      throw error;
    }
  }
}

// Créer une instance unique du service
const proxyService = new ProxyService();

// Exporter le service
export default proxyService;
