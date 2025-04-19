// Composant Navbar avancé pour FloDrama
// Implémente la navbar avec glassmorphism, animations et sous-menus

export const navbar = `
// Fonction pour créer la navbar avancée
function createNavbar() {
  const navbar = createElementWithHTML('nav', { 
    class: 'navbar',
    style: 'background: rgba(26, 25, 38, 0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); position: sticky; top: 0; z-index: 100;'
  });
  
  const navbarContainer = createElementWithHTML('div', { 
    class: 'navbar-container',
    style: 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 2rem; max-width: 1440px; margin: 0 auto;'
  });
  
  // Logo et marque
  const logoContainer = createLogoContainer();
  
  // Liens de navigation avec effets de survol
  const navLinks = createNavLinks();
  
  // Barre de recherche
  const searchBar = createSearchBar();
  
  // Boutons utilisateur (notifications, profil)
  const userControls = createUserControls();
  
  // Assembler la navbar
  navbarContainer.appendChild(logoContainer);
  navbarContainer.appendChild(navLinks);
  
  const rightSection = createElementWithHTML('div', {
    class: 'navbar-right',
    style: 'display: flex; align-items: center; gap: 1rem;'
  });
  
  rightSection.appendChild(searchBar);
  rightSection.appendChild(userControls);
  
  navbarContainer.appendChild(rightSection);
  navbar.appendChild(navbarContainer);
  
  return navbar;
}

// Fonction pour créer le conteneur du logo
function createLogoContainer() {
  const logoContainer = createElementWithHTML('div', { 
    class: 'logo-container',
    style: 'display: flex; align-items: center;'
  });
  
  const logoLink = createElementWithHTML('a', { 
    href: '/',
    class: 'logo-link',
    style: 'display: flex; align-items: center; text-decoration: none;'
  });
  
  // SVG du logo avec dégradé signature
  const logoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  logoSvg.setAttribute('width', '40');
  logoSvg.setAttribute('height', '40');
  logoSvg.setAttribute('viewBox', '0 0 200 200');
  
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  linearGradient.setAttribute('id', 'logoGradient');
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
  circle.setAttribute('stroke', 'url(#logoGradient)');
  circle.setAttribute('stroke-width', '10');
  logoSvg.appendChild(circle);
  
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M60,70 L60,130 M90,70 L90,130 M60,70 Q75,50 90,70 M60,130 Q75,150 90,130');
  path1.setAttribute('stroke', 'url(#logoGradient)');
  path1.setAttribute('stroke-width', '10');
  path1.setAttribute('fill', 'none');
  path1.setAttribute('stroke-linecap', 'round');
  logoSvg.appendChild(path1);
  
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M110,70 L140,70 Q160,70 160,90 Q160,110 140,110 L110,110 L110,130');
  path2.setAttribute('stroke', 'url(#logoGradient)');
  path2.setAttribute('stroke-width', '10');
  path2.setAttribute('fill', 'none');
  path2.setAttribute('stroke-linecap', 'round');
  logoSvg.appendChild(path2);
  
  logoLink.appendChild(logoSvg);
  
  // Texte du logo avec dégradé
  const brandName = createElementWithHTML('span', { 
    class: 'brand-name',
    style: 'margin-left: 10px; font-size: 1.5rem; font-weight: bold; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;'
  }, 'FloDrama');
  
  logoLink.appendChild(brandName);
  logoContainer.appendChild(logoLink);
  
  return logoContainer;
}

// Fonction pour créer les liens de navigation
function createNavLinks() {
  const navLinks = createElementWithHTML('div', { 
    class: 'nav-links',
    style: 'display: flex; gap: 1.5rem; margin-left: 2rem;'
  });
  
  const links = [
    { text: 'Accueil', href: '/' },
    { text: 'Dramas', href: '/dramas' },
    { text: 'Films', href: '/films' },
    { text: 'Animés', href: '/animes' },
    { text: 'Bollywood', href: '/bollywood' },
    { text: 'App', href: '/app' },
    { text: 'Watchparty', href: '/watchparty' }
  ];
  
  links.forEach(link => {
    const linkElement = createElementWithHTML('a', { 
      href: link.href,
      class: 'nav-link',
      style: 'color: #fff; text-decoration: none; font-weight: 500; transition: color 0.3s ease; padding: 0.5rem 0.75rem; border-radius: 4px; position: relative;'
    }, link.text);
    
    // Ajouter l'événement de survol pour le changement de couleur
    linkElement.addEventListener('mouseover', function() {
      this.style.color = '#d946ef';
    });
    
    linkElement.addEventListener('mouseout', function() {
      this.style.color = '#fff';
    });
    
    navLinks.appendChild(linkElement);
  });
  
  return navLinks;
}

// Fonction pour créer la barre de recherche
function createSearchBar() {
  const searchContainer = createElementWithHTML('div', { 
    class: 'search-container',
    style: 'position: relative;'
  });
  
  const searchInput = createElementWithHTML('input', { 
    type: 'text',
    placeholder: 'Rechercher...',
    class: 'search-input',
    style: 'background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 0.5rem 1rem 0.5rem 2.5rem; color: #fff; width: 200px; transition: all 0.3s ease;'
  });
  
  // Icône de recherche
  const searchIcon = createElementWithHTML('div', { 
    class: 'search-icon',
    style: 'position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.7);'
  }, '🔍');
  
  // Ajouter les événements de focus
  searchInput.addEventListener('focus', function() {
    this.style.width = '250px';
    this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  });
  
  searchInput.addEventListener('blur', function() {
    this.style.width = '200px';
    this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  });
  
  searchContainer.appendChild(searchIcon);
  searchContainer.appendChild(searchInput);
  
  return searchContainer;
}

// Fonction pour créer les contrôles utilisateur
function createUserControls() {
  const userControls = createElementWithHTML('div', { 
    class: 'user-controls',
    style: 'display: flex; align-items: center; gap: 1rem;'
  });
  
  // Bouton de notifications
  const notificationsButton = createElementWithHTML('button', { 
    class: 'notifications-button',
    'aria-label': 'Notifications',
    style: 'background: none; border: none; color: #fff; cursor: pointer; position: relative;'
  }, '🔔');
  
  // Indicateur de notifications
  const notificationIndicator = createElementWithHTML('span', { 
    class: 'notification-indicator',
    style: 'position: absolute; top: -5px; right: -5px; width: 8px; height: 8px; background: linear-gradient(to right, #3b82f6, #d946ef); border-radius: 50%;'
  });
  
  notificationsButton.appendChild(notificationIndicator);
  
  // Bouton de profil
  const profileButton = createElementWithHTML('button', { 
    class: 'profile-button',
    'aria-label': 'Profil',
    style: 'background: none; border: none; color: #fff; cursor: pointer;'
  }, '👤');
  
  userControls.appendChild(notificationsButton);
  userControls.appendChild(profileButton);
  
  return userControls;
}
`;
