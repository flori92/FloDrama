/**
 * Configuration unifiée pour FloDrama
 * Ce fichier centralise toutes les configurations liées aux ressources
 * Adapté pour le déploiement sur Vercel
 */

const VERCEL_CONFIG = {
  // Configuration des ressources
  resources: {
    // URL de base (sera remplacée par l'URL Vercel après déploiement)
    baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://flodrama.vercel.app',
    // Chemins pour différents types de ressources
    paths: {
      media: '/media',
      static: '/static',
      data: '/data',
      posters: '/media/posters',
      backdrops: '/media/backdrops',
      thumbnails: '/media/thumbnails',
      episodes: '/media/episodes',
      metadata: '/data/metadata.json',
      subtitles: '/media/subtitles'
    }
  },
  
  // Configuration API
  api: {
    // L'API sera servie directement par Vercel Functions
    baseUrl: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'https://flodrama.vercel.app/api',
    endpoints: {
      metadata: '/metadata',
      users: '/users',
      watchlist: '/watchlist',
      history: '/history'
    }
  },
  
  // Mode local pour le développement
  useLocalMode: process.env.NODE_ENV === 'development',
  
  // Mode de développement
  isDev: process.env.NODE_ENV === 'development' || 
         (typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || 
           window.location.hostname.includes('vercel-dev') || 
           window.location.hostname.includes('preview')))
};

/**
 * Obtient l'URL d'une affiche de contenu
 * @param {string} id Identifiant du contenu
 * @returns {string} URL de l'affiche
 */
export const getPosterUrl = (id) => {
  if (VERCEL_CONFIG.useLocalMode) {
    return `/assets/media/posters/${id}.jpg`;
  } else {
    return `${VERCEL_CONFIG.resources.baseUrl}${VERCEL_CONFIG.resources.paths.posters}/${id}.jpg`;
  }
};

/**
 * Obtient l'URL d'une image d'arrière-plan
 * @param {string} id Identifiant du contenu
 * @returns {string} URL de l'image d'arrière-plan
 */
export const getBackdropUrl = (id) => {
  if (VERCEL_CONFIG.useLocalMode) {
    return `/assets/media/backdrops/${id}.jpg`;
  } else {
    return `${VERCEL_CONFIG.resources.baseUrl}${VERCEL_CONFIG.resources.paths.backdrops}/${id}.jpg`;
  }
};

/**
 * Obtient l'URL d'une miniature
 * @param {string} id Identifiant du contenu
 * @returns {string} URL de la miniature
 */
export const getThumbnailUrl = (id) => {
  if (VERCEL_CONFIG.useLocalMode) {
    return `/assets/media/thumbnails/${id}.jpg`;
  } else {
    return `${VERCEL_CONFIG.resources.baseUrl}${VERCEL_CONFIG.resources.paths.thumbnails}/${id}.jpg`;
  }
};

/**
 * Obtient l'URL des métadonnées
 * @returns {string} URL des métadonnées
 */
export const getMetadataUrl = () => {
  if (VERCEL_CONFIG.useLocalMode) {
    return `/assets/data/metadata.json`;
  } else {
    return `${VERCEL_CONFIG.resources.baseUrl}${VERCEL_CONFIG.resources.paths.metadata}`;
  }
};

/**
 * Obtient l'URL de l'API
 * @param {string} endpoint Point de terminaison de l'API
 * @returns {string} URL de l'API
 */
export const getApiUrl = (endpoint) => {
  return `${VERCEL_CONFIG.api.baseUrl}${endpoint}`;
};

export default VERCEL_CONFIG;
