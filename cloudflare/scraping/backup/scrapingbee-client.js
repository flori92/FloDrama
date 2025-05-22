/**
 * Client pour ScrapingBee
 * 
 * Ce client permet de récupérer le HTML d'une page web en utilisant le service ScrapingBee,
 * qui gère les problèmes de blocage, de captcha et de proxy.
 */

/**
 * Client pour ScrapingBee
 */
class ScrapingBeeClient {
  /**
   * Constructeur
   * 
   * @param {string} apiKey - Clé API ScrapingBee
   * @param {boolean} debug - Activer le mode debug
   */
  constructor(apiKey, debug = false) {
    this.apiKey = apiKey;
    this.debug = debug;
    this.baseUrl = 'https://app.scrapingbee.com/api/v1';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 seconde
  }
  
  /**
   * Active le mode debug
   * 
   * @param {boolean} debug - Activer le mode debug
   * @returns {ScrapingBeeClient} - Instance du client
   */
  enableDebug(debug = true) {
    this.debug = debug;
    return this;
  }
  
  /**
   * Log de debug
   * 
   * @param {string} message - Message à logger
   * @param {any} data - Données à logger
   */
  debugLog(message, data = null) {
    if (this.debug) {
      console.log(`[SCRAPINGBEE_DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
  
  /**
   * Construit l'URL de l'API ScrapingBee
   * 
   * @param {string} url - URL à scraper
   * @param {object} options - Options de scraping
   * @returns {string} - URL de l'API ScrapingBee
   */
  buildApiUrl(url, options = {}) {
    // Options par défaut
    const defaultOptions = {
      render_js: 'false',
      premium_proxy: 'true',
      country_code: 'fr',
      wait: '1000',
      timeout: '30000'
    };
    
    // Fusionner les options par défaut avec les options fournies
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Construire l'URL
    const apiUrl = new URL(this.baseUrl);
    
    // Ajouter la clé API
    apiUrl.searchParams.append('api_key', this.apiKey);
    
    // Ajouter l'URL à scraper
    apiUrl.searchParams.append('url', url);
    
    // Ajouter les options
    Object.entries(mergedOptions).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });
    
    return apiUrl.toString();
  }
  
  /**
   * Récupère le HTML d'une URL
   * 
   * @param {string} url - URL à scraper
   * @param {object} options - Options de scraping
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchHtml(url, options = {}) {
    this.debugLog(`Récupération du HTML de ${url} avec ScrapingBee`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ScrapingBee non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl(url, options);
    
    // Tentatives de récupération
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Récupérer le HTML
        const response = await fetch(apiUrl);
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Si c'est une erreur 429 (Too Many Requests), attendre plus longtemps
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * 2));
          } else {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
          
          continue;
        }
        
        // Récupérer le HTML
        const html = await response.text();
        
        // Vérifier que le HTML n'est pas vide
        if (!html || html.trim() === '') {
          lastError = new Error('HTML vide');
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          continue;
        }
        
        this.debugLog(`HTML récupéré avec succès (${html.length} caractères)`);
        
        return html;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Effectue une requête vers MyDramaList
   * @param {string} path - Chemin relatif sur MyDramaList
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchMyDramaList(path) {
    const url = path.startsWith('http') ? path : `https://mydramalist.com${path.startsWith('/') ? path : '/' + path}`;
    
    // Options spécifiques pour MyDramaList
    const options = {
      render_js: 'true',
      premium_proxy: 'true',
      country_code: 'us',
      stealth_proxy: 'true'
    };
    
    return this.fetchHtml(url, options);
  }

  /**
   * Effectue une requête vers VoirAnime
   * @param {string} path - Chemin relatif sur VoirAnime
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchVoirAnime(path) {
    const url = path.startsWith('http') ? path : `https://v5.voiranime.com${path.startsWith('/') ? path : '/' + path}`;
    
    // Options spécifiques pour VoirAnime
    const options = {
      render_js: 'true',
      premium_proxy: 'true',
      country_code: 'fr',
      stealth_proxy: 'true'
    };
    
    return this.fetchHtml(url, options);
  }
}

export { ScrapingBeeClient };
