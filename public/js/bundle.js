/**
 * FloDrama - Bundle JS minimal
 * Ce fichier est généré automatiquement pour résoudre les erreurs 404
 * Date de génération: 2025-04-19T12:32:55.300Z
 */

// Initialisation de l'application FloDrama
(function() {
  console.log('Initialisation de FloDrama...');
  
  // Fonction principale pour initialiser l'application
  function initializeApp() {
    console.log('Initialisation de FloDrama...');
    
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
    }
    
    // Créer la structure de l'application
    const app = createElementWithHTML('div', { class: 'app' });
    
    // Créer la navbar
    const navbar = createElementWithHTML('nav', { class: 'navbar' });
    const navbarContainer = createElementWithHTML('div', { class: 'container', style: 'display: flex; justify-content: space-between; align-items: center;' });
    
    // Logo et nom
    const logoContainer = createElementWithHTML('div', { class: 'logo-container', style: 'display: flex; align-items: center;' });
    const logoLink = createElementWithHTML('a', { href: '/', style: 'display: flex; align-items: center; text-decoration: none;' });
    
    // SVG du logo
    const logoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    logoSvg.setAttribute('width', '40');
    logoSvg.setAttribute('height', '40');
    logoSvg.setAttribute('viewBox', '0 0 200 200');
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    linearGradient.setAttribute('id', 'navLogoGradient');
    linearGradient.setAttribute('x1', '0%');
    linearGradient.setAttribute('y1', '0%');
    linearGradient.setAttribute('x2', '100%');
    linearGradient.setAttribute('y2', '0%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3b82f6');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#d946ef');
    
    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    defs.appendChild(linearGradient);
    logoSvg.appendChild(defs);
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '100');
    circle.setAttribute('cy', '100');
    circle.setAttribute('r', '90');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'url(#navLogoGradient)');
    circle.setAttribute('stroke-width', '10');
    logoSvg.appendChild(circle);
    
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M60,70 L60,130 M90,70 L90,130 M60,70 Q75,50 90,70 M60,130 Q75,150 90,130');
    path1.setAttribute('stroke', 'url(#navLogoGradient)');
    path1.setAttribute('stroke-width', '10');
    path1.setAttribute('fill', 'none');
    path1.setAttribute('stroke-linecap', 'round');
    logoSvg.appendChild(path1);
    
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M110,70 L140,70 Q160,70 160,90 Q160,110 140,110 L110,110 L110,130');
    path2.setAttribute('stroke', 'url(#navLogoGradient)');
    path2.setAttribute('stroke-width', '10');
    path2.setAttribute('fill', 'none');
    path2.setAttribute('stroke-linecap', 'round');
    logoSvg.appendChild(path2);
    
    logoLink.appendChild(logoSvg);
    
    const brandName = createElementWithHTML('span', { 
      style: 'margin-left: 10px; font-size: 1.5rem; font-weight: bold; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;' 
    }, 'FloDrama');
    
    logoLink.appendChild(brandName);
    logoContainer.appendChild(logoLink);
    
    // Liens de navigation
    const navLinks = createElementWithHTML('div', { class: 'nav-links', style: 'display: flex; gap: 1.5rem;' });
    
    const navItems = [
      { text: 'Accueil', href: '/' },
      { text: 'Dramas', href: '/dramas' },
      { text: 'Films', href: '/films' },
      { text: 'Animés', href: '/animes' },
      { text: 'Bollywood', href: '/bollywood' },
      { text: 'App', href: '/app' },
      { text: 'Watchparty', href: '/watchparty' }
    ];
    
    navItems.forEach(item => {
      const link = createElementWithHTML('a', { 
        href: item.href, 
        style: 'color: #fff; text-decoration: none; font-weight: 500; transition: color 0.3s ease; padding: 0.5rem 0.75rem; border-radius: 4px; position: relative; overflow: hidden;' 
      }, item.text);
      
      // Ajouter des événements pour l'effet de survol
      link.addEventListener('mouseover', function() {
        this.style.color = '#d946ef';
      });
      
      link.addEventListener('mouseout', function() {
        this.style.color = '#fff';
      });
      
      navLinks.appendChild(link);
    });
    
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
    app.appendChild(navbar);
    app.appendChild(mainContent);
    app.appendChild(footer);
    
    // Remplacer le contenu de l'élément racine
    rootElement.innerHTML = '';
    rootElement.appendChild(app);
    
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
})();

