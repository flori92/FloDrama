/**
 * Utilitaire de fallback d'images pour FloDrama
 * Permet de gérer les erreurs de chargement d'images et d'utiliser des placeholders
 * Intègre le système de cache pour améliorer les performances
 */
import cacheManager from './cacheManager';

// Mapping des URLs problématiques vers des images locales
const problematicUrlPatterns = [
  // Amazon Media
  { pattern: /m\.media-amazon\.com\/images\/M\//, replacement: '/assets/posters/' },
  // Allocine
  { pattern: /fr\.web\.img[0-9]\.acsta\.net\/pictures\//, replacement: '/assets/posters/' },
  // Placeholder.com
  { pattern: /via\.placeholder\.com\/[0-9]+x[0-9]+\//, replacement: '/assets/posters/' },
  // KultScene
  { pattern: /kultscene\.com\/wp-content\/uploads\//, replacement: '/assets/posters/' },
  // Fallback général pour toute URL externe
  { pattern: /^https?:\/\//, replacement: '/assets/posters/' }
];

// Liste des posters locaux disponibles pour le fallback
const localPosters = [
  'parasite.jpg',
  'squid-game.jpg',
  'minari.jpg',
  'burning.jpg',
  'train-to-busan.jpg',
  'oldboy.jpg',
  'the-handmaiden.jpg',
  'snowpiercer.jpg',
  'memories-of-murder.jpg',
  'mother.jpg'
];

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
    
    // Essayer de trouver une image locale correspondante
    const localImage = findLocalImageForUrl(originalSrc);
    if (localImage) {
      imgElement.src = localImage;
      console.log(`Utilisation de l'image locale pour: ${originalSrc} -> ${localImage}`);
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
 * Trouve une image locale correspondante pour une URL externe
 * @param {string} url - L'URL de l'image externe
 * @returns {string|null} - L'URL de l'image locale ou null si aucune correspondance
 */
export const findLocalImageForUrl = (url) => {
  if (!url) return null;
  
  // Extraire le titre du film/série à partir de l'URL ou du texte du placeholder
  let title = '';
  
  // Cas spécial pour placeholder.com avec text=
  if (url.includes('placeholder.com') && url.includes('text=')) {
    const textMatch = url.match(/text=([^&]+)/);
    if (textMatch && textMatch[1]) {
      title = decodeURIComponent(textMatch[1]).toLowerCase().replace(/\s+/g, '-');
      
      // Vérifier si nous avons une image locale pour ce titre
      const posterName = `${title}.jpg`;
      if (localPosters.includes(posterName)) {
        return `/assets/posters/${posterName}`;
      }
    }
  }
  
  // Sélectionner une image locale aléatoire
  const randomIndex = Math.floor(Math.random() * localPosters.length);
  return `/assets/posters/${localPosters[randomIndex]}`;
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
    
    // Vérifier si l'URL est problématique et la remplacer si nécessaire
    const replacedUrl = checkAndReplaceProblematicUrl(url);
    if (replacedUrl !== url) {
      console.log(`URL remplacée: ${url} -> ${replacedUrl}`);
      url = replacedUrl;
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
      // En cas d'erreur, utiliser une image locale ou le placeholder
      const localImage = findLocalImageForUrl(url);
      if (localImage) {
        cacheManager.setCache(cacheKey, localImage, 'images');
        resolve(localImage);
        return;
      }
      
      // Sinon, utiliser le placeholder
      const placeholderUrl = getPlaceholderForType(imgType);
      console.warn(`Préchargement échoué, utilisation du placeholder: ${url} -> ${placeholderUrl}`);
      reject(new Error(`Impossible de charger l'image: ${url}`));
    };
    
    img.src = url;
  });
};

/**
 * Vérifie si une URL est problématique et la remplace si nécessaire
 * @param {string} url - L'URL à vérifier
 * @returns {string} - L'URL remplacée ou l'URL originale
 */
export const checkAndReplaceProblematicUrl = (url) => {
  if (!url) return url;
  
  // Vérifier si l'URL correspond à un pattern problématique
  for (const { pattern, replacement } of problematicUrlPatterns) {
    if (pattern.test(url)) {
      // Si c'est un placeholder avec text=, extraire le titre
      if (url.includes('placeholder.com') && url.includes('text=')) {
        const textMatch = url.match(/text=([^&]+)/);
        if (textMatch && textMatch[1]) {
          const title = decodeURIComponent(textMatch[1]).toLowerCase().replace(/\s+/g, '-');
          return `${replacement}${title}.jpg`;
        }
      }
      
      // Sélectionner une image locale aléatoire
      const randomIndex = Math.floor(Math.random() * localPosters.length);
      return `${replacement}${localPosters[randomIndex]}`;
    }
  }
  
  return url;
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
  
  // Détection basée sur les dimensions pour placeholder.com
  if (url.includes('placeholder.com')) {
    const dimensions = url.match(/\/(\d+)x(\d+)\//);
    if (dimensions) {
      const width = parseInt(dimensions[1]);
      const height = parseInt(dimensions[2]);
      const ratio = width / height;
      
      if (ratio < 0.8) return 'poster'; // Format portrait
      if (ratio > 1.5) return 'backdrop'; // Format paysage
      if (width < 200) return 'thumbnail'; // Petite taille
    }
  }
  
  // Détection basée sur le nom de domaine
  if (url.includes('acsta.net')) return 'poster';
  if (url.includes('media-amazon.com')) return 'poster';
  
  return 'generic';
};

/**
 * Retourne l'URL du placeholder approprié selon le type d'image
 * @param {string} type - Le type d'image (poster, backdrop, thumbnail, generic)
 * @returns {string} - L'URL du placeholder
 */
export const getPlaceholderForType = (type) => {
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
    console.log('Création des placeholders CSS pour les images manquantes...');
    
    // Ajouter les styles CSS pour les placeholders
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

/**
 * Utilitaire pour remplacer les URLs problématiques par des images locales
 * @param {string} src - L'URL source de l'image
 * @param {object} options - Options supplémentaires
 * @returns {object} - Objet avec les propriétés pour gérer le fallback
 */
export function localImageFallback(src, options = {}) {
  // Vérifier si l'URL est problématique et la remplacer si nécessaire
  const checkedSrc = checkAndReplaceProblematicUrl(src);
  
  return {
    src: checkedSrc,
    fallbackSrc: findLocalImageForUrl(src) || `/assets/static/placeholders/${options.type || 'image'}-placeholder.svg`,
    useFallback: () => Promise.resolve(checkedSrc !== src),
    // Méthode pour réinitialiser le fallback (utilisée dans certains cas avancés)
    resetFallback: () => {
      // Implémentation intentionnellement vide pour le moment
      // Cette méthode peut être étendue si nécessaire dans le futur
    }
  };
}

export default {
  handleImageError,
  createPlaceholders,
  preloadAndCacheImage,
  generateCacheKey,
  localImageFallback,
  findLocalImageForUrl,
  checkAndReplaceProblematicUrl
};
