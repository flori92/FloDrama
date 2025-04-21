const contentTypes = ['drama', 'movie', 'anime', 'bollywood'];

const imageSizes = {
  poster: { width: 500, height: 750 },
  backdrop: { width: 1280, height: 720 },
  thumbnail: { width: 500, height: 281 }
};

const contentColors = {
  drama: '#9D4EDD', // Violet
  movie: '#5F5FFF', // Bleu
  anime: '#4361EE', // Bleu anime
  bollywood: '#FB5607' // Orange
};

const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  retryAttempts: 3
};

const cacheConfig = {
  ttl: 1000 * 60 * 60, // 1 heure
  maxSize: 100 // Nombre maximum d'éléments en cache
};

module.exports = {
  contentTypes,
  imageSizes,
  contentColors,
  apiConfig,
  cacheConfig
}; 