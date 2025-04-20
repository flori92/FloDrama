/**
 * FloDrama - Adaptateur pour SmartScrapingService
 * Ce script intègre le service de scraping intelligent existant dans l'application
 * 
 * @version 1.0.0
 */

(function() {
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
      this.events = document.createDocumentFragment();
      this.events.__proto__ = EventTarget.prototype;
      
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
        const event = new CustomEvent('initialized', { detail: this.stats });
        this.events.dispatchEvent(event);
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
          throw new Error(`Impossible de charger le fichier de contenu: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.items || !Array.isArray(data.items)) {
          throw new Error("Structure de données invalide: items manquant ou pas un tableau");
        }
        
        this.contentCache = data;
        logger.debug(`Cache de contenu chargé avec ${data.items.length} éléments`);
      } catch (error) {
        logger.error("Erreur lors du chargement du cache de contenu", error);
        
        // Initialiser un cache vide
        this.contentCache = { items: [] };
        logger.debug("Cache de contenu initialisé avec un tableau vide");
      }
    }
    
    /**
     * Met à jour les statistiques
     */
    updateStats() {
      if (!this.contentCache) {
        logger.warn("Impossible de mettre à jour les statistiques: cache de contenu non chargé");
        return;
      }
      
      // Réinitialiser les statistiques
      this.stats.totalItems = this.contentCache.items.length;
      this.stats.itemsByCategory = {};
      this.stats.itemsBySource = {};
      this.stats.lastUpdate = new Date().toISOString();
      
      // Compter les éléments par catégorie et par source
      this.contentCache.items.forEach(item => {
        // Par catégorie
        if (item.category) {
          this.stats.itemsByCategory[item.category] = (this.stats.itemsByCategory[item.category] || 0) + 1;
        }
        
        // Par source
        if (item.source) {
          this.stats.itemsBySource[item.source] = (this.stats.itemsBySource[item.source] || 0) + 1;
        }
      });
      
      logger.debug("Statistiques mises à jour", this.stats);
    }
    
    /**
     * Met à jour la base de données de contenu
     * @returns {Promise<Array>} - Résultats de la mise à jour
     */
    async updateContentDatabase() {
      if (this.isUpdating) {
        logger.warn("Une mise à jour est déjà en cours");
        return Promise.reject(new Error("Une mise à jour est déjà en cours"));
      }
      
      this.isUpdating = true;
      logger.info("Mise à jour de la base de données de contenu...");
      
      // Déclencher l'événement de début de mise à jour
      const startEvent = new CustomEvent('updateStart');
      this.events.dispatchEvent(startEvent);
      
      try {
        // Si nous avons accès au vrai SmartScrapingService dans src/features/scraping/services/SmartScrapingService.js
        if (typeof window.SmartScrapingServiceOriginal !== 'undefined') {
          logger.info("Utilisation du SmartScrapingService original");
          const results = await window.SmartScrapingServiceOriginal.updateContentDatabase();
          
          // Mettre à jour le cache et les statistiques
          await this.loadContentCache();
          this.updateStats();
          
          this.isUpdating = false;
          
          // Déclencher l'événement de fin de mise à jour
          const completeEvent = new CustomEvent('updateComplete', { detail: { count: results.length } });
          this.events.dispatchEvent(completeEvent);
          
          return results;
        }
        
        // Sinon, simuler une mise à jour avec notre propre logique
        logger.info("Simulation de la mise à jour de la base de données");
        
        // Vérifier quelles catégories ont besoin de plus d'éléments
        const categoriesToUpdate = CONFIG.CATEGORIES.filter(category => {
          const count = this.stats.itemsByCategory[category] || 0;
          return count < CONFIG.MIN_ITEMS_PER_CATEGORY;
        });
        
        logger.info(`Catégories à mettre à jour: ${categoriesToUpdate.join(', ')}`);
        
        // Simuler un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simuler des résultats
        const results = [];
        
        // Pour chaque catégorie à mettre à jour
        for (const category of categoriesToUpdate) {
          const currentCount = this.stats.itemsByCategory[category] || 0;
          const neededCount = CONFIG.MIN_ITEMS_PER_CATEGORY - currentCount;
          
          logger.info(`Génération de ${neededCount} éléments pour la catégorie ${category}`);
          
          // Générer les éléments manquants
          for (let i = 0; i < neededCount; i++) {
            const newItem = this.generateContentItem(category, currentCount + i + 1);
            results.push(newItem);
            
            // Ajouter l'élément au cache
            this.contentCache.items.push(newItem);
          }
        }
        
        // Mettre à jour les statistiques
        this.updateStats();
        
        // Simuler la sauvegarde du cache
        logger.info(`${results.length} nouveaux éléments ajoutés au cache`);
        
        this.isUpdating = false;
        
        // Déclencher l'événement de fin de mise à jour
        const completeEvent = new CustomEvent('updateComplete', { detail: { count: results.length } });
        this.events.dispatchEvent(completeEvent);
        
        return results;
      } catch (error) {
        logger.error("Erreur lors de la mise à jour de la base de données", error);
        
        this.isUpdating = false;
        
        // Déclencher l'événement d'erreur
        const errorEvent = new CustomEvent('updateError', { detail: error });
        this.events.dispatchEvent(errorEvent);
        
        throw error;
      }
    }
    
    /**
     * Génère un élément de contenu
     * @param {string} category - Catégorie de l'élément
     * @param {number} index - Index de l'élément
     * @returns {Object} - Élément de contenu
     */
    generateContentItem(category, index) {
      // Générer un ID unique
      const id = `${category}${String(index).padStart(3, '0')}`;
      
      // Sélectionner une source aléatoire
      const source = CONFIG.SOURCES[Math.floor(Math.random() * CONFIG.SOURCES.length)];
      
      // Sélectionner un pays en fonction de la catégorie
      let country;
      switch (category) {
        case 'drama':
          country = ['kr', 'jp', 'cn', 'th', 'tw'][Math.floor(Math.random() * 5)];
          break;
        case 'movie':
          country = ['kr', 'jp', 'cn', 'th', 'tw', 'us'][Math.floor(Math.random() * 6)];
          break;
        case 'anime':
          country = 'jp';
          break;
        case 'tvshow':
          country = ['kr', 'jp', 'cn', 'th', 'tw', 'us'][Math.floor(Math.random() * 6)];
          break;
        case 'bollywood':
          country = 'in';
          break;
        default:
          country = 'kr';
      }
      
      // Générer une année aléatoire entre 2000 et 2025
      const year = 2000 + Math.floor(Math.random() * 26);
      
      // Générer un titre
      const title = `${this.getPrefix(category)} ${index}`;
      
      // Générer un titre original
      const originalTitle = this.getOriginalTitle(title, country);
      
      // Générer un nombre d'épisodes (si applicable)
      let episodes = null;
      if (category === 'drama' || category === 'anime' || category === 'tvshow') {
        episodes = [12, 16, 20, 24, 32][Math.floor(Math.random() * 5)];
      }
      
      // Générer une note (entre 7.0 et 9.9)
      const rating = (7 + Math.random() * 2.9).toFixed(1);
      
      // Générer des genres
      const genrePool = {
        drama: ['Romance', 'Comédie', 'Drame', 'Action', 'Thriller', 'Fantastique', 'Historique', 'Médical'],
        movie: ['Action', 'Aventure', 'Comédie', 'Drame', 'Horreur', 'Science-fiction', 'Thriller', 'Romance'],
        anime: ['Shonen', 'Shojo', 'Seinen', 'Josei', 'Action', 'Aventure', 'Comédie', 'Drame', 'Fantastique'],
        tvshow: ['Variété', 'Téléréalité', 'Jeu', 'Talk-show', 'Documentaire', 'Cuisine', 'Voyage', 'Musique'],
        bollywood: ['Romance', 'Comédie', 'Drame', 'Action', 'Thriller', 'Musical', 'Historique', 'Biopic']
      };
      
      const genres = [];
      const typeGenres = genrePool[category] || genrePool.drama;
      
      // Sélectionner 2-3 genres aléatoires
      const genreCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < genreCount; i++) {
        const randomGenre = typeGenres[Math.floor(Math.random() * typeGenres.length)];
        if (!genres.includes(randomGenre)) {
          genres.push(randomGenre);
        }
      }
      
      return {
        id,
        title,
        originalTitle,
        type: category,
        category,
        country,
        year,
        rating: parseFloat(rating),
        episodes,
        genres,
        source,
        popularity: 1000 + Math.floor(Math.random() * 9000),
        addedDate: new Date().toISOString()
      };
    }
    
    /**
     * Obtient un préfixe pour le titre en fonction de la catégorie
     * @param {string} category - Catégorie
     * @returns {string} - Préfixe
     */
    getPrefix(category) {
      const prefixes = {
        drama: 'Korean Drama',
        movie: 'Asian Movie',
        anime: 'Anime Series',
        tvshow: 'K-Variety Show',
        bollywood: 'Bollywood Film'
      };
      
      return prefixes[category] || 'Content';
    }
    
    /**
     * Génère un titre original en fonction du titre et du pays
     * @param {string} title - Titre
     * @param {string} country - Code du pays
     * @returns {string} - Titre original
     */
    getOriginalTitle(title, country) {
      const translations = {
        kr: title => `한국 ${title.split(' ').pop()}`,
        jp: title => `日本 ${title.split(' ').pop()}`,
        cn: title => `中国 ${title.split(' ').pop()}`,
        th: title => `ไทย ${title.split(' ').pop()}`,
        tw: title => `台灣 ${title.split(' ').pop()}`,
        in: title => `भारतीय ${title.split(' ').pop()}`,
        us: title => title
      };
      
      return translations[country] ? translations[country](title) : title;
    }
    
    /**
     * Recherche du contenu
     * @param {string} query - Requête de recherche
     * @param {Object} options - Options de recherche
     * @returns {Promise<Array>} - Résultats de la recherche
     */
    async searchContent(query, options = {}) {
      logger.info(`Recherche de contenu: "${query}"`);
      
      if (!this.contentCache) {
        await this.loadContentCache();
      }
      
      // Filtrer les résultats en fonction de la requête
      const results = this.contentCache.items.filter(item => {
        const title = item.title?.toLowerCase() || '';
        const originalTitle = item.originalTitle?.toLowerCase() || '';
        const description = item.description?.toLowerCase() || '';
        
        const q = query.toLowerCase();
        
        return title.includes(q) || originalTitle.includes(q) || description.includes(q);
      });
      
      logger.info(`${results.length} résultats trouvés pour "${query}"`);
      
      // Si aucun résultat n'est trouvé et que nous avons accès au vrai SmartScrapingService
      if (results.length === 0 && typeof window.SmartScrapingServiceOriginal !== 'undefined') {
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
      if (typeof window.SmartScrapingServiceOriginal !== 'undefined') {
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
})();
