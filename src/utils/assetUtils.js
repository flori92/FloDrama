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
  // Récupérer la base URL depuis les variables d'environnement
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || '/';
  
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
  if (!imagePath) return '';
  
  // Si l'URL est déjà absolue (http:// ou https://), la retourner telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
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
  return getAssetPath(`assets/icons/${iconName}`);
};

/**
 * Obtient l'URL correcte pour une ressource statique
 * @param {string} staticPath - Chemin relatif de la ressource statique
 * @returns {string} - URL complète de la ressource statique
 */
export const getStaticUrl = (staticPath) => {
  return getAssetPath(`assets/static/${staticPath}`);
};

/**
 * Obtient l'URL correcte pour une ressource média
 * @param {string} mediaPath - Chemin relatif de la ressource média
 * @returns {string} - URL complète de la ressource média
 */
export const getMediaUrl = (mediaPath) => {
  return getAssetPath(`assets/media/${mediaPath}`);
};

/**
 * Obtient l'URL correcte pour une police
 * @param {string} fontPath - Chemin relatif de la police
 * @returns {string} - URL complète de la police
 */
export const getFontUrl = (fontPath) => {
  return getAssetPath(`assets/fonts/${fontPath}`);
};

/**
 * Obtient l'URL correcte pour une ressource quelconque
 * @param {string} path - Chemin complet de la ressource
 * @returns {string} - URL complète de la ressource
 */
export const getResourceUrl = (path) => {
  return getAssetPath(path);
};
