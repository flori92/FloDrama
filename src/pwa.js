// Configuration minimale PWA pour FloDrama
// Ce fichier sera remplacé par une implémentation complète ultérieurement

/**
 * Initialise les fonctionnalités PWA
 * Cette fonction est appelée au démarrage de l'application
 */
export function initPWA() {
  // Enregistrer le service worker si disponible
  if ('serviceWorker' in navigator) {
    registerServiceWorker();
  }
  
  // Configurer les événements d'installation
  setupInstallPrompt();
  
  return {
    ready: true,
    config: pwaConfig
  };
}

// Enregistrement du service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.info('Service Worker enregistré avec succès:', registration);
        })
        .catch(error => {
          console.warn('Échec de l\'enregistrement du Service Worker:', error);
        });
    });
  }
}

/**
 * Configure l'événement d'installation de l'application
 */
function setupInstallPrompt() {
  // Stocke l'événement beforeinstallprompt pour une utilisation ultérieure
  window.deferredPrompt = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher Chrome 67+ d'afficher automatiquement la fenêtre d'installation
    e.preventDefault();
    // Stocker l'événement pour pouvoir le déclencher plus tard
    window.deferredPrompt = e;
  });
}

// Configuration PWA
export const pwaConfig = {
  name: 'FloDrama',
  shortName: 'FloDrama',
  description: 'Plateforme de streaming pour films, séries et animations',
  themeColor: '#3b82f6',
  backgroundColor: '#121118',
  display: 'standalone',
  scope: '/',
  startUrl: '/',
  icons: [
    {
      src: '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png'
    },
    {
      src: '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png'
    },
    {
      src: '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png'
    },
    {
      src: '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png'
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
};

// Export par défaut
export default {
  initPWA,
  registerServiceWorker,
  pwaConfig
};
