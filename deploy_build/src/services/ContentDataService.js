/**
 * ContentDataService
 * 
 * Service de gestion des données de contenu qui fait le lien entre le scraping et la base de données.
 * Optimise l'alimentation des ressources avec un système de cache intelligent.
 */

import SmartScrapingService from './SmartScrapingService';
import { IndexedDBService } from './IndexedDBService';
import ContentCategorizer from './ContentCategorizer';
import { generateId, generateThumbnailUrl, detectCountry, getSourcePriority } from '../utils/contentUtils';
import ApiService from './ApiService';

// Vérifier si nous sommes dans un environnement navigateur
const isBrowser = typeof window !== 'undefined';

// Vérifier si nous sommes en production
const isProduction = process.env.NODE_ENV === 'production';

// Fonction simple pour obtenir la configuration
const getConfig = (key, defaultValue) => {
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG[key] !== undefined) {
    return window.APP_CONFIG[key];
  }
  return defaultValue;
};

// Classe de gestion du cache
class ContentCache {
  constructor() {
    // Cache en mémoire pour les requêtes fréquentes
    this.memoryCache = {
      popular: new Map(),        // Contenus populaires par type
      search: new Map(),         // Résultats de recherche récents
      details: new Map(),        // Détails des contenus consultés
      suggestions: new Map()     // Suggestions d'autocomplétion
    };
    
    // Durées de validité du cache (en millisecondes)
    this.ttl = {
      popular: 6 * 60 * 60 * 1000,      // 6 heures pour les contenus populaires
      search: 30 * 60 * 1000,           // 30 minutes pour les recherches
      details: 24 * 60 * 60 * 1000,     // 24 heures pour les détails
      suggestions: 12 * 60 * 60 * 1000  // 12 heures pour les suggestions
    };
    
    // Priorités de rafraîchissement
    this.refreshPriority = {
      popular: 1,                // Priorité élevée
      trending: 2,               // Priorité moyenne-haute
      recent: 3,                 // Priorité moyenne
      search: 4,                 // Priorité basse
      details: 5                 // Priorité très basse
    };
    
    // Métriques d'utilisation
    this.metrics = {
      hits: 0,
      misses: 0,
      refreshes: 0
    };
  }
  
  /**
   * Récupère une donnée du cache
   * @param {String} key - Clé de cache
   * @param {String} category - Catégorie (popular, search, details, suggestions)
   * @returns {Any|null} Données ou null si non trouvées ou expirées
   */
  get(key, category) {
    if (!this.memoryCache[category]) {
      return null;
    }
    
    const cached = this.memoryCache[category].get(key);
    if (!cached) {
      this.metrics.misses++;
      return null;
    }
    
    // Vérifier si le cache est expiré
    if (Date.now() - cached.timestamp > this.ttl[category]) {
      this.memoryCache[category].delete(key);
      this.metrics.misses++;
      return null;
    }
    
    this.metrics.hits++;
    return cached.data;
  }
  
  /**
   * Enregistre une donnée dans le cache
   * @param {String} key - Clé de cache
   * @param {Any} data - Données à mettre en cache
   * @param {String} category - Catégorie (popular, search, details, suggestions)
   */
  set(key, data, category) {
    if (!this.memoryCache[category]) {
      return;
    }
    
    this.memoryCache[category].set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Invalide une entrée du cache
   * @param {String} key - Clé de cache
   * @param {String} category - Catégorie (popular, search, details, suggestions)
   */
  invalidate(key, category) {
    if (!this.memoryCache[category]) {
      return;
    }
    
    this.memoryCache[category].delete(key);
  }
  
  /**
   * Rafraîchit une catégorie du cache
   * @param {String} category - Catégorie à rafraîchir
   */
  refresh(category) {
    if (!this.memoryCache[category]) {
      return;
    }
    
    // Supprimer les entrées expirées
    for (const [key, value] of this.memoryCache[category].entries()) {
      if (Date.now() - value.timestamp > this.ttl[category]) {
        this.memoryCache[category].delete(key);
      }
    }
    
    this.metrics.refreshes++;
  }
  
  /**
   * Planifie le rafraîchissement automatique du cache
   */
  scheduleRefresh() {
    // Rafraîchir les contenus populaires toutes les 6 heures
    setInterval(() => this.refresh('popular'), 6 * 60 * 60 * 1000);
    
    // Rafraîchir les contenus tendance toutes les 3 heures
    setInterval(() => this.refresh('trending'), 3 * 60 * 60 * 1000);
    
    // Rafraîchir les contenus récents toutes les heures
    setInterval(() => this.refresh('recent'), 60 * 60 * 1000);
  }
  
  /**
   * Récupère les métriques d'utilisation du cache
   * @returns {Object} Métriques
   */
  getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
      : 0;
    
    return {
      ...this.metrics,
      hitRate: `${hitRate.toFixed(2)}%`
    };
  }
}

