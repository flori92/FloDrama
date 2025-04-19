/**
 * Système de gestion d'images FloDrama
 * Ce fichier contient toutes les fonctions nécessaires pour gérer les images et les fallbacks
 */

// Configuration globale
const CONFIG = {
  DEBUG: false,
  AUTO_INIT: true
};

// Configuration du système d'images
const IMAGE_CONFIG = {
  // Sources d'images par ordre de priorité
  sources: [
    {
      name: 's3direct',
      baseUrl: 'https://flodrama-assets.s3.amazonaws.com',
      enabled: true,
      priority: 1,
      pathTemplate: '/content/${contentId}/${type}.webp'
    }
  ],
  
  // Configuration du fallback SVG
  svgFallback: {
    enabled: true,
    colors: {
      background: '#1A1926',
      border: 'url(#gradient)',
      text: '#FFFFFF'
    },
    gradient: {
      from: '#3b82f6',
      to: '#d946ef'
    }
  },
  
  // Dimensions par défaut pour chaque type d'image
  dimensions: {
    poster: {
      width: 300,
      height: 450
    },
    backdrop: {
      width: 1280,
      height: 720
    },
    thumbnail: {
      width: 200,
      height: 113
    },
    logo: {
      width: 200,
      height: 60
    }
  }
};

// État des CDNs
const cdnStatus = {
  s3direct: true // S3 direct uniquement
};

// Système de logs
const logger = {
  info: function(message) {
    console.info(`[FloDrama Images] ${message}`);
  },
  
  warn: function(message) {
    console.warn(`[FloDrama Images] ${message}`);
  },
  
  error: function(message, error) {
    console.error(`[FloDrama Images] ${message}`, error);
  },
  
  debug: function(message) {
    if (CONFIG.DEBUG) console.debug(`[FloDrama Images] ${message}`);
  }
};

/**
 * Génère les sources d'images alternatives pour un contenu
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @returns {Array<string>} - Liste des URLs alternatives
 */
function generateImageSources(contentId, type) {
  const sources = [];
  
  // Déterminer si c'est une image hero ou une image de contenu
  const isHeroImage = contentId.startsWith('hero');
  
  // Ajouter S3 direct si disponible
  if (cdnStatus.s3direct) {
    if (isHeroImage) {
      // Pour les images hero
      sources.push(`https://flodrama-assets.s3.amazonaws.com/assets/images/hero/${contentId}.jpg`);
      sources.push(`https://flodrama-assets.s3.amazonaws.com/assets/images/hero/${contentId}.webp`);
      sources.push(`https://flodrama-assets.s3.amazonaws.com/assets/images/hero/${contentId}.svg`);
    } else {
      // Pour les images de contenu (posters, backdrops, etc.)
      // Format: drama001, movie002, anime003, etc.
      const contentType = contentId.replace(/\d+$/, ''); // Extraire le préfixe (drama, movie, anime)
      
      // Utiliser les chemins corrects pour les assets scrapés (plusieurs formats possibles)
      
      // 1. Format standard: /content/dramas/drama001/poster.webp
      sources.push(`https://flodrama-assets.s3.amazonaws.com/content/${contentType}s/${contentId}/${type}.webp`);
      sources.push(`https://flodrama-assets.s3.amazonaws.com/content/${contentType}s/${contentId}/${type}.jpg`);
      
      // 2. Format alternatif: /scraped/drama001/poster.webp
      sources.push(`https://flodrama-assets.s3.amazonaws.com/scraped/${contentId}/${type}.webp`);
      sources.push(`https://flodrama-assets.s3.amazonaws.com/scraped/${contentId}/${type}.jpg`);
      
      // 3. Format direct: /drama001_poster.webp
      sources.push(`https://flodrama-assets.s3.amazonaws.com/${contentId}_${type}.webp`);
      sources.push(`https://flodrama-assets.s3.amazonaws.com/${contentId}_${type}.jpg`);
      
      // 4. Format avec catégorie: /dramas/drama001_poster.webp
      sources.push(`https://flodrama-assets.s3.amazonaws.com/${contentType}s/${contentId}_${type}.webp`);
      sources.push(`https://flodrama-assets.s3.amazonaws.com/${contentType}s/${contentId}_${type}.jpg`);
    }
  }
  
  // Toujours ajouter GitHub Pages (flodrama.com) comme fallback prioritaire
  if (isHeroImage) {
    // Fallbacks pour les images hero
    sources.push(`/assets/images/hero/${contentId}.jpg`);
    sources.push(`/assets/images/hero/${contentId}.webp`);
    sources.push(`/assets/images/hero/${contentId}.svg`);
  } else {
    // Fallbacks pour les images de contenu
    const contentType = contentId.replace(/\d+$/, ''); // Extraire le préfixe (drama, movie, anime)
    
    // Chemins locaux avec plusieurs formats possibles
    
    // 1. Format standard
    sources.push(`/assets/content/${contentType}s/${contentId}/${type}.webp`);
    sources.push(`/assets/content/${contentType}s/${contentId}/${type}.jpg`);
    sources.push(`/content/${contentType}s/${contentId}/${type}.webp`);
    sources.push(`/content/${contentType}s/${contentId}/${type}.jpg`);
    
    // 2. Format alternatif
    sources.push(`/assets/scraped/${contentId}/${type}.webp`);
    sources.push(`/assets/scraped/${contentId}/${type}.jpg`);
    sources.push(`/scraped/${contentId}/${type}.webp`);
    sources.push(`/scraped/${contentId}/${type}.jpg`);
    
    // 3. Format direct
    sources.push(`/assets/${contentId}_${type}.webp`);
    sources.push(`/assets/${contentId}_${type}.jpg`);
    sources.push(`/${contentId}_${type}.webp`);
    sources.push(`/${contentId}_${type}.jpg`);
    
    // 4. Format avec catégorie
    sources.push(`/assets/${contentType}s/${contentId}_${type}.webp`);
    sources.push(`/assets/${contentType}s/${contentId}_${type}.jpg`);
    sources.push(`/${contentType}s/${contentId}_${type}.webp`);
    sources.push(`/${contentType}s/${contentId}_${type}.jpg`);
  }
  
  logger.debug(`Sources générées pour ${contentId}/${type}: ${sources.length} sources`);
  return sources;
}

