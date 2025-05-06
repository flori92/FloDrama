/**
 * Client pour l'API ScrapingOwl
 * Ce module permet d'utiliser l'API ScrapingOwl pour récupérer le HTML de pages web
 * en contournant les protections anti-bot
 */

const https = require('https');
const { URL } = require('url');

/**
 * Client pour l'API ScrapingOwl
 */
class ScrapingOwlClient {
  /**
   * Constructeur
   * @param {string} apiKey - Clé API ScrapingOwl
   * @param {boolean} debug - Activer le mode debug
   */
  constructor(apiKey, debug = false) {
    this.apiKey = apiKey || 'aob0bnull8qrsp9jgioxeksl'; // Clé API par défaut (celle visible dans la capture d'écran)
    this.baseUrl = 'https://api.scrapeowl.com/v1/scrape';
    this.debug = debug;
  }

  /**
   * Récupère le HTML d'une page web via l'API ScrapingOwl
   * @param {string} url - URL de la page à scraper
   * @param {Object} options - Options supplémentaires
   * @param {boolean} options.javascript - Activer JavaScript
   * @param {boolean} options.premium_proxy - Utiliser un proxy premium
   * @param {string} options.user_agent - User agent à utiliser
   * @param {number} options.timeout - Timeout en secondes
   * @returns {Promise<string>} - HTML de la page
   */
  async fetchHtml(url, options = {}) {
    const {
      javascript = true,
      premium_proxy = true,
      user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      timeout = 60
    } = options;

    if (this.debug) {
      console.log(`[SCRAPEOWL] Récupération du HTML de ${url}`);
    }

    // Construire l'URL de l'API
    const apiUrl = new URL(this.baseUrl);
    apiUrl.searchParams.append('api_key', this.apiKey);
    apiUrl.searchParams.append('url', url);
    apiUrl.searchParams.append('javascript', javascript ? 'true' : 'false');
    apiUrl.searchParams.append('premium_proxy', premium_proxy ? 'true' : 'false');
    apiUrl.searchParams.append('user_agent', user_agent);
    apiUrl.searchParams.append('timeout', timeout.toString());

    try {
      // Faire la requête à l'API
      const response = await this._makeRequest(apiUrl.toString());
      
      if (this.debug) {
        console.log(`[SCRAPEOWL] Réponse reçue (${response.length} caractères)`);
      }
      
      return response;
    } catch (error) {
      if (this.debug) {
        console.error(`[SCRAPEOWL] Erreur lors de la récupération du HTML: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Fait une requête HTTP
   * @param {string} url - URL de la requête
   * @returns {Promise<string>} - Réponse de la requête
   * @private
   */
  _makeRequest(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        // Vérifier le code de statut
        if (res.statusCode !== 200) {
          reject(new Error(`Erreur HTTP ${res.statusCode}`));
          return;
        }

        // Récupérer les données
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            // Analyser la réponse JSON
            const response = JSON.parse(data);
            
            // Vérifier si la requête a réussi
            if (response.success) {
              resolve(response.html);
            } else {
              reject(new Error(response.error || 'Erreur inconnue'));
            }
          } catch (error) {
            reject(new Error(`Erreur lors de l'analyse de la réponse: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Exporter la classe
module.exports = {
  ScrapingOwlClient
};
