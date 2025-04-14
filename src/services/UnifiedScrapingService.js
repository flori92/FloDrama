/**
 * UnifiedScrapingService
 * 
 * Service unifié de scraping pour FloDrama qui centralise toutes les fonctionnalités
 * de récupération de contenu et évite les doublons et incohérences.
 */

import axios from 'axios';
import { parse as parseHTML } from 'node-html-parser';
import { logError, logInfo } from '../utils/logger';
import ProxyService from './ProxyService';
import BrowserFingerprintService from './BrowserFingerprintService';
import HumanBehaviorService from './HumanBehaviorService';
import { extractMetadata } from '../utils/contentUtils';

// Configuration unifiée des sources
const UNIFIED_SOURCES = {
  DRAMA: [
    {
      name: 'VoirDrama',
      baseUrl: 'https://voirdrama.org',
      fallbackUrls: ['https://voirdrama.cc', 'https://voirdrama.tv', 'https://vdrama.org', 'https://voirdrama.me'],
      enabled: true,
      priority: 1,
      selectors: {
        popularItems: '.movies-list .movie-item',
        itemTitle: '.movie-item .movie-title h2 a',
        itemPoster: '.movie-item .movie-poster img',
        itemLink: '.movie-item .movie-title h2 a',
        itemMeta: '.movie-item .movie-details'
      }
    },
    {
      name: 'DramaCool',
      baseUrl: 'https://dramacool.com.tr',
      fallbackUrls: ['https://dramacoolhd.mom', 'https://dramacool9.com', 'https://dramacool.so'],
      enabled: true,
      priority: 2,
      selectors: {
        popularItems: '.list-drama .drama-item',
        itemTitle: '.drama-item .title a',
        itemPoster: '.drama-item .lazy',
        itemLink: '.drama-item .title a',
        itemMeta: '.drama-item .info'
      }
    }
  ],
  ANIME: [
    {
      name: 'GoGoAnime',
      baseUrl: 'https://ww5.gogoanime.co.cz',
      fallbackUrls: ['https://gogoanime.by', 'https://ww27.gogoanimes.fi', 'https://gogoanime.org.vc'],
      enabled: true,
      priority: 1,
      selectors: {
        popularItems: '.items .item',
        itemTitle: '.item .name a',
        itemPoster: '.item .img img',
        itemLink: '.item .name a',
        itemMeta: '.item .meta'
      }
    }
  ],
  MOVIE: [
    {
      name: 'Source1Movies',
      baseUrl: 'https://api.source1.com/movie',
      enabled: true,
      priority: 1
    },
    {
      name: 'Source2Films',
      baseUrl: 'https://api.source2.com/film',
      enabled: true,
      priority: 2
    }
  ]
};

// Cache unifié avec TTL (Time To Live)
class UnifiedCache {
  constructor() {
    this.cache = new Map();
    this.metadataCache = new Map();
    this.videoCache = new Map();
    
    // Configuration des durées de cache
    this.ttl = {
      metadata: 3600000, // 1 heure pour les métadonnées
      videoLinks: 1800000, // 30 minutes pour les liens vidéos
      search: 600000 // 10 minutes pour les résultats de recherche
    };
    
    // Nettoyage périodique du cache
    setInterval(() => this.cleanExpiredCache(), 300000); // Toutes les 5 minutes
  }
  
  set(key, value, type = 'metadata') {
    const ttl = this.ttl[type] || this.ttl.metadata;
    const cacheObj = {
      value,
      expiry: Date.now() + ttl
    };
    
    if (type === 'metadata') {
      this.metadataCache.set(key, cacheObj);
    } else if (type === 'videoLinks') {
      this.videoCache.set(key, cacheObj);
    } else {
      this.cache.set(key, cacheObj);
    }
  }
  
  get(key, type = 'metadata') {
    let cacheMap;
    
    if (type === 'metadata') {
      cacheMap = this.metadataCache;
    } else if (type === 'videoLinks') {
      cacheMap = this.videoCache;
    } else {
      cacheMap = this.cache;
    }
    
    const cached = cacheMap.get(key);
    
    if (!cached) return null;
    
    // Vérifier si le cache a expiré
    if (cached.expiry < Date.now()) {
      cacheMap.delete(key);
      return null;
    }
    
    return cached.value;
  }
  
