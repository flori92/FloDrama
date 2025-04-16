/**
 * Point d'entrée principal de l'application FloDrama
 * Ce fichier remplace main.jsx pour éviter les problèmes de MIME type
 * sur GitHub Pages et autres plateformes de déploiement
 */

// Importation du système centralisé de gestion des modules
import { initializeModules, resolveModulePath } from './config/moduleImports.js';

// Déclaration des variables globales pour les modules
let React, ReactDOM;

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
async function initializeUtilities() {
  console.log('Initialisation des utilitaires FloDrama...');
  
  // Définir la fonction de résolution des chemins d'assets si elle n'existe pas déjà
  if (typeof window.resolveAssetPath !== 'function') {
    window.resolveAssetPath = resolveModulePath;
  }
  
  // Récupération des modules nécessaires depuis l'objet global
  const { 
    LocalImageFallback, 
    CacheManager, 
    PWAInit,
    HybridContentService 
  } = window.FloDrama || {};
  
  // Initialiser les placeholders pour les images
  try {
    if (LocalImageFallback && typeof LocalImageFallback.createPlaceholders === 'function') {
      LocalImageFallback.createPlaceholders();
      console.log('Placeholders d\'images initialisés');
    }
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation des placeholders d\'images:', error);
  }
  
  // Vérifier et nettoyer le cache si nécessaire
  try {
    if (CacheManager && typeof CacheManager.cleanCache === 'function') {
      const cacheSize = localStorage.length;
      console.log(`Taille actuelle du cache: ${cacheSize} entrées`);
      if (cacheSize > 100) {
        console.log('Nettoyage du cache...');
        CacheManager.cleanCache();
        console.log('Cache nettoyé avec succès');
      }
    }
  } catch (error) {
    console.warn('Erreur lors de la vérification du cache:', error);
  }
  
  // Initialiser la PWA
  try {
    if (PWAInit && typeof PWAInit === 'function') {
      PWAInit();
      console.log('PWA initialisée avec succès');
    }
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation de la PWA:', error);
  }
  
  // Initialiser le service de contenu hybride
  try {
    if (HybridContentService && typeof HybridContentService.getPopularContent === 'function') {
      console.log('Initialisation du service de contenu hybride...');
      // Précharger certaines données populaires pour accélérer l'affichage initial
      HybridContentService.getPopularContent()
        .then(content => {
          console.log(`Service hybride initialisé - ${content.length} éléments préchargés`);
        })
        .catch(error => {
          console.warn('Erreur lors du préchargement des contenus:', error);
        });
    }
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation du service hybride:', error);
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
    
    // Précharger les images importantes
    preloadImportantImages();
    
    // Si nous ne sommes pas dans un environnement avec React, ne pas essayer le rendu
    if (!isReactAvailable()) {
      console.log('React n\'est pas disponible, FloDrama fonctionnera en mode compatible HTML');
      return;
    }
    
    console.log('React détecté, initialisation du rendu React');
    
    // Trouver l'élément racine
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Élément racine `root` introuvable dans le DOM');
      return;
    }
    
    // Vérifier si ReactDOM a la méthode createRoot (React 18+)
    if (typeof ReactDOM.createRoot === 'function') {
      console.log('Utilisation de ReactDOM.createRoot (React 18+)');
      
      // Créer la racine React et rendre l'application
      const root = ReactDOM.createRoot(rootElement);
      
      // Utiliser AppErrorBoundary si disponible
      if (window.FloDrama && window.FloDrama.AppErrorBoundary) {
        root.render(
          React.createElement(
            window.FloDrama.AppErrorBoundary,
            null,
            React.createElement(window.FloDrama.HybridHomePage || window.FloDrama.App)
          )
        );
      } else {
        // Fallback direct sur HybridHomePage ou App
        const MainComponent = window.FloDrama && (window.FloDrama.HybridHomePage || window.FloDrama.App);
        if (MainComponent) {
          root.render(React.createElement(MainComponent));
        } else {
          console.error('Aucun composant principal trouvé pour le rendu');
        }
      }
    } else if (typeof ReactDOM.render === 'function') {
      // Fallback pour React 17 et versions antérieures
      console.log('Fallback sur ReactDOM.render (React < 18)');
      
      // Utiliser AppErrorBoundary si disponible
      if (window.FloDrama && window.FloDrama.AppErrorBoundary) {
        ReactDOM.render(
          React.createElement(
            window.FloDrama.AppErrorBoundary,
            null,
            React.createElement(window.FloDrama.HybridHomePage || window.FloDrama.App)
          ),
          rootElement
        );
      } else {
        // Fallback direct sur HybridHomePage ou App
        const MainComponent = window.FloDrama && (window.FloDrama.HybridHomePage || window.FloDrama.App);
        if (MainComponent) {
          ReactDOM.render(React.createElement(MainComponent), rootElement);
        } else {
          console.error('Aucun composant principal trouvé pour le rendu');
        }
      }
    } else {
      console.error('ReactDOM ne possède pas de méthode de rendu compatible');
    }
    
    console.log('Rendu React initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'application:', error);
    displayErrorScreen(error);
  }
}

