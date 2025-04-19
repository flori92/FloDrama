/**
 * Configuration centralisée du système de gestion d'images FloDrama
 * 
 * Ce fichier contient tous les paramètres configurables du système de gestion d'images,
 * permettant un ajustement facile sans modifier le code des composants.
 */

// Identité visuelle FloDrama
export const BRAND_COLORS = {
  PRIMARY: '#3b82f6',          // Bleu signature
  SECONDARY: '#d946ef',        // Fuchsia accent
  GRADIENT: 'linear-gradient(to right, #3b82f6, #d946ef)', // Dégradé signature
  BACKGROUND: '#121118',        // Fond principal
  BACKGROUND_SECONDARY: '#1A1926', // Fond secondaire
  TEXT_PRIMARY: '#FFFFFF',      // Texte principal
  TEXT_SECONDARY: '#E2E8F0'     // Texte secondaire
};

// Types d'images supportés
export const IMAGE_TYPES = {
  POSTER: 'poster',             // Affiches (ratio 2:3)
  BACKDROP: 'backdrop',         // Arrière-plans (ratio 16:9)
  THUMBNAIL: 'thumbnail',       // Vignettes (ratio 1:1)
  PROFILE: 'profile',           // Photos de profil (ratio 1:1)
  LOGO: 'logo',                 // Logos (dimensions variables)
  STILL: 'still',               // Images d'épisodes (ratio 16:9)
  BANNER: 'banner'              // Bannières (ratio 8:1)
};

// Configuration des CDNs
export const CDN_CONFIG = {
  // CDNs principaux
  SOURCES: [
    {
      name: 'github',
      baseUrl: '',  // URL relative
      enabled: true,
      priority: 1, // Priorité maximale pour les assets locaux
      pathTemplate: '/assets/media/${type}s/${contentId}.jpg',
      healthCheckUrl: '/assets/status.json'
    },
    {
      name: 'cloudfront',
      baseUrl: 'https://d11nnqvjfooahr.cloudfront.net',
      enabled: true,
      priority: 2,
      pathTemplate: '/media/${type}s/${contentId}.jpg',
      healthCheckUrl: 'https://d11nnqvjfooahr.cloudfront.net/status.json'
    }
  ],
  
  // Paramètres de vérification des CDNs
  CHECK_INTERVAL: 5 * 60 * 1000,  // 5 minutes
  TIMEOUT: 3000,                  // 3 secondes
  RETRY_COUNT: 2,                 // Nombre de tentatives
  
  // Placeholders locaux
  PLACEHOLDERS: {
    BASE_PATH: '/assets/static/placeholders',
    POSTER: '/assets/static/placeholders/poster-placeholder.jpg',
    BACKDROP: '/assets/static/placeholders/backdrop-placeholder.jpg',
    THUMBNAIL: '/assets/static/placeholders/thumbnail-placeholder.jpg',
    PROFILE: '/assets/static/placeholders/profile-placeholder.jpg',
    LOGO: '/assets/static/placeholders/logo-placeholder.png',
    STILL: '/assets/static/placeholders/still-placeholder.jpg',
    BANNER: '/assets/static/placeholders/banner-placeholder.jpg'
  }
};

// Configuration du système de synchronisation
export const SYNC_CONFIG = {
  // Intervalle de synchronisation en millisecondes (30 minutes)
  INTERVAL: 30 * 60 * 1000,
  
  // Nombre maximum d'éléments à traiter par lot
  BATCH_SIZE: 20,
  
  // Délai entre les traitements de lots (en ms)
  BATCH_DELAY: 2000,
  
  // Types de contenu à synchroniser
  CONTENT_TYPES: ['drama', 'movie', 'anime'],
  
  // Priorité des sources d'images
  SOURCE_PRIORITY: {
    'tmdb': 1,
    'mydramalist': 2,
    'github-pages': 3,
    'cloudfront': 4
  }
};

// Configuration du système de préchargement
export const PRELOAD_CONFIG = {
  // Activer le préchargement automatique
  ENABLED: true,
  
  // Nombre maximum d'images à précharger simultanément
  MAX_CONCURRENT: 5,
  
  // Types d'images à précharger par type de contenu
  CONTENT_TYPE_MAPPING: {
    'drama': [IMAGE_TYPES.POSTER, IMAGE_TYPES.BACKDROP],
    'movie': [IMAGE_TYPES.POSTER, IMAGE_TYPES.BACKDROP],
    'anime': [IMAGE_TYPES.POSTER, IMAGE_TYPES.BACKDROP],
    'person': [IMAGE_TYPES.PROFILE]
  },
  
  // Priorité de préchargement
  PRIORITY: {
    'trending': 1,
    'popular': 2,
    'recent': 3,
    'recommended': 4,
    'search': 5
  }
};

