/**
 * Utilitaire pour générer des images de démonstration
 * Cet utilitaire fournit des images de base64 pour les besoins de démonstration
 * lorsque les images réelles ne sont pas disponibles
 */

// Couleurs pour les différents types de contenu
const COLORS = {
  drama: '#1a1a2e',
  movie: '#16213e',
  anime: '#0f3460',
  bollywood: '#533483'
};

/**
 * Génère une URL d'image de base64 avec un texte
 * @param {string} text - Texte à afficher sur l'image
 * @param {string} type - Type de contenu (drama, movie, anime, bollywood)
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @returns {string} URL de l'image en base64
 */
export const generateImageUrl = (text, type = 'drama', width = 300, height = 450) => {
  const color = COLORS[type] || COLORS.drama;
  
  // Créer un canvas pour générer l'image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  // Remplir le fond
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Ajouter un dégradé
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Ajouter le texte
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(width / 15)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Gérer les textes longs en les divisant en lignes
  const words = text.split(' ');
  let lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > width * 0.8) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  
  // Dessiner chaque ligne de texte
  const lineHeight = Math.floor(width / 12);
  const startY = (height / 2) - ((lines.length - 1) * lineHeight / 2);
  
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });
  
  // Ajouter un logo FloDrama
  ctx.font = `bold ${Math.floor(width / 20)}px Arial`;
  ctx.fillText('FloDrama', width / 2, height - 30);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};

/**
 * Génère une URL d'image de poster pour un item
 * @param {Object} item - Item pour lequel générer un poster
 * @returns {string} URL de l'image en base64
 */
export const getPosterUrl = (item) => {
  if (!item) return '';
  
  // Si l'item a déjà un poster valide, l'utiliser
  if (item.poster && !item.poster.includes('/assets/posters/')) {
    return item.poster;
  }
  
  return generateImageUrl(item.title, item.type);
};

/**
 * Génère une URL d'image de backdrop pour un item
 * @param {Object} item - Item pour lequel générer un backdrop
 * @returns {string} URL de l'image en base64
 */
export const getBackdropUrl = (item) => {
  if (!item) return '';
  
  // Si l'item a déjà un backdrop valide, l'utiliser
  if (item.backdrop && !item.backdrop.includes('/assets/backdrops/')) {
    return item.backdrop;
  }
  
  return generateImageUrl(item.title, item.type, 1280, 720);
};

/**
 * Génère une URL d'image de thumbnail pour un épisode
 * @param {Object} episode - Épisode pour lequel générer un thumbnail
 * @param {Object} drama - Drama parent
 * @returns {string} URL de l'image en base64
 */
export const getThumbnailUrl = (episode, drama) => {
  if (!episode || !drama) return '';
  
  // Si l'épisode a déjà un thumbnail valide, l'utiliser
  if (episode.thumbnail && !episode.thumbnail.includes('/assets/thumbnails/')) {
    return episode.thumbnail;
  }
  
  const text = `${drama.title} - S${episode.season}E${episode.episode}`;
  return generateImageUrl(text, drama.type, 640, 360);
};

// Créer un objet pour l'export par défaut
const demoImages = {
  generateImageUrl,
  getPosterUrl,
  getBackdropUrl,
  getThumbnailUrl
};

export default demoImages;
