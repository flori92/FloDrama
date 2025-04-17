/**
 * Gestionnaire d'images avancé pour FloDrama
 * Système multi-couches de fallback avec surveillance des CDNs et génération dynamique de SVG
 */

import logger from './logger';
import { getMediaUrl, getPosterUrl, getBackdropUrl } from './bunny-cdn-integration';
import { createPlaceholders } from './localImageFallback';
import ContentDataService from '../services/ContentDataService';
import SmartScrapingService from '../services/SmartScrapingService';

// Configuration des sources d'images
const IMAGE_SOURCES = {
  BUNNY_CDN: {
    baseUrl: 'https://images.flodrama.com',
    enabled: true,
    priority: 1
  },
  CLOUDFRONT: {
    baseUrl: 'https://d2ra390ol17u3n.cloudfront.net',
    enabled: true,
    priority: 2
  },
  GITHUB_PAGES: {
    baseUrl: '', // URL relative, sera résolue par le navigateur
    enabled: true,
    priority: 3
  },
  LOCAL_PLACEHOLDERS: {
    baseUrl: '/assets/static/placeholders',
    enabled: true,
    priority: 4
  }
};

// Types d'images supportés
const IMAGE_TYPES = {
  POSTER: 'poster',
  BACKDROP: 'backdrop',
  THUMBNAIL: 'thumbnail',
  PROFILE: 'profile',
  LOGO: 'logo'
};

// Cache pour éviter les boucles infinies et améliorer les performances
const processedUrls = new Set();
const cdnStatusCache = new Map();
const imageLoadingCache = new Map();

/**
 * Initialise le gestionnaire d'images
 */
export const initImageManager = () => {
  logger.info('Initialisation du gestionnaire d\'images avancé');
  
  // Créer les styles CSS pour les placeholders
  createPlaceholders();
  
  // Vérifier l'état des CDNs
  checkAllCdnStatus();
  
  // Ajouter un gestionnaire global pour les erreurs d'images
  document.addEventListener('error', (e) => {
    if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
      handleImageError(e);
      e.preventDefault();
    }
  }, true);
  
  // Configurer une vérification périodique des CDNs
  setInterval(checkAllCdnStatus, 5 * 60 * 1000); // Toutes les 5 minutes
  
  // Précharger les contenus populaires pour optimiser l'expérience utilisateur
  preloadPopularContent();
  
  return () => {
    logger.debug('Nettoyage du gestionnaire d\'images');
    // Supprimer les écouteurs d'événements si nécessaire
  };
};

/**
 * Précharge les images des contenus populaires
 */
const preloadPopularContent = async () => {
  try {
    // Vérifier si ContentDataService est disponible
    if (!ContentDataService) {
      logger.warn('ContentDataService non disponible pour le préchargement des contenus populaires');
      return;
    }
    
    // Récupérer les contenus populaires
    const popularContent = await ContentDataService.getPopularContent('all', 10);
    
    if (!popularContent || popularContent.length === 0) {
      logger.warn('Aucun contenu populaire disponible pour le préchargement');
      return;
    }
    
    logger.info(`Préchargement des images pour ${popularContent.length} contenus populaires`);
    
    // Précharger les images en arrière-plan
    setTimeout(() => {
      popularContent.forEach(content => {
        if (content.id && (content.image || content.poster)) {
          const contentType = content.type || 'drama';
          const imageType = contentType === 'movie' ? IMAGE_TYPES.POSTER : 
                           contentType === 'anime' ? IMAGE_TYPES.POSTER : IMAGE_TYPES.POSTER;
          
          preloadImage(content.id, imageType).catch(() => {
            // Ignorer les erreurs de préchargement
          });
        }
      });
    }, 2000); // Délai de 2 secondes pour ne pas bloquer le chargement initial
  } catch (error) {
    logger.error('Erreur lors du préchargement des contenus populaires:', error);
  }
};