/**
 * Génère un SVG de fallback pour une image
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 * @returns {string} SVG en base64
 */
function generateFallbackSvg(contentId, type) {
  const dimensions = IMAGE_CONFIG.dimensions[type] || IMAGE_CONFIG.dimensions.poster;
  const { width, height } = dimensions;
  
  // Générer une couleur basée sur l'ID du contenu pour avoir des dégradés différents
  const contentIndex = parseInt(contentId.replace(/[^\d]/g, '')) || 0;
  const colorPairs = [
    { from: '#6366F1', to: '#FB7185' }, // Indigo à Rose
    { from: '#3B82F6', to: '#10B981' }, // Bleu à Vert
    { from: '#8B5CF6', to: '#EC4899' }, // Violet à Rose
    { from: '#F59E0B', to: '#EF4444' }, // Ambre à Rouge
    { from: '#06B6D4', to: '#8B5CF6' }, // Cyan à Violet
    { from: '#10B981', to: '#6366F1' }, // Vert à Indigo
    { from: '#EC4899', to: '#F59E0B' }, // Rose à Ambre
    { from: '#EF4444', to: '#06B6D4' }  // Rouge à Cyan
  ];
  
  // Sélectionner une paire de couleurs basée sur l'ID
  const colorIndex = contentIndex % colorPairs.length;
  const { from, to } = colorPairs[colorIndex];
  
  // Créer un SVG avec un dégradé attrayant sans texte
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient${contentIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="8" fill="url(#gradient${contentIndex})" />
    </svg>
  `;
  
  logger.warn(`[FloDrama Images] Dégradé appliqué pour ${contentId} (${type})`);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Applique un SVG de fallback à une image
 * @param {HTMLImageElement} img - Élément image
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 */
function applyFallbackSvg(img, contentId, type) {
  const fallbackSvg = generateFallbackSvg(contentId, type);
  img.src = fallbackSvg;
  img.classList.add('fallback-svg');
  
  // Ajouter un attribut pour indiquer que c'est un fallback
  img.setAttribute('data-is-fallback', 'true');
}

/**
 * Gère les erreurs de chargement d'image
 * @param {Event} event - Événement d'erreur
 */
function handleImageError(event) {
  const img = event.target;
  const contentId = img.dataset.contentId;
  const type = img.dataset.type;
  
  // Si l'image a déjà un fallback, ne rien faire
  if (img.getAttribute('data-is-fallback') === 'true') {
    return;
  }
  
  // Essayer les sources alternatives
  const sources = generateImageSources(contentId, type);
  const currentSrc = img.src;
  
  // Trouver l'index de la source actuelle
  const currentIndex = sources.findIndex(src => currentSrc.includes(src));
  
  // Journaliser l'erreur pour le débogage
  logger.warn(`Échec de chargement pour ${contentId}/${type} - Source: ${currentSrc}`);
  
  // S'il y a une source alternative disponible
  if (currentIndex < sources.length - 1 && currentIndex !== -1) {
    // Utiliser la source suivante
    const nextSource = sources[currentIndex + 1];
    logger.info(`Tentative avec source alternative: ${nextSource}`);
    img.src = nextSource;
  } else if (currentIndex === -1 && sources.length > 0) {
    // Si la source actuelle n'est pas dans notre liste, essayer la première source
    const firstSource = sources[0];
    logger.info(`Source actuelle non reconnue, tentative avec: ${firstSource}`);
    img.src = firstSource;
  } else {
    // Sinon, appliquer le fallback SVG
    logger.warn(`Aucune source alternative disponible pour ${contentId}/${type}, application du SVG de fallback`);
    applyFallbackSvg(img, contentId, type);
  }
}

/**
 * Vérifie l'état du CDN S3 uniquement
 */
async function checkAllCdnStatus() {
  logger.debug("Vérification de l'état du CDN S3");
  try {
    cdnStatus.s3direct = await checkCdnStatus('https://flodrama-assets.s3.amazonaws.com');
    logger.info(`État du CDN S3 direct : ${cdnStatus.s3direct ? 'OK' : 'KO'}`);
    window.dispatchEvent(new CustomEvent('flodrama:cdn-status-updated', {
      detail: {
        s3direct: cdnStatus.s3direct,
        timestamp: Date.now()
      }
    }));
  } catch (error) {
    logger.error("Erreur lors de la vérification du CDN S3", error);
  }
}

/**
 * Vérifie l'état d'un CDN
 * @param {string} baseUrl - URL de base du CDN
 * @returns {Promise<boolean>} - True si le CDN est disponible
 */
async function checkCdnStatus(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/status.json?_t=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    logger.warn(`[FloDrama Images] CDN inaccessible: ${baseUrl}`);
    return false;
  }
}

/**
 * Initialise les cartes de contenu
 * Recherche toutes les cartes de contenu et leur attribue des IDs
 * @returns {number} - Nombre de cartes initialisées
 */
function initContentCards() {
  const contentCards = document.querySelectorAll('.content-card');
  let count = 0;
  
  contentCards.forEach((card, index) => {
    // Vérifier si la carte a déjà un ID de contenu
    const poster = card.querySelector('.card-poster');
    if (poster) {
      const img = poster.querySelector('img') || poster;
      
      // Si l'image n'a pas d'ID de contenu, lui en attribuer un temporaire
      if (!img.dataset.contentId) {
        const contentId = `temp${index.toString().padStart(3, '0')}`;
        img.setAttribute('data-content-id', contentId);
        img.setAttribute('data-type', 'poster');
        
        // Ajouter un attribut pour indiquer que c'est une carte temporaire
        card.setAttribute('data-is-temp', 'true');
      }
      
      // Ajouter un gestionnaire d'erreur pour les images
      img.addEventListener('error', handleImageError);
      
      // Forcer le chargement de l'image si elle n'a pas de src
      if (!img.src && img.dataset.contentId) {
        const sources = generateImageSources(img.dataset.contentId, img.dataset.type || 'poster');
        if (sources.length > 0) {
          img.src = sources[0];
        }
      }
      
      count++;
    }
  });
  
  logger.info(`[FloDrama Images] ${count} cartes de contenu initialisées`);
  return count;
}

/**
 * Précharge les images pour améliorer l'expérience utilisateur
 * @param {Array<string>} contentIds - Liste des IDs de contenu à précharger
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 */
function preloadContentImages(contentIds, type = 'poster') {
  if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
    logger.warn('[FloDrama Images] Aucun ID de contenu fourni pour le préchargement');
    return;
  }
  
  logger.info(`[FloDrama Images] Préchargement de ${contentIds.length} images de type ${type}`);
  
  // Limiter le nombre d'images à précharger pour éviter de surcharger le navigateur
  const idsToPreload = contentIds.slice(0, 10);
  
  // Précharger les images en arrière-plan
  idsToPreload.forEach(contentId => {
    const sources = generateImageSources(contentId, type);
    if (sources.length > 0) {
      const img = new Image();
      img.src = sources[0];
    }
  });
}

/**
 * Initialise le système d'images
 */
function initImageSystem() {
  // Ajouter un gestionnaire global pour les erreurs d'images
  document.addEventListener('error', function(e) {
    if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
      handleImageError(e);
      e.preventDefault();
    }
  }, true);
  
  // Initialiser les attributs pour les cartes de contenu
  initContentCards();
  
  // Vérifier l'état des CDNs
  checkAllCdnStatus().then(() => {
    console.log("Initialisation du système de gestion d'images FloDrama");
  });
}

// Exporter les fonctions pour une utilisation externe
window.FloDramaImageSystem = {
  generateImageSources,
  generateFallbackSvg,
  applyFallbackSvg,
  handleImageError,
  checkCdnStatus,
  checkAllCdnStatus,
  initImageSystem,
  initContentCards,
  preloadContentImages
};

// Initialiser le système d'images au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  console.log("Système de gestion d'images avec fallbacks multiples initialisé");
  initImageSystem();
});
