/**
 * FloDrama - Adaptateur pour SmartScrapingService
 * Ce script intègre le service de scraping intelligent existant dans l'application
 * 
 * @version 1.0.0
 */

// Configuration
const CONFIG = {
  // Activer le mode débogage
  DEBUG: true,
  
  // Nombre minimum d'éléments par catégorie
  MIN_ITEMS_PER_CATEGORY: 200,
  
  // Catégories à scraper
  CATEGORIES: ['drama', 'movie', 'anime', 'tvshow', 'bollywood'],
  
  // Sources de scraping
  SOURCES: [
    'dramacool',
    'myasiantv',
    'dramanice',
    'kissasian',
    'viki',
    'wetv',
    'iqiyi',
    'kocowa',
    'viu',
    'netflix',
    'amazon',
    'hulu'
  ],
  
  // URL de l'API de scraping
  API_URL: 'https://api.flodrama.com/scraping',
  
  // Chemin du fichier de contenu
  CONTENT_FILE_PATH: '/data/content.json'
};

// Système de logs
const logger = {
  info: function(message) {
    console.info(`[FloDrama SmartScrapingService] ${message}`);
  },
  
  warn: function(message) {
    console.warn(`[FloDrama SmartScrapingService] ${message}`);
  },
  
  error: function(message, error) {
    console.error(`[FloDrama SmartScrapingService] ${message}`, error);
  },
  
  debug: function(message) {
    if (CONFIG.DEBUG) {
      console.debug(`[FloDrama SmartScrapingService] ${message}`);
    }
  },
  
  group: function(title) {
    console.group(`[FloDrama SmartScrapingService] ${title}`);
  },
  
  groupEnd: function() {
    console.groupEnd();
  },
  
  table: function(data) {
    console.table(data);
  }
};

/**
 * Adaptateur pour le service de scraping intelligent
 */
class SmartScrapingServiceAdapter {
  constructor() {
    // Événements
    if (typeof window !== 'undefined') {
      this.events = document.createDocumentFragment();
      this.events.__proto__ = EventTarget.prototype;
    }
    
    // Cache de contenu
    this.contentCache = null;
    
    // État du service
    this.isInitialized = false;
    this.isUpdating = false;
    
    // Statistiques
    this.stats = {
      totalItems: 0,
      itemsByCategory: {},
      itemsBySource: {},
      lastUpdate: null
    };
    
    logger.info("SmartScrapingServiceAdapter initialisé");
  }
  
