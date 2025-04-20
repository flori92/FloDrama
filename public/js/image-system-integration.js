/**
 * FloDrama - Intégration du système d'images
 * Ce script assure l'intégration du système d'images amélioré sur toutes les pages de l'application
 * 
 * @version 1.1.0
 */

(function() {
  // Configuration
  const CONFIG = {
    DEBUG: true, // Activer le mode débogage pour diagnostiquer les problèmes
    PRELOAD_POPULAR: true,
    PRELOAD_LIMIT: 10,
    STATS_ENABLED: true,
    LAZY_LOADING: true,
    USE_SMART_SCRAPING: true // Utiliser le service de scraping intelligent
  };
  
  // Données de contenu de secours (utilisées si aucune autre source n'est disponible)
  const FALLBACK_CONTENT_DATA = {
    items: []
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
   * Charge le générateur de placeholders s'il n'est pas déjà chargé
   * @returns {Promise} - Promesse résolue lorsque le générateur est chargé
   */
  function loadPlaceholderGenerator() {
    return new Promise((resolve) => {
      if (window.FloDramaPlaceholders) {
        logger.debug("Générateur de placeholders déjà chargé");
        resolve();
        return;
      }
      
      logger.info("Chargement du générateur de placeholders...");
      
      const script = document.createElement('script');
      script.src = '/js/placeholder-generator.js';
      
      script.onload = function() {
        logger.info("Générateur de placeholders chargé avec succès");
        resolve();
      };
      
      script.onerror = function(error) {
        logger.error("Erreur lors du chargement du générateur de placeholders", error);
        
        // Créer une implémentation minimale pour éviter les erreurs
        window.FloDramaPlaceholders = {
          generatePlaceholderImage: function() {
            return `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="#1A1926"/><text x="150" y="225" font-family="Arial" font-size="16" fill="#FFFFFF" text-anchor="middle">FloDrama</text></svg>')}`;
          }
        };
        
        logger.warn("Utilisation d'un générateur de placeholders minimal");
        resolve();
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Charge les données de contenu depuis le service de scraping intelligent
   * @returns {Promise<Array>} - Promesse résolue avec les données de contenu
   */
  function loadContentData() {
    return new Promise((resolve) => {
      logger.info("Chargement des données de contenu...");
      
      // Vérifier si le service de scraping intelligent est disponible
      if (CONFIG.USE_SMART_SCRAPING && window.SmartScrapingService) {
        logger.info("Utilisation du service de scraping intelligent");
        
        // Initialiser le service s'il ne l'est pas déjà
        if (!window.SmartScrapingService.isInitialized) {
          window.SmartScrapingService.initialize()
            .then(() => {
              logger.info("Service de scraping intelligent initialisé");
              
              // Récupérer les données depuis le cache du service
              if (window.SmartScrapingService.contentCache && 
                  window.SmartScrapingService.contentCache.items) {
                logger.info(`${window.SmartScrapingService.contentCache.items.length} éléments trouvés dans le cache du service`);
                resolve(window.SmartScrapingService.contentCache.items);
              } else {
                logger.warn("Aucune donnée dans le cache du service, utilisation des données intégrées");
                resolve(getContentDataFromPage());
              }
            })
            .catch(error => {
              logger.error("Erreur lors de l'initialisation du service de scraping intelligent", error);
              resolve(getContentDataFromPage());
            });
        } else {
          // Le service est déjà initialisé, récupérer les données depuis le cache
          if (window.SmartScrapingService.contentCache && 
              window.SmartScrapingService.contentCache.items) {
            logger.info(`${window.SmartScrapingService.contentCache.items.length} éléments trouvés dans le cache du service`);
            resolve(window.SmartScrapingService.contentCache.items);
          } else {
            logger.warn("Aucune donnée dans le cache du service, utilisation des données intégrées");
            resolve(getContentDataFromPage());
          }
        }
      } else {
        // Utiliser les données intégrées si le service n'est pas disponible
        logger.warn("Service de scraping intelligent non disponible, utilisation des données intégrées");
        resolve(getContentDataFromPage());
      }
    });
  }
  
  /**
   * Récupère les données de contenu depuis la page
   * @returns {Array} - Données de contenu
   */
  function getContentDataFromPage() {
    // Vérifier si les données sont disponibles dans la variable globale
    if (typeof window.CONTENT_DATA !== 'undefined' && window.CONTENT_DATA.items) {
      logger.info(`${window.CONTENT_DATA.items.length} éléments trouvés dans les données globales`);
      return window.CONTENT_DATA.items;
    }
    
    // Vérifier si les données sont disponibles dans la variable globale window.CONTENT_DATA
    if (typeof window.CONTENT_DATA !== 'undefined' && window.CONTENT_DATA.items) {
      logger.info(`${window.CONTENT_DATA.items.length} éléments trouvés dans les données intégrées`);
      return window.CONTENT_DATA.items;
    }
    
    // Essayer de récupérer les données depuis les cartes de contenu existantes
    const contentCards = document.querySelectorAll('.content-card');
    if (contentCards.length > 0) {
      logger.info(`${contentCards.length} cartes de contenu trouvées sur la page`);
      
      // Créer des données de contenu à partir des cartes existantes
      const items = [];
      
      contentCards.forEach((card, index) => {
        const titleElement = card.querySelector('.card-title');
        const metaElement = card.querySelector('.card-meta');
        
        const title = titleElement ? titleElement.textContent : `Titre ${index + 1}`;
        const meta = metaElement ? metaElement.textContent : '';
        
        // Extraire l'année et les genres des métadonnées
        let year = '';
        let genres = [];
        
        if (meta) {
          const yearMatch = meta.match(/\d{4}/);
          if (yearMatch) {
            year = yearMatch[0];
          }
          
          // Extraire les genres après le séparateur "•"
          const genresMatch = meta.match(/•\s*(.+)/);
          if (genresMatch) {
            genres = genresMatch[1].split(',').map(g => g.trim());
          }
        }
        
        // Créer un ID de contenu basé sur le titre
        const contentId = card.dataset.contentId || 
                         `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${index + 1}`;
        
        // Déterminer la catégorie en fonction de la section parente
        let category = 'drama'; // Par défaut
        
        const parentSection = card.closest('section');
        if (parentSection) {
          const sectionTitle = parentSection.querySelector('h2, h3');
          if (sectionTitle) {
            const sectionText = sectionTitle.textContent.toLowerCase();
            if (sectionText.includes('film')) {
              category = 'movie';
            } else if (sectionText.includes('animé') || sectionText.includes('anime')) {
              category = 'anime';
            } else if (sectionText.includes('bollywood')) {
              category = 'bollywood';
            }
          }
        }
        
        // Ajouter l'élément de contenu
        items.push({
          id: contentId,
          title: title,
          type: category,
          category: category,
          year: year || new Date().getFullYear(),
          genres: genres.length > 0 ? genres : ['Drame'],
          rating: Math.floor(Math.random() * 3) + 7, // Note aléatoire entre 7 et 9
          popularity: Math.floor(Math.random() * 100) // Popularité aléatoire
        });
      });
      
      return items;
    }
    
    // Utiliser les données de secours si aucune autre source n'est disponible
    logger.warn("Aucune donnée de contenu disponible, utilisation des données de secours");
    return FALLBACK_CONTENT_DATA.items;
  }
  
  /**
   * Précharge les images pour les contenus populaires
   */
  function preloadPopularContent() {
    if (!CONFIG.PRELOAD_POPULAR) return;
    
    logger.info("Préchargement des images pour les contenus populaires...");
    
    // Charger les données de contenu
    loadContentData()
      .then(items => {
        // Trier par popularité si disponible
        const sortedContent = items.sort((a, b) => {
          const popA = a.popularity || a.rating || 0;
          const popB = b.popularity || b.rating || 0;
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
          
          // Marquer l'image comme chargée paresseusement
          img.setAttribute('data-lazy-loaded', 'true');
          
          // Générer les sources d'images
          if (window.FloDramaImageSystem && window.FloDramaImageSystem.generateImageSources) {
            const sources = window.FloDramaImageSystem.generateImageSources(
              img.dataset.contentId, 
              img.dataset.type || 'poster'
            );
            
            if (sources && sources.length > 0) {
              // Définir la source de l'image
              img.src = sources[0];
              
              // Enregistrer la statistique
              imageStats.record('total');
            }
          }
          
          // Arrêter d'observer cette image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px',
      threshold: 0.01
    });
    
    // Observer chaque image
    contentImages.forEach(img => {
      observer.observe(img);
    });
    
    logger.debug(`${contentImages.length} images configurées pour le lazy loading`);
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
    
    // Charger le générateur de placeholders
    loadPlaceholderGenerator()
      .then(() => {
        // Améliorer les gestionnaires d'erreur
        enhanceErrorHandlers();
        
        // Optimiser les performances
        optimizeImagePerformance();
        
        // Appliquer le lazy loading
        applyLazyLoading();
        
        // Précharger les contenus populaires
        preloadPopularContent();
        
        // Initialiser les cartes de contenu avec les données réelles
        initContentCardsWithRealData();
        
        // Afficher les statistiques après 5 secondes
        setTimeout(() => {
          logger.stats();
        }, 5000);
        
        logger.info("Intégration du système d'images terminée");
      })
      .catch(error => {
        logger.error("Erreur lors de l'initialisation de l'intégration du système d'images", error);
      });
  }
  
  /**
   * Initialise les cartes de contenu avec les données réelles
   */
  function initContentCardsWithRealData() {
    logger.info("Initialisation des cartes de contenu avec les données réelles...");
    
    // Charger les données de contenu
    loadContentData()
      .then(items => {
        logger.info(`${items.length} éléments de contenu chargés`);
        
        // Sélectionner toutes les cartes de contenu
        const contentCards = document.querySelectorAll('.content-card');
        
        if (contentCards.length === 0) {
          logger.warn("Aucune carte de contenu trouvée");
          return;
        }
        
        logger.info(`${contentCards.length} cartes de contenu trouvées`);
        
        // Initialiser chaque carte avec des données réelles
        contentCards.forEach((card, index) => {
          // Utiliser les données réelles si disponibles, sinon utiliser l'index
          const item = items[index % items.length];
          
          if (!item) {
            logger.warn(`Aucune donnée disponible pour la carte ${index}`);
            return;
          }
          
          // Définir l'ID du contenu
          card.dataset.contentId = item.id;
          
          // Sélectionner l'image de la carte
          const img = card.querySelector('img');
          if (img) {
            // Définir les attributs de l'image
            img.dataset.contentId = item.id;
            img.dataset.type = 'poster';
            
            // Générer les sources d'images
            if (window.FloDramaImageSystem && window.FloDramaImageSystem.generateImageSources) {
              const sources = window.FloDramaImageSystem.generateImageSources(item.id, 'poster');
              
              if (sources && sources.length > 0) {
                // Définir la source de l'image
                img.src = sources[0];
                
                // Enregistrer la statistique
                imageStats.record('total');
              }
            }
          }
          
          // Mettre à jour le titre
          const titleElement = card.querySelector('.card-title');
          if (titleElement) {
            titleElement.textContent = item.title;
          }
          
          // Mettre à jour les métadonnées
          const metaElement = card.querySelector('.card-meta');
          if (metaElement) {
            const year = item.year || '';
            const genres = item.genres && Array.isArray(item.genres) ? item.genres.join(', ') : '';
            metaElement.textContent = `${year}${genres ? ' • ' + genres : ''}`;
          }
        });
        
        logger.info(`${contentCards.length} cartes de contenu initialisées avec des données réelles`);
      })
      .catch(error => {
        logger.error("Erreur lors de l'initialisation des cartes de contenu", error);
      });
  }
  
  // Initialiser l'intégration au chargement de la page
  document.addEventListener('DOMContentLoaded', initImageSystemIntegration);
})();
