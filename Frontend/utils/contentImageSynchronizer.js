/**
 * Synchroniseur d'images de contenu pour FloDrama
 * 
 * Ce module fait le lien entre le ContentDataService, le SmartScrapingService et le gestionnaire d'images
 * pour assurer une synchronisation optimale des ressources visuelles.
 */

import logger from './logger';
import ContentDataService from '../services/ContentDataService';
import SmartScrapingService from '../services/SmartScrapingService';
import imageManager, { ImageTypes } from './imageManager';

// Configuration
const CONFIG = {
  // Intervalle de synchronisation en millisecondes (30 minutes)
  SYNC_INTERVAL: 30 * 60 * 1000,
  
  // Nombre maximum d'éléments à traiter par lot
  BATCH_SIZE: 20,
  
  // Délai entre les traitements de lots (en ms)
  BATCH_DELAY: 2000,
  
  // Types de contenu à synchroniser
  CONTENT_TYPES: ['drama', 'movie', 'anime'],
  
  // Priorité des sources d'images
  IMAGE_SOURCE_PRIORITY: {
    'tmdb': 1,
    'mydramalist': 2,
    'bunny-cdn': 3,
    'cloudfront': 4,
    'github-pages': 5
  }
};

/**
 * Classe de synchronisation des images de contenu
 */
class ContentImageSynchronizer {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = 0;
    this.syncStats = {
      totalProcessed: 0,
      imagesUpdated: 0,
      errors: 0,
      lastRun: null
    };
    
    // Vérifier si nous sommes dans un environnement navigateur
    this.isBrowser = typeof window !== 'undefined';
    
