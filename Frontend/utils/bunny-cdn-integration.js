/**
 * Module d'intégration Bunny CDN pour FloDrama
 * Gère l'accès aux ressources médias (images et bandes-annonces) via Bunny CDN
 * avec fallback vers CloudFront
 */

import logger from '../utils/logger';

// Configuration Bunny CDN
const BUNNY_CONFIG = {
  pullZoneId: '3467614',
  hostname: 'videos.flodrama.com',
  imageHostname: 'images.flodrama.com',
  securityKey: process.env.REACT_APP_BUNNY_SECURITY_KEY || '',
  enabled: true
};

// Configuration CloudFront (fallback)
const CLOUDFRONT_CONFIG = {
  domain: 'd2ra390ol17u3n.cloudfront.net',
  enabled: true
};

// Types de ressources
const RESOURCE_TYPES = {
  IMAGE: 'image',
  TRAILER: 'trailer',
  THUMBNAIL: 'thumbnail',
  POSTER: 'poster',
  BACKDROP: 'backdrop'
};

/**
 * Initialise l'intégration Bunny CDN
 * @returns {Function} - Fonction de nettoyage
 */
export const initBunnyCDN = () => {
  logger.info('Initialisation de Bunny CDN pour les ressources médias');
  
  // Vérifier si Bunny CDN est accessible
  checkBunnyCDNStatus()
    .then(isAvailable => {
      if (!isAvailable) {
        logger.warn('Bunny CDN n\'est pas disponible, utilisation du fallback CloudFront');
        BUNNY_CONFIG.enabled = false;
      }
    })
    .catch(error => {
      logger.error('Erreur lors de la vérification de Bunny CDN', error);
      BUNNY_CONFIG.enabled = false;
    });
  
  return () => {
    logger.debug('Nettoyage de l\'intégration Bunny CDN');
  };
};

/**
 * Vérifie si Bunny CDN est accessible
 * @returns {Promise<boolean>} - true si Bunny CDN est disponible, false sinon
 */
