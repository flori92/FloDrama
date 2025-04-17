/**
 * Configuration de Bunny CDN pour FloDrama
 * Paramètres de connexion et fonctions utilitaires
 */

// Paramètres de base
export const BUNNY_CDN_CONFIG = {
  // Pull Zone ID: 3467614 (flodrama-videos)
  pullZoneId: 3467614,
  // Hostname personnalisé
  hostname: 'videos.flodrama.com',
  // URL de base pour les requêtes
  baseUrl: 'https://videos.flodrama.com',
  // URL de fallback (CloudFront)
  fallbackUrl: 'https://d2ra390ol17u3n.cloudfront.net',
  // Paramètres de sécurité
  security: {
    // Activation de la protection par token
    tokenProtection: true,
    // Nom du paramètre de token
    tokenName: 'token',
    // Durée de validité du token (en secondes)
    tokenExpiration: 3600
  },
  // Qualités vidéo disponibles
  qualities: [
    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
    { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
    { name: '480p', width: 854, height: 480, bitrate: '1000k' },
    { name: '360p', width: 640, height: 360, bitrate: '500k' }
  ],
  // Paramètres de performance
  performance: {
    // Délai avant de basculer vers le fallback (en ms)
    fallbackTimeout: 5000,
    // Nombre maximal de tentatives
    maxRetries: 3,
    // Délai entre les tentatives (en ms)
    retryDelay: 1000
  }
};

/**
 * Obtient la qualité vidéo optimale en fonction de la connexion
 * @returns {string} Nom de la qualité optimale
 */
export const getOptimalQuality = () => {
  // Détection de la connexion réseau
  const connection = navigator.connection || 
                    navigator.mozConnection || 
                    navigator.webkitConnection;
  
  if (connection) {
    // Adapter la qualité en fonction du type de connexion
    const { effectiveType, downlink } = connection;
    
    if (effectiveType === '4g' && downlink > 5) {
      return '1080p';
    } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
      return '720p';
    } else if (effectiveType === '3g' || (effectiveType === '2g' && downlink > 0.5)) {
      return '480p';
    } else {
      return '360p';
    }
  }
  
  // Par défaut, retourner 720p
  return '720p';
};

/**
 * Vérifie si le navigateur est compatible avec les fonctionnalités requises
 * @returns {boolean} Compatibilité du navigateur
 */
export const checkBrowserCompatibility = () => {
  // Vérifier la prise en charge de Fetch API
  const hasFetch = 'fetch' in window;
  
  // Vérifier la prise en charge des Promises
  const hasPromise = 'Promise' in window;
  
  // Vérifier la prise en charge des AbortController
  const hasAbortController = 'AbortController' in window;
  
  // Vérifier la prise en charge des vidéos HTML5
  const hasVideo = !!document.createElement('video').canPlayType;
  
  return hasFetch && hasPromise && hasAbortController && hasVideo;
};

/**
 * Génère une URL avec les paramètres de qualité
 * @param {string} baseUrl - URL de base
 * @param {string} quality - Qualité vidéo
 * @returns {string} URL complète
 */
export const generateQualityUrl = (baseUrl, quality = '720p') => {
  // Vérifier que la qualité demandée existe
  const qualityConfig = BUNNY_CDN_CONFIG.qualities.find(q => q.name === quality);
  
  // Si la qualité n'existe pas, utiliser 720p par défaut
  const selectedQuality = qualityConfig || BUNNY_CDN_CONFIG.qualities.find(q => q.name === '720p');
  
  // Construire l'URL avec les paramètres de qualité
  return `${baseUrl}?quality=${selectedQuality.name}`;
};

// Définir l'objet à exporter par défaut
const bunnyCdnConfig = {
  BUNNY_CDN_CONFIG,
  getOptimalQuality,
  checkBrowserCompatibility,
  generateQualityUrl
};

export default bunnyCdnConfig;
