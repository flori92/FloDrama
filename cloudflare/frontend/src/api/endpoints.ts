/**
 * Configuration centralisée des endpoints API
 * 
 * Ce fichier définit toutes les URLs des API utilisées par FloDrama.
 * Centraliser ces configurations permet de faciliter les changements d'environnement
 * et d'assurer la cohérence dans toute l'application.
 */

// Configuration des environnements
type Environment = 'development' | 'staging' | 'production';

// L'environnement actuel (à définir via les variables d'environnement)
const CURRENT_ENV: Environment = (process.env.VITE_ENV || 'production') as Environment;

// Configuration des URLs de base par environnement
const BASE_URLS = {
  development: {
    API: 'http://localhost:8787',
    MEDIA: 'http://localhost:8787/media',
    STORAGE: 'http://localhost:8787/storage',
    CLOUDFLARE_STREAM: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com'
  },
  staging: {
    API: 'https://flodrama-api-staging.florifavi.workers.dev',
    MEDIA: 'https://flodrama-api-staging.florifavi.workers.dev/media',
    STORAGE: 'https://flodrama-storage-staging.florifavi.workers.dev',
    CLOUDFLARE_STREAM: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com'
  },
  production: {
    // URL principale de l'API
    API: 'https://flodrama-api-prod.florifavi.workers.dev',
    // URLs de repli en cas d'échec
    API_FALLBACKS: [
      'https://api.flodrama.com',
      'https://flodrama-cors-proxy.onrender.com/api'
    ],
    MEDIA: 'https://flodrama-api-prod.florifavi.workers.dev/media',
    STORAGE: 'https://flodrama-storage.florifavi.workers.dev',
    CLOUDFLARE_STREAM: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com'
  }
};

// URLs pour l'environnement actuel
const URLS = BASE_URLS[CURRENT_ENV];

/**
 * Configuration des endpoints API
 */
export const API = {
  // Endpoints de contenu
  CONTENT: {
    // Structure v2 de l'API Cloudflare qui utilise directement les tables
    FEATURED: `${URLS.API}/content/featured`,
    ALL: `${URLS.API}/content/all`,
    BY_CATEGORY: (category: string) => {
      // Adaptation pour correspondre aux tables réelles dans Cloudflare D1
      const tableMapping: Record<string, string> = {
        'drama': 'dramas',
        'anime': 'animes',
        'movie': 'films',
        'bollywood': 'bollywood'
      };
      const tableName = tableMapping[category] || category;
      return `${URLS.API}/${tableName}`;
    },
    BY_ID: (id: string) => {
      // Extraction du type depuis l'ID (format: type-uuid)
      const parts = id.split('-');
      const type = parts.length > 1 ? parts[0] : 'drama';
      const uuid = parts.length > 1 ? parts.slice(1).join('-') : id;
      
      // Mapping vers les tables réelles
      const tableMapping: Record<string, string> = {
        'drama': 'dramas',
        'anime': 'animes',
        'movie': 'films',
        'bollywood': 'bollywood'
      };
      
      const tableName = tableMapping[type] || 'dramas';
      return `${URLS.API}/${tableName}/${uuid}`;
    },
    SEARCH: `${URLS.API}/search`,
    RECENT: `${URLS.API}/recent`,
    TRENDING: `${URLS.API}/trending`,
    SIMILAR: `${URLS.API}/similar`
  },
  
  // Endpoints utilisateur
  USER: {
    PREFERENCES: (userId: string) => `${URLS.API}/users/${userId}/preferences`,
    HISTORY: (userId: string) => `${URLS.API}/users/${userId}/history`,
    RECOMMENDATIONS: (userId: string) => `${URLS.API}/users/${userId}/recommendations`
  },
  
  // Endpoints média
  MEDIA: {
    // Images optimisées avec stratégie de fallback
    POSTER: (id: string) => {
      // Utiliser d'abord l'URL de poster si elle existe dans l'objet content
      return `/api/images/poster/${id}`;
    },
    BACKDROP: (id: string) => {
      // Pareil pour backdrop
      return `/api/images/backdrop/${id}`;
    },
    TRAILER: (id: string) => {
      // ID peut être une URL YouTube ou un ID Cloudflare Stream
      if (id?.startsWith('http')) {
        return id;
      }
      return `${URLS.CLOUDFLARE_STREAM}/${id}/manifest/video.m3u8`;
    },
    STREAM: (id: string) => {
      // ID peut être une URL ou un ID
      if (id?.startsWith('http')) {
        return id;
      }
      return `${URLS.CLOUDFLARE_STREAM}/${id}/manifest/video.m3u8`;
    },
    THUMBNAIL: (id: string) => `/api/images/thumbnail/${id}`,
    // Image optimisée avec stratégie de fallback
    OPTIMIZED_IMAGE: (id: string, params: Record<string, string>) => {
      const urlParams = new URLSearchParams(params);
      return `/api/images/optimize/${id}?${urlParams.toString()}`;
    },
    // Placeholders pour éviter les erreurs 404 (format SVG pour compatibilité universelle)
    PLACEHOLDER_POSTER: '/assets/placeholder-poster.svg',
    PLACEHOLDER_BACKDROP: '/assets/placeholder-backdrop.svg',
    PLACEHOLDER_THUMBNAIL: '/assets/placeholder-thumbnail.svg',
    PLACEHOLDER_IMAGE: '/assets/placeholder-image.svg'
  },
  
  // Fallback pour utiliser des données locales en cas de besoin
  LOCAL: {
    CONTENT: '/src/data/content.json',
    FEATURED: '/src/data/featured.json',
    DRAMA: '/src/data/drama.json',
    ANIME: '/src/data/anime.json',
    MOVIE: '/src/data/movie.json',
    BOLLYWOOD: '/src/data/bollywood.json',
    TRENDING: '/src/data/trending.json',
    RECENT: '/src/data/recent.json'
  },
  
  // Gestion des diagnostics et de la santé de l'API
  SYSTEM: {
    HEALTH: `${URLS.API}/health`,
    DIAGNOSTICS: `${URLS.API}/diagnostics`
  }
};

/**
 * Configuration des timeouts par type de requête
 */
export const API_TIMEOUTS = {
  DEFAULT: 8000, // 8 secondes
  MEDIA: 12000,  // 12 secondes pour les médias
  SEARCH: 10000  // 10 secondes pour les recherches
};

/**
 * Paramètres pour la gestion du cache
 */
export const CACHE_DURATION = {
  FEATURED: 5 * 60 * 1000,    // 5 minutes
  CONTENT: 10 * 60 * 1000,    // 10 minutes
  SEARCH: 15 * 60 * 1000,     // 15 minutes
  USER_DATA: 30 * 60 * 1000,  // 30 minutes
  MEDIA: 60 * 60 * 1000       // 1 heure
};

export default API;