/**
 * Vérifie l'état de tous les CDNs configurés
 */
const checkAllCdnStatus = async () => {
  logger.debug('Vérification de l\'état des CDNs');
  
  try {
    // Vérifier Bunny CDN
    const bunnyStatus = await checkCdnStatus(IMAGE_SOURCES.BUNNY_CDN.baseUrl);
    IMAGE_SOURCES.BUNNY_CDN.enabled = bunnyStatus;
    cdnStatusCache.set('BUNNY_CDN', { status: bunnyStatus, timestamp: Date.now() });
    
    // Vérifier CloudFront
    const cloudfrontStatus = await checkCdnStatus(IMAGE_SOURCES.CLOUDFRONT.baseUrl);
    IMAGE_SOURCES.CLOUDFRONT.enabled = cloudfrontStatus;
    cdnStatusCache.set('CLOUDFRONT', { status: cloudfrontStatus, timestamp: Date.now() });
    
    logger.info(`État des CDNs - Bunny: ${bunnyStatus ? 'OK' : 'KO'}, CloudFront: ${cloudfrontStatus ? 'OK' : 'KO'}`);
    
    // Émettre un événement pour informer l'application
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('flodrama:cdn-status-updated', { 
        detail: { 
          bunny: bunnyStatus,
          cloudfront: cloudfrontStatus,
          timestamp: Date.now()
        }
      }));
    }
  } catch (error) {
    logger.error('Erreur lors de la vérification des CDNs', error);
  }
};

/**
 * Vérifie si un CDN est accessible
 * @param {string} baseUrl - URL de base du CDN
 * @returns {Promise<boolean>} - true si le CDN est disponible
 */
const checkCdnStatus = async (baseUrl) => {
  try {
    // Utiliser un fichier de test pour vérifier l'état du CDN
    const testUrl = `${baseUrl}/status.json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 secondes
    
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    logger.warn(`CDN inaccessible: ${baseUrl}`, error.message);
    return false;
  }
};

/**
 * Gère les erreurs de chargement d'images
 * @param {Event} event - Événement d'erreur
 */
export const handleImageError = (event) => {
  try {
    const img = event.target;
    const contentId = img.dataset.contentId;
    const type = img.dataset.type || IMAGE_TYPES.POSTER;
    const currentUrl = img.src;
    
    logger.debug(`Erreur de chargement d'image: ${currentUrl}`);
    
    // Éviter les boucles infinies
    if (processedUrls.has(currentUrl)) {
      logger.debug(`URL déjà traitée, passage au SVG: ${currentUrl}`);
      applyFallbackSvg(img, contentId, type);
      return;
    }
    
    processedUrls.add(currentUrl);
    
    // Essayer de récupérer des informations supplémentaires sur le contenu
    getContentInfo(contentId).then(contentInfo => {
      // Générer les sources alternatives
      const sources = generateImageSources(contentId, type, contentInfo);
      
      // Trouver l'index de la source actuelle
      const currentIndex = sources.findIndex(source => source === currentUrl);
      
      // Si on n'est pas à la dernière source, essayer la suivante
      if (currentIndex < sources.length - 1 && currentIndex !== -1) {
        const nextSource = sources[currentIndex + 1];
        logger.debug(`Fallback d'image: ${currentUrl} -> ${nextSource}`);
        img.src = nextSource;
        
        // Enregistrer la tentative dans le cache
        const cacheKey = `${type}-${contentId}`;
        imageLoadingCache.set(cacheKey, { 
          currentSource: nextSource,
          attempts: (imageLoadingCache.get(cacheKey)?.attempts || 0) + 1,
          timestamp: Date.now()
        });
      } else {
        // Si toutes les sources ont échoué, utiliser un SVG intégré
        applyFallbackSvg(img, contentId, type, contentInfo);
      }
    }).catch(error => {
      // En cas d'erreur, utiliser un SVG de fallback
      logger.error(`Erreur lors de la récupération des informations de contenu: ${error.message}`);
      applyFallbackSvg(img, contentId, type);
    });
  } catch (error) {
    logger.error('Erreur dans le gestionnaire de fallback d\'images:', error);
    // En cas d'erreur, appliquer un SVG de secours
    try {
      applyFallbackSvg(event.target, event.target.dataset.contentId || 'unknown', 
                      event.target.dataset.type || IMAGE_TYPES.POSTER);
    } catch (fallbackError) {
      logger.error('Erreur critique dans le fallback SVG:', fallbackError);
    }
  }
};