class ContentDataService {
  constructor() {
    try {
      // Initialisation sécurisée pour éviter les erreurs dans le navigateur
      this.useApiService = getConfig('USE_API_SERVICE') !== 'false';
      
      // En environnement navigateur en production, on initialise de manière minimale
      if (isBrowser && isProduction) {
        console.log('[ContentDataService] Mode navigateur en production détecté, initialisation minimale');
        this.dbService = { get: () => null, put: () => null, getAll: () => [], delete: () => null };
        this.cache = { 
          scheduleRefresh: () => { 
            console.log('[ContentDataService] Planification de rafraîchissement ignorée en mode production');
            return false;
          }, 
          get: () => null, 
          set: (key, data, category) => {
            console.log(`[ContentDataService] Mise en cache ignorée en mode production: ${category}/${key}`);
            return false;
          },
          getMetrics: () => ({ hits: 0, misses: 0, hitRate: '0%' })
        };
        this.categorizer = { categorize: (item) => ({ ...item, type: item.type || 'unknown', genres: item.genres || [] }) };
        
        // Initialiser l'API Service
        if (!this.apiService) {
          this.apiService = new ApiService();
        }
        
        return;
      }
      
      // Initialisation normale en développement ou côté serveur
      this.scrapingService = new SmartScrapingService();
      this.dbService = new IndexedDBService('flodrama-content', 1);
      this.cache = new ContentCache();
      this.categorizer = new ContentCategorizer();
      
      // Initialiser l'API Service si nécessaire
      if (this.useApiService) {
        this.apiService = new ApiService();
      }
      
      // Initialiser les données
      this.popularContent = [];
      this.lastPopularUpdate = 0;
      
      // Initialiser la base de données
      this.initDatabase();
    } catch (error) {
      console.error('[ContentDataService] Erreur lors de l\'initialisation:', error.message);
      // Initialiser des valeurs par défaut pour éviter les erreurs
      this.scrapingService = null;
      this.dbService = { get: () => null, put: () => null, getAll: () => [], delete: () => null };
      this.cache = { 
        scheduleRefresh: () => { 
          console.log('[ContentDataService] Planification de rafraîchissement ignorée (mode erreur)');
          return false;
        }, 
        get: () => null, 
        set: (key, data, category) => {
          console.log(`[ContentDataService] Mise en cache ignorée (mode erreur): ${category}/${key}`);
          return false;
        },
        getMetrics: () => ({ hits: 0, misses: 0, hitRate: '0%' })
      };
      this.categorizer = { categorize: () => ({ type: 'unknown', genres: [] }) };
    }
  }
  
  /**
   * Initialise la base de données
   */
  async initDatabase() {
    try {
      await this.dbService.open([
        { 
          name: 'contents', 
          keyPath: 'id',
          indices: [
            { name: 'type', keyPath: 'type', unique: false },
            { name: 'year', keyPath: 'year', unique: false },
            { name: 'country', keyPath: 'country', unique: false },
            { name: 'genres', keyPath: 'genres', unique: false, multiEntry: true },
            { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
          ]
        },
        { 
          name: 'sources', 
          keyPath: 'id',
          indices: [
            { name: 'contentId', keyPath: 'contentId', unique: false },
            { name: 'source', keyPath: 'source', unique: false },
            { name: 'isValid', keyPath: 'isValid', unique: false },
            { name: 'priority', keyPath: 'priority', unique: false }
          ]
        },
        { 
          name: 'persons', 
          keyPath: 'id',
          indices: [
            { name: 'name', keyPath: 'name', unique: false },
            { name: 'role', keyPath: 'role', unique: false }
          ]
        },
        { 
          name: 'contentPersons', 
          keyPath: 'id',
          indices: [
            { name: 'contentId', keyPath: 'contentId', unique: false },
            { name: 'personId', keyPath: 'personId', unique: false },
            { name: 'role', keyPath: 'role', unique: false }
          ]
        }
      ]);
      
      console.log('[ContentDataService] Base de données initialisée avec succès');
    } catch (error) {
      console.error('[ContentDataService] Erreur lors de l\'initialisation de la base de données:', error);
    }
  }
  
  /**
   * Démarre le scraping périodique
   */
  startPeriodicScraping() {
    // Rafraîchir les contenus populaires toutes les 6 heures
    setInterval(() => this.refreshPopularContent(), 6 * 60 * 60 * 1000);
    
    // Rafraîchir les détails des contenus populaires tous les jours
    setInterval(() => this.refreshContentDetails(), 24 * 60 * 60 * 1000);
    
    // Indexer les nouveaux contenus toutes les 12 heures
    setInterval(() => this.indexNewContent(), 12 * 60 * 60 * 1000);
    
    // Démarrer immédiatement le premier scraping
    setTimeout(() => {
      this.refreshPopularContent();
    }, 5000); // Attendre 5 secondes après l'initialisation
  }
  
  /**
   * Rafraîchit les contenus populaires depuis le service de scraping
   * @returns {Promise<Array>} Contenus populaires rafraîchis
   */
  async refreshPopularContent() {
    console.log('[ContentDataService] Rafraîchissement des contenus populaires...');
    
    try {
      // Récupérer les données depuis le service approprié
      let popularDramas = [];
      let popularMovies = [];
      let popularAnimes = [];
      
      if (this.useApiService && this.apiService) {
        // Utiliser le service API
        popularDramas = await this.apiService.getContentByType('series', 'popular', 20, true);
        popularMovies = await this.apiService.getContentByType('movie', 'popular', 20, true);
        popularAnimes = await this.apiService.getContentByType('anime', 'popular', 20, true);
      } else if (this.scrapingService) {
        // Utiliser le service de scraping
        popularDramas = this.scrapingService.getPopularDramas ? 
          await this.scrapingService.getPopularDramas(1) : [];
        popularMovies = this.scrapingService.getPopularMovies ? 
          await this.scrapingService.getPopularMovies(1) : [];
        popularAnimes = this.scrapingService.getPopularAnimes ? 
          await this.scrapingService.getPopularAnimes(1) : [];
      } else {
        console.warn('[ContentDataService] Aucun service de données disponible pour le rafraîchissement des contenus populaires');
        return this.popularContent || [];
      }
      
      // Normaliser les données
      const normalizedDramas = popularDramas.map(item => this.normalizeContentItem(item, 'drama'));
      const normalizedMovies = popularMovies.map(item => this.normalizeContentItem(item, 'movie'));
      const normalizedAnimes = popularAnimes.map(item => this.normalizeContentItem(item, 'anime'));
      
      // Fusionner et filtrer les résultats
      const allItems = [
        ...normalizedDramas,
        ...normalizedMovies,
        ...normalizedAnimes
      ];
      
      // Filtrer les éléments invalides (sans ID ou titre)
      const validItems = allItems.filter(item => item && item.id && item.title);
      
      // Mettre à jour le cache
      this.popularContent = validItems;
      
      // Mettre à jour le cache par type
      const dramaItems = validItems.filter(item => item.type === 'drama' || item.type === 'series');
      const movieItems = validItems.filter(item => item.type === 'movie');
      const animeItems = validItems.filter(item => item.type === 'anime');
      
      // Mettre à jour le cache
      if (this.cache && typeof this.cache.set === 'function') {
        this.cache.set('popular_all', validItems, 'popular');
        this.cache.set('popular_drama', dramaItems, 'popular');
        this.cache.set('popular_movie', movieItems, 'popular');
        this.cache.set('popular_anime', animeItems, 'popular');
      }
      
      // Mettre à jour la base de données si disponible
      if (this.dbService && typeof this.dbService.bulkPut === 'function') {
        try {
          await this.dbService.bulkPut('contents', validItems);
        } catch (dbError) {
          console.error('[ContentDataService] Erreur lors de la mise à jour de la base de données:', dbError);
          // Continuer malgré l'erreur de base de données
        }
      }
      
      // Émettre un événement de mise à jour
      if (isBrowser && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('flodrama:popular-content-updated', { 
          detail: { 
            count: validItems.length,
            timestamp: Date.now()
          }
        }));
      }
      
      // Mettre à jour la date de dernière mise à jour
      this.lastPopularUpdate = Date.now();
      
      console.log('[ContentDataService] Rafraîchissement des contenus populaires terminé');
      
      // Retourner les éléments pour utilisation immédiate
      return validItems;
    } catch (error) {
      console.error('[ContentDataService] Erreur lors du rafraîchissement des contenus populaires:', error);
      
      // En cas d'erreur, retourner les données en cache si disponibles
      if (this.popularContent && this.popularContent.length > 0) {
        return this.popularContent;
      }
      
      // Sinon, retourner un tableau vide
      return [];
    }
  }
  