  cleanExpiredCache() {
    const now = Date.now();
    
    // Nettoyer le cache de métadonnées
    for (const [key, value] of this.metadataCache.entries()) {
      if (value.expiry < now) {
        this.metadataCache.delete(key);
      }
    }
    
    // Nettoyer le cache de liens vidéos
    for (const [key, value] of this.videoCache.entries()) {
      if (value.expiry < now) {
        this.videoCache.delete(key);
      }
    }
    
    // Nettoyer le cache général
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Statistiques unifiées
const unifiedStats = {
  requests: 0,
  hits: 0,
  misses: 0,
  errors: 0,
  sources: {}
};

class UnifiedScrapingService {
  constructor() {
    this.cache = new UnifiedCache();
    this.proxyService = ProxyService;
    this.fingerprintService = BrowserFingerprintService;
    this.behaviorService = HumanBehaviorService;
    this.sources = UNIFIED_SOURCES;
    this.stats = unifiedStats;
    this.initialized = false;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isServerSide = typeof window === 'undefined';
    this.isClientSide = typeof window !== 'undefined';
    
    // Headers HTTP pour simuler un navigateur réel
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };
  }
  
  /**
   * Initialise le service de scraping
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialiser les services dépendants
      await this.proxyService.initialize();
      await this.fingerprintService.initialize();
      
      // Charger les configurations depuis le serveur si nécessaire
      if (this.isClientSide && this.isProduction) {
        await this.loadRemoteConfigurations();
      }
      
      this.initialized = true;
      logInfo('UnifiedScrapingService initialized successfully');
    } catch (error) {
      logError('Failed to initialize UnifiedScrapingService', error);
      throw new Error('Failed to initialize scraping service');
    }
  }
  
  /**
   * Charge les configurations depuis le serveur
   */
  async loadRemoteConfigurations() {
    try {
      const response = await axios.get('/api/config/scraping');
      if (response.data && response.data.sources) {
        // Fusionner avec les configurations locales
        this.sources = {
          ...this.sources,
          ...response.data.sources
        };
      }
    } catch (error) {
      logError('Failed to load remote scraping configurations', error);
      // Continuer avec les configurations locales
    }
  }
  
  /**
   * Récupère les métadonnées d'un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type de contenu ('DRAMA', 'ANIME', 'MOVIE')
   * @returns {Promise<Object>} - Métadonnées du contenu
   */
  async getContentMetadata(contentId, type) {
    await this.ensureInitialized();
    
    // Vérifier le cache
    const cacheKey = `metadata_${type}_${contentId}`;
    const cachedData = this.cache.get(cacheKey, 'metadata');
    
    if (cachedData) {
      this.stats.hits++;
      return cachedData;
    }
    
    this.stats.misses++;
    this.stats.requests++;
    
    try {
      // Sélectionner les sources appropriées
      const sources = this.sources[type] || [];
      
      if (sources.length === 0) {
        throw new Error(`No sources configured for content type: ${type}`);
      }
      
      // Trier les sources par priorité
      const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);
      
      // Essayer chaque source jusqu'à obtenir un résultat
      let metadata = null;
      let errors = [];
      
      for (const source of sortedSources) {
        if (!source.enabled) continue;
        
        try {
          // Incrémenter les statistiques de la source
          this.stats.sources[source.name] = this.stats.sources[source.name] || { requests: 0, hits: 0, errors: 0 };
          this.stats.sources[source.name].requests++;
          
          // Récupérer les métadonnées depuis la source
          metadata = await this.fetchMetadataFromSource(contentId, source, type);
          
          if (metadata) {
            this.stats.sources[source.name].hits++;
            break;
          }
        } catch (error) {
          this.stats.sources[source.name].errors++;
          errors.push({ source: source.name, error: error.message });
        }
      }
      
      if (!metadata) {
        this.stats.errors++;
        throw new Error(`Failed to fetch metadata from all sources: ${JSON.stringify(errors)}`);
      }
      
      // Enrichir les métadonnées
      const enrichedMetadata = this.enrichMetadata(metadata, type);
      
      // Mettre en cache
      this.cache.set(cacheKey, enrichedMetadata, 'metadata');
      
      return enrichedMetadata;
    } catch (error) {
      logError(`Error fetching metadata for ${type} ${contentId}`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les liens vidéos pour un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type de contenu ('DRAMA', 'ANIME', 'MOVIE')
   * @param {string} episodeId - ID de l'épisode (optionnel)
   * @returns {Promise<Array>} - Liens vidéos
   */
  async getVideoLinks(contentId, type, episodeId = null) {
    await this.ensureInitialized();
    
    // Vérifier le cache
    const cacheKey = `video_${type}_${contentId}_${episodeId || 'main'}`;
    const cachedData = this.cache.get(cacheKey, 'videoLinks');
    
    if (cachedData) {
      this.stats.hits++;
      return cachedData;
    }
    
    this.stats.misses++;
    this.stats.requests++;
    
    try {
      // Sélectionner les sources appropriées
      const sources = this.sources[type] || [];
      
      if (sources.length === 0) {
        throw new Error(`No sources configured for content type: ${type}`);
      }
      
      // Trier les sources par priorité
      const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);
      
      // Essayer chaque source jusqu'à obtenir un résultat
      let videoLinks = null;
      let errors = [];
      
      for (const source of sortedSources) {
        if (!source.enabled) continue;
        
        try {
          // Incrémenter les statistiques de la source
          this.stats.sources[source.name] = this.stats.sources[source.name] || { requests: 0, hits: 0, errors: 0 };
          this.stats.sources[source.name].requests++;
          
          // Récupérer les liens vidéos depuis la source
          videoLinks = await this.fetchVideoLinksFromSource(contentId, source, type, episodeId);
          
          if (videoLinks && videoLinks.length > 0) {
            this.stats.sources[source.name].hits++;
            break;
          }
        } catch (error) {
          this.stats.sources[source.name].errors++;
          errors.push({ source: source.name, error: error.message });
        }
      }
      
      if (!videoLinks || videoLinks.length === 0) {
        this.stats.errors++;
        throw new Error(`Failed to fetch video links from all sources: ${JSON.stringify(errors)}`);
      }
      
      // Mettre en cache
      this.cache.set(cacheKey, videoLinks, 'videoLinks');
      
      return videoLinks;
    } catch (error) {
      logError(`Error fetching video links for ${type} ${contentId} episode ${episodeId}`, error);
      throw error;
    }
  }
  
  /**
   * S'assure que le service est initialisé
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Récupère les métadonnées depuis une source spécifique
   * @param {string} contentId - ID du contenu
   * @param {Object} source - Configuration de la source
   * @param {string} type - Type de contenu
   * @returns {Promise<Object>} - Métadonnées du contenu
   */
  async fetchMetadataFromSource(contentId, source, type) {
    // Implémentation spécifique selon la source
    // Cette méthode sera complétée avec la logique spécifique à chaque source
    return null;
  }
  
  /**
   * Récupère les liens vidéos depuis une source spécifique
   * @param {string} contentId - ID du contenu
   * @param {Object} source - Configuration de la source
   * @param {string} type - Type de contenu
   * @param {string} episodeId - ID de l'épisode
   * @returns {Promise<Array>} - Liens vidéos
   */
  async fetchVideoLinksFromSource(contentId, source, type, episodeId) {
    // Implémentation spécifique selon la source
    // Cette méthode sera complétée avec la logique spécifique à chaque source
    return [];
  }
  
  /**
   * Enrichit les métadonnées avec des informations supplémentaires
   * @param {Object} metadata - Métadonnées de base
   * @param {string} type - Type de contenu
   * @returns {Object} - Métadonnées enrichies
   */
  enrichMetadata(metadata, type) {
    // Ajouter des informations supplémentaires aux métadonnées
    return {
      ...metadata,
      enriched: true,
      enrichmentDate: new Date().toISOString()
    };
  }
  
  /**
   * Recherche des contenus
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de contenu (optionnel)
   * @returns {Promise<Array>} - Résultats de recherche
   */
  async searchContent(query, type = null) {
    await this.ensureInitialized();
    
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    // Vérifier le cache
    const cacheKey = `search_${type || 'all'}_${query.toLowerCase().trim()}`;
    const cachedData = this.cache.get(cacheKey, 'search');
    
    if (cachedData) {
      this.stats.hits++;
      return cachedData;
    }
    
    this.stats.misses++;
    this.stats.requests++;
    
    try {
      // Sélectionner les sources appropriées
      let sourcesToSearch = [];
      
      if (type) {
        sourcesToSearch = this.sources[type] || [];
      } else {
        // Combiner toutes les sources
        Object.values(this.sources).forEach(sourceGroup => {
          sourcesToSearch = [...sourcesToSearch, ...sourceGroup];
        });
      }
      
      if (sourcesToSearch.length === 0) {
        return [];
      }
      
      // Trier les sources par priorité
      const sortedSources = [...sourcesToSearch].sort((a, b) => a.priority - b.priority);
      
      // Rechercher dans chaque source
      const searchPromises = sortedSources
        .filter(source => source.enabled)
        .map(source => this.searchInSource(query, source, type));
      
      // Attendre tous les résultats
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Combiner les résultats
      const combinedResults = [];
      
      searchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          combinedResults.push(...result.value);
        }
      });
      
      // Dédupliquer les résultats
      const uniqueResults = this.deduplicateResults(combinedResults);
      
      // Mettre en cache
      this.cache.set(cacheKey, uniqueResults, 'search');
      
      return uniqueResults;
    } catch (error) {
      logError(`Error searching for ${query} in ${type || 'all'}`, error);
      return [];
    }
  }
  
  /**
   * Recherche dans une source spécifique
   * @param {string} query - Terme de recherche
   * @param {Object} source - Configuration de la source
   * @param {string} type - Type de contenu
   * @returns {Promise<Array>} - Résultats de recherche
   */
  async searchInSource(query, source, type) {
    // Implémentation spécifique selon la source
    // Cette méthode sera complétée avec la logique spécifique à chaque source
    return [];
  }
  
  /**
   * Déduplique les résultats de recherche
   * @param {Array} results - Résultats à dédupliquer
   * @returns {Array} - Résultats dédupliqués
   */
  deduplicateResults(results) {
    const uniqueMap = new Map();
    
    results.forEach(result => {
      const key = `${result.title}_${result.type}`;
      
      if (!uniqueMap.has(key) || uniqueMap.get(key).score < result.score) {
        uniqueMap.set(key, result);
      }
    });
    
    return Array.from(uniqueMap.values());
  }
  
  /**
   * Récupère les statistiques du service
   * @returns {Object} - Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: {
        metadata: this.cache.metadataCache.size,
        videoLinks: this.cache.videoCache.size,
        search: this.cache.cache.size
      }
    };
  }
}

// Exporter une instance singleton
const unifiedScrapingService = new UnifiedScrapingService();
export default unifiedScrapingService;
