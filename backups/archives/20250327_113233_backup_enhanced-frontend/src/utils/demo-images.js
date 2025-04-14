/**
 * Utilitaires pour la génération d'images de démonstration
 */

// Couleurs pour les images générées
const COLORS = [
  '#FF00FF', // Rose FloDrama
  '#6D28D9', // Violet
  '#4F46E5', // Indigo
  '#2563EB', // Bleu
  '#0891B2', // Cyan
  '#059669', // Vert
  '#D97706', // Ambre
  '#DC2626'  // Rouge
];

/**
 * Génère une URL pour une image de remplacement
 * @param {Object} item - Élément pour lequel générer une image
 * @returns {String} URL de l'image générée
 */
export const getPosterUrl = (item) => {
  try {
    // Générer une couleur basée sur l'ID ou le titre
    const id = item.id || '';
    const title = item.title || 'FloDrama';
    const colorIndex = Math.abs(hashCode(id + title)) % COLORS.length;
    
    // Retourner l'URL de l'image générée avec l'index de couleur
    return `/assets/images/placeholder-${colorIndex}.jpg`;
  } catch (error) {
    console.error('Erreur lors de la génération de l\'image de remplacement:', error);
    return '/assets/images/placeholder.jpg';
  }
};

/**
 * Fonction de hachage simple pour générer un nombre à partir d'une chaîne
 * @param {String} str - Chaîne à hacher
 * @returns {Number} Valeur de hachage
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Conversion en entier 32 bits
  }
  return hash;
}

/**
 * Génère une URL pour une image d'arrière-plan
 * @param {Object} item - Élément pour lequel générer une image
 * @returns {String} URL de l'image générée
 */
export const getBackdropUrl = (item) => {
  try {
    // Générer une couleur basée sur l'ID ou le titre
    const id = item.id || '';
    const title = item.title || 'FloDrama';
    const colorIndex = Math.abs(hashCode(id + title)) % COLORS.length;
    
    // Retourner l'URL de l'image générée
    return `/assets/images/backdrop-${colorIndex}.jpg`;
  } catch (error) {
    console.error('Erreur lors de la génération de l\'image d\'arrière-plan:', error);
    return '/assets/images/backdrop.jpg';
  }
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
  const color = COLORS[0];
  
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
export const getPosterUrlOld = (item) => {
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
export const getBackdropUrlOld = (item) => {
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
  getPosterUrlOld,
  getBackdropUrl,
  getBackdropUrlOld,
  getThumbnailUrl
};

export default demoImages;