/**
 * Récupère des informations supplémentaires sur un contenu
 * @param {string} contentId - ID du contenu
 * @returns {Promise<Object>} - Informations sur le contenu
 */
const getContentInfo = async (contentId) => {
  if (!contentId) return null;
  
  try {
    // Vérifier si ContentDataService est disponible
    if (ContentDataService && ContentDataService.getContentById) {
      const contentInfo = await ContentDataService.getContentById(contentId);
      if (contentInfo) {
        return contentInfo;
      }
    }
    
    // Si pas d'info dans ContentDataService, essayer SmartScrapingService
    if (SmartScrapingService && SmartScrapingService.getContentDetails) {
      const contentDetails = await SmartScrapingService.getContentDetails(contentId);
      if (contentDetails) {
        return contentDetails;
      }
    }
    
    return null;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des informations pour ${contentId}:`, error);
    return null;
  }
};

/**
 * Génère les sources d'images alternatives pour un contenu
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @param {Object} contentInfo - Informations sur le contenu (optionnel)
 * @returns {Array<string>} - Liste des URLs alternatives
 */
const generateImageSources = (contentId, type, contentInfo = null) => {
  // Obtenir les sources actives triées par priorité
  const activeSources = Object.values(IMAGE_SOURCES)
    .filter(source => source.enabled)
    .sort((a, b) => a.priority - b.priority);
  
  // Sources spécifiques au contenu si disponibles
  const contentSources = [];
  
  // Si nous avons des informations sur le contenu, ajouter ses sources spécifiques
  if (contentInfo) {
    // Ajouter l'URL d'image principale du contenu si disponible
    if (contentInfo.image) {
      contentSources.push(contentInfo.image);
    }
    
    // Ajouter les URLs spécifiques au type
    if (type === IMAGE_TYPES.POSTER && contentInfo.poster) {
      contentSources.push(contentInfo.poster);
    } else if (type === IMAGE_TYPES.BACKDROP && contentInfo.backdrop) {
      contentSources.push(contentInfo.backdrop);
    } else if (type === IMAGE_TYPES.THUMBNAIL && contentInfo.thumbnail) {
      contentSources.push(contentInfo.thumbnail);
    }
    
    // Ajouter les sources alternatives si disponibles
    if (contentInfo.alternativeImages && Array.isArray(contentInfo.alternativeImages)) {
      contentSources.push(...contentInfo.alternativeImages);
    }
  }
  
  // Générer les URLs pour chaque source générique
  const genericSources = activeSources.map(source => {
    // Construire le chemin selon le type d'image
    let path;
    switch (type) {
      case IMAGE_TYPES.POSTER:
        path = `${source.baseUrl}/${type}s/${contentId}.jpg`;
        break;
      case IMAGE_TYPES.BACKDROP:
        path = `${source.baseUrl}/${type}s/${contentId}.jpg`;
        break;
      case IMAGE_TYPES.THUMBNAIL:
        path = `${source.baseUrl}/${type}s/${contentId}.jpg`;
        break;
      case IMAGE_TYPES.PROFILE:
        path = `${source.baseUrl}/${type}s/${contentId}.jpg`;
        break;
      case IMAGE_TYPES.LOGO:
        path = `${source.baseUrl}/${type}s/${contentId}.png`;
        break;
      default:
        path = `${source.baseUrl}/${type}s/${contentId}.jpg`;
    }
    
    return path;
  });
  
  // Combiner les sources spécifiques au contenu et les sources génériques
  // Les sources spécifiques ont une priorité plus élevée
  return [...new Set([...contentSources, ...genericSources])];
};

/**
 * Applique un SVG de fallback comme image
 * @param {HTMLImageElement} img - Élément image
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @param {Object} contentInfo - Informations sur le contenu (optionnel)
 */
const applyFallbackSvg = (img, contentId, type, contentInfo = null) => {
  // Utiliser un SVG intégré comme solution de dernier recours
  const title = img.alt || (contentInfo ? contentInfo.title : null) || contentId || 'FloDrama';
  
  // Générer un dégradé spécifique au contenu basé sur son ID
  const colorIndex = contentId ? parseInt(contentId.replace(/\D/g, '') || '0') % 8 : 0;
  
  // Utiliser les couleurs de l'identité visuelle de FloDrama
  const colors = [
    ['#3b82f6', '#1e40af'], // Bleu foncé
    ['#d946ef', '#9333ea'], // Fuchsia
    ['#3b82f6', '#6366f1'], // Bleu-indigo
    ['#d946ef', '#ec4899'], // Fuchsia-rose
    ['#3b82f6', '#0ea5e9'], // Bleu-ciel
    ['#d946ef', '#c026d3'], // Fuchsia-violet
    ['#3b82f6', '#2563eb'], // Bleu royal
    ['#d946ef', '#be185d']  // Fuchsia-rose foncé
  ];
  
  const [color1, color2] = colors[colorIndex];
  
  // Adapter les dimensions selon le type d'image
  let width, height;
  switch (type) {
    case IMAGE_TYPES.POSTER:
      width = 300;
      height = 450;
      break;
    case IMAGE_TYPES.BACKDROP:
      width = 500;
      height = 281;
      break;
    case IMAGE_TYPES.THUMBNAIL:
      width = 200;
      height = 200;
      break;
    case IMAGE_TYPES.PROFILE:
      width = 300;
      height = 300;
      break;
    default:
      width = 300;
      height = 450;
  }
  
  // Informations supplémentaires à afficher dans le SVG
  let extraInfo = '';
  if (contentInfo) {
    const year = contentInfo.year || '';
    const country = contentInfo.country || '';
    const genres = Array.isArray(contentInfo.genres) ? contentInfo.genres.slice(0, 2).join(', ') : '';
    
    if (year || country || genres) {
      extraInfo = `<text x="${width/2}" y="${height/2 + 30}" fill="white" text-anchor="middle" font-family="SF Pro Display, sans-serif" font-size="${Math.min(width, height) * 0.05}px">${year} ${country} ${genres}</text>`;
    }
  }
  
  // Créer un SVG intégré avec le dégradé et le titre
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
      <defs>
        <linearGradient id="grad${contentId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad${contentId})" />
      <text x="${width/2}" y="${height/2}" fill="white" text-anchor="middle" dominant-baseline="middle" 
            font-family="SF Pro Display, sans-serif" font-weight="bold" font-size="${Math.min(width, height) * 0.08}px">${title}</text>
      ${extraInfo}
    </svg>
  `;
  
  // Convertir le SVG en Data URL
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  
  // Appliquer le SVG comme source de l'image
  img.src = svgDataUrl;
  
  // Ajouter une classe pour le style
  img.classList.add('fallback-image');
  img.classList.add(`${type}-fallback`);
  
  logger.warn(`SVG fallback appliqué pour ${contentId} (${type})`);
  
  // Enregistrer l'événement dans les statistiques
  if (typeof window !== 'undefined' && window._flodramaStats) {
    if (!window._flodramaStats.imageFallbacks) {
      window._flodramaStats.imageFallbacks = {};
    }
    if (!window._flodramaStats.imageFallbacks[type]) {
      window._flodramaStats.imageFallbacks[type] = 0;
    }
    window._flodramaStats.imageFallbacks[type]++;
  }
};

/**
 * Précharge une image avec gestion des fallbacks
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @returns {Promise<string>} - URL de l'image préchargée
 */
export const preloadImage = async (contentId, type = IMAGE_TYPES.POSTER) => {
  try {
    // Récupérer des informations sur le contenu
    const contentInfo = await getContentInfo(contentId);
    
    // Générer les sources possibles
    const sources = generateImageSources(contentId, type, contentInfo);
    
    return new Promise((resolve, reject) => {
      // Fonction récursive pour essayer chaque source
      const trySource = (index) => {
        if (index >= sources.length) {
          // Si toutes les sources ont échoué, générer un SVG
          const svgUrl = generateSvgDataUrl(contentId, type, contentInfo);
          resolve(svgUrl);
          return;
        }
        
        const url = sources[index];
        const img = new Image();
        
        img.onload = () => {
          // Enregistrer le succès dans le cache
          const cacheKey = `${type}-${contentId}`;
          imageLoadingCache.set(cacheKey, { 
            currentSource: url,
            success: true,
            timestamp: Date.now()
          });
          
          resolve(url);
        };
        
        img.onerror = () => {
          logger.debug(`Échec du préchargement: ${url}, essai suivant...`);
          trySource(index + 1);
        };
        
        img.src = url;
      };
      
      // Commencer par la première source
      trySource(0);
    });
  } catch (error) {
    logger.error(`Erreur lors du préchargement de l'image ${contentId}:`, error);
    // En cas d'erreur, générer un SVG
    return generateSvgDataUrl(contentId, type);
  }
};

/**
 * Génère une URL de données SVG pour un contenu
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @param {Object} contentInfo - Informations sur le contenu (optionnel)
 * @returns {string} - URL de données SVG
 */
const generateSvgDataUrl = (contentId, type, contentInfo = null) => {
  // Générer un dégradé spécifique au contenu
  const colorIndex = contentId ? parseInt(contentId.replace(/\D/g, '') || '0') % 8 : 0;
  
  // Utiliser les couleurs de l'identité visuelle
  const colors = [
    ['#3b82f6', '#1e40af'],
    ['#d946ef', '#9333ea'],
    ['#3b82f6', '#6366f1'],
    ['#d946ef', '#ec4899'],
    ['#3b82f6', '#0ea5e9'],
    ['#d946ef', '#c026d3'],
    ['#3b82f6', '#2563eb'],
    ['#d946ef', '#be185d']
  ];
  
  const [color1, color2] = colors[colorIndex];
  
  // Adapter les dimensions selon le type d'image
  let width, height;
  switch (type) {
    case IMAGE_TYPES.POSTER:
      width = 300;
      height = 450;
      break;
    case IMAGE_TYPES.BACKDROP:
      width = 500;
      height = 281;
      break;
    case IMAGE_TYPES.THUMBNAIL:
      width = 200;
      height = 200;
      break;
    case IMAGE_TYPES.PROFILE:
      width = 300;
      height = 300;
      break;
    default:
      width = 300;
      height = 450;
  }
  
  // Titre à afficher
  const title = contentInfo ? contentInfo.title : contentId || 'FloDrama';
  
  // Informations supplémentaires à afficher dans le SVG
  let extraInfo = '';
  if (contentInfo) {
    const year = contentInfo.year || '';
    const country = contentInfo.country || '';
    const genres = Array.isArray(contentInfo.genres) ? contentInfo.genres.slice(0, 2).join(', ') : '';
    
    if (year || country || genres) {
      extraInfo = `<text x="${width/2}" y="${height/2 + 30}" fill="white" text-anchor="middle" font-family="SF Pro Display, sans-serif" font-size="${Math.min(width, height) * 0.05}px">${year} ${country} ${genres}</text>`;
    }
  }
  
  // Créer un SVG avec le dégradé
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
      <defs>
        <linearGradient id="grad${contentId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad${contentId})" />
      <text x="${width/2}" y="${height/2}" fill="white" text-anchor="middle" dominant-baseline="middle" 
            font-family="SF Pro Display, sans-serif" font-weight="bold" font-size="${Math.min(width, height) * 0.08}px">${title}</text>
      ${extraInfo}
    </svg>
  `;
  
  // Convertir le SVG en Data URL
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
};

/**
 * Obtient l'URL optimale pour une image de contenu
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @param {Object} options - Options supplémentaires (taille, etc.)
 * @returns {string} - URL de l'image
 */
export const getOptimalImageUrl = async (contentId, type = IMAGE_TYPES.POSTER, options = {}) => {
  const { size = 'medium' } = options;
  
  try {
    // Vérifier si l'image est dans le cache de chargement
    const cacheKey = `${type}-${contentId}`;
    const cachedImage = imageLoadingCache.get(cacheKey);
    
    // Si l'image a déjà été chargée avec succès, utiliser cette source
    if (cachedImage && cachedImage.success) {
      return cachedImage.currentSource;
    }
    
    // Récupérer des informations sur le contenu
    const contentInfo = await getContentInfo(contentId);
    
    // Si nous avons des informations sur le contenu avec une URL d'image spécifique
    if (contentInfo) {
      if (type === IMAGE_TYPES.POSTER && contentInfo.poster) {
        return contentInfo.poster;
      } else if (type === IMAGE_TYPES.BACKDROP && contentInfo.backdrop) {
        return contentInfo.backdrop;
      } else if (type === IMAGE_TYPES.THUMBNAIL && contentInfo.thumbnail) {
        return contentInfo.thumbnail;
      } else if (contentInfo.image) {
        return contentInfo.image;
      }
    }
    
    // Vérifier l'état des CDNs
    const bunnyAvailable = cdnStatusCache.get('BUNNY_CDN')?.status !== false;
    const cloudfrontAvailable = cdnStatusCache.get('CLOUDFRONT')?.status !== false;
    
    // Utiliser la source la plus fiable selon l'état des CDNs
    if (bunnyAvailable) {
      // Utiliser Bunny CDN
      switch (type) {
        case IMAGE_TYPES.POSTER:
          return getPosterUrl(`/posters/${contentId}.jpg`, size);
        case IMAGE_TYPES.BACKDROP:
          return getBackdropUrl(`/backdrops/${contentId}.jpg`, size);
        default:
          return getMediaUrl(`/${type}s/${contentId}.jpg`);
      }
    } else if (cloudfrontAvailable) {
      // Fallback vers CloudFront
      return `https://d2ra390ol17u3n.cloudfront.net/${type}s/${contentId}.jpg`;
    } else {
      // Fallback vers GitHub Pages
      return `/${type}s/${contentId}.jpg`;
    }
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'URL optimale pour ${contentId}:`, error);
    return `/${type}s/${contentId}.jpg`; // Fallback vers URL relative
  }
};

/**
 * Récupère les statistiques du gestionnaire d'images
 * @returns {Object} - Statistiques
 */
export const getImageManagerStats = () => {
  return {
    cdnStatus: {
      bunny: cdnStatusCache.get('BUNNY_CDN')?.status || false,
      cloudfront: cdnStatusCache.get('CLOUDFRONT')?.status || false,
      lastCheck: cdnStatusCache.get('BUNNY_CDN')?.timestamp || Date.now()
    },
    cache: {
      processedUrls: processedUrls.size,
      imageLoadingCache: imageLoadingCache.size
    },
    timestamp: Date.now()
  };
};

// Exporter les constantes et fonctions utiles
export const ImageTypes = IMAGE_TYPES;
export default {
  initImageManager,
  handleImageError,
  preloadImage,
  getOptimalImageUrl,
  getImageManagerStats,
  ImageTypes
};
