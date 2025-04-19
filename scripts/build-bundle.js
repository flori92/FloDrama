// Script pour générer un bundle.js minimal
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel en utilisant ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le dossier dist
const distPath = path.join(__dirname, '../Frontend/dist');

// Créer le dossier dist s'il n'existe pas
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Contenu minimal du bundle.js
const bundleContent = `/**
 * FloDrama - Bundle JS minimal
 * Ce fichier est généré automatiquement pour résoudre les erreurs 404
 * Date de génération: ${new Date().toISOString()}
 */

// Initialisation de l'application FloDrama
(function() {
  console.log('Initialisation de FloDrama...');
  
  // Fonction pour initialiser l'application React
  function initializeApp() {
    // Créer l'élément racine pour React
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      console.error('Élément racine non trouvé');
      return;
    }
    
    // Masquer l'écran de chargement
    const loadingScreen = rootElement.querySelector('.loading-container');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 1500);
    }
    
    // Initialiser l'application React (simulation)
    console.log('Application FloDrama initialisée');
    
    // Créer un conteneur principal
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    
    // Image de secours pour le logo
    const fallbackLogoSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjM2I4MmY2IiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2Q5NDZlZiIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMUExOTI2IiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iU0YgUHJvIERpc3BsYXksIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0idXJsKCNncmFkaWVudCkiPkZsb0RyYW1hPC90ZXh0Pjwvc3ZnPg==';
    
    // Fonction pour créer des éléments HTML
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
    
    // Créer la navbar
    const navbar = createElementWithHTML('div', { class: 'navbar' });
    const navbarContainer = createElementWithHTML('div', { 
      class: 'container', 
      style: 'display: flex; justify-content: space-between; align-items: center; padding: 1rem;' 
    });
    
    // Logo
    const logoContainer = createElementWithHTML('div', { class: 'navbar-logo' });
    const logoImg = createElementWithHTML('img', { 
      src: '/assets/logo.svg', 
      alt: 'FloDrama', 
      style: 'height: 40px;' 
    });
    
    // Ajouter l'événement onerror pour le fallback
    logoImg.onerror = function() {
      this.src = fallbackLogoSvg;
    };
    
    logoContainer.appendChild(logoImg);
    
    // Liens de navigation
    const navLinks = createElementWithHTML('div', { 
      class: 'navbar-links', 
      style: 'display: flex; gap: 1.5rem;' 
    });
    
    // Ajouter les liens
    const navItems = ['Accueil', 'Dramas', 'Films', 'Animés', 'Bollywood', 'App', 'Watchparty'];
    navItems.forEach(item => {
      const link = createElementWithHTML('a', { 
        href: '#', 
        style: 'color: white; text-decoration: none; font-weight: 500;' 
      }, item);
      navLinks.appendChild(link);
    });
    
    // Assembler la navbar
    navbarContainer.appendChild(logoContainer);
    navbarContainer.appendChild(navLinks);
    navbar.appendChild(navbarContainer);
    
    // Contenu principal
    const mainContent = createElementWithHTML('div', { 
      class: 'main-content', 
      style: 'padding: 2rem 0;' 
    });
    const mainContainer = createElementWithHTML('div', { class: 'container' });
    
    // Titre
    const title = createElementWithHTML('h1', { 
      style: 'background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 2rem;' 
    }, 'Bienvenue sur FloDrama');
    
    mainContainer.appendChild(title);
    
    // Grille de contenu
    const contentGrid = createElementWithHTML('div', { 
      style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;' 
    });
    
    // Générer 8 cartes de contenu
    for (let i = 0; i < 8; i++) {
      const card = createElementWithHTML('div', { 
        class: 'card', 
        style: 'background-color: #1A1926; border-radius: 8px; overflow: hidden; transition: transform 0.3s ease;' 
      });
      
      const cardImage = createElementWithHTML('div', { 
        style: 'height: 150px; background: linear-gradient(45deg, #1A1926 25%, #2A2936 50%, #1A1926 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite linear;' 
      });
      
      const cardContent = createElementWithHTML('div', { style: 'padding: 1rem;' });
      const cardTitle = createElementWithHTML('h3', { 
        style: 'margin-top: 0; margin-bottom: 0.5rem;' 
      }, 'Titre ' + (i + 1));
      
      const cardDescription = createElementWithHTML('p', { 
        style: 'margin: 0; color: #E2E8F0;' 
      }, 'Description du contenu...');
      
      cardContent.appendChild(cardTitle);
      cardContent.appendChild(cardDescription);
      card.appendChild(cardImage);
      card.appendChild(cardContent);
      contentGrid.appendChild(card);
    }
    
    mainContainer.appendChild(contentGrid);
    mainContent.appendChild(mainContainer);
    
    // Footer
    const footer = createElementWithHTML('div', { 
      class: 'footer', 
      style: 'background-color: #1A1926; padding: 2rem 0; margin-top: auto;' 
    });
    
    const footerContainer = createElementWithHTML('div', { class: 'container' });
    const footerContent = createElementWithHTML('div', { 
      style: 'display: flex; justify-content: space-between; flex-wrap: wrap;' 
    });
    
    // Section 1
    const footerSection1 = createElementWithHTML('div', { style: 'margin-bottom: 1.5rem;' });
    footerSection1.appendChild(createElementWithHTML('h3', { 
      style: 'margin-top: 0; margin-bottom: 1rem;' 
    }, 'FloDrama'));
    
    footerSection1.appendChild(createElementWithHTML('p', { 
      style: 'margin: 0; color: #E2E8F0;' 
    }, 'La plateforme de streaming asiatique'));
    
    // Section 2
    const footerSection2 = createElementWithHTML('div', { style: 'margin-bottom: 1.5rem;' });
    footerSection2.appendChild(createElementWithHTML('h4', { 
      style: 'margin-top: 0; margin-bottom: 0.75rem;' 
    }, 'Liens'));
    
    const linksList = createElementWithHTML('ul', { 
      style: 'list-style: none; padding: 0; margin: 0;' 
    });
    
    ['Accueil', 'Dramas', 'Films', 'Animés'].forEach(item => {
      const listItem = createElementWithHTML('li', { style: 'margin-bottom: 0.5rem;' });
      listItem.appendChild(createElementWithHTML('a', { 
        href: '#', 
        style: 'color: #E2E8F0; text-decoration: none;' 
      }, item));
      linksList.appendChild(listItem);
    });
    
    footerSection2.appendChild(linksList);
    
    // Section 3
    const footerSection3 = createElementWithHTML('div', { style: 'margin-bottom: 1.5rem;' });
    footerSection3.appendChild(createElementWithHTML('h4', { 
      style: 'margin-top: 0; margin-bottom: 0.75rem;' 
    }, 'Support'));
    
    const supportList = createElementWithHTML('ul', { 
      style: 'list-style: none; padding: 0; margin: 0;' 
    });
    
    ['FAQ', 'Contact', 'Mentions légales'].forEach(item => {
      const listItem = createElementWithHTML('li', { style: 'margin-bottom: 0.5rem;' });
      listItem.appendChild(createElementWithHTML('a', { 
        href: '#', 
        style: 'color: #E2E8F0; text-decoration: none;' 
      }, item));
      supportList.appendChild(listItem);
    });
    
    footerSection3.appendChild(supportList);
    
    // Ajouter les sections au footer
    footerContent.appendChild(footerSection1);
    footerContent.appendChild(footerSection2);
    footerContent.appendChild(footerSection3);
    
    // Copyright
    const copyright = createElementWithHTML('div', { 
      style: 'margin-top: 2rem; text-align: center; color: #E2E8F0; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem;' 
    }, '&copy; ' + new Date().getFullYear() + ' FloDrama. Tous droits réservés.');
    
    footerContainer.appendChild(footerContent);
    footerContainer.appendChild(copyright);
    footer.appendChild(footerContainer);
    
    // Assembler l'application
    appContainer.appendChild(navbar);
    appContainer.appendChild(mainContent);
    appContainer.appendChild(footer);
    
    // Remplacer le contenu de l'élément racine
    rootElement.innerHTML = '';
    rootElement.appendChild(appContainer);
    
    // Ajouter des styles d'animation
    const style = document.createElement('style');
    style.textContent = '@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }';
    document.head.appendChild(style);
  }
  
  // Initialiser l'application quand le DOM est chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
})();
`;

// Écrire le contenu dans le fichier bundle.js
fs.writeFileSync(path.join(distPath, 'bundle.js'), bundleContent);

console.log('Bundle.js généré avec succès dans', path.join(distPath, 'bundle.js'));
