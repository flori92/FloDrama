/**
 * Client pour le scraping direct ou via un serveur de relais
 * 
 * Ce module permet de récupérer le HTML des sites cibles,
 * soit directement, soit via un serveur relais si disponible.
 */

class RelayClient {
  /**
   * Initialise le client de relais
   * @param {string} relayUrl - URL du serveur de relais (Render)
   * @param {boolean} debug - Activer le mode debug
   */
  constructor(relayUrl = 'https://flodrama-scraper.onrender.com', debug = false) {
    this.relayUrl = relayUrl;
    this.debug = debug;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.useDirectFetch = true; // Utiliser le fetch direct par défaut
  }

  /**
   * Active le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
    return this;
  }

  /**
   * Log de debug
   */
  debugLog(message, data = null) {
    if (this.debug) {
      console.log(`[RELAY_DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Obtient un User-Agent aléatoire
   * @returns {string} - User-Agent aléatoire
   */
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Obtient des headers adaptés au site cible
   * @param {string} url - URL cible
   * @returns {object} - Headers HTTP
   */
  getCustomHeaders(url) {
    const baseHeaders = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': new URL(url).origin,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };

    // Ajouter des headers spécifiques selon le site
    if (url.includes('mydramalist.com')) {
      return {
        ...baseHeaders,
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cookie': 'mdl_cookie_check=1; mdl_timezone=Europe/Paris; mdl_consent=1'
      };
    }

    return baseHeaders;
  }

  /**
   * Effectue une requête directe vers l'URL cible
   * @param {string} url - URL à scraper
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchDirectly(url) {
    this.debugLog(`Requête directe vers ${url}`);
    
    const headers = this.getCustomHeaders(url);
    this.debugLog(`Headers utilisés:`, headers);
    
    // Options de fetch spécifiques pour le site
    const fetchOptions = {
      headers,
      cf: {
        // Options Cloudflare Workers pour contourner les protections
        cacheTtl: 300,
        cacheEverything: true,
        minify: {
          html: false,
          css: false,
          js: false
        }
      }
    };
    
    // Ajouter des options spécifiques pour MyDramaList
    if (url.includes('mydramalist.com')) {
      fetchOptions.redirect = 'follow';
      fetchOptions.cf.scrapeShield = false;
      fetchOptions.cf.apps = false;
    }
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP directe ${response.status}`);
    }
    
    const html = await response.text();
    
    if (!html || html.length < 100) {
      throw new Error('HTML vide ou trop court');
    }
    
    this.debugLog(`Réponse directe reçue pour ${url}`, {
      status: response.status,
      htmlLength: html.length
    });
    
    return html;
  }

  /**
   * Effectue une requête vers le serveur de relais
   * @param {string} url - URL à scraper
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchViaRelay(url) {
    const endpoint = `${this.relayUrl}/scrape`;
    
    this.debugLog(`Requête vers le serveur relais ${endpoint} pour URL: ${url}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url,
        headers: this.getCustomHeaders(url)
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Erreur du serveur relais: ${result.error}`);
    }
    
    this.debugLog(`Réponse reçue du serveur relais pour ${url}`, {
      status: result.status,
      title: result.title,
      htmlLength: result.html ? result.html.length : 0
    });
    
    return result.html;
  }

  /**
   * Effectue une requête avec retries
   * @param {string} url - URL à scraper
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchHtml(url) {
    let retries = 0;
    let lastError = null;
    
    while (retries < this.maxRetries) {
      try {
        this.debugLog(`Tentative ${retries + 1}/${this.maxRetries} pour URL: ${url}`);
        
        // Essayer d'abord avec la méthode directe
        if (this.useDirectFetch) {
          try {
            return await this.fetchDirectly(url);
          } catch (directError) {
            this.debugLog(`Échec de la requête directe: ${directError.message}`);
            
            // Si la méthode directe échoue, essayer avec le serveur relais
            if (!this.relayUrl.includes('onrender.com')) {
              // Ne pas essayer le serveur relais Render par défaut car il est probablement hors service
              try {
                return await this.fetchViaRelay(url);
              } catch (relayError) {
                this.debugLog(`Échec de la requête via relais: ${relayError.message}`);
                throw directError; // Relancer l'erreur directe si les deux méthodes échouent
              }
            } else {
              throw directError;
            }
          }
        } else {
          // Si useDirectFetch est false, essayer d'abord avec le serveur relais
          try {
            return await this.fetchViaRelay(url);
          } catch (relayError) {
            this.debugLog(`Échec de la requête via relais: ${relayError.message}`);
            
            // Si le serveur relais échoue, essayer directement
            try {
              return await this.fetchDirectly(url);
            } catch (directError) {
              this.debugLog(`Échec de la requête directe: ${directError.message}`);
              throw relayError; // Relancer l'erreur du relais si les deux méthodes échouent
            }
          }
        }
      } catch (error) {
        lastError = error;
        retries++;
        
        if (retries < this.maxRetries) {
          this.debugLog(`Attente de ${this.retryDelay}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 2; // Backoff exponentiel
        }
      }
    }
    
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError.message}`);
  }

  /**
   * Effectue une requête vers MyDramaList
   * @param {string} path - Chemin relatif sur MyDramaList
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchMyDramaList(path) {
    const url = path.startsWith('http') ? path : `https://mydramalist.com${path.startsWith('/') ? path : '/' + path}`;
    return this.fetchHtml(url);
  }

  /**
   * Effectue une requête vers VoirAnime
   * @param {string} path - Chemin relatif sur VoirAnime
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchVoirAnime(path) {
    const url = path.startsWith('http') ? path : `https://v5.voiranime.com${path.startsWith('/') ? path : '/' + path}`;
    return this.fetchHtml(url);
  }
  
  /**
   * Vérifie si le serveur relais est disponible
   * @returns {Promise<boolean>} - true si le serveur est disponible
   */
  async checkRelayStatus() {
    try {
      const response = await fetch(`${this.relayUrl}/ping`);
      return response.ok;
    } catch (error) {
      this.debugLog(`Erreur lors de la vérification du statut du relais: ${error.message}`);
      return false;
    }
  }
}

export { RelayClient };
