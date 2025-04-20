/**
 * Générateur d'images placeholder pour FloDrama
 * Ce script génère des images SVG personnalisées pour chaque contenu
 * avec un design élégant et conforme à l'identité visuelle de FloDrama.
 */

// Configuration des couleurs selon l'identité visuelle FloDrama
const FLODRAMA_COLORS = {
  primary: '#3b82f6',    // Bleu signature
  secondary: '#d946ef',  // Fuchsia accent
  dark: '#121118',       // Fond principal
  darkAlt: '#1A1926',    // Fond secondaire
  light: '#ffffff',      // Texte clair
  lightAlt: 'rgba(255, 255, 255, 0.7)' // Texte secondaire
};

// Dégradés prédéfinis pour les différentes catégories
const CATEGORY_GRADIENTS = {
  drama: { from: FLODRAMA_COLORS.primary, to: FLODRAMA_COLORS.secondary },
  movie: { from: '#06B6D4', to: '#8B5CF6' }, // Cyan à Violet
  anime: { from: '#10B981', to: '#6366F1' }, // Vert à Indigo
  default: { from: '#F59E0B', to: '#EF4444' } // Ambre à Rouge
};

/**
 * Génère une image SVG placeholder pour un contenu spécifique
 * @param {string} contentId - ID du contenu
 * @param {string} title - Titre du contenu
 * @param {string} category - Catégorie du contenu (drama, movie, anime)
 * @param {Object} options - Options supplémentaires
 * @param {number} options.width - Largeur de l'image (défaut: 300)
 * @param {number} options.height - Hauteur de l'image (défaut: 450)
 * @param {boolean} options.showTitle - Afficher le titre (défaut: true)
 * @param {boolean} options.showLogo - Afficher le logo FloDrama (défaut: true)
 * @returns {string} - Image SVG encodée en base64 (data URL)
 */
function generatePlaceholderImage(contentId, title, category = 'default', options = {}) {
  // Options par défaut
  const width = options.width || 300;
  const height = options.height || 450;
  const showTitle = options.showTitle !== false;
  const showLogo = options.showLogo !== false;
  
  // Sélectionner le dégradé en fonction de la catégorie
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.default;
  
  // Extraire l'index numérique du contentId pour varier les designs
  const contentIndex = parseInt((contentId.match(/\d+/) || ['0'])[0], 10);
  
  // Créer un identifiant unique pour les éléments SVG
  const uniqueId = `placeholder-${contentId.replace(/[^a-z0-9]/gi, '')}-${Date.now()}`;
  
  // Préparer le titre pour l'affichage (limiter la longueur)
  const displayTitle = title.length > 20 ? title.substring(0, 18) + '...' : title;
  
  // Générer le SVG
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${gradient.from}" />
          <stop offset="100%" stop-color="${gradient.to}" />
        </linearGradient>
        <linearGradient id="overlay-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="85%" stop-color="rgba(0,0,0,0.5)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.8)" />
        </linearGradient>
        <filter id="shadow-${uniqueId}">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3" />
        </filter>
      </defs>
      
      <!-- Fond avec dégradé -->
      <rect width="${width}" height="${height}" rx="8" fill="url(#grad-${uniqueId})" />
      
      <!-- Motif décoratif basé sur l'ID du contenu -->
      ${generateDecorativePattern(contentIndex, width, height, uniqueId)}
      
      <!-- Overlay pour le texte -->
      <rect width="${width}" height="${height}" rx="8" fill="url(#overlay-${uniqueId})" />
      
      ${showLogo ? generateFloDramaLogo(width, height, uniqueId) : ''}
      
      ${showTitle ? `
        <!-- Titre du contenu -->
        <text x="${width/2}" y="${height - 40}" 
              font-family="SF Pro Display, Arial, sans-serif" 
              font-size="18" 
              font-weight="bold"
              text-anchor="middle" 
              fill="${FLODRAMA_COLORS.light}"
              filter="url(#shadow-${uniqueId})">
          ${displayTitle}
        </text>
        
        <!-- Catégorie -->
        <text x="${width/2}" y="${height - 20}" 
              font-family="SF Pro Display, Arial, sans-serif" 
              font-size="14" 
              text-anchor="middle" 
              fill="${FLODRAMA_COLORS.lightAlt}">
          ${category.charAt(0).toUpperCase() + category.slice(1)}
        </text>
      ` : ''}
    </svg>
  `;
  
  // Encoder en base64
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Génère un motif décoratif basé sur l'index du contenu
 * @param {number} index - Index du contenu
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @param {string} uniqueId - Identifiant unique
 * @returns {string} - Éléments SVG pour le motif
 */
function generateDecorativePattern(index, width, height, uniqueId) {
  // Différents motifs en fonction de l'index
  const patternType = index % 4;
  
  switch (patternType) {
    case 0: // Cercles
      return `
        <circle cx="${width * 0.7}" cy="${height * 0.3}" r="${width * 0.4}" 
                fill="rgba(255,255,255,0.1)" />
        <circle cx="${width * 0.3}" cy="${height * 0.7}" r="${width * 0.2}" 
                fill="rgba(255,255,255,0.05)" />
      `;
    case 1: // Lignes diagonales
      return `
        <line x1="0" y1="0" x2="${width}" y2="${height}" 
              stroke="rgba(255,255,255,0.1)" stroke-width="30" />
        <line x1="${width}" y1="0" x2="0" y2="${height}" 
              stroke="rgba(255,255,255,0.05)" stroke-width="20" />
      `;
    case 2: // Vagues
      return `
        <path d="M0,${height * 0.4} 
                 C${width * 0.25},${height * 0.3} 
                  ${width * 0.75},${height * 0.5} 
                  ${width},${height * 0.4} 
                 V${height} H0 Z" 
              fill="rgba(255,255,255,0.1)" />
      `;
    case 3: // Points
      let dots = '';
      for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const r = Math.floor(Math.random() * 10) + 2;
        dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,0.1)" />`;
      }
      return dots;
    default:
      return '';
  }
}

