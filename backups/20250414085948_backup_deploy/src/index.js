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
  
  // Intercepter les requêtes fetch pour ajouter un timestamp et rediriger les requêtes
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Rediriger toutes les requêtes vers les ressources locales
    if (typeof url === 'string') {
      console.log(`Fetch request for: ${url}`);
      
      // Vérifier si nous sommes sur flodrama.com
      const isFlodramaDomain = window.location.hostname === 'flodrama.com' || 
                               window.location.hostname === 'www.flodrama.com' ||
                               window.location.hostname === 'dev.flodrama.com';
      
      // Si nous sommes sur flodrama.com, adapter les URLs pour le domaine
      if (isFlodramaDomain) {
        // Rediriger les requêtes de métadonnées vers le bon chemin
        if (url.includes('/data/metadata.json') || url.includes('api.flodrama.com/metadata')) {
          const newUrl = `/data/metadata.json?_t=${timestamp}`;
          console.log(`Redirecting metadata request: ${url} -> ${newUrl}`);
          url = newUrl;
        }
        // Ajouter un timestamp aux requêtes d'images
        else if (url.includes('/media/')) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}_t=${timestamp}`;
        }
      } 
      // Sinon, utiliser la logique locale
      else {
        // Rediriger les requêtes de métadonnées vers le bon chemin
        if (url.includes('/data/metadata.json') || url.includes('api.flodrama.com/metadata') || url.includes('cloudfront.net/data/metadata.json')) {
          const newUrl = `/assets/data/metadata.json?_t=${timestamp}`;
          console.log(`Redirecting metadata request: ${url} -> ${newUrl}`);
          url = newUrl;
        }
        // Rediriger les requêtes CloudFront vers les ressources locales
        else if (url.includes('cloudfront.net')) {
          // Extraire le chemin de la ressource
          const urlObj = new URL(url);
          const path = urlObj.pathname;
          
          // Construire la nouvelle URL locale
          let newUrl = '';
          
          if (path.includes('/data/')) {
            newUrl = `/assets${path}`;
          } else if (path.includes('/media/')) {
            newUrl = `/assets${path}`;
          } else {
            newUrl = `/assets${path}`;
          }
          
          // Ajouter les paramètres de requête
          if (urlObj.search) {
            newUrl += urlObj.search;
          } else {
            newUrl += `?_t=${timestamp}`;
          }
          
          console.log(`Redirecting CloudFront URL: ${url} -> ${newUrl}`);
          url = newUrl;
        }
        // Si c'est une URL d'image, ajouter un timestamp
        else if (url.includes('/assets/media/')) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}_t=${timestamp}`;
        }
      }
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
