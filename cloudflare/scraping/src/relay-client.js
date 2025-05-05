/**
 * Client pour le serveur de relais de scraping
 * 
 * Ce module permet de communiquer avec le serveur de relais Python
 * qui effectue le scraping réel des sites cibles.
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
   * Effectue une requête vers le serveur de relais avec retries
   * @param {string} url - URL à scraper
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchHtml(url) {
    let retries = 0;
    let lastError = null;
    
    while (retries < this.maxRetries) {
      try {
        const endpoint = `${this.relayUrl}/scrape`;
        
        this.debugLog(`Requête vers ${endpoint} pour URL: ${url} (tentative ${retries + 1}/${this.maxRetries})`);
        
        // Ajouter un User-Agent aléatoire
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        ];
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        
        // Essayer d'abord avec le serveur relais
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              url,
              headers: {
                'User-Agent': randomUserAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
              }
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
          
          this.debugLog(`Réponse reçue pour ${url}`, {
            status: result.status,
            title: result.title,
            htmlLength: result.html ? result.html.length : 0
          });
          
          return result.html;
        } catch (relayError) {
          // Si le serveur relais échoue, essayer directement
          this.debugLog(`Serveur relais indisponible: ${relayError.message}, tentative directe...`);
          
          // Tentative directe (fallback)
          const directResponse = await fetch(url, {
            headers: {
              'User-Agent': randomUserAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
              'Referer': 'https://www.google.com/',
              'DNT': '1',
              'Upgrade-Insecure-Requests': '1'
            }
          });
          
          if (!directResponse.ok) {
            throw new Error(`Erreur HTTP directe ${directResponse.status}`);
          }
          
          const html = await directResponse.text();
          
          this.debugLog(`Réponse directe reçue pour ${url}`, {
            status: directResponse.status,
            htmlLength: html.length
          });
          
          return html;
        }
      } catch (error) {
        lastError = error;
        this.debugLog(`Erreur lors de la tentative ${retries + 1}: ${error.message}`);
        retries++;
        
        if (retries < this.maxRetries) {
          // Attendre avant de réessayer avec un délai exponentiel
          const delay = this.retryDelay * Math.pow(2, retries - 1);
          this.debugLog(`Attente de ${delay}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Si toutes les tentatives ont échoué
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
