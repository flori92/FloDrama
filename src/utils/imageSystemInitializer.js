/**
 * Initialisateur du système de gestion d'images FloDrama
 * 
 * Ce module centralise l'initialisation de tous les composants du système de gestion d'images
 * et assure leur intégration avec les autres services de l'application.
 */

import logger from './logger';
import imageManager from './imageManager';
import contentImageSynchronizer from './contentImageSynchronizer';
import { initializeImageSystem } from './imageManagerIntegration';

// Configuration
const CONFIG = {
  // Activer le préchargement des images populaires
  ENABLE_PRELOADING: true,
  
  // Activer la synchronisation périodique des images
  ENABLE_PERIODIC_SYNC: true,
  
  // Intervalle de vérification de l'état des CDNs (en ms)
  CDN_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Délai avant la première synchronisation (en ms)
  INITIAL_SYNC_DELAY: 15 * 1000, // 15 secondes
  
  // Activer les statistiques de performance
  ENABLE_STATS: true
};

/**
 * Classe d'initialisation du système d'images
 */
class ImageSystemInitializer {
  constructor() {
    this.initialized = false;
    this.startTime = Date.now();
    
    // Statistiques de performance
    this.stats = {
      imagesLoaded: 0,
      imagesFailed: 0,
      cdnStatus: {
        bunny: null,
        cloudfront: null
      },
      syncStatus: {
        lastSync: null,
        imagesUpdated: 0
      }
    };
    
    // Vérifier si nous sommes dans un environnement navigateur
    this.isBrowser = typeof window !== 'undefined';
    
    // Initialiser les écouteurs d'événements
    if (this.isBrowser) {
      this._initEventListeners();
    }
  }
  
  /**
   * Initialise les écouteurs d'événements
   * @private
   */
  _initEventListeners() {
    // Écouter les événements de mise à jour de l'état des CDNs
    window.addEventListener('flodrama:cdn-status-updated', (event) => {
      if (event.detail) {
        this.stats.cdnStatus.bunny = event.detail.bunny;
        this.stats.cdnStatus.cloudfront = event.detail.cloudfront;
      }
    });
    
    // Écouter les événements de synchronisation des images
    window.addEventListener('flodrama:images-synchronized', (event) => {
      if (event.detail) {
        this.stats.syncStatus.lastSync = new Date();
        this.stats.syncStatus.imagesUpdated += event.detail.imagesUpdated || 0;
      }
    });
    
    // Écouter les événements de chargement d'images
    window.addEventListener('flodrama:image-loaded', (event) => {
      if (event.detail && event.detail.success) {
        this.stats.imagesLoaded++;
      } else {
        this.stats.imagesFailed++;
      }
    });
  }
  
  /**
   * Initialise le système de gestion d'images
   * @returns {Promise<boolean>} true si l'initialisation a réussi
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('Le système d\'images est déjà initialisé');
      return true;
    }
    
    logger.info('Initialisation du système de gestion d\'images FloDrama');
    
    try {
      // Étape 1: Initialiser le gestionnaire d'images de base
      await this._initImageManager();
      
      // Étape 2: Initialiser l'intégration avec les systèmes existants
      await this._initImageIntegration();
      
      // Étape 3: Initialiser la synchronisation des images
      if (CONFIG.ENABLE_PERIODIC_SYNC) {
        await this._initImageSynchronization();
      }
      
      // Étape 4: Initialiser les statistiques
      if (CONFIG.ENABLE_STATS) {
        this._initStats();
      }
      
      // Marquer comme initialisé
      this.initialized = true;
      
      // Calculer le temps d'initialisation
      const initTime = Date.now() - this.startTime;
      logger.info(`Système de gestion d'images initialisé en ${initTime}ms`);
      
      // Émettre un événement d'initialisation réussie
      if (this.isBrowser) {
        window.dispatchEvent(new CustomEvent('flodrama:image-system-initialized', { 
          detail: { 
            initTime,
            timestamp: Date.now()
          }
        }));
      }
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du système d\'images:', error);
      
      // Émettre un événement d'erreur d'initialisation
      if (this.isBrowser) {
        window.dispatchEvent(new CustomEvent('flodrama:image-system-error', { 
          detail: { 
            error: error.message,
            timestamp: Date.now()
          }
        }));
      }
      
      return false;
    }
  }
  
  /**
   * Initialise le gestionnaire d'images de base
   * @returns {Promise<void>}
   * @private
   */
  async _initImageManager() {
    try {
      logger.debug('Initialisation du gestionnaire d\'images de base');
      
      // Initialiser le gestionnaire d'images
      imageManager.initImageManager();
      
      logger.debug('Gestionnaire d\'images de base initialisé');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du gestionnaire d\'images:', error);
      throw error;
    }
  }
  
  /**
   * Initialise l'intégration avec les systèmes existants
   * @returns {Promise<void>}
   * @private
   */
  async _initImageIntegration() {
    try {
      logger.debug('Initialisation de l\'intégration du système d\'images');
      
      // Initialiser l'intégration
      const integrationResult = initializeImageSystem();
      
      if (!integrationResult) {
        logger.warn('L\'intégration du système d\'images a échoué ou n\'est pas disponible');
      } else {
        logger.debug('Intégration du système d\'images réussie');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de l\'intégration du système d\'images:', error);
      // Ne pas propager l'erreur pour permettre le fonctionnement minimal
    }
  }
  
  /**
   * Initialise la synchronisation des images
   * @returns {Promise<void>}
   * @private
   */
  async _initImageSynchronization() {
    try {
      logger.debug('Initialisation de la synchronisation des images');
      
      // Démarrer la synchronisation périodique après un délai
      setTimeout(() => {
        contentImageSynchronizer.startPeriodicSync();
        logger.debug('Synchronisation périodique des images démarrée');
      }, CONFIG.INITIAL_SYNC_DELAY);
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la synchronisation des images:', error);
      // Ne pas propager l'erreur pour permettre le fonctionnement minimal
    }
  }
  
  /**
   * Initialise les statistiques de performance
   * @private
   */
  _initStats() {
    try {
      // Créer l'objet de statistiques global
      if (this.isBrowser) {
        window._flodramaStats = window._flodramaStats || {};
        window._flodramaStats.images = {
          ...this.stats,
          getImageManagerStats: imageManager.getImageManagerStats,
          getSynchronizerStats: contentImageSynchronizer.getStats,
          getFullStats: () => ({
            ...this.stats,
            imageManager: imageManager.getImageManagerStats(),
            synchronizer: contentImageSynchronizer.getStats(),
            timestamp: Date.now()
          })
        };
        
        logger.debug('Statistiques de performance initialisées');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des statistiques:', error);
    }
  }
  
  /**
   * Récupère les statistiques du système d'images
   * @returns {Object} Statistiques
   */
  getStats() {
    if (this.isBrowser && window._flodramaStats && window._flodramaStats.images) {
      return window._flodramaStats.images.getFullStats();
    }
    
    return {
      ...this.stats,
      initialized: this.initialized,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now()
    };
  }
}

// Créer une instance unique
const imageSystemInitializer = new ImageSystemInitializer();

/**
 * Fonction d'initialisation du système d'images
 * @returns {Promise<boolean>} true si l'initialisation a réussi
 */
export const initImageSystem = async () => {
  return imageSystemInitializer.initialize();
};

/**
 * Récupère les statistiques du système d'images
 * @returns {Object} Statistiques
 */
export const getImageSystemStats = () => {
  return imageSystemInitializer.getStats();
};

// Exporter l'instance et les fonctions utiles
export default {
  initImageSystem,
  getImageSystemStats,
  imageSystemInitializer
};
