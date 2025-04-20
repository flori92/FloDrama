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

// Dégradés prédéfinis pour les différentes catégories (utilisés dans la fonction interne)
const INTERNAL_CATEGORY_GRADIENTS = {
  drama: { from: FLODRAMA_COLORS.primary, to: FLODRAMA_COLORS.secondary },
  movie: { from: '#06B6D4', to: '#8B5CF6' }, // Cyan à Violet
  anime: { from: '#10B981', to: '#6366F1' }, // Vert à Indigo
  bollywood: { from: '#FFC107', to: '#FF69B4' }, // Orange à Rose
  default: { from: '#F59E0B', to: '#EF4444' } // Ambre à Rouge
};

// Dégradés par catégorie (fallback global pour la fonction externe)
window.categoryGradientsFallback = {
  drama: ['#3b82f6', '#8b5cf6'],
  movie: ['#8b5cf6', '#d946ef'],
  anime: ['#d946ef', '#ec4899'],
  kshow: ['#ec4899', '#f43f5e'],
  bollywood: ['#f43f5e', '#ef4444'],
  default: ['#3b82f6', '#d946ef']
};

/**
 * Générateur de placeholders
 * Ce script génère des placeholders SVG personnalisés pour les contenus
 * 
 * @version 1.1.0
 */

