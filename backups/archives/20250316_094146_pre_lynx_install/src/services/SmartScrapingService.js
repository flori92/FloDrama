/**
 * SmartScrapingService
 * 
 * Service de scraping intelligent qui combine plusieurs techniques avancées
 * pour contourner les protections anti-bot et s'adapter à n'importe quelle structure de site
 */

import ProxyService from './ProxyService.js';
import BrowserFingerprintService from './BrowserFingerprintService.js';
import HumanBehaviorService from './HumanBehaviorService.js';
import AdaptiveScraperService from './AdaptiveScraperService.js';
import SearchIndexService from './SearchIndexService.js';
import ContentDataService from './ContentDataService.js';
import { extractMetadata, generateId } from '../utils/contentUtils.js';

// Cache en mémoire
const cache = new Map();

// Statistiques de scraping
const scrapingStats = {
  requests: 0,
  hits: 0,
  errors: 0,
  sources: {}
};

class SmartScrapingService {
  constructor() {
    this.proxyService = ProxyService;
    this.fingerprintService = BrowserFingerprintService;
    this.behaviorService = HumanBehaviorService;
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
  }

  /**
   * Initialise le worker d'indexation
   * @private
   */
  _initIndexationWorker() {
    // Vérifier si l'environnement supporte les Web Workers
    if (typeof Worker !== 'undefined' && typeof window !== 'undefined') {
      try {
        this._indexationWorker = new Worker('/workers/IndexationWorker.js');
        
        // Écouter les messages du worker
        this._indexationWorker.onmessage = (event) => {
          const { type, result, error, status } = event.data;
          
          if (type === 'error') {
            console.error('[SmartScrapingService] Erreur du worker d\'indexation:', error);
          } else if (type === 'indexing_complete' || type === 'background_indexing_complete') {
            console.log(`[SmartScrapingService] Indexation terminée:`, result);
            
            // Émettre un événement pour informer l'application
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('flodrama:indexation-complete', { 
                detail: { timestamp: Date.now(), result }
              }));
            }
          } else if (type === 'status') {
            console.log(`[SmartScrapingService] Statut du worker:`, status);
          }
        };
        
        console.log('[SmartScrapingService] Worker d\'indexation initialisé avec succès');
      } catch (error) {
        console.error('[SmartScrapingService] Erreur lors de l\'initialisation du worker d\'indexation:', error);
        this._indexationWorker = null;
      }
    } else {
      console.warn('[SmartScrapingService] Les Web Workers ne sont pas supportés dans cet environnement');
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
    if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      
      // Vérifier si le cache est encore valide (6 heures)
      if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
        scrapingStats.hits++;
        return data;
      }
    }
    
    scrapingStats.misses++;
    scrapingStats.requests++;
    
    try {
      // Utiliser la meilleure source disponible
      const source = this._getBestSource('popular');
      const url = source.popularUrl;
      
      console.log(`[SmartScrapingService] Récupération des éléments populaires depuis ${source.name}`);
      
      // Utiliser le service de scraping adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Enrichir les données avec les métadonnées
      const enrichedItems = await Promise.all(items.map(async item => {
        // Extraire les métadonnées
        const metadata = extractMetadata(item);
        
        // Appliquer la transformation spécifique à la source
        const transformedItem = source.transform ? source.transform(item) : item;
        
        // Générer un ID unique
        const id = `${source.name.toLowerCase()}-${generateId(item.title)}`;
        
        const enrichedItem = {
          ...transformedItem,
          ...metadata,
          id
        };
        
        // Stocker les métadonnées dans ContentDataService
        await this.contentDataService.storeContentData(enrichedItem);
        
        return enrichedItem;
      }));
      
      // Mettre en cache
      cache.set(cacheKey, {
        data: enrichedItems,
        timestamp: Date.now()
      });
      
      // Mettre à jour les statistiques
      if (!scrapingStats.sources[source.name]) {
        scrapingStats.sources[source.name] = { requests: 0, success: 0, errors: 0 };
      }
      scrapingStats.sources[source.name].requests++;
      scrapingStats.sources[source.name].success++;
      
      return enrichedItems;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération des éléments populaires:', error);
      
      // Mettre à jour les statistiques
      scrapingStats.errors++;
      
      // Essayer une autre source en cas d'échec
      try {
        const fallbackSource = this._getFallbackSource('popular');
        console.log(`[SmartScrapingService] Tentative avec une source alternative: ${fallbackSource.name}`);
        
        const fallbackUrl = fallbackSource.popularUrl;
        const fallbackItems = await this.adaptiveScraperService.scrapeWithPagination(fallbackUrl, pageCount);
        
        // Enrichir les données avec les métadonnées
        const enrichedItems = await Promise.all(fallbackItems.map(async item => {
          // Extraire les métadonnées
          const metadata = extractMetadata(item);
          
          // Appliquer la transformation spécifique à la source
          const transformedItem = fallbackSource.transform ? fallbackSource.transform(item) : item;
          
          // Générer un ID unique
          const id = `${fallbackSource.name.toLowerCase()}-${generateId(item.title)}`;
          
          const enrichedItem = {
            ...transformedItem,
            ...metadata,
            id
          };
          
          // Stocker les métadonnées dans ContentDataService
          await this.contentDataService.storeContentData(enrichedItem);
          
          return enrichedItem;
        }));
        
        // Mettre en cache
        cache.set(cacheKey, {
          data: enrichedItems,
          timestamp: Date.now()
        });
        
        // Mettre à jour les statistiques
        if (!scrapingStats.sources[fallbackSource.name]) {
          scrapingStats.sources[fallbackSource.name] = { requests: 0, success: 0, errors: 0 };
        }
        scrapingStats.sources[fallbackSource.name].requests++;
        scrapingStats.sources[fallbackSource.name].success++;
        
        return enrichedItems;
      } catch (fallbackError) {
        console.error('[SmartScrapingService] Échec de la source alternative:', fallbackError);
        scrapingStats.errors++;
        
        // Retourner un tableau vide en cas d'échec complet
        return [];
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
    if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      
      // Vérifier si le cache est encore valide (6 heures)
      if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
        scrapingStats.hits++;
        return data;
      }
    }
    
    scrapingStats.misses++;
    scrapingStats.requests++;
    
    try {
      // Utiliser la meilleure source disponible
      const source = this._getBestSource('movies');
      const url = source.moviesUrl;
      
      console.log(`[SmartScrapingService] Récupération des films populaires depuis ${source.name}`);
      
      // Utiliser le service de scraping adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Enrichir les données avec les métadonnées
      const enrichedItems = await Promise.all(items.map(async item => {
        // Extraire les métadonnées
        const metadata = extractMetadata(item);
        
        // Appliquer la transformation spécifique à la source
        const transformedItem = source.transform ? source.transform(item) : item;
        
        // Générer un ID unique
        const id = `${source.name.toLowerCase()}-${generateId(item.title)}`;
        
        const enrichedItem = {
          ...transformedItem,
          ...metadata,
          id,
          type: 'movie'
        };
        
        // Stocker les métadonnées dans ContentDataService
        await this.contentDataService.storeContentData(enrichedItem);
        
        return enrichedItem;
      }));
      
      // Mettre en cache
      cache.set(cacheKey, {
        data: enrichedItems,
        timestamp: Date.now()
      });
      
      // Mettre à jour les statistiques
      if (!scrapingStats.sources[source.name]) {
        scrapingStats.sources[source.name] = { requests: 0, success: 0, errors: 0 };
      }
      scrapingStats.sources[source.name].requests++;
      scrapingStats.sources[source.name].success++;
      
      return enrichedItems;
    } catch (error) {
      console.error('[SmartScrapingService] Erreur lors de la récupération des films populaires:', error);
      
      // Mettre à jour les statistiques
      scrapingStats.errors++;
      
      // Essayer une autre source en cas d'échec
      try {
        const fallbackSource = this._getFallbackSource('movies');
        console.log(`[SmartScrapingService] Tentative avec une source alternative: ${fallbackSource.name}`);
        
        const fallbackUrl = fallbackSource.moviesUrl;
        const fallbackItems = await this.adaptiveScraperService.scrapeWithPagination(fallbackUrl, pageCount);
        
        // Enrichir les données avec les métadonnées
        const enrichedItems = await Promise.all(fallbackItems.map(async item => {
          // Extraire les métadonnées
          const metadata = extractMetadata(item);
          
          // Appliquer la transformation spécifique à la source
          const transformedItem = fallbackSource.transform ? fallbackSource.transform(item) : item;
          
          // Générer un ID unique
          const id = `${fallbackSource.name.toLowerCase()}-${generateId(item.title)}`;
          
          const enrichedItem = {
            ...transformedItem,
            ...metadata,
            id,
            type: 'movie'
          };
          
          // Stocker les métadonnées dans ContentDataService
          await this.contentDataService.storeContentData(enrichedItem);
          
          return enrichedItem;
        }));
        
        // Mettre en cache
        cache.set(cacheKey, {
          data: enrichedItems,
          timestamp: Date.now()
        });
        
        // Mettre à jour les statistiques
        if (!scrapingStats.sources[fallbackSource.name]) {
          scrapingStats.sources[fallbackSource.name] = { requests: 0, success: 0, errors: 0 };
        }
        scrapingStats.sources[fallbackSource.name].requests++;
        scrapingStats.sources[fallbackSource.name].success++;
        
        return enrichedItems;
      } catch (fallbackError) {
        console.error('[SmartScrapingService] Échec de la source alternative:', fallbackError);
        scrapingStats.errors++;
        
        // Retourner un tableau vide en cas d'échec complet
        return [];
      }
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
    
    // Obtenir la meilleure source
    const source = this._getBestSource();
    const url = this.sources[source].kshowsUrl;
    
    try {
      // Utiliser le scraper adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
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
        const alternativeUrl = this.sources[alternativeSource].kshowsUrl;
        
        try {
          const items = await this.adaptiveScraperService.scrapeWithPagination(alternativeUrl, pageCount);
          
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
          throw new Error('Impossible de récupérer les K-shows populaires');
        }
      }
      
      console.error('Erreur lors de la récupération des K-shows populaires:', error);
      throw error;
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
    return this.getPopular(pageCount); // Pour l'instant, on utilise la même méthode
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
    
    // Filtrer les sources d'anime
    const animeSources = Object.keys(this.sources)
      .filter(key => this.sources[key].type === 'anime' && this.sources[key].popularUrl)
      .sort((a, b) => this.sources[a].priority - this.sources[b].priority);
    
    if (animeSources.length === 0) {
      // Utiliser une source générique si aucune source d'anime n'est disponible
      return this.getPopular(pageCount);
    }
    
    // Utiliser la meilleure source d'anime
    const sourceKey = animeSources[0];
    const url = this.sources[sourceKey].popularUrl;
    
    try {
      // Utiliser le scraper adaptatif
      const items = await this.adaptiveScraperService.scrapeWithPagination(url, pageCount);
      
      // Mettre à jour les statistiques
      this.updateSourceStats(sourceKey, true);
      
      // Indexer les résultats en arrière-plan
      this._indexItemsAsync(items);
      
      // Mettre en cache le résultat
      this.saveToCache(cacheKey, items);
      
      return items;
    } catch (error) {
      // Mettre à jour les statistiques
      this.updateSourceStats(sourceKey, false);
      
      // Essayer avec une autre source
      if (animeSources.length > 1) {
        const alternativeSourceKey = animeSources[1];
        console.log(`Échec avec la source ${sourceKey}, tentative avec ${alternativeSourceKey}`);
        const alternativeUrl = this.sources[alternativeSourceKey].popularUrl;
        
        try {
          const items = await this.adaptiveScraperService.scrapeWithPagination(alternativeUrl, pageCount);
          
          // Mettre à jour les statistiques
          this.updateSourceStats(alternativeSourceKey, true);
          
          // Indexer les résultats en arrière-plan
          this._indexItemsAsync(items);
          
          // Mettre en cache le résultat
          this.saveToCache(cacheKey, items);
          
          return items;
        } catch (alternativeError) {
          // Mettre à jour les statistiques
          this.updateSourceStats(alternativeSourceKey, false);
          
          console.error('Échec avec toutes les sources d\'anime:', alternativeError);
          throw new Error('Impossible de récupérer les animés populaires');
        }
      }
      
      console.error('Erreur lors de la récupération des animés populaires:', error);
      throw error;
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
   * @returns {String} Nom de la meilleure source
   */
  _getBestSource(contentType = 'popular') {
    // Vérifier les statistiques de succès pour chaque source
    const sourceStats = Object.entries(this.sources).map(([name, source]) => {
      // Récupérer les statistiques de la source
      const stats = scrapingStats.sources[name] || { requests: 0, success: 0, errors: 0 };
      
      // Calculer le taux de succès
      const successRate = stats.requests > 0 ? stats.success / stats.requests : 0;
      
      // Vérifier si la source supporte le type de contenu demandé
      const supportsContentType = source[`${contentType}Url`] ? true : false;
      
      return {
        name,
        source,
        successRate,
        supportsContentType,
        priority: source.priority || 0
      };
    });
    
    // Filtrer les sources qui supportent le type de contenu
    const compatibleSources = sourceStats.filter(s => s.supportsContentType);
    
    if (compatibleSources.length === 0) {
      console.warn(`[SmartScrapingService] Aucune source ne supporte le type de contenu '${contentType}'`);
      return this.sources[Object.keys(this.sources)[0]]; // Retourner la première source par défaut
    }
    
    // Trier par taux de succès et priorité
    compatibleSources.sort((a, b) => {
      // D'abord par priorité (plus élevée d'abord)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      
      // Ensuite par taux de succès
      return b.successRate - a.successRate;
    });
    
    // Retourner la meilleure source
    return compatibleSources[0].source;
  }
  
  /**
   * Obtient une source alternative pour un type de contenu donné
   * @param {String} contentType - Type de contenu ('popular', 'movies', 'kshows', etc.)
   * @param {String} excludeSource - Nom de la source à exclure
   * @returns {Object} Source alternative
   */
  _getFallbackSource(contentType = 'popular', excludeSource = null) {
    // Vérifier les statistiques de succès pour chaque source
    const sourceStats = Object.entries(this.sources)
      .filter(([name, _]) => name !== excludeSource) // Exclure la source spécifiée
      .map(([name, source]) => {
        // Récupérer les statistiques de la source
        const stats = scrapingStats.sources[name] || { requests: 0, success: 0, errors: 0 };
        
        // Calculer le taux de succès
        const successRate = stats.requests > 0 ? stats.success / stats.requests : 0;
        
        // Vérifier si la source supporte le type de contenu demandé
        const supportsContentType = source[`${contentType}Url`] ? true : false;
        
        return {
          name,
          source,
          successRate,
          supportsContentType,
          priority: source.priority || 0
        };
      });
    
    // Filtrer les sources qui supportent le type de contenu
    const compatibleSources = sourceStats.filter(s => s.supportsContentType);
    
    if (compatibleSources.length === 0) {
      console.warn(`[SmartScrapingService] Aucune source alternative ne supporte le type de contenu '${contentType}'`);
      
      // Retourner la première source disponible qui n'est pas la source exclue
      const firstAvailableSource = Object.entries(this.sources)
        .find(([name, _]) => name !== excludeSource);
      
      return firstAvailableSource ? firstAvailableSource[1] : null;
    }
    
    // Trier par taux de succès et priorité
    compatibleSources.sort((a, b) => {
      // D'abord par priorité (plus élevée d'abord)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      
      // Ensuite par taux de succès
      return b.successRate - a.successRate;
    });
    
    // Retourner la meilleure source alternative
    return compatibleSources[0].source;
  }
  
  /**
   * Met à jour les statistiques d'une source
   * @param {String} source - Nom de la source
   * @param {Boolean} success - Indique si la requête a réussi
   */
  updateSourceStats(source, success) {
    const stats = scrapingStats.sources[source] || { success: 0, failure: 0, errors: 0 };
    
    if (success) {
      stats.success++;
      stats.lastSuccess = Date.now();
    } else {
      stats.failure++;
    }
    
    scrapingStats.sources[source] = stats;
  }
  
  /**
   * Récupère un résultat du cache
   * @param {String} key - Clé de cache
   * @returns {Array|null} Résultat du cache ou null
   */
  getFromCache(key) {
    if (!cache.has(key)) {
      return null;
    }
    
    const { timestamp, data } = cache.get(key);
    const now = Date.now();
    const expirationTime = timestamp + (30 * 60 * 1000);
    
    if (now > expirationTime) {
      // Le cache a expiré
      cache.delete(key);
      return null;
    }
    
    return data;
  }
  
  /**
   * Enregistre un résultat dans le cache
   * @param {String} key - Clé de cache
   * @param {Array} data - Données à mettre en cache
   */
  saveToCache(key, data) {
    cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }
  
  /**
   * Vide le cache
   */
  clearCache() {
    cache.clear();
  }
  
  /**
   * Récupère les statistiques des sources
   * @returns {Object} Statistiques des sources
   */
  getSourceStats() {
    const stats = {};
    
    for (const [source, sourceStats] of scrapingStats.sources.entries()) {
      stats[source] = {
        ...sourceStats,
        successRate: sourceStats.success / (sourceStats.success + sourceStats.failure || 1) * 100
      };
    }
    
    return stats;
  }
  
  /**
   * Démarre le scraping périodique en arrière-plan
   * Récupère les métadonnées une fois par jour
   * @returns {Object} Objet contenant la méthode stop pour arrêter le scraping périodique
   */
  startDailyBackgroundScraping() {
    // Vérifier si un scraping périodique est déjà en cours
    if (this._backgroundScrapingInterval) {
      console.log('Le scraping périodique est déjà en cours');
      return {
        stop: () => this.stopBackgroundScraping()
      };
    }
    
    console.log('Démarrage du scraping périodique (quotidien)');
    
    // Exécuter immédiatement une première fois
    this._runBackgroundScraping();
    
    // Définir l'intervalle pour une exécution quotidienne (24 heures)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    this._backgroundScrapingInterval = setInterval(() => {
      this._runBackgroundScraping();
    }, ONE_DAY_MS);
    
    // Retourner un objet avec la méthode pour arrêter le scraping
    return {
      stop: () => this.stopBackgroundScraping()
    };
  }
  
  /**
   * Arrête le scraping périodique en arrière-plan
   */
  stopBackgroundScraping() {
    if (this._backgroundScrapingInterval) {
      clearInterval(this._backgroundScrapingInterval);
      this._backgroundScrapingInterval = null;
      console.log('Arrêt du scraping périodique');
    }
  }
  
  /**
   * Exécute le scraping en arrière-plan pour alimenter les métadonnées
   * @private
   */
  async _runBackgroundScraping() {
    console.log(`Exécution du scraping en arrière-plan: ${new Date().toISOString()}`);
    
    try {
      // Si le worker d'indexation est disponible, lui déléguer la tâche
      if (this._indexationWorker) {
        this._indexationWorker.postMessage({
          type: 'run_background_indexing'
        });
        return { success: true, delegated: true };
      }
      
      // Sinon, exécuter dans le thread principal
      // Récupérer un maximum de contenu
      const [popular, movies, kshows, animes, dramas] = await Promise.allSettled([
        this.getPopular(3),
        this.getPopularMovies(3),
        this.getPopularKshows(2),
        this.getPopularAnimes(3),
        this.getPopularDramas(3)
      ]);
      
      // Fusionner tous les résultats
      const allItems = [
        ...(popular.status === 'fulfilled' ? popular.value : []),
        ...(movies.status === 'fulfilled' ? movies.value : []),
        ...(kshows.status === 'fulfilled' ? kshows.value : []),
        ...(animes.status === 'fulfilled' ? animes.value : []),
        ...(dramas.status === 'fulfilled' ? dramas.value : [])
      ];
      
      // Dédupliquer les éléments par ID
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.id || item.title, item])).values()
      );
      
      console.log(`Indexation de ${uniqueItems.length} éléments uniques...`);
      
      // Indexer les éléments
      const result = await this.searchIndexService.indexItems(uniqueItems);
      
      console.log('Indexation complète terminée:', result);
      
      return {
        ...result,
        itemCounts: {
          popular: popular.status === 'fulfilled' ? popular.value.length : 0,
          movies: movies.status === 'fulfilled' ? movies.value.length : 0,
          kshows: kshows.status === 'fulfilled' ? kshows.value.length : 0,
          animes: animes.status === 'fulfilled' ? animes.value.length : 0,
          dramas: dramas.status === 'fulfilled' ? dramas.value.length : 0,
          total: uniqueItems.length
        }
      };
    } catch (error) {
      console.error('Erreur lors du scraping en arrière-plan:', error);
      return { error: error.message };
    }
  }
  
  /**
   * Recherche un élément spécifique dans toutes les sources jusqu'à ce qu'il soit trouvé
   * @param {String} query - Terme de recherche
   * @param {String} type - Type de contenu (drama, anime, movie, all)
   * @returns {Promise<Object>} Premier élément trouvé
   */
  async searchUntilFound(query, type = 'all') {
    const cacheKey = `search_until_found_${type}_${query}`;
    
    // Vérifier le cache
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    let sources;
    
    // Déterminer les sources à utiliser en fonction du type
    if (type === 'anime') {
      sources = Object.keys(this.sources)
        .filter(key => this.sources[key].type === 'anime')
        .sort((a, b) => this.sources[a].priority - this.sources[b].priority);
    } else if (type === 'drama') {
      sources = Object.keys(this.sources)
        .filter(key => !this.sources[key].type || this.sources[key].type === 'drama')
        .sort((a, b) => this.sources[a].priority - this.sources[b].priority);
    } else if (type === 'movie') {
      sources = Object.keys(this.sources)
        .filter(key => this.sources[key].moviesUrl)
        .sort((a, b) => this.sources[a].priority - this.sources[b].priority);
    } else {
      // Pour 'all', utiliser toutes les sources
      sources = Object.keys(this.sources)
        .sort((a, b) => this.sources[a].priority - this.sources[b].priority);
    }
    
    if (sources.length === 0) {
      return null;
    }
    
    // Essayer chaque source jusqu'à ce qu'un élément soit trouvé
    for (const sourceKey of sources) {
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
        
        // Si des éléments sont trouvés, retourner le premier
        if (items && items.length > 0) {
          // Indexer les résultats en arrière-plan
          this._indexItemsAsync(items);
          
          // Mettre en cache le résultat
          this.saveToCache(cacheKey, items[0]);
          return items[0];
        }
      } catch (error) {
        // Mettre à jour les statistiques
        this.updateSourceStats(sourceKey, false);
        console.log(`Erreur avec la source ${sourceKey}:`, error.message);
      }
    }
    
    // Aucun élément trouvé
    return null;
  }
  
  /**
   * Recherche ultra-rapide utilisant l'index Elasticsearch
   * @param {String} query - Terme de recherche
   * @param {String} type - Type de contenu (drama, anime, movie, all)
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} Résultats de recherche
   */
  async searchFast(query, type = 'all', options = {}) {
    console.time('search_fast');
    
    // Utiliser le service d'indexation pour une recherche rapide
    const results = await this.searchIndexService.searchFast(query, type, options);
    
    // Si aucun résultat n'est trouvé dans l'index, essayer le scraping traditionnel
    if (results.length === 0) {
      console.log(`Aucun résultat trouvé dans l'index pour "${query}", utilisation du scraping traditionnel`);
      
      let scrapedResults;
      
      if (type === 'anime') {
        scrapedResults = await this.searchAnime(query);
      } else if (type === 'drama') {
        scrapedResults = await this.searchDramas(query);
      } else if (type === 'movie') {
        // Utiliser une source spécifique pour les films
        const movieSources = Object.keys(this.sources)
          .filter(key => this.sources[key].moviesUrl)
          .sort((a, b) => this.sources[a].priority - this.sources[b].priority);
          
        if (movieSources.length > 0) {
          const sourceKey = movieSources[0];
          const source = this.sources[sourceKey];
          
          try {
            const url = `${source.searchUrl}?keyword=${encodeURIComponent(query)}`;
            scrapedResults = await this.adaptiveScraperService.scrapeUrl(url);
            
            // Mettre à jour les statistiques
            this.updateSourceStats(sourceKey, true);
          } catch (error) {
            console.error(`Erreur lors de la recherche de films:`, error);
            scrapedResults = [];
          }
        }
      } else {
        scrapedResults = await this.searchAll(query);
      }
      
      // Indexer les résultats pour les futures recherches
      if (scrapedResults && scrapedResults.length > 0) {
        this._indexItemsAsync(scrapedResults);
      }
      
      console.timeEnd('search_fast');
      return scrapedResults || [];
    }
    
    console.timeEnd('search_fast');
    return results;
  }
  
  /**
   * Récupère des suggestions pour l'autocomplétion
   * @param {String} prefix - Préfixe pour l'autocomplétion
   * @param {Number} size - Nombre de suggestions à retourner
   * @returns {Promise<Array>} Suggestions d'autocomplétion
   */
  async getSuggestions(prefix, size = 10) {
    return this.searchIndexService.getSuggestions(prefix, size);
  }
  
  /**
   * Récupère tous les titres pour l'autocomplétion
   * @returns {Promise<Array>} Liste de tous les titres
   */
  async getAllTitlesForAutocomplete() {
    return this.searchIndexService.getAllTitlesForAutocomplete();
  }
  
  /**
   * Vérifie l'état des services de recherche
   * @returns {Promise<Object>} État des services
   */
  async checkSearchServices() {
    const indexHealth = await this.searchIndexService.healthCheck();
    
    return {
      ...indexHealth,
      worker: !!this._indexationWorker,
      scraping: !!this._backgroundScrapingInterval,
      sources: Object.keys(this.sources).length,
      enabledSources: Object.keys(this.sources).filter(key => this.sources[key].enabled).length
    };
  }
  
  /**
   * Force l'indexation complète de tous les contenus
   * @returns {Promise<Object>} Résultat de l'indexation
   */
  async forceFullIndexation() {
    console.log('Démarrage de l\'indexation complète...');
    
    try {
      // Récupérer un maximum de contenu
      const [popular, movies, kshows, animes, dramas] = await Promise.allSettled([
        this.getPopular(3),
        this.getPopularMovies(3),
        this.getPopularKshows(2),
        this.getPopularAnimes(3),
        this.getPopularDramas(3)
      ]);
      
      // Fusionner tous les résultats
      const allItems = [
        ...(popular.status === 'fulfilled' ? popular.value : []),
        ...(movies.status === 'fulfilled' ? movies.value : []),
        ...(kshows.status === 'fulfilled' ? kshows.value : []),
        ...(animes.status === 'fulfilled' ? animes.value : []),
        ...(dramas.status === 'fulfilled' ? dramas.value : [])
      ];
      
      // Dédupliquer les éléments par ID
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.id || item.title, item])).values()
      );
      
      console.log(`Indexation de ${uniqueItems.length} éléments uniques...`);
      
      // Indexer les éléments
      const result = await this.searchIndexService.indexItems(uniqueItems);
      
      console.log('Indexation complète terminée:', result);
      
      return {
        ...result,
        itemCounts: {
          popular: popular.status === 'fulfilled' ? popular.value.length : 0,
          movies: movies.status === 'fulfilled' ? movies.value.length : 0,
          kshows: kshows.status === 'fulfilled' ? kshows.value.length : 0,
          animes: animes.status === 'fulfilled' ? animes.value.length : 0,
          dramas: dramas.status === 'fulfilled' ? dramas.value.length : 0,
          total: uniqueItems.length
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'indexation complète:', error);
      return { error: error.message, success: false };
    }
  }
  
  /**
   * Obtient la meilleure source pour un type de contenu donné
   * @param {String} contentType - Type de contenu ('popular', 'movies', 'kshows', etc.)
   * @returns {Object} Source optimale
   */
  getBestSource(contentType = 'popular') {
    // Vérifier les statistiques de succès pour chaque source
    const sourceStats = Object.entries(this.sources).map(([name, source]) => {
      // Récupérer les statistiques de la source
      const stats = scrapingStats.sources[name] || { requests: 0, success: 0, errors: 0 };
      
      // Calculer le taux de succès
      const successRate = stats.requests > 0 ? stats.success / stats.requests : 0;
      
      // Vérifier si la source supporte le type de contenu demandé
      const supportsContentType = source[`${contentType}Url`] ? true : false;
      
      return {
        name,
        source,
        successRate,
        supportsContentType,
        priority: source.priority || 0
      };
    });
    
    // Filtrer les sources qui supportent le type de contenu
    const compatibleSources = sourceStats.filter(s => s.supportsContentType);
    
    if (compatibleSources.length === 0) {
      console.warn(`[SmartScrapingService] Aucune source ne supporte le type de contenu '${contentType}'`);
      return this.sources[Object.keys(this.sources)[0]]; // Retourner la première source par défaut
    }
    
    // Trier par taux de succès et priorité
    compatibleSources.sort((a, b) => {
      // D'abord par priorité (plus élevée d'abord)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      
      // Ensuite par taux de succès
      return b.successRate - a.successRate;
    });
    
    // Retourner la meilleure source
    return compatibleSources[0].source;
  }
  
  /**
   * Obtient une source alternative pour un type de contenu donné
   * @param {String} contentType - Type de contenu ('popular', 'movies', 'kshows', etc.)
   * @param {String} excludeSource - Nom de la source à exclure
   * @returns {Object} Source alternative
   */
  getFallbackSource(contentType = 'popular', excludeSource = null) {
    // Vérifier les statistiques de succès pour chaque source
    const sourceStats = Object.entries(this.sources)
      .filter(([name, _]) => name !== excludeSource) // Exclure la source spécifiée
      .map(([name, source]) => {
        // Récupérer les statistiques de la source
        const stats = scrapingStats.sources[name] || { requests: 0, success: 0, errors: 0 };
        
        // Calculer le taux de succès
        const successRate = stats.requests > 0 ? stats.success / stats.requests : 0;
        
        // Vérifier si la source supporte le type de contenu demandé
        const supportsContentType = source[`${contentType}Url`] ? true : false;
        
        return {
          name,
          source,
          successRate,
          supportsContentType,
          priority: source.priority || 0
        };
      });
    
    // Filtrer les sources qui supportent le type de contenu
    const compatibleSources = sourceStats.filter(s => s.supportsContentType);
    
    if (compatibleSources.length === 0) {
      console.warn(`[SmartScrapingService] Aucune source alternative ne supporte le type de contenu '${contentType}'`);
      
      // Retourner la première source disponible qui n'est pas la source exclue
      const firstAvailableSource = Object.entries(this.sources)
        .find(([name, _]) => name !== excludeSource);
      
      return firstAvailableSource ? firstAvailableSource[1] : null;
    }
    
    // Trier par taux de succès et priorité
    compatibleSources.sort((a, b) => {
      // D'abord par priorité (plus élevée d'abord)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      
      // Ensuite par taux de succès
      return b.successRate - a.successRate;
    });
    
    // Retourner la meilleure source alternative
    return compatibleSources[0].source;
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
}

// Créer une instance unique du service
const smartScrapingService = new SmartScrapingService();

// Exporter le service
export default smartScrapingService;
