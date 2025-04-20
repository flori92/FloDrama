/**
 * FloDrama - Moniteur de performance des images
 * Ce script analyse les performances du système d'images et génère des rapports
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const CONFIG = {
    COLLECTION_INTERVAL: 5000, // 5 secondes
    REPORT_INTERVAL: 30000,    // 30 secondes
    DETAILED_LOGGING: false,
    SEND_TO_ANALYTICS: false,
    OPTIMIZE_IMAGES: true,
    STORE_STATS: true
  };
  
  // Métriques de performance
  const metrics = {
    // Temps de chargement
    loadTimes: [],
    
    // Taux de succès par source
    sources: {
      githubPages: { success: 0, failed: 0 },
      cloudfront: { success: 0, failed: 0 },
      s3direct: { success: 0, failed: 0 },
      placeholder: { used: 0 }
    },
    
    // Métriques globales
    global: {
      totalRequests: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0
    },
    
    // Méthode pour enregistrer un temps de chargement
    recordLoadTime: function(url, loadTime) {
      this.loadTimes.push({ url, loadTime });
      
      // Mettre à jour la moyenne
      const sum = this.loadTimes.reduce((acc, item) => acc + item.loadTime, 0);
      this.global.averageLoadTime = sum / this.loadTimes.length;
    },
    
    // Méthode pour enregistrer un succès
    recordSuccess: function(source) {
      this.global.totalRequests++;
      this.global.successfulLoads++;
      
      if (source.includes('github.io') || source.includes('flodrama.com')) {
        this.sources.githubPages.success++;
      } else if (source.includes('cloudfront.net')) {
        this.sources.cloudfront.success++;
      } else if (source.includes('s3.amazonaws.com')) {
        this.sources.s3direct.success++;
      }
    },
    
    // Méthode pour enregistrer un échec
    recordFailure: function(source) {
      this.global.totalRequests++;
      this.global.failedLoads++;
      
      if (source.includes('github.io') || source.includes('flodrama.com')) {
        this.sources.githubPages.failed++;
      } else if (source.includes('cloudfront.net')) {
        this.sources.cloudfront.failed++;
      } else if (source.includes('s3.amazonaws.com')) {
        this.sources.s3direct.failed++;
      }
    },
    
    // Méthode pour enregistrer l'utilisation d'un placeholder
    recordPlaceholder: function() {
      this.sources.placeholder.used++;
    },
    
    // Méthode pour obtenir un rapport
    getReport: function() {
      // Calculer les taux de succès
      const githubSuccess = this.sources.githubPages.success + this.sources.githubPages.failed > 0
        ? (this.sources.githubPages.success / (this.sources.githubPages.success + this.sources.githubPages.failed) * 100).toFixed(1)
        : 0;
        
      const cloudfrontSuccess = this.sources.cloudfront.success + this.sources.cloudfront.failed > 0
        ? (this.sources.cloudfront.success / (this.sources.cloudfront.success + this.sources.cloudfront.failed) * 100).toFixed(1)
        : 0;
        
      const s3Success = this.sources.s3direct.success + this.sources.s3direct.failed > 0
        ? (this.sources.s3direct.success / (this.sources.s3direct.success + this.sources.s3direct.failed) * 100).toFixed(1)
        : 0;
      
      const globalSuccess = this.global.totalRequests > 0
        ? (this.global.successfulLoads / this.global.totalRequests * 100).toFixed(1)
        : 0;
      
      return {
        timestamp: new Date().toISOString(),
        global: {
          totalRequests: this.global.totalRequests,
          successfulLoads: this.global.successfulLoads,
          failedLoads: this.global.failedLoads,
          successRate: `${globalSuccess}%`,
          averageLoadTime: `${this.global.averageLoadTime.toFixed(2)}ms`
        },
        sources: {
          githubPages: {
            success: this.sources.githubPages.success,
            failed: this.sources.githubPages.failed,
            successRate: `${githubSuccess}%`
          },
          cloudfront: {
            success: this.sources.cloudfront.success,
            failed: this.sources.cloudfront.failed,
            successRate: `${cloudfrontSuccess}%`
          },
          s3direct: {
            success: this.sources.s3direct.success,
            failed: this.sources.s3direct.failed,
            successRate: `${s3Success}%`
          },
          placeholder: {
            used: this.sources.placeholder.used
          }
        }
      };
    },
    
    // Méthode pour réinitialiser les métriques
    reset: function() {
      this.loadTimes = [];
      
      this.sources.githubPages.success = 0;
      this.sources.githubPages.failed = 0;
      this.sources.cloudfront.success = 0;
      this.sources.cloudfront.failed = 0;
      this.sources.s3direct.success = 0;
      this.sources.s3direct.failed = 0;
      this.sources.placeholder.used = 0;
      
      this.global.totalRequests = 0;
      this.global.successfulLoads = 0;
      this.global.failedLoads = 0;
      this.global.averageLoadTime = 0;
    }
  };
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama Performance] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Performance] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Performance] ${message}`, error);
    },
    
    debug: function(message) {
      if (CONFIG.DETAILED_LOGGING) {
        console.debug(`[FloDrama Performance] ${message}`);
      }
    },
    
    report: function(data) {
      console.info(`[FloDrama Performance Report] ${JSON.stringify(data, null, 2)}`);
    }
  };
  
  /**
   * Optimise les images sur la page
   */
  function optimizeImages() {
    if (!CONFIG.OPTIMIZE_IMAGES) return;
    
    logger.info("Optimisation des images...");
    
    // Sélectionner toutes les images de contenu
    const contentImages = document.querySelectorAll('img[data-content-id]');
    
    contentImages.forEach(img => {
      // Ajouter des attributs pour l'optimisation
      img.decoding = 'async';
      
      // Ajouter un attribut srcset pour les images responsive si ce n'est pas déjà fait
      if (!img.srcset && img.src && img.dataset.contentId && img.dataset.type) {
        const contentId = img.dataset.contentId;
        const type = img.dataset.type;
        
        // Générer un srcset si le système d'images est disponible
        if (window.FloDramaImageSystem && typeof window.FloDramaImageSystem.generateImageSources === 'function') {
          const sources = window.FloDramaImageSystem.generateImageSources(contentId, type);
          
          // Créer un srcset avec les sources disponibles
          if (sources.length > 1) {
            // Utiliser différentes tailles selon le type d'image
            if (type === 'poster') {
              img.srcset = `${sources[0]} 300w, ${sources[1]} 600w`;
              img.sizes = "(max-width: 768px) 150px, 300px";
            } else if (type === 'backdrop') {
              img.srcset = `${sources[0]} 1280w, ${sources[1]} 640w`;
              img.sizes = "(max-width: 768px) 100vw, 1280px";
            } else if (type === 'thumbnail') {
              img.srcset = `${sources[0]} 200w, ${sources[1]} 400w`;
              img.sizes = "(max-width: 768px) 100px, 200px";
            }
          }
        }
      }
    });
  }
  
  /**
   * Collecte les métriques de performance
   */
  function collectMetrics() {
    logger.debug("Collecte des métriques de performance...");
    
    // Observer les chargements d'images
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        // Filtrer uniquement les ressources d'images
        if (entry.initiatorType === 'img') {
          const url = entry.name;
          const loadTime = entry.duration;
          
          // Enregistrer le temps de chargement
          metrics.recordLoadTime(url, loadTime);
          
          logger.debug(`Image chargée: ${url} en ${loadTime.toFixed(2)}ms`);
        }
      });
    });
    
    // Observer les ressources
    observer.observe({ entryTypes: ['resource'] });
    
    // Observer les chargements d'images réussis
    document.addEventListener('load', function(e) {
      if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
        const src = e.target.src;
        metrics.recordSuccess(src);
        
        logger.debug(`Chargement réussi: ${src}`);
      }
    }, true);
    
    // Observer les erreurs de chargement d'images
    document.addEventListener('error', function(e) {
      if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
        const src = e.target.src;
        metrics.recordFailure(src);
        
        logger.debug(`Erreur de chargement: ${src}`);
        
        // Vérifier si un placeholder a été utilisé
        if (e.target.getAttribute('data-fallback-type') === 'placeholder') {
          metrics.recordPlaceholder();
        }
      }
    }, true);
  }
  
  /**
   * Génère et envoie un rapport de performance
   */
  function generateReport() {
    const report = metrics.getReport();
    
    // Afficher le rapport dans la console
    logger.report(report);
    
    // Stocker les statistiques si activé
    if (CONFIG.STORE_STATS) {
      try {
        // Récupérer les statistiques existantes
        const storedStats = localStorage.getItem('flodrama_image_stats');
        const stats = storedStats ? JSON.parse(storedStats) : { reports: [] };
        
        // Ajouter le nouveau rapport
        stats.reports.push(report);
        
        // Limiter le nombre de rapports stockés (garder les 10 derniers)
        if (stats.reports.length > 10) {
          stats.reports = stats.reports.slice(-10);
        }
        
        // Stocker les statistiques mises à jour
        localStorage.setItem('flodrama_image_stats', JSON.stringify(stats));
      } catch (error) {
        logger.error("Erreur lors du stockage des statistiques", error);
      }
    }
    
    // Envoyer à l'analytique si activé
    if (CONFIG.SEND_TO_ANALYTICS && typeof window.sendAnalytics === 'function') {
      window.sendAnalytics('image_performance', report);
    }
  }
  
  /**
   * Initialise le moniteur de performance
   */
  function initPerformanceMonitor() {
    logger.info("Initialisation du moniteur de performance des images...");
    
    // Optimiser les images
    optimizeImages();
    
    // Collecter les métriques
    collectMetrics();
    
    // Générer des rapports périodiques
    setInterval(generateReport, CONFIG.REPORT_INTERVAL);
    
    logger.info("Moniteur de performance des images initialisé");
  }
  
  // Initialiser le moniteur au chargement de la page
  document.addEventListener('DOMContentLoaded', initPerformanceMonitor);
})();
