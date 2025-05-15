/**
 * Scrapers basés sur ParseHub pour FloDrama
 * 
 * Ces scrapers utilisent ParseHub pour récupérer les données structurées
 * des sites de streaming. ParseHub permet de créer des projets de scraping
 * via une interface graphique et de les exécuter via une API.
 */

import { ParseHubClient } from './parsehub-client';

/**
 * Configuration des projets ParseHub
 */
const PARSEHUB_PROJECTS = {
  // Projets MyDramaList
  mydramalist: {
    recent: '', // À remplir avec le token du projet
    search: '', // À remplir avec le token du projet
    details: '' // À remplir avec le token du projet
  },
  // Projets VoirAnime
  voiranime: {
    recent: '', // À remplir avec le token du projet
    search: '', // À remplir avec le token du projet
    details: '' // À remplir avec le token du projet
  }
};

/**
 * Scraper pour MyDramaList basé sur ParseHub
 */
class MyDramaListParseHubScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'mydramalist';
    this.baseUrl = 'https://mydramalist.com';
    this.parseHubClient = null;
  }
  
  /**
   * Active le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
    if (this.parseHubClient) {
      this.parseHubClient.enableDebug(debug);
    }
    return this;
  }
  
  /**
   * Initialise le client ParseHub avec la clé API
   */
  initParseHubClient(env) {
    if (!this.parseHubClient && env && env.PARSEHUB_API_KEY) {
      this.parseHubClient = new ParseHubClient(env.PARSEHUB_API_KEY, this.debug);
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
   * Extrait des informations de base des dramas récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Initialiser le client ParseHub
      this.initParseHubClient(env);
      
      if (!this.parseHubClient) {
        throw new Error('Client ParseHub non initialisé');
      }
      
      // Vérifier si le projet est configuré
      const projectToken = PARSEHUB_PROJECTS.mydramalist.recent;
      if (!projectToken) {
        throw new Error('Projet ParseHub non configuré pour MyDramaList recent');
      }
      
      // Exécuter le projet ParseHub
      const runResult = await this.parseHubClient.runProject(projectToken);
      
      // Attendre la fin de l'exécution et récupérer les résultats
      const result = await this.parseHubClient.waitForRun(runResult.run_token);
      
      // Transformer les résultats
      const dramas = (result.dramas || []).slice(0, limit).map(drama => ({
        title: drama.title,
        url: drama.url,
        image: drama.image,
        source: 'mydramalist'
      }));
      
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
  async search(query, limit = 20, env) {
    try {
      this.debugLog(`Recherche de "${query}" (limite: ${limit})`);
      const startTime = Date.now();
      
      // Initialiser le client ParseHub
      this.initParseHubClient(env);
      
      if (!this.parseHubClient) {
        throw new Error('Client ParseHub non initialisé');
      }
      
      // Vérifier si le projet est configuré
      const projectToken = PARSEHUB_PROJECTS.mydramalist.search;
      if (!projectToken) {
        throw new Error('Projet ParseHub non configuré pour MyDramaList search');
      }
      
      // Exécuter le projet ParseHub avec la requête
      const runResult = await this.parseHubClient.runProject(projectToken, {
        start_url: `https://mydramalist.com/search?q=${encodeURIComponent(query)}`
      });
      
      // Attendre la fin de l'exécution et récupérer les résultats
      const result = await this.parseHubClient.waitForRun(runResult.run_token);
      
      // Transformer les résultats
      const dramas = (result.dramas || []).slice(0, limit).map(drama => ({
        title: drama.title,
        url: drama.url,
        image: drama.image,
        source: 'mydramalist'
      }));
      
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
      this.debugLog(`Récupération des détails du drama ${id}`);
      const startTime = Date.now();
      
      // Initialiser le client ParseHub
      this.initParseHubClient(env);
      
      if (!this.parseHubClient) {
        throw new Error('Client ParseHub non initialisé');
      }
      
      // Vérifier si le projet est configuré
      const projectToken = PARSEHUB_PROJECTS.mydramalist.details;
      if (!projectToken) {
        throw new Error('Projet ParseHub non configuré pour MyDramaList details');
      }
      
      // Exécuter le projet ParseHub avec l'ID
      const runResult = await this.parseHubClient.runProject(projectToken, {
        start_url: `https://mydramalist.com/id/${id}`
      });
      
      // Attendre la fin de l'exécution et récupérer les résultats
      const result = await this.parseHubClient.waitForRun(runResult.run_token);
      
      // Transformer les résultats
      const drama = {
        id,
        title: result.title,
        description: result.description,
        image: result.image,
        genres: result.genres || [],
        details: result.details || {},
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
 * Scraper pour VoirAnime basé sur ParseHub
 */
class VoirAnimeParseHubScraper {
  constructor(debug = false) {
    this.debug = debug;
    this.name = 'voiranime';
    this.baseUrl = 'https://v5.voiranime.com';
    this.parseHubClient = null;
  }
  
  /**
   * Active le mode debug
   */
  enableDebug(debug = true) {
    this.debug = debug;
    if (this.parseHubClient) {
      this.parseHubClient.enableDebug(debug);
    }
    return this;
  }
  
  /**
   * Initialise le client ParseHub avec la clé API
   */
  initParseHubClient(env) {
    if (!this.parseHubClient && env && env.PARSEHUB_API_KEY) {
      this.parseHubClient = new ParseHubClient(env.PARSEHUB_API_KEY, this.debug);
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
   * Extrait des informations de base des animes récents
   */
  async scrape(limit = 20, env) {
    try {
      this.debugLog(`Début du scraping (limite: ${limit})`);
      const startTime = Date.now();
      
      // Initialiser le client ParseHub
      this.initParseHubClient(env);
      
      if (!this.parseHubClient) {
        throw new Error('Client ParseHub non initialisé');
      }
      
      // Vérifier si le projet est configuré
      const projectToken = PARSEHUB_PROJECTS.voiranime.recent;
      if (!projectToken) {
        throw new Error('Projet ParseHub non configuré pour VoirAnime recent');
      }
      
      // Exécuter le projet ParseHub
      const runResult = await this.parseHubClient.runProject(projectToken);
      
      // Attendre la fin de l'exécution et récupérer les résultats
      const result = await this.parseHubClient.waitForRun(runResult.run_token);
      
      // Transformer les résultats
      const animes = (result.animes || []).slice(0, limit).map(anime => ({
        title: anime.title,
        url: anime.url,
        image: anime.image,
        source: 'voiranime'
      }));
      
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
      
      // Initialiser le client ParseHub
      this.initParseHubClient(env);
      
      if (!this.parseHubClient) {
        throw new Error('Client ParseHub non initialisé');
      }
      
      // Vérifier si le projet est configuré
      const projectToken = PARSEHUB_PROJECTS.voiranime.search;
      if (!projectToken) {
        throw new Error('Projet ParseHub non configuré pour VoirAnime search');
      }
      
      // Exécuter le projet ParseHub avec la requête
      const runResult = await this.parseHubClient.runProject(projectToken, {
        start_url: `https://v5.voiranime.com/?s=${encodeURIComponent(query)}`
      });
      
      // Attendre la fin de l'exécution et récupérer les résultats
      const result = await this.parseHubClient.waitForRun(runResult.run_token);
      
      // Transformer les résultats
      const animes = (result.animes || []).slice(0, limit).map(anime => ({
        title: anime.title,
        url: anime.url,
        image: anime.image,
        source: 'voiranime'
      }));
      
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
      
      // Initialiser le client ParseHub
      this.initParseHubClient(env);
      
      if (!this.parseHubClient) {
        throw new Error('Client ParseHub non initialisé');
      }
      
      // Vérifier si le projet est configuré
      const projectToken = PARSEHUB_PROJECTS.voiranime.details;
      if (!projectToken) {
        throw new Error('Projet ParseHub non configuré pour VoirAnime details');
      }
      
      // Construire l'URL complète
      const url = id.startsWith('http') ? id : `${this.baseUrl}${id}`;
      
      // Exécuter le projet ParseHub avec l'URL
      const runResult = await this.parseHubClient.runProject(projectToken, {
        start_url: url
      });
      
      // Attendre la fin de l'exécution et récupérer les résultats
      const result = await this.parseHubClient.waitForRun(runResult.run_token);
      
      // Transformer les résultats
      const anime = {
        id,
        title: result.title,
        description: result.description,
        image: result.image,
        genres: result.genres || [],
        details: result.details || {},
        url: url,
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

export { MyDramaListParseHubScraper, VoirAnimeParseHubScraper };
