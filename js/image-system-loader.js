/**
 * Chargeur du système de gestion d'images FloDrama
 * Script autonome pour intégrer le gestionnaire d'images avancé dans les pages existantes
 */

(function() {
  // Configuration
  const DEBUG = true;
  const PRELOAD_PRIORITY_IMAGES = true;
  const CHECK_CDN_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  // État des CDNs
  const cdnStatus = {
    bunny: true,
    cloudfront: true,
    github: true
  };
  
  // Cache pour éviter les boucles infinies
  const processedUrls = new Set();
  
  // Types d'images supportés
  const IMAGE_TYPES = {
    POSTER: 'poster',
    BACKDROP: 'backdrop',
    THUMBNAIL: 'thumbnail',
    PROFILE: 'profile',
    LOGO: 'logo'
  };
  
  /**
   * Système de logs simplifié
   */
  const logger = {
    info: function(message) {
      if (DEBUG) console.info(`[FloDrama Images] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Images] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Images] ${message}`, error);
    },
    
    debug: function(message) {
      if (DEBUG) console.debug(`[FloDrama Images] ${message}`);
    }
  };
  
  /**
   * Vérifie l'état d'un CDN
   * @param {string} baseUrl - URL de base du CDN
   * @returns {Promise<boolean>} - true si le CDN est disponible
   */
  async function checkCdnStatus(baseUrl) {
    try {
      // Utiliser un fichier de test pour vérifier l'état du CDN
      const testUrl = `${baseUrl}/status.json`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.warn(`CDN inaccessible: ${baseUrl}`);
      return false;
    }
  }
  
  /**
   * Vérifie l'état de tous les CDNs
   */
  async function checkAllCdnStatus() {
    logger.debug('Vérification de l\'état des CDNs');
    
    try {
      // Vérifier Bunny CDN
      cdnStatus.bunny = await checkCdnStatus('https://images.flodrama.com');
      
      // Vérifier CloudFront
      cdnStatus.cloudfront = await checkCdnStatus('https://d2ra390ol17u3n.cloudfront.net');
      
      // Vérifier GitHub Pages (toujours considéré comme disponible car c'est le site actuel)
      cdnStatus.github = true;
      
      logger.info(`État des CDNs - Bunny: ${cdnStatus.bunny ? 'OK' : 'KO'}, CloudFront: ${cdnStatus.cloudfront ? 'OK' : 'KO'}`);
    } catch (error) {
      logger.error('Erreur lors de la vérification des CDNs', error);
    }
  }
  
  /**
   * Gère les erreurs de chargement d'images
   * @param {Event} event - Événement d'erreur
   */
  function handleImageError(event) {
    try {
      const img = event.target;
      const contentId = img.dataset.contentId;
      const type = img.dataset.type || IMAGE_TYPES.POSTER;
      const currentUrl = img.src;
      
      logger.debug(`Erreur de chargement d'image: ${currentUrl}`);
      
      // Éviter les boucles infinies
      if (processedUrls.has(currentUrl)) {
        logger.debug(`URL déjà traitée, passage au SVG: ${currentUrl}`);
        applyFallbackSvg(img, contentId, type);
        return;
      }
      
      processedUrls.add(currentUrl);
      
      // Générer les sources alternatives
      const sources = generateImageSources(contentId, type);
      
      // Trouver l'index de la source actuelle
      const currentIndex = sources.findIndex(source => source === currentUrl);
      
      // Si on n'est pas à la dernière source, essayer la suivante
      if (currentIndex < sources.length - 1 && currentIndex !== -1) {
        const nextSource = sources[currentIndex + 1];
        logger.debug(`Fallback d'image: ${currentUrl} -> ${nextSource}`);
        img.src = nextSource;
      } else {
        // Si toutes les sources ont échoué, utiliser un SVG intégré
        applyFallbackSvg(img, contentId, type);
      }
    } catch (error) {
      logger.error('Erreur dans le gestionnaire de fallback d\'images:', error);
      // En cas d'erreur, appliquer un SVG de secours
      try {
        applyFallbackSvg(event.target, event.target.dataset.contentId || 'unknown', 
                        event.target.dataset.type || IMAGE_TYPES.POSTER);
      } catch (fallbackError) {
        logger.error('Erreur critique dans le fallback SVG:', fallbackError);
      }
    }
  }
  
  /**
   * Génère les sources d'images alternatives pour un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type d'image
   * @returns {Array<string>} - Liste des URLs alternatives
   */
  function generateImageSources(contentId, type) {
    // Liste des sources possibles
    const sources = [];
    
    // Ajouter Bunny CDN si disponible
    if (cdnStatus.bunny) {
      sources.push(`https://images.flodrama.com/${type}s/${contentId}.jpg`);
    }
    
    // Ajouter CloudFront si disponible
    if (cdnStatus.cloudfront) {
      sources.push(`https://d2ra390ol17u3n.cloudfront.net/${type}s/${contentId}.jpg`);
    }
    
    // Ajouter GitHub Pages (toujours disponible)
    sources.push(`/assets/media/${type}s/${contentId}/poster.jpg`);
    
    // Ajouter placeholder local
    sources.push(`/assets/static/placeholders/${type}-placeholder.jpg`);
    
    return sources;
  }
  
  /**
   * Applique un SVG de fallback comme image
   * @param {HTMLImageElement} img - Élément image
   * @param {string} contentId - ID du contenu
   * @param {string} type - Type d'image
   */
  function applyFallbackSvg(img, contentId, type) {
    // Utiliser un SVG intégré comme solution de dernier recours
    const title = img.alt || contentId || 'FloDrama';
    
    // Générer un dégradé spécifique au contenu basé sur son ID
    const colorIndex = contentId ? parseInt(contentId.replace(/\D/g, '') || '0') % 8 : 0;
    
    // Utiliser les couleurs de l'identité visuelle de FloDrama
    const colors = [
      ['#3b82f6', '#1e40af'], // Bleu foncé
      ['#d946ef', '#9333ea'], // Fuchsia
      ['#3b82f6', '#6366f1'], // Bleu-indigo
      ['#d946ef', '#ec4899'], // Fuchsia-rose
      ['#3b82f6', '#0ea5e9'], // Bleu-ciel
      ['#d946ef', '#c026d3'], // Fuchsia-violet
      ['#3b82f6', '#2563eb'], // Bleu royal
      ['#d946ef', '#be185d']  // Fuchsia-rose foncé
    ];
    
    const [color1, color2] = colors[colorIndex];
    
    // Adapter les dimensions selon le type d'image
    let width, height;
    switch (type) {
      case IMAGE_TYPES.POSTER:
        width = 300;
        height = 450;
        break;
      case IMAGE_TYPES.BACKDROP:
        width = 500;
        height = 281;
        break;
      case IMAGE_TYPES.THUMBNAIL:
        width = 200;
        height = 200;
        break;
      case IMAGE_TYPES.PROFILE:
        width = 300;
        height = 300;
        break;
      default:
        width = 300;
        height = 450;
    }
    
    // Créer un SVG intégré avec le dégradé et le titre
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
        <defs>
          <linearGradient id="grad${contentId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${color1}" />
            <stop offset="100%" stop-color="${color2}" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad${contentId})" />
        <text x="${width/2}" y="${height/2}" fill="white" text-anchor="middle" dominant-baseline="middle" 
              font-family="SF Pro Display, sans-serif" font-weight="bold" font-size="${Math.min(width, height) * 0.08}px">${title}</text>
      </svg>
    `;
    
    // Convertir le SVG en Data URL
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    
    // Appliquer le SVG comme source de l'image
    img.src = svgDataUrl;
    
    // Ajouter une classe pour le style
    img.classList.add('fallback-image');
    img.classList.add(`${type}-fallback`);
    
    logger.warn(`SVG fallback appliqué pour ${contentId} (${type})`);
  }
  
  /**
   * Ajoute des attributs data-* aux images existantes
   */
  function enhanceExistingImages() {
    try {
      // Sélectionner toutes les images de la page
      const images = document.querySelectorAll('img');
      let enhancedCount = 0;
      
      images.forEach(img => {
        // Ne pas modifier les images qui ont déjà des attributs data-*
        if (img.dataset.contentId) return;
        
        // Extraire l'ID du contenu de l'URL si possible
        if (img.src) {
          // Chercher un pattern comme /drama123.jpg ou /posters/drama123.jpg
          const contentIdMatch = img.src.match(/\/(?:posters|backdrops|thumbnails|profiles)?\/?([\w\d]+)\.(jpg|png|webp)/i);
          if (contentIdMatch && contentIdMatch[1]) {
            img.dataset.contentId = contentIdMatch[1];
            enhancedCount++;
            
            // Déterminer le type d'image
            if (!img.dataset.type) {
              if (img.src.includes('posters') || img.classList.contains('poster')) {
                img.dataset.type = IMAGE_TYPES.POSTER;
              } else if (img.src.includes('backdrops') || img.classList.contains('backdrop')) {
                img.dataset.type = IMAGE_TYPES.BACKDROP;
              } else if (img.src.includes('thumbnails') || img.classList.contains('thumbnail')) {
                img.dataset.type = IMAGE_TYPES.THUMBNAIL;
              } else if (img.src.includes('profiles') || img.classList.contains('profile')) {
                img.dataset.type = IMAGE_TYPES.PROFILE;
              } else {
                // Essayer de déterminer le type par les dimensions
                const ratio = img.width / img.height;
                if (ratio < 0.8) {
                  img.dataset.type = IMAGE_TYPES.POSTER;
                } else if (ratio > 1.5) {
                  img.dataset.type = IMAGE_TYPES.BACKDROP;
                } else {
                  img.dataset.type = IMAGE_TYPES.POSTER; // Type par défaut
                }
              }
            }
            
            // Ajouter un gestionnaire d'erreur si non présent
            if (!img.hasAttribute('onerror')) {
              img.onerror = handleImageError;
            }
          }
        }
      });
      
      logger.info(`${enhancedCount} images existantes améliorées`);
    } catch (error) {
      logger.error('Erreur lors de l\'amélioration des images existantes:', error);
    }
  }
  
  /**
   * Précharge les images prioritaires de la page
   */
  function preloadPriorityImages() {
    if (!PRELOAD_PRIORITY_IMAGES) return;
    
    try {
      // Identifier les images prioritaires (visibles dans la viewport)
      const images = Array.from(document.querySelectorAll('img[data-content-id]'));
      
      // Filtrer pour ne garder que les images visibles
      const visibleImages = images.filter(img => {
        const rect = img.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      });
      
      logger.debug(`Préchargement de ${visibleImages.length} images prioritaires`);
      
      // Précharger les images visibles
      visibleImages.forEach(img => {
        const contentId = img.dataset.contentId;
        const type = img.dataset.type || IMAGE_TYPES.POSTER;
        
        // Générer les sources alternatives
        const sources = generateImageSources(contentId, type);
        
        // Précharger la première source
        if (sources.length > 0) {
          const preloadImg = new Image();
          preloadImg.src = sources[0];
        }
      });
    } catch (error) {
      logger.error('Erreur lors du préchargement des images prioritaires:', error);
    }
  }
  
  /**
   * Crée les styles CSS pour les placeholders
   */
  function createPlaceholders() {
    try {
      // Créer des placeholders en CSS si les images ne sont pas disponibles
      const style = document.createElement('style');
      style.textContent = `
        .fallback-image.poster-fallback {
          background: linear-gradient(135deg, #3b82f6, #d946ef);
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        .fallback-image.backdrop-fallback {
          background: linear-gradient(135deg, #3b82f6, #d946ef);
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        .fallback-image.thumbnail-fallback {
          background: linear-gradient(135deg, #3b82f6, #d946ef);
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        .fallback-image.profile-fallback {
          background: linear-gradient(135deg, #3b82f6, #d946ef);
          border-radius: 50%;
          min-height: 100px;
          min-width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-align: center;
        }
      `;
      
      document.head.appendChild(style);
      logger.debug('Styles CSS créés pour les placeholders');
    } catch (error) {
      logger.error('Erreur lors de la création des styles CSS:', error);
    }
  }
  
  /**
   * Initialise le système de gestion d'images
   */
  function initImageSystem() {
    logger.info('Initialisation du système de gestion d\'images FloDrama');
    
    try {
      // Créer les styles CSS pour les placeholders
      createPlaceholders();
      
      // Vérifier l'état des CDNs
      checkAllCdnStatus();
      
      // Améliorer les images existantes
      enhanceExistingImages();
      
      // Précharger les images prioritaires
      preloadPriorityImages();
      
      // Ajouter un gestionnaire global pour les erreurs d'images
      document.addEventListener('error', function(e) {
        if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
          handleImageError(e);
          e.preventDefault();
        }
      }, true);
      
      // Configurer une vérification périodique des CDNs
      setInterval(checkAllCdnStatus, CHECK_CDN_INTERVAL);
      
      logger.info('Système de gestion d\'images initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du système d\'images:', error);
    }
  }
  
  // Exposer les fonctions utiles globalement
  window.FloDramaImages = {
    handleImageError,
    applyFallbackSvg,
    generateImageSources,
    IMAGE_TYPES
  };
  
  // Initialiser le système au chargement de la page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageSystem);
  } else {
    initImageSystem();
  }
})();