  /**
   * Normalise les données de contenu pour la base de données
   * @param {Array} items - Éléments à normaliser
   * @param {String} type - Type de contenu (series, movie, anime)
   * @returns {Array} Éléments normalisés
   */
  normalizeContentData(items, type) {
    return items.map(item => {
      // Générer un ID unique si non présent
      const id = item.id || `${type}-${generateId(item.title)}`;
      
      // Extraire les informations de source
      const source = {
        id: `${id}-${item.source.toLowerCase()}`,
        contentId: id,
        source: item.source,
        sourceUrl: item.link || '',
        streamingUrls: item.streamingUrls || [],
        quality: item.quality || [],
        subtitles: item.subtitles || [],
        lastChecked: new Date(),
        isValid: true,
        priority: getSourcePriority(item.source)
      };
      
      // Créer l'objet de contenu normalisé
      const content = {
        id,
        title: item.title,
        alternativeTitles: item.alternativeTitles || [],
        type,
        image: item.image,
        thumbnail: generateThumbnailUrl(item.image),
        description: item.description || '',
        year: item.year || new Date().getFullYear(),
        country: item.country || detectCountry(item),
        status: item.status || 'unknown',
        episodes: item.episodes || 0,
        duration: item.duration || 0,
        rating: item.rating || 0,
        genres: item.genres || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        popularity: item.popularity || 0,
        watchCount: 0,
        favoriteCount: 0
      };
      
      return { content, source };
    });
  }
  