(function() {
  // Configuration par défaut
  const DEFAULT_CONFIG = {
    METADATA_PATH: '/data/placeholder-metadata.json',
    DEFAULT_WIDTH: 300,
    DEFAULT_HEIGHT: 450,
    DEFAULT_CATEGORY: 'default',
    DEFAULT_COLORS: {
      primary: '#3b82f6',   // Bleu signature
      secondary: '#d946ef', // Fuchsia accent
      background: '#121118' // Fond principal
    },
    USE_LOGO: true,
    DEBUG: true
  };
  
  // Métadonnées pour les placeholders (chargées depuis le fichier JSON)
  let placeholderMetadata = {
    categories: {
      default: {
        gradient: [DEFAULT_CONFIG.DEFAULT_COLORS.primary, DEFAULT_CONFIG.DEFAULT_COLORS.secondary],
        pattern: 'grid',
        icon: 'play'
      }
    },
    dimensions: {
      poster: {
        width: DEFAULT_CONFIG.DEFAULT_WIDTH,
        height: DEFAULT_CONFIG.DEFAULT_HEIGHT,
        titlePosition: 'bottom'
      }
    },
    branding: {
      logo: DEFAULT_CONFIG.USE_LOGO,
      logoPosition: 'center',
      logoSize: 0.3,
      logoOpacity: 0.5,
      textOpacity: 0.8,
      fontFamily: 'SF Pro Display, sans-serif',
      fontSize: 16,
      textColor: '#FFFFFF'
    }
  };
  
  // Référence locale aux dégradés par catégorie
  const categoryGradientsFallback = window.categoryGradientsFallback;
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama Placeholders] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Placeholders] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Placeholders] ${message}`, error || '');
    },
    
    debug: function(message) {
      if (DEFAULT_CONFIG.DEBUG) {
        console.debug(`[FloDrama Placeholders] ${message}`);
      }
    }
  };
  
  /**
   * Charge les métadonnées pour les placeholders depuis le fichier JSON
   * @returns {Promise} - Promesse résolue lorsque les métadonnées sont chargées
   */
  function loadMetadata() {
    return new Promise((resolve) => {
      logger.info("Chargement des métadonnées pour les placeholders...");
      
      fetch(DEFAULT_CONFIG.METADATA_PATH)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Impossible de charger les métadonnées: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          logger.info("Métadonnées chargées avec succès");
          placeholderMetadata = data;
          resolve(data);
        })
        .catch(error => {
          logger.error("Erreur lors du chargement des métadonnées", error);
          // Utiliser les valeurs par défaut
          resolve(placeholderMetadata);
        });
    });
  }
  
  /**
   * Génère un identifiant unique pour les éléments SVG
   * @returns {string} - Identifiant unique
   */
  function generateUniqueId() {
    return 'flodrama-' + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Génère un motif décoratif pour le placeholder
   * @param {number} index - Index du contenu
   * @param {number} width - Largeur du SVG
   * @param {number} height - Hauteur du SVG
   * @param {string} pattern - Type de motif (grid, dots, lines, waves, circles, diamonds)
   * @returns {string} - Élément SVG du motif
   */
  function generateDecorativePattern(index, width, height, pattern = 'grid') {
    // Utiliser l'index pour varier les motifs
    const patternIndex = index % 5;
    
    // Couleur du motif
    const patternColor = `rgba(255, 255, 255, 0.1)`;
    
    // Différents types de motifs
    switch (pattern) {
      case 'dots':
        {
          return `
            <g opacity="0.2">
              ${Array.from({length: 10}, (_, i) => {
                const x = (width / 10) * (i + 0.5);
                return Array.from({length: 15}, (_, j) => {
                  const y = (height / 15) * (j + 0.5);
                  const radius = 2 + (Math.sin(i + j + patternIndex) * 1.5);
                  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${patternColor}" />`;
                }).join('');
              }).join('')}
            </g>
          `;
        }
      
      case 'lines':
        return `
          <g opacity="0.15">
            ${Array.from({length: 8}, (_, i) => {
              const y = (height / 8) * i + (patternIndex * 5);
              return `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${patternColor}" stroke-width="1" />`;
            }).join('')}
            ${Array.from({length: 5}, (_, i) => {
              const x = (width / 5) * i + (patternIndex * 5);
              return `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${patternColor}" stroke-width="1" />`;
            }).join('')}
          </g>
        `;
      
      case 'waves':
        return `
          <g opacity="0.2">
            ${Array.from({length: 5}, (_, i) => {
              const y = (height / 5) * i + 40 + (patternIndex * 10);
              return `
                <path d="M0 ${y} 
                  C${width/4} ${y-20}, ${width/2} ${y+20}, ${width} ${y-10}" 
                  stroke="${patternColor}" 
                  fill="none" 
                  stroke-width="2" />
              `;
            }).join('')}
          </g>
        `;
      
      case 'circles':
        return `
          <g opacity="0.15">
            <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.4}" 
              stroke="${patternColor}" fill="none" stroke-width="2" />
            <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.3}" 
              stroke="${patternColor}" fill="none" stroke-width="1.5" />
            <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.2}" 
              stroke="${patternColor}" fill="none" stroke-width="1" />
          </g>
        `;
      
      case 'diamonds':
        return `
          <g opacity="0.2">
            <path d="M${width/2} ${height*0.2} L${width*0.7} ${height/2} L${width/2} ${height*0.8} L${width*0.3} ${height/2} Z" 
              stroke="${patternColor}" fill="none" stroke-width="2" />
            <path d="M${width/2} ${height*0.3} L${width*0.6} ${height/2} L${width/2} ${height*0.7} L${width*0.4} ${height/2} Z" 
              stroke="${patternColor}" fill="none" stroke-width="1.5" />
          </g>
        `;
      
      case 'grid':
      default:
        return `
          <pattern id="grid-${generateUniqueId()}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${patternColor}" stroke-width="1" />
          </pattern>
          <rect width="${width}" height="${height}" fill="url(#grid-${generateUniqueId()})" opacity="0.1" />
        `;
    }
  }
  
  /**
   * Génère le logo FloDrama pour le placeholder
   * @param {number} width - Largeur du SVG
   * @param {number} height - Hauteur du SVG
   * @param {number} size - Taille relative du logo (0-1)
   * @param {number} opacity - Opacité du logo (0-1)
   * @returns {string} - Élément SVG du logo
   */
  function generateLogo(width, height, size = 0.3, opacity = 0.5) {
    const logoSize = Math.min(width, height) * size;
    const x = (width - logoSize) / 2;
    const y = (height - logoSize) / 2;
    
    return `
      <g opacity="${opacity}" transform="translate(${x}, ${y}) scale(${logoSize / 100})">
        <path d="M50 10 C70 10, 90 30, 90 50 C90 70, 70 90, 50 90 C30 90, 10 70, 10 50 C10 30, 30 10, 50 10 Z" 
          fill="none" stroke="white" stroke-width="2" />
        <path d="M40 35 L65 50 L40 65 Z" fill="white" />
      </g>
    `;
  }
  
  /**
   * Génère un dégradé pour le placeholder
   * @param {Array} colors - Couleurs du dégradé
   * @returns {string} - Élément SVG du dégradé
   */
  function generateGradient(colors) {
    const uniqueId = generateUniqueId();
    return `
      <defs>
        <linearGradient id="grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors[0]}" />
          <stop offset="100%" stop-color="${colors[1] || colors[0]}" />
        </linearGradient>
      </defs>
    `;
  }
  
  /**
   * Génère une image placeholder SVG
   * @param {string} contentId - ID du contenu
   * @param {string} title - Titre du contenu
   * @param {string} category - Catégorie du contenu (drama, movie, anime, kshow, bollywood)
   * @param {Object} options - Options supplémentaires
   * @returns {string} - URL data de l'image SVG
   */
  function generatePlaceholderImage(contentId, title, category = 'default', options = {}) {
    // Générer un ID unique pour les éléments SVG
    const uniqueId = generateUniqueId();
    
    // Extraire l'index du contenu à partir de l'ID
    const contentIndex = parseInt((contentId.match(/\d+$/) || ['0'])[0], 10);
    
    // Déterminer les dimensions
    const type = options.type || 'poster';
    const dimensions = placeholderMetadata.dimensions[type] || placeholderMetadata.dimensions.poster;
    const width = options.width || dimensions.width || DEFAULT_CONFIG.DEFAULT_WIDTH;
    const height = options.height || dimensions.height || DEFAULT_CONFIG.DEFAULT_HEIGHT;
    
    // Déterminer le dégradé en fonction de la catégorie
    const categoryData = placeholderMetadata.categories[category] || placeholderMetadata.categories.default;
    const gradient = categoryData.gradient || categoryGradientsFallback[category] || categoryGradientsFallback.default;
    
    // Déterminer le motif
    const pattern = categoryData.pattern || 'grid';
    
    // Préparer le titre à afficher
    const displayTitle = title ? (title.length > 20 ? title.substring(0, 18) + '...' : title) : contentId;
    
    // Générer le SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${generateGradient(gradient)}
        <rect width="${width}" height="${height}" fill="url(#grad-${uniqueId})"/>
        ${generateDecorativePattern(contentIndex, width, height, pattern)}
        ${placeholderMetadata.branding.logo ? generateLogo(width, height, placeholderMetadata.branding.logoSize, placeholderMetadata.branding.logoOpacity) : ''}
        ${dimensions.titlePosition !== 'none' ? 
          `<text 
            x="${width/2}" 
            y="${dimensions.titlePosition === 'bottom' ? height - 20 : height/2}" 
            font-family="${placeholderMetadata.branding.fontFamily}" 
            font-size="${placeholderMetadata.branding.fontSize}" 
            fill="${placeholderMetadata.branding.textColor}" 
            text-anchor="middle"
            opacity="${placeholderMetadata.branding.textOpacity}"
          >${displayTitle}</text>` : ''}
      </svg>
    `;
    
    // Convertir en URL data
    try {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch (error) {
      logger.error("Erreur lors de la génération du placeholder SVG", error);
      
      // Fallback simple en cas d'erreur
      const fallbackSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <rect width="${width}" height="${height}" fill="${DEFAULT_CONFIG.DEFAULT_COLORS.background}"/>
          <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="16" fill="#FFFFFF" text-anchor="middle">FloDrama</text>
        </svg>
      `;
      
      return `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
    }
  }
  
  /**
   * Initialise le générateur de placeholders
   * @returns {Promise} - Promesse résolue lorsque le générateur est initialisé
   */
  function initPlaceholderGenerator() {
    logger.info("Initialisation du générateur de placeholders...");
    
    // Charger les métadonnées
    return loadMetadata()
      .then(() => {
        logger.info("Générateur de placeholders initialisé avec succès");
        return true;
      })
      .catch(error => {
        logger.error("Erreur lors de l'initialisation du générateur de placeholders", error);
        return false;
      });
  }
  
  // Exposer l'API publique
  window.FloDramaPlaceholders = {
    generatePlaceholderImage: generatePlaceholderImage,
    init: initPlaceholderGenerator,
    loadMetadata: loadMetadata
  };
  
  // Initialiser automatiquement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlaceholderGenerator);
  } else {
    initPlaceholderGenerator();
  }
})();

