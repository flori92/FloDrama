// Patch pour axios
import './patches/axios-patch.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import './styles/theme.css'; // Import du nouveau thème
import App from './App';

// Services unifiés
import { unifiedScrapingService, unifiedImageService } from './services';

// Vérifier si nous sommes dans un environnement de production
const isProduction = process.env.NODE_ENV === 'production';

// Point d'entrée principal de l'application FloDrama
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// En production, nous désactivons le scraping en arrière-plan pour éviter les erreurs
// liées aux modules Node.js dans l'environnement navigateur
if (!isProduction) {
  try {
    // Utilisation du service unifié de scraping
    unifiedScrapingService.initialize().then(() => {
      // Démarrage du scraping quotidien en arrière-plan pour alimenter FloDrama en métadonnées
      const backgroundScrapingController = unifiedScrapingService.startDailyBackgroundScraping();

      // Ajouter un gestionnaire d'événements pour arrêter le scraping lors de la fermeture de l'application
      window.addEventListener('beforeunload', () => {
        backgroundScrapingController.stop();
      });

      // Écouter les événements de mise à jour des métadonnées
      window.addEventListener('flodrama:metadata-updated', (event) => {
        console.log('Métadonnées mises à jour:', event.detail);
        // Vous pouvez ajouter ici une notification ou une mise à jour de l'interface utilisateur
      });
    }).catch(error => {
      console.warn('Le service de scraping n\'a pas pu être initialisé:', error.message);
    });
    
    // Initialisation du service d'images unifié
    unifiedImageService.initialize().then(() => {
      // Initialiser le chargement paresseux des images
      unifiedImageService.initLazyLoading('.lazy-image');
      
      // Précharger les images importantes (logo, images de fond, etc.)
      unifiedImageService.preloadImportantImages([
        '/images/logo.svg',
        '/images/backdrop-5.jpg'
      ]);
    }).catch(error => {
      console.warn('Le service d\'images n\'a pas pu être initialisé:', error.message);
    });
  } catch (error) {
    console.warn('Erreur lors du chargement des services unifiés:', error.message);
  }
} else {
  console.log('Mode production: service de scraping désactivé pour éviter les erreurs de compatibilité navigateur');
}

// Enregistrement du service worker pour le support hors ligne
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      });
  });
}
