/**
 * Système de gestion d'images FloDrama
 * Ce fichier contient toutes les fonctions nécessaires pour gérer les images et les fallbacks
 */

// Configuration du système d'images
const IMAGE_CONFIG = {
  // Sources d'images par ordre de priorité
  sources: [
    {
      name: 'github',
      baseUrl: 'https://flodrama.com',
      enabled: true,
      priority: 1,
      pathTemplate: '/assets/media/${type}s/${contentId}.jpg'
    },
    {
      name: 'cloudfront',
      baseUrl: 'https://d11nnqvjfooahr.cloudfront.net',
      enabled: true,
      priority: 2,
      pathTemplate: '/media/${type}s/${contentId}.jpg'
    },
    {
      name: 's3-direct',
      baseUrl: 'https://flodrama-assets.s3.amazonaws.com',
      enabled: true,
      priority: 3,
      pathTemplate: '/media/${type}s/${contentId}.jpg'
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
  github: true, // GitHub Pages est toujours considéré comme disponible car c'est local
  cloudfront: false,
  's3-direct': false
};

/**
 * Génère les URLs des sources d'images pour un contenu donné
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 * @returns {Array<string>} Liste des URLs
 */
function generateImageSources(contentId, type) {
  if (!contentId || !type) {
    console.warn('[FloDrama Images] contentId ou type manquant');
    return [];
  }
  
  const sources = [];
  
  // D'abord les assets locaux (GitHub Pages)
  sources.push(`${IMAGE_CONFIG.sources[0].baseUrl}${IMAGE_CONFIG.sources[0].pathTemplate.replace('${type}', type).replace('${contentId}', contentId)}`);
  
  // Puis CloudFront AWS si disponible
  if (cdnStatus.cloudfront) {
    sources.push(`${IMAGE_CONFIG.sources[1].baseUrl}${IMAGE_CONFIG.sources[1].pathTemplate.replace('${type}', type).replace('${contentId}', contentId)}`);
  }
  
  // Puis S3 direct si disponible
  if (cdnStatus['s3-direct']) {
    sources.push(`${IMAGE_CONFIG.sources[2].baseUrl}${IMAGE_CONFIG.sources[2].pathTemplate.replace('${type}', type).replace('${contentId}', contentId)}`);
  }
  
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
  const { background } = IMAGE_CONFIG.svgFallback.colors;
  const { from, to } = IMAGE_CONFIG.svgFallback.gradient;
  
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="${background}" />
      <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="8" stroke="url(#gradient)" stroke-width="2" fill="none" />
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="SF Pro Display, Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#gradient)">${contentId || 'FloDrama'}</text>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="SF Pro Display, Arial, sans-serif" font-size="16" fill="#FFFFFF">${type}</text>
    </svg>
  `;
  
  console.warn(`[FloDrama Images] SVG fallback appliqué pour ${contentId} (${type})`);
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
  
  // S'il y a une source alternative disponible
  if (currentIndex < sources.length - 1) {
    img.src = sources[currentIndex + 1];
  } else {
    // Sinon, appliquer le fallback SVG
    applyFallbackSvg(img, contentId, type);
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
    console.warn(`[FloDrama Images] CDN inaccessible: ${baseUrl}`);
    return false;
  }
}

/**
 * Vérifie l'état de tous les CDNs
 */
async function checkAllCdnStatus() {
  try {
    // Vérifier CloudFront
    cdnStatus.cloudfront = await checkCdnStatus('https://d11nnqvjfooahr.cloudfront.net');
    
    // Vérifier S3 direct
    cdnStatus['s3-direct'] = await checkCdnStatus('https://flodrama-assets.s3.amazonaws.com');
    
    console.log(`État des CDNs - CloudFront: ${cdnStatus.cloudfront ? 'OK' : 'KO'}, GitHub: ${cdnStatus.github ? 'OK' : 'KO'}, S3 direct: ${cdnStatus['s3-direct'] ? 'OK' : 'KO'}`);
  } catch (error) {
    console.error('Erreur lors de la vérification des CDNs', error);
  }
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
  initImageSystem
};

// Initialiser le système d'images au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  console.log("Système de gestion d'images avec fallbacks multiples initialisé");
  initImageSystem();
});
