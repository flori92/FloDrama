// Service de scraping unifié pour FloDrama
// Fusionne les fonctionnalités de AdaptiveScraperService, ScrapingService, SmartScrapingService et videoScraper

/**
 * Service de scraping intelligent avec adaptation automatique et gestion des erreurs
 * @class ScrapingService
 */
export class ScrapingService {
  /**
   * Constructeur du service de scraping
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {Object} config - Configuration du service
   * @param {boolean} config.useProxy - Utiliser un proxy pour les requêtes (défaut: true)
   * @param {string} config.proxyUrl - URL du proxy à utiliser
   * @param {number} config.timeout - Timeout pour les requêtes en ms (défaut: 30000)
   * @param {number} config.retryCount - Nombre de tentatives en cas d'échec (défaut: 3)
   * @param {number} config.retryDelay - Délai entre les tentatives en ms (défaut: 1000)
   */
  constructor(apiService, config = {}) {
    this.apiService = apiService;
    this.useProxy = config.useProxy !== undefined ? config.useProxy : true;
    this.proxyUrl = config.proxyUrl || 'https://proxy.flodrama.com';
    this.timeout = config.timeout || 30000;
    this.retryCount = config.retryCount || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Paramètres pour éviter la détection
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ];
    
    // Cache pour les résultats
    this.cache = new Map();
    this.cacheDuration = 60 * 60 * 1000; // 1 heure
    
