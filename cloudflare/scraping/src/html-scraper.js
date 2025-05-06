/**
 * Scrapers avancés pour MyDramaList et VoirAnime
 * 
 * Ces scrapers utilisent ScrapingBee pour récupérer le HTML
 * et parser les données avec Cheerio, une implémentation légère de jQuery.
 */

import { RelayClient } from './relay-client';
import { ScrapingBeeClient } from './scrapingbee-client';
import * as cheerio from 'cheerio';

// La clé API ScrapingBee sera récupérée depuis les variables d'environnement

/**
 * Scraper pour MyDramaList
 */
class MyDramaListScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'mydramalist';
    this.baseUrl = 'https://mydramalist.com';
    this.relayClient = new RelayClient();
    // La clé API sera injectée lors de l'exécution
    this.scrapingBeeClient = null;
  }
  
  /**
   * Active le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
    this.relayClient.enableDebug(debug);
    if (this.scrapingBeeClient) {
      this.scrapingBeeClient.enableDebug(debug);
    }
    return this;
  }
  
  /**
   * Initialise le client ScrapingBee avec la clé API
   */
  initScrapingBeeClient(env) {
    if (!this.scrapingBeeClient && env && env.SCRAPINGBEE_API_KEY) {
      this.scrapingBeeClient = new ScrapingBeeClient(env.SCRAPINGBEE_API_KEY, this.debug);
    }
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
    
    // Initialiser le client ScrapingBee si nécessaire
    this.initScrapingBeeClient(env);
    
    try {
      // Essayer d'abord avec ScrapingBee si disponible
      if (this.scrapingBeeClient) {
        try {
          this.debugLog(`Tentative avec ScrapingBee...`);
          const html = await this.scrapingBeeClient.fetchHtml(fullUrl);
          
          if (!html) {
            throw new Error('HTML vide');
          }
          
          return html;
        } catch (scrapingBeeError) {
          // Si ScrapingBee échoue, essayer avec le serveur relais
          this.debugLog(`ScrapingBee a échoué: ${scrapingBeeError.message}, tentative avec le serveur relais...`);
        }
      }
      
      // Fallback sur le serveur relais
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
      
      // Récupérer la page d'accueil ou la page des dramas récents
      const urls = [
        '/shows/recent/',
        '/shows/top/',
        '/shows/popular/',
        '/shows/'
      ];
      
      let html = null;
      let error = null;
      
      // Essayer chaque URL jusqu'à ce qu'une fonctionne
      for (const url of urls) {
        try {
          html = await this.fetchHtml(url, env);
          if (html) {
            this.debugLog(`Succès avec l'URL: ${url}`);
            break;
          }
        } catch (err) {
          error = err;
          this.debugLog(`Échec avec l'URL: ${url}, erreur: ${err.message}`);
        }
      }
      
      if (!html) {
        throw error || new Error('Impossible de récupérer le HTML des dramas récents');
      }
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des dramas
      const dramas = [];
      
      // Essayer différents sélecteurs pour s'adapter aux changements de structure
      const selectors = [
        '.box', // Ancien sélecteur
        '.mdl-card', // Nouveau sélecteur possible
        '.card', // Alternative
        '.drama-card', // Alternative
        '.show-card', // Alternative
        '[data-role="drama-card"]', // Alternative avec attribut data
        '.list-item' // Alternative générique
      ];
      
      // Essayer chaque sélecteur jusqu'à ce qu'on trouve des résultats
      for (const selector of selectors) {
        const elements = $(selector);
        this.debugLog(`Essai du sélecteur "${selector}": ${elements.length} éléments trouvés`);
        
        if (elements.length > 0) {
          elements.each((i, element) => {
            if (i >= limit) {
              return false; // Limiter le nombre de résultats
            }
            
            try {
              // Essayer différents sélecteurs pour le titre
              const titleSelectors = ['h6.title a', 'h6 a', '.title a', 'a.title', '.caption a', 'a[itemprop="url"]'];
              let title = null;
              let path = null;
              
              for (const titleSelector of titleSelectors) {
                const titleElement = $(element).find(titleSelector);
                if (titleElement.length > 0) {
                  title = titleElement.text().trim();
                  path = titleElement.attr('href');
                  break;
                }
              }
              
              if (!title || !path) {
                this.debugLog(`Titre ou chemin non trouvé pour l'élément #${i}`);
                return; // Passer à l'élément suivant
              }
              
              const url = path ? `${this.baseUrl}${path}` : null;
              
              // Essayer différents sélecteurs pour l'image
              const imgSelectors = ['img.lazy', 'img[data-src]', 'img.poster', '.poster img', 'img'];
              let imgSrc = null;
              
              for (const imgSelector of imgSelectors) {
                const imgElement = $(element).find(imgSelector);
                if (imgElement.length > 0) {
                  imgSrc = imgElement.attr('data-src') || imgElement.attr('src');
                  break;
                }
              }
              
              // Essayer différents sélecteurs pour la note
              const ratingSelectors = ['.score', '.rating', '[itemprop="ratingValue"]', '.score-container'];
              let rating = null;
              
              for (const ratingSelector of ratingSelectors) {
                const ratingElement = $(element).find(ratingSelector);
                if (ratingElement.length > 0) {
                  rating = ratingElement.text().trim();
                  break;
                }
              }
              
              // Créer l'objet drama
              const drama = {
                title,
                url,
                image: imgSrc,
                rating: rating || null,
                source: 'mydramalist'
              };
              
              dramas.push(drama);
            } catch (error) {
              console.error(`Erreur lors de l'extraction des informations du drama #${i}: ${error.message}`);
            }
          });
          
          if (dramas.length > 0) {
            break; // Sortir de la boucle si on a trouvé des dramas
          }
        }
      }
      
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
      
      // Encoder la requête
      const encodedQuery = encodeURIComponent(query);
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/search?q=${encodedQuery}&type=titles`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des dramas
      const dramas = [];
      
      // Essayer différents sélecteurs pour s'adapter aux changements de structure
      const selectors = [
        '.box', // Ancien sélecteur
        '.mdl-card', // Nouveau sélecteur possible
        '.card', // Alternative
        '.drama-card', // Alternative
        '.show-card', // Alternative
        '.search-result', // Sélecteur spécifique pour les résultats de recherche
        '.list-item' // Alternative générique
      ];
      
      // Essayer chaque sélecteur jusqu'à ce qu'on trouve des résultats
      for (const selector of selectors) {
        const elements = $(selector);
        this.debugLog(`Essai du sélecteur "${selector}": ${elements.length} éléments trouvés`);
        
        if (elements.length > 0) {
          elements.each((i, element) => {
            if (i >= limit) {
              return false; // Limiter le nombre de résultats
            }
            
            try {
              // Essayer différents sélecteurs pour le titre
              const titleSelectors = ['h6.title a', 'h6 a', '.title a', 'a.title', '.caption a', 'a[itemprop="url"]'];
              let title = null;
              let path = null;
              
              for (const titleSelector of titleSelectors) {
                const titleElement = $(element).find(titleSelector);
                if (titleElement.length > 0) {
                  title = titleElement.text().trim();
                  path = titleElement.attr('href');
                  break;
                }
              }
              
              if (!title || !path) {
                this.debugLog(`Titre ou chemin non trouvé pour l'élément #${i}`);
                return; // Passer à l'élément suivant
              }
              
              const url = path ? `${this.baseUrl}${path}` : null;
              
              // Essayer différents sélecteurs pour l'image
              const imgSelectors = ['img.lazy', 'img[data-src]', 'img.poster', '.poster img', 'img'];
              let imgSrc = null;
              
              for (const imgSelector of imgSelectors) {
                const imgElement = $(element).find(imgSelector);
                if (imgElement.length > 0) {
                  imgSrc = imgElement.attr('data-src') || imgElement.attr('src');
                  break;
                }
              }
              
              // Créer l'objet drama
              const drama = {
                title,
                url,
                image: imgSrc,
                source: 'mydramalist'
              };
              
              dramas.push(drama);
            } catch (error) {
              console.error(`Erreur lors de l'extraction des informations du résultat #${i}: ${error.message}`);
            }
          });
          
          if (dramas.length > 0) {
            break; // Sortir de la boucle si on a trouvé des dramas
          }
        }
      }
      
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
      this.debugLog(`Récupération des détails du drama avec l'ID: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page du drama
      const html = await this.fetchHtml(id, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations du drama
      // Essayer différents sélecteurs pour le titre
      const titleSelectors = ['h1.film-title', 'h1[itemprop="name"]', '.film-header h1', '.title-wrapper h1', 'h1'];
      let title = null;
      
      for (const titleSelector of titleSelectors) {
        const titleElement = $(titleSelector);
        if (titleElement.length > 0) {
          title = titleElement.text().trim();
          break;
        }
      }
      
      if (!title) {
        throw new Error('Titre non trouvé');
      }
      
      // Essayer différents sélecteurs pour l'image
      const imgSelectors = ['.film-cover img', '.poster img', 'img[itemprop="image"]', '.cover-image img'];
      let image = null;
      
      for (const imgSelector of imgSelectors) {
        const imgElement = $(imgSelector);
        if (imgElement.length > 0) {
          image = imgElement.attr('data-src') || imgElement.attr('src');
          break;
        }
      }
      
      // Essayer différents sélecteurs pour la description
      const descSelectors = ['.show-synopsis', '[itemprop="description"]', '.synopsis', '.summary'];
      let description = null;
      
      for (const descSelector of descSelectors) {
        const descElement = $(descSelector);
        if (descElement.length > 0) {
          description = descElement.text().trim();
          break;
        }
      }
      
      // Extraire les informations supplémentaires
      const details = {};
      
      // Essayer différents sélecteurs pour les détails
      const detailsSelectors = ['.show-details .box-body', '.box-body', '.details-table', '.info-table'];
      
      for (const detailsSelector of detailsSelectors) {
        const detailsElement = $(detailsSelector);
        if (detailsElement.length > 0) {
          detailsElement.find('li, tr').each((i, element) => {
            const label = $(element).find('.mdl-label, .info-label, th').text().trim().replace(':', '').toLowerCase();
            const value = $(element).find('.mdl-info, .info-value, td').text().trim();
            
            if (label && value) {
              details[label] = value;
            }
          });
          
          if (Object.keys(details).length > 0) {
            break;
          }
        }
      }
      
      // Extraire les genres
      const genres = [];
      $('.show-genres a, [itemprop="genre"]').each((i, element) => {
        genres.push($(element).text().trim());
      });
      
      // Extraire le casting
      const cast = [];
      $('.credits .role-card, .cast-credits .cast-card').each((i, element) => {
        const actorName = $(element).find('.text-primary, .actor-name').text().trim();
        const role = $(element).find('.text-muted, .role-name').text().trim();
        
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
        description: description || null,
        image,
        genres,
        details,
        cast,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'mydramalist'
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
 * Scraper pour VoirAnime
 */
class VoirAnimeScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'voiranime';
    this.baseUrl = 'https://v5.voiranime.com';
    this.relayClient = new RelayClient();
    // La clé API sera injectée lors de l'exécution
    this.scrapingBeeClient = null;
  }
  
  /**
   * Active le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
    this.relayClient.enableDebug(debug);
    if (this.scrapingBeeClient) {
      this.scrapingBeeClient.enableDebug(debug);
    }
    return this;
  }
  
  /**
   * Initialise le client ScrapingBee avec la clé API
   */
  initScrapingBeeClient(env) {
    if (!this.scrapingBeeClient && env && env.SCRAPINGBEE_API_KEY) {
      this.scrapingBeeClient = new ScrapingBeeClient(env.SCRAPINGBEE_API_KEY, this.debug);
    }
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
    
    // Initialiser le client ScrapingBee si nécessaire
    this.initScrapingBeeClient(env);
    
    try {
      // Essayer d'abord avec ScrapingBee si disponible
      if (this.scrapingBeeClient) {
        try {
          this.debugLog(`Tentative avec ScrapingBee...`);
          const html = await this.scrapingBeeClient.fetchHtml(fullUrl);
          
          if (!html) {
            throw new Error('HTML vide');
          }
          
          return html;
        } catch (scrapingBeeError) {
          // Si ScrapingBee échoue, essayer avec le serveur relais
          this.debugLog(`ScrapingBee a échoué: ${scrapingBeeError.message}, tentative avec le serveur relais...`);
        }
      }
      
      // Fallback sur le serveur relais
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
      
      // Récupérer la page d'accueil
      const html = await this.fetchHtml('/', env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des animes
      const animes = [];
      
      // Sélectionner les éléments de la liste des animes
      $('.items .item').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.data h3 a');
          const title = titleElement.text().trim();
          const url = titleElement.attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('.poster img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Créer l'objet anime
          const anime = {
            title,
            url,
            image: imgSrc,
            source: 'voiranime'
          };
          
          animes.push(anime);
        } catch (error) {
          console.error(`Erreur lors de l'extraction des informations de l'anime #${i}: ${error.message}`);
        }
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${animes.length} animes récupérés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
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
      this.debugLog(`Recherche de "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/?s=${encodeURIComponent(query)}`, env);
      
      // Parser le HTML avec Cheerio
      const $ = cheerio.load(html);
      
      // Extraire les informations des animes
      const animes = [];
      
      // Sélectionner les éléments de la liste des résultats
      $('.items .item').each((i, element) => {
        if (i >= limit) {
          return false; // Limiter le nombre de résultats
        }
        
        try {
          // Extraire les informations de base
          const titleElement = $(element).find('.data h3 a');
          const title = titleElement.text().trim();
          const url = titleElement.attr('href');
          
          // Extraire l'image
          const imgElement = $(element).find('.poster img');
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          
          // Créer l'objet anime
          const anime = {
            title,
            url,
            image: imgSrc,
            source: 'voiranime'
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
      const title = $('.entry-title').text().trim();
      const description = $('.synps').text().trim();
      const image = $('.poster').attr('src');
      
      // Extraire les informations supplémentaires
      const details = {};
      $('.custom_fields .info').each((i, element) => {
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
      
      const anime = {
        id,
        title,
        description,
        image,
        genres,
        details,
        url: id.startsWith('http') ? id : `${this.baseUrl}${id}`,
        source: 'voiranime'
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

export { MyDramaListScraper, VoirAnimeScraper };
