// Configuration globale de l'application FloDrama
export const AppConfig = {
  // Configuration des services
  services: {
    scraping: {
      baseUrl: process.env.REACT_APP_SCRAPING_SERVICE_URL || 'http://localhost:3001',
      timeout: 30000,
      retryAttempts: 3
    },
    aws: {
      region: 'eu-west-3',
      s3: {
        bucket: 'flodrama-frontend'
      },
      cloudfront: {
        distributionId: 'E1Y7G2J7C90UHR'
      }
    }
  },

  // Configuration de l'interface utilisateur
  ui: {
    // Thème personnalisé pour Material UI et Lynx
    theme: {
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#121212',
        surface: '#1e1e1e',
        text: '#ffffff'
      },
      // Configuration des animations Lynx
      animations: {
        default: {
          duration: 300,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        page: {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      },
      // Configuration des layouts Lynx
      layout: {
        spacing: 8,
        breakpoints: {
          mobile: 0,
          tablet: 600,
          desktop: 1024
        }
      }
    },
    
    // Configuration des composants partagés
    components: {
      carousel: {
        autoPlay: true,
        interval: 5000
      },
      player: {
        defaultQuality: 'auto',
        autoPlay: false
      }
    }
  },

  // Configuration du cache et de la performance
  performance: {
    cache: {
      enabled: true,
      duration: 3600 // 1 heure
    },
    prefetch: {
      enabled: true,
      threshold: 0.1 // 10% de visibilité pour déclencher le prefetch
    }
  }
}
