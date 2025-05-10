/**
 * Configuration pour le scraper d'images FloDrama
 */

module.exports = {
  // Configuration Cloudflare Images
  cloudflare: {
    // Ces valeurs doivent être définies dans les variables d'environnement
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '42fc982266a2c31b942593b18097e4b3',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  },
  
  // URL de base pour la distribution des images
  imageDeliveryUrl: 'https://images.flodrama.com',
  
  // Tailles d'images disponibles
  imageSizes: {
    small: 'w200',
    medium: 'w500',
    large: 'w1000',
    original: 'original'
  },
  
  // Images par défaut (placeholders)
  defaultImages: {
    poster: '/images/default-poster.jpg',
    backdrop: '/images/default-backdrop.jpg',
    thumbnail: '/images/default-thumbnail.jpg'
  },
  
  // Propriétés d'images à rechercher dans les objets scrapés
  imageProperties: {
    poster: ['poster_url', 'poster_path', 'image_url'],
    backdrop: ['backdrop_url', 'backdrop_path', 'banner_url', 'background_url']
  },
  
  // Délai entre les requêtes pour éviter de surcharger l'API (en ms)
  requestDelay: 500,
  
  // Nombre maximum de tentatives en cas d'échec
  maxRetries: 3,
  
  // Délai entre les tentatives (en ms)
  retryDelay: 1000
};
