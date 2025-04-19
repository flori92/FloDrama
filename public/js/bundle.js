// Bundle.js généré pour FloDrama
// Ce fichier contient le code minimal pour afficher l'interface FloDrama

(function() {
  console.log('Initialisation de FloDrama...');
  
  // S'assurer que le DOM est complètement chargé avant d'initialiser l'application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOM déjà chargé, initialiser immédiatement
    setTimeout(initializeApp, 100); // Petit délai pour s'assurer que tout est bien chargé
  }
  
  // Fonction principale pour initialiser l'application
  function initializeApp() {
    console.log('Initialisation de l\'application FloDrama...');
    
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
        style: 'height: 150px; background: #2A293A; position: relative;' 
      });
      
      const cardContent = createElementWithHTML('div', { 
        style: 'padding: 1rem;' 
      });
      
      const cardTitle = createElementWithHTML('h3', { 
        style: 'margin: 0 0 0.5rem; font-size: 1.1rem; color: #fff;' 
      }, `Titre ${i + 1}`);
      
      const cardDescription = createElementWithHTML('p', { 
        style: 'margin: 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);' 
      }, 'Description du contenu');
      
      // Ajouter des événements pour l'effet de survol
      card.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-5px)';
      });
      
      card.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
      });
      
      cardContent.appendChild(cardTitle);
      cardContent.appendChild(cardDescription);
      card.appendChild(cardImage);
      card.appendChild(cardContent);
      contentGrid.appendChild(card);
    }
    
    mainContainer.appendChild(contentGrid);
    
    // Bouton d'action
    const actionButton = createElementWithHTML('button', { 
      style: 'display: block; margin: 0 auto; padding: 0.75rem 1.5rem; background: linear-gradient(to right, #3b82f6, #d946ef); border: none; border-radius: 4px; color: white; font-weight: bold; cursor: pointer; transition: transform 0.3s ease;' 
    }, 'Découvrir plus');
    
    // Ajouter des événements pour l'effet de survol
    actionButton.addEventListener('mouseover', function() {
      this.style.transform = 'scale(1.05)';
    });
    
    actionButton.addEventListener('mouseout', function() {
      this.style.transform = 'scale(1)';
    });
    
    mainContainer.appendChild(actionButton);
    mainContent.appendChild(mainContainer);
    
    // Footer
    const footer = createElementWithHTML('footer', { 
      style: 'background-color: #1A1926; padding: 2rem 0; margin-top: 2rem;' 
    });
    
    const footerContainer = createElementWithHTML('div', { 
      class: 'container', 
      style: 'display: flex; justify-content: space-between; align-items: center;' 
    });
    
    const footerLogo = createElementWithHTML('div', { 
      style: 'font-size: 1.5rem; font-weight: bold; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;' 
    }, 'FloDrama');
    
    const footerLinks = createElementWithHTML('div', { 
      style: 'display: flex; gap: 1.5rem;' 
    });
    
    const footerItems = ['À propos', 'Contact', 'Conditions', 'Confidentialité'];
    
    footerItems.forEach(item => {
      const link = createElementWithHTML('a', { 
        href: '#', 
        style: 'color: rgba(255, 255, 255, 0.7); text-decoration: none; font-size: 0.9rem; transition: color 0.3s ease;' 
      }, item);
      
      // Ajouter des événements pour l'effet de survol
      link.addEventListener('mouseover', function() {
        this.style.color = '#fff';
      });
      
      link.addEventListener('mouseout', function() {
        this.style.color = 'rgba(255, 255, 255, 0.7)';
      });
      
      footerLinks.appendChild(link);
    });
    
    footerContainer.appendChild(footerLogo);
    footerContainer.appendChild(footerLinks);
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
    style.textContent = `
      .card:hover { transform: translateY(-5px); }
      .btn:hover { transform: scale(1.05); }
    `;
    document.head.appendChild(style);
    
    // Masquer l'écran de chargement s'il existe
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
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
