/**
 * Système de gestion d'images FloDrama
 * Ce fichier contient toutes les fonctions nécessaires pour gérer les images et les fallbacks
 */

// Configuration globale
const CONFIG = {
  DEBUG: false,
  AUTO_INIT: true,
  USE_PLACEHOLDERS: true // Activer les placeholders personnalisés
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
  const contentType = contentId.replace(/\d+$/, '');
  const category = contentType === 'drama' ? 'dramas' : 
                  contentType === 'movie' ? 'movies' : 
                  contentType === 'anime' ? 'animes' : 'content';
  
  // Catégorie pour les dossiers locaux
  const localCategory = contentType === 'drama' ? 'korean' : 
                        contentType === 'movie' ? 'movies' : 
                        contentType === 'anime' ? 'anime' : 'content';
  
  // Déterminer si c'est une image hero
  const isHeroImage = contentId.startsWith('hero');
  
  // Logger les informations pour le débogage
  logger.debug(`Génération des sources pour ${contentId} (${type})`);
  logger.debug(`Type de contenu: ${contentType}, Catégorie: ${category}, Catégorie locale: ${localCategory}`);
  
  if (isHeroImage) {
    // ===== SOURCES POUR LES IMAGES HERO =====
    
    // Récupérer les sources prioritaires depuis la configuration
    const priorities = CONFIG.sources.priorities || [];
    
    // Ajouter les sources prioritaires
    for (const priority of priorities) {
      if (priority.enabled) {
        sources.push(`${priority.baseUrl}assets/images/hero/${contentId}.webp`);
        sources.push(`${priority.baseUrl}assets/images/hero/${contentId}.jpg`);
        sources.push(`${priority.baseUrl}assets/images/hero/${contentId}.png`);
      }
    }
    
    // Sources locales
    sources.push(`/assets/images/hero/${contentId}.webp`);
    sources.push(`/assets/images/hero/${contentId}.jpg`);
    sources.push(`/assets/images/hero/${contentId}.png`);
    sources.push(`/assets/images/hero${contentId.replace('hero', '')}/hero.jpg`); // Format alternatif hero1/hero.jpg
    
    // Placeholder SVG en dernier recours
    sources.push(`/assets/images/hero/${contentId}.svg`);
    sources.push(`/assets/placeholders/hero${contentId.replace('hero', '')}.svg`);
  } else {
    // ===== SOURCES POUR LES IMAGES DE CONTENU =====
    
    // Récupérer les sources prioritaires depuis la configuration
    const priorities = CONFIG.sources.priorities || [];
    
    // Ajouter les sources prioritaires
    for (const priority of priorities) {
      if (priority.enabled) {
        // Pour chaque format supporté
        for (const format of CONFIG.sources.formats) {
          // Format principal avec catégorie
          sources.push(`${priority.baseUrl}${category}/${contentId}/${type}.${format}`);
          
          // Format scraped
          sources.push(`${priority.baseUrl}scraped/${contentId}/${type}.${format}`);
          
          // Format avec ID numérique
          const numericId = contentId.replace(/^[a-z]+/, '');
          sources.push(`${priority.baseUrl}${category}/${numericId}/${type}.${format}`);
          
          // Format direct
          sources.push(`${priority.baseUrl}${contentId}_${type}.${format}`);
        }
      }
    }
    
    // Sources locales - Structure principale
    sources.push(`/assets/images/content/${localCategory}/${contentId.replace(/^[a-z]+/, '')}_${type}.webp`);
    sources.push(`/assets/images/content/${localCategory}/${contentId.replace(/^[a-z]+/, '')}_${type}.jpg`);
    
    // Sources locales - Format alternatif
    sources.push(`/assets/content/${category}/${contentId}/${type}.webp`);
    sources.push(`/assets/content/${category}/${contentId}/${type}.jpg`);
    
    // Sources locales - Format direct
    sources.push(`/content/${contentId}/${type}.webp`);
    sources.push(`/content/${contentId}/${type}.jpg`);
    
    // Sources locales - Format avec ID numérique uniquement
    const numericId = contentId.replace(/^[a-z]+/, '');
    sources.push(`/assets/images/content/${localCategory}/${numericId}.webp`);
    sources.push(`/assets/images/content/${localCategory}/${numericId}.jpg`);
    
    // Ajouter le chemin vers les placeholders statiques
    if (window.FloDramaConfig && window.FloDramaConfig.get('placeholders.useStatic', true)) {
      const staticPath = window.FloDramaConfig.get('placeholders.staticPath', '/assets/placeholders/');
      sources.push(`${staticPath}${contentId}_${type}.svg`);
    }
  }
  
  logger.debug(`Sources générées pour ${contentId}/${type}: ${sources.length} sources`);
  
  // Éliminer les doublons
  return [...new Set(sources)];
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
  const type = img.dataset.type || 'poster';
  const title = img.dataset.title || contentId;
  const category = img.dataset.category || contentId.replace(/\d+$/, '');
  
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
    // Sinon, essayer d'utiliser un placeholder personnalisé
    if (CONFIG.USE_PLACEHOLDERS && window.FloDramaPlaceholders) {
      logger.info(`Utilisation d'un placeholder personnalisé pour ${contentId}/${type}`);
      try {
        // Récupérer les dimensions de l'image
        const width = img.width || IMAGE_CONFIG.dimensions[type]?.width || 300;
        const height = img.height || IMAGE_CONFIG.dimensions[type]?.height || 450;
        
        // Appliquer le placeholder personnalisé
        window.FloDramaPlaceholders.applyPlaceholderToImage(img, contentId, title, category, {
          width: width,
          height: height,
          showTitle: true,
          showLogo: true
        });
        
        // Marquer l'image comme ayant un fallback
        img.setAttribute('data-is-fallback', 'true');
        img.setAttribute('data-fallback-type', 'placeholder');
        
        // Ajouter une classe pour les styles CSS
        img.classList.add('placeholder-image');
        return;
      } catch (error) {
        logger.error(`Erreur lors de la génération du placeholder pour ${contentId}/${type}`, error);
      }
    }
    
    // Si les placeholders ne sont pas disponibles ou ont échoué, utiliser le SVG de fallback
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
 * @param {Object} _metadata - Métadonnées des contenus (non utilisé actuellement)
 */
function preloadContentImages(contentIds, type = 'poster', _metadata = null) {
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
      
      // Précharger également les placeholders si activés
      if (CONFIG.USE_PLACEHOLDERS && window.FloDramaPlaceholders) {
        try {
          // Récupérer les métadonnées du contenu si disponibles
          let title = contentId;
          let category = contentId.replace(/\d+$/, '');
          
          if (_metadata && _metadata.items) {
            const contentData = _metadata.items.find(item => item.id === contentId);
            if (contentData) {
              title = contentData.title || title;
              category = contentData.category || category;
            }
          }
          
          // Précharger le placeholder
          window.FloDramaPlaceholders.preloadPlaceholderImage(contentId, title, category, {
            width: IMAGE_CONFIG.dimensions[type]?.width,
            height: IMAGE_CONFIG.dimensions[type]?.height
          });
        } catch (error) {
          logger.error(`Erreur lors du préchargement du placeholder pour ${contentId}/${type}`, error);
        }
      }
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
    logger.info("Initialisation du système de gestion d'images FloDrama terminée");
    
    // Précharger les placeholders pour les contenus populaires
    if (CONFIG.USE_PLACEHOLDERS && window.FloDramaPlaceholders) {
      // Récupérer les métadonnées si disponibles
      fetch('/data/content.json')
        .then(response => response.json())
        .then(metadata => {
          // Précharger les placeholders pour les 20 premiers contenus
          const popularIds = metadata.items
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 20)
            .map(item => item.id);
          
          preloadContentImages(popularIds, 'poster', metadata);
        })
        .catch(error => {
          logger.error("Erreur lors du chargement des métadonnées pour les placeholders", error);
        });
    }
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
  logger.info("Système de gestion d'images avec fallbacks multiples et placeholders personnalisés initialisé");
  
  // Charger le script de génération de placeholders s'il n'est pas déjà chargé
  if (CONFIG.USE_PLACEHOLDERS && !window.FloDramaPlaceholders) {
    const script = document.createElement('script');
    script.src = '/js/placeholder-generator.js';
    script.onload = function() {
      logger.info("Générateur de placeholders chargé avec succès");
      initImageSystem();
    };
    script.onerror = function() {
      logger.error("Impossible de charger le générateur de placeholders");
      CONFIG.USE_PLACEHOLDERS = false;
      initImageSystem();
    };
    document.head.appendChild(script);
  } else {
    initImageSystem();
  }
});

