/**
 * FloDrama Content Bridge
 * Script de liaison entre le système d'images et le système de lecture de contenu
 * Assure la compatibilité entre les différentes parties de l'application
 */

(function() {
  // Configuration
  const CONFIG = {
    DEBUG: false,
    SERVICES_REQUIRED: [
      'ApiService',
      'StorageService',
      'ContentDataService',
      'FavoritesService',
      'VideoPlayerAdapter'
    ],
    MOCK_SERVICES: true // Utiliser des services simulés si les services réels ne sont pas disponibles
  };
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama Bridge] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Bridge] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Bridge] ${message}`, error);
    },
    
    debug: function(message) {
      if (CONFIG.DEBUG) console.debug(`[FloDrama Bridge] ${message}`);
    }
  };
  
  /**
   * Vérifie si les services requis sont disponibles
   * @returns {boolean} - True si tous les services sont disponibles
   */
  function checkRequiredServices() {
    const missingServices = [];
    
    CONFIG.SERVICES_REQUIRED.forEach(service => {
      if (typeof window[service] === 'undefined') {
        missingServices.push(service);
      }
    });
    
    if (missingServices.length > 0) {
      logger.warn(`Services manquants: ${missingServices.join(', ')}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Crée des services simulés pour le développement
   */
  function createMockServices() {
    logger.info("Création de services simulés pour le développement");
    
    // ApiService simulé
    window.ApiService = class ApiService {
      constructor() {
        logger.debug("ApiService simulé initialisé");
      }
      
      async get(url) {
        logger.debug(`GET simulé: ${url}`);
        return { success: true, data: {} };
      }
      
      async post(url, data) {
        logger.debug(`POST simulé: ${url}`);
        return { success: true, data: {} };
      }
    };
    
    // StorageService simulé
    window.StorageService = class StorageService {
      constructor() {
        this.storage = {};
        logger.debug("StorageService simulé initialisé");
      }
      
      get(key) {
        return this.storage[key] || null;
      }
      
      set(key, value) {
        this.storage[key] = value;
        return true;
      }
      
      remove(key) {
        delete this.storage[key];
        return true;
      }
    };
    
    // ContentDataService simulé
    window.ContentDataService = class ContentDataService {
      constructor(apiService, storageService) {
        this.apiService = apiService;
        this.storageService = storageService;
        logger.debug("ContentDataService simulé initialisé");
      }
      
      async getContentById(id) {
        logger.debug(`Récupération du contenu simulé: ${id}`);
        
        // Essayer de récupérer depuis sessionStorage
        const storedContent = sessionStorage.getItem('currentContent');
        if (storedContent) {
          return JSON.parse(storedContent);
        }
        
        // Sinon, récupérer depuis le fichier JSON
        try {
          const response = await fetch('/data/content.json');
          if (!response.ok) {
            throw new Error('Impossible de charger les données de contenu');
          }
          
          const data = await response.json();
          return data.items.find(item => item.id === id);
        } catch (error) {
          logger.error('Erreur lors du chargement des données:', error);
          return null;
        }
      }
      
      async getSimilarContent(id, category, limit = 6) {
        logger.debug(`Récupération de contenu similaire simulé pour: ${id}`);
        
        try {
          const response = await fetch('/data/content.json');
          if (!response.ok) {
            throw new Error('Impossible de charger les données de contenu');
          }
          
          const data = await response.json();
          return data.items
            .filter(item => item.id !== id && item.category === category)
            .slice(0, limit);
        } catch (error) {
          logger.error('Erreur lors du chargement des données similaires:', error);
          return [];
        }
      }
    };
    
    // FavoritesService simulé
    window.FavoritesService = class FavoritesService {
      constructor(storageService) {
        this.storageService = storageService;
        this.favorites = this._loadFavorites();
        logger.debug("FavoritesService simulé initialisé");
      }
      
      _loadFavorites() {
        const stored = localStorage.getItem('flodrama_favorites');
        return stored ? JSON.parse(stored) : [];
      }
      
      _saveFavorites() {
        localStorage.setItem('flodrama_favorites', JSON.stringify(this.favorites));
      }
      
      addFavorite(content) {
        if (!this.isFavorite(content.id)) {
          this.favorites.push({
            id: content.id,
            title: content.title,
            category: content.category,
            addedAt: new Date().toISOString()
          });
          this._saveFavorites();
          logger.debug(`Contenu ajouté aux favoris: ${content.id}`);
          return true;
        }
        return false;
      }
      
      removeFavorite(contentId) {
        const initialLength = this.favorites.length;
        this.favorites = this.favorites.filter(item => item.id !== contentId);
        
        if (this.favorites.length !== initialLength) {
          this._saveFavorites();
          logger.debug(`Contenu retiré des favoris: ${contentId}`);
          return true;
        }
        return false;
      }
      
      isFavorite(contentId) {
        return this.favorites.some(item => item.id === contentId);
      }
      
      getAllFavorites() {
        return [...this.favorites];
      }
    };
    
    // VideoPlayerAdapter simulé
    window.VideoPlayerAdapter = class VideoPlayerAdapter {
      constructor() {
        logger.debug("VideoPlayerAdapter simulé initialisé");
      }
      
      initialize(container) {
        logger.debug(`Initialisation du lecteur vidéo dans: ${container}`);
        return true;
      }
      
      play(videoUrl) {
        logger.debug(`Lecture de la vidéo: ${videoUrl}`);
        return true;
      }
      
      pause() {
        logger.debug("Pause de la vidéo");
        return true;
      }
      
      stop() {
        logger.debug("Arrêt de la vidéo");
        return true;
      }
    };
  }
  
  /**
   * Initialise le pont entre les systèmes
   */
  function initBridge() {
    logger.info("Initialisation du pont entre les systèmes...");
    
    // Vérifier si les services requis sont disponibles
    const servicesAvailable = checkRequiredServices();
    
    // Si les services ne sont pas disponibles et que MOCK_SERVICES est activé, créer des services simulés
    if (!servicesAvailable && CONFIG.MOCK_SERVICES) {
      createMockServices();
    }
    
    // Exposer les fonctions de lecture et de favoris au niveau global
    window.FloDramaBridge = {
      // Fonction pour lire un contenu
      playContent: function(contentId) {
        logger.info(`Demande de lecture du contenu: ${contentId}`);
        
        if (typeof window.playEpisode === 'function') {
          // Utiliser la fonction existante si disponible
          window.playEpisode();
        } else {
          // Rediriger vers la page de détail avec l'intention de lecture
          const currentContent = sessionStorage.getItem('currentContent');
          if (currentContent) {
            const content = JSON.parse(currentContent);
            const slug = content.title.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            
            window.location.href = `content-detail.html?id=${contentId}&title=${encodeURIComponent(content.title)}&slug=${slug}&action=play`;
          } else {
            window.location.href = `content-detail.html?id=${contentId}&action=play`;
          }
        }
      },
      
      // Fonction pour lire un épisode spécifique
      playEpisode: function(contentId, episodeNumber) {
        logger.info(`Demande de lecture de l'épisode ${episodeNumber} du contenu: ${contentId}`);
        
        if (typeof window.playEpisode === 'function') {
          // Utiliser la fonction existante si disponible
          const episode = { number: episodeNumber };
          window.playEpisode(episode);
        } else {
          // Rediriger vers la page de détail avec l'intention de lecture d'épisode
          window.location.href = `content-detail.html?id=${contentId}&episode=${episodeNumber}&action=play`;
        }
      },
      
      // Fonction pour ajouter un contenu aux favoris
      addToFavorites: function(contentId) {
        logger.info(`Demande d'ajout aux favoris: ${contentId}`);
        
        try {
          // Vérifier si le service de favoris est disponible
          if (typeof window.FavoritesService !== 'undefined') {
            const storageService = new window.StorageService();
            const favoritesService = new window.FavoritesService(storageService);
            
            // Récupérer les données du contenu
            const currentContent = sessionStorage.getItem('currentContent');
            if (currentContent) {
              const content = JSON.parse(currentContent);
              
              // Ajouter aux favoris
              const added = favoritesService.addFavorite(content);
              
              if (added) {
                logger.info(`${content.title} a été ajouté aux favoris`);
                return true;
              } else {
                logger.info(`${content.title} est déjà dans les favoris`);
                return false;
              }
            }
          }
          
          // Fallback: utiliser localStorage directement
          const favorites = JSON.parse(localStorage.getItem('flodrama_favorites') || '[]');
          const currentContent = sessionStorage.getItem('currentContent');
          
          if (currentContent) {
            const content = JSON.parse(currentContent);
            
            // Vérifier si déjà dans les favoris
            if (!favorites.some(item => item.id === contentId)) {
              favorites.push({
                id: content.id,
                title: content.title,
                category: content.category,
                addedAt: new Date().toISOString()
              });
              
              localStorage.setItem('flodrama_favorites', JSON.stringify(favorites));
              logger.info(`${content.title} a été ajouté aux favoris (fallback)`);
              return true;
            } else {
              logger.info(`${content.title} est déjà dans les favoris (fallback)`);
              return false;
            }
          }
          
          return false;
        } catch (error) {
          logger.error(`Erreur lors de l'ajout aux favoris: ${error.message}`, error);
          return false;
        }
      },
      
      // Fonction pour vérifier si un contenu est dans les favoris
      isFavorite: function(contentId) {
        try {
          // Vérifier si le service de favoris est disponible
          if (typeof window.FavoritesService !== 'undefined') {
            const storageService = new window.StorageService();
            const favoritesService = new window.FavoritesService(storageService);
            
            return favoritesService.isFavorite(contentId);
          }
          
          // Fallback: utiliser localStorage directement
          const favorites = JSON.parse(localStorage.getItem('flodrama_favorites') || '[]');
          return favorites.some(item => item.id === contentId);
        } catch (error) {
          logger.error(`Erreur lors de la vérification des favoris: ${error.message}`, error);
          return false;
        }
      }
    };
    
    // Exposer les fonctions au niveau global pour compatibilité
    window.playContent = window.FloDramaBridge.playContent;
    window.playEpisode = window.FloDramaBridge.playEpisode;
    window.addToFavorites = window.FloDramaBridge.addToFavorites;
    
    logger.info("Pont entre les systèmes initialisé avec succès");
  }
  
  // Initialiser le pont au chargement de la page
  document.addEventListener('DOMContentLoaded', initBridge);
})();