  /**
   * Insère ou met à jour plusieurs contenus dans la base de données
   * @param {Array} normalizedData - Données normalisées
   */
  async bulkUpsertContent(normalizedData) {
    try {
      const contents = normalizedData.map(item => item.content);
      const sources = normalizedData.map(item => item.source);
      
      // Insérer ou mettre à jour les contenus
      await this.dbService.bulkPut('contents', contents);
      
      // Insérer ou mettre à jour les sources
      await this.dbService.bulkPut('sources', sources);
      
      return { contents: contents.length, sources: sources.length };
    } catch (error) {
      console.error('[ContentDataService] Erreur lors de l\'insertion des contenus:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les contenus populaires depuis le cache ou la base de données
   * @param {String} type - Type de contenu (drama, anime, movie, kshow, all)
   * @param {Number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Contenus populaires
   */
  async getPopularContent(type = 'all', limit = 20) {
    const cacheKey = `popular_${type}`;
    
    // Vérifier le cache
    if (this.cache && typeof this.cache.get === 'function') {
      const cachedData = this.cache.get(cacheKey, 'popular');
      if (cachedData) {
        return cachedData.slice(0, limit);
      }
    }
    
    try {
      let contents;
      
      // Récupérer depuis la base de données
      if (this.dbService && typeof this.dbService.getAll === 'function') {
        if (type === 'all') {
          contents = await this.dbService.getAll('contents', null, { 
            index: 'updatedAt', 
            direction: 'desc',
            limit: limit * 2 // Récupérer plus d'éléments pour avoir une marge
          });
        } else {
          contents = await this.dbService.getAll('contents', type, { 
            index: 'type', 
            direction: 'desc',
            limit: limit * 2
          });
        }
        
        // Trier par popularité
        contents.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        
        // Limiter les résultats
        const limitedContents = contents.slice(0, limit);
        
        // Mettre en cache
        if (this.cache && typeof this.cache.set === 'function') {
          this.cache.set(cacheKey, limitedContents, 'popular');
        }
        
        return limitedContents;
      }
      
      // Si pas de base de données, essayer le scraping direct
      try {
        let scrapedData = [];
        
        if (this.useApiService && this.apiService) {
          scrapedData = await this.apiService.getContentByType(type === 'all' ? 'mixed' : type, 'popular', limit);
        } else if (this.scrapingService) {
          if (type === 'all') {
            const dramas = await this.scrapingService.getPopularDramas(1);
            const animes = await this.scrapingService.getPopularAnimes(1);
            const movies = await this.scrapingService.getPopularMovies(1);
            
            scrapedData = [...dramas, ...animes, ...movies].slice(0, limit);
          } else if (type === 'drama' || type === 'series') {
            scrapedData = await this.scrapingService.getPopularDramas(1);
          } else if (type === 'anime') {
            scrapedData = await this.scrapingService.getPopularAnimes(1);
          } else if (type === 'movie') {
            scrapedData = await this.scrapingService.getPopularMovies(1);
          } else if (type === 'kshow') {
            scrapedData = await this.scrapingService.getPopularKshows(1);
          }
        } else {
          // Aucun service disponible, retourner les données en cache ou un tableau vide
          return this.popularContent || [];
        }
        
        // Vérifier si les données sont au nouveau format avec MAX_LENGTH
        const processedData = Array.isArray(scrapedData) 
          ? scrapedData 
          : (scrapedData && scrapedData.data ? scrapedData.data : []);
        
        // Normaliser et mettre en cache les résultats
        const normalizedData = processedData.map(item => this.normalizeContentItem(item, type));
        
        if (this.cache && typeof this.cache.set === 'function') {
          this.cache.set(cacheKey, normalizedData.slice(0, limit), 'popular');
        }
        
        return normalizedData.slice(0, limit);
      } catch (scrapingError) {
        console.error(`[ContentDataService] Erreur lors du scraping des contenus populaires (${type}):`, scrapingError);
        
        // En cas d'erreur de scraping, retourner les données en cache ou un tableau vide
        if (this.popularContent && this.popularContent.length > 0) {
          const filteredContent = type === 'all' 
            ? this.popularContent 
            : this.popularContent.filter(item => item.type === type);
          
          return filteredContent.slice(0, limit);
        }
        
        return [];
      }
    } catch (error) {
      console.error(`[ContentDataService] Erreur lors de la récupération des contenus populaires (${type}):`, error);
      
      // En cas d'erreur, retourner les données en cache ou un tableau vide
      if (this.popularContent && this.popularContent.length > 0) {
        const filteredContent = type === 'all' 
          ? this.popularContent 
          : this.popularContent.filter(item => item.type === type);
        
        return filteredContent.slice(0, limit);
      }
      
      return [];
    }
  }
  
  /**
   * Rafraîchit les détails des contenus populaires
   */
  async refreshContentDetails() {
    try {
      console.log('[ContentDataService] Rafraîchissement des détails des contenus populaires...');
      
      // Récupérer les contenus populaires
      const popularContents = await this.getPopularContent('all', 50);
      
      // Traiter par lots de 5 pour éviter de surcharger les sources
      const batches = [];
      for (let i = 0; i < popularContents.length; i += 5) {
        batches.push(popularContents.slice(i, i + 5));
      }
      
      let updatedCount = 0;
      
      // Traiter chaque lot séquentiellement
      for (const batch of batches) {
        const detailPromises = batch.map(content => 
          this.useApiService ? 
            this.apiService.getContentDetails(content.id) 
            : this.scrapingService.searchUntilFound(content.title, content.type)
              .then(details => {
                if (details) {
                  // Mettre à jour les détails
                  const normalized = this.normalizeContentData([{
                    ...details,
                    id: content.id,
                    type: content.type
                  }]);
                  
                  return this.bulkUpsertContent(normalized);
                }
                return null;
              })
              .catch(error => {
                console.warn(`[ContentDataService] Erreur lors de la récupération des détails pour ${content.title}:`, error);
                return null;
              })
        );
        
        const results = await Promise.all(detailPromises);
        updatedCount += results.filter(Boolean).length;
        
        // Attendre 2 secondes entre chaque lot
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`[ContentDataService] ${updatedCount} contenus mis à jour avec des détails complets`);
      
      // Émettre un événement
      if (isBrowser && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('flodrama:content-details-updated', { 
          detail: { 
            count: updatedCount,
            timestamp: Date.now()
          }
        }));
      }
      
      return updatedCount;
    } catch (error) {
      console.error('[ContentDataService] Erreur lors du rafraîchissement des détails:', error);
      throw error;
    }
  }
  
  /**
   * Indexe les nouveaux contenus
   */
  async indexNewContent() {
    try {
      console.log('[ContentDataService] Indexation des nouveaux contenus...');
      
      // Récupérer les nouveaux contenus depuis différentes sources
      let newDramas = [];
      let newAnimes = [];
      
      if (this.useApiService) {
        newDramas = await this.apiService.getContentByType('series', 'new', 20, true);
        newAnimes = await this.apiService.getContentByType('anime', 'new', 20, true);
      } else {
        newDramas = this.scrapingService.getPopularDramas ? 
          await this.scrapingService.getPopularDramas(1) : [];
        newAnimes = this.scrapingService.getPopularAnimes ? 
          await this.scrapingService.getPopularAnimes(1) : [];
      }
      
      // Normaliser les données
      const normalizedData = this.normalizeContentData([
        ...newDramas.map(item => ({ ...item, type: 'series' })),
        ...newAnimes.map(item => ({ ...item, type: 'anime' }))
      ]);
      
      // Catégoriser les contenus
      const categorizedData = this.categorizer.categorize(normalizedData);
      
      // Mettre à jour la base de données
      await this.bulkUpsertContent(categorizedData);
      
      console.log(`[ContentDataService] ${categorizedData.length} nouveaux contenus indexés`);
      
      return categorizedData.length;
    } catch (error) {
      console.error('[ContentDataService] Erreur lors de l\'indexation des nouveaux contenus:', error);
      throw error;
    }
  }
  
  /**
   * Recherche des contenus
   * @param {String} query - Terme de recherche
   * @param {String} type - Type de contenu (drama, anime, movie, kshow, all)
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} Résultats de recherche
   */
  async searchContent(query, type = 'all', options = {}) {
    const cacheKey = `search_${query}_${type}_${JSON.stringify(options)}`;
    
    // Vérifier le cache
    const cachedData = this.cache.get(cacheKey, 'search');
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Essayer d'abord la recherche rapide dans l'index
      let results;
      
      if (this.useApiService) {
        // Utiliser le service API
        results = await this.apiService.searchContent(query, type, options);
      } else {
        // Utiliser le service de scraping local
        results = this.scrapingService.searchFast(query, type, options);
      }
      
      // Normaliser et mettre en cache les résultats
      const normalizedData = this.normalizeContentData(results);
      
      // Mettre à jour la base de données en arrière-plan
      this.bulkUpsertContent(normalizedData).catch(error => {
        console.warn('[ContentDataService] Erreur lors de la mise à jour des résultats de recherche:', error);
      });
      
      // Mettre en cache
      this.cache.set(cacheKey, results, 'search');
      
      return results;
    } catch (error) {
      console.error(`[ContentDataService] Erreur lors de la recherche (${query}, ${type}):`, error);
      
      // En cas d'erreur, faire une recherche directe
      if (type === 'all') {
        if (this.useApiService) {
          return this.apiService.searchAll(query);
        } else {
          return this.scrapingService.searchAll(query);
        }
      } else if (type === 'drama') {
        if (this.useApiService) {
          return this.apiService.searchDramas(query);
        } else {
          return this.scrapingService.searchDramas(query);
        }
      } else if (type === 'anime') {
        if (this.useApiService) {
          return this.apiService.searchAnime(query);
        } else {
          return this.scrapingService.searchAnime(query);
        }
      }
      
      return [];
    }
  }
  
  /**
   * Récupère les détails d'un contenu
   * @param {String} id - ID du contenu
   * @returns {Promise<Object>} Détails du contenu
   */
  async getContentDetails(id) {
    const cacheKey = `details_${id}`;
    
    // Vérifier le cache
    const cachedData = this.cache.get(cacheKey, 'details');
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Récupérer le contenu depuis la base de données
      const content = await this.dbService.get('contents', id);
      
      if (!content) {
        throw new Error(`Contenu non trouvé: ${id}`);
      }
      
      // Récupérer les sources associées
      const sources = await this.dbService.getAllFromIndex('sources', 'contentId', id);
      
      // Récupérer les personnes associées
      const contentPersons = await this.dbService.getAllFromIndex('contentPersons', 'contentId', id);
      const personIds = contentPersons.map(cp => cp.personId);
      const persons = await Promise.all(personIds.map(personId => this.dbService.get('persons', personId)));
      
      // Combiner les données
      const details = {
        ...content,
        sources,
        persons: persons.map(person => {
          const contentPerson = contentPersons.find(cp => cp.personId === person.id);
          return {
            ...person,
            role: contentPerson ? contentPerson.role : person.role,
            importance: contentPerson ? contentPerson.importance : 0
          };
        })
      };
      
      // Mettre en cache
      this.cache.set(cacheKey, details, 'details');
      
      return details;
    } catch (error) {
      console.error(`[ContentDataService] Erreur lors de la récupération des détails (${id}):`, error);
      
      // En cas d'erreur, essayer de récupérer depuis le service approprié
      if (this.useApiService) {
        return this.apiService.getContentDetails(id);
      } else {
        if (id.includes('-')) {
          const [sourceName, sourceId] = id.split('-');
          const title = sourceId.replace(/-/g, ' ');
          
          console.log(`[ContentDataService] Recherche de contenu depuis la source ${sourceName} avec le titre: ${title}`);
          return this.scrapingService.searchUntilFound(title, sourceName);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Récupère des suggestions pour l'autocomplétion
   * @param {String} prefix - Préfixe pour l'autocomplétion
   * @param {Number} size - Nombre de suggestions
   * @returns {Promise<Array>} Suggestions
   */
  async getSuggestions(prefix, size = 10) {
    const cacheKey = `suggestions_${prefix}_${size}`;
    
    // Vérifier le cache
    const cachedData = this.cache.get(cacheKey, 'suggestions');
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Utiliser le service approprié pour les suggestions
      let suggestions;
      
      if (this.useApiService) {
        suggestions = await this.apiService.getSuggestions(prefix, size);
      } else {
        suggestions = this.scrapingService.getSuggestions(prefix, size);
      }
      
      // Mettre en cache
      this.cache.set(cacheKey, suggestions, 'suggestions');
      
      return suggestions;
    } catch (error) {
      console.error(`[ContentDataService] Erreur lors de la récupération des suggestions (${prefix}):`, error);
      
      // Fallback: rechercher dans la base de données
      try {
        const contents = await this.dbService.getAll('contents');
        
        // Filtrer les contenus qui commencent par le préfixe
        const filtered = contents.filter(content => 
          content.title.toLowerCase().startsWith(prefix.toLowerCase()) ||
          content.alternativeTitles.some(title => title.toLowerCase().startsWith(prefix.toLowerCase()))
        );
        
        // Limiter et formater les résultats
        return filtered.slice(0, size).map(content => ({
          id: content.id,
          title: content.title,
          type: content.type
        }));
      } catch (dbError) {
        console.error(`[ContentDataService] Erreur lors de la recherche de suggestions dans la base de données:`, dbError);
        return [];
      }
    }
  }
  
  /**
   * Récupère les métadonnées d'un contenu depuis les sources externes
   * @param {Object} content - Contenu de base
   * @returns {Promise<Object>} Métadonnées enrichies
   */
  async fetchMetadataFromExternalSources(content) {
    try {
      // Déterminer la source à utiliser en fonction du type de contenu
      const contentType = content.type || 'drama';
      
      // Utiliser la source appropriée pour le type de contenu
      const sourceInfo = this._getExternalSourceForContentType(contentType);
      
      if (!sourceInfo) {
        console.warn(`[ContentDataService] Aucune source externe trouvée pour le type: ${contentType}`);
        return content;
      }
      
      // Construire l'URL de recherche
      const searchUrl = `${sourceInfo.baseUrl}/search?q=${encodeURIComponent(content.title)}`;
      
      // Effectuer la recherche
      const searchResults = await fetch(searchUrl);
      const searchData = await searchResults.json();
      
      if (!searchData || !searchData.results || searchData.results.length === 0) {
        console.warn(`[ContentDataService] Aucun résultat trouvé pour: ${content.title}`);
        return content;
      }
      
      // Trouver la meilleure correspondance
      const bestMatch = this._findBestMatch(searchData.results, content.title);
      
      if (!bestMatch) {
        console.warn(`[ContentDataService] Pas de correspondance trouvée pour: ${content.title}`);
        return content;
      }
      
      // Récupérer les détails complets
      const detailsUrl = `${sourceInfo.baseUrl}/${sourceInfo.detailsEndpoint}/${bestMatch.id}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (!detailsData) {
        console.warn(`[ContentDataService] Impossible de récupérer les détails pour: ${content.title}`);
        return content;
      }
      
      // Enrichir le contenu avec les métadonnées externes
      return {
        ...content,
        externalId: bestMatch.id,
        externalSource: sourceInfo.name,
        rating: detailsData.rating || content.rating,
        genres: detailsData.genres || content.genres,
        releaseDate: detailsData.releaseDate || content.releaseDate,
        description: detailsData.overview || content.description,
        cast: detailsData.cast || content.cast,
        director: detailsData.director || content.director,
        duration: detailsData.runtime || content.duration,
        country: detailsData.country || content.country,
        language: detailsData.language || content.language,
        poster: detailsData.poster_path ? `${sourceInfo.imageBaseUrl}${detailsData.poster_path}` : content.poster,
        backdrop: detailsData.backdrop_path ? `${sourceInfo.imageBaseUrl}${detailsData.backdrop_path}` : content.backdrop,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('[ContentDataService] Erreur lors de la récupération des métadonnées externes:', error);
      return content;
    }
  }
  
  /**
   * Stocke les données d'un contenu dans la base de données
   * @param {Object} content - Données du contenu
   * @returns {Promise<Object>} Contenu stocké
   */
  async storeContentData(content) {
    try {
      if (!content || !content.id) {
        console.warn('[ContentDataService] Tentative de stockage d\'un contenu sans ID');
        return null;
      }
      
      // Vérifier si le contenu existe déjà
      const existingContent = await this.dbService.getItem('contents', content.id);
      
      // Normaliser les données
      const normalizedContent = this.normalizeContentItem(content);
      
      if (existingContent) {
        // Fusionner les données existantes avec les nouvelles
        const mergedContent = {
          ...existingContent,
          ...normalizedContent,
          lastUpdated: Date.now()
        };
        
        // Mettre à jour dans la base de données
        await this.dbService.updateItem('contents', mergedContent);
        
        // Mettre à jour le cache
        this.cache.set(content.id, mergedContent, 'details');
        
        console.log(`[ContentDataService] Contenu mis à jour: ${content.id}`);
        return mergedContent;
      } else {
        // Ajouter à la base de données
        await this.dbService.addItem('contents', normalizedContent);
        
        // Mettre à jour le cache
        this.cache.set(content.id, normalizedContent, 'details');
        
        console.log(`[ContentDataService] Nouveau contenu ajouté: ${content.id}`);
        return normalizedContent;
      }
    } catch (error) {
      console.error('[ContentDataService] Erreur lors du stockage du contenu:', error);
      return content; // Retourner le contenu original en cas d'erreur
    }
  }
  
  /**
   * Normalise un élément de contenu pour le stockage
   * @param {Object} item - Élément de contenu à normaliser
   * @param {String} sourceName - Nom de la source
   * @returns {Object} Élément normalisé
   */
  normalizeContentItem(item, sourceName = null) {
    if (!item) return null;
    
    // Générer un ID unique si nécessaire
    const id = item.id || `${item.source.toLowerCase()}-${generateId(item.title)}`;
    
    // Normaliser les URLs des images
    const imageUrl = item.image || '';
    const thumbnailUrl = generateThumbnailUrl(imageUrl);
    
    // Détecter le pays d'origine si non spécifié
    const country = item.country || detectCountry(item);
    
    // Déterminer la priorité de la source
    const sourcePriority = sourceName ? getSourcePriority(sourceName) : 999;
    
    // Créer l'objet normalisé
    const normalizedItem = {
      id,
      title: item.title,
      description: item.description || '',
      type: item.type,
      image: imageUrl,
      thumbnail: thumbnailUrl,
      url: item.url || '',
      country,
      genres: Array.isArray(item.genres) ? [...item.genres] : [],
      source: {
        name: sourceName || item.source || 'unknown',
        priority: sourcePriority,
        url: item.sourceUrl || item.url || ''
      },
      meta: item.meta || {},
      lastUpdated: Date.now()
    };
    
    // Catégoriser l'élément
    return this.categorizer.categorizeContent(normalizedItem);
  }
  
  /**
   * Récupère un contenu par son ID
   * @param {String} id - ID du contenu
   * @returns {Promise<Object|null>} Contenu ou null si non trouvé
   */
  async getContentById(id) {
    try {
      // Vérifier d'abord dans le cache
      const cachedContent = this.cache.get(id, 'details');
      if (cachedContent) {
        return cachedContent;
      }
      
      // Récupérer depuis la base de données
      const content = await this.dbService.getItem('contents', id);
      
      if (content) {
        // Mettre en cache
        this.cache.set(id, content, 'details');
        return content;
      }
      
      return null;
    } catch (error) {
      console.error(`[ContentDataService] Erreur lors de la récupération du contenu (${id}):`, error);
      
      // Initialiser des valeurs par défaut en cas d'erreur
      return null;
    }
  }
  
  /**
   * Trouve la meilleure correspondance entre les résultats de recherche et un titre
   * @param {Array} results - Résultats de recherche
   * @param {String} title - Titre à rechercher
   * @returns {Object|null} Meilleure correspondance ou null
   * @private
   */
  _findBestMatch(results, title) {
    if (!results || results.length === 0) {
      return null;
    }
    
    // Normaliser le titre pour la comparaison
    const normalizedTitle = title.toLowerCase().trim();
    
    // D'abord, chercher une correspondance exacte
    const exactMatch = results.find(item => 
      item.title && item.title.toLowerCase().trim() === normalizedTitle
    );
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // Ensuite, chercher une correspondance partielle
    const partialMatches = results.filter(item => 
      item.title && (
        item.title.toLowerCase().includes(normalizedTitle) ||
        normalizedTitle.includes(item.title.toLowerCase())
      )
    );
    
    if (partialMatches.length > 0) {
      // Trier par similarité (du plus similaire au moins similaire)
      partialMatches.sort((a, b) => {
        const similarityA = this._calculateSimilarity(a.title.toLowerCase(), normalizedTitle);
        const similarityB = this._calculateSimilarity(b.title.toLowerCase(), normalizedTitle);
        return similarityB - similarityA;
      });
      
      return partialMatches[0];
    }
    
    // Si aucune correspondance n'est trouvée, retourner le premier résultat
    return results[0];
  }
  
  /**
   * Calcule la similarité entre deux chaînes de caractères
   * @param {String} str1 - Première chaîne
   * @param {String} str2 - Deuxième chaîne
   * @returns {Number} Score de similarité (0-1)
   * @private
   */
  _calculateSimilarity(str1, str2) {
    // Algorithme de distance de Levenshtein simplifié
    const len1 = str1.length;
    const len2 = str2.length;
    
    // Matrice pour stocker les distances
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    // Initialisation
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    // Calcul de la distance
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Suppression
          matrix[i][j - 1] + 1,      // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }
    
    // Calculer la similarité (1 - distance normalisée)
    const maxLen = Math.max(len1, len2);
    return maxLen > 0 ? 1 - matrix[len1][len2] / maxLen : 1;
  }
  
  /**
   * Obtient la source externe appropriée pour un type de contenu
   * @param {String} contentType - Type de contenu (drama, movie, anime, etc.)
   * @returns {Object|null} Configuration de la source externe
   * @private
   */
  _getExternalSourceForContentType(contentType) {
    // Configuration des sources externes
    const externalSources = {
      drama: {
        name: 'MyDramaList',
        baseUrl: 'https://api.mydramalist.com/v1',
        detailsEndpoint: 'dramas',
        imageBaseUrl: 'https://i.mydramalist.com',
        priority: 1
      },
      movie: {
        name: 'TMDB',
        baseUrl: 'https://api.themoviedb.org/3',
        detailsEndpoint: 'movie',
        imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
        priority: 1
      },
      anime: {
        name: 'MyAnimeList',
        baseUrl: 'https://api.myanimelist.net/v2',
        detailsEndpoint: 'anime',
        imageBaseUrl: 'https://cdn.myanimelist.net/images',
        priority: 1
      },
      kshow: {
        name: 'KShowOnline',
        baseUrl: 'https://api.kshowonline.com/v1',
        detailsEndpoint: 'shows',
        imageBaseUrl: 'https://i.kshowonline.com',
        priority: 1
      },
      default: {
        name: 'MyDramaList',
        baseUrl: 'https://api.mydramalist.com/v1',
        detailsEndpoint: 'dramas',
        imageBaseUrl: 'https://i.mydramalist.com',
        priority: 1
      }
    };
    
    // Retourner la source appropriée ou la source par défaut
    return externalSources[contentType] || externalSources.default;
  }
  
  /**
   * Précharge les données pour la page d'accueil
   * @returns {Promise<Object>} Données préchargées
   */
  async preloadHomePageData() {
    console.log('Préchargement des données pour la page d\'accueil...');
    try {
      // En production, utiliser l'API Service
      if (process.env.NODE_ENV === 'production') {
        console.log('Mode production détecté, utilisation de l\'API Service');
        const apiService = new ApiService();
        
        // Récupérer les contenus populaires depuis l'API
        const popularContent = await apiService.getPopularContent();
        if (!popularContent || popularContent.length === 0) {
          console.warn('Aucun contenu populaire récupéré depuis l\'API');
          return this._generateMockHomeData();
        }
        
        // Organiser les données pour la page d'accueil
        return {
          trending: popularContent.slice(0, 10),
          newReleases: popularContent.slice(10, 20),
          recommended: popularContent.slice(0, 15).reverse(),
          popular: popularContent
        };
      }
      
      // En développement, utiliser les données mockées ou la base de données locale
      console.log('Mode développement détecté, utilisation des données mockées');
      return this._generateMockHomeData();
    } catch (error) {
      console.error('Erreur lors du préchargement des données:', error);
      
      // En cas d'erreur, utiliser des données mockées
      return this._generateMockHomeData();
    }
  }
  
  /**
   * Génère des données mockées pour la page d'accueil
   * @private
   * @returns {Object} Données mockées
   */
  _generateMockHomeData() {
    console.log('Génération de données mockées pour la page d\'accueil');
    // Créer quelques contenus de test
    const mockContents = Array.from({ length: 20 }, (_, i) => ({
      id: `mock-${i}`,
      title: `Contenu de test ${i + 1}`,
      type: i % 3 === 0 ? 'movie' : i % 3 === 1 ? 'drama' : 'anime',
      poster: `https://via.placeholder.com/300x450?text=Contenu+${i + 1}`,
      backdrop: `https://via.placeholder.com/1280x720?text=Backdrop+${i + 1}`,
      rating: (Math.random() * 5).toFixed(1),
      year: 2023 - (i % 5),
      description: `Ceci est une description de test pour le contenu ${i + 1}.`
    }));
    
    return {
      trending: mockContents.slice(0, 10),
      newReleases: mockContents.slice(10, 20),
      recommended: mockContents.slice(0, 15).reverse(),
      popular: mockContents
    };
  }
  
  /**
   * Initialise le service
   */
  async init() {
    console.log('[ContentDataService] Initialisation...');
    
    try {
      // Vérifier si nous sommes en mode navigateur en production
      if (isBrowser && isProduction) {
        console.log('[ContentDataService] Mode navigateur en production détecté, initialisation minimale');
        
        // S'assurer que l'API Service est correctement initialisé
        if (!this.apiService) {
          console.log('[ContentDataService] Initialisation du service API externe');
          this.apiService = new ApiService();
        }
        
        // Initialiser le cache comme une Map simple si ce n'est pas déjà fait
        if (!this.cache || typeof this.cache.get !== 'function') {
          this.cache = new Map();
        }
        
        console.log('[ContentDataService] Initialisation terminée avec succès (mode production)');
        return;
      }
      
      // Initialisation normale en développement ou côté serveur
      if (this.dbService && typeof this.dbService.init === 'function') {
        await this.dbService.init();
        console.log('[ContentDataService] Base de données initialisée');
      } else {
        console.log('[ContentDataService] Pas de service de base de données disponible');
        // Créer un service de base de données minimal si nécessaire
        if (!this.dbService) {
          this.dbService = {
            getContent: () => null,
            saveContent: () => null,
            init: () => Promise.resolve()
          };
        }
      }
      
      // Initialiser le cache si nécessaire
      if (!this.cache || typeof this.cache.get !== 'function') {
        this.cache = new Map();
      }
      
      console.log('[ContentDataService] Initialisation terminée avec succès');
    } catch (error) {
      console.error('[ContentDataService] Erreur lors de l\'initialisation:', error);
      
      // Initialiser des valeurs par défaut en cas d'erreur
      if (!this.cache || typeof this.cache.get !== 'function') {
        this.cache = new Map();
      }
      
      // Créer un service de base de données minimal en cas d'erreur
      if (!this.dbService) {
        this.dbService = {
          getContent: () => null,
          saveContent: () => null,
          init: () => Promise.resolve()
        };
      }
    }
  }
}

// Créer une instance unique du service
const contentDataService = new ContentDataService();

// Démarrer le scraping périodique
if (typeof window !== 'undefined') {
  setTimeout(() => {
    contentDataService.startPeriodicScraping();
  }, 10000); // Démarrer après 10 secondes pour laisser le temps à l'application de se charger
}

// Exporter le service
export default contentDataService;
