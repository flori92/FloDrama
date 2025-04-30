// Script de génération du bundle amélioré pour FloDrama
// Ce script génère un bundle JavaScript qui intègre toutes les fonctionnalités avancées
// de l'interface FloDrama (carrousel, catégories, effets de survol, etc.)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const outputPath = path.join(__dirname, '../Frontend/dist/bundle.js');
const publicOutputPath = path.join(__dirname, '../public/js/bundle.js');

// Importer les composants
import { navbar } from './components/navbar.js';
import { heroCarousel } from './components/hero-carousel.js';
import { contentSections } from './components/content-sections.js';
import { footer } from './components/footer.js';
import { styles } from './components/styles.js';
import { interactions } from './components/interactions.js';

// Fonction pour créer le bundle
const createBundle = () => {
  // Contenu du bundle
  const bundleContent = `
// Bundle.js amélioré pour FloDrama
// Ce fichier contient le code pour afficher l'interface FloDrama avec toutes les fonctionnalités
// Date de génération: ${new Date().toISOString()}

(function() {
  console.log('Initialisation de FloDrama...');
  
  // S'assurer que le DOM est complètement chargé avant d'initialiser l'application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOM déjà chargé, initialiser immédiatement
    setTimeout(initializeApp, 100);
  }
  
  // Fonction principale pour initialiser l'application
  function initializeApp() {
    console.log('Initialisation de l\\'application FloDrama...');
    
    // Vérifier si l'élément racine existe, sinon le créer
    let rootElement = document.getElementById('root');
    if (!rootElement) {
      console.log('Élément racine non trouvé, création automatique');
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      
      // Supprimer l'écran de chargement s'il existe
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        document.body.removeChild(loadingScreen);
      }
      
      // Ajouter l'élément racine au body
      document.body.appendChild(rootElement);
    } else {
      console.log('Élément racine trouvé:', rootElement);
    }
    
    // Créer l'application complète avec toutes les fonctionnalités
    createEnhancedInterface(rootElement);
  }
  
  // Fonction pour créer l'interface enrichie
  function createEnhancedInterface(rootElement) {
    // Créer la structure de base
    const app = createElementWithHTML('div', { class: 'app' });
    
    // Ajouter la navbar avancée
    app.appendChild(createNavbar());
    
    // Ajouter le contenu principal
    const mainContent = createElementWithHTML('main', { class: 'main-content' });
    
    // Ajouter le carrousel héroïque
    mainContent.appendChild(createHeroCarousel());
    
    // Ajouter les sections de contenu
    mainContent.appendChild(createContentSections());
    
    app.appendChild(mainContent);
    
    // Ajouter le footer
    app.appendChild(createFooter());
    
    // Remplacer le contenu de l'élément racine
    rootElement.innerHTML = '';
    rootElement.appendChild(app);
    
    // Ajouter les styles CSS
    addStyles();
    
    // Initialiser les interactions
    initializeInteractions();
  }
  
  ${navbar}
  
  ${heroCarousel}
  
  ${contentSections}
  
  ${footer}
  
  ${styles}
  
  ${interactions}
  
  // Fonction utilitaire pour créer des éléments HTML
  function createElementWithHTML(tag, attributes = {}, innerHTML = '') {
    const element = document.createElement(tag);
    
    // Ajouter les attributs
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    
    // Ajouter le contenu HTML
    if (innerHTML) {
      element.innerHTML = innerHTML;
    }
    
    return element;
  }
})();
  `;
  
  // Écrire le contenu dans les fichiers de sortie
  fs.writeFileSync(outputPath, bundleContent);
  fs.writeFileSync(publicOutputPath, bundleContent);
  
  console.log(`Bundle.js généré avec succès dans ${outputPath}`);
  console.log(`Bundle.js copié dans ${publicOutputPath}`);
};

// Créer le répertoire components s'il n'existe pas
const componentsDir = path.join(__dirname, 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir);
}

// Exécuter la fonction principale
createBundle();
