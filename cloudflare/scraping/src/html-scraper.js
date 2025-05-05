/**
 * Scraper HTML pour Cloudflare Workers
 * 
 * Ce module utilise le client relais pour récupérer le HTML des sites cibles
 * et extrait les données nécessaires.
 */

import RelayClient from './relay-client';
import { parseHTML } from './html-parser';

/**
 * Classe de base pour les scrapers
 */
class BaseScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.relayClient = new RelayClient(undefined, debug);
    this.name = 'base';
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
   * Méthode de scraping à implémenter par les sous-classes
   */
  async scrape() {
    throw new Error('La méthode scrape() doit être implémentée par les sous-classes');
  }
}

/**
 * Scraper pour MyDramaList
 */
class MyDramaListScraper extends BaseScraper {
  constructor(debug = false) {
    super(debug);
    this.name = 'mydramalist';
    this.baseUrl = 'https://mydramalist.com';
  }

  /**
   * Récupère les dramas récents
   */
  async getRecentDramas(limit = 20) {
    try {
      this.debugLog(`Récupération des ${limit} dramas récents`);
      
      // Récupérer la page d'accueil pour les dramas récents
      const html = await this.relayClient.fetchMyDramaList('/shows/recent/');
      
      // Parser le HTML
      const $ = parseHTML(html);
      
      // Extraire les informations des dramas
      const dramas = [];
      
      // Sélectionner les éléments de la liste des dramas
      const dramaElements = $('.box');
      
      for (let i = 0; i < Math.min(dramaElements.length, limit); i++) {
        const element = dramaElements[i];
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('h6 a');
          const title = titleElement.text().trim();
          const path = titleElement.attr('href');
          const url = path ? `${this.baseUrl}${path}` : null;
          
          // Extraire l'ID du drama depuis l'URL
          const id = path ? path.split('/')[2] : null;
          
          // Extraire l'image
          const imgElement = $(element).find('img.lazy');
          const imgSrc = imgElement.attr('data-src') || imgElement.attr('src');
          
          // Extraire les informations supplémentaires
          const infoElement = $(element).find('.text-muted');
          const info = infoElement.text().trim();
          
          // Extraire l'année et le pays
          const yearMatch = info.match(/(\d{4})/);
          const year = yearMatch ? parseInt(yearMatch[1]) : null;
          
          // Extraire le pays
          const countryMatch = info.match(/\(([^)]+)\)/);
          const country = countryMatch ? countryMatch[1].trim() : null;
          
          // Créer l'objet drama
          const drama = {
            id,
            title,
            url,
            image: imgSrc,
            year,
            country,
            source: 'mydramalist'
          };
          
          dramas.push(drama);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du drama #${i}: ${error.message}`);
        }
      }
      