    console.log('ScrapingService initialisé');
  }
  
  /**
   * Obtenir un User-Agent aléatoire
   * @returns {string} - User-Agent
   * @private
   */
  _getRandomUserAgent() {
    const index = Math.floor(Math.random() * this.userAgents.length);
    return this.userAgents[index];
  }
  
  /**
   * Générer une clé de cache
   * @param {string} url - URL à scraper
   * @param {Object} options - Options de scraping
   * @returns {string} - Clé de cache
   * @private
   */
  _getCacheKey(url, options) {
    return `${url}:${JSON.stringify(options)}`;
  }
  
  /**
   * Vérifier si une URL est en cache
   * @param {string} url - URL à scraper
   * @param {Object} options - Options de scraping
   * @returns {Object|null} - Résultat en cache ou null
   * @private
   */
  _getFromCache(url, options) {
    const key = this._getCacheKey(url, options);
    const cachedData = this.cache.get(key);
    
    if (cachedData && (Date.now() - cachedData.timestamp < this.cacheDuration)) {
      console.log(`Utilisation du cache pour ${url}`);
      return cachedData.data;
    }
    
    return null;
  }
  
  /**
   * Mettre en cache les résultats
   * @param {string} url - URL scrapée
   * @param {Object} options - Options de scraping
   * @param {Object} data - Données à mettre en cache
   * @private
   */
  _setCache(url, options, data) {
    const key = this._getCacheKey(url, options);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Effectuer une pause
   * @param {number} ms - Durée de la pause en ms
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Scraper une URL avec gestion des erreurs et retries
   * @param {string} url - URL à scraper
   * @param {Object} options - Options de scraping
   * @param {boolean} options.useCache - Utiliser le cache (défaut: true)
   * @param {boolean} options.parseHtml - Parser le HTML (défaut: true)
   * @param {string} options.selector - Sélecteur CSS pour filtrer le contenu
   * @param {boolean} options.includeMetadata - Inclure les métadonnées (défaut: false)
   * @param {boolean} options.followRedirects - Suivre les redirections (défaut: true)
   * @returns {Promise<Object>} - Résultat du scraping
   */
  async scrape(url, options = {}) {
    const {
      useCache = true,
      parseHtml = true,
      selector = null,
      includeMetadata = false,
      followRedirects = true
    } = options;
    
    // Vérifier le cache
    if (useCache) {
      const cachedResult = this._getFromCache(url, options);
      if (cachedResult) return cachedResult;
    }
    
    let lastError = null;
    
    // Tentatives avec retry
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        // Ajouter un délai entre les tentatives
        if (attempt > 0) {
          await this._sleep(this.retryDelay * attempt);
        }
        
        // Effectuer la requête
        const result = await this._performScrape(url, {
          parseHtml,
          selector,
          includeMetadata,
          followRedirects,
          attempt
        });
        
        // Mettre en cache le résultat
        if (useCache) {
          this._setCache(url, options, result);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Tentative ${attempt + 1}/${this.retryCount} échouée pour ${url}:`, error.message);
        
        // Adapter la stratégie en fonction de l'erreur
        if (error.status === 403 || error.status === 429) {
          // Augmenter le délai pour les erreurs de rate limiting
          await this._sleep(this.retryDelay * 3 * (attempt + 1));
        }
      }
    }
    
    // Toutes les tentatives ont échoué
    console.error(`Échec du scraping pour ${url} après ${this.retryCount} tentatives`);
    throw lastError || new Error(`Échec du scraping pour ${url}`);
  }
  
  /**
   * Effectuer le scraping
   * @param {string} url - URL à scraper
   * @param {Object} options - Options de scraping
   * @returns {Promise<Object>} - Résultat du scraping
   * @private
   */
  async _performScrape(url, options) {
    const {
      parseHtml,
      selector,
      includeMetadata,
      followRedirects,
      attempt
    } = options;
    
    // Préparer les headers
    const headers = {
      'User-Agent': this._getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // Ajouter un referer aléatoire pour les tentatives suivantes
    if (attempt > 0) {
      const referers = [
        'https://www.google.com/',
        'https://www.bing.com/',
        'https://www.flodrama.com/'
      ];
      headers['Referer'] = referers[Math.floor(Math.random() * referers.length)];
    }
    
    try {
      let response;
      
      if (this.useProxy) {
        // Utiliser le proxy
        response = await this.apiService.post('/proxy/fetch', {
          url,
          headers,
          followRedirects,
          timeout: this.timeout
        });
      } else {
        // Requête directe
        const fetchResponse = await fetch(url, {
          method: 'GET',
          headers,
          redirect: followRedirects ? 'follow' : 'manual',
          signal: AbortSignal.timeout(this.timeout)
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error: ${fetchResponse.status} ${fetchResponse.statusText}`);
        }
        
        const html = await fetchResponse.text();
        response = { html, status: fetchResponse.status, headers: Object.fromEntries(fetchResponse.headers) };
      }
      
      // Traiter la réponse
      const result = {
        url,
        status: response.status,
        content: response.html
      };
      
      // Parser le HTML si demandé
      if (parseHtml && response.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.html, 'text/html');
        
        // Appliquer le sélecteur si fourni
        if (selector) {
          const elements = doc.querySelectorAll(selector);
          result.elements = Array.from(elements).map(el => el.outerHTML);
        }
        
        // Extraire les métadonnées si demandé
        if (includeMetadata) {
          result.metadata = this._extractMetadata(doc);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Erreur lors du scraping de ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Extraire les métadonnées d'une page
   * @param {Document} doc - Document HTML
   * @returns {Object} - Métadonnées
   * @private
   */
  _extractMetadata(doc) {
    const metadata = {
      title: doc.title || '',
      description: '',
      keywords: '',
      ogTags: {}
    };
    
    // Description
    const descriptionMeta = doc.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      metadata.description = descriptionMeta.getAttribute('content') || '';
    }
    
    // Keywords
    const keywordsMeta = doc.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      metadata.keywords = keywordsMeta.getAttribute('content') || '';
    }
    
    // Open Graph tags
    const ogTags = doc.querySelectorAll('meta[property^="og:"]');
    ogTags.forEach(tag => {
      const property = tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (property && content) {
        const key = property.replace('og:', '');
        metadata.ogTags[key] = content;
      }
    });
    
    return metadata;
  }
  
  /**
   * Scraper une vidéo
   * @param {string} url - URL de la vidéo
   * @param {Object} options - Options de scraping
   * @returns {Promise<Object>} - Informations sur la vidéo
   */
  async scrapeVideo(url, options = {}) {
    try {
      // Scraper la page
      const result = await this.scrape(url, {
        ...options,
        parseHtml: true,
        includeMetadata: true
      });
      
      // Extraire les informations de la vidéo
      const videoInfo = this._extractVideoInfo(result.content, url);
      
      return {
        ...videoInfo,
        url,
        metadata: result.metadata
      };
    } catch (error) {
      console.error(`Erreur lors du scraping de la vidéo ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Extraire les informations d'une vidéo
   * @param {string} html - Contenu HTML
   * @param {string} url - URL de la vidéo
   * @returns {Object} - Informations sur la vidéo
   * @private
   */
  _extractVideoInfo(html, url) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Informations de base
    const videoInfo = {
      title: '',
      description: '',
      thumbnail: '',
      duration: '',
      sources: []
    };
    
    // Titre
    videoInfo.title = doc.title || '';
    
    // Description
    const descriptionMeta = doc.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      videoInfo.description = descriptionMeta.getAttribute('content') || '';
    }
    
    // Thumbnail
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (ogImage) {
      videoInfo.thumbnail = ogImage.getAttribute('content') || '';
    }
    
    // Rechercher les sources vidéo
    const videoTags = doc.querySelectorAll('video');
    const sourceTags = doc.querySelectorAll('source');
    const iframeTags = doc.querySelectorAll('iframe');
    
    // Extraire les sources des balises video et source
    videoTags.forEach(video => {
      const src = video.getAttribute('src');
      if (src) {
        videoInfo.sources.push({
          url: this._resolveUrl(src, url),
          type: video.getAttribute('type') || 'video/mp4',
          quality: 'unknown'
        });
      }
    });
    
    sourceTags.forEach(source => {
      const src = source.getAttribute('src');
      if (src) {
        videoInfo.sources.push({
          url: this._resolveUrl(src, url),
          type: source.getAttribute('type') || 'video/mp4',
          quality: source.getAttribute('size') || source.getAttribute('label') || 'unknown'
        });
      }
    });
    
    // Extraire les sources des iframes
    iframeTags.forEach(iframe => {
      const src = iframe.getAttribute('src');
      if (src) {
        videoInfo.sources.push({
          url: this._resolveUrl(src, url),
          type: 'iframe',
          quality: 'unknown'
        });
      }
    });
    
    // Rechercher les sources dans le JavaScript
    const scriptTags = doc.querySelectorAll('script');
    scriptTags.forEach(script => {
      const content = script.textContent;
      if (content) {
        // Rechercher les URLs vidéo dans le JavaScript
        const mp4Regex = /['"](?:https?:)?\/\/[^'"]*\.mp4[^'"]*['"]/g;
        const m3u8Regex = /['"](?:https?:)?\/\/[^'"]*\.m3u8[^'"]*['"]/g;
        
        const mp4Matches = content.match(mp4Regex) || [];
        const m3u8Matches = content.match(m3u8Regex) || [];
        
        // Ajouter les sources MP4
        mp4Matches.forEach(match => {
          const url = match.replace(/['"]/g, '');
          videoInfo.sources.push({
            url,
            type: 'video/mp4',
            quality: 'unknown'
          });
        });
        
        // Ajouter les sources HLS
        m3u8Matches.forEach(match => {
          const url = match.replace(/['"]/g, '');
          videoInfo.sources.push({
            url,
            type: 'application/x-mpegURL',
            quality: 'unknown'
          });
        });
      }
    });
    
    // Dédupliquer les sources
    const uniqueSources = [];
    const seenUrls = new Set();
    
    videoInfo.sources.forEach(source => {
      if (!seenUrls.has(source.url)) {
        seenUrls.add(source.url);
        uniqueSources.push(source);
      }
    });
    
    videoInfo.sources = uniqueSources;
    
    return videoInfo;
  }
  
  /**
   * Résoudre une URL relative
   * @param {string} url - URL à résoudre
   * @param {string} base - URL de base
   * @returns {string} - URL résolue
   * @private
   */
  _resolveUrl(url, base) {
    try {
      return new URL(url, base).href;
    } catch (e) {
      return url;
    }
  }
  
  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Cache de scraping vidé');
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default ScrapingService;
