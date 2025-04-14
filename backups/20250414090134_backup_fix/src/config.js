/**
 * Configuration globale de l'application
 * 
 * Ce fichier centralise toutes les configurations de l'application
 * et permet de les surcharger en fonction de l'environnement.
 */

// Configuration par défaut
const defaultConfig = {
  // URLs de base
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.flodrama.com/api' 
    : 'http://localhost:4000/api',
  
  CLOUDFRONT_URL: process.env.NODE_ENV === 'production'
    ? 'https://d1x7zurbps6occ.cloudfront.net'
    : '',
  
  // Options de fonctionnalités
  USE_API_SERVICE: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  USE_MOCK_DATA: process.env.NODE_ENV === 'production' ? 'false' : 'true',
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  
  // Options de cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes en millisecondes
  
  // Options d'interface
  THEME: 'dark',
  LANGUAGE: 'fr',
  
  // Options de développement
  DEBUG_MODE: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
};

// Configuration spécifique à l'environnement
const envConfig = {};

// Configuration globale fusionnée
const config = {
  ...defaultConfig,
  ...envConfig
};

// Configuration spécifique au navigateur (si disponible)
if (typeof window !== 'undefined' && window.APP_CONFIG) {
  Object.assign(config, window.APP_CONFIG);
}

/**
 * Récupère une valeur de configuration
 * @param {string} key - Clé de configuration
 * @param {any} defaultValue - Valeur par défaut si la clé n'existe pas
 * @returns {any} Valeur de configuration
 */
export const getConfig = (key, defaultValue) => {
  if (config[key] !== undefined) {
    return config[key];
  }
  return defaultValue;
};

/**
 * Définit une valeur de configuration
 * @param {string} key - Clé de configuration
 * @param {any} value - Valeur à définir
 */
export const setConfig = (key, value) => {
  config[key] = value;
  
  // Si nous sommes dans un navigateur, mettre à jour la configuration globale
  if (typeof window !== 'undefined') {
    if (!window.APP_CONFIG) {
      window.APP_CONFIG = {};
    }
    window.APP_CONFIG[key] = value;
  }
};

/**
 * Récupère l'URL complète pour une ressource statique
 * @param {string} path - Chemin relatif de la ressource
 * @returns {string} URL complète
 */
export const getStaticResourceUrl = (path) => {
  if (!path) return '';
  
  // Normaliser le chemin
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // En production, utiliser l'URL CloudFront
  if (process.env.NODE_ENV === 'production') {
    const cloudFrontUrl = getConfig('CLOUDFRONT_URL', '');
    if (cloudFrontUrl) {
      return `${cloudFrontUrl}${normalizedPath}`;
    }
  }
  
  // En développement, utiliser le chemin relatif
  return path;
};

export default config;
