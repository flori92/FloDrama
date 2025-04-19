/**
 * Configuration du système d'images pour FloDrama
 * Ce fichier centralise toutes les configurations liées aux images
 */

const CDN_CONFIG = {
  // Priorité des sources d'images (ordre de fallback)
  SOURCES: [
    {
      name: 'github',
      baseUrl: 'https://flodrama.com',
      enabled: true,
      priority: 1,
      pathTemplate: '/assets/media/${type}s/${contentId}.jpg'
    },
    {
      name: 'cloudfront-primary',
      baseUrl: 'https://d11nnqvjfooahr.cloudfront.net',
      enabled: true,
      priority: 2,
      pathTemplate: '/media/${type}s/${contentId}.jpg',
      healthCheckUrl: 'https://d11nnqvjfooahr.cloudfront.net/status.json'
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
  SVG_FALLBACK: {
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
  
  // Types d'images supportés
  TYPES: ['poster', 'backdrop', 'thumbnail', 'logo'],
  
  // Dimensions par défaut pour chaque type d'image
  DIMENSIONS: {
    poster: {
      width: 300,
      height: 450,
      aspectRatio: '2:3'
    },
    backdrop: {
      width: 1280,
      height: 720,
      aspectRatio: '16:9'
    },
    thumbnail: {
      width: 200,
      height: 113,
      aspectRatio: '16:9'
    },
    logo: {
      width: 200,
      height: 60,
      aspectRatio: '10:3'
    }
  },
  
  // Configuration du cache
  CACHE: {
    enabled: true,
    duration: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
    storageKey: 'flodrama_image_cache'
  }
};

/**
 * Génère l'URL d'une image en fonction de son type et de son ID
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 * @param {string} source - Source spécifique à utiliser (optionnel)
 * @returns {string} URL de l'image
 */
export const generateImageUrl = (contentId, type, source = null) => {
  if (!contentId || !type) {
    console.warn(`[FloDrama Images] contentId ou type manquant: ${contentId}, ${type}`);
    return null;
  }
  
  // Filtrer les sources activées et les trier par priorité
  const availableSources = CDN_CONFIG.SOURCES
    .filter(s => s.enabled && (source === null || s.name === source))
    .sort((a, b) => a.priority - b.priority);
  
  if (availableSources.length === 0) {
    console.warn(`[FloDrama Images] Aucune source disponible pour ${contentId}`);
    return null;
  }
  
  // Utiliser la première source disponible
  const selectedSource = availableSources[0];
  
  // Construire l'URL en remplaçant les variables dans le template
  const url = selectedSource.pathTemplate
    .replace('${type}s', `${type}s`)
    .replace('${contentId}', contentId);
  
  return `${selectedSource.baseUrl}${url}`;
};

/**
 * Génère un SVG de fallback pour une image
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 * @returns {string} SVG en base64
 */
export const generateFallbackSvg = (contentId, type) => {
  if (!CDN_CONFIG.SVG_FALLBACK.enabled) {
    return null;
  }
  
  const dimensions = CDN_CONFIG.DIMENSIONS[type] || CDN_CONFIG.DIMENSIONS.poster;
  const { width, height } = dimensions;
  const { background, border, text } = CDN_CONFIG.SVG_FALLBACK.colors;
  const { from, to } = CDN_CONFIG.SVG_FALLBACK.gradient;
  
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
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="SF Pro Display, Arial, sans-serif" font-size="16" fill="${text}">${type}</text>
    </svg>
  `;
  
  console.warn(`[FloDrama Images] SVG fallback appliqué pour ${contentId} (${type})`);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export default CDN_CONFIG;