const checkBunnyCDNStatus = async () => {
  try {
    // Essayer d'abord le fichier local pour le développement
    try {
      const localStatusUrl = '/data/status.json';
      const localResponse = await fetch(localStatusUrl);
      if (localResponse.ok) {
        return true;
      }
    } catch (localError) {
      console.log('Fichier de statut local non disponible, tentative avec Bunny CDN...');
    }
    
    // Essayer ensuite Bunny CDN
    const testUrl = `https://${BUNNY_CONFIG.hostname}/status.json`;
    const response = await fetch(testUrl, { method: 'HEAD', timeout: 3000 });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Génère une URL signée pour Bunny CDN
 * @param {string} path - Chemin de la ressource
 * @param {number} expiration - Durée de validité en secondes
 * @returns {string} - URL signée
 */
const generateSignedUrl = (path, expiration = 3600) => {
  if (!BUNNY_CONFIG.securityKey) {
    return `https://${BUNNY_CONFIG.hostname}${path}`;
  }
  
  const expires = Math.floor(Date.now() / 1000) + expiration;
  const signature = btoa(`${BUNNY_CONFIG.securityKey}${path}${expires}`);
  
  return `https://${BUNNY_CONFIG.hostname}${path}?token=${signature}&expires=${expires}`;
};

/**
 * Obtient l'URL d'une ressource média
 * @param {string} path - Chemin de la ressource
 * @param {string} type - Type de ressource (image, trailer, etc.)
 * @param {Object} options - Options supplémentaires
 * @returns {string} - URL de la ressource
 */
export const getMediaUrl = (path, type = RESOURCE_TYPES.IMAGE, options = {}) => {
  // Si le chemin est déjà une URL complète, la retourner telle quelle
  if (path.startsWith('http')) {
    return path;
  }
  
  // Normaliser le chemin
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Déterminer le hostname en fonction du type de ressource
  let hostname = BUNNY_CONFIG.hostname;
  if (type === RESOURCE_TYPES.IMAGE || type === RESOURCE_TYPES.POSTER || type === RESOURCE_TYPES.BACKDROP || type === RESOURCE_TYPES.THUMBNAIL) {
    hostname = BUNNY_CONFIG.imageHostname;
  }
  
  // Utiliser Bunny CDN si disponible
  if (BUNNY_CONFIG.enabled) {
    // Générer une URL signée pour les bandes-annonces
    if (type === RESOURCE_TYPES.TRAILER) {
      return generateSignedUrl(normalizedPath, options.expiration || 3600);
    }
    
    // URL standard pour les images
    return `https://${hostname}${normalizedPath}`;
  }
  
  // Fallback vers CloudFront
  if (CLOUDFRONT_CONFIG.enabled) {
    return `https://${CLOUDFRONT_CONFIG.domain}${normalizedPath}`;
  }
  
  // Fallback vers l'URL relative (en cas d'échec des deux CDN)
  logger.warn(`Aucun CDN disponible pour ${normalizedPath}`);
  return normalizedPath;
};

/**
 * Précharge une image
 * @param {string} path - Chemin de l'image
 * @returns {Promise<string>} - URL de l'image préchargée
 */
export const preloadImage = (path) => {
  return new Promise((resolve, reject) => {
    const url = getMediaUrl(path, RESOURCE_TYPES.IMAGE);
    const img = new Image();
    
    img.onload = () => resolve(url);
    img.onerror = () => {
      logger.warn(`Échec du préchargement de l'image: ${url}`);
      reject(new Error(`Échec du préchargement: ${url}`));
    };
    
    img.src = url;
  });
};

/**
 * Obtient l'URL d'une image de poster
 * @param {string} path - Chemin du poster
 * @param {string} size - Taille du poster (small, medium, large)
 * @returns {string} - URL du poster
 */
export const getPosterUrl = (path, size = 'medium') => {
  if (!path) return '';
  
  // Ajouter le préfixe de taille si nécessaire
  let sizePath = path;
  if (!path.includes('/size/')) {
    const sizeValue = size === 'small' ? '300' : size === 'large' ? '800' : '500';
    sizePath = `/size/${sizeValue}${path}`;
  }
  
  return getMediaUrl(sizePath, RESOURCE_TYPES.POSTER);
};

/**
 * Obtient l'URL d'une image d'arrière-plan
 * @param {string} path - Chemin de l'image d'arrière-plan
 * @param {string} size - Taille de l'image (small, medium, large)
 * @returns {string} - URL de l'image d'arrière-plan
 */
export const getBackdropUrl = (path, size = 'large') => {
  if (!path) return '';
  
  // Ajouter le préfixe de taille si nécessaire
  let sizePath = path;
  if (!path.includes('/size/')) {
    const sizeValue = size === 'small' ? '500' : size === 'medium' ? '1280' : '1920';
    sizePath = `/size/${sizeValue}${path}`;
  }
  
  return getMediaUrl(sizePath, RESOURCE_TYPES.BACKDROP);
};

/**
 * Obtient l'URL d'une bande-annonce
 * @param {string} path - Chemin de la bande-annonce
 * @returns {string} - URL de la bande-annonce
 */
export const getTrailerUrl = (path) => {
  return getMediaUrl(path, RESOURCE_TYPES.TRAILER);
};

/**
 * Obtient l'URL d'une vidéo Bunny
 * @param {string} videoId - ID de la vidéo dans Bunny CDN
 * @param {Object} options - Options supplémentaires (qualité, etc.)
 * @returns {string} - URL de la vidéo
 */
export const getBunnyVideoUrl = (videoId, options = {}) => {
  if (!videoId) {
    logger.warn('ID de vidéo manquant pour getBunnyVideoUrl');
    return '';
  }
  
  const { quality = 720 } = options;
  
  if (BUNNY_CONFIG.enabled) {
    const path = `/videos/${videoId}/stream_${quality}p.mp4`;
    return generateSignedUrl(path);
  } else {
    // Fallback vers CloudFront
    return `https://${CLOUDFRONT_CONFIG.domain}/videos/${videoId}/stream_${quality}p.mp4`;
  }
};

// Exporter les types de ressources
export const MediaTypes = RESOURCE_TYPES;