window.FloDramaImageSystem = (function() {
  // Utiliser la configuration centralisée
  const CONFIG = window.FloDramaConfig ? window.FloDramaConfig.ImageSystem : {
    sources: {
      priorities: [
        { name: 'githubPages', baseUrl: 'https://flodrama.com/assets/content/', enabled: true },
        { name: 'cloudfront', baseUrl: 'https://d11nnqvjfooahr.cloudfront.net/content/', enabled: true },
        { name: 's3direct', baseUrl: 'https://flodrama-assets.s3.amazonaws.com/content/', enabled: true }
      ],
      localPaths: ['/assets/content/', '/content/', '/public/content/', '/assets/placeholders/'],
      formats: ['webp', 'jpg', 'png']
    }
  };
  
  // Système de logs
  const logger = {
    debug: function(message) {
      if (window.FloDramaConfig && window.FloDramaConfig.get('debug.enabled', false)) {
        console.debug(`[FloDrama Image System] ${message}`);
      }
    },
    
    info: function(message) {
      console.info(`[FloDrama Image System] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Image System] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Image System] ${message}`, error);
    }
  };
  
  /**
   * Génère les sources d'images pour un contenu
   * @param {string} contentId - Identifiant du contenu
   * @param {string} type - Type d'image
   * @returns {Array<string>} - Liste des URLs des sources d'images
   */
  function generateImageSources(contentId, type) {
    const sources = [];
    const contentType = contentId.replace(/\d+$/, '');
    const category = contentType === 'drama' ? 'dramas' : 
                    contentType === 'movie' ? 'movies' : 
                    contentType === 'anime' ? 'animes' : 'content';
    
    // Catégorie pour les dossiers locaux
    const localCategory = contentType === 'drama' ? 'korean' : 
                          contentType === 'movie' ? 'movies' : 
                          contentType === 'anime' ? 'anime' : 'content';
    
    // Déterminer si c'est une image hero
    const isHeroImage = contentId.startsWith('hero');
    
    // Logger les informations pour le débogage
    logger.debug(`Génération des sources pour ${contentId} (${type})`);
    logger.debug(`Type de contenu: ${contentType}, Catégorie: ${category}, Catégorie locale: ${localCategory}`);
    
    if (isHeroImage) {
      // ===== SOURCES POUR LES IMAGES HERO =====
      
      // Récupérer les sources prioritaires depuis la configuration
      const priorities = CONFIG.sources.priorities || [];
      
      // Ajouter les sources prioritaires
      for (const priority of priorities) {
        if (priority.enabled) {
          sources.push(`${priority.baseUrl}assets/images/hero/${contentId}.webp`);
          sources.push(`${priority.baseUrl}assets/images/hero/${contentId}.jpg`);
          sources.push(`${priority.baseUrl}assets/images/hero/${contentId}.png`);
        }
      }
      
      // Sources locales
      sources.push(`/assets/images/hero/${contentId}.webp`);
      sources.push(`/assets/images/hero/${contentId}.jpg`);
      sources.push(`/assets/images/hero/${contentId}.png`);
      sources.push(`/assets/images/hero${contentId.replace('hero', '')}/hero.jpg`); // Format alternatif hero1/hero.jpg
      
      // Placeholder SVG en dernier recours
      sources.push(`/assets/images/hero/${contentId}.svg`);
      sources.push(`/assets/placeholders/hero${contentId.replace('hero', '')}.svg`);
    } else {
      // ===== SOURCES POUR LES IMAGES DE CONTENU =====
      
      // Récupérer les sources prioritaires depuis la configuration
      const priorities = CONFIG.sources.priorities || [];
      
      // Ajouter les sources prioritaires
      for (const priority of priorities) {
        if (priority.enabled) {
          // Pour chaque format supporté
          for (const format of CONFIG.sources.formats) {
            // Format principal avec catégorie
            sources.push(`${priority.baseUrl}${category}/${contentId}/${type}.${format}`);
            
            // Format scraped
            sources.push(`${priority.baseUrl}scraped/${contentId}/${type}.${format}`);
            
            // Format avec ID numérique
            const numericId = contentId.replace(/^[a-z]+/, '');
            sources.push(`${priority.baseUrl}${category}/${numericId}/${type}.${format}`);
            
            // Format direct
            sources.push(`${priority.baseUrl}${contentId}_${type}.${format}`);
          }
        }
      }
      
      // Sources locales - Structure principale
      sources.push(`/assets/images/content/${localCategory}/${contentId.replace(/^[a-z]+/, '')}_${type}.webp`);
      sources.push(`/assets/images/content/${localCategory}/${contentId.replace(/^[a-z]+/, '')}_${type}.jpg`);
      
      // Sources locales - Format alternatif
      sources.push(`/assets/content/${category}/${contentId}/${type}.webp`);
      sources.push(`/assets/content/${category}/${contentId}/${type}.jpg`);
      
      // Sources locales - Format direct
      sources.push(`/content/${contentId}/${type}.webp`);
      sources.push(`/content/${contentId}/${type}.jpg`);
      
      // Sources locales - Format avec ID numérique uniquement
      const numericId = contentId.replace(/^[a-z]+/, '');
      sources.push(`/assets/images/content/${localCategory}/${numericId}.webp`);
      sources.push(`/assets/images/content/${localCategory}/${numericId}.jpg`);
      
      // Ajouter le chemin vers les placeholders statiques
      if (window.FloDramaConfig && window.FloDramaConfig.get('placeholders.useStatic', true)) {
        const staticPath = window.FloDramaConfig.get('placeholders.staticPath', '/assets/placeholders/');
        sources.push(`${staticPath}${contentId}_${type}.svg`);
      }
    }
    
    logger.debug(`Sources générées pour ${contentId}/${type}: ${sources.length} sources`);
    
    // Éliminer les doublons
    return [...new Set(sources)];
  }
  
  /**
   * Gère les erreurs de chargement d'images
   * @param {Event} event - Événement d'erreur
   */
  function handleImageError(event) {
    const img = event.target;
    const contentId = img.dataset.contentId;
    const type = img.dataset.type || 'poster';
    
    // Si l'image n'a pas d'attribut de contenu, ne rien faire
    if (!contentId) {
      logger.warn("Image sans attribut data-content-id");
      return;
    }
    
    logger.debug(`Erreur de chargement pour ${contentId}/${type}`);
    
    // Récupérer l'index de la source actuelle
    const currentSrc = img.src;
    const sources = generateImageSources(contentId, type);
    const currentIndex = sources.indexOf(currentSrc);
    
    // Si l'index est valide et qu'il y a une source suivante
    if (currentIndex !== -1 && currentIndex < sources.length - 1) {
      // Essayer la source suivante
      const nextSrc = sources[currentIndex + 1];
      logger.debug(`Essai de la source suivante: ${nextSrc}`);
      
      img.src = nextSrc;
      
      // Si c'est la dernière source (placeholder), marquer l'image
      if (currentIndex + 1 === sources.length - 1) {
        img.setAttribute('data-fallback-type', 'placeholder');
      }
    } else {
      // Si toutes les sources ont échoué, utiliser un placeholder dynamique
      if (window.FloDramaConfig && window.FloDramaConfig.get('placeholders.useDynamic', true)) {
        if (window.generatePlaceholder) {
          logger.debug(`Génération d'un placeholder dynamique pour ${contentId}/${type}`);
          
          // Récupérer les couleurs de la catégorie
          const contentType = contentId.replace(/\d+$/, '');
          const categoryColors = window.FloDramaConfig.get(`placeholders.colors.${contentType}`, 
                                window.FloDramaConfig.get('placeholders.colors.default', {
                                  primary: '#3b82f6',
                                  secondary: '#d946ef'
                                }));
          
          // Générer un placeholder
          const placeholderSvg = window.generatePlaceholder(contentId, type, {
            primaryColor: categoryColors.primary,
            secondaryColor: categoryColors.secondary
          });
          
          // Appliquer le placeholder
          img.src = placeholderSvg;
          img.setAttribute('data-fallback-type', 'dynamic-placeholder');
        } else {
          // Si le générateur de placeholder n'est pas disponible, utiliser un dégradé
          logger.warn("Générateur de placeholder non disponible");
          
          // Appliquer un style de dégradé directement
          img.style.background = window.FloDramaConfig.get('visualIdentity.gradient', 'linear-gradient(to right, #3b82f6, #d946ef)');
          img.setAttribute('data-fallback-type', 'gradient');
          
          // Masquer l'image source mais garder les dimensions
          img.style.visibility = 'hidden';
        }
      }
    }
  }
  
  /**
   * Précharge les images pour une liste de contenus
   * @param {Array<string>} contentIds - Liste des identifiants de contenu
   * @param {string} type - Type d'image (poster, backdrop, thumbnail)
   * @param {Object} _metadata - Métadonnées des contenus (non utilisé actuellement)
   */
  function preloadContentImages(contentIds, type = 'poster', _metadata = null) {
    if (!contentIds || !contentIds.length) {
      logger.warn("Aucun contenu à précharger");
      return;
    }
    
    logger.info(`Préchargement de ${contentIds.length} images de type ${type}`);
    
    // Créer un tableau pour stocker les promesses de préchargement
    const preloadPromises = [];
    
    // Précharger chaque image
    contentIds.forEach(contentId => {
      const sources = generateImageSources(contentId, type);
      
      if (sources.length > 0) {
        // Créer une promesse pour le préchargement
        const preloadPromise = new Promise((resolve) => {
          const img = new Image();
          
          img.onload = function() {
            logger.debug(`Image préchargée: ${contentId}/${type}`);
            resolve({ contentId, type, success: true });
          };
          
          img.onerror = function() {
            // Si la première source échoue, essayer la suivante
            if (sources.length > 1) {
              img.src = sources[1];
            } else {
              logger.debug(`Échec du préchargement: ${contentId}/${type}`);
              resolve({ contentId, type, success: false });
            }
          };
          
          // Commencer le chargement
          img.src = sources[0];
        });
        
        preloadPromises.push(preloadPromise);
      }
    });
    
    // Retourner une promesse qui se résout lorsque toutes les images sont préchargées
    return Promise.all(preloadPromises);
  }
  
  /**
   * Initialise le système d'images
   */
  function init() {
    logger.info("Initialisation du système d'images FloDrama");
    
    // Écouter les changements de configuration
    document.addEventListener('flodrama-config-changed', function(event) {
      if (event.detail.path.startsWith('ImageSystem')) {
        logger.info(`Configuration du système d'images mise à jour: ${event.detail.path}`);
      }
    });
    
    // Rechercher toutes les images de contenu et ajouter un gestionnaire d'erreur
    document.querySelectorAll('img[data-content-id]').forEach(img => {
      img.addEventListener('error', handleImageError);
    });
    
    logger.info("Système d'images FloDrama initialisé");
  }
  
  // Initialiser le système au chargement du DOM
  document.addEventListener('DOMContentLoaded', init);
  
  // Exposer l'API publique
  return {
    generateImageSources,
    handleImageError,
    preloadContentImages,
    init
  };
})();