/**
 * Génère une image placeholder pour un contenu spécifique (fonction externe)
 * Cette fonction est exposée globalement pour une utilisation en dehors du module
 * 
 * @param {string} contentId - ID du contenu
 * @param {string} title - Titre du contenu
 * @param {string} category - Catégorie du contenu (drama, movie, anime, kshow, bollywood)
 * @param {Object} options - Options supplémentaires
 * @returns {string} - URL data de l'image SVG
 */
window.generatePlaceholderImage = function(contentId, title, category, options) {
  // Options par défaut
  const width = options.width || 300;
  const height = options.height || 450;
  const showTitle = options.showTitle !== false;
  const showLogo = options.showLogo !== false;
  
  // Sélectionner le dégradé en fonction de la catégorie
  const gradient = window.categoryGradientsFallback[category] || window.categoryGradientsFallback.default;
  
  // Extraire l'index numérique du contentId pour varier les designs
  const contentIndex = parseInt((contentId.match(/\d+/) || ['0'])[0], 10);
  
  // Générer un ID unique pour les éléments SVG
  const uniqueId = Math.random().toString(36).substring(2, 9);
  
  // Préparer le titre à afficher
  const displayTitle = showTitle ? (title || contentId) : '';
  
  // Générer le SVG avec un design qui varie selon l'index du contenu
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${gradient[0]}" />
          <stop offset="100%" stop-color="${gradient[1] || gradient[0]}" />
        </linearGradient>
        <linearGradient id="overlay-${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.5)" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="8" fill="url(#grad-${uniqueId})" />
      ${contentIndex % 2 === 0 ? `
        <circle cx="${width * 0.7}" cy="${height * 0.3}" r="${width * 0.2}" fill="rgba(255,255,255,0.1)" />
        <circle cx="${width * 0.3}" cy="${height * 0.7}" r="${width * 0.1}" fill="rgba(255,255,255,0.05)" />
      ` : `
        <path d="M0,${height * 0.4} C${width * 0.25},${height * 0.3} ${width * 0.75},${height * 0.5} ${width},${height * 0.4}" 
              stroke="rgba(255,255,255,0.1)" stroke-width="20" fill="none" />
      `}
      ${showLogo ? `
        <g opacity="0.7" transform="translate(${width/2 - 15}, ${height/2 - 15})">
          <circle cx="15" cy="15" r="15" fill="white" opacity="0.2" />
          <path d="M10 8 L22 15 L10 22 Z" fill="white" />
        </g>
      ` : ''}
      ${displayTitle ? `
        <rect width="${width}" height="60" y="${height - 60}" fill="url(#overlay-${uniqueId})" />
        <text x="${width/2}" y="${height - 25}" font-family="Arial" font-size="14" fill="white" text-anchor="middle">${displayTitle}</text>
      ` : ''}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