// Configuration des SVG dynamiques
export const SVG_CONFIG = {
  // Dimensions par défaut
  DEFAULT_DIMENSIONS: {
    [IMAGE_TYPES.POSTER]: { width: 300, height: 450 },
    [IMAGE_TYPES.BACKDROP]: { width: 500, height: 281 },
    [IMAGE_TYPES.THUMBNAIL]: { width: 200, height: 200 },
    [IMAGE_TYPES.PROFILE]: { width: 300, height: 300 },
    [IMAGE_TYPES.LOGO]: { width: 400, height: 200 },
    [IMAGE_TYPES.STILL]: { width: 500, height: 281 },
    [IMAGE_TYPES.BANNER]: { width: 800, height: 100 }
  },
  
  // Palette de couleurs pour les dégradés
  COLOR_PAIRS: [
    [BRAND_COLORS.PRIMARY, '#1e40af'], // Bleu foncé
    [BRAND_COLORS.SECONDARY, '#9333ea'], // Fuchsia
    [BRAND_COLORS.PRIMARY, '#6366f1'], // Bleu-indigo
    [BRAND_COLORS.SECONDARY, '#ec4899'], // Fuchsia-rose
    [BRAND_COLORS.PRIMARY, '#0ea5e9'], // Bleu-ciel
    [BRAND_COLORS.SECONDARY, '#c026d3'], // Fuchsia-violet
    [BRAND_COLORS.PRIMARY, '#2563eb'], // Bleu royal
    [BRAND_COLORS.SECONDARY, '#be185d']  // Fuchsia-rose foncé
  ],
  
  // Taille de police relative
  FONT_SIZE_FACTOR: 0.08,
  
  // Police de caractères
  FONT_FAMILY: 'SF Pro Display, sans-serif',
  
  // Activer les textures
  ENABLE_TEXTURES: true,
  
  // Opacité des textures
  TEXTURE_OPACITY: 0.1
};

// Configuration des statistiques et de la journalisation
export const STATS_CONFIG = {
  // Activer les statistiques
  ENABLED: true,
  
  // Niveau de journalisation
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  
  // Intervalle de rapport des statistiques (en ms)
  REPORT_INTERVAL: 60 * 60 * 1000, // 1 heure
  
  // Métriques à collecter
  METRICS: [
    'imagesLoaded',
    'imagesFailed',
    'fallbacksApplied',
    'cdnStatus',
    'cacheMissRate',
    'avgLoadTime'
  ]
};

// Configuration globale du système d'images
export const IMAGE_SYSTEM_CONFIG = {
  // Activer le système d'images
  ENABLED: true,
  
  // Initialisation automatique
  AUTO_INIT: true,
  
  // Mode débogage
  DEBUG: false,
  
  // Délai avant la première synchronisation (en ms)
  INITIAL_SYNC_DELAY: 15 * 1000, // 15 secondes
  
  // Délai maximum d'attente pour le chargement d'une image (en ms)
  IMAGE_LOAD_TIMEOUT: 10000, // 10 secondes
  
  // Nombre maximum de tentatives de chargement
  MAX_LOAD_ATTEMPTS: 3,
  
  // Activer le cache en mémoire
  MEMORY_CACHE_ENABLED: true,
  
  // Taille maximale du cache en mémoire (nombre d'entrées)
  MEMORY_CACHE_SIZE: 200,
  
  // Durée de vie du cache en mémoire (en ms)
  MEMORY_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  
  // Activer le cache IndexedDB
  INDEXED_DB_CACHE_ENABLED: true,
  
  // Nom de la base de données IndexedDB
  INDEXED_DB_NAME: 'flodrama-image-cache',
  
  // Version de la base de données IndexedDB
  INDEXED_DB_VERSION: 1,
  
  // Durée de vie du cache IndexedDB (en ms)
  INDEXED_DB_CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 jours
  
  // Taille maximale du cache IndexedDB (en octets)
  INDEXED_DB_MAX_SIZE: 50 * 1024 * 1024, // 50 Mo
  
  // Activer la détection automatique du type d'image
  AUTO_DETECT_TYPE: true,
  
  // Activer l'amélioration automatique des images existantes
  ENHANCE_EXISTING_IMAGES: true,
  
  // Activer la génération de SVG pour les fallbacks
  ENABLE_SVG_FALLBACK: true,
  
  // Activer le rapport d'erreurs
  ENABLE_ERROR_REPORTING: true,
  
  // URL de rapport d'erreurs
  ERROR_REPORTING_URL: '/api/image-system/report-error'
};

// Configuration par défaut exportée
export default {
  BRAND_COLORS,
  IMAGE_TYPES,
  CDN_CONFIG,
  SYNC_CONFIG,
  PRELOAD_CONFIG,
  SVG_CONFIG,
  STATS_CONFIG,
  IMAGE_SYSTEM_CONFIG
};
