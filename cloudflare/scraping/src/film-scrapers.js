/**
 * Scrapers supplémentaires pour les films
 * 
 * Ces scrapers utilisent le serveur relais pour récupérer le HTML
 * et parser les données avec Cheerio.
 */

import { RelayClient } from './relay-client';
import * as cheerio from 'cheerio';

/**
 * Scraper pour Coflix
 */
class CoflixScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'coflix';
    this.baseUrl = 'https://coflix.tv';
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
   * Extrait des informations de base des films récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page des films
      const html = await this.fetchHtml('/films', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des films
      const films = [];
      
      // Sélectionner les éléments de la liste des films
      $('.movie-item').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.movie-title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Extraire la note si disponible
          const rating = $(element).find('.movie-rating').text().trim();
          
          // Extraire l'année si disponible
          const year = $(element).find('.movie-year').text().trim();
          
          // Créer l'objet film
          const film = {
            title,
            url,
            image: imgSrc,
            rating: rating || null,
            year: year || null,
            source: 'coflix'
          };
          
          films.push(film);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du film #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${films.length} films trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: films.length > 0,
        source: this.name,
        content_type: 'film',
        items: films,
        items_count: films.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des films
   */
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Début de la recherche pour "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/search?q=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des films
      const films = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.movie-item').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.movie-title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Créer l'objet film
          const film = {
            title,
            url,
            image: imgSrc,
            source: 'coflix'
          };
          
          films.push(film);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la recherche: ${films.length} films trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: films.length > 0,
        source: this.name,
        content_type: 'film',
        items: films,
        items_count: films.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un film
   */
  async getFilmDetails(id, env) {
    try {
      this.debugLog(`Récupération des détails du film avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page du film
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations du film
      const title = $('.movie-title').text().trim();
      const description = $('.movie-description').text().trim();
      const image = $('.movie-poster img').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.movie-info .info-item').each((i, element) => {
        const label = $(element).find('.info-label').text().trim();
        const value = $(element).find('.info-value').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.movie-genres .genre').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire le casting
      const cast = [];
      $('.movie-cast .cast-item').each((i, element) => {
        const actorName = $(element).find('.actor-name').text().trim();
        const role = $(element).find('.actor-role').text().trim();
        
        if (actorName) {
          cast.push({
            name: actorName,
            role: role || null
          });
        }
      });
      
      const film = {
        id,
        title,
        description,
        image,
        genres,
        details,
        cast,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'coflix'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!film.title,
        source: this.name,
        content_type: 'film',
        item: film,
        items_count: 1,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

/**
 * Scraper pour VostFree
 */
class VostFreeScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'vostfree';
    this.baseUrl = 'https://vostfree.tv';
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
   * Extrait des informations de base des films récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page des films
      const html = await this.fetchHtml('/films', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des films
      const films = [];
      
      // Sélectionner les éléments de la liste des films
      $('.mov').each((i, element) => {
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
          
          // Extraire l'année si disponible
          const year = $(element).find('.year').text().trim();
          
          // Créer l'objet film
          const film = {
            title,
            url,
            image: imgSrc,
            year: year || null,
            source: 'vostfree'
          };
          
          films.push(film);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du film #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${films.length} films trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: films.length > 0,
        source: this.name,
        content_type: 'film',
        items: films,
        items_count: films.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des films
   */
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Début de la recherche pour "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/index.php?do=search&subaction=search&story=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des films
      const films = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.mov').each((i, element) => {
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
          
          // Créer l'objet film
          const film = {
            title,
            url,
            image: imgSrc,
            source: 'vostfree'
          };
          
          films.push(film);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la recherche: ${films.length} films trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: films.length > 0,
        source: this.name,
        content_type: 'film',
        items: films,
        items_count: films.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un film
   */
  async getFilmDetails(id, env) {
    try {
      this.debugLog(`Récupération des détails du film avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page du film
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations du film
      const title = $('.fheader h1, .fheader h2').text().trim();
      const description = $('.fdesc').text().trim();
      const image = $('.fposter img').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.flist li').each((i, element) => {
        const text = $(element).text().trim();
        const parts = text.split(':');
        
        if (parts.length === 2) {
          const label = parts[0].trim().toLowerCase();
          const value = parts[1].trim();
          
          details[label] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.flist li:contains("Genre")').each((i, element) => {
        const text = $(element).text().trim();
        const parts = text.split(':');
        
        if (parts.length === 2) {
          const genresText = parts[1].trim();
          const genresList = genresText.split(',');
          
          genresList.forEach(genre => {
            genres.push(genre.trim());
          });
        }
      });
      
      const film = {
        id,
        title,
        description,
        image,
        genres,
        details,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'vostfree'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!film.title,
        source: this.name,
        content_type: 'film',
        item: film,
        items_count: 1,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

/**
 * Scraper pour TopStream
 */
class TopStreamScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'topstream';
    this.baseUrl = 'https://topstream.tv';
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
   * Extrait des informations de base des films récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page des films
      const html = await this.fetchHtml('/films', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des films
      const films = [];
      
      // Sélectionner les éléments de la liste des films
      $('.movie-item').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.movie-title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Extraire la note si disponible
          const rating = $(element).find('.movie-rating').text().trim();
          
          // Extraire l'année si disponible
          const year = $(element).find('.movie-year').text().trim();
          
          // Créer l'objet film
          const film = {
            title,
            url,
            image: imgSrc,
            rating: rating || null,
            year: year || null,
            source: 'topstream'
          };
          
          films.push(film);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du film #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${films.length} films trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: films.length > 0,
        source: this.name,
        content_type: 'film',
        items: films,
        items_count: films.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des films
   */
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Début de la recherche pour "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/search?q=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des films
      const films = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.movie-item').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.movie-title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Créer l'objet film
          const film = {
            title,
            url,
            image: imgSrc,
            source: 'topstream'
          };
          
          films.push(film);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la recherche: ${films.length} films trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: films.length > 0,
        source: this.name,
        content_type: 'film',
        items: films,
        items_count: films.length,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un film
   */
  async getFilmDetails(id, env) {
    try {
      this.debugLog(`Récupération des détails du film avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page du film
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations du film
      const title = $('.movie-title').text().trim();
      const description = $('.movie-description').text().trim();
      const image = $('.movie-poster img').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.movie-info .info-item').each((i, element) => {
        const label = $(element).find('.info-label').text().trim();
        const value = $(element).find('.info-value').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.movie-genres .genre').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      const film = {
        id,
        title,
        description,
        image,
        genres,
        details,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'topstream'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!film.title,
        source: this.name,
        content_type: 'film',
        item: film,
        items_count: 1,
        errors_count: 0,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        content_type: 'film',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

export { CoflixScraper, VostFreeScraper, TopStreamScraper };
