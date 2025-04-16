/**
 * Point d'entrée principal de l'application FloDrama
 * Ce fichier remplace main.jsx pour éviter les problèmes de MIME type
 * sur GitHub Pages et autres plateformes de déploiement
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Suppression des imports CSS qui causent des erreurs MIME
// Les styles seront chargés via des balises link dans index.html
import AppErrorBoundary from './components/AppErrorBoundary';
import localImageFallback from './utils/localImageFallback';
import cacheManager from './utils/cacheManager';
import { initPWA } from './pwa';

/**
 * Fonction pour vérifier si React est correctement chargé
 * @returns {boolean} - true si React est disponible, false sinon
 */
function isReactAvailable() {
  return (
    typeof React !== 'undefined' && 
    React !== null && 
    typeof React.createElement === 'function' && 
    typeof React.Component === 'function'
  );
}

/**
 * Initialise les utilitaires de l'application
 * - Crée les placeholders pour les images
 * - Nettoie le cache si nécessaire
 * - Initialise la PWA
 */
function initializeUtilities() {
  console.log('Initialisation des utilitaires FloDrama...');
  
  // Initialiser les placeholders pour les images
  try {
    localImageFallback.createPlaceholders();
    console.log('Placeholders d\'images initialisés');
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation des placeholders d\'images:', error);
  }
  
  // Vérifier et nettoyer le cache si nécessaire
  try {
    const cacheSize = localStorage.length;
    console.log(`Taille actuelle du cache: ${cacheSize} entrées`);
    if (cacheSize > 100) {
      console.log('Nettoyage du cache...');
      cacheManager.cleanCache();
      console.log('Cache nettoyé avec succès');
    }
  } catch (error) {
    console.warn('Erreur lors de la vérification du cache:', error);
  }
  
  // Initialiser la PWA
  try {
    initPWA();
    console.log('PWA initialisée avec succès');
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation de la PWA:', error);
  }
  
  // Ajouter un timestamp aux logs pour le débogage
  console.log(`FloDrama initialisation: ${new Date().toISOString()}`);
}

/**
 * Fonction d'initialisation de l'application
 * Gère le rendu de l'application et les erreurs potentielles
 */
function initializeApp() {
  try {
    console.log('Initialisation de FloDrama...');
    
    // Initialiser les utilitaires
    initializeUtilities();
    
    // Vérification de l'élément racine
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Élément racine 'root' non trouvé dans le DOM");
    }
    
    // Vérification de ReactDOM
    if (typeof ReactDOM === 'undefined' || !ReactDOM.createRoot) {
      throw new Error("ReactDOM n'est pas disponible ou ne contient pas createRoot");
    }
    
    // Création de la racine React
    const root = ReactDOM.createRoot(rootElement);
    
    // Rendu de l'application avec ErrorBoundary
    root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          AppErrorBoundary,
          null,
          React.createElement(App, null)
        )
      )
    );
    
    // Signaler que l'application est chargée pour masquer le preloader
    if (typeof window.removePreloader === 'function') {
      window.removePreloader();
    } else {
      // Fallback si la fonction n'est pas disponible
      const preloader = document.querySelector('.preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
          try {
            preloader.remove();
          } catch (e) {
            console.warn('Erreur lors de la suppression du preloader:', e);
          }
        }, 500);
      }
    }
    
    // Précharger les images importantes
    preloadImportantImages();
    
    console.log('FloDrama initialisé avec succès');
  } catch (error) {
    console.error('Erreur critique lors de l\'initialisation de FloDrama:', error);
    
    // Afficher un message d'erreur visible pour l'utilisateur
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          font-family: 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          background-color: #121118;
          padding: 20px;
          border-radius: 8px;
          margin: 50px auto;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        ">
          <div style="
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
          ">FD</div>
          <h2 style="
            margin-top: 0;
            font-size: 28px;
            background: linear-gradient(to right, #3b82f6, #d946ef);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">Erreur de chargement</h2>
          <p>Impossible de charger l'application FloDrama.</p>
          <p style="
            font-family: monospace;
            background: rgba(0,0,0,0.2);
            padding: 10px;
            border-radius: 4px;
            text-align: left;
            overflow-wrap: break-word;
          ">
            ${error.message}
          </p>
          <p>Veuillez vérifier votre connexion internet et rafraîchir la page.</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 20px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(217, 70, 239, 0.4)';" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            Rafraîchir la page
          </button>
        </div>
      `;
    }
    
    // Essayer de supprimer le preloader en cas d'erreur
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        try {
          preloader.remove();
        } catch (e) {
          console.warn('Erreur lors de la suppression du preloader:', e);
        }
      }, 500);
    }
  }
}

/**
 * Précharge les images importantes pour améliorer l'expérience utilisateur
 */
function preloadImportantImages() {
  try {
    // Liste des images importantes à précharger
    const importantImages = [
      '/assets/images/logo.png',
      '/assets/images/background.jpg',
      '/assets/icons/play.svg',
      '/assets/icons/pause.svg',
      '/assets/icons/fullscreen.svg'
    ];
    
    // Précharger chaque image
    importantImages.forEach(imageUrl => {
      cacheManager.preloadImage(imageUrl)
        .then(() => console.log(`Image préchargée avec succès: ${imageUrl}`))
        .catch(error => console.warn(`Échec du préchargement de l'image: ${imageUrl}`, error));
    });
  } catch (error) {
    console.warn('Erreur lors du préchargement des images:', error);
  }
}

// Vérification explicite de la disponibilité de React
if (!isReactAvailable()) {
  console.error('React n\'est pas disponible. Tentative de chargement dynamique...');
  
  // Tentative de chargement dynamique de React
  Promise.all([
    import('react'),
    import('react-dom/client')
  ]).then(([reactModule, reactDomModule]) => {
    window.React = reactModule.default;
    window.ReactDOM = reactDomModule.default;
    console.log('React et ReactDOM chargés dynamiquement');
    initializeApp();
  }).catch(error => {
    console.error('Échec du chargement dynamique de React:', error);
    
    // Afficher un message d'erreur visible pour l'utilisateur
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          font-family: 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          background-color: #121118;
          padding: 20px;
          border-radius: 8px;
          margin: 50px auto;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        ">
          <div style="
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
          ">FD</div>
          <h2 style="
            margin-top: 0;
            font-size: 28px;
            background: linear-gradient(to right, #3b82f6, #d946ef);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">Erreur de chargement</h2>
          <p>Impossible de charger les bibliothèques nécessaires pour FloDrama.</p>
          <p style="
            font-family: monospace;
            background: rgba(0,0,0,0.2);
            padding: 10px;
            border-radius: 4px;
            text-align: left;
            overflow-wrap: break-word;
          ">
            ${error.message}
          </p>
          <p>Veuillez vérifier votre connexion internet et rafraîchir la page.</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 20px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(217, 70, 239, 0.4)';" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            Rafraîchir la page
          </button>
        </div>
      `;
    }
  });
} else {
  console.log('React détecté, initialisation normale');
  initializeApp();
}
