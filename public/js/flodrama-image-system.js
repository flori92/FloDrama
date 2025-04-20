/**
 * Système de gestion d'images FloDrama
 * Ce fichier contient toutes les fonctions nécessaires pour gérer les images et les fallbacks
 * 
 * @version 1.2.0
 */

// Configuration globale
const CONFIG = {
  DEBUG: true,
  AUTO_INIT: true,
  USE_PLACEHOLDERS: true, // Activer les placeholders personnalisés
  RETRY_COUNT: 3, // Nombre de tentatives de chargement
  RETRY_DELAY: 1000, // Délai entre les tentatives en ms
  PRELOAD_TIMEOUT: 10000, // Timeout pour le préchargement en ms
  VERIFY_URLS: true, // Vérifier les URLs avant de les utiliser
  TRACK_STATS: true // Suivre les statistiques de chargement
};

// Configuration du système d'images
const IMAGE_CONFIG = {
  // Sources d'images par ordre de priorité
  sources: [
    {
      name: 'githubPages',
      baseUrl: 'https://flodrama.com/assets',
      enabled: true,
      priority: 1,
      pathTemplate: '/content/${contentType}/${contentId}/${type}.webp'
    },
    {
      name: 'cloudfront',
      baseUrl: 'https://d1323ouxr1qbdp.cloudfront.net',
      enabled: true,
      priority: 2,
      pathTemplate: '/content/${contentId}/${type}.jpg'
    },
    {
      name: 's3direct',
      baseUrl: 'https://flodrama-assets.s3.amazonaws.com',
      enabled: true,
      priority: 3,
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
  githubPages: true,
  cloudfront: true,
  s3direct: true
};

// Statistiques de chargement
const imageStats = {
  total: 0,
  success: 0,
  failed: 0,
  retried: 0,
  fallbackUsed: 0,
  placeholderUsed: 0,
  sources: {
    githubPages: 0,
    cloudfront: 0,
    s3direct: 0,
    local: 0
  },
  startTime: Date.now(),
  
  // Méthode pour enregistrer une statistique
  record: function(type, value = 1) {
    if (!CONFIG.TRACK_STATS) return;
    
    if (typeof this[type] === 'number') {
      this[type] += value;
    } else if (typeof this.sources[type] === 'number') {
      this.sources[type] += value;
    }
  },
  
  // Méthode pour obtenir un rapport
  getReport: function() {
    if (!CONFIG.TRACK_STATS) return null;
    
    const duration = (Date.now() - this.startTime) / 1000;
    const successRate = this.total > 0 ? (this.success / this.total * 100).toFixed(1) : 0;
    
    return {
      total: this.total,
      success: this.success,
      failed: this.failed,
      retried: this.retried,
      fallbackUsed: this.fallbackUsed,
      placeholderUsed: this.placeholderUsed,
      successRate: `${successRate}%`,
      sources: this.sources,
      duration: `${duration.toFixed(1)}s`
    };
  },
  
  // Méthode pour réinitialiser les statistiques
  reset: function() {
    this.total = 0;
    this.success = 0;
    this.failed = 0;
    this.retried = 0;
    this.fallbackUsed = 0;
    this.placeholderUsed = 0;
    this.sources = {
      githubPages: 0,
      cloudfront: 0,
      s3direct: 0,
      local: 0
    };
    this.startTime = Date.now();
  }
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
  },
  
  stats: function() {
    if (CONFIG.TRACK_STATS) {
      console.info(`[FloDrama Images Stats] ${JSON.stringify(imageStats.getReport(), null, 2)}`);
    }
  }
};

/**
 * Vérifie si une URL est accessible
 * @param {string} url - URL à vérifier
 * @returns {Promise<boolean>} - True si l'URL est accessible
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    if (!CONFIG.VERIFY_URLS) {
      resolve(true);
      return;
    }
    
    const img = new Image();
    let timeout;
    
    img.onload = function() {
      clearTimeout(timeout);
      resolve(true);
    };
    
    img.onerror = function() {
      clearTimeout(timeout);
      resolve(false);
    };
    
    // Timeout pour éviter d'attendre trop longtemps
    timeout = setTimeout(() => {
      resolve(false);
    }, 2000);
    
    img.src = url;
  });
}

/**
 * Génère les sources d'images alternatives pour un contenu
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image
 * @returns {Array<string>} - Liste des URLs alternatives
 */
function generateImageSources(contentId, type) {
  const sources = [];
  const contentType = contentId.replace(/\d+$/, '');
  
  // Logger les informations pour le débogage
  logger.debug(`Génération des sources pour ${contentId} (${type})`);
  logger.debug(`Type de contenu: ${contentType}`);
  
  // Ajouter les sources depuis la configuration
  for (const source of IMAGE_CONFIG.sources) {
    if (source.enabled && cdnStatus[source.name]) {
      let path = source.pathTemplate
        .replace('${contentId}', contentId)
        .replace('${contentType}', contentType)
        .replace('${type}', type);
      
      sources.push(source.baseUrl + path);
    }
  }
  
  // Ajouter les sources locales
  sources.push(`/assets/content/${contentType}/${contentId}_${type}.webp`);
  sources.push(`/assets/content/${contentType}/${contentId}_${type}.jpg`);
  sources.push(`/assets/content/${contentType}/${contentId}_${type}.png`);
  sources.push(`/content/${contentId}/${type}.webp`);
  sources.push(`/content/${contentId}/${type}.jpg`);
  
  // Placeholder SVG en dernier recours (généré dynamiquement)
  sources.push(`data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_CONFIG.dimensions[type]?.width || 300}" height="${IMAGE_CONFIG.dimensions[type]?.height || 450}" viewBox="0 0 ${IMAGE_CONFIG.dimensions[type]?.width || 300} ${IMAGE_CONFIG.dimensions[type]?.height || 450}"><rect width="100%" height="100%" fill="${IMAGE_CONFIG.svgFallback.colors.background}"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="${IMAGE_CONFIG.svgFallback.colors.text}" text-anchor="middle" dominant-baseline="middle">${contentId}</text></svg>`)}`);
  
  return sources;
}

/**
 * Charge une image avec plusieurs tentatives
 * @param {HTMLImageElement} img - Élément image
 * @param {Array<string>} sources - Sources d'images à essayer
 * @param {number} retryCount - Nombre de tentatives restantes
 * @param {number} sourceIndex - Index de la source actuelle
 * @returns {Promise<boolean>} - True si le chargement a réussi
 */
function loadImageWithRetry(img, sources, retryCount = CONFIG.RETRY_COUNT, sourceIndex = 0) {
  return new Promise((resolve) => {
    if (sourceIndex >= sources.length) {
      logger.warn(`Toutes les sources ont échoué pour ${img.dataset.contentId}`);
      resolve(false);
      return;
    }
    
    const currentSource = sources[sourceIndex];
    
    // Déterminer la source utilisée
    let sourceName = 'local';
    if (currentSource.includes('flodrama.com')) {
      sourceName = 'githubPages';
    } else if (currentSource.includes('cloudfront.net')) {
      sourceName = 'cloudfront';
    } else if (currentSource.includes('s3.amazonaws.com')) {
      sourceName = 's3direct';
    }
    
    // Fonction de gestion de succès
    const handleSuccess = () => {
      img.removeEventListener('load', handleSuccess);
      img.removeEventListener('error', handleError);
      
      // Enregistrer les statistiques
      imageStats.record('success');
      imageStats.record(sourceName);
      
      // Marquer l'image comme chargée avec succès
      img.setAttribute('data-load-success', 'true');
      img.setAttribute('data-source-used', sourceName);
      
      logger.debug(`Image chargée avec succès depuis ${sourceName}: ${currentSource}`);
      resolve(true);
    };
    
    // Fonction de gestion d'erreur
    const handleError = () => {
      img.removeEventListener('load', handleSuccess);
      img.removeEventListener('error', handleError);
      
      if (retryCount > 0) {
        // Essayer à nouveau avec la même source
        logger.debug(`Nouvelle tentative (${retryCount}) pour ${currentSource}`);
        imageStats.record('retried');
        
        setTimeout(() => {
          loadImageWithRetry(img, sources, retryCount - 1, sourceIndex)
            .then(resolve);
        }, CONFIG.RETRY_DELAY);
      } else {
        // Essayer la source suivante
        logger.debug(`Échec de ${currentSource}, essai de la source suivante`);
        
        setTimeout(() => {
          loadImageWithRetry(img, sources, CONFIG.RETRY_COUNT, sourceIndex + 1)
            .then(resolve);
        }, 0);
      }
    };
    
    // Ajouter les gestionnaires d'événements
    img.addEventListener('load', handleSuccess);
    img.addEventListener('error', handleError);
    
    // Charger l'image
    img.src = currentSource;
  });
}

/**
 * Génère un SVG de fallback pour une image
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 * @returns {string} SVG en base64
 */
function generateFallbackSvg(contentId, type) {
  // Déterminer les dimensions
  const width = IMAGE_CONFIG.dimensions[type]?.width || 300;
  const height = IMAGE_CONFIG.dimensions[type]?.height || 450;
  
  // Générer un SVG simple
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${IMAGE_CONFIG.svgFallback.gradient.from}" />
          <stop offset="100%" stop-color="${IMAGE_CONFIG.svgFallback.gradient.to}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="${IMAGE_CONFIG.svgFallback.colors.background}" />
      <rect width="${width}" height="${height}" fill="url(#gradient)" opacity="0.2" />
      <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="16" fill="${IMAGE_CONFIG.svgFallback.colors.text}" text-anchor="middle" dominant-baseline="middle">${contentId}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Applique un SVG de fallback à une image
 * @param {HTMLImageElement} img - Élément image
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 */
function applyFallbackSvg(img, contentId, type) {
  // Générer le SVG
  const svgData = generateFallbackSvg(contentId, type);
  
  // Appliquer le SVG
  img.src = svgData;
  img.setAttribute('data-fallback-type', 'svg');
  
  // Enregistrer les statistiques
  imageStats.record('fallbackUsed');
  imageStats.record('placeholderUsed');
}

/**
 * Gère les erreurs de chargement d'image
 * @param {Event} event - Événement d'erreur
 */
function handleImageError(event) {
  const img = event.target;
  const contentId = img.dataset.contentId;
  const type = img.dataset.type || 'poster';
  
  // Si l'image a déjà été traitée, ne rien faire
  if (img.hasAttribute('data-fallback-applied')) {
    return;
  }
  
  // Marquer l'image comme traitée
  img.setAttribute('data-fallback-applied', 'true');
  
  // Enregistrer l'erreur
  imageStats.record('failed');
  
  logger.debug(`Erreur de chargement pour ${contentId}/${type}`);
  
  // Générer les sources alternatives
  const sources = generateImageSources(contentId, type);
  
  // Essayer de charger l'image avec les sources alternatives
  loadImageWithRetry(img, sources)
    .then(success => {
      if (!success) {
        logger.warn(`Toutes les sources ont échoué pour ${contentId}/${type}, utilisation du fallback`);
        
        // Utiliser le générateur de placeholders si disponible
        if (window.FloDramaPlaceholders && typeof window.FloDramaPlaceholders.generatePlaceholderImage === 'function') {
          logger.debug(`Utilisation du générateur de placeholders pour ${contentId}/${type}`);
          
          try {
            // Déterminer la catégorie
            const contentType = contentId.replace(/\d+$/, '');
            const category = contentType || 'default';
            
            // Générer le placeholder
            const placeholderUrl = window.FloDramaPlaceholders.generatePlaceholderImage(contentId, contentId, category, {
              type: type,
              width: IMAGE_CONFIG.dimensions[type]?.width,
              height: IMAGE_CONFIG.dimensions[type]?.height
            });
            
            // Appliquer le placeholder
            img.src = placeholderUrl;
            img.setAttribute('data-fallback-type', 'placeholder');
            
            // Enregistrer les statistiques
            imageStats.record('fallbackUsed');
            imageStats.record('placeholderUsed');
          } catch (error) {
            logger.error(`Erreur lors de la génération du placeholder pour ${contentId}/${type}`, error);
            applyFallbackSvg(img, contentId, type);
          }
        } else {
          // Utiliser le SVG de fallback
          applyFallbackSvg(img, contentId, type);
        }
      }
    });
}

/**
 * Vérifie l'état de tous les CDNs
 * @returns {Promise<Object>} - État des CDNs
 */
function checkAllCdnStatus() {
  logger.info("Vérification de l'état des CDNs...");
  
  const promises = [];
  
  // Vérifier chaque CDN
  for (const source of IMAGE_CONFIG.sources) {
    if (source.enabled) {
      promises.push(
        checkCdnStatus(source.baseUrl)
          .then(available => {
            cdnStatus[source.name] = available;
            logger.info(`CDN ${source.name}: ${available ? 'disponible' : 'indisponible'}`);
            return { name: source.name, available };
          })
      );
    }
  }
  
  return Promise.all(promises)
    .then(results => {
      const status = {};
      results.forEach(result => {
        status[result.name] = result.available;
      });
      return status;
    });
}

/**
 * Vérifie l'état d'un CDN
 * @param {string} baseUrl - URL de base du CDN
 * @returns {Promise<boolean>} - True si le CDN est disponible
 */
function checkCdnStatus(baseUrl) {
  return new Promise((resolve) => {
    // Créer une image de test
    const img = new Image();
    let timeout;
    
    img.onload = function() {
      clearTimeout(timeout);
      resolve(true);
    };
    
    img.onerror = function() {
      clearTimeout(timeout);
      resolve(false);
    };
    
    // Timeout pour éviter d'attendre trop longtemps
    timeout = setTimeout(() => {
      resolve(false);
    }, 5000);
    
    // Charger une image de test
    img.src = `${baseUrl}/assets/test.jpg?t=${Date.now()}`;
  });
}

/**
 * Initialise les cartes de contenu
 * Recherche toutes les cartes de contenu et leur attribue des IDs
 * @returns {number} - Nombre de cartes initialisées
 */
function initContentCards() {
  logger.info("Initialisation des cartes de contenu...");
  
  // Sélectionner toutes les cartes de contenu
  const contentCards = document.querySelectorAll('.content-card');
  let count = 0;
  
  // Parcourir les cartes
  contentCards.forEach((card, index) => {
    // Si la carte n'a pas d'ID de contenu, en générer un
    if (!card.dataset.contentId) {
      // Essayer de déterminer le type de contenu
      let contentType = 'drama';
      
      // Vérifier si la carte est dans une section spécifique
      const section = card.closest('section');
      if (section) {
        const sectionTitle = section.querySelector('h2, h3, h4');
        if (sectionTitle) {
          const title = sectionTitle.textContent.toLowerCase();
          if (title.includes('film') || title.includes('movie')) {
            contentType = 'movie';
          } else if (title.includes('anime') || title.includes('animé')) {
            contentType = 'anime';
          } else if (title.includes('kshow') || title.includes('variety')) {
            contentType = 'kshow';
          }
        }
      }
      
      // Générer un ID de contenu
      const contentId = `${contentType}${index + 1}`;
      card.dataset.contentId = contentId;
      
      logger.debug(`ID de contenu généré pour la carte ${index}: ${contentId}`);
    }
    
    // Sélectionner l'image de la carte
    const img = card.querySelector('img');
    if (img) {
      // Définir les attributs de l'image
      img.dataset.contentId = card.dataset.contentId;
      img.dataset.type = img.dataset.type || 'poster';
      
      // Ajouter le gestionnaire d'erreur
      img.addEventListener('error', handleImageError);
      
      count++;
    }
  });
  
  logger.info(`${count} cartes de contenu initialisées`);
  return count;
}

/**
 * Précharge les images pour améliorer l'expérience utilisateur
 * @param {Array<string>} contentIds - Liste des IDs de contenu à précharger
 * @param {string} type - Type d'image (poster, backdrop, thumbnail)
 * @param {Object} _metadata - Métadonnées des contenus (non utilisé actuellement)
 */
function preloadContentImages(contentIds, type = 'poster', _metadata = null) {
  if (!contentIds || !contentIds.length) {
    logger.warn("Aucun contenu à précharger");
    return Promise.resolve([]);
  }
  
  logger.info(`Préchargement de ${contentIds.length} images de type ${type}`);
  
  // Créer un tableau pour stocker les promesses de préchargement
  const preloadPromises = [];
  
  // Précharger chaque image
  contentIds.forEach(contentId => {
    // Générer les sources
    const sources = generateImageSources(contentId, type);
    
    if (sources.length > 0) {
      // Créer une promesse pour le préchargement
      const preloadPromise = new Promise((resolve) => {
        const img = new Image();
        
        // Charger l'image avec retry
        loadImageWithRetry(img, sources)
          .then(success => {
            resolve({
              contentId,
              type,
              success,
              source: success ? img.src : null
            });
          });
        
        // Timeout pour éviter d'attendre trop longtemps
        setTimeout(() => {
          if (!img.complete) {
            logger.warn(`Timeout du préchargement pour ${contentId}/${type}`);
            resolve({
              contentId,
              type,
              success: false,
              source: null
            });
          }
        }, CONFIG.PRELOAD_TIMEOUT);
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
function initImageSystem() {
  logger.info("Initialisation du système d'images FloDrama");
  
  // Réinitialiser les statistiques
  imageStats.reset();
  
  // Vérifier l'état des CDNs
  checkAllCdnStatus()
    .then(() => {
      // Initialiser les cartes de contenu
      initContentCards();
      
      // Écouter les changements de configuration
      document.addEventListener('flodrama-config-changed', function(event) {
        if (event.detail && event.detail.path && event.detail.path.startsWith('ImageSystem')) {
          logger.info(`Configuration du système d'images mise à jour: ${event.detail.path}`);
        }
      });
      
      // Rechercher toutes les images de contenu et ajouter un gestionnaire d'erreur
      document.querySelectorAll('img[data-content-id]').forEach(img => {
        if (!img.complete || img.naturalWidth === 0) {
          // L'image n'est pas encore chargée ou a échoué
          imageStats.record('total');
          
          // Générer les sources
          const sources = generateImageSources(img.dataset.contentId, img.dataset.type || 'poster');
          
          // Charger l'image avec retry
          loadImageWithRetry(img, sources);
        } else {
          // L'image est déjà chargée
          imageStats.record('total');
          imageStats.record('success');
        }
      });
      
      logger.info("Système d'images FloDrama initialisé");
      
      // Afficher les statistiques après 5 secondes
      setTimeout(() => {
        logger.stats();
      }, 5000);
    });
}

