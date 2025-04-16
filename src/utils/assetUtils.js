/**
 * Utilitaires pour la gestion des chemins d'accès aux ressources statiques
 * Compatible avec le déploiement GitHub Pages
 */

/**
 * Obtient l'URL correcte pour une ressource statique en tenant compte de l'environnement
 * @param {string} path - Chemin relatif de la ressource (sans le slash initial)
 * @returns {string} - URL complète de la ressource
 */
export const getAssetPath = (path) => {
  // Utiliser la fonction resolveAssetPath définie dans index.html si disponible
  if (typeof window !== 'undefined' && typeof window.resolveAssetPath === 'function') {
    return window.resolveAssetPath(path);
  }
  
  // Fallback si la fonction n'est pas disponible
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) 
    ? import.meta.env.BASE_URL 
    : (typeof window !== 'undefined' && window.BASE_URL) 
      ? window.BASE_URL 
      : '/';
  
  // Nettoyer le chemin d'entrée
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Construire l'URL complète
  return `${baseUrl}${cleanPath}`;
};

/**
 * Obtient l'URL correcte pour une image
 * @param {string} imagePath - Chemin relatif de l'image
 * @returns {string} - URL complète de l'image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return getAssetPath('assets/static/placeholders/image-placeholder.svg');
  
  // Si l'URL est déjà absolue (http:// ou https://), la retourner telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Si le chemin commence déjà par assets/, ne pas ajouter le préfixe
  if (imagePath.startsWith('assets/')) {
    return getAssetPath(imagePath);
  }
  
  // Sinon, construire l'URL avec le chemin de base
  return getAssetPath(`assets/images/${imagePath}`);
};

/**
 * Obtient l'URL correcte pour une icône
 * @param {string} iconName - Nom de l'icône
 * @returns {string} - URL complète de l'icône
 */
export const getIconUrl = (iconName) => {
  if (!iconName) return getAssetPath('assets/static/placeholders/logo-placeholder.svg');
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (iconName.startsWith('http://') || iconName.startsWith('https://')) {
    return iconName;
  }
  
  return getAssetPath(`assets/icons/${iconName}`);
};

/**
 * Obtient l'URL correcte pour une ressource statique
 * @param {string} staticPath - Chemin relatif de la ressource statique
 * @returns {string} - URL complète de la ressource statique
 */
export const getStaticUrl = (staticPath) => {
  if (!staticPath) return getAssetPath('assets/static/placeholders/image-placeholder.svg');
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (staticPath.startsWith('http://') || staticPath.startsWith('https://')) {
    return staticPath;
  }
  
  return getAssetPath(`assets/static/${staticPath}`);
};

/**
 * Obtient l'URL correcte pour une ressource média
 * @param {string} mediaPath - Chemin relatif de la ressource média
 * @returns {string} - URL complète de la ressource média
 */
export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return '';
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  
  return getAssetPath(`assets/media/${mediaPath}`);
};

/**
 * Obtient l'URL correcte pour une police
 * @param {string} fontPath - Chemin relatif de la police
 * @returns {string} - URL complète de la police
 */
export const getFontUrl = (fontPath) => {
  if (!fontPath) return '';
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (fontPath.startsWith('http://') || fontPath.startsWith('https://')) {
    return fontPath;
  }
  
  return getAssetPath(`assets/fonts/${fontPath}`);
};

/**
 * Obtient l'URL correcte pour une ressource quelconque
 * @param {string} path - Chemin complet de la ressource
 * @returns {string} - URL complète de la ressource
 */
export const getResourceUrl = (path) => {
  if (!path) return getAssetPath('assets/static/placeholders/image-placeholder.svg');
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  return getAssetPath(path);
};
