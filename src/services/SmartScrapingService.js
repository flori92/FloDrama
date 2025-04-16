/**
 * SmartScrapingService
 * 
 * Service de scraping intelligent qui combine plusieurs techniques avancées
 * pour contourner les protections anti-bot et s'adapter à n'importe quelle structure de site
 */

import AdaptiveScraperService from './AdaptiveScraperService.js';
import SearchIndexService from './SearchIndexService.js';
import ContentDataService from './ContentDataService.js';
import { extractMetadata } from '../utils/contentUtils.js';
import { v4 as uuidv4 } from 'uuid';

// Statistiques de scraping
const scrapingStats = {
  requests: 0,
  hits: 0,
  misses: 0,
  errors: 0,
  sources: {}
};

class SmartScrapingService {
  constructor() {
    this.adaptiveScraperService = AdaptiveScraperService;
    this.searchIndexService = SearchIndexService;
    this.contentDataService = ContentDataService;
    
    // Configuration des sources
    this.sources = {
      voirdrama: {
        name: 'VoirDrama',
        baseUrl: 'https://voirdrama.org',
        fallbackUrls: ['https://voirdrama.cc', 'https://voirdrama.tv', 'https://vdrama.org', 'https://voirdrama.me'],
        enabled: true,
        priority: 1,
        popularUrl: 'https://voirdrama.org/drama-list',
        moviesUrl: 'https://voirdrama.org/movie-list',
        kshowsUrl: 'https://voirdrama.org/kshow-list',
        searchUrl: 'https://voirdrama.org/search',
        transform(item) {
          return {
            ...item,
            source: 'VoirDrama'
          };
        }
      },
      dramacool: {
        name: 'DramaCool',
        baseUrl: 'https://dramacool.com.tr',
        fallbackUrls: ['https://dramacool.hr', 'https://dramacool.com.pa', 'https://dramacool.cy', 'https://dramacool.sr', 'https://dramacool.so'],
        enabled: true,
        priority: 2,
        popularUrl: 'https://dramacool.com.tr/drama-list',
        moviesUrl: 'https://dramacool.com.tr/movie-list',
        kshowsUrl: 'https://dramacool.com.tr/kshow-list',
        searchUrl: 'https://dramacool.com.tr/search',
        transform(item) {
          return {
            ...item,
            source: 'DramaCool'
          };
        }
      },
      voiranime: {
        name: 'VoirAnime',
        baseUrl: 'https://voiranime.com',
        fallbackUrls: ['https://voiranime.org', 'https://voiranime.to', 'https://voiranime.tv'],
        enabled: true,
        priority: 3,
        popularUrl: 'https://voiranime.com/anime-list',
        moviesUrl: 'https://voiranime.com/movie-list',
        searchUrl: 'https://voiranime.com/search',
        transform(item) {
          return {
            ...item,
            source: 'VoirAnime'
          };
        }
      },
      gogoanime: {
        name: 'GogoAnime',
        baseUrl: 'https://gogoanime.tel',
        fallbackUrls: ['https://gogoanime3.net', 'https://gogoanime.llc', 'https://gogoanime.bid'],
        enabled: true,
        priority: 4,
        popularUrl: 'https://gogoanime.tel/anime-list',
        moviesUrl: 'https://gogoanime.tel/movie-list',
        searchUrl: 'https://gogoanime.tel/search',
        transform(item) {
          return {
            ...item,
            source: 'GogoAnime'
          };
        }
      },
      nekosama: {
        name: 'Neko Sama',
        baseUrl: 'https://neko-sama.fr',
        fallbackUrls: ['https://neko-sama.io', 'https://neko-sama.org'],
        enabled: true,
        priority: 2,
        popularUrl: 'https://neko-sama.fr/anime',
        searchUrl: 'https://neko-sama.fr/search',
        transform(item) {
          return {
            ...item,
            source: 'Neko Sama',
            type: 'anime'
          };
        }
      },
      animesama: {
        name: 'Anime Sama',
        baseUrl: 'https://anime-sama.fr',
        fallbackUrls: ['https://anime-sama.me', 'https://anime-sama.org'],
        enabled: true,
        priority: 3,
        popularUrl: 'https://anime-sama.fr/catalogue',
        searchUrl: 'https://anime-sama.fr/search',
        transform(item) {
          return {
            ...item,
            source: 'Anime Sama',
            type: 'anime'
          };
        }
      },
      asianc: {
        name: 'AsianC',
        baseUrl: 'https://asianc.to',
        fallbackUrls: ['https://asianc.co', 'https://asianc.cx', 'https://asianc.cc'],
        enabled: true,
        priority: 5,
        popularUrl: 'https://asianc.to/drama-list',
        moviesUrl: 'https://asianc.to/movie-list',
        searchUrl: 'https://asianc.to/search',
        transform(item) {
          return {
            ...item,
            source: 'AsianC'
          };
        }
      },
      dramaday: {
        name: 'DramaDay',
        baseUrl: 'http://dramaday.net',
        fallbackUrls: ['https://dramaday.me', 'https://dramaday.co'],
        enabled: true,
        priority: 6,
        popularUrl: 'http://dramaday.net/drama-list',
        moviesUrl: 'http://dramaday.net/movie-list',
        searchUrl: 'http://dramaday.net/search',
        transform(item) {
          return {
            ...item,
            source: 'DramaDay'
          };
        }
      },
      mydramalist: {
        name: 'MyDramaList',
        baseUrl: 'https://mydramalist.com',
        apiPath: '/shows',
        fallbackUrls: [],
        enabled: true,
        priority: 7,
        popularUrl: 'https://mydramalist.com/shows',
        searchUrl: 'https://mydramalist.com/search',
        transform(item) {
          return {
            ...item,
            source: 'MyDramaList'
          };
        }
      },
      anbuanime: {
        name: 'AnbuAnime',
        baseUrl: 'https://api.anbuanime.com',
        apiPath: '/v1/search',
        fallbackUrls: ['https://api.anbuanime.org/v1', 'https://api.anbuanime.net/v1'],
        isApi: true,
        enabled: true,
        priority: 8,
        type: 'anime',
        searchUrl: 'https://api.anbuanime.com/v1/search',
        transform(item) {
          return {
            ...item,
            source: 'AnbuAnime'
          };
        }
      },
      anichin: {
        name: 'AniChin',
        baseUrl: 'https://api.anichin.com',
        apiPath: '/anime/search',
        fallbackUrls: [],
        isApi: true,
        enabled: true,
        priority: 15,
        type: 'anime',
        searchUrl: 'https://api.anichin.com/anime/search',
        transform(item) {
          return {
            ...item,
            source: 'AniChin'
          };
        }
      },
      jikan: {
        name: 'Jikan',
        baseUrl: 'https://api.jikan.moe/v4',
        apiPath: '/anime',
        fallbackUrls: [],
        isApi: true,
        enabled: true,
        priority: 16,
        type: 'anime',
        searchUrl: 'https://api.jikan.moe/v4/anime',
        transform(item) {
          return {
            ...item,
            source: 'MyAnimeList'
          };
        }
      },
      tmdb: {
        name: 'TMDB',
        baseUrl: 'https://api.themoviedb.org/3',
        apiPath: '/search/multi',
        fallbackUrls: [],
        isApi: true,
        enabled: true,
        priority: 17,
        searchUrl: 'https://api.themoviedb.org/3/search/multi',
        transform(item) {
          return {
            ...item,
            source: 'TMDB'
          };
        }
      },
      bollywoodmdb: {
        name: 'BollywoodMDB',
        baseUrl: 'https://www.bollywoodmdb.com',
        fallbackUrls: ['https://bollywoodmdb.com'],
        enabled: true,
        priority: 3,
        popularUrl: 'https://www.bollywoodmdb.com/movies',
        searchUrl: 'https://www.bollywoodmdb.com/search',
        transform(item) {
          return {
            ...item,
            source: 'BollywoodMDB',
            type: 'movie',
            country: 'Inde'
          };
        }
      },
      voiranime6: {
        name: 'VoirAnime6',
        baseUrl: 'https://v6.voiranime.com',
        fallbackUrls: ['https://v6.voiranime.org', 'https://v6.voiranime.to', 'https://v6.voiranime.tv'],
        enabled: true,
        priority: 2,
        type: 'anime',
        popularUrl: 'https://v6.voiranime.com/anime-list',
        moviesUrl: 'https://v6.voiranime.com/movie-list',
        searchUrl: 'https://v6.voiranime.com/search',
        transform(item) {
          return {
            ...item,
            source: 'VoirAnime6'
          };
        }
      },
      dramafrance: {
        name: 'DramaFrance',
        baseUrl: 'https://dramafrance.org',
        fallbackUrls: ['https://dramafrance.tv', 'https://dramafrance.me'],
        enabled: true,
        priority: 9,
        popularUrl: 'https://dramafrance.org/drama-list',
        searchUrl: 'https://dramafrance.org/search',
        transform(item) {
          return {
            ...item,
            source: 'DramaFrance'
          };
        }
      },
      zee5bollywood: {
        name: 'Zee5Bollywood',
        baseUrl: 'https://www.zee5.com',
        apiPath: '/collections/free-bollywood-movies/0-8-2429',
        fallbackUrls: [],
        enabled: true,
        priority: 11,
        popularUrl: 'https://www.zee5.com/collections/free-bollywood-movies/0-8-2429',
        searchUrl: 'https://www.zee5.com/search',
        transform(item) {
          return {
            ...item,
            source: 'Zee5Bollywood'
          };
        }
      },
      hotstarbollywood: {
        name: 'HotstarBollywood',
        baseUrl: 'https://www.hotstar.com',
        apiPath: '/movies',
        fallbackUrls: [],
        enabled: true,
        priority: 12,
        popularUrl: 'https://www.hotstar.com/movies',
        searchUrl: 'https://www.hotstar.com/search',
        transform(item) {
          return {
            ...item,
            source: 'HotstarBollywood'
          };
        }
      },
      anigo: {
        name: 'Anigo',
        baseUrl: 'https://api.anigo.org/v1',
        apiPath: '/search',
        fallbackUrls: ['https://api.anigo.io/v1', 'https://api.anigo.net/v1'],
        isApi: true,
        enabled: true,
        priority: 13,
        type: 'anime',
        searchUrl: 'https://api.anigo.org/v1/search',
        transform: (item) => ({
          id: `anigo-${item.id || Math.random().toString(36).substring(2, 10)}`,
          title: item.title,
          alternativeTitles: item.alternativeTitles || item.otherTitles || [],
          link: item.url || '',
          image: item.image || '',
          source: 'Anigo',
          type: 'anime',
          year: item.year || new Date().getFullYear(),
          country: 'Japon'
        })
      }
    };
    
    // Stratégies de contournement
    this.bypassStrategies = [
      {
        name: 'standard',
        description: 'Utilise des en-têtes HTTP standards avec rotation d\'User-Agent',
        priority: 1
      },
      {
        name: 'advanced',
        description: 'Utilise une empreinte digitale complète de navigateur avec comportement humain',
        priority: 2
      },
      {
        name: 'cloudflare',
        description: 'Stratégie spécifique pour contourner Cloudflare',
        priority: 3
      }
    ];
    
    // Worker d'indexation
    this._indexationWorker = null;
    this._initIndexationWorker();
    
    // Initialisation du cache et des statistiques
    this.cache = new Map();
    this.sourceStats = {};
    this.globalStats = { requests: 0, success: 0, errors: 0 };
    this.cacheStats = { hits: 0, misses: 0 };
  }

