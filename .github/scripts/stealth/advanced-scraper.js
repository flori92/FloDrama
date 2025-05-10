/**
 * Service de scraping avancé optimisé pour Cloudflare Workers
 * 
 * Ce module fournit des outils de scraping haute performance
 * adaptés aux contraintes spécifiques de Cloudflare
 */

import WebshareProxyClient from './proxy-client';
import { parseHTML } from './html-parser';

/**
 * Client HTTP avancé avec support de proxy et contournement des protections
 */
class HttpClient {
  constructor(debug = false) {
    this.debug = debug;
    this.proxyClient = new WebshareProxyClient(undefined, debug);
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    ];
    this.cookieJar = {};
    this.sessionId = Math.random().toString(36).substring(2, 15);
  }

  /**
   * Obtient un User-Agent aléatoire
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Stocke les cookies d'une réponse
   */
  saveCookies(url, response) {
    const domain = new URL(url).hostname;
    const cookies = response.headers.get('set-cookie');
    
    if (cookies) {
      if (!this.cookieJar[domain]) {
        this.cookieJar[domain] = {};
      }
      
      cookies.split(',').forEach(cookieStr => {
        const parts = cookieStr.split(';')[0].trim().split('=');
        if (parts.length === 2) {
          const [name, value] = parts;
          this.cookieJar[domain][name] = value;
        }
      });
      
      if (this.debug) {
        console.log(`[HTTP_DEBUG] Cookies sauvegardés pour ${domain}:`, this.cookieJar[domain]);
      }
    }
  }

  /**
   * Récupère les cookies pour un domaine
   */
  getCookieString(url) {
    const domain = new URL(url).hostname;
    const cookies = this.cookieJar[domain];
    
    if (!cookies) {
      return '';
    }
    
    return Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  /**
   * Effectue une requête HTTP avec contournement des protections
   */
  async fetch(url, options = {}) {
    // Paramètres par défaut
    const defaultOptions = {
      method: 'GET',
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': new URL(url).origin,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="123", "Google Chrome";v="123"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'X-Requested-With': 'XMLHttpRequest'
      },
      redirect: 'follow',
      cf: {
        cacheTtl: 1,
        cacheEverything: false,
        minify: false,
        mirage: false,
        scrapeShield: false,
        apps: false
      }
    };
    
    // Fusionner les options par défaut avec les options fournies
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    // Ajouter les cookies si disponibles
    const cookieString = this.getCookieString(url);
    if (cookieString) {
      mergedOptions.headers['Cookie'] = cookieString;
    }
    
    // Ajouter un identifiant de session pour simuler un vrai navigateur
    mergedOptions.headers['X-Session-ID'] = this.sessionId;
    
    try {
      // Effectuer une pré-visite de la page d'accueil pour obtenir des cookies si nécessaire
      const urlObj = new URL(url);
      const isFirstVisit = !this.cookieJar[urlObj.hostname];
      
      if (isFirstVisit && urlObj.pathname !== '/') {
        if (this.debug) {
          console.log(`[HTTP_DEBUG] Première visite sur ${urlObj.hostname}, visite préalable de la page d'accueil`);
        }
        
        try {
          const homepageUrl = `${urlObj.protocol}//${urlObj.hostname}/`;
          const homepageResponse = await this.proxyClient.fetch(homepageUrl, {
            ...mergedOptions,
            headers: {
              ...mergedOptions.headers,
              'Referer': 'https://www.google.com/'
            }
          });
          
          // Sauvegarder les cookies
          this.saveCookies(homepageUrl, homepageResponse);
          
          // Attendre un peu pour simuler un comportement humain
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          
          // Mettre à jour les cookies pour la requête principale
          const updatedCookieString = this.getCookieString(url);
          if (updatedCookieString) {
            mergedOptions.headers['Cookie'] = updatedCookieString;
          }
        } catch (error) {
          console.warn(`[HTTP_DEBUG] Erreur lors de la visite préalable: ${error.message}`);
          // Continuer malgré l'erreur
        }
      }
      
      // Effectuer la requête principale via le proxy
      if (this.debug) {
        console.log(`[HTTP_DEBUG] Requête vers ${url} avec options:`, mergedOptions);
      }
      
      const response = await this.proxyClient.fetch(url, mergedOptions);
      
      // Sauvegarder les cookies de la réponse
      this.saveCookies(url, response);
      
      if (this.debug) {
        console.log(`[HTTP_DEBUG] Réponse de ${url}: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`[HTTP_ERROR] Erreur lors de la requête vers ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère le contenu HTML d'une URL
   */
  async getHTML(url) {
    const response = await this.fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Content-Type non HTML: ${contentType}`);
    }
    
    const html = await response.text();
    return html;
  }

  /**
   * Récupère une image et la convertit en ArrayBuffer
   */
  async getImage(url, referer = null) {
    const options = {
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    };
    
    if (referer) {
      options.headers['Referer'] = referer;
    }
    
    const response = await this.fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }
}

/**
 * Classe de base pour les scrapers
 */
class BaseScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.httpClient = new HttpClient(debug);
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
      const url = `${this.baseUrl}/shows/recent/`;
      const html = await this.httpClient.getHTML(url);
      
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
      const url = `${this.baseUrl}/id/${dramaId}`;
      const html = await this.httpClient.getHTML(url);
      
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
      const url = this.baseUrl;
      const html = await this.httpClient.getHTML(url);
      
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
      
      const html = await this.httpClient.getHTML(animeUrl);
      
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

export { HttpClient, BaseScraper, MyDramaListScraper, VoirAnimeScraper };
