/**
 * Configuration AWS unifiée pour FloDrama
 * Ce fichier centralise toutes les configurations liées à AWS
 */

const AWS_CONFIG = {
  // Configuration CloudFront
  cloudFront: {
    // URL unique pour toutes les ressources CloudFront
    URL: '/assets/data',
    // Domaines pour différents types de ressources
    domains: {
      media: '/assets/media',
      static: '/assets/static',
      data: '/assets/data'
    },
    // Chemins pour différents types de ressources
    paths: {
      posters: '/posters',
      backdrops: '/backdrops',
      thumbnails: '/thumbnails',
      episodes: '/episodes',
      metadata: '/metadata',
      subtitles: '/subtitles'
    }
  },
  
  // Configuration S3
  s3: {
    buckets: {
      media: 'flodrama-media',
      static: 'flodrama-static',
      cache: 'flodrama-cache'
    },
    region: 'us-east-1'
  },
  
  // Configuration DynamoDB
  dynamoDB: {
    tables: {
      cache: 'FloDrama-Cache-production',
      users: 'FloDrama-Users-production',
      watchlist: 'FloDrama-Watchlist-production',
      history: 'FloDrama-History-production'
    },
    region: 'us-east-1'
  },
  
  // Configuration API Gateway
  apiGateway: {
    baseUrl: '/api',
    endpoints: {
      metadata: '/metadata',
      users: '/users',
      watchlist: '/watchlist',
      history: '/history'
    }
  },
  
  // Mode local (sans AWS) - Désactivé pour utiliser les services AWS
  useLocalMode: false
};

/**
 * Obtient l'URL d'une affiche de contenu
 * @param {string} id Identifiant du contenu
 * @returns {string} URL de l'affiche
 */
export const getPosterUrl = (id) => {
  // Toujours utiliser le mode local pour éviter les erreurs de connexion
  return `/assets/media/posters/${id}.jpg`;
};

/**
 * Obtient l'URL d'une image d'arrière-plan
 * @param {string} id Identifiant du contenu
 * @returns {string} URL de l'image d'arrière-plan
 */
export const getBackdropUrl = (id) => {
  // Toujours utiliser le mode local pour éviter les erreurs de connexion
  return `/assets/media/backdrops/${id}.jpg`;
};

/**
 * Obtient l'URL d'une miniature
 * @param {string} id Identifiant du contenu
 * @returns {string} URL de la miniature
 */
export const getThumbnailUrl = (id) => {
  // Toujours utiliser le mode local pour éviter les erreurs de connexion
  return `/assets/media/thumbnails/${id}.jpg`;
};

/**
 * Obtient l'URL des métadonnées
 * @returns {string} URL des métadonnées
 */
export const getMetadataUrl = () => {
  // Toujours utiliser le mode local pour éviter les erreurs de connexion
  return `/assets/data/metadata.json`;
};

export default AWS_CONFIG;
