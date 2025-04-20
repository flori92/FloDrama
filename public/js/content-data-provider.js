/**
 * FloDrama - Fournisseur de données de contenu
 * Ce script centralise l'accès aux données de contenu pour toute l'application
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const CONFIG = {
    DEBUG: true,
    CACHE_ENABLED: true,
    CACHE_KEY: 'flodrama_content_cache',
    CACHE_EXPIRATION: 24 * 60 * 60 * 1000, // 24 heures
    CONTENT_FILE_PATH: '/data/content.json',
    FALLBACK_CONTENT_FILE_PATH: '/data/fallback-content.json'
  };
  
  // Données de contenu par défaut (utilisées si aucune autre source n'est disponible)
  const DEFAULT_CONTENT_DATA = {
    items: [
      {
        id: 'vincenzo-1',
        title: 'Vincenzo',
        type: 'drama',
        category: 'drama',
        year: 2021,
        genres: ['Action', 'Comédie', 'Crime'],
        rating: 9.2,
        popularity: 95
      },
      {
        id: 'parasite-1',
        title: 'Parasite',
        type: 'movie',
        category: 'movie',
        year: 2019,
        genres: ['Thriller', 'Drame', 'Comédie noire'],
        rating: 9.5,
        popularity: 98
      },
      {
        id: 'attackontitan-1',
        title: 'L\'Attaque des Titans',
        type: 'anime',
        category: 'anime',
        year: 2013,
        genres: ['Action', 'Drame', 'Fantastique'],
        rating: 9.3,
        popularity: 97
      },
      {
        id: 'runningman-1',
        title: 'Running Man',
        type: 'kshow',
        category: 'kshow',
        year: 2010,
        genres: ['Variété', 'Comédie', 'Jeu'],
        rating: 8.9,
        popularity: 92
      },
      {
        id: 'rrr-1',
        title: 'RRR',
        type: 'bollywood',
        category: 'bollywood',
        year: 2022,
        genres: ['Action', 'Drame', 'Historique'],
        rating: 9.0,
        popularity: 94
      }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama ContentData] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama ContentData] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama ContentData] ${message}`, error);
    },
    
    debug: function(message) {
      if (CONFIG.DEBUG) console.debug(`[FloDrama ContentData] ${message}`);
    }
  };
  
  /**
   * Charge les données de contenu depuis le cache local
   * @returns {Object|null} - Données de contenu ou null si le cache est vide/expiré
   */
  function loadFromCache() {
    if (!CONFIG.CACHE_ENABLED) return null;
    
    try {
      const cachedData = localStorage.getItem(CONFIG.CACHE_KEY);
      if (!cachedData) return null;
      
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Vérifier si le cache a expiré
      if (Date.now() - timestamp > CONFIG.CACHE_EXPIRATION) {
        logger.debug("Cache expiré");
        return null;
      }
      
      logger.info("Données chargées depuis le cache local");
      return data;
    } catch (error) {
      logger.error("Erreur lors du chargement depuis le cache", error);
      return null;
    }
  }
  
  /**
   * Sauvegarde les données de contenu dans le cache local
   * @param {Object} data - Données de contenu à sauvegarder
   */
  function saveToCache(data) {
    if (!CONFIG.CACHE_ENABLED) return;
    
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
      logger.info("Données sauvegardées dans le cache local");
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde dans le cache", error);
    }
  }
  
  /**
   * Charge les données de contenu depuis le fichier JSON
   * @returns {Promise<Object>} - Promesse résolue avec les données de contenu
   */
  async function loadFromFile() {
    try {
      logger.info("Chargement des données depuis le fichier JSON...");
      
      const response = await fetch(CONFIG.CONTENT_FILE_PATH);
      if (!response.ok) {
        throw new Error(`Impossible de charger le fichier de contenu: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Structure de données invalide");
      }
      
      logger.info(`${data.items.length} éléments chargés depuis le fichier JSON`);
      return data;
    } catch (error) {
      logger.error("Erreur lors du chargement depuis le fichier", error);
      
      // Essayer le fichier de secours
      try {
        const fallbackResponse = await fetch(CONFIG.FALLBACK_CONTENT_FILE_PATH);
        if (!fallbackResponse.ok) {
          throw new Error(`Impossible de charger le fichier de secours: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        logger.warn(`Utilisation du fichier de secours: ${fallbackData.items.length} éléments chargés`);
        return fallbackData;
      } catch (fallbackError) {
        logger.error("Erreur lors du chargement du fichier de secours", fallbackError);
        return DEFAULT_CONTENT_DATA;
      }
    }
  }
  
  /**
   * Charge les données de contenu depuis le service de scraping intelligent
   * @returns {Promise<Object>} - Promesse résolue avec les données de contenu
   */
  async function loadFromScrapingService() {
    try {
      logger.info("Chargement des données depuis le service de scraping...");
      
      // Vérifier si le service est disponible
      if (!window.SmartScrapingService) {
        throw new Error("Service de scraping non disponible");
      }
      
      // Initialiser le service s'il ne l'est pas déjà
      if (!window.SmartScrapingService.isInitialized) {
        await window.SmartScrapingService.initialize();
      }
      
      // Récupérer les données depuis le cache du service
      if (!window.SmartScrapingService.contentCache || 
          !window.SmartScrapingService.contentCache.items) {
        throw new Error("Aucune donnée dans le cache du service");
      }
      
      const items = window.SmartScrapingService.contentCache.items;
      logger.info(`${items.length} éléments chargés depuis le service de scraping`);
      
      return {
        items: items,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error("Erreur lors du chargement depuis le service de scraping", error);
      throw error;
    }
  }
  
  /**
   * Charge les données de contenu depuis toutes les sources disponibles
   * @returns {Promise<Object>} - Promesse résolue avec les données de contenu
   */
  async function loadContentData() {
    // Essayer d'abord le cache local
    const cachedData = loadFromCache();
    if (cachedData) return cachedData;
    
    try {
      // Essayer le service de scraping
      const scrapingData = await loadFromScrapingService();
      saveToCache(scrapingData);
      return scrapingData;
    } catch (scrapingError) {
      logger.warn("Impossible de charger depuis le service de scraping, tentative avec le fichier JSON");
      
      try {
        // Essayer le fichier JSON
        const fileData = await loadFromFile();
        saveToCache(fileData);
        return fileData;
      } catch (fileError) {
        logger.error("Impossible de charger les données de contenu, utilisation des données par défaut");
        return DEFAULT_CONTENT_DATA;
      }
    }
  }
  
  /**
   * Initialise le fournisseur de données de contenu
   */
  async function initContentDataProvider() {
    logger.info("Initialisation du fournisseur de données de contenu...");
    
    try {
      // Charger les données de contenu
      const contentData = await loadContentData();
      
      // Exposer les données globalement
      window.CONTENT_DATA = contentData;
      
      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('contentDataLoaded', { 
        detail: { contentData: contentData } 
      }));
      
      logger.info("Fournisseur de données de contenu initialisé avec succès");
      return contentData;
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du fournisseur de données de contenu", error);
      
      // Utiliser les données par défaut en cas d'erreur
      window.CONTENT_DATA = DEFAULT_CONTENT_DATA;
      
      window.dispatchEvent(new CustomEvent('contentDataLoaded', { 
        detail: { contentData: DEFAULT_CONTENT_DATA, error: error } 
      }));
      
      return DEFAULT_CONTENT_DATA;
    }
  }
  
  // Exposer l'API publique
  window.FloDramaContentDataProvider = {
    init: initContentDataProvider,
    loadContentData: loadContentData,
    getDefaultContentData: function() {
      return DEFAULT_CONTENT_DATA;
    }
  };
  
  // Initialiser automatiquement au chargement de la page
  document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'initialisation automatique est désactivée
    const disableAutoInit = document.body.hasAttribute('data-disable-content-auto-init');
    
    if (!disableAutoInit) {
      initContentDataProvider();
    }
  });
})();
