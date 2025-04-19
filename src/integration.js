// Script d'intégration pour FloDrama
// Permet d'intégrer l'interface enrichie dans la page HTML existante

import { FloDramaApp } from './main.js';

// Fonction d'initialisation
function initializeFloDrama() {
  console.log('Initialisation de FloDrama...');
  
  // Vérifier si l'élément racine existe
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Élément racine non trouvé, création d\'un élément racine');
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
  }
  
  // Initialiser l'application
  const app = new FloDramaApp();
  app.initialize().then(() => {
    console.log('FloDrama initialisé avec succès');
    
    // Masquer l'écran de chargement s'il existe
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }).catch(error => {
    console.error('Erreur lors de l\'initialisation de FloDrama:', error);
  });
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFloDrama);
} else {
  initializeFloDrama();
}

// Exporter la fonction d'initialisation pour une utilisation externe
export { initializeFloDrama };
