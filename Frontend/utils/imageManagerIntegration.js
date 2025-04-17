/**
 * Module d'intégration du gestionnaire d'images avancé pour FloDrama
 * Permet une transition en douceur entre l'ancien et le nouveau système
 */

import { initImageManager, handleImageError, preloadImage, getOptimalImageUrl, ImageTypes } from './imageManager';
import logger from './logger';

/**
 * Initialise le gestionnaire d'images et configure les écouteurs globaux
 */
export const initializeImageSystem = () => {
  logger.info('Initialisation du système de gestion d\'images FloDrama');
  
  try {
    // Initialiser le nouveau gestionnaire d'images
    initImageManager();
    
    // Remplacer les fonctions de l'ancien système
    patchExistingImageSystem();
    
    // Ajouter des attributs data-* aux images existantes
    enhanceExistingImages();
    
    logger.info('Système de gestion d\'images initialisé avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation du système d\'images:', error);
    return false;
  }
};

/**
 * Remplace les fonctions de l'ancien système par celles du nouveau
 */
const patchExistingImageSystem = () => {
  try {
    // Capturer la fonction handleImageError globale si elle existe
    if (window.handleImageError) {
      logger.debug('Remplacement de la fonction handleImageError globale');
      
      // Sauvegarder l'ancienne fonction pour compatibilité
      window._oldHandleImageError = window.handleImageError;
      
      // Remplacer par la nouvelle
      window.handleImageError = (event) => {
        // Extraire l'ID du contenu et le type si possible
        const imgElement = event.target;
        if (!imgElement.dataset.contentId && imgElement.src) {
          // Tenter d'extraire l'ID du contenu de l'URL
          const contentIdMatch = imgElement.src.match(/\/([a-zA-Z0-9]+)\.(jpg|png|webp)/);
          if (contentIdMatch && contentIdMatch[1]) {
            imgElement.dataset.contentId = contentIdMatch[1];
          }
          
          // Déterminer le type d'image
          if (!imgElement.dataset.type) {
            if (imgElement.src.includes('posters')) {
              imgElement.dataset.type = 'poster';
            } else if (imgElement.src.includes('backdrops')) {
              imgElement.dataset.type = 'backdrop';
            } else if (imgElement.src.includes('thumbnails')) {
              imgElement.dataset.type = 'thumbnail';
            } else {
              imgElement.dataset.type = 'poster'; // Type par défaut
            }
          }
        }
        
        // Appeler le nouveau gestionnaire
        handleImageError(event);
      };
    }
    
    // Remplacer la fonction applyFallbackSvg si elle existe
    if (window.applyFallbackSvg) {
      logger.debug('Remplacement de la fonction applyFallbackSvg globale');
      window._oldApplyFallbackSvg = window.applyFallbackSvg;
    }
    
    logger.debug('Fonctions de l\'ancien système remplacées avec succès');
  } catch (error) {
    logger.error('Erreur lors du remplacement des fonctions:', error);
  }
};

/**
 * Ajoute des attributs data-* aux images existantes pour le nouveau système
 */
const enhanceExistingImages = () => {
  try {
    // Sélectionner toutes les images de la page
    const images = document.querySelectorAll('img');
    let enhancedCount = 0;
    
    images.forEach(img => {
      // Ne pas modifier les images qui ont déjà des attributs data-*
      if (img.dataset.contentId) return;
      
      // Extraire l'ID du contenu de l'URL si possible
      if (img.src) {
        // Chercher un pattern comme /drama123.jpg ou /posters/drama123.jpg
        const contentIdMatch = img.src.match(/\/(?:posters|backdrops|thumbnails|profiles)?\/?([\w\d]+)\.(jpg|png|webp)/i);
        if (contentIdMatch && contentIdMatch[1]) {
          img.dataset.contentId = contentIdMatch[1];
          enhancedCount++;
          
          // Déterminer le type d'image
          if (!img.dataset.type) {
            if (img.src.includes('posters') || img.classList.contains('poster')) {
              img.dataset.type = 'poster';
            } else if (img.src.includes('backdrops') || img.classList.contains('backdrop')) {
              img.dataset.type = 'backdrop';
            } else if (img.src.includes('thumbnails') || img.classList.contains('thumbnail')) {
              img.dataset.type = 'thumbnail';
            } else if (img.src.includes('profiles') || img.classList.contains('profile')) {
              img.dataset.type = 'profile';
            } else {
              // Essayer de déterminer le type par les dimensions
              const ratio = img.width / img.height;
              if (ratio < 0.8) {
                img.dataset.type = 'poster';
              } else if (ratio > 1.5) {
                img.dataset.type = 'backdrop';
              } else {
                img.dataset.type = 'poster'; // Type par défaut
              }
            }
          }
          
          // Ajouter un gestionnaire d'erreur si non présent
          if (!img.hasAttribute('onerror')) {
            img.onerror = (e) => window.handleImageError(e);
          }
        }
      }
    });
    
    logger.info(`${enhancedCount} images existantes améliorées pour le nouveau système`);
  } catch (error) {
    logger.error('Erreur lors de l\'amélioration des images existantes:', error);
  }
};

