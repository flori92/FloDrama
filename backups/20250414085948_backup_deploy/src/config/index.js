/**
 * Configuration centrale pour l'application FloDrama
 * Exporte les fonctions de gestion de configuration
 */

// Configuration par défaut
const defaultConfig = {
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://52mogggci6.execute-api.eu-west-3.amazonaws.com/prod',
  CLOUDFRONT_URL: process.env.VITE_CLOUDFRONT_URL || 'https://d2u5z0ywj8n2jz.cloudfront.net',
  ENABLE_FRENCH_MOVIES: process.env.VITE_ENABLE_FRENCH_MOVIES || 'true',
  LOG_LEVEL: process.env.VITE_LOG_LEVEL || 'INFO',
  CACHE_DURATION: 300000, // 5 minutes en millisecondes
  DEFAULT_LANGUAGE: 'fr',
  DEFAULT_REGION: 'FR',
  FEATURES: {
    FRENCH_MOVIES: true,
    WATCH_PARTY: true,
    RECOMMENDATIONS: true
  }
};

// Configuration en cours d'utilisation (peut être modifiée à l'exécution)
let runtimeConfig = { ...defaultConfig };

/**
 * Récupère une valeur de configuration
 * @param {string} key - Clé de configuration à récupérer
 * @param {any} defaultValue - Valeur par défaut si la clé n'existe pas
 * @returns {any} Valeur de configuration
 */
export const getConfig = (key, defaultValue = undefined) => {
  if (key in runtimeConfig) {
    return runtimeConfig[key];
  }
  return defaultValue;
};

/**
 * Définit une valeur de configuration
 * @param {string} key - Clé de configuration à définir
 * @param {any} value - Valeur à définir
 */
export const setConfig = (key, value) => {
  runtimeConfig[key] = value;
};

/**
 * Réinitialise la configuration aux valeurs par défaut
 */
export const resetConfig = () => {
  runtimeConfig = { ...defaultConfig };
};

/**
 * Récupère l'URL complète pour une ressource statique
 * @param {string} path - Chemin de la ressource
 * @returns {string} URL complète
 */
export const getStaticResourceUrl = (path) => {
  // En production, utiliser CloudFront
  if (process.env.NODE_ENV === 'production') {
    const cloudFrontUrl = getConfig('CLOUDFRONT_URL');
    // S'assurer que le chemin commence par un slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${cloudFrontUrl}${normalizedPath}`;
  }
  
  // En développement, utiliser le chemin relatif
  return path;
};

/**
 * Récupère toute la configuration
 * @returns {Object} Configuration complète
 */
export const getAllConfig = () => {
  return { ...runtimeConfig };
};

// Créer un objet pour l'export par défaut
const configExport = {
  getConfig,
  setConfig,
  resetConfig,
  getAllConfig,
  getStaticResourceUrl
};

export default configExport;