    // Initialiser les écouteurs d'événements
    this._initEventListeners();
  }
  
  /**
   * Initialise les écouteurs d'événements
   * @private
   */
  _initEventListeners() {
    if (this.isBrowser) {
      // Écouter les événements de mise à jour du contenu
      window.addEventListener('flodrama:popular-content-updated', () => {
        logger.info('Événement de mise à jour du contenu détecté, planification de la synchronisation des images');
        this.scheduleSyncImages();
      });
      
      // Écouter les événements de changement d'état des CDNs
      window.addEventListener('flodrama:cdn-status-updated', (event) => {
        if (event.detail && (event.detail.bunny || event.detail.cloudfront)) {
          logger.info('Changement d\'état des CDNs détecté, planification de la synchronisation des images');
          this.scheduleSyncImages();
        }
      });
    }
  }
  
  /**
   * Démarre la synchronisation périodique des images
   */
  startPeriodicSync() {
    logger.info('Démarrage de la synchronisation périodique des images');
    
    // Effectuer une première synchronisation après un court délai
    setTimeout(() => {
      this.syncImages();
    }, 10000); // 10 secondes après l'initialisation
    
    // Configurer la synchronisation périodique
    setInterval(() => {
      this.syncImages();
    }, CONFIG.SYNC_INTERVAL);
    
    return this;
  }
  
  /**
   * Planifie une synchronisation des images
   * @param {number} delay - Délai avant la synchronisation (ms)
   */
  scheduleSyncSync(delay = 5000) {
    // Éviter les synchronisations trop fréquentes
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    if (timeSinceLastSync < 60000) { // 1 minute minimum entre les syncs
      logger.debug(`Synchronisation ignorée, dernière sync il y a ${Math.round(timeSinceLastSync / 1000)}s`);
      return;
    }
    
    setTimeout(() => {
      this.syncImages();
    }, delay);
  }
  
  /**
   * Synchronise les images de contenu
   * @returns {Promise<Object>} Statistiques de synchronisation
   */
  async syncImages() {
    // Éviter les exécutions simultanées
    if (this.isRunning) {
      logger.warn('Synchronisation déjà en cours, opération ignorée');
      return this.syncStats;
    }
    
    this.isRunning = true;
    logger.info('Démarrage de la synchronisation des images de contenu');
    
    try {
      // Réinitialiser les statistiques pour cette exécution
      const runStats = {
        totalProcessed: 0,
        imagesUpdated: 0,
        errors: 0,
        startTime: Date.now()
      };
      
      // Traiter chaque type de contenu
      for (const contentType of CONFIG.CONTENT_TYPES) {
        try {
          // Récupérer les contenus populaires pour ce type
          const contents = await this._getContentsForType(contentType);
          
          if (!contents || contents.length === 0) {
            logger.warn(`Aucun contenu trouvé pour le type: ${contentType}`);
            continue;
          }
          
          logger.info(`Traitement de ${contents.length} éléments de type ${contentType}`);
          
          // Traiter les contenus par lots pour éviter de surcharger le navigateur
          for (let i = 0; i < contents.length; i += CONFIG.BATCH_SIZE) {
            const batch = contents.slice(i, i + CONFIG.BATCH_SIZE);
            
            // Traiter le lot en parallèle
            const batchResults = await Promise.allSettled(
              batch.map(content => this._processContentImages(content, contentType))
            );
            
            // Analyser les résultats
            batchResults.forEach(result => {
              runStats.totalProcessed++;
              
              if (result.status === 'fulfilled') {
                if (result.value && result.value.updated) {
                  runStats.imagesUpdated++;
                }
              } else {
                runStats.errors++;
                logger.error(`Erreur lors du traitement d'un contenu: ${result.reason}`);
              }
            });
            
            // Pause entre les lots pour ne pas bloquer le thread principal
            if (i + CONFIG.BATCH_SIZE < contents.length) {
              await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY));
            }
          }
        } catch (typeError) {
          logger.error(`Erreur lors du traitement du type ${contentType}:`, typeError);
          runStats.errors++;
        }
      }
      
      // Mettre à jour les statistiques globales
      this.syncStats.totalProcessed += runStats.totalProcessed;
      this.syncStats.imagesUpdated += runStats.imagesUpdated;
      this.syncStats.errors += runStats.errors;
      this.syncStats.lastRun = new Date();
      
      // Calculer la durée
      const duration = Date.now() - runStats.startTime;
      
      logger.info(`Synchronisation terminée en ${duration}ms: ${runStats.imagesUpdated} images mises à jour sur ${runStats.totalProcessed} contenus traités`);
      
      // Émettre un événement de fin de synchronisation
      if (this.isBrowser) {
        window.dispatchEvent(new CustomEvent('flodrama:images-synchronized', { 
          detail: { 
            ...runStats,
            duration,
            timestamp: Date.now()
          }
        }));
      }
      
      // Mettre à jour le timestamp de dernière synchronisation
      this.lastSyncTime = Date.now();
      
      return { ...this.syncStats, currentRun: runStats };
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des images:', error);
      return this.syncStats;
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Récupère les contenus pour un type donné
   * @param {string} contentType - Type de contenu
   * @returns {Promise<Array>} Liste des contenus
   * @private
   */
  async _getContentsForType(contentType) {
    try {
      // Vérifier si ContentDataService est disponible
      if (ContentDataService && ContentDataService.getPopularContent) {
        // Récupérer les contenus populaires depuis ContentDataService
        return await ContentDataService.getPopularContent(contentType, 50);
      }
      
      // Fallback vers SmartScrapingService
      if (SmartScrapingService) {
        switch (contentType) {
          case 'drama':
            return SmartScrapingService.getPopularDramas ? 
              await SmartScrapingService.getPopularDramas(1) : [];
          case 'movie':
            return SmartScrapingService.getPopularMovies ? 
              await SmartScrapingService.getPopularMovies(1) : [];
          case 'anime':
            return SmartScrapingService.getPopularAnimes ? 
              await SmartScrapingService.getPopularAnimes(1) : [];
          default:
            return [];
        }
      }
      
      return [];
    } catch (error) {
      logger.error(`Erreur lors de la récupération des contenus de type ${contentType}:`, error);
      return [];
    }
  }
  
  /**
   * Traite les images d'un contenu
   * @param {Object} content - Contenu à traiter
   * @param {string} contentType - Type de contenu
   * @returns {Promise<Object>} Résultat du traitement
   * @private
   */
  async _processContentImages(content, contentType) {
    if (!content || !content.id) {
      return { updated: false, reason: 'Contenu invalide' };
    }
    
    try {
      // Déterminer les types d'images à traiter
      const imageTypes = this._getImageTypesForContent(contentType);
      
      // Vérifier si le contenu a déjà des images
      const hasImages = content.image || content.poster || content.backdrop || content.thumbnail;
      
      // Si le contenu n'a pas d'images, essayer de récupérer plus de détails
      let contentDetails = content;
      if (!hasImages && SmartScrapingService && SmartScrapingService.getContentDetails) {
        try {
          const details = await SmartScrapingService.getContentDetails(content.id);
          if (details) {
            contentDetails = details;
          }
        } catch (detailsError) {
          logger.warn(`Impossible de récupérer les détails pour ${content.id}:`, detailsError);
        }
      }
      
      // Précharger les images pour chaque type
      const preloadResults = await Promise.allSettled(
        imageTypes.map(async (imageType) => {
          try {
            const imageUrl = await imageManager.preloadImage(content.id, imageType);
            return { type: imageType, url: imageUrl, success: true };
          } catch (error) {
            return { type: imageType, success: false, error };
          }
        })
      );
      
      // Compter les mises à jour réussies
      const successfulUpdates = preloadResults.filter(
        result => result.status === 'fulfilled' && result.value && result.value.success
      ).length;
      
      // Mettre à jour le contenu dans ContentDataService si nécessaire
      if (successfulUpdates > 0 && ContentDataService && ContentDataService.updateContentImages) {
        // Extraire les URLs des images préchargées
        const imageUrls = {};
        preloadResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value && result.value.success) {
            const { type, url } = result.value;
            
            // Mapper les types d'images aux propriétés du contenu
            switch (type) {
              case ImageTypes.POSTER:
                imageUrls.poster = url;
                break;
              case ImageTypes.BACKDROP:
                imageUrls.backdrop = url;
                break;
              case ImageTypes.THUMBNAIL:
                imageUrls.thumbnail = url;
                break;
              default:
                // Type générique
                if (!imageUrls.image) {
                  imageUrls.image = url;
                }
                break;
            }
          }
        });
        
        // Mettre à jour le contenu avec les nouvelles URLs d'images
        try {
          await ContentDataService.updateContentImages(content.id, imageUrls);
          logger.debug(`Images mises à jour pour ${content.id}`);
        } catch (updateError) {
          logger.error(`Erreur lors de la mise à jour des images pour ${content.id}:`, updateError);
        }
      }
      
      return { 
        contentId: content.id, 
        updated: successfulUpdates > 0,
        imageTypes: imageTypes.length,
        successfulUpdates
      };
    } catch (error) {
      logger.error(`Erreur lors du traitement des images pour ${content.id}:`, error);
      return { contentId: content.id, updated: false, error: error.message };
    }
  }
  
  /**
   * Détermine les types d'images à traiter pour un type de contenu
   * @param {string} contentType - Type de contenu
   * @returns {Array<string>} Types d'images
   * @private
   */
  _getImageTypesForContent(contentType) {
    switch (contentType) {
      case 'movie':
        return [ImageTypes.POSTER, ImageTypes.BACKDROP];
      case 'drama':
        return [ImageTypes.POSTER, ImageTypes.BACKDROP, ImageTypes.THUMBNAIL];
      case 'anime':
        return [ImageTypes.POSTER, ImageTypes.BACKDROP];
      default:
        return [ImageTypes.POSTER];
    }
  }
  
  /**
   * Récupère les statistiques de synchronisation
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      timeSinceLastSync: Date.now() - this.lastSyncTime,
      timestamp: Date.now()
    };
  }
}

// Créer une instance unique
const contentImageSynchronizer = new ContentImageSynchronizer();

// Exporter le synchroniseur
export default contentImageSynchronizer;
