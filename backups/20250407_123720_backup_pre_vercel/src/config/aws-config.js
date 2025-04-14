/**
 * Configuration AWS unifiée pour FloDrama
 * Ce fichier centralise toutes les configurations liées à AWS
 */

const AWS_CONFIG = {
  // Configuration CloudFront
  cloudFront: {
    // URL unique pour toutes les ressources CloudFront
    URL: 'https://d2r16mhe8i26v2.cloudfront.net',
    // Domaines pour différents types de ressources
    domains: {
      media: 'https://d2r16mhe8i26v2.cloudfront.net',
      static: 'https://d2r16mhe8i26v2.cloudfront.net',
      data: 'https://d2r16mhe8i26v2.cloudfront.net'
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
    baseUrl: 'https://api.flodrama.com',
    endpoints: {
      metadata: '/metadata',
      search: '/search',
      content: '/content',
      user: '/user'
    }
  },
  
  // Configuration Amplify
  amplify: {
    appUrl: 'https://www.flodrama.com',
    devUrl: 'https://dev.flodrama.com',
    region: 'us-east-1'
  }
};

// Fonction utilitaire pour construire des URLs CloudFront
export const getCloudFrontUrl = (type, path) => {
  return `${AWS_CONFIG.cloudFront.domains[type]}${path}`;
};

// Fonction utilitaire pour construire des URLs de posters
export const getPosterUrl = (id) => {
  return `${AWS_CONFIG.cloudFront.URL}${AWS_CONFIG.cloudFront.paths.posters}/${id}.jpg`;
};

// Fonction utilitaire pour construire des URLs de backdrops
export const getBackdropUrl = (id) => {
  return `${AWS_CONFIG.cloudFront.URL}${AWS_CONFIG.cloudFront.paths.backdrops}/${id}.jpg`;
};

// Fonction utilitaire pour construire des URLs de métadonnées
export const getMetadataUrl = (id) => {
  return `${AWS_CONFIG.cloudFront.URL}${AWS_CONFIG.cloudFront.paths.metadata}/${id}.json`;
};

export default AWS_CONFIG;
