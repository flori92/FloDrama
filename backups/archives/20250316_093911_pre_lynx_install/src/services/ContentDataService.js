/**
 * ContentDataService
 * 
 * Service de gestion des données de contenu qui fait le lien entre le scraping et la base de données.
 * Optimise l'alimentation des ressources avec un système de cache intelligent.
 */

import SmartScrapingService from './SmartScrapingService.js';
import { IndexedDBService } from './IndexedDBService.js';
import ContentCategorizer from './ContentCategorizer.js';
import { generateId, generateThumbnailUrl, detectCountry, getSourcePriority } from '../utils/contentUtils.js';

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
    this.scrapingService = SmartScrapingService;
    this.dbService = new IndexedDBService('flodrama-content', 1);
    this.cache = new ContentCache();
    this.categorizer = new ContentCategorizer();
    
    // Initialiser la base de données
    this.initDatabase();
    
    // Démarrer le cache
    this.cache.scheduleRefresh();
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
   * Récupère et stocke les contenus populaires
   */
  async refreshPopularContent() {
    try {
      console.log('[ContentDataService] Rafraîchissement des contenus populaires...');
      
      // Récupérer les données depuis le service de scraping
      const popularDramas = await this.scrapingService.getPopularDramas(2);
      const popularAnimes = await this.scrapingService.getPopularAnimes(2);
      const popularMovies = await this.scrapingService.getPopularMovies(2);
      const popularKshows = await this.scrapingService.getPopularKshows(1);
      
      // Normaliser les données
      const normalizedData = this.normalizeContentData([
        ...popularDramas.map(item => ({ ...item, type: 'drama' })),
        ...popularAnimes.map(item => ({ ...item, type: 'anime' })),
        ...popularMovies.map(item => ({ ...item, type: 'movie' })),
        ...popularKshows.map(item => ({ ...item, type: 'kshow' }))
      ]);
      
      // Catégoriser les contenus
      const categorizedData = this.categorizer.categorize(normalizedData);
      
      // Mettre à jour la base de données
      await this.bulkUpsertContent(categorizedData);
      
      // Mettre à jour le cache
      this.cache.set('popular_all', categorizedData, 'popular');
      this.cache.set('popular_dramas', popularDramas, 'popular');
      this.cache.set('popular_animes', popularAnimes, 'popular');
      this.cache.set('popular_movies', popularMovies, 'popular');
      this.cache.set('popular_kshows', popularKshows, 'popular');
      
      console.log(`[ContentDataService] ${categorizedData.length} contenus populaires mis à jour`);
      
      // Émettre un événement pour informer l'application
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('flodrama:content-updated', { 
          detail: { 
            type: 'popular',
            count: categorizedData.length,
            timestamp: Date.now()
          }
        }));
      }
      
      return categorizedData;
    } catch (error) {
      console.error('[ContentDataService] Erreur lors du rafraîchissement des contenus populaires:', error);
      throw error;
    }
  }
  
  /**
   * Normalise les données de contenu pour la base de données
   * @param {Array} items - Éléments à normaliser
   * @returns {Array} Éléments normalisés
   */
  normalizeContentData(items) {
    return items.map(item => {
      // Générer un ID unique si non présent
      const id = item.id || `${item.source.toLowerCase()}-${generateId(item.title)}`;
      
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
        type: item.type,
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
    const cachedData = this.cache.get(cacheKey, 'popular');
    if (cachedData) {
      return cachedData.slice(0, limit);
    }
    
    try {
      let contents;
      
      // Récupérer depuis la base de données
      if (type === 'all') {
        contents = await this.dbService.getAll('contents', null, { 
          index: 'updatedAt',
          direction: 'prev',
          limit
        });
      } else {
        contents = await this.dbService.getAllFromIndex('contents', 'type', type, {
          limit,
          direction: 'prev'
        });
      }
      
      // Mettre en cache
      this.cache.set(cacheKey, contents, 'popular');
      
      return contents;
    } catch (error) {
      console.error(`[ContentDataService] Erreur lors de la récupération des contenus populaires (${type}):`, error);
      
      // En cas d'erreur, essayer de récupérer depuis le service de scraping
      let scrapedData;
      
      try {
        if (type === 'all') {
          scrapedData = await this.scrapingService.getPopular(1);
        } else if (type === 'drama') {
          scrapedData = await this.scrapingService.getPopularDramas(1);
        } else if (type === 'anime') {
          scrapedData = await this.scrapingService.getPopularAnimes(1);
        } else if (type === 'movie') {
          scrapedData = await this.scrapingService.getPopularMovies(1);
        } else if (type === 'kshow') {
          scrapedData = await this.scrapingService.getPopularKshows(1);
        }
        
        // Vérifier si les données sont au nouveau format avec MAX_LENGTH
        const processedData = Array.isArray(scrapedData) 
          ? scrapedData 
          : (scrapedData && scrapedData.data ? scrapedData.data : []);
        
        return processedData;
      } catch (scrapingError) {
        console.error(`[ContentDataService] Erreur lors du scraping des contenus populaires (${type}):`, scrapingError);
        return [];
      }
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
          this.scrapingService.searchUntilFound(content.title, content.type)
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
      if (typeof window !== 'undefined' && window.dispatchEvent) {
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
      const newDramas = await this.scrapingService.getPopularDramas(1);
      const newAnimes = await this.scrapingService.getPopularAnimes(1);
      
      // Normaliser les données
      const normalizedData = this.normalizeContentData([
        ...newDramas.map(item => ({ ...item, type: 'drama' })),
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
      const results = await this.scrapingService.searchFast(query, type, options);
      
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
        return this.scrapingService.searchAll(query);
      } else if (type === 'drama') {
        return this.scrapingService.searchDramas(query);
      } else if (type === 'anime') {
        return this.scrapingService.searchAnime(query);
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
      
      // En cas d'erreur, essayer de récupérer depuis le service de scraping
      if (id.includes('-')) {
        const [sourceName, sourceId] = id.split('-');
        const title = sourceId.replace(/-/g, ' ');
        
        console.log(`[ContentDataService] Recherche de contenu depuis la source ${sourceName} avec le titre: ${title}`);
        return this.scrapingService.searchUntilFound(title, sourceName);
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
      // Utiliser le service de scraping pour les suggestions
      const suggestions = await this.scrapingService.getSuggestions(prefix, size);
      
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
    const id = item.id || generateId(item.title);
    
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
      title: item.title || 'Sans titre',
      description: item.description || '',
      type: item.type || 'drama',
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
}

// Créer une instance unique du service
const contentDataService = new ContentDataService();

// Démarrer le scraping périodique
contentDataService.startPeriodicScraping();

// Exporter le service
export default contentDataService;
