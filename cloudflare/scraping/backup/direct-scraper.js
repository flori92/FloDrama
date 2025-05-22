/**
 * Scraper direct pour Cloudflare Workers
 * 
 * Version simplifiée du scraper qui fonctionne directement dans le Worker
 * sans passer par le serveur relais.
 */

// Liste des User-Agents pour simuler différents navigateurs
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/123.0'
];

/**
 * Retourne un User-Agent aléatoire de la liste
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Scraper direct pour MyDramaList
 */
class DirectMyDramaListScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'mydramalist';
    this.baseUrl = 'https://mydramalist.com';
  }
  
  /**
   * Active ou désactive le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
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
   * Récupère le HTML d'une URL avec un User-Agent aléatoire
   */
  async fetchHtml(url) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    this.debugLog(`Récupération du HTML de ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.text();
  }
  
  /**
   * Extrait des informations de base des dramas récents
   */
  async scrape(limit = 20) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page d'accueil
      const html = await this.fetchHtml('/shows/recent/');
      
      // Extraction simplifiée des informations
      const titleRegex = /<h6 class="title"><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/h6>/g;
      const imageRegex = /<img[^>]*data-src="([^"]+)"[^>]*>/g;
      
      const titles = [];
      const urls = [];
      const images = [];
      
      let match;
      while ((match = titleRegex.exec(html)) !== null && titles.length < limit) {
        urls.push(match[1]);
        titles.push(match[2]);
      }
      
      while ((match = imageRegex.exec(html)) !== null && images.length < limit) {
        images.push(match[1]);
      }
      
      // Créer les objets drama
      const dramas = [];
      for (let i = 0; i < Math.min(titles.length, limit); i++) {
        const drama = {
          title: titles[i],
          url: `${this.baseUrl}${urls[i]}`,
          image: images[i] || null,
          source: 'mydramalist'
        };
        
        dramas.push(drama);
      }
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      
      this.debugLog(`Fin du scraping: ${dramas.length} dramas récupérés, durée: ${durationSeconds.toFixed(3)} secondes`);
      
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
  async search(query, limit = 20) {
    try {
      this.debugLog(`Recherche de "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/search?q=${encodeURIComponent(query)}`);
      
      // Extraction simplifiée des informations
      const titleRegex = /<h6 class="title"><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/h6>/g;
      const imageRegex = /<img[^>]*data-src="([^"]+)"[^>]*>/g;
      
      const titles = [];
      const urls = [];
      const images = [];
      
      let match;
      while ((match = titleRegex.exec(html)) !== null && titles.length < limit) {
        urls.push(match[1]);
        titles.push(match[2]);
      }
      
      while ((match = imageRegex.exec(html)) !== null && images.length < limit) {
        images.push(match[1]);
      }
      
      // Créer les objets drama
      const dramas = [];
      for (let i = 0; i < Math.min(titles.length, limit); i++) {
        const drama = {
          title: titles[i],
          url: `${this.baseUrl}${urls[i]}`,
          image: images[i] || null,
          source: 'mydramalist'
        };
        
        dramas.push(drama);
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
  async getDramaDetails(id) {
    try {
      this.debugLog(`Récupération des détails du drama ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page du drama
      const html = await this.fetchHtml(`/id/${id}`);
      
      // Extraction simplifiée des informations
      const titleRegex = /<h1 class="film-title">([^<]+)<\/h1>/;
      const descriptionRegex = /<div class="show-synopsis"[^>]*>([\s\S]*?)<\/div>/;
      const imageRegex = /<img[^>]*class="img-responsive"[^>]*src="([^"]+)"[^>]*>/;
      
      const titleMatch = html.match(titleRegex);
      const descriptionMatch = html.match(descriptionRegex);
      const imageMatch = html.match(imageRegex);
      
      const drama = {
        id,
        title: titleMatch ? titleMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim().replace(/<[^>]*>/g, '') : '',
        image: imageMatch ? imageMatch[1] : null,
        url: `${this.baseUrl}/id/${id}`,
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
 * Scraper direct pour VoirAnime
 */
class DirectVoirAnimeScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'voiranime';
    this.baseUrl = 'https://v5.voiranime.com';
  }
  
  /**
   * Active ou désactive le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
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
   * Récupère le HTML d'une URL avec un User-Agent aléatoire
   */
  async fetchHtml(url) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    this.debugLog(`Récupération du HTML de ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.text();
  }
  
  /**
   * Extrait des informations de base des animes récents
   */
  async scrape(limit = 20) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page d'accueil
      const html = await this.fetchHtml('/');
      
      // Extraction simplifiée des informations
      const titleRegex = /<h3 class="title"><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/h3>/g;
      const imageRegex = /<img[^>]*src="([^"]+)"[^>]*class="poster[^>]*>/g;
      
      const titles = [];
      const urls = [];
      const images = [];
      
      let match;
      while ((match = titleRegex.exec(html)) !== null && titles.length < limit) {
        urls.push(match[1]);
        titles.push(match[2]);
      }
      
      while ((match = imageRegex.exec(html)) !== null && images.length < limit) {
        images.push(match[1]);
      }
      
      // Créer les objets anime
      const animes = [];
      for (let i = 0; i < Math.min(titles.length, limit); i++) {
        const anime = {
          title: titles[i],
          url: urls[i],
          image: images[i] || null,
          source: 'voiranime'
        };
        
        animes.push(anime);
      }
      
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
  async search(query, limit = 20) {
    try {
      this.debugLog(`Recherche de "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Récupérer la page de recherche
      const html = await this.fetchHtml(`/?s=${encodeURIComponent(query)}`);
      
      // Extraction simplifiée des informations
      const titleRegex = /<h3 class="title"><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/h3>/g;
      const imageRegex = /<img[^>]*src="([^"]+)"[^>]*class="poster[^>]*>/g;
      
      const titles = [];
      const urls = [];
      const images = [];
      
      let match;
      while ((match = titleRegex.exec(html)) !== null && titles.length < limit) {
        urls.push(match[1]);
        titles.push(match[2]);
      }
      
      while ((match = imageRegex.exec(html)) !== null && images.length < limit) {
        images.push(match[1]);
      }
      
      // Créer les objets anime
      const animes = [];
      for (let i = 0; i < Math.min(titles.length, limit); i++) {
        const anime = {
          title: titles[i],
          url: urls[i],
          image: images[i] || null,
          source: 'voiranime'
        };
        
        animes.push(anime);
      }
      
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
  async getAnimeDetails(id) {
    try {
      this.debugLog(`Récupération des détails de l'anime avec l'URL: ${id}`);
      const startTime = Date.now();
      
      // Récupérer la page de l'anime
      const html = await this.fetchHtml(id);
      
      // Extraction simplifiée des informations
      const titleRegex = /<h1 class="entry-title">([^<]+)<\/h1>/;
      const descriptionRegex = /<div class="synps"[^>]*>([\s\S]*?)<\/div>/;
      const imageRegex = /<img[^>]*class="poster"[^>]*src="([^"]+)"[^>]*>/;
      
      const titleMatch = html.match(titleRegex);
      const descriptionMatch = html.match(descriptionRegex);
      const imageMatch = html.match(imageRegex);
      
      const anime = {
        id,
        title: titleMatch ? titleMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim().replace(/<[^>]*>/g, '') : '',
        image: imageMatch ? imageMatch[1] : null,
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

export { DirectMyDramaListScraper, DirectVoirAnimeScraper };