/**
 * Précharge les images importantes pour améliorer l'expérience utilisateur
 */
function preloadImportantImages() {
  // Liste des images importantes à précharger
  const importantImages = [
    'assets/images/posters/solo-leveling.svg',
    'assets/images/posters/queen-of-tears.svg',
    'assets/images/posters/parasite.svg',
    'assets/images/posters/crash-landing-on-you.svg',
    'assets/images/posters/itaewon-class.svg',
    'assets/images/posters/goblin.svg'
  ];
  
  console.log(`Préchargement de ${importantImages.length} images importantes...`);
  
  // Précharger chaque image
  importantImages.forEach(imagePath => {
    const img = new Image();
    img.src = resolveModulePath(imagePath);
    
    // Ajouter des gestionnaires d'événements
    img.onload = () => {
      console.log(`Image préchargée avec succès: ${imagePath}`);
    };
    
    img.onerror = () => {
      console.warn(`Erreur lors du préchargement de l'image: ${imagePath}`);
    };
  });
}

/**
 * Affiche un écran d'erreur personnalisé
 * @param {Error} error - L'erreur à afficher
 */
function displayErrorScreen(error) {
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
          background-clip: text;
          color: transparent;
        ">Erreur de chargement</h2>
        <p>Impossible de charger les modules nécessaires pour FloDrama.</p>
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
}

/**
 * Charge les modules React depuis un CDN ou en local
 */
async function loadReactModules() {
  console.log('Chargement des modules React...');
  
  // Essayer de charger React depuis des CDN
  const cdnUrls = {
    react: 'https://unpkg.com/react@18/umd/react.production.min.js',
    reactDOM: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
  };
  
  // Fonction pour charger un script
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Impossible de charger le script: ${src}`));
      document.head.appendChild(script);
    });
  }
  
  try {
    // Charger React et ReactDOM depuis les CDN
    await Promise.all([
      loadScript(cdnUrls.react),
      loadScript(cdnUrls.reactDOM)
    ]);
    
    // Vérifier si React est maintenant disponible
    if (typeof window.React !== 'undefined' && typeof window.ReactDOM !== 'undefined') {
      React = window.React;
      ReactDOM = window.ReactDOM;
      console.log('React chargé avec succès depuis les CDN');
      return true;
    } else {
      throw new Error('React n\'est pas disponible après le chargement des CDN');
    }
  } catch (error) {
    console.warn('Erreur lors du chargement de React depuis les CDN:', error);
    console.log('Tentative de chargement de React depuis les modules locaux...');
    
    try {
      // Essayer de charger React depuis les modules locaux
      const reactModule = await import('react');
      const reactDOMModule = await import('react-dom');
      
      React = reactModule.default || reactModule;
      ReactDOM = reactDOMModule.default || reactDOMModule;
      
      console.log('React chargé avec succès depuis les modules locaux');
      return true;
    } catch (moduleError) {
      console.error('Impossible de charger React:', moduleError);
      return false;
    }
  }
}

/**
 * Initialisation de l'application
 */
async function startApplication() {
  try {
    console.log('Démarrage de FloDrama...');
    
    // Étape 1: Charger React
    const reactLoaded = await loadReactModules();
    if (!reactLoaded) {
      throw new Error('Impossible de charger React. Veuillez vérifier votre connexion internet.');
    }
    
    // Étape 2: Initialiser les modules de l'application
    const modulesInitialized = await initializeModules();
    if (!modulesInitialized) {
      throw new Error('Erreur lors de l\'initialisation des modules FloDrama.');
    }
    
    // Étape 3: Initialiser l'application
    initializeApp();
    
    console.log('FloDrama démarré avec succès');
  } catch (error) {
    console.error('Erreur lors du démarrage de FloDrama:', error);
    displayErrorScreen(error);
  }
}

// Démarrer l'application
startApplication();
