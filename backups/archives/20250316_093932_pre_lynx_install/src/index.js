// Patch pour axios
import './patches/axios-patch.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import smartScrapingService from './services/SmartScrapingService.js';

// Point d'entrée principal de l'application FloDrama
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Démarrage du scraping quotidien en arrière-plan pour alimenter FloDrama en métadonnées
const backgroundScrapingController = smartScrapingService.startDailyBackgroundScraping();

// Ajouter un gestionnaire d'événements pour arrêter le scraping lors de la fermeture de l'application
window.addEventListener('beforeunload', () => {
  backgroundScrapingController.stop();
});

// Écouter les événements de mise à jour des métadonnées
window.addEventListener('flodrama:metadata-updated', (event) => {
  console.log('Métadonnées mises à jour:', event.detail);
  // Vous pouvez ajouter ici une notification ou une mise à jour de l'interface utilisateur
});

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
