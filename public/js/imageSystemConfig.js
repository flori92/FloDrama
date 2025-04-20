/**
 * FloDrama - Configuration du système d'images
 * Ce fichier centralise toutes les configurations du système d'images de FloDrama
 * 
 * @version 1.0.0
 */

window.FloDramaConfig = window.FloDramaConfig || {};

window.FloDramaConfig.ImageSystem = {
  /**
   * Configuration des sources d'images
   */
  sources: {
    // Sources prioritaires (dans l'ordre)
    priorities: [
      {
        name: 'githubPages',
        baseUrl: 'https://flodrama.com/assets/content/',
        enabled: true
      },
      {
        name: 'cloudfront',
        baseUrl: 'https://d11nnqvjfooahr.cloudfront.net/content/',
        enabled: true
      },
      {
        name: 's3direct',
        baseUrl: 'https://flodrama-assets.s3.amazonaws.com/content/',
        enabled: true
      }
    ],
    
    // Chemins alternatifs pour les assets locaux
    localPaths: [
      '/assets/content/',
      '/content/',
      '/public/content/',
      '/assets/placeholders/'
    ],
    
    // Formats d'image supportés par ordre de priorité
    formats: ['webp', 'jpg', 'png']
  },
  
  /**
   * Configuration des placeholders
   */
  placeholders: {
    // Utiliser des placeholders dynamiques
    useDynamic: true,
    
    // Utiliser des placeholders statiques (pré-générés)
    useStatic: true,
    
    // Chemin vers les placeholders statiques
    staticPath: '/assets/placeholders/',
    
    // Couleurs par catégorie
    colors: {
      drama: {
        primary: '#3b82f6',
        secondary: '#d946ef'
      },
      movie: {
        primary: '#3b82f6',
        secondary: '#10b981'
      },
      anime: {
        primary: '#8b5cf6',
        secondary: '#ec4899'
      },
      default: {
        primary: '#3b82f6',
        secondary: '#d946ef'
      }
    }
  },
  
  /**
   * Configuration du préchargement
   */
  preload: {
    // Activer le préchargement
    enabled: true,
    
    // Nombre maximum de contenus à précharger
    maxItems: 20,
    
    // Délai avant de commencer le préchargement (ms)
    delay: 2000,
    
    // Intervalle entre chaque préchargement (ms)
    interval: 300,
    
    // Priorités par catégorie
    categoryPriorities: {
      drama: 3,
      movie: 2,
      anime: 1
    },
    
    // Types d'images à précharger
    types: ['poster', 'thumbnail', 'backdrop']
  },
  
  /**
   * Configuration des performances
   */
  performance: {
    // Activer le suivi des performances
    enabled: true,
    
    // Intervalle de rapport (ms)
    reportInterval: 30000,
    
    // Stocker les statistiques dans localStorage
    storeStats: true,
    
    // Envoyer les statistiques à l'analytique
    sendToAnalytics: false
  },
  
  /**
   * Configuration du lazy loading
   */
  lazyLoading: {
    // Activer le lazy loading
    enabled: true,
    
    // Marge de préchargement (px)
    rootMargin: '200px 0px',
    
    // Seuil d'intersection
    threshold: 0.01
  },
  
  /**
   * Configuration de l'identité visuelle
   */
  visualIdentity: {
    // Couleurs principales
    colors: {
      primary: '#3b82f6',    // Bleu signature
      secondary: '#d946ef',  // Fuchsia accent
      dark: '#121118',       // Fond principal
      darkAlt: '#1A1926'     // Fond secondaire
    },
    
    // Dégradé signature
    gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
    
    // Transitions
    transition: '0.3s ease',
    
    // Coins arrondis
    borderRadius: '8px'
  },
  
  /**
   * Configuration du débogage
   */
  debug: {
    // Activer le mode débogage
    enabled: false,
    
    // Afficher les logs détaillés
    verbose: false
  }
};

/**
 * Méthode utilitaire pour accéder à la configuration
 * @param {string} path - Chemin dans l'objet de configuration (ex: 'sources.priorities')
 * @param {any} defaultValue - Valeur par défaut si le chemin n'existe pas
 * @returns {any} - La valeur de configuration ou la valeur par défaut
 */
window.FloDramaConfig.get = function(path, defaultValue) {
  const keys = path.split('.');
  let current = window.FloDramaConfig;
  
  for (const key of keys) {
    if (current === undefined || current === null || !current.hasOwnProperty(key)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
};

/**
 * Méthode pour mettre à jour la configuration
 * @param {string} path - Chemin dans l'objet de configuration (ex: 'sources.priorities')
 * @param {any} value - Nouvelle valeur
 */
window.FloDramaConfig.set = function(path, value) {
  const keys = path.split('.');
  let current = window.FloDramaConfig;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current.hasOwnProperty(key) || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  
  // Émettre un événement de changement de configuration
  const event = new CustomEvent('flodrama-config-changed', {
    detail: { path, value }
  });
  document.dispatchEvent(event);
};
