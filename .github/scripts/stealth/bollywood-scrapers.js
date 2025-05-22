/**
 * Scrapers pour le contenu Bollywood
 * 
 * Ces scrapers utilisent le serveur relais pour récupérer le HTML
 * et parser les données avec Cheerio.
 */

import { RelayClient } from './relay-client';
import * as cheerio from 'cheerio';

/**
 * Scraper pour Zee5
 */
class Zee5Scraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'zee5';
    this.baseUrl = 'https://zee5.com/global';
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
   * Extrait des informations de base des films Bollywood récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page des films
      const html = await this.fetchHtml('/movies', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des films
      const films = [];
      
      // Sélectionner les éléments de la liste des films
      $('.movieTileCard, .cardContent').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.cardTitle, .title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Extraire la note si disponible
          const rating = $(element).find('.cardRating, .rating').text().trim();
          
          // Extraire l'année si disponible
          const year = $(element).find('.cardYear, .year').text().trim();
          
          // Créer l'objet film
          const film = {
            title,
            url,
            image: imgSrc,
            rating: rating || null,
            year: year || null,
            source: 'zee5',
            content_type: 'bollywood'
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
        content_type: 'bollywood',
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
        content_type: 'bollywood',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Recherche des films Bollywood
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
      $('.searchCard, .searchResult').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.cardTitle, .title');
          const title = titleElement.text().trim();
          const url = $(element).find('a').attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Extraire le type de contenu
          const contentType = $(element).find('.cardType, .type').text().trim().toLowerCase();
          
          // Ne garder que les films et séries
          if (contentType === 'movie' || contentType === 'tvshow' || contentType === 'series') {
            // Créer l'objet film
            const film = {
              title,
              url,
              image: imgSrc,
              content_type: contentType === 'movie' ? 'movie' : 'series',
              source: 'zee5'
            };
            
            films.push(film);
          }
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
        content_type: 'bollywood',
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
        content_type: 'bollywood',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Récupère les détails d'un film Bollywood
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
      const title = $('.movieTitle, .showTitle').text().trim();
      const description = $('.movieDescription, .showDescription').text().trim();
      const image = $('.moviePoster img, .showPoster img').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.movieInfo .infoItem, .showInfo .infoItem').each((i, element) => {
        const label = $(element).find('.infoLabel').text().trim();
        const value = $(element).find('.infoValue').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.movieGenres .genre, .showGenres .genre').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire le casting
      const cast = [];
      $('.movieCast .castItem, .showCast .castItem').each((i, element) => {
        const actorName = $(element).find('.actorName').text().trim();
        const role = $(element).find('.actorRole').text().trim();
        
        if (actorName) {
          cast.push({
            name: actorName,
            role: role || null
          });
        }
      });
      
      // Extraire les épisodes pour les séries
      const episodes = [];
      $('.episodesList .episodeItem').each((i, element) => {
        const episodeTitle = $(element).find('.episodeTitle').text().trim();
        const episodeNumber = $(element).find('.episodeNumber').text().trim();
        const episodeUrl = $(element).find('a').attr('href');
        
        episodes.push({
          title: episodeTitle,
          number: episodeNumber,
          url: episodeUrl
        });
      });
      
      const film = {
        id,
        title,
        description,
        image,
        genres,
        details,
        cast,
        episodes: episodes.length > 0 ? episodes : undefined,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'zee5',
        content_type: 'bollywood'
      };
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin de la récupération des détails, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: !!film.title,
        source: this.name,
        content_type: 'bollywood',
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
        content_type: 'bollywood',
        items_count: 0,
        errors_count: 1,
        duration_seconds: 0,
        error: error.message
      };
    }
  }
}

export { Zee5Scraper };
