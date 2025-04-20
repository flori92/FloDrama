/**
 * FloDrama - Configuration du système d'images
 * Configuration centralisée pour le système d'images de FloDrama
 * 
 * @version 1.1.0
 */

(function() {
  // Configuration par défaut
  const DEFAULT_CONFIG = {
    // Sources d'images par ordre de priorité
    SOURCES: [
      {
        name: 'githubPages',
        baseUrl: 'https://flodrama.com/assets',
        pattern: '/content/{contentType}/{contentId}/{imageType}.webp',
        enabled: true,
        priority: 1
      },
      {
        name: 'cloudfront',
        baseUrl: 'https://d1323ouxr1qbdp.cloudfront.net',
        pattern: '/content/{contentId}/{imageType}.jpg',
        enabled: true,
        priority: 2
      },
      {
        name: 's3direct',
        baseUrl: 'https://flodrama-assets.s3.amazonaws.com',
        pattern: '/content/{contentId}/{imageType}.webp',
        enabled: true,
        priority: 3
      }
    ],
    
    // Configuration des placeholders
    PLACEHOLDERS: {
      enabled: true,
      useCustomGenerator: true,
      defaultWidth: 300,
      defaultHeight: 450,
      colors: {
        primary: '#3b82f6',    // Bleu signature
        secondary: '#d946ef',  // Fuchsia accent
        background: '#121118', // Fond principal
        text: '#FFFFFF'        // Texte
      }
    },
    
    // Configuration du chargement
    LOADING: {
      lazy: true,
      preloadPopular: true,
      preloadLimit: 10,
      retryCount: 2,
      retryDelay: 1000,
      timeout: 5000
    },
    
    // Configuration du cache
    CACHE: {
      enabled: true,
      storageKey: 'flodrama_image_cache',
      expiration: 7 * 24 * 60 * 60 * 1000, // 7 jours
      maxEntries: 100
    },
    
    // Configuration du débogage
    DEBUG: {
      enabled: true,
      logSourceSelection: true,
      logErrors: true,
      logPerformance: true,
      trackStats: true
    }
  };
  
  // Configuration active (peut être modifiée par l'utilisateur ou l'application)
  let activeConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  
  /**
   * Fonction utilitaire pour fusionner récursivement deux objets
   * @param {Object} target - Objet cible
   * @param {Object} source - Objet source
   * @returns {Object} - Objet fusionné
   */
  function deepMerge(target, source) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] instanceof Object && key in target) {
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }
  
  /**
   * Obtient la configuration complète ou une section spécifique
   * @param {string} section - Section de configuration à obtenir (optionnel)
   * @returns {Object} - Configuration ou section demandée
   */
  function getConfig(section) {
    if (section) {
      return activeConfig[section] || {};
    }
    return activeConfig;
  }
  
  /**
   * Met à jour la configuration avec de nouvelles valeurs
   * @param {Object} newConfig - Nouvelles valeurs de configuration
   * @param {boolean} merge - Si true, fusionne avec la config existante, sinon remplace
   */
  function setConfig(newConfig, merge = true) {
    if (merge) {
      // Fusion récursive des objets
      activeConfig = deepMerge(activeConfig, newConfig);
    } else {
      activeConfig = newConfig;
    }
    
    // Déclencher un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('imageConfigUpdated', { 
      detail: { config: activeConfig } 
    }));
    
    return activeConfig;
  }
  
  /**
   * Réinitialise la configuration aux valeurs par défaut
   * @param {string} section - Section à réinitialiser (optionnel, si non spécifié, réinitialise tout)
   */
  function resetConfig(section) {
    if (section) {
      activeConfig[section] = JSON.parse(JSON.stringify(DEFAULT_CONFIG[section]));
    } else {
      activeConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    
    // Déclencher un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('imageConfigUpdated', { 
      detail: { config: activeConfig } 
    }));
    
    return activeConfig;
  }
  
  /**
   * Obtient les sources d'images triées par priorité
   * @returns {Array} - Sources d'images triées
   */
  function getSortedSources() {
    return activeConfig.SOURCES
      .filter(source => source.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Génère une URL d'image pour un contenu et un type d'image spécifiques
   * @param {string} contentId - ID du contenu
   * @param {string} imageType - Type d'image (poster, backdrop, thumbnail)
   * @param {string} sourceName - Nom de la source à utiliser (optionnel)
   * @returns {string} - URL de l'image
   */
  function generateImageUrl(contentId, imageType, sourceName) {
    // Extraire le type de contenu à partir de l'ID
    const contentType = contentId.replace(/\d+$/, '');
    
    // Obtenir les sources disponibles
    let sources = getSortedSources();
    
    // Filtrer par nom de source si spécifié
    if (sourceName) {
      sources = sources.filter(source => source.name === sourceName);
      if (sources.length === 0) {
        console.warn(`[FloDrama ImageConfig] Source non trouvée: ${sourceName}`);
        sources = getSortedSources();
      }
    }
    
    // Utiliser la première source disponible
    const source = sources[0];
    if (!source) {
      console.error('[FloDrama ImageConfig] Aucune source d\'image disponible');
      return '';
    }
    
    // Générer l'URL
    let url = source.baseUrl + source.pattern;
    url = url.replace('{contentId}', contentId);
    url = url.replace('{imageType}', imageType);
    url = url.replace('{contentType}', contentType);
    
    return url;
  }
  
  /**
   * Génère toutes les URLs d'image possibles pour un contenu et un type d'image
   * @param {string} contentId - ID du contenu
   * @param {string} imageType - Type d'image (poster, backdrop, thumbnail)
   * @returns {Array<string>} - Liste des URLs d'image
   */
  function generateAllImageUrls(contentId, imageType) {
    // Extraire le type de contenu à partir de l'ID
    const contentType = contentId.replace(/\d+$/, '');
    
    // Obtenir toutes les sources disponibles
    const sources = getSortedSources();
    
    // Générer une URL pour chaque source
    return sources.map(source => {
      let url = source.baseUrl + source.pattern;
      url = url.replace('{contentId}', contentId);
      url = url.replace('{imageType}', imageType);
      url = url.replace('{contentType}', contentType);
      
      return url;
    });
  }
  
  /**
   * Obtient les dimensions d'image recommandées pour un type d'image
   * @param {string} imageType - Type d'image (poster, backdrop, thumbnail)
   * @returns {Object} - Dimensions {width, height}
   */
  function getImageDimensions(imageType) {
    switch (imageType) {
      case 'poster':
        return { width: 300, height: 450 };
      case 'backdrop':
        return { width: 1280, height: 720 };
      case 'thumbnail':
        return { width: 200, height: 113 };
      case 'logo':
        return { width: 400, height: 200 };
      case 'profile':
        return { width: 300, height: 300 };
      default:
        return { 
          width: activeConfig.PLACEHOLDERS.defaultWidth, 
          height: activeConfig.PLACEHOLDERS.defaultHeight
        };
    }
  }
  
  /**
   * Vérifie si une source d'image est disponible
   * @param {string} sourceName - Nom de la source
   * @returns {boolean} - True si la source est disponible
   */
  function isSourceAvailable(sourceName) {
    const sources = activeConfig.SOURCES.filter(source => source.name === sourceName);
    return sources.length > 0 && sources[0].enabled;
  }
  
  /**
   * Active ou désactive une source d'image
   * @param {string} sourceName - Nom de la source
   * @param {boolean} enabled - État d'activation
   */
  function setSourceEnabled(sourceName, enabled) {
    const sourceIndex = activeConfig.SOURCES.findIndex(source => source.name === sourceName);
    if (sourceIndex >= 0) {
      activeConfig.SOURCES[sourceIndex].enabled = enabled;
      
      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('imageSourceUpdated', { 
        detail: { 
          sourceName: sourceName, 
          enabled: enabled 
        } 
      }));
    }
  }
  
  // Exposer l'API publique
  window.FloDramaImageConfig = {
    getConfig: getConfig,
    setConfig: setConfig,
    resetConfig: resetConfig,
    getSortedSources: getSortedSources,
    generateImageUrl: generateImageUrl,
    generateAllImageUrls: generateAllImageUrls,
    getImageDimensions: getImageDimensions,
    isSourceAvailable: isSourceAvailable,
    setSourceEnabled: setSourceEnabled
  };
})();
