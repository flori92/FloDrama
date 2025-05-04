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
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://flodrama-mm3h9ab4l-flodrama-projects.vercel.app/api',
  cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || 'https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content',
  timeout: 10000,
  retryAttempts: 3,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI5NjQ0MDAsImV4cCI6MTk5ODU0MDQwMH0.KkGMbBzGAEoUKyqwE4QXiKKUFUPzm-kn7zXBIcFLWEY'
} as const;

// Export API_BASE_URL pour compatibilité avec les services
export const API_BASE_URL = apiConfig.baseUrl;
export const CDN_BASE_URL = apiConfig.cdnUrl;

export const cacheConfig = {
  ttl: 1000 * 60 * 60, // 1 heure
  maxSize: 100 // Nombre maximum d'éléments en cache
} as const; 