/**
 * Scrapers supplémentaires pour les animes
 * 
 * Ces scrapers utilisent le serveur relais pour récupérer le HTML
 * et parser les données avec Cheerio.
 */

import { RelayClient } from './relay-client';
import * as cheerio from 'cheerio';

/**
 * Scraper pour NekoSama
 */
class NekoSamaScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'nekosama';
    this.baseUrl = 'https://nekosama.fr';
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
   * Extrait des informations de base des animes récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page des animes
      const html = await this.fetchHtml('/animes', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des animes
      const animes = [];
      
      // Sélectionner les éléments de la liste des animes
      $('.card').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Extraire la note si disponible
          const rating = $(element).find('.rating').text().trim();
          
          // Extraire l'année si disponible
          const year = $(element).find('.year').text().trim();
          
          // Créer l'objet anime
          const anime = {
            title,
            url,
            image: imgSrc,
            rating: rating || null,
            year: year || null,
            source: 'nekosama'
          };
          
          animes.push(anime);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations de l'anime #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${animes.length} animes trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: animes.length > 0,
        source: this.name,
        content_type: 'anime',
        items: animes,
        items_count: animes.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'anime',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des animes
   */
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Début de la recherche pour "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/animes/search?q=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des animes
      const animes = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.card').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Créer l'objet anime
          const anime = {
            title,
            url,
            image: imgSrc,
            source: 'nekosama'
          };
          
          animes.push(anime);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la recherche: ${animes.length} animes trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: animes.length > 0,
        source: this.name,
        content_type: 'anime',
        items: animes,
        items_count: animes.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'anime',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un anime
   */
  async getAnimeDetails(id, env) {
    try {
      this.debugLog(`Récupération des détails de l'anime avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page de l'anime
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations de l'anime
      const title = $('.anime-title').text().trim();
      const description = $('.anime-description').text().trim();
      const image = $('.anime-image img').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.anime-info .info-item').each((i, element) => {
        const label = $(element).find('.info-label').text().trim();
        const value = $(element).find('.info-value').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.anime-genres .genre').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire les épisodes
      const episodes = [];
      $('.episodes-list .episode').each((i, element) => {
        const episodeTitle = $(element).find('.episode-title').text().trim();
        const episodeUrl = $(element).find('a').attr('href');
        
        episodes.push({
          title: episodeTitle,
          url: episodeUrl
        });
      });
      
      const anime = {
        id,
        title,
        description,
        image,
        genres,
        details,
        episodes,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'nekosama'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!anime.title,
        source: this.name,
        content_type: 'anime',
        item: anime,
        items_count: 1,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'anime',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

/**
 * Scraper pour AnimeSama
 */
class AnimeSamaScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'animesama';
    this.baseUrl = 'https://anime-sama.fr';
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
   * Extrait des informations de base des animes récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page du catalogue
      const html = await this.fetchHtml('/catalogue/', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des animes
      const animes = [];
      
      // Sélectionner les éléments de la liste des animes
      $('.anime-card').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.anime-title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Extraire les genres
          const genres = [];
          $(element).find('.anime-genres .genre').each((j, genreElement) => {
            genres.push($(genreElement).text().trim());
          });
          
          // Créer l'objet anime
          const anime = {
            title,
            url,
            image: imgSrc,
            genres,
            source: 'animesama'
          };
          
          animes.push(anime);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations de l'anime #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${animes.length} animes trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: animes.length > 0,
        source: this.name,
        content_type: 'anime',
        items: animes,
        items_count: animes.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'anime',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des animes
   */
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Début de la recherche pour "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/catalogue/?s=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des animes
      const animes = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.anime-card').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.anime-title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Créer l'objet anime
          const anime = {
            title,
            url,
            image: imgSrc,
            source: 'animesama'
          };
          
          animes.push(anime);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la recherche: ${animes.length} animes trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: animes.length > 0,
        source: this.name,
        content_type: 'anime',
        items: animes,
        items_count: animes.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'anime',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un anime
   */
  async getAnimeDetails(id, env) {
    try {
      this.debugLog(`Récupération des détails de l'anime avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page de l'anime
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations de l'anime
      const title = $('.anime-title').text().trim();
      const description = $('.anime-synopsis').text().trim();
      const image = $('.anime-cover img').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.anime-details .detail-item').each((i, element) => {
        const label = $(element).find('.detail-label').text().trim();
        const value = $(element).find('.detail-value').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.anime-genres .genre').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire les épisodes
      const episodes = [];
      $('.episodes-list .episode-item').each((i, element) => {
        const episodeNumber = $(element).find('.episode-number').text().trim();
        const episodeTitle = $(element).find('.episode-title').text().trim();
        const episodeUrl = $(element).find('a').attr('href');
        
        episodes.push({
          number: episodeNumber,
          title: episodeTitle,
          url: episodeUrl
        });
      });
      
      const anime = {
        id,
        title,
        description,
        image,
        genres,
        details,
        episodes,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'animesama'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!anime.title,
        source: this.name,
        content_type: 'anime',
        item: anime,
        items_count: 1,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'anime',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

export { NekoSamaScraper, AnimeSamaScraper };
