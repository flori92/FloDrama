/**
 * Scrapers supplémentaires pour les dramas
 * 
 * Ces scrapers utilisent le serveur relais pour récupérer le HTML
 * et parser les données avec Cheerio.
 */

import { RelayClient } from './relay-client';
import * as cheerio from 'cheerio';

/**
 * Scraper pour VoirDrama
 */
class VoirDramaScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'voirdrama';
    this.baseUrl = 'https://voirdrama.org';
    this.relayClient = new RelayClient();
  }
  
  /**
   * Active le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
    this.relayClient.enableDebug(debug);
    return this;
  }
  
  /**
   * Log de debug
   */
  debugLog(message, data = null) {
    if (this.debug) {
      console.log(`[${this.name.toUpperCase()}_DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
  
  /**
   * Récupère le HTML d'une URL
   */
  async fetchHtml(url, env) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    this.debugLog(`Récupération du HTML de ${fullUrl}`);
    
    try {
      // Utiliser le serveur relais
      const html = await this.relayClient.fetchHtml(fullUrl);
      
      if (!html) {
        throw new Error('HTML vide');
      }
      
      return html;
    } catch (error) {
      console.error(`Erreur lors de la récupération du HTML: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extrait des informations de base des dramas récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page des dramas
      const html = await this.fetchHtml('/drama/', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des dramas
      const dramas = [];
      
      // Sélectionner les éléments de la liste des dramas
      $('.page-item-detail').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('h3.h5 a, h5.post-title a');
          const title = titleElement.text().trim();
          const url = titleElement.attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img, img.img-responsive');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Extraire la note si disponible
          const rating = $(element).find('.rating .score').text().trim();
          
          // Extraire l'année si disponible
          const year = $(element).find('.year').text().trim().replace(/[()]/g, '');
          
          // Créer l'objet drama
          const drama = {
            title,
            url,
            image: imgSrc,
            rating: rating || null,
            year: year || null,
            source: 'voirdrama'
          };
          
          dramas.push(drama);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du drama #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${dramas.length} dramas trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: dramas.length > 0,
        source: this.name,
        content_type: 'drama',
        items: dramas,
        items_count: dramas.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'drama',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des dramas
   */
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Début de la recherche pour "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/?s=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des dramas
      const dramas = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.c-tabs-item__content').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('h3.h5 a, h5.post-title a');
          const title = titleElement.text().trim();
          const url = titleElement.attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img, img.img-responsive');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Créer l'objet drama
          const drama = {
            title,
            url,
            image: imgSrc,
            source: 'voirdrama'
          };
          
          dramas.push(drama);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la recherche: ${dramas.length} dramas trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: dramas.length > 0,
        source: this.name,
        content_type: 'drama',
        items: dramas,
        items_count: dramas.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'drama',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un drama
   */
  async getDramaDetails(id, env) {
    try {
      this.debugLog(`Récupération des détails du drama avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page du drama
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations du drama
      const title = $('.entry-title').text().trim();
      const description = $('.description-summary').text().trim();
      const image = $('.thumb img').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.post-content_item').each((i, element) => {
        const label = $(element).find('.summary-heading h5').text().trim();
        const value = $(element).find('.summary-content').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.genres-content a').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire les épisodes
      const episodes = [];
      $('#manga-chapters-holder li.wp-manga-chapter').each((i, element) => {
        const episodeTitle = $(element).find('a').text().trim();
        const episodeUrl = $(element).find('a').attr('href');
        const episodeDate = $(element).find('.chapter-release-date').text().trim();
        
        episodes.push({
          title: episodeTitle,
          url: episodeUrl,
          date: episodeDate
        });
      });
      
      const drama = {
        id,
        title,
        description,
        image,
        genres,
        details,
        episodes,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'voirdrama'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!drama.title,
        source: this.name,
        content_type: 'drama',
        item: drama,
        items_count: 1,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'drama',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

/**
 * Scraper pour AsianWiki
 */
class AsianWikiScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'asianwiki';
    this.baseUrl = 'https://asianwiki.com';
    this.relayClient = new RelayClient();
  }
  
  /**
   * Active le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
    this.relayClient.enableDebug(debug);
    return this;
  }
  
  /**
   * Log de debug
   */
  debugLog(message, data = null) {
    if (this.debug) {
      console.log(`[${this.name.toUpperCase()}_DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
  
  /**
   * Récupère le HTML d'une URL
   */
  async fetchHtml(url, env) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    this.debugLog(`Récupération du HTML de ${fullUrl}`);
    
    try {
      // Utiliser le serveur relais
      const html = await this.relayClient.fetchHtml(fullUrl);
      
      if (!html) {
        throw new Error('HTML vide');
      }
      
      return html;
    } catch (error) {
      console.error(`Erreur lors de la récupération du HTML: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extrait des informations de base des dramas récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page des dramas coréens
      const html = await this.fetchHtml('/wiki/Category:Korean_Movies', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des dramas
      const dramas = [];
      
      // Sélectionner les éléments de la liste des dramas
      $('.category-page__member').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.category-page__member-link');
          const title = titleElement.text().trim();
          const path = titleElement.attr('href');
          const url = path ? `${this.baseUrl}${path}` : null;
          
          // Créer l'objet drama
          const drama = {
            title,
            url,
            source: 'asianwiki'
          };
          
          dramas.push(drama);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du drama #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${dramas.length} dramas trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: dramas.length > 0,
        source: this.name,
        content_type: 'drama',
        items: dramas,
        items_count: dramas.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'drama',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des dramas
   */
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Début de la recherche pour "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/index.php?search=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des dramas
      const dramas = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.mw-search-result').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.mw-search-result-heading a');
          const title = titleElement.text().trim();
          const path = titleElement.attr('href');
          const url = path ? `${this.baseUrl}${path}` : null;
          
          // Extraire la description
          const description = $(element).find('.searchresult').text().trim();
          
          // Créer l'objet drama
          const drama = {
            title,
            url,
            description,
            source: 'asianwiki'
          };
          
          dramas.push(drama);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la recherche: ${dramas.length} dramas trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: dramas.length > 0,
        source: this.name,
        content_type: 'drama',
        items: dramas,
        items_count: dramas.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'drama',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un drama
   */
  async getDramaDetails(id, env) {
    try {
      this.debugLog(`Récupération des détails du drama avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page du drama
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations du drama
      const title = $('#firstHeading').text().trim();
      const content = $('#mw-content-text');
      
      // Extraire l'image
      const image = content.find('.thumbimage').attr('src');
      
      // Extraire la description
      const description = content.find('p').first().text().trim();
      
      // Extraire les informations supplémentaires
      const details = {};
      content.find('table.infobox tr').each((i, element) => {
        const label = $(element).find('th').text().trim();
        const value = $(element).find('td').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire le casting
      const cast = [];
      content.find('div.cast').each((i, element) => {
        const actorName = $(element).find('.cast-name').text().trim();
        const role = $(element).find('.cast-role').text().trim();
        
        if (actorName) {
          cast.push({
            name: actorName,
            role: role || null
          });
        }
      });
      
      const drama = {
        id,
        title,
        description,
        image: image ? `${this.baseUrl}${image}` : null,
        details,
        cast,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'asianwiki'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!drama.title,
        source: this.name,
        content_type: 'drama',
        item: drama,
        items_count: 1,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'drama',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

export { VoirDramaScraper, AsianWikiScraper };
