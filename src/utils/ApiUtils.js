/**
 * Utilitaires pour la gestion des API
 * 
 * Ce fichier contient des fonctions utilitaires pour la gestion des endpoints API
 * et la configuration des requêtes HTTP.
 */

// Configuration des environnements
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:54112',
    paymentEndpoint: '',
    authEndpoint: '/auth-service',
    contentEndpoint: '/content-service'
  },
  staging: {
    baseUrl: 'https://api-staging.flodrama.com',
    paymentEndpoint: '/payment-service',
    authEndpoint: '/auth-service',
    contentEndpoint: '/content-service'
  },
  production: {
    baseUrl: 'https://api.flodrama.com',
    paymentEndpoint: '/payment-service',
    authEndpoint: '/auth-service',
    contentEndpoint: '/content-service'
  }
};

/**
 * Détermine l'environnement actuel (development, staging, production)
 * @returns {string} Nom de l'environnement
 */
export const getEnvironment = () => {
  // En production, cette valeur serait définie dans le processus de build
  const env = process.env.REACT_APP_ENV || 'development';
  return env;
};

/**
 * Récupère la configuration API pour l'environnement actuel
 * @returns {Object} Configuration API
 */
export const getApiConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env] || API_CONFIG.development;
};

/**
 * Récupère l'URL de base de l'API
 * @returns {string} URL de base
 */
export const getBaseUrl = () => {
  return getApiConfig().baseUrl;
};

/**
 * Récupère l'endpoint complet pour le service de paiement
 * @returns {string} Endpoint du service de paiement
 */
export const getApiEndpoint = () => {
  const config = getApiConfig();
  return `${config.baseUrl}${config.paymentEndpoint}`;
};

/**
 * Récupère l'endpoint complet pour le service d'authentification
 * @returns {string} Endpoint du service d'authentification
 */
export const getAuthEndpoint = () => {
  const config = getApiConfig();
  return `${config.baseUrl}${config.authEndpoint}`;
};

/**
 * Récupère l'endpoint complet pour le service de contenu
 * @returns {string} Endpoint du service de contenu
 */
export const getContentEndpoint = () => {
  const config = getApiConfig();
  return `${config.baseUrl}${config.contentEndpoint}`;
};

/**
 * Construit une URL complète pour un endpoint spécifique
 * @param {string} endpoint - Endpoint relatif
 * @returns {string} URL complète
 */
export const buildApiUrl = (endpoint) => {
  return `${getBaseUrl()}${endpoint}`;
};

/**
 * Vérifie si l'API est accessible
 * @returns {Promise<boolean>} True si l'API est accessible
 */
export const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/health`);
    return response.status === 200;
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité de l\'API:', error);
    return false;
  }
};

/**
 * Formate les paramètres de requête pour une URL
 * @param {Object} params - Paramètres à formater
 * @returns {string} Chaîne de paramètres formatée
 */
export const formatQueryParams = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  
  return queryString ? `?${queryString}` : '';
};

/**
 * Construit un objet d'en-têtes HTTP standard
 * @param {Object} additionalHeaders - En-têtes supplémentaires
 * @returns {Object} En-têtes HTTP
 */
export const buildHeaders = (additionalHeaders = {}) => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...additionalHeaders
  };
};

// Exporter les fonctions utilitaires
export default {
  getEnvironment,
  getApiConfig,
  getBaseUrl,
  getApiEndpoint,
  getAuthEndpoint,
  getContentEndpoint,
  buildApiUrl,
  checkApiAvailability,
  formatQueryParams,
  buildHeaders
};