      this.debugLog(`${dramas.length} dramas récupérés`);
      return dramas;
    } catch (error) {
      console.error(`Erreur lors de la récupération des dramas récents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les détails d'un drama
   */
  async getDramaDetails(dramaId) {
    try {
      this.debugLog(`Récupération des détails du drama ${dramaId}`);
      
      // Construire l'URL du drama
      const html = await this.relayClient.fetchMyDramaList(`/id/${dramaId}`);
      
      // Parser le HTML
      const $ = parseHTML(html);
      
      // Extraire les informations de base
      const title = $('.box-header h1.title').text().trim();
      const nativeTitle = $('.show-native-title').text().trim();
      const synopsis = $('.show-synopsis p').text().trim();
      
      // Extraire l'image
      const imgElement = $('.cover img');
      const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.show-details .box-body dl').each((i, element) => {
        const dt = $(element).find('dt').text().trim();
        const dd = $(element).find('dd').text().trim();
        
        if (dt && dd) {
          details[dt.toLowerCase().replace(':', '')] = dd;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.show-genres a').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire la note
      const ratingText = $('.score').text().trim();
      const rating = ratingText ? parseFloat(ratingText) : null;
      
      // Créer l'objet drama détaillé
      const dramaDetails = {
        id: dramaId,
        title,
        nativeTitle,
        synopsis,
        image: imgSrc,
        rating,
        genres,
        details,
        source: 'mydramalist'
      };
      
      this.debugLog(`Détails du drama ${dramaId} récupérés`);
      return dramaDetails;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails du drama ${dramaId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Méthode principale de scraping
   */
  async scrape(limit = 20) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer les dramas récents
      const dramas = await this.getRecentDramas(limit);
      
      // Récupérer les détails pour chaque drama
      const detailedDramas = [];
      let errors = 0;
      
      for (const drama of dramas) {
        try {
          // Attendre un délai aléatoire pour éviter la détection
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));
          
          // Récupérer les détails
          const details = await this.getDramaDetails(drama.id);
          detailedDramas.push(details);
        } catch (error) {
          console.error(`Erreur lors de la récupération des détails du drama ${drama.id}: ${error.message}`);
          errors++;
        }
      }
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${detailedDramas.length} dramas récupérés, ${errors} erreurs, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: detailedDramas.length > 0,
        source: this.name,
        content_type: 'drama',
        items: detailedDramas,
        items_count: detailedDramas.length,
        errors_count: errors,
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
   * Recherche de dramas
   */
  async search(query, limit = 20) {
    try {
      this.debugLog(`Recherche de "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Construire l'URL de recherche
      const html = await this.relayClient.fetchMyDramaList(`/search?q=${encodeURIComponent(query)}`);
      
      // Parser le HTML
      const $ = parseHTML(html);
      
      // Extraire les résultats de recherche
      const results = [];
      
      // Sélectionner les éléments de la liste des résultats
      const resultElements = $('.box');
      
      for (let i = 0; i < Math.min(resultElements.length, limit); i++) {
        const element = resultElements[i];
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('h6 a');
          const title = titleElement.text().trim();
          const path = titleElement.attr('href');
          const url = path ? `${this.baseUrl}${path}` : null;
          
          // Extraire l'ID du drama depuis l'URL
          const id = path ? path.split('/')[2] : null;
          
          // Extraire l'image
          const imgElement = $(element).find('img.lazy');
          const imgSrc = imgElement.attr('data-src') || imgElement.attr('src');
          
          // Créer l'objet résultat
          const result = {
            id,
            title,
            url,
            image: imgSrc,
            source: 'mydramalist'
          };
          
          results.push(result);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
        }
      }
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Recherche terminée: ${results.length} résultats trouvés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: results.length > 0,
        source: this.name,
        query,
        items: results,
        items_count: results.length,
        duration_seconds: durationSeconds
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche: ${error.message}`);
      
      return {
        success: false,
        source: this.name,
        query,
        items_count: 0,
        error: error.message
      };
    }
  }
}

/**
 * Scraper pour VoirAnime
 */
class VoirAnimeScraper extends BaseScraper {
  constructor(debug = false) {
    super(debug);
    this.name = 'voiranime';
    this.baseUrl = 'https://v5.voiranime.com';
  }

  /**
   * Récupère les animes récents
   */
  async getRecentAnimes(limit = 20) {
    try {
      this.debugLog(`Récupération des ${limit} animes récents`);
      
      // Récupérer la page d'accueil pour les animes récents
      const html = await this.relayClient.fetchVoirAnime('/');
      
      // Parser le HTML
      const $ = parseHTML(html);
      
      // Extraire les informations des animes
      const animes = [];
      
      // Sélectionner les éléments de la liste des animes
      const animeElements = $('.items .item');
      
      for (let i = 0; i < Math.min(animeElements.length, limit); i++) {
        const element = animeElements[i];
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.data h3 a');
          const title = titleElement.text().trim();
          const path = titleElement.attr('href');
          const url = path || null;
          
          // Extraire l'ID de l'anime depuis l'URL
          const id = path ? path.split('/').pop() : null;
          
          // Extraire l'image
          const imgElement = $(element).find('.poster img');
          const imgSrc = imgElement.attr('data-src') || imgElement.attr('src');
          
          // Extraire les informations supplémentaires
          const typeElement = $(element).find('.data .meta .type');
          const type = typeElement.text().trim();
          
          // Extraire la note
          const ratingElement = $(element).find('.rating');
          const ratingText = ratingElement.text().trim();
          const rating = ratingText ? parseFloat(ratingText) : null;
          
          // Créer l'objet anime
          const anime = {
            id,
            title,
            url,
            image: imgSrc,
            type,
            rating,
            source: 'voiranime'
          };
          
          animes.push(anime);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations de l'anime #${i}: ${error.message}`);
        }
      }
      
      this.debugLog(`${animes.length} animes récupérés`);
      return animes;
    } catch (error) {
      console.error(`Erreur lors de la récupération des animes récents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les détails d'un anime
   */
  async getAnimeDetails(animeUrl) {
    try {
      this.debugLog(`Récupération des détails de l'anime ${animeUrl}`);
      
      const html = await this.relayClient.fetchHtml(animeUrl);
      
      // Parser le HTML
      const $ = parseHTML(html);
      
      // Extraire les informations de base
      const title = $('.sheader .data h1').text().trim();
      const synopsis = $('.wp-content .wp-content p').first().text().trim();
      
      // Extraire l'image
      const imgElement = $('.poster img');
      const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.wp-content .custom_fields .info').each((i, element) => {
        const label = $(element).find('.name').text().trim();
        const value = $(element).find('.value').text().trim();
        
        if (label && value) {
          details[label.toLowerCase().replace(':', '')] = value;
        }
      });
      
      // Extraire les genres
      const genres = [];
      $('.genres a').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire la note
      const ratingText = $('.rating').text().trim();
      const rating = ratingText ? parseFloat(ratingText) : null;
      
      // Créer l'objet anime détaillé
      const animeDetails = {
        title,
        synopsis,
        image: imgSrc,
        rating,
        genres,
        details,
        url: animeUrl,
        source: 'voiranime'
      };
      
      this.debugLog(`Détails de l'anime récupérés`);
      return animeDetails;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de l'anime: ${error.message}`);
      throw error;
    }
  }

  /**
   * Méthode principale de scraping
   */
  async scrape(limit = 20) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer les animes récents
      const animes = await this.getRecentAnimes(limit);
      
      // Récupérer les détails pour chaque anime
      const detailedAnimes = [];
      let errors = 0;
      
      for (const anime of animes) {
        try {
          // Attendre un délai aléatoire pour éviter la détection
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));
          
          // Récupérer les détails
          if (anime.url) {
            const details = await this.getAnimeDetails(anime.url);
            detailedAnimes.push(details);
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des détails de l'anime ${anime.title}: ${error.message}`);
          errors++;
        }
      }
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${detailedAnimes.length} animes récupérés, ${errors} erreurs, durée: ${durationSeconds.toFixed(3)} secondes`);
      
      return {
        success: detailedAnimes.length > 0,
        source: this.name,
        content_type: 'anime',
        items: detailedAnimes,
        items_count: detailedAnimes.length,
        errors_count: errors,
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
}

export { MyDramaListScraper, VoirAnimeScraper };
