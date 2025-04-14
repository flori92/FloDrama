import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

// Fonction pour vérifier si React est correctement chargé
function isReactAvailable() {
  return (
    typeof React !== 'undefined' && 
    React !== null && 
    typeof React.createElement === 'function' && 
    typeof React.Component === 'function'
  );
}

// Fonction d'initialisation de l'application
function initializeApp() {
  try {
    console.log('Initialisation de FloDrama...');
    
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
    
    // Rendu de l'application
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
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
    
    console.log('FloDrama initialisé avec succès');
  } catch (error) {
    console.error('Erreur critique lors de l\'initialisation de FloDrama:', error);
    
    // Afficher un message d'erreur visible pour l'utilisateur
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          background-color: #121118;
          padding: 20px;
          border-radius: 8px;
          margin: 50px auto;
          max-width: 500px;
          text-align: center;
        ">
          <h2 style="color: #d946ef;">Erreur d'initialisation</h2>
          <p>Une erreur est survenue lors du chargement de FloDrama.</p>
          <p style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; text-align: left; overflow-wrap: break-word;">
            ${error.message}
          </p>
          <p>Veuillez rafraîchir la page ou réessayer plus tard.</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 20px;
          ">
            Rafraîchir la page
          </button>
        </div>
      `;
    }
    
    // Masquer le preloader en cas d'erreur
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
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          background-color: #121118;
          padding: 20px;
          border-radius: 8px;
          margin: 50px auto;
          max-width: 500px;
          text-align: center;
        ">
          <h2 style="color: #d946ef;">Erreur de chargement</h2>
          <p>Impossible de charger les bibliothèques nécessaires pour FloDrama.</p>
          <p style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; text-align: left; overflow-wrap: break-word;">
            ${error.message}
          </p>
          <p>Veuillez vérifier votre connexion internet et rafraîchir la page.</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 20px;
          ">
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
