/**
 * Client pour le scraping direct ou via un serveur de relais
 * 
 * Ce module permet de récupérer le HTML des sites cibles,
 * soit directement, soit via un serveur relais si disponible.
 */

class RelayClient {
  /**
   * Initialise le client de relais
   * @param {string} relayUrl - URL du serveur de relais principal
   * @param {boolean} debug - Activer le mode debug
   */
  constructor(relayUrl = null, debug = false) {
    // Liste des serveurs de relais disponibles par ordre de priorité
    this.relayServers = [
      'https://flodrama-cors-proxy.florifavi.workers.dev',  // Nouveau proxy CORS Cloudflare Workers
      'https://flodrama-scraper.florifavi.workers.dev',     // Worker de scraping principal
      'https://flodrama-api.florifavi.workers.dev',         // API principale
      'https://flodrama-scraper.onrender.com',              // Ancien serveur Render
      'https://flodrama-relay.netlify.app/.netlify/functions/relay' // Fonction Netlify de secours
    ];
    
    // Utiliser l'URL fournie ou la première de la liste
    this.relayUrl = relayUrl || this.relayServers[0];
    this.currentRelayIndex = 0;
    this.debug = debug;
    this.maxRetries = 5;          // Augmentation du nombre de tentatives
    this.retryDelay = 2000;       // Délai initial plus long
    this.useDirectFetch = false;  // Désactiver le fetch direct par défaut pour éviter les blocages
    this.lastSuccessfulRelay = null;
    this.failedRelays = new Set();
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
   * Sélectionne le prochain serveur de relais disponible
   * @returns {string} - URL du prochain serveur de relais
   */
  selectNextRelay() {
    // Si tous les relais ont échoué, réinitialiser et recommencer
    if (this.failedRelays.size >= this.relayServers.length) {
      this.debugLog(`Tous les serveurs de relais ont échoué, réinitialisation`);
      this.failedRelays.clear();
    }
    
    // Si un relais a déjà fonctionné, l'utiliser en priorité
    if (this.lastSuccessfulRelay && !this.failedRelays.has(this.lastSuccessfulRelay)) {
      this.relayUrl = this.lastSuccessfulRelay;
      this.debugLog(`Utilisation du dernier relais fonctionnel: ${this.relayUrl}`);
      return this.relayUrl;
    }
    
    // Trouver le prochain relais non testé
    for (const relay of this.relayServers) {
      if (!this.failedRelays.has(relay)) {
        this.relayUrl = relay;
        this.debugLog(`Sélection d'un nouveau relais: ${this.relayUrl}`);
        return this.relayUrl;
      }
    }
    
    // Si tous ont échoué, utiliser le premier
    this.relayUrl = this.relayServers[0];
    this.debugLog(`Utilisation du relais par défaut: ${this.relayUrl}`);
    return this.relayUrl;
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
    
    return result.html || '';
  }
  
  /**
   * Récupère le HTML d'une page web via le relais ou directement
   * @param {string} url - URL à scraper
   * @param {object} options - Options supplémentaires
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchHtml(url, options = {}) {
    this.debugLog(`Récupération du HTML pour ${url}`);
    
    let lastError = null;
    let relaysAttempted = 0;
    
    // Essayer avec plusieurs relais si nécessaire
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Essayer d'abord avec le fetch direct si activé
        if (this.useDirectFetch && attempt === 0) {
          try {
            return await this.fetchDirectly(url);
          } catch (directError) {
            this.debugLog(`Échec du fetch direct: ${directError.message}`);
            // Continuer avec les relais
          }
        }
        
        // Si on a déjà essayé un relais et qu'il a échoué, essayer le suivant
        if (lastError && relaysAttempted < this.relayServers.length) {
          this.selectNextRelay();
          relaysAttempted++;
        }
        
        // Essayer via le relais
        try {
          const html = await this.fetchViaRelay(url);
          
          // Si on a réussi, enregistrer ce relais comme fonctionnel
          this.lastSuccessfulRelay = this.relayUrl;
          
          return html;
        } catch (relayError) {
          // Marquer ce relais comme ayant échoué
          this.failedRelays.add(this.relayUrl);
          throw relayError; // Propager l'erreur pour le retry
        }
      } catch (error) {
        lastError = error;
        this.debugLog(`Tentative ${attempt + 1}/${this.maxRetries} échouée: ${error.message}`);
        
        if (attempt < this.maxRetries - 1) {
          // Attendre avant la prochaine tentative (backoff exponentiel)
          const delay = this.retryDelay * Math.pow(1.5, attempt);
          this.debugLog(`Nouvelle tentative dans ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Si toutes les tentatives ont échoué
    throw new Error(`Impossible de récupérer le HTML après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
}

module.exports = RelayClient;
