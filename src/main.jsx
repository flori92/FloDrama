import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeAssetSystem } from './utils/assetManager';

// Point d'entrée principal de l'application
const initialize = async () => {
  // Initialiser le système de gestion des assets
  initializeAssetSystem();
  
  // Précharger les métadonnées essentielles avant le rendu
  try {
    // Préconfigurer le cache offline
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker enregistré avec succès:', registration.scope);
          })
          .catch(error => {
            console.log('Échec de l\'enregistrement du Service Worker:', error);
          });
      });
    }
    
    // Rendre l'application
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
  } catch (error) {
    console.error('Erreur d\'initialisation:', error);
    // Afficher un message d'erreur à l'utilisateur
    document.getElementById('root').innerHTML = `
      <div class="error-container">
        <h1>Oups ! Une erreur s'est produite</h1>
        <p>Impossible de charger FloDrama. Veuillez réessayer ultérieurement.</p>
        <button onclick="window.location.reload()">Rafraîchir</button>
      </div>
    `;
  }
};

// Démarrer l'application
initialize();
