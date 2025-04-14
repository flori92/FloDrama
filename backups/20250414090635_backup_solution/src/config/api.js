/**
 * Configuration de l'API pour FloDrama
 * Contient les URLs et paramètres pour les différentes API utilisées
 */

// URL de base de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.flodrama.com/v1';

// Timeout par défaut pour les requêtes API (en ms)
const DEFAULT_TIMEOUT = 15000;

// Configuration des endpoints
const ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  
  // Utilisateurs
  USERS: {
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    AVATAR: '/users/avatar',
    FRIENDS: '/users/friends',
  },
  
  // Contenu
  CONTENT: {
    SEARCH: '/content/search',
    DETAILS: '/content/details',
    RECOMMENDATIONS: '/content/recommendations',
    TRENDING: '/content/trending',
    CATEGORIES: '/content/categories',
  },
  
  // Watchlist
  WATCHLIST: {
    LIST: '/watchlist',
    ADD: '/watchlist/add',
    REMOVE: '/watchlist/remove',
    REORDER: '/watchlist/reorder',
  },
  
  // Ratings
  RATINGS: {
    GET: '/ratings',
    ADD: '/ratings/add',
    UPDATE: '/ratings/update',
    DELETE: '/ratings/delete',
  },
  
  // Watch Parties
  WATCH_PARTY: {
    CREATE: '/watch-party/create',
    JOIN: '/watch-party/join',
    LEAVE: '/watch-party/leave',
    DETAILS: '/watch-party/details',
    UPDATE: '/watch-party/update',
    INVITE: '/watch-party/invite',
    MESSAGES: '/watch-party/messages',
    SYNC: '/watch-party/sync',
  },
  
  // Metadata
  METADATA: {
    ACTORS: '/metadata/actors',
    DIRECTORS: '/metadata/directors',
    GENRES: '/metadata/genres',
    STUDIOS: '/metadata/studios',
  },
  
  // Analytics
  ANALYTICS: {
    TRACK: '/analytics/track',
    EVENTS: '/analytics/events',
  },
};

// Headers par défaut
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Configuration pour AWS
const AWS_CONFIG = {
  region: 'eu-west-3',
  identityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID,
  userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID,
  userPoolWebClientId: process.env.REACT_APP_AWS_USER_POOL_CLIENT_ID,
};

// Export de la configuration
export default {
  API_BASE_URL,
  DEFAULT_TIMEOUT,
  ENDPOINTS,
  DEFAULT_HEADERS,
  AWS_CONFIG,
};

// Export des éléments individuels pour faciliter l'import
export {
  API_BASE_URL,
  DEFAULT_TIMEOUT,
  ENDPOINTS,
  DEFAULT_HEADERS,
  AWS_CONFIG,
};
