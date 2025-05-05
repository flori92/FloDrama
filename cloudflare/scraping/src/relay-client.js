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
  }

  /**
   * Active le mode debug
   */
  enableDebug() {
    this.debug = true;
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
   * Effectue une requête vers le serveur de relais
   * @param {string} url - URL à scraper
   * @returns {Promise<Object>} - Réponse du serveur avec le HTML
   */
  async fetchHtml(url) {
    const endpoint = `${this.relayUrl}/scrape`;
    
    this.debugLog(`Requête vers ${endpoint} pour URL: ${url}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
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
    } catch (error) {
      this.debugLog(`Erreur lors de la requête: ${error.message}`);
      throw error;
    }
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
}

export default RelayClient;
