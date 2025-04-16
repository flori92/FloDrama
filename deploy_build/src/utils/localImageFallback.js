/**
 * Utilitaire de fallback d'images pour FloDrama
 * Permet de gérer les erreurs de chargement d'images et d'utiliser des placeholders
 * Intègre le système de cache pour améliorer les performances
 */
import cacheManager from './cacheManager';

/**
 * Remplace une image qui n'a pas pu être chargée par une image de placeholder
 * @param {Event} event - L'événement d'erreur de chargement d'image
 */
export const handleImageError = (event) => {
  try {
    const imgElement = event.target;
    if (!imgElement) {
      console.warn('handleImageError: élément image non trouvé dans l\'événement');
      return;
    }
    
    const originalSrc = imgElement.getAttribute('data-original-src') || imgElement.src || '';
    const imgType = determineImageType(originalSrc);
    
    // Ajouter une classe pour le style
    imgElement.classList.add('fallback-image');
    imgElement.classList.add(`${imgType}-fallback`);
    
    // Vérifier si une version en cache existe
    const cacheKey = generateCacheKey(originalSrc);
    const cachedSrc = cacheManager.getCache(cacheKey, 'images');
    
    if (cachedSrc && cachedSrc !== originalSrc) {
      console.log(`Utilisation de l'image en cache pour: ${originalSrc}`);
      imgElement.src = cachedSrc;
      return;
    }
    
    // Remplacer par l'image de placeholder appropriée
    const placeholderUrl = getPlaceholderForType(imgType);
    
    // Éviter les boucles infinies de chargement
    if (imgElement.src !== placeholderUrl) {
      imgElement.src = placeholderUrl;
      
      // Log pour le débogage
      console.warn(`Image non trouvée, fallback utilisé: ${originalSrc} -> ${placeholderUrl}`);
    }
  } catch (error) {
    console.error('Erreur dans le gestionnaire de fallback d\'images:', error);
  }
};

/**
 * Génère une clé de cache unique pour une URL d'image
 * @param {string} url - L'URL de l'image
 * @returns {string} - Clé de cache
 */
export const generateCacheKey = (url) => {
  if (!url) return '';
  
  // Extraire le nom du fichier et le chemin
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  
  // Créer une clé basée sur le nom du fichier et le type
  const type = determineImageType(url);
  return `img_${type}_${filename}`;
};

/**
 * Précharge une image et la met en cache
 * @param {string} url - L'URL de l'image à précharger
 * @param {string} type - Type d'image (optionnel, sera déterminé automatiquement si non fourni)
 * @returns {Promise} - Promise résolue quand l'image est chargée
 */
export const preloadAndCacheImage = (url, type = null) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('URL d\'image non valide'));
      return;
    }
    
    const imgType = type || determineImageType(url);
    const cacheKey = generateCacheKey(url);
    
    // Vérifier si l'image est déjà en cache
    const cachedSrc = cacheManager.getCache(cacheKey, 'images');
    if (cachedSrc) {
      resolve(cachedSrc);
      return;
    }
    
    // Précharger l'image
    const img = new Image();
    
    img.onload = () => {
      // Mettre en cache l'URL de l'image
      cacheManager.setCache(cacheKey, url, 'images');
      resolve(url);
    };
    
    img.onerror = () => {
      // En cas d'erreur, utiliser le placeholder
      const placeholderUrl = getPlaceholderForType(imgType);
      console.warn(`Préchargement échoué, utilisation du placeholder: ${url} -> ${placeholderUrl}`);
      reject(new Error(`Impossible de charger l'image: ${url}`));
    };
    
    img.src = url;
  });
};

/**
 * Détermine le type d'image (poster, backdrop, thumbnail) à partir de l'URL
 * @param {string} url - L'URL de l'image
 * @returns {string} - Le type d'image
 */
const determineImageType = (url) => {
  if (!url) return 'generic';
  
  if (url.includes('/posters/')) return 'poster';
  if (url.includes('/backdrops/')) return 'backdrop';
  if (url.includes('/thumbnails/')) return 'thumbnail';
  if (url.includes('/profiles/')) return 'profile';
  if (url.includes('/logos/')) return 'logo';
  return 'generic';
};

/**
 * Retourne l'URL du placeholder approprié selon le type d'image
 * @param {string} type - Le type d'image (poster, backdrop, thumbnail, generic)
 * @returns {string} - L'URL du placeholder
 */
const getPlaceholderForType = (type) => {
  // Utiliser les SVG placeholders créés
  switch (type) {
    case 'poster':
      return '/assets/static/placeholders/poster-placeholder.svg';
    case 'backdrop':
      return '/assets/static/placeholders/backdrop-placeholder.svg';
    case 'thumbnail':
      return '/assets/static/placeholders/thumbnail-placeholder.svg';
    case 'profile':
      return '/assets/static/placeholders/profile-placeholder.svg';
    case 'logo':
      return '/assets/static/placeholders/logo-placeholder.svg';
    default:
      return '/assets/static/placeholders/image-placeholder.svg';
  }
};

/**
 * Crée des placeholders pour les images manquantes
 * Doit être appelé au démarrage de l'application
 */
export const createPlaceholders = () => {
  try {
    // Créer des placeholders en CSS si les images ne sont pas disponibles
    const style = document.createElement('style');
    style.textContent = `
      .fallback-image.poster-fallback {
        background: linear-gradient(135deg, #3b82f6, #d946ef);
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
        border-radius: 8px;
      }
      
      .fallback-image.backdrop-fallback {
        background: linear-gradient(135deg, #3b82f6, #d946ef);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
        border-radius: 8px;
      }
      
      .fallback-image.thumbnail-fallback {
        background: linear-gradient(135deg, #3b82f6, #d946ef);
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
        border-radius: 8px;
      }
      
      .fallback-image.profile-fallback {
        background: linear-gradient(135deg, #3b82f6, #d946ef);
        min-height: 150px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
      }
      
      .fallback-image.logo-fallback {
        background: transparent;
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
      }
      
      .fallback-image.generic-fallback {
        background: linear-gradient(135deg, #3b82f6, #d946ef);
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
        border-radius: 8px;
      }
      
      .lazy-image-placeholder {
        background: linear-gradient(90deg, #1A1926 0%, #2a293a 50%, #1A1926 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      .lazy-image {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .lazy-image.loaded {
        opacity: 1;
      }
    `;
    
    document.head.appendChild(style);
    
    // Précharger les images de placeholder
    const placeholders = [
      '/assets/static/placeholders/poster-placeholder.svg',
      '/assets/static/placeholders/backdrop-placeholder.svg',
      '/assets/static/placeholders/thumbnail-placeholder.svg',
      '/assets/static/placeholders/profile-placeholder.svg',
      '/assets/static/placeholders/logo-placeholder.svg',
      '/assets/static/placeholders/image-placeholder.svg'
    ];
    
    placeholders.forEach(url => {
      const img = new Image();
      img.src = url;
    });
    
    // Ajouter un gestionnaire global pour les erreurs d'images
    document.addEventListener('error', function(e) {
      if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
        handleImageError(e);
        e.preventDefault(); // Empêcher la propagation de l'erreur
        return false;
      }
    }, true);
    
    console.log('Placeholders CSS créés pour les images manquantes');
  } catch (error) {
    console.error('Erreur lors de la création des placeholders:', error);
  }
};

export default {
  handleImageError,
  createPlaceholders,
  preloadAndCacheImage,
  generateCacheKey
};
