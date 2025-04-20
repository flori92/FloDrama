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
            } else if (sectionText.includes('kshow') || sectionText.includes('variety')) {
              category = 'kshow';
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
   * Applique les données de contenu aux cartes existantes
   * @param {Array} contentData - Données de contenu
   */
  function applyContentDataToCards(contentData) {
    logger.info("Application des données de contenu aux cartes existantes...");
    
    if (!contentData || contentData.length === 0) {
      logger.warn("Aucune donnée de contenu disponible");
      return;
    }
    
    // Sélectionner toutes les cartes de contenu
    const contentCards = document.querySelectorAll('.content-card');
    if (contentCards.length === 0) {
      logger.warn("Aucune carte de contenu trouvée sur la page");
      return;
    }
    
    logger.info(`Application des données à ${contentCards.length} cartes de contenu`);
    
    // Année courante pour le filtrage des tendances
    const currentYear = new Date().getFullYear();
    
    // Parcourir les cartes de contenu
    contentCards.forEach(card => {
      // Récupérer l'ID de contenu de la carte
      let contentId = card.dataset.contentId;
      
      // Si la carte n'a pas d'ID, lui en attribuer un
      if (!contentId) {
        // Trouver un ID disponible
        const index = Array.from(contentCards).indexOf(card);
        contentId = `content${index + 1}`;
        card.dataset.contentId = contentId;
      }
      
      // Trouver les données correspondantes
      let contentItem = contentData.find(item => item.id === contentId);
      
      // Si aucune correspondance exacte, essayer de trouver par section
      if (!contentItem) {
        // Déterminer la catégorie en fonction de la section parente
        let category = 'drama'; // Par défaut
        let isTrending = false;
        
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
            } else if (sectionText.includes('kshow') || sectionText.includes('variety')) {
              category = 'kshow';
            }
            
            // Vérifier si c'est la section Tendances
            if (sectionText.includes('tendance') || sectionText.includes('trend')) {
              isTrending = true;
            }
          }
        }
        
        // Filtrer les contenus par catégorie
        let categoryItems = contentData.filter(item => item.category === category);
        
        // Pour la section Tendances, filtrer par année (moins de 2 ans)
        if (isTrending) {
          logger.debug(`Filtrage des tendances: année courante = ${currentYear}`);
          categoryItems = contentData.filter(item => {
            // Vérifier si l'année est définie et convertir en nombre si nécessaire
            const itemYear = typeof item.year === 'string' ? parseInt(item.year, 10) : item.year;
            
            // Accepter uniquement les contenus de moins de 2 ans
            return itemYear && (currentYear - itemYear < 2);
          });
          
          logger.debug(`${categoryItems.length} éléments récents trouvés pour les tendances`);
          
          // Si aucun contenu récent n'est disponible, utiliser les plus récents disponibles
          if (categoryItems.length === 0) {
            logger.warn("Aucun contenu récent trouvé pour les tendances, utilisation des plus récents disponibles");
            
            // Trier par année décroissante et prendre les 10 premiers
            categoryItems = contentData
              .filter(item => item.year)
              .sort((a, b) => {
                const yearA = typeof a.year === 'string' ? parseInt(a.year, 10) : a.year;
                const yearB = typeof b.year === 'string' ? parseInt(b.year, 10) : b.year;
                return yearB - yearA;
              })
              .slice(0, 10);
          }
        }
        
        // Prendre un élément aléatoire de cette catégorie
        if (categoryItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * categoryItems.length);
          contentItem = categoryItems[randomIndex];
        } else {
          // Prendre un élément aléatoire si aucun élément de cette catégorie n'est disponible
          const randomIndex = Math.floor(Math.random() * contentData.length);
          contentItem = contentData[randomIndex];
        }
      }
      
      // Appliquer les données à la carte
      if (contentItem) {
        // Mettre à jour l'ID de contenu
        card.dataset.contentId = contentItem.id;
        
        // Mettre à jour le titre
        const titleElement = card.querySelector('.card-title');
        if (titleElement) {
          titleElement.textContent = contentItem.title;
        }
        
        // Mettre à jour les métadonnées
        const metaElement = card.querySelector('.card-meta');
        if (metaElement) {
          metaElement.textContent = `${contentItem.year} • ${contentItem.genres.join(', ')}`;
        }
        
        // Mettre à jour l'image
        const imageElement = card.querySelector('img');
        if (imageElement) {
          imageElement.dataset.contentId = contentItem.id;
          imageElement.dataset.type = imageElement.dataset.type || 'poster';
          imageElement.dataset.category = contentItem.category;
          imageElement.alt = contentItem.title;
          
          // Charger l'image avec le système d'images
          if (window.FloDramaImageSystem && window.FloDramaImageSystem.loadImageWithRetry) {
            const sources = window.FloDramaImageSystem.generateImageSources(contentItem.id, imageElement.dataset.type);
            window.FloDramaImageSystem.loadImageWithRetry(imageElement, sources);
          }
        }
      }
    });
    
    logger.info("Données de contenu appliquées avec succès");
  }
  
  /**
   * Initialise le système d'intégration d'images
   */
  function initImageSystemIntegration() {
    logger.info("Initialisation du système d'intégration d'images...");
    
    // Charger le générateur de placeholders
    loadPlaceholderGenerator()
      .then(() => {
        // Charger les données de contenu
        return loadContentData();
      })
      .then(contentData => {
        // Appliquer les données de contenu aux cartes existantes
        applyContentDataToCards(contentData);
        
        // Déclencher un événement pour signaler que les données sont chargées
        document.dispatchEvent(new CustomEvent('contentDataLoaded', {
          detail: {
            contentData: {
              items: contentData
            }
          }
        }));
        
        // Précharger les contenus populaires
        if (CONFIG.PRELOAD_POPULAR) {
          preloadPopularContent();
        }
        
        // Initialiser le système d'images
        if (window.FloDramaImageSystem && window.FloDramaImageSystem.initImageSystem) {
          window.FloDramaImageSystem.initImageSystem();
        }
        
        // Afficher les statistiques après 5 secondes
        setTimeout(() => {
          logger.stats();
        }, 5000);
      })
      .catch(error => {
        logger.error("Erreur lors de l'initialisation du système d'intégration d'images", error);
      });
  }
  
  // Initialiser l'intégration au chargement de la page
  document.addEventListener('DOMContentLoaded', initImageSystemIntegration);
})();
