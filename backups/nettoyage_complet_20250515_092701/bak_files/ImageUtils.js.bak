/**
 * Utilitaires pour la gestion des images dans l'application frontend
 * Ce module permet d'utiliser facilement les images optimisées par le scraper
 */

// Images par défaut (placeholders)
const DEFAULT_IMAGES = {
  poster: '/images/default-poster.jpg',
  backdrop: '/images/default-backdrop.jpg',
  thumbnail: '/images/default-thumbnail.jpg'
};

// URL de base pour la distribution des images
const IMAGE_DELIVERY_URL = 'https://images.flodrama.com';

// Tailles d'images disponibles
const IMAGE_SIZES = {
  small: 'w200',
  medium: 'w500',
  large: 'w1000',
  original: 'original'
};

/**
 * Construit l'URL d'une image stockée sur Cloudflare Images
 * @param {string} imageId - ID de l'image
 * @param {string} size - Taille de l'image (small, medium, large, original)
 * @returns {string} - URL complète de l'image
 */
export const getImageUrl = (imageId, size = 'medium') => {
  if (!imageId) return DEFAULT_IMAGES.poster;
  
  const sizeParam = IMAGE_SIZES[size] || IMAGE_SIZES.medium;
  return `${IMAGE_DELIVERY_URL}/${sizeParam}/${imageId}`;
};

/**
 * Récupère l'URL d'une image de poster à partir d'un objet contenu
 * @param {Object} content - Objet contenant les données du contenu
 * @param {string} size - Taille de l'image (small, medium, large, original)
 * @returns {string} - URL de l'image de poster
 */
export const getPosterUrl = (content, size = 'medium') => {
  // Vérifier si le contenu a la nouvelle structure d'images
  if (content?.images?.poster) {
    return getImageUrl(content.images.poster, size);
  }
  
  // Vérifier si le contenu a des URLs d'images pré-calculées
  if (content?.image_urls?.poster?.[size]) {
    return content.image_urls.poster[size];
  }
  
  // Fallback sur les anciennes propriétés
  const posterUrl = content?.poster_url || content?.poster_path || content?.image_url;
  if (posterUrl) {
    return posterUrl;
  }
  
  // Utiliser l'image par défaut
  return DEFAULT_IMAGES.poster;
};

/**
 * Récupère l'URL d'une image de backdrop à partir d'un objet contenu
 * @param {Object} content - Objet contenant les données du contenu
 * @param {string} size - Taille de l'image (small, medium, large, original)
 * @returns {string} - URL de l'image de backdrop
 */
export const getBackdropUrl = (content, size = 'large') => {
  // Vérifier si le contenu a la nouvelle structure d'images
  if (content?.images?.backdrop) {
    return getImageUrl(content.images.backdrop, size);
  }
  
  // Vérifier si le contenu a des URLs d'images pré-calculées
  if (content?.image_urls?.backdrop?.[size]) {
    return content.image_urls.backdrop[size];
  }
  
  // Fallback sur les anciennes propriétés
  const backdropUrl = content?.backdrop_url || content?.backdrop_path || 
                      content?.banner_url || content?.background_url;
  if (backdropUrl) {
    return backdropUrl;
  }
  
  // Utiliser l'image par défaut
  return DEFAULT_IMAGES.backdrop;
};

/**
 * Récupère l'URL d'une image de miniature à partir d'un objet contenu
 * @param {Object} content - Objet contenant les données du contenu
 * @returns {string} - URL de l'image de miniature
 */
export const getThumbnailUrl = (content) => {
  // Vérifier si le contenu a la nouvelle structure d'images
  if (content?.images?.thumbnail) {
    return getImageUrl(content.images.thumbnail, 'small');
  }
  
  // Vérifier si le contenu a des URLs d'images pré-calculées
  if (content?.image_urls?.thumbnail) {
    return content.image_urls.thumbnail;
  }
  
  // Fallback sur l'image de poster en petite taille
  return getPosterUrl(content, 'small');
};

/**
 * Vérifie si une URL d'image est valide
 * @param {string} url - URL à vérifier
 * @returns {Promise<boolean>} - true si l'URL est valide, false sinon
 */
export const isImageUrlValid = async (url) => {
  if (!url || url.includes('default')) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'URL d\'image:', error);
    return false;
  }
};

/**
 * Précharge une image pour améliorer les performances
 * @param {string} url - URL de l'image à précharger
 * @returns {Promise<void>}
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Impossible de charger l'image: ${url}`));
    img.src = url;
  });
};

/**
 * Précharge plusieurs images en parallèle
 * @param {Array<string>} urls - Liste d'URLs d'images à précharger
 * @returns {Promise<Array<string>>} - Liste des URLs préchargées avec succès
 */
export const preloadImages = async (urls) => {
  const results = await Promise.allSettled(
    urls.map(url => preloadImage(url))
  );
  
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
};
