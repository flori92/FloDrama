import React from 'react';
import ReactDOM from 'react-dom/client';
import EnhancedApp from './App.enhanced';
import App from './App';
import './styles/enhanced.css';
import { createPlaceholders } from './utils/localImageFallback';

/**
 * Point d'entrée pour FloDrama
 * L'interface enrichie est chargée par défaut
 * Pour accéder à l'interface standard, utiliser le paramètre standard=true
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

// Initialiser les placeholders pour les images manquantes
if (typeof window !== 'undefined') {
  // Ajouter un timestamp aux requêtes pour éviter le cache
  const timestamp = Date.now();
  console.log('Cache refresh script initialized with timestamp:', timestamp);
  
  // Intercepter les requêtes fetch pour ajouter un timestamp
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Si c'est une URL de métadonnées ou d'image, ajouter un timestamp
    if (typeof url === 'string' && (url.includes('/metadata.json') || url.includes('/assets/media/'))) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}_t=${timestamp}`;
    }
    return originalFetch.call(this, url, options);
  };
  
  // Créer les placeholders CSS
  createPlaceholders();
}

// Vérifier si l'URL contient le paramètre standard=true pour charger l'interface standard
const urlParams = new URLSearchParams(window.location.search);
const useStandardInterface = urlParams.get('standard') === 'true';

// Par défaut, on charge l'interface enrichie sauf si standard=true est spécifié
const useEnhancedInterface = !useStandardInterface;

// Sauvegarder la préférence de l'utilisateur
localStorage.setItem('flodrama_interface', useEnhancedInterface ? 'enhanced' : 'standard');
localStorage.setItem('flodrama_visited', 'true');

// Afficher l'interface enrichie par défaut, sauf si explicitement désactivée
root.render(
  <React.StrictMode>
    {useEnhancedInterface ? <EnhancedApp /> : <App />}
  </React.StrictMode>
);

// Journalisation pour le débogage
console.log(`FloDrama - Interface chargée: ${useEnhancedInterface ? 'enrichie' : 'standard'}`);