  /**
   * Initialise le worker d'indexation
   * @private
   */
  _initIndexationWorker() {
    try {
      // Vérifier si nous sommes dans un environnement navigateur
      const isBrowser = typeof window !== 'undefined';
      const isProduction = process && process.env && process.env.NODE_ENV === 'production';
      
      // Ne pas initialiser le worker en production dans le navigateur
      if (isBrowser && isProduction) {
        console.log('[SmartScrapingService] Worker d\'indexation désactivé en production dans le navigateur');
        return;
      }
      
      // Vérifier si Worker est disponible
      if (isBrowser && typeof Worker === 'undefined') {
        console.warn('[SmartScrapingService] Web Workers non supportés dans cet environnement');
        return;
      }
      
      // Créer le worker uniquement en environnement Node.js ou en développement
      if (!isBrowser || (isBrowser && !isProduction)) {
        // Utiliser une approche conditionnelle pour éviter les erreurs dans le navigateur
        if (typeof require !== 'undefined') {
          const path = require('path');
          const workerPath = path.resolve(__dirname, '../workers/indexationWorker.js');
          
          // Utiliser Worker ou worker_threads selon l'environnement
          if (!isBrowser) {
            const { Worker } = require('worker_threads');
            this._indexationWorker = new Worker(workerPath);
          } else {
            this._indexationWorker = new Worker(workerPath);
          }
          
          // Configurer les écouteurs d'événements
          if (this._indexationWorker) {
            this._indexationWorker.onmessage = this._handleWorkerMessage.bind(this);
            this._indexationWorker.onerror = this._handleWorkerError.bind(this);
          }
        }
      }
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de l\'initialisation du worker d\'indexation:', error);
      this._indexationWorker = null;
    }
  }
  
  /**
   * Gère les messages du worker d'indexation
   * @param {MessageEvent} event - Événement de message
   * @private
   */
  _handleWorkerMessage(event) {
    if (event && event.data) {
      console.log('[SmartScrapingService] Message du worker d\'indexation:', event.data.type);
    }
  }
  
  /**
   * Gère les erreurs du worker d'indexation
   * @param {ErrorEvent} error - Événement d'erreur
   * @private
   */
  _handleWorkerError(error) {
    console.error('[SmartScrapingService] Erreur du worker d\'indexation:', error);
  }
  
  /**
   * Indexe les éléments en arrière-plan
   * @param {Array} items - Éléments à indexer
   * @private
   */
  _indexItemsAsync(items) {
    try {
      // Vérifier si les éléments sont valides
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.warn('[SmartScrapingService] Tentative d\'indexation d\'éléments invalides');
        return;
      }
      
      // Vérifier si le worker est disponible
      if (this._indexationWorker) {
        // Envoyer les éléments au worker
        this._indexationWorker.postMessage({
          type: 'index_items',
          items
        });
        
        console.log(`[SmartScrapingService] ${items.length} éléments envoyés au worker d'indexation`);
      } else {
        // Si le worker n'est pas disponible, essayer d'utiliser directement le service d'indexation
        if (this.searchIndexService && typeof this.searchIndexService.indexItems === 'function') {
          // Utiliser setTimeout pour ne pas bloquer le thread principal
          setTimeout(async () => {
            try {
              await this.searchIndexService.indexItems(items);
              console.log(`[SmartScrapingService] ${items.length} éléments indexés directement`);
            } catch (error) {
              console.error('[SmartScrapingService] Erreur lors de l\'indexation directe:', error);
            }
          }, 100);
        } else {
          console.warn('[SmartScrapingService] Impossible d\'indexer les éléments: worker et service d\'indexation non disponibles');
        }
      }
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de l\'indexation asynchrone:', error);
    }
  }
  
  /**
   * Récupère les éléments populaires
   * @param {Number} pageCount - Nombre de pages à récupérer
   * @returns {Promise<Array>} Liste des éléments populaires
   */
  async getPopular(pageCount = 1) {
    const cacheKey = `popular_${pageCount}`;
    
    // Vérifier le cache
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Vérifier si nous sommes dans un environnement navigateur
    const isBrowser = typeof window !== 'undefined';
    
    // En environnement navigateur, utiliser directement les données de démo
    if (isBrowser) {
      console.log('[SmartScrapingService] Environnement navigateur détecté, utilisation des données de démonstration');
      const demoData = await this._getDemoData('popular', pageCount * 10);
      this.saveToCache(cacheKey, demoData);
      return demoData;
    }
    
    try {
      // Utiliser la meilleure source disponible
      const source = this._getBestSource('popular');
      const url = this.sources[source].popularUrl;
      
      console.log(`[SmartScrapingService] Récupération des éléments populaires depuis ${this.sources[source].name}`);
      
      // Utiliser le service de scraping adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Enrichir les données avec les métadonnées
      const enrichedItems = await Promise.all(items.map(async item => {
        // Extraire les métadonnées
        const metadata = this._extractMetadata(item);
        
        // Appliquer la transformation spécifique à la source
        const transformedItem = this.sources[source].transform ? 
          this.sources[source].transform(item) : item;
        
        // Générer un ID unique
        const id = `${this.sources[source].name.toLowerCase()}-${uuidv4()}`;
        
        const enrichedItem = {
          ...transformedItem,
          ...metadata,
          id
        };
        
        // Stocker les métadonnées dans ContentDataService
        if (this.contentDataService && this.contentDataService.storeContentData) {
          await this.contentDataService.storeContentData(enrichedItem);
        }
        
        return enrichedItem;
      }));
      
      // Mettre en cache
      this.saveToCache(cacheKey, enrichedItems);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(source, true);
      
      return enrichedItems;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération des éléments populaires:', error);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(this._getBestSource('popular'), false);
      
      // Essayer une autre source en cas d'échec
      try {
        const fallbackSource = this._getFallbackSource('popular');
        console.log(`[SmartScrapingService] Tentative avec une source alternative: ${this.sources[fallbackSource].name}`);
        
        const fallbackUrl = this.sources[fallbackSource].popularUrl;
        const fallbackItems = await this.adaptiveScraperService.scrapeWithPagination(fallbackUrl, pageCount);
        
        // Enrichir et mettre en cache
        const enrichedFallbackItems = fallbackItems.map(item => ({
          ...item,
          source: this.sources[fallbackSource].name
        }));
        
        this.saveToCache(cacheKey, enrichedFallbackItems);
        
        // Mettre à jour les statistiques
        this.updateSourceStats(fallbackSource, true);
        
        return enrichedFallbackItems;
      } catch (fallbackError) {
        console.error('[SmartScrapingService] Échec de la source alternative:', fallbackError);
        
        // En dernier recours, utiliser des données de démonstration
        const demoData = await this._getDemoData('popular', pageCount * 10);
        this.saveToCache(cacheKey, demoData);
        return demoData;
      }
    }
  }
  
  /**
   * Récupère les films populaires
   * @param {Number} pageCount - Nombre de pages à scraper
   * @returns {Promise<Array>} Films populaires
   */
  async getPopularMovies(pageCount = 1) {
    const cacheKey = `popular_movies_${pageCount}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Obtenir la meilleure source avec vérification de disponibilité
      const source = this._getBestSource();
      
      // Vérifier si la source existe et a une URL pour les films
      if (!source || !this.sources[source] || !this.sources[source].moviesUrl) {
        console.warn('[SmartScrapingService] Aucune source disponible pour les films');
        return [];
      }
      
      const url = this.sources[source].moviesUrl;
      
      // Utiliser le scraper adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(source, true);
      
      // Indexer les résultats en arrière-plan
      if (this._indexItemsAsync) {
        this._indexItemsAsync(items);
      }
      
      // Mettre en cache le résultat
      this.saveToCache(cacheKey, items);
      
      return items;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération des films populaires:', error);
      
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  }
  
  /**
   * Récupère les K-shows populaires
   * @param {Number} pageCount - Nombre de pages à récupérer
   * @returns {Promise<Array>} Liste des K-shows populaires
   */
  async getPopularKshows(pageCount = 1) {
    const cacheKey = `popular_kshows_${pageCount}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Obtenir la meilleure source avec vérification de disponibilité
      const source = this._getBestSource();
      
      // Vérifier si la source existe et a une URL pour les kshows
      if (!source || !this.sources[source] || !this.sources[source].kshowsUrl) {
        console.warn('[SmartScrapingService] Aucune source disponible pour les K-shows');
        return [];
      }
      
      const url = this.sources[source].kshowsUrl;
      
      // Utiliser le scraper adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(source, true);
      
      // Indexer les résultats en arrière-plan
      if (this._indexItemsAsync) {
        this._indexItemsAsync(items);
      }
      
      // Mettre en cache le résultat
      this.saveToCache(cacheKey, items);
      
      return items;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération des K-shows:', error);
      
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  }
  
  /**
   * Recherche des dramas
   * @param {String} query - Terme de recherche
   * @returns {Promise<Array>} Résultats de recherche
   */
  async searchDramas(query) {
    const cacheKey = `search_dramas_${query}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Obtenir la meilleure source
    const source = this._getBestSource();
    const baseUrl = this.sources[source].searchUrl;
    const url = `${baseUrl}?keyword=${encodeURIComponent(query)}`;
    
    try {
      // Utiliser le scraper adaptatif
      const items = await this.adaptiveScraperService.scrapeUrl(url);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(source, true);
      
      // Indexer les résultats en arrière-plan
      this._indexItemsAsync(items);
      
      // Mettre en cache le résultat
      this.saveToCache(cacheKey, items);
      
      return items;
    } catch (error) {
      // Mettre à jour les statistiques
      this.updateSourceStats(source, false);
      
      // Essayer avec une autre source
      const alternativeSource = this._getAlternativeSource(source);
      if (alternativeSource) {
        console.log(`Échec avec la source ${source}, tentative avec ${alternativeSource}`);
        const alternativeBaseUrl = this.sources[alternativeSource].searchUrl;
        const alternativeUrl = `${alternativeBaseUrl}?keyword=${encodeURIComponent(query)}`;
        
        try {
          const items = await this.adaptiveScraperService.scrapeUrl(alternativeUrl);
          
          // Mettre à jour les statistiques
          this.updateSourceStats(alternativeSource, true);
          
          // Indexer les résultats en arrière-plan
          this._indexItemsAsync(items);
          
          // Mettre en cache le résultat
          this.saveToCache(cacheKey, items);
          
          return items;
        } catch (alternativeError) {
          // Mettre à jour les statistiques
          this.updateSourceStats(alternativeSource, false);
          
          console.error('Échec avec toutes les sources:', alternativeError);
          throw new Error('Impossible de rechercher des dramas');
        }
      }
      
      console.error('Erreur lors de la recherche de dramas:', error);
      throw error;
    }
  }
  
  /**
   * Recherche des animés
   * @param {String} query - Terme de recherche
   * @returns {Promise<Array>} Résultats de recherche
   */
  async searchAnime(query) {
    const cacheKey = `search_anime_${query}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Filtrer les sources d'anime
    const animeSources = Object.keys(this.sources)
      .filter(key => this.sources[key].type === 'anime')
      .sort((a, b) => this.sources[a].priority - this.sources[b].priority);
    
    if (animeSources.length === 0) {
      return [];
    }
    
    // Essayer chaque source d'anime
    const results = [];
    const errors = [];
    
    for (const sourceKey of animeSources) {
      const source = this.sources[sourceKey];
      
      try {
        let items = [];
        
        if (source.isApi) {
          // Appel API
          const url = `${source.baseUrl}${source.apiPath}?q=${encodeURIComponent(query)}`;
          const response = await this.proxyService.fetch(url, {
            headers: this.fingerprintService.getHeaders()
          });
          
          const data = await response.json();
          
          // Transformer les résultats selon la source
          if (Array.isArray(data)) {
            items = data.map(source.transform);
          } else if (data.data && Array.isArray(data.data)) {
            items = data.data.map(source.transform);
          } else if (data.results && Array.isArray(data.results)) {
            items = data.results.map(source.transform);
          }
        } else {
          // Scraping classique
          const url = `${source.searchUrl}?keyword=${encodeURIComponent(query)}`;
          items = await this.adaptiveScraperService.scrapeUrl(url);
        }
        
        // Mettre à jour les statistiques
        this.updateSourceStats(sourceKey, true);
        
        // Ajouter les résultats
        results.push(...items);
      } catch (error) {
        // Mettre à jour les statistiques
        this.updateSourceStats(sourceKey, false);
        
        errors.push(`${sourceKey}: ${error.message}`);
      }
    }
    
    if (results.length === 0 && errors.length === animeSources.length) {
      console.error('Toutes les sources ont échoué:', errors);
      throw new Error('Impossible de rechercher des animés');
    }
    
    // Indexer les résultats en arrière-plan
    this._indexItemsAsync(results);
    
    // Mettre en cache le résultat
    this.saveToCache(cacheKey, results);
    
    return results;
  }
  
  /**
   * Recherche multi-source (dramas, animés, films)
   * @param {String} query - Terme de recherche
   * @returns {Promise<Object>} Résultats de recherche par catégorie
   */
  async searchAll(query) {
    const cacheKey = `search_all_${query}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Lancer les recherches en parallèle
      const [dramas, animes, movies] = await Promise.allSettled([
        this.searchDramas(query),
        this.searchAnime(query),
        this.getPopularMovies() // Nous n'avons pas de méthode spécifique pour rechercher des films, donc on utilise les films populaires
      ]);
      
      const results = {
        dramas: dramas.status === 'fulfilled' ? dramas.value : [],
        animes: animes.status === 'fulfilled' ? animes.value : [],
        movies: movies.status === 'fulfilled' ? movies.value.filter(movie => 
          movie.title && movie.title.toLowerCase().includes(query.toLowerCase())
        ) : []
      };
      
      // Indexer les résultats en arrière-plan
      this._indexItemsAsync([...results.dramas, ...results.animes, ...results.movies]);
      
      // Mettre en cache le résultat
      this.saveToCache(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche multi-source:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les dramas populaires
   * @param {Number} pageCount - Nombre de pages à récupérer
   * @returns {Promise<Array>} Liste des dramas populaires
   */
  async getPopularDramas(pageCount = 1) {
    const cacheKey = `popular_dramas_${pageCount}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Obtenir la meilleure source avec vérification de disponibilité
      const source = this._getBestSource();
      
      // Vérifier si la source existe et a une URL pour les dramas populaires
      if (!source || !this.sources[source] || !this.sources[source].popularUrl) {
        console.warn('[SmartScrapingService] Aucune source disponible pour les dramas populaires');
        return [];
      }
      
      const url = this.sources[source].popularUrl;
      
      // Utiliser le scraper adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(source, true);
      
      // Indexer les résultats en arrière-plan
      if (this._indexItemsAsync) {
        this._indexItemsAsync(items);
      }
      
      // Mettre en cache le résultat
      this.saveToCache(cacheKey, items);
      
      return items;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération des dramas populaires:', error);
      
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  }

  /**
   * Récupère les animés populaires
   * @param {Number} pageCount - Nombre de pages à récupérer
   * @returns {Promise<Array>} Liste des animés populaires
   */
  async getPopularAnimes(pageCount = 1) {
    const cacheKey = `popular_animes_${pageCount}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Obtenir la meilleure source avec vérification de disponibilité
      const source = this._getBestSource();
      
      // Vérifier si la source existe et a une URL pour les animés
      if (!source || !this.sources[source] || !this.sources[source].popularUrl) {
        console.warn('[SmartScrapingService] Aucune source disponible pour les animés populaires');
        return [];
      }
      
      const url = this.sources[source].popularUrl;
      
      // Utiliser le scraper adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(source, true);
      
      // Indexer les résultats en arrière-plan
      if (this._indexItemsAsync) {
        this._indexItemsAsync(items);
      }
      
      // Mettre en cache le résultat
      this.saveToCache(cacheKey, items);
      
      return items;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération des animés populaires:', error);
      
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  }
  
  /**
   * Récupère les détails complets d'un contenu
   * @param {String} id - Identifiant du contenu
   * @returns {Promise<Object|null>} Détails du contenu
   */
  async getContentDetails(id) {
    try {
      // Vérifier d'abord dans ContentDataService
      const cachedContent = await this.contentDataService.getContentById(id);
      if (cachedContent && cachedContent.details) {
        console.log(`[SmartScrapingService] Détails du contenu récupérés depuis le cache: ${id}`);
        return cachedContent;
      }
      
      // Si l'ID contient le nom de la source, l'extraire
      const sourceName = id.split('-')[0];
      const source = this.sources[sourceName] || this._getBestSource();
      
      // Construire l'URL de détail en fonction de l'ID
      const detailUrl = source.getDetailUrl ? source.getDetailUrl(id) : null;
      
      if (!detailUrl) {
        console.warn(`[SmartScrapingService] Impossible de construire l'URL de détail pour ${id}`);
        return null;
      }
      
      // Scraper les détails
      const details = await this.adaptiveScraperService.scrapeDetails(detailUrl);
      
      // Enrichir avec les métadonnées
      const metadata = extractMetadata(details);
      
      const enrichedDetails = {
        ...details,
        ...metadata,
        id,
        source: sourceName,
        lastUpdated: Date.now()
      };
      
      // Stocker dans ContentDataService
      await this.contentDataService.storeContentData(enrichedDetails);
      
      return enrichedDetails;
    } catch (error) {
      console.error(`[SmartScrapingService] Erreur lors de la récupération des détails pour ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Obtient la meilleure source en fonction des statistiques
   * @param {String} contentType - Type de contenu ('popular', 'movies', 'kshows', etc.)
   * @returns {String} Nom de la meilleure source
   * @private
   */
  _getBestSource(contentType = 'popular') {
    try {
      // Vérifier si les sources sont disponibles
      if (!this.sources || Object.keys(this.sources).length === 0) {
        console.warn('[SmartScrapingService] Aucune source disponible');
        return null;
      }
      
      // Filtrer les sources en fonction du type de contenu
      let filteredSources = Object.keys(this.sources);
      
      // Filtrer par type de contenu si spécifié
      if (contentType === 'anime') {
        filteredSources = filteredSources.filter(key => 
          this.sources[key].type === 'anime' || 
          this.sources[key].name.toLowerCase().includes('anime')
        );
      } else if (contentType === 'movies') {
        filteredSources = filteredSources.filter(key => 
          this.sources[key].moviesUrl !== undefined
        );
      } else if (contentType === 'kshows') {
        filteredSources = filteredSources.filter(key => 
          this.sources[key].kshowsUrl !== undefined
        );
      }
      
      // Si aucune source n'est disponible pour ce type de contenu, utiliser toutes les sources
      if (filteredSources.length === 0) {
        console.warn(`[SmartScrapingService] Aucune source spécifique pour le type ${contentType}`);
        filteredSources = Object.keys(this.sources);
      }
      
      // Filtrer les sources activées
      filteredSources = filteredSources.filter(key => 
        this.sources[key].enabled !== false
      );
      
      // Si aucune source n'est activée, retourner null
      if (filteredSources.length === 0) {
        console.warn('[SmartScrapingService] Aucune source activée disponible');
        return null;
      }
      
      // Trier par priorité (du plus petit au plus grand)
      filteredSources.sort((a, b) => {
        const priorityA = this.sources[a].priority || 999;
        const priorityB = this.sources[b].priority || 999;
        return priorityA - priorityB;
      });
      
      // Retourner la source avec la meilleure priorité
      return filteredSources[0];
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération de la meilleure source:', error);
      return null;
    }
  }
  
  /**
   * Obtient une source alternative pour un type de contenu donné
   * @param {String} contentType - Type de contenu ('popular', 'movies', 'kshows', etc.)
   * @param {String} excludeSource - Nom de la source à exclure
   * @returns {String} Nom de la source alternative
   * @private
   */
  _getFallbackSource(contentType = 'popular', excludeSource = null) {
    try {
      // Vérifier si les sources sont disponibles
      if (!this.sources || Object.keys(this.sources).length === 0) {
        console.warn('[SmartScrapingService] Aucune source disponible pour le fallback');
        return null;
      }
      
      // Filtrer les sources en fonction du type de contenu
      let filteredSources = Object.keys(this.sources);
      
      // Filtrer par type de contenu si spécifié
      if (contentType === 'anime') {
        filteredSources = filteredSources.filter(key => 
          this.sources[key].type === 'anime' || 
          this.sources[key].name.toLowerCase().includes('anime')
        );
      } else if (contentType === 'movies') {
        filteredSources = filteredSources.filter(key => 
          this.sources[key].moviesUrl !== undefined
        );
      } else if (contentType === 'kshows') {
        filteredSources = filteredSources.filter(key => 
          this.sources[key].kshowsUrl !== undefined
        );
      }
      
      // Exclure la source spécifiée
      if (excludeSource) {
        filteredSources = filteredSources.filter(key => key !== excludeSource);
      }
      
      // Si aucune source n'est disponible après filtrage, utiliser toutes les sources sauf celle exclue
      if (filteredSources.length === 0) {
        console.warn(`[SmartScrapingService] Aucune source alternative spécifique pour le type ${contentType}`);
        filteredSources = Object.keys(this.sources).filter(key => key !== excludeSource);
      }
      
      // Filtrer les sources activées
      filteredSources = filteredSources.filter(key => 
        this.sources[key].enabled !== false
      );
      
      // Si aucune source n'est activée, retourner null
      if (filteredSources.length === 0) {
        console.warn('[SmartScrapingService] Aucune source alternative activée disponible');
        return null;
      }
      
      // Trier par priorité (du plus petit au plus grand)
      filteredSources.sort((a, b) => {
        const priorityA = this.sources[a].priority || 999;
        const priorityB = this.sources[b].priority || 999;
        return priorityA - priorityB;
      });
      
      // Retourner la source avec la meilleure priorité
      return filteredSources[0];
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération d\'une source alternative:', error);
      return null;
    }
  }
  
  /**
   * Met à jour les statistiques d'une source
   * @param {String} source - Nom de la source
   * @param {Boolean} success - Indique si la requête a réussi
   */
  updateSourceStats(source, success) {
    try {
      // Vérifier si la source est valide
      if (!source) {
        console.warn('[SmartScrapingService] Tentative de mise à jour des statistiques avec une source invalide');
        return;
      }
      
      // Initialiser les statistiques si nécessaire
      if (!this.sourceStats) {
        this.sourceStats = {};
      }
      
      // Initialiser les statistiques de la source si nécessaire
      if (!this.sourceStats[source]) {
        this.sourceStats[source] = { requests: 0, success: 0, errors: 0 };
      }
      
      // Mettre à jour les statistiques
      this.sourceStats[source].requests++;
      
      if (success) {
        this.sourceStats[source].success++;
      } else {
        this.sourceStats[source].errors++;
      }
      
      // Mettre à jour les statistiques globales
      if (!this.globalStats) {
        this.globalStats = { requests: 0, success: 0, errors: 0 };
      }
      
      this.globalStats.requests++;
      
      if (success) {
        this.globalStats.success++;
      } else {
        this.globalStats.errors++;
      }
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la mise à jour des statistiques:', error);
    }
  }
  
  /**
   * Récupère un résultat du cache
   * @param {String} key - Clé de cache
   * @returns {Array|null} Résultat du cache ou null
   */
  getFromCache(key) {
    try {
      // Initialiser le cache si nécessaire
      if (!this.cache) {
        this.cache = new Map();
        return null;
      }
      
      // Vérifier si la clé existe dans le cache
      if (!this.cache.has(key)) {
        return null;
      }
      
      const { data, timestamp } = this.cache.get(key);
      
      // Vérifier si le cache est encore valide (6 heures)
      if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
        // Incrémenter les statistiques de cache
        if (!this.cacheStats) {
          this.cacheStats = { hits: 0, misses: 0 };
        }
        this.cacheStats.hits++;
        
        return data;
      }
      
      // Cache expiré
      this.cache.delete(key);
      
      // Incrémenter les statistiques de cache
      if (!this.cacheStats) {
        this.cacheStats = { hits: 0, misses: 0 };
      }
      this.cacheStats.misses++;
      
      return null;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération du cache:', error);
      return null;
    }
  }
  
  /**
   * Enregistre un résultat dans le cache
   * @param {String} key - Clé de cache
   * @param {Array} data - Données à mettre en cache
   */
  saveToCache(key, data) {
    try {
      // Initialiser le cache si nécessaire
      if (!this.cache) {
        this.cache = new Map();
      }
      
      // Vérifier si les données sont valides
      if (!data) {
        console.warn('[SmartScrapingService] Tentative de mise en cache de données invalides');
        return;
      }
      
      // Mettre en cache
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      
      // Incrémenter les statistiques de cache
      if (!this.cacheStats) {
        this.cacheStats = { hits: 0, misses: 0 };
      }
      this.cacheStats.misses++;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la mise en cache:', error);
    }
  }
  
  /**
   * Vide le cache
   */
  clearCache() {
    if (this.cache) {
      this.cache.clear();
    }
  }
  
  /**
   * Récupère les statistiques de scraping
   * @returns {Object} Statistiques
   */
  getStats() {
    const hitRate = scrapingStats.requests > 0 
      ? (scrapingStats.hits / scrapingStats.requests) * 100 
      : 0;
    
    return {
      ...scrapingStats,
      hitRate: `${hitRate.toFixed(2)}%`,
      timestamp: Date.now()
    };
  }
  
  /**
   * Réinitialise les statistiques de scraping
   */
  resetStats() {
    Object.keys(scrapingStats).forEach(key => {
      if (key === 'sources') {
        scrapingStats.sources = {};
      } else {
        scrapingStats[key] = 0;
      }
    });
    
    console.log('[SmartScrapingService] Statistiques réinitialisées');
  }
  
  /**
   * Récupère des données de démonstration pour le développement
   * @param {String} type - Type de données ('popular', 'movies', 'dramas', 'anime')
   * @param {Number} count - Nombre d'éléments à générer
   * @returns {Promise<Array>} Données de démonstration
   * @private
   */
  async _getDemoData(type = 'popular', count = 20) {
    // Liste de titres de dramas populaires
    const dramaTitles = [
      'Squid Game', 'Crash Landing on You', 'Itaewon Class', 'Goblin', 'Vincenzo',
      'True Beauty', 'Hospital Playlist', 'Mr. Queen', 'Start-Up', 'It\'s Okay to Not Be Okay',
      'Reply 1988', 'The King: Eternal Monarch', 'Descendants of the Sun', 'My Love from the Star',
      'Hotel Del Luna', 'What\'s Wrong with Secretary Kim', 'Strong Woman Do Bong Soon',
      'Boys Over Flowers', 'Heirs', 'Signal'
    ];
    
    // Liste de titres d'animes populaires
    const animeTitles = [
      'Solo Leveling', 'Attack on Titan', 'Demon Slayer', 'My Hero Academia', 'Jujutsu Kaisen', 'One Piece',
      'Naruto', 'Death Note', 'Fullmetal Alchemist: Brotherhood', 'Hunter x Hunter', 'Tokyo Ghoul',
      'Sword Art Online', 'One Punch Man', 'Dragon Ball Z', 'Your Name', 'Spirited Away',
      'Violet Evergarden', 'Re:Zero', 'Steins;Gate', 'Cowboy Bebop', 'Code Geass'
    ];
    
    // Liste de titres de films populaires
    const movieTitles = [
      'Parasite', 'Train to Busan', 'The Handmaiden', 'Oldboy', 'Burning',
      'I Saw the Devil', 'A Tale of Two Sisters', 'The Host', 'The Wailing', 'Memories of Murder',
      'Mother', 'Joint Security Area', 'Thirst', 'The Man from Nowhere', 'A Bittersweet Life',
      'Silenced', 'New World', 'The Chaser', 'The Yellow Sea', 'Sympathy for Lady Vengeance'
    ];
    
    // Liste de pays
    const countries = ['Corée du Sud', 'Japon', 'Chine', 'Thaïlande', 'Taïwan'];
    
    // Liste de genres
    const genres = ['Romance', 'Comédie', 'Drame', 'Action', 'Thriller', 'Fantastique', 'Historique', 'Médical', 'Mystère', 'Science-fiction'];
    
    // Sélectionner les titres en fonction du type
    let titles;
    let contentType;
    
    switch (type) {
      case 'dramas':
        titles = dramaTitles;
        contentType = 'drama';
        break;
      case 'anime':
        titles = animeTitles;
        contentType = 'anime';
        break;
      case 'movies':
        titles = movieTitles;
        contentType = 'movie';
        break;
      default:
        // Pour 'popular', mélanger tous les types
        titles = [...dramaTitles, ...animeTitles, ...movieTitles];
        contentType = null;
        break;
    }
    
    // Mélanger les titres
    const shuffledTitles = titles.sort(() => Math.random() - 0.5);
    
    // Générer les données
    const demoData = [];
    
    for (let i = 0; i < Math.min(count, shuffledTitles.length); i++) {
      const title = shuffledTitles[i];
      
      // Déterminer le type de contenu si non spécifié
      let itemType = contentType;
      if (!itemType) {
        if (dramaTitles.includes(title)) {
          itemType = 'drama';
        } else if (animeTitles.includes(title)) {
          itemType = 'anime';
        } else {
          itemType = 'movie';
        }
      }
      
      // Déterminer le pays en fonction du type
      let country;
      if (itemType === 'anime') {
        country = 'Japon';
      } else {
        country = countries[Math.floor(Math.random() * countries.length)];
      }
      
      // Sélectionner des genres aléatoires (2-4)
      const itemGenres = [];
      const genreCount = Math.floor(Math.random() * 3) + 2; // 2-4 genres
      
      while (itemGenres.length < genreCount) {
        const genre = genres[Math.floor(Math.random() * genres.length)];
        if (!itemGenres.includes(genre)) {
          itemGenres.push(genre);
        }
      }
      
      // Générer un ID unique
      const id = `demo-${itemType}-${i + 1}`;
      
      // Récupérer une image réelle pour le titre
      const image = await this._getImageForTitle(title, itemType);
      
      demoData.push({
        id,
        title,
        alternativeTitles: [],
        description: `Ceci est une description de démonstration pour ${title}.`,
        image,
        poster: image,
        backdrop: image,
        type: itemType,
        year: 2020 + Math.floor(Math.random() * 4), // 2020-2023
        country,
        genres: itemGenres,
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
        episodes: itemType === 'movie' ? 1 : Math.floor(Math.random() * 16) + 5, // 5-20 épisodes
        status: Math.random() > 0.3 ? 'Terminé' : 'En cours',
        source: 'FloDrama Demo'
      });
    }
    
    // Indexer les données pour la recherche
    if (this.searchIndexService && this.searchIndexService.indexItems) {
      this.searchIndexService.indexItems(demoData);
    }
    
    return demoData;
  }
  
  /**
   * Récupère une image réelle pour un titre donné
   * @param {String} title - Titre du contenu
   * @param {String} type - Type de contenu (drama, anime, movie)
   * @returns {Promise<String>} URL de l'image
   * @private
   */
  async _getImageForTitle(title, type) {
    try {
      // Utiliser TMDB pour récupérer des images réelles
      const tmdbApiKey = '3e1dd3d6a72f66d2c430b513b78e53a7'; // Clé API publique pour démo
      const encodedTitle = encodeURIComponent(title);
      
      let endpoint;
      if (type === 'movie') {
        endpoint = 'movie';
      } else if (type === 'drama') {
        endpoint = 'tv';
      } else if (type === 'anime') {
        endpoint = 'tv';
      }
      
      const response = await fetch(`https://api.themoviedb.org/3/search/${endpoint}?api_key=${tmdbApiKey}&query=${encodedTitle}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result.poster_path) {
          return `https://image.tmdb.org/t/p/w500${result.poster_path}`;
        }
      }
      
      // Fallback vers des images générées
      return `https://via.placeholder.com/500x750/1a202c/ffffff?text=${encodeURIComponent(title)}`;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération de l\'image:', error);
      return `https://via.placeholder.com/500x750/1a202c/ffffff?text=${encodeURIComponent(title)}`;
    }
  }
  
  /**
   * Extrait les métadonnées d'un élément
   * @param {Object} item - Élément
   * @returns {Object} Métadonnées
   * @private
   */
  _extractMetadata(item) {
    return {
      year: item.year || new Date().getFullYear(),
      country: item.country || 'Corée du Sud',
      genres: item.genres || []
    };
  }
}

// Créer une instance unique du service
const smartScrapingService = new SmartScrapingService();

// Exporter le service
export default smartScrapingService;