/**
 * Génère le logo FloDrama pour les placeholders
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @param {string} uniqueId - Identifiant unique
 * @returns {string} - Éléments SVG pour le logo
 */
function generateFloDramaLogo(width, height, uniqueId) {
  const logoSize = Math.min(width, height) * 0.2;
  const logoX = width / 2 - logoSize / 2;
  const logoY = height / 2 - logoSize / 2;
  
  return `
    <g transform="translate(${logoX}, ${logoY}) scale(${logoSize/100})">
      <defs>
        <linearGradient id="logoGradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${FLODRAMA_COLORS.primary}" />
          <stop offset="100%" stop-color="${FLODRAMA_COLORS.secondary}" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient-${uniqueId})" stroke-width="5" />
      <path d="M30,35 L30,65 M45,35 L45,65 M30,35 Q37.5,25 45,35 M30,65 Q37.5,75 45,65" 
            stroke="url(#logoGradient-${uniqueId})" stroke-width="5" fill="none" stroke-linecap="round" />
      <path d="M55,35 L70,35 Q80,35 80,45 Q80,55 70,55 L55,55 L55,65" 
            stroke="url(#logoGradient-${uniqueId})" stroke-width="5" fill="none" stroke-linecap="round" />
    </g>
  `;
}

/**
 * Génère et précharge une image placeholder
 * @param {string} contentId - ID du contenu
 * @param {string} title - Titre du contenu
 * @param {string} category - Catégorie du contenu
 * @param {Object} options - Options supplémentaires
 * @returns {HTMLImageElement} - Élément image préchargé
 */
function preloadPlaceholderImage(contentId, title, category, options = {}) {
  const dataUrl = generatePlaceholderImage(contentId, title, category, options);
  const img = new Image();
  img.src = dataUrl;
  return img;
}

/**
 * Applique une image placeholder à un élément image
 * @param {HTMLImageElement} imgElement - Élément image
 * @param {string} contentId - ID du contenu
 * @param {string} title - Titre du contenu
 * @param {string} category - Catégorie du contenu
 * @param {Object} options - Options supplémentaires
 */
function applyPlaceholderToImage(imgElement, contentId, title, category, options = {}) {
  const dataUrl = generatePlaceholderImage(contentId, title, category, options);
  imgElement.src = dataUrl;
  imgElement.setAttribute('data-is-placeholder', 'true');
}

// Exporter les fonctions pour une utilisation externe
window.FloDramaPlaceholders = {
  generatePlaceholderImage,
  preloadPlaceholderImage,
  applyPlaceholderToImage
};
