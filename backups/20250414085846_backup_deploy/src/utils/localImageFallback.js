/**
 * Utilitaire de fallback d'images pour FloDrama
 * Permet de gérer les erreurs de chargement d'images et d'utiliser des placeholders
 */

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
    
    const imgType = determineImageType(imgElement.src || '');
    
    // Ajouter une classe pour le style
    imgElement.classList.add('fallback-image');
    imgElement.classList.add(`${imgType}-fallback`);
    
    // Remplacer par l'image de placeholder appropriée
    const placeholderUrl = getPlaceholderForType(imgType);
    
    // Éviter les boucles infinies de chargement
    if (imgElement.src !== placeholderUrl) {
      imgElement.src = placeholderUrl;
      
      // Log pour le débogage
      console.warn(`Image non trouvée, fallback utilisé: ${imgElement.src} -> ${placeholderUrl}`);
    }
  } catch (error) {
    console.error('Erreur dans le gestionnaire de fallback d\'images:', error);
  }
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
        background: linear-gradient(135deg, #2c3e50, #4ca1af);
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
      }
      
      .fallback-image.backdrop-fallback {
        background: linear-gradient(135deg, #16222a, #3a6073);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
      }
      
      .fallback-image.thumbnail-fallback {
        background: linear-gradient(135deg, #2c3e50, #bdc3c7);
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
      }
      
      .fallback-image.generic-fallback {
        background: linear-gradient(135deg, #485563, #29323c);
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-align: center;
      }
      
      .lazy-image-placeholder {
        background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    
    document.head.appendChild(style);
    
    // Précharger les images de placeholder
    const placeholders = [
      '/assets/static/placeholders/poster-placeholder.svg',
      '/assets/static/placeholders/backdrop-placeholder.svg',
      '/assets/static/placeholders/thumbnail-placeholder.svg',
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
  createPlaceholders
};