/**
 * Précharge les images pour une liste de contenus
 * @param {Array<Object>} contentItems - Liste des éléments de contenu
 * @param {string} type - Type d'image à précharger
 * @returns {Promise<void>}
 */
export const preloadContentImages = async (contentItems, type = ImageTypes.POSTER) => {
  if (!contentItems || !contentItems.length) return;
  
  logger.debug(`Préchargement de ${contentItems.length} images de type ${type}`);
  
  try {
    // Précharger les images en parallèle avec une limite
    const batchSize = 5;
    for (let i = 0; i < contentItems.length; i += batchSize) {
      const batch = contentItems.slice(i, i + batchSize);
      await Promise.all(
        batch.map(item => {
          const contentId = item.id || item.contentId;
          if (!contentId) return Promise.resolve();
          return preloadImage(contentId, type).catch(() => {
            // Ignorer les erreurs individuelles de préchargement
          });
        })
      );
    }
    
    logger.debug('Préchargement des images terminé');
  } catch (error) {
    logger.warn('Erreur lors du préchargement des images:', error);
  }
};

/**
 * Obtient l'URL optimale pour une image de contenu
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @param {Object} options - Options supplémentaires
 * @returns {string} - URL de l'image
 */
export const getContentImageUrl = (contentId, type = ImageTypes.POSTER, options = {}) => {
  return getOptimalImageUrl(contentId, type, options);
};

/**
 * Optimise les images d'une page spécifique
 * @param {string} pageType - Type de page (home, drama, film, etc.)
 */
export const optimizePageImages = (pageType) => {
  logger.debug(`Optimisation des images pour la page de type: ${pageType}`);
  
  try {
    // Sélectionner les conteneurs d'images selon le type de page
    let containers = [];
    
    switch (pageType) {
      case 'home':
        containers = [
          { selector: '.carousel-item img', type: ImageTypes.BACKDROP },
          { selector: '.content-card img', type: ImageTypes.POSTER }
        ];
        break;
      case 'drama':
      case 'film':
        containers = [
          { selector: '.content-detail-poster img', type: ImageTypes.POSTER },
          { selector: '.content-detail-backdrop img', type: ImageTypes.BACKDROP },
          { selector: '.related-content img', type: ImageTypes.POSTER }
        ];
        break;
      case 'search':
        containers = [
          { selector: '.search-result-item img', type: ImageTypes.POSTER }
        ];
        break;
      case 'profile':
        containers = [
          { selector: '.user-favorites img', type: ImageTypes.POSTER },
          { selector: '.user-history img', type: ImageTypes.POSTER },
          { selector: '.user-avatar img', type: ImageTypes.PROFILE }
        ];
        break;
      default:
        containers = [
          { selector: 'img[src*="posters"]', type: ImageTypes.POSTER },
          { selector: 'img[src*="backdrops"]', type: ImageTypes.BACKDROP },
          { selector: 'img[src*="thumbnails"]', type: ImageTypes.THUMBNAIL }
        ];
    }
    
    // Optimiser chaque conteneur
    let optimizedCount = 0;
    
    containers.forEach(({ selector, type }) => {
      const images = document.querySelectorAll(selector);
      
      images.forEach(img => {
        // Extraire l'ID du contenu si possible
        if (!img.dataset.contentId && img.src) {
          const contentIdMatch = img.src.match(/\/(?:posters|backdrops|thumbnails|profiles)?\/?([\w\d]+)\.(jpg|png|webp)/i);
          if (contentIdMatch && contentIdMatch[1]) {
            img.dataset.contentId = contentIdMatch[1];
            img.dataset.type = type;
            
            // Obtenir l'URL optimale
            const optimalUrl = getOptimalImageUrl(img.dataset.contentId, type);
            
            // Ne pas changer l'URL si c'est déjà un SVG de fallback
            if (!img.src.startsWith('data:image/svg+xml')) {
              img.src = optimalUrl;
            }
            
            // Ajouter un gestionnaire d'erreur
            img.onerror = (e) => window.handleImageError(e);
            
            optimizedCount++;
          }
        }
      });
    });
    
    logger.info(`${optimizedCount} images optimisées pour la page ${pageType}`);
  } catch (error) {
    logger.error(`Erreur lors de l'optimisation des images pour ${pageType}:`, error);
  }
};

// Exporter les constantes et fonctions utiles
export { ImageTypes };
export default {
  initializeImageSystem,
  preloadContentImages,
  getContentImageUrl,
  optimizePageImages,
  ImageTypes
};
