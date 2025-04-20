/**
 * FloDrama - Système de préchargement avancé
 * Ce script implémente un système de préchargement intelligent pour les contenus populaires
 * en respectant l'identité visuelle de FloDrama et en optimisant l'expérience utilisateur.
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const CONFIG = {
    // Nombre maximum de contenus à précharger
    MAX_PRELOAD: 20,
    
    // Priorités par catégorie (plus le nombre est élevé, plus la priorité est haute)
    CATEGORY_PRIORITIES: {
      drama: 3,
      movie: 2,
      anime: 1
    },
    
    // Types d'images à précharger par ordre de priorité
    IMAGE_TYPES: ['poster', 'thumbnail', 'backdrop'],
    
    // Délai avant de commencer le préchargement (ms)
    PRELOAD_DELAY: 2000,
    
    // Intervalle entre chaque préchargement (ms)
    PRELOAD_INTERVAL: 300,
    
    // Activer le préchargement intelligent basé sur la navigation
    SMART_PRELOAD: true,
    
    // Activer le préchargement basé sur les favoris
    FAVORITES_PRELOAD: true,
    
    // Couleurs de l'identité visuelle FloDrama
    COLORS: {
      primary: '#3b82f6',    // Bleu signature
      secondary: '#d946ef',  // Fuchsia accent
      dark: '#121118',       // Fond principal
      darkAlt: '#1A1926'     // Fond secondaire
    }
  };
  
  // Système de logs
  const logger = {
    info: function(message) {
      console.info(`[FloDrama Preloader] ${message}`);
    },
    
    warn: function(message) {
      console.warn(`[FloDrama Preloader] ${message}`);
    },
    
    error: function(message, error) {
      console.error(`[FloDrama Preloader] ${message}`, error);
    },
    
    debug: function(message) {
      console.debug(`[FloDrama Preloader] ${message}`);
    }
  };
  
  // File d'attente de préchargement
  const preloadQueue = {
    items: [],
    processing: false,
    
    // Ajouter un élément à la file d'attente
    add: function(contentId, type, priority = 1) {
      // Vérifier si l'élément existe déjà
      const existingIndex = this.items.findIndex(item => 
        item.contentId === contentId && item.type === type
      );
      
      if (existingIndex !== -1) {
        // Mettre à jour la priorité si elle est plus élevée
        if (priority > this.items[existingIndex].priority) {
          this.items[existingIndex].priority = priority;
        }
      } else {
        // Ajouter un nouvel élément
        this.items.push({ contentId, type, priority });
      }
      
      // Trier la file d'attente par priorité (décroissante)
      this.items.sort((a, b) => b.priority - a.priority);
    },
    
    // Traiter le prochain élément de la file d'attente
    processNext: function() {
      if (this.items.length === 0 || this.processing) {
        return;
      }
      
      this.processing = true;
      
      // Récupérer le prochain élément
      const item = this.items.shift();
      
      // Précharger l'image
      this.preloadImage(item.contentId, item.type)
        .then(() => {
          this.processing = false;
          
          // Traiter le prochain élément après un délai
          setTimeout(() => this.processNext(), CONFIG.PRELOAD_INTERVAL);
        })
        .catch(() => {
          this.processing = false;
          
          // Traiter le prochain élément après un délai
          setTimeout(() => this.processNext(), CONFIG.PRELOAD_INTERVAL);
        });
    },
    
    // Précharger une image
    preloadImage: function(contentId, type) {
      return new Promise((resolve, reject) => {
        // Vérifier si le système d'images est disponible
        if (!window.FloDramaImageSystem || !window.FloDramaImageSystem.generateImageSources) {
          reject(new Error("Système d'images non disponible"));
          return;
        }
        
        // Générer les sources d'images
        const sources = window.FloDramaImageSystem.generateImageSources(contentId, type);
        
        if (sources.length === 0) {
          reject(new Error("Aucune source d'image disponible"));
          return;
        }
        
        // Créer une nouvelle image
        const img = new Image();
        
        // Configurer les gestionnaires d'événements
        img.onload = function() {
          logger.debug(`Image préchargée: ${contentId}/${type}`);
          resolve();
        };
        
        img.onerror = function() {
          logger.debug(`Erreur de préchargement: ${contentId}/${type}`);
          
          // Essayer la source suivante si disponible
          if (sources.length > 1) {
            img.src = sources[1];
          } else {
            reject(new Error("Toutes les sources ont échoué"));
          }
        };
        
        // Commencer le chargement
        img.src = sources[0];
      });
    },
    
    // Démarrer le traitement de la file d'attente
    start: function() {
      if (!this.processing) {
        this.processNext();
      }
    }
  };
  
  /**
   * Précharge les contenus populaires
   */
  function preloadPopularContent() {
    logger.info("Préchargement des contenus populaires...");
    
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
        const contentsToPreload = sortedContent.slice(0, CONFIG.MAX_PRELOAD);
        
        // Ajouter les contenus à la file d'attente
        contentsToPreload.forEach((content, index) => {
          // Calculer la priorité en fonction de l'index et de la catégorie
          const indexPriority = CONFIG.MAX_PRELOAD - index;
          const categoryPriority = CONFIG.CATEGORY_PRIORITIES[content.category] || 1;
          const priority = indexPriority + categoryPriority;
          
          // Ajouter chaque type d'image à la file d'attente
          CONFIG.IMAGE_TYPES.forEach((type, typeIndex) => {
            // Réduire la priorité pour les types d'images moins importants
            const typePriority = priority - typeIndex;
            
            // Ajouter à la file d'attente
            preloadQueue.add(content.id, type, typePriority);
          });
        });
        
        // Démarrer le préchargement
        preloadQueue.start();
      })
      .catch(error => {
        logger.error("Erreur lors du chargement des données de contenu", error);
      });
  }
  
  /**
   * Précharge les contenus favoris
   */
  function preloadFavoriteContent() {
    if (!CONFIG.FAVORITES_PRELOAD) return;
    
    logger.info("Préchargement des contenus favoris...");
    
    try {
      // Récupérer les favoris depuis localStorage
      const storedFavorites = localStorage.getItem('flodrama_favorites');
      if (!storedFavorites) return;
      
      const favorites = JSON.parse(storedFavorites);
      
      // Ajouter les favoris à la file d'attente avec une priorité élevée
      favorites.forEach((favorite, index) => {
        // Priorité plus élevée pour les favoris récents
        const priority = 10 + (favorites.length - index);
        
        // Ajouter chaque type d'image à la file d'attente
        CONFIG.IMAGE_TYPES.forEach((type, typeIndex) => {
          // Réduire la priorité pour les types d'images moins importants
          const typePriority = priority - typeIndex;
          
          // Ajouter à la file d'attente
          preloadQueue.add(favorite.id, type, typePriority);
        });
      });
    } catch (error) {
      logger.error("Erreur lors du préchargement des favoris", error);
    }
  }
  
  /**
   * Précharge les contenus basés sur la navigation
   */
  function preloadBasedOnNavigation() {
    if (!CONFIG.SMART_PRELOAD) return;
    
    logger.info("Préchargement basé sur la navigation...");
    
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const contentId = urlParams.get('id');
    
    // Si nous sommes sur une page de catégorie, précharger les contenus de cette catégorie
    if (category) {
      fetch('/data/content.json')
        .then(response => response.json())
        .then(data => {
          // Filtrer par catégorie
          const categoryContent = data.items.filter(item => item.category === category);
          
          // Limiter le nombre de contenus à précharger
          const contentsToPreload = categoryContent.slice(0, CONFIG.MAX_PRELOAD);
          
          // Ajouter les contenus à la file d'attente
          contentsToPreload.forEach((content, index) => {
            // Priorité plus élevée pour les premiers éléments
            const priority = 5 + (CONFIG.MAX_PRELOAD - index);
            
            // Ajouter chaque type d'image à la file d'attente
            CONFIG.IMAGE_TYPES.forEach((type, typeIndex) => {
              // Réduire la priorité pour les types d'images moins importants
              const typePriority = priority - typeIndex;
              
              // Ajouter à la file d'attente
              preloadQueue.add(content.id, type, typePriority);
            });
          });
        })
        .catch(error => {
          logger.error("Erreur lors du préchargement basé sur la catégorie", error);
        });
    }
    
    // Si nous sommes sur une page de détail, précharger les contenus similaires
    if (contentId) {
      fetch('/data/content.json')
        .then(response => response.json())
        .then(data => {
          // Trouver le contenu actuel
          const currentContent = data.items.find(item => item.id === contentId);
          
          if (currentContent) {
            // Filtrer les contenus similaires (même catégorie)
            const similarContent = data.items.filter(item => 
              item.id !== contentId && item.category === currentContent.category
            );
            
            // Limiter le nombre de contenus à précharger
            const contentsToPreload = similarContent.slice(0, 6);
            
            // Ajouter les contenus à la file d'attente
            contentsToPreload.forEach((content, index) => {
              // Priorité plus élevée pour les premiers éléments
              const priority = 7 + (6 - index);
              
              // Ajouter chaque type d'image à la file d'attente
              CONFIG.IMAGE_TYPES.forEach((type, typeIndex) => {
                // Réduire la priorité pour les types d'images moins importants
                const typePriority = priority - typeIndex;
                
                // Ajouter à la file d'attente
                preloadQueue.add(content.id, type, typePriority);
              });
            });
          }
        })
        .catch(error => {
          logger.error("Erreur lors du préchargement des contenus similaires", error);
        });
    }
  }
  
  /**
   * Affiche un indicateur de préchargement
   */
  function showPreloadIndicator() {
    // Créer l'élément indicateur
    const indicator = document.createElement('div');
    indicator.id = 'preload-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.right = '10px';
    indicator.style.width = '20px';
    indicator.style.height = '20px';
    indicator.style.borderRadius = '50%';
    indicator.style.background = `linear-gradient(to right, ${CONFIG.COLORS.primary}, ${CONFIG.COLORS.secondary})`;
    indicator.style.opacity = '0.7';
    indicator.style.zIndex = '9999';
    indicator.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    indicator.style.transform = 'scale(0.8)';
    
    // Ajouter un tooltip
    indicator.title = 'Préchargement des images en cours...';
    
    // Ajouter l'animation
    indicator.animate([
      { transform: 'scale(0.8)', opacity: 0.7 },
      { transform: 'scale(1.2)', opacity: 1 },
      { transform: 'scale(0.8)', opacity: 0.7 }
    ], {
      duration: 1500,
      iterations: Infinity
    });
    
    // Ajouter l'indicateur au document
    document.body.appendChild(indicator);
    
    // Supprimer l'indicateur après 10 secondes
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 300);
      }
    }, 10000);
  }
  
  /**
   * Initialise le système de préchargement avancé
   */
  function initAdvancedPreloader() {
    logger.info("Initialisation du système de préchargement avancé...");
    
    // Afficher l'indicateur de préchargement
    showPreloadIndicator();
    
    // Attendre un peu avant de commencer le préchargement
    setTimeout(() => {
      // Précharger les contenus basés sur la navigation
      preloadBasedOnNavigation();
      
      // Précharger les contenus favoris
      preloadFavoriteContent();
      
      // Précharger les contenus populaires
      preloadPopularContent();
    }, CONFIG.PRELOAD_DELAY);
    
    logger.info("Système de préchargement avancé initialisé");
  }
  
  // Initialiser le préchargeur au chargement de la page
  document.addEventListener('DOMContentLoaded', initAdvancedPreloader);
})();