  /**
   * Initialise le service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn("Le service est déjà initialisé");
      return;
    }
    
    logger.info("Initialisation du service de scraping intelligent...");
    
    try {
      // Charger le cache de contenu
      await this.loadContentCache();
      
      // Initialiser les statistiques
      this.updateStats();
      
      this.isInitialized = true;
      logger.info("Service initialisé avec succès");
      
      // Déclencher l'événement d'initialisation
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('initialized', { detail: this.stats });
        this.events.dispatchEvent(event);
      }
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du service", error);
      throw error;
    }
  }
  
  /**
   * Charge le cache de contenu
   * @returns {Promise<void>}
   */
  async loadContentCache() {
    logger.debug("Chargement du cache de contenu...");
    
    try {
      // Charger le fichier de contenu
      const response = await fetch(CONFIG.CONTENT_FILE_PATH);
      if (!response.ok) {
        throw new Error(`Impossible de charger le fichier de contenu: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Vérifier la structure des données
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Structure de données invalide");
      }
      
      this.contentCache = data;
      logger.info(`Cache de contenu chargé avec ${data.items.length} éléments`);
    } catch (error) {
      logger.error("Erreur lors du chargement du cache de contenu", error);
      
      // Créer un cache vide
      this.contentCache = {
        lastUpdate: new Date().toISOString(),
        contentIds: [],
        items: []
      };
      
      throw error;
    }
  }
  
  /**
   * Met à jour les statistiques
   */
  updateStats() {
    if (!this.contentCache) {
      return;
    }
    
    const items = this.contentCache.items;
    
    // Réinitialiser les statistiques
    this.stats = {
      totalItems: items.length,
      itemsByCategory: {},
      itemsBySource: {},
      lastUpdate: this.contentCache.lastUpdate
    };
    
    // Compter les éléments par catégorie
    items.forEach(item => {
      const category = item.type || 'unknown';
      const source = item.source || 'unknown';
      
      if (!this.stats.itemsByCategory[category]) {
        this.stats.itemsByCategory[category] = 0;
      }
      
      if (!this.stats.itemsBySource[source]) {
        this.stats.itemsBySource[source] = 0;
      }
      
      this.stats.itemsByCategory[category]++;
      this.stats.itemsBySource[source]++;
    });
    
    logger.debug("Statistiques mises à jour");
    logger.table(this.stats);
  }
  
  /**
   * Obtient les éléments d'une catégorie
   * @param {string} category - Catégorie
   * @param {Object} options - Options de filtrage
   * @returns {Array} - Éléments de la catégorie
   */
  getCategoryItems(category, options = {}) {
    if (!this.contentCache) {
      return [];
    }
    
    const {
      limit = 20,
      offset = 0,
      sort = 'recent',
      filter = {}
    } = options;
    
    // Filtrer les éléments par catégorie
    let items = this.contentCache.items.filter(item => {
      // Vérifier la catégorie
      if (category !== 'all' && item.type !== category) {
        return false;
      }
      
      // Appliquer les filtres supplémentaires
      for (const [key, value] of Object.entries(filter)) {
        if (Array.isArray(item[key])) {
          // Si la propriété est un tableau, vérifier si elle contient la valeur
          if (!item[key].includes(value)) {
            return false;
          }
        } else if (item[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
    
    // Trier les éléments
    if (sort === 'recent') {
      items.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
        return dateB - dateA;
      });
    } else if (sort === 'popular') {
      items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sort === 'rating') {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    // Appliquer la pagination
    return items.slice(offset, offset + limit);
  }
  
  /**
   * Recherche des contenus
   * @param {string} query - Requête de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  async searchContent(query, options = {}) {
    logger.info(`Recherche de contenu pour "${query}"...`);
    
    if (!this.contentCache) {
      await this.loadContentCache();
    }
    
    const {
      limit = 20,
      category = 'all',
      fuzzy = true
    } = options;
    
    // Normaliser la requête
    const normalizedQuery = query.toLowerCase().trim();
    
    // Filtrer les éléments par catégorie
    let items = this.contentCache.items;
    if (category !== 'all') {
      items = items.filter(item => item.type === category);
    }
    
    // Rechercher dans les éléments
    const results = items.filter(item => {
      const title = (item.title || '').toLowerCase();
      const originalTitle = (item.originalTitle || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      
      if (fuzzy) {
        // Recherche floue
        return title.includes(normalizedQuery) || 
               originalTitle.includes(normalizedQuery) || 
               description.includes(normalizedQuery);
      } else {
        // Recherche exacte
        return title === normalizedQuery || 
               originalTitle === normalizedQuery;
      }
    }).slice(0, limit);
    
    logger.info(`${results.length} résultats trouvés pour "${query}"`);
    
    // Si aucun résultat n'est trouvé et que nous avons accès au vrai SmartScrapingService
    if (results.length === 0 && typeof window !== 'undefined' && typeof window.SmartScrapingServiceOriginal !== 'undefined') {
      logger.info(`Aucun résultat trouvé localement, recherche en ligne pour "${query}"...`);
      
      try {
        // Rechercher en ligne
        const onlineResults = await window.SmartScrapingServiceOriginal.searchContent(query, options);
        
        // Mettre à jour le cache avec les nouveaux résultats
        if (onlineResults && onlineResults.length > 0) {
          logger.info(`${onlineResults.length} résultats trouvés en ligne pour "${query}"`);
          
          // Ajouter les nouveaux résultats au cache
          this.contentCache.items.push(...onlineResults);
          
          // Mettre à jour les statistiques
          this.updateStats();
          
          return onlineResults;
        }
      } catch (error) {
        logger.error(`Erreur lors de la recherche en ligne pour "${query}"`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Obtient les informations détaillées d'un contenu
   * @param {string} contentId - ID du contenu
   * @returns {Promise<Object>} - Détails du contenu
   */
  async getContentDetails(contentId) {
    logger.info(`Récupération des détails pour le contenu ${contentId}`);
    
    if (!this.contentCache) {
      await this.loadContentCache();
    }
    
    // Rechercher le contenu dans le cache
    const content = this.contentCache.items.find(item => item.id === contentId);
    
    if (content) {
      logger.info(`Détails trouvés pour le contenu ${contentId}`);
      return content;
    }
    
    // Si le contenu n'est pas trouvé et que nous avons accès au vrai SmartScrapingService
    if (typeof window !== 'undefined' && typeof window.SmartScrapingServiceOriginal !== 'undefined') {
      logger.info(`Contenu ${contentId} non trouvé localement, recherche en ligne...`);
      
      try {
        // Récupérer les détails en ligne
        const details = await window.SmartScrapingServiceOriginal.getContentDetails(contentId);
        
        if (details) {
          logger.info(`Détails trouvés en ligne pour le contenu ${contentId}`);
          
          // Ajouter les détails au cache
          this.contentCache.items.push(details);
          
          // Mettre à jour les statistiques
          this.updateStats();
          
          return details;
        }
      } catch (error) {
        logger.error(`Erreur lors de la récupération des détails en ligne pour le contenu ${contentId}`, error);
      }
    }
    
    logger.warn(`Aucun détail trouvé pour le contenu ${contentId}`);
    return null;
  }
}

// Créer une instance du service
const smartScrapingService = new SmartScrapingServiceAdapter();

// Initialiser le service
if (typeof window !== 'undefined') {
  smartScrapingService.initialize().catch(error => {
    logger.error("Erreur lors de l'initialisation du service", error);
  });

  // Exposer le service
  window.SmartScrapingService = smartScrapingService;
  
  // Si le vrai SmartScrapingService est chargé plus tard, le sauvegarder
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (obj === window && prop === 'SmartScrapingService' && descriptor.value !== smartScrapingService) {
      // Sauvegarder le service original
      window.SmartScrapingServiceOriginal = descriptor.value;
      
      // Utiliser notre adaptateur à la place
      descriptor.value = smartScrapingService;
      
      logger.info("SmartScrapingService original détecté et sauvegardé");
    }
    
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
}

export default smartScrapingService;