/**
 * Obtient les statistiques de chargement d'images
 * @returns {Object} - Statistiques de chargement
 */
function getStats() {
  return imageStats.getReport();
}

/**
 * Efface le cache des images
 */
function clearCache() {
  logger.info("Effacement du cache des images...");
  
  // Réinitialiser les statistiques
  imageStats.reset();
  
  // Réinitialiser l'état des CDNs
  for (const source of IMAGE_CONFIG.sources) {
    cdnStatus[source.name] = true;
  }
  
  // Recharger toutes les images
  document.querySelectorAll('img[data-content-id]').forEach(img => {
    // Supprimer les attributs de fallback
    img.removeAttribute('data-fallback-applied');
    img.removeAttribute('data-fallback-type');
    img.removeAttribute('data-load-success');
    img.removeAttribute('data-source-used');
    
    // Générer les sources
    const sources = generateImageSources(img.dataset.contentId, img.dataset.type || 'poster');
    
    // Charger l'image avec retry
    if (sources.length > 0) {
      imageStats.record('total');
      loadImageWithRetry(img, sources);
    }
  });
  
  logger.info("Cache des images effacé");
}

// Exporter les fonctions pour une utilisation externe
window.FloDramaImageSystem = {
  generateImageSources,
  generateFallbackSvg,
  applyFallbackSvg,
  handleImageError,
  loadImageWithRetry,
  checkCdnStatus,
  checkAllCdnStatus,
  initImageSystem,
  initContentCards,
  preloadContentImages,
  getStats,
  clearCache,
  config: CONFIG
};

// Initialiser le système au chargement du DOM
if (CONFIG.AUTO_INIT) {
  document.addEventListener('DOMContentLoaded', function() {
    // Charger le script de génération de placeholders s'il n'est pas déjà chargé
    if (CONFIG.USE_PLACEHOLDERS && !window.FloDramaPlaceholders) {
      const script = document.createElement('script');
      script.src = '/js/placeholder-generator.js';
      
      script.onload = function() {
        logger.info("Générateur de placeholders chargé avec succès");
        initImageSystem();
      };
      
      script.onerror = function() {
        logger.warn("Erreur lors du chargement du générateur de placeholders");
        initImageSystem();
      };
      
      document.head.appendChild(script);
    } else {
      initImageSystem();
    }
  });
}
