/**
 * FloDrama - Intégration du système d'images
 * Ce script assure l'intégration du système d'images amélioré sur toutes les pages de l'application
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const CONFIG = {
    DEBUG: false,
    PRELOAD_POPULAR: true,
    PRELOAD_LIMIT: 10,
    STATS_ENABLED: true,
    LAZY_LOADING: true
  };
  
  // Statistiques de chargement d'images
  const imageStats = {
    total: 0,
    success: 0,
    failed: 0,
    fallbackUsed: 0,
    placeholderUsed: 0,
    sources: {
      githubPages: 0,
      cloudfront: 0,
      s3direct: 0
    },
    startTime: Date.now(),
    
    // Méthode pour enregistrer une statistique
    record: function(type, value = 1) {
      if (!CONFIG.STATS_ENABLED) return;
      
      if (typeof this[type] === 'number') {
        this[type] += value;
      } else if (typeof this.sources[type] === 'number') {
        this.sources[type] += value;
      }
    },
    
    // Méthode pour obtenir un rapport
    getReport: function() {
      if (!CONFIG.STATS_ENABLED) return null;
      
      const duration = (Date.now() - this.startTime) / 1000;
      const successRate = this.total > 0 ? (this.success / this.total * 100).toFixed(1) : 0;
      
      return {
        total: this.total,
        success: this.success,
        failed: this.failed,
        fallbackUsed: this.fallbackUsed,
        placeholderUsed: this.placeholderUsed,
        successRate: `${successRate}%`,
        sources: this.sources,
        duration: `${duration.toFixed(1)}s`
      };
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
      if (CONFIG.STATS_ENABLED) {
        console.info(`[FloDrama Images Stats] ${JSON.stringify(imageStats.getReport(), null, 2)}`);
      }
    }
  };
  
  /**
   * Précharge les images pour les contenus populaires
   */
  function preloadPopularContent() {
    if (!CONFIG.PRELOAD_POPULAR) return;
    
    logger.info("Préchargement des images pour les contenus populaires...");
    
    // Charger les données de contenu
    fetch('/data/content.json')
      .then(response => response.json())
      .then(data => {
        // Trier par popularité si disponible
        const sortedContent = data.items.sort((a, b) => {
          const popA = a.popularity || 0;
          const popB = b.popularity || 0;
          return popB - popA;
        });
        
        // Limiter le nombre de contenus à précharger
        const contentsToPreload = sortedContent.slice(0, CONFIG.PRELOAD_LIMIT);
        logger.debug(`Préchargement de ${contentsToPreload.length} contenus populaires`);
        
        // Précharger les images
        if (window.FloDramaImageSystem && window.FloDramaImageSystem.preloadContentImages) {
          window.FloDramaImageSystem.preloadContentImages(
            contentsToPreload.map(item => item.id),
            'poster',
            { items: contentsToPreload }
          );
        }
      })
      .catch(error => {
        logger.error("Erreur lors du préchargement des contenus populaires", error);
      });
  }
  
  /**
   * Applique le chargement paresseux (lazy loading) aux images
   */
  function applyLazyLoading() {
    if (!CONFIG.LAZY_LOADING) return;
    
    logger.info("Application du lazy loading aux images...");
    
    // Sélectionner toutes les images de contenu qui ne sont pas dans la viewport
    const contentImages = document.querySelectorAll('img[data-content-id]:not([data-lazy-loaded])');
    
    // Créer un observateur d'intersection
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const contentId = img.dataset.contentId;
          const type = img.dataset.type || 'poster';
          
          // Charger l'image si elle est visible
          if (contentId && window.FloDramaImageSystem) {
            const sources = window.FloDramaImageSystem.generateImageSources(contentId, type);
            if (sources.length > 0) {
              img.src = sources[0];
              img.setAttribute('data-lazy-loaded', 'true');
              
              // Ajouter un gestionnaire d'erreur
              img.addEventListener('error', window.FloDramaImageSystem.handleImageError);
              
              // Enregistrer la statistique
              imageStats.record('total');
            }
          }
          
          // Arrêter d'observer cette image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px', // Précharger les images 200px avant qu'elles n'entrent dans la viewport
      threshold: 0.01
    });
    
    // Observer chaque image
    contentImages.forEach(img => {
      // Ne pas observer les images qui ont déjà une source
      if (!img.src || img.src === 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==') {
        observer.observe(img);
        
        // Définir une source transparente par défaut
        if (!img.src) {
          img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        }
      }
    });
  }
  
  /**
   * Améliore les gestionnaires d'erreur pour les images
   */
  function enhanceErrorHandlers() {
    logger.info("Amélioration des gestionnaires d'erreur pour les images...");
    
    // Sauvegarder la fonction originale
    const originalHandleImageError = window.FloDramaImageSystem.handleImageError;
    
    // Remplacer par une version améliorée
    window.FloDramaImageSystem.handleImageError = function(event) {
      const img = event.target;
      const contentId = img.dataset.contentId;
      const type = img.dataset.type;
      
      // Enregistrer les statistiques
      imageStats.record('failed');
      imageStats.record('fallbackUsed');
      
      // Appeler la fonction originale
      const result = originalHandleImageError.call(window.FloDramaImageSystem, event);
      
      // Si un placeholder a été utilisé, enregistrer la statistique
      if (img.getAttribute('data-fallback-type') === 'placeholder') {
        imageStats.record('placeholderUsed');
      }
      
      return result;
    };
    
    // Améliorer également le gestionnaire de chargement réussi
    document.addEventListener('load', function(e) {
      if (e.target.tagName && e.target.tagName.toLowerCase() === 'img' && e.target.dataset.contentId) {
        // Enregistrer la statistique de succès
        imageStats.record('success');
        
        // Déterminer la source utilisée
        const src = e.target.src;
        if (src.includes('github.io') || src.includes('flodrama.com')) {
          imageStats.record('githubPages');
        } else if (src.includes('cloudfront.net')) {
          imageStats.record('cloudfront');
        } else if (src.includes('s3.amazonaws.com')) {
          imageStats.record('s3direct');
        }
      }
    }, true);
  }
  
  /**
   * Optimise les performances de chargement des images
   */
  function optimizeImagePerformance() {
    logger.info("Optimisation des performances de chargement des images...");
    
    // Utiliser les indices de priorité pour les images
    const contentCards = document.querySelectorAll('.content-card');
    
    contentCards.forEach((card, index) => {
      const img = card.querySelector('img[data-content-id]');
      if (img) {
        // Définir la priorité en fonction de la position
        // Les 6 premières cartes ont une priorité élevée
        if (index < 6) {
          img.setAttribute('loading', 'eager');
          img.setAttribute('fetchpriority', 'high');
        } else {
          img.setAttribute('loading', 'lazy');
          img.setAttribute('fetchpriority', 'low');
        }
        
        // Ajouter des dimensions explicites si elles ne sont pas définies
        if (!img.width && !img.height) {
          const type = img.dataset.type || 'poster';
          if (type === 'poster') {
            img.width = 300;
            img.height = 450;
          } else if (type === 'backdrop') {
            img.width = 1280;
            img.height = 720;
          } else if (type === 'thumbnail') {
            img.width = 200;
            img.height = 113;
          }
        }
      }
    });
  }
  
  /**
   * Initialise l'intégration du système d'images
   */
  function initImageSystemIntegration() {
    logger.info("Initialisation de l'intégration du système d'images...");
    
    // Vérifier que le système d'images est disponible
    if (!window.FloDramaImageSystem) {
      logger.error("Le système d'images FloDrama n'est pas disponible");
      return;
    }
    
    // Améliorer les gestionnaires d'erreur
    enhanceErrorHandlers();
    
    // Optimiser les performances
    optimizeImagePerformance();
    
    // Appliquer le lazy loading
    applyLazyLoading();
    
    // Précharger les contenus populaires
    preloadPopularContent();
    
    // Afficher les statistiques après 5 secondes
    setTimeout(() => {
      logger.stats();
    }, 5000);
    
    logger.info("Intégration du système d'images terminée");
  }
  
  // Initialiser l'intégration au chargement de la page
  document.addEventListener('DOMContentLoaded', initImageSystemIntegration);
})();
