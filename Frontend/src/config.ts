export const contentTypes = ['drama', 'movie', 'anime', 'bollywood'] as const;

export const imageSizes = {
  poster: { width: 500, height: 750 },
  backdrop: { width: 1280, height: 720 },
  thumbnail: { width: 500, height: 281 }
} as const;

export const contentColors = {
  drama: '#9D4EDD', // Violet
  movie: '#5F5FFF', // Bleu
  anime: '#4361EE', // Bleu anime
  bollywood: '#FB5607' // Orange
} as const;

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://REPLACE_WITH_LAMBDA_API_URL',
  timeout: 10000,
  retryAttempts: 3
} as const;

// Export API_BASE_URL pour compatibilité avec les services
export const API_BASE_URL = apiConfig.baseUrl;

export const cacheConfig = {
  ttl: 1000 * 60 * 60, // 1 heure
  maxSize: 100 // Nombre maximum d'éléments en cache
} as const; 