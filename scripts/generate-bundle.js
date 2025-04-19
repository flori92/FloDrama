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

// Fonction pour créer le bundle
const createBundle = () => {
  // Contenu du bundle
  const bundleContent = `
// Bundle.js amélioré pour FloDrama
// Ce fichier contient le code pour afficher l'interface FloDrama avec toutes les fonctionnalités
// Date de génération: ${new Date().toISOString()}

(function() {
  console.log('Initialisation de FloDrama...');
  
  // Configuration des sources d'images
  const CDN_CONFIG = {
    SOURCES: [
      {
        name: 'github',
        baseUrl: 'https://flodrama.com',
        enabled: true,
        priority: 1
      },
      {
        name: 'cloudfront',
        baseUrl: 'https://d11nnqvjfooahr.cloudfront.net',
        enabled: true,
        priority: 2
      },
      {
        name: 's3',
        baseUrl: 'https://flodrama-prod.s3.amazonaws.com',
        enabled: true,
        priority: 3
      }
    ]
  };
  
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
    const app = document.createElement('div');
    app.className = 'app';
    
    // Ajouter la navbar avancée
    app.appendChild(createNavbar());
    
    // Ajouter le contenu principal
    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    
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
  
  // Fonction pour créer la navbar avancée
  function createNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.style = 'background: rgba(26, 25, 38, 0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); position: sticky; top: 0; z-index: 100;';
    
    const navbarContainer = document.createElement('div');
    navbarContainer.className = 'navbar-container';
    navbarContainer.style = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 2rem; max-width: 1440px; margin: 0 auto;';
    
    // Logo et marque
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    logoContainer.style = 'display: flex; align-items: center;';
    
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.className = 'logo-link';
    logoLink.style = 'display: flex; align-items: center; text-decoration: none;';
    
    const brandName = document.createElement('span');
    brandName.className = 'brand-name';
    brandName.style = 'margin-left: 10px; font-size: 1.5rem; font-weight: bold; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
    brandName.textContent = 'FloDrama';
    
    logoLink.appendChild(brandName);
    logoContainer.appendChild(logoLink);
    
    // Liens de navigation
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    navLinks.style = 'display: flex; gap: 1.5rem; margin-left: 2rem;';
    
    const links = [
      { text: 'Accueil', href: '/' },
      { text: 'Dramas', href: '/dramas' },
      { text: 'Films', href: '/films' },
      { text: 'Animés', href: '/animes' },
      { text: 'Bollywood', href: '/bollywood' }
    ];
    
    links.forEach(link => {
      const linkElement = document.createElement('a');
      linkElement.href = link.href;
      linkElement.className = 'nav-link';
      linkElement.style = 'color: #fff; text-decoration: none; font-weight: 500; transition: color 0.3s ease; padding: 0.5rem 0.75rem; border-radius: 4px;';
      linkElement.textContent = link.text;
      
      navLinks.appendChild(linkElement);
    });
    
    // Barre de recherche
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style = 'position: relative;';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Rechercher...';
    searchInput.className = 'search-input';
    searchInput.style = 'background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 0.5rem 1rem; color: #fff; width: 200px;';
    
    searchContainer.appendChild(searchInput);
    
    // Assembler la navbar
    navbarContainer.appendChild(logoContainer);
    navbarContainer.appendChild(navLinks);
    navbarContainer.appendChild(searchContainer);
    navbar.appendChild(navbarContainer);
    
    return navbar;
  }
  
  // Fonction pour créer le carrousel héroïque
  function createHeroCarousel() {
    const heroCarousel = document.createElement('section');
    heroCarousel.className = 'hero-carousel';
    heroCarousel.style = 'position: relative; height: 70vh; max-height: 600px; overflow: hidden; margin-bottom: 2rem;';
    
    // Créer les slides du carrousel
    const slides = [
      { 
        id: 1, 
        title: 'Nouveauté: Drama Coréen', 
        subtitle: 'Découvrez les dernières séries coréennes',
        image: '/public/assets/images/hero1.jpg',
        cta: 'Regarder maintenant',
        link: '/dramas/new'
      },
      { 
        id: 2, 
        title: 'Films Bollywood', 
        subtitle: 'Les meilleurs films indiens',
        image: '/public/assets/images/hero2.jpg',
        cta: 'Explorer',
        link: '/bollywood'
      },
      { 
        id: 3, 
        title: 'Animés Populaires', 
        subtitle: 'Top des animés japonais',
        image: '/public/assets/images/hero3.jpg',
        cta: 'Découvrir',
        link: '/anime'
      }
    ];
    
    // Créer le conteneur de slides
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'slides-container';
    slidesContainer.style = 'position: relative; width: 100%; height: 100%;';
    
    // Ajouter chaque slide
    slides.forEach((slide, index) => {
      const slideElement = document.createElement('div');
      slideElement.className = 'hero-slide' + (index === 0 ? ' active' : '');
      slideElement.dataset.slideId = slide.id;
      slideElement.style = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: ' + (index === 0 ? '1' : '0') + '; transition: opacity 0.5s ease; overflow: hidden;';
      
      // Image d'arrière-plan avec dégradé
      const slideBackground = document.createElement('div');
      slideBackground.className = 'slide-background';
      slideBackground.style = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(to right, rgba(18, 17, 24, 0.9), rgba(18, 17, 24, 0.6)), url(' + slide.image + '); background-size: cover; background-position: center;';
      
      // Contenu du slide
      const slideContent = document.createElement('div');
      slideContent.className = 'slide-content';
      slideContent.style = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 5rem;';
      
      // Titre avec dégradé
      const slideTitle = document.createElement('h2');
      slideTitle.className = 'slide-title';
      slideTitle.style = 'font-size: 3rem; font-weight: 700; margin-bottom: 1rem; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; max-width: 60%;';
      slideTitle.textContent = slide.title;
      
      // Sous-titre
      const slideSubtitle = document.createElement('p');
      slideSubtitle.className = 'slide-subtitle';
      slideSubtitle.style = 'font-size: 1.5rem; color: rgba(255, 255, 255, 0.8); margin-bottom: 2rem; max-width: 50%;';
      slideSubtitle.textContent = slide.subtitle;
      
      // Bouton d'action avec dégradé
      const slideCta = document.createElement('a');
      slideCta.href = slide.link;
      slideCta.className = 'slide-cta';
      slideCta.style = 'display: inline-block; padding: 0.75rem 2rem; background: linear-gradient(to right, #3b82f6, #d946ef); border-radius: 4px; color: white; text-decoration: none; font-weight: 600;';
      slideCta.textContent = slide.cta;
      
      // Assembler le contenu du slide
      slideContent.appendChild(slideTitle);
      slideContent.appendChild(slideSubtitle);
      slideContent.appendChild(slideCta);
      
      // Assembler le slide
      slideElement.appendChild(slideBackground);
      slideElement.appendChild(slideContent);
      
      slidesContainer.appendChild(slideElement);
    });
    
    // Assembler le carrousel
    heroCarousel.appendChild(slidesContainer);
    
    return heroCarousel;
  }
  
  // Fonction pour créer les sections de contenu
  function createContentSections() {
    const contentSections = document.createElement('div');
    contentSections.className = 'content-sections';
    contentSections.style = 'padding: 0 2rem; max-width: 1440px; margin: 0 auto;';
    
    // Sections à créer
    const sections = [
      { title: 'Tendances', type: 'trending' },
      { title: 'Recommandé pour vous', type: 'recommended' },
      { title: 'Dramas Coréens', type: 'korean' },
      { title: 'Films Populaires', type: 'movies' },
      { title: 'Animés', type: 'anime' },
      { title: 'Bollywood', type: 'bollywood' }
    ];
    
    // Créer chaque section
    sections.forEach(section => {
      const sectionElement = document.createElement('section');
      sectionElement.className = 'content-section ' + section.type + '-section';
      sectionElement.dataset.sectionType = section.type;
      sectionElement.style = 'margin-bottom: 3rem;';
      
      // Titre de la section avec dégradé
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.style = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;';
      
      const sectionTitle = document.createElement('h2');
      sectionTitle.className = 'section-title';
      sectionTitle.style = 'font-size: 1.5rem; font-weight: 600; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
      sectionTitle.textContent = section.title;
      
      // Bouton "Voir tout"
      const viewAllButton = document.createElement('a');
      viewAllButton.href = '/' + section.type;
      viewAllButton.className = 'view-all-button';
      viewAllButton.style = 'color: rgba(255, 255, 255, 0.7); text-decoration: none; font-size: 0.9rem;';
      viewAllButton.textContent = 'Voir tout';
      
      // Assembler l'en-tête
      sectionHeader.appendChild(sectionTitle);
      sectionHeader.appendChild(viewAllButton);
      
      // Carrousel de contenu (simplifié pour l'exemple)
      const contentCarousel = document.createElement('div');
      contentCarousel.className = 'content-carousel';
      contentCarousel.style = 'display: flex; gap: 1rem; overflow-x: auto; padding: 1rem 0;';
      
      // Ajouter quelques cartes de contenu
      for (let i = 1; i <= 6; i++) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.style = 'flex: 0 0 auto; width: 200px; height: 300px; border-radius: 8px; overflow: hidden; position: relative; background-color: #1A1926;';
        
        // Titre de la carte
        const cardTitle = document.createElement('div');
        cardTitle.className = 'card-title';
        cardTitle.style = 'position: absolute; bottom: 0; left: 0; width: 100%; padding: 1rem; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); color: white;';
        cardTitle.textContent = 'Titre ' + i;
        
        card.appendChild(cardTitle);
        contentCarousel.appendChild(card);
      }
      
      // Assembler la section
      sectionElement.appendChild(sectionHeader);
      sectionElement.appendChild(contentCarousel);
      
      contentSections.appendChild(sectionElement);
    });
    
    return contentSections;
  }
  
  // Fonction pour créer le footer
  function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.style = 'background-color: #1A1926; padding: 3rem 0; margin-top: 2rem;';
    
    const footerContainer = document.createElement('div');
    footerContainer.className = 'footer-container';
    footerContainer.style = 'max-width: 1440px; margin: 0 auto; padding: 0 2rem;';
    
    // Logo et description
    const footerBrand = document.createElement('div');
    footerBrand.className = 'footer-brand';
    footerBrand.style = 'margin-bottom: 2rem;';
    
    // Logo avec dégradé
    const footerLogo = document.createElement('div');
    footerLogo.className = 'footer-logo';
    footerLogo.style = 'display: flex; align-items: center; margin-bottom: 1rem;';
    
    const logoText = document.createElement('h2');
    logoText.className = 'logo-text';
    logoText.style = 'font-size: 1.5rem; font-weight: bold; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin: 0;';
    logoText.textContent = 'FloDrama';
    
    footerLogo.appendChild(logoText);
    
    // Description
    const footerDescription = document.createElement('p');
    footerDescription.className = 'footer-description';
    footerDescription.style = 'color: rgba(255, 255, 255, 0.7); max-width: 400px;';
    footerDescription.textContent = 'FloDrama est votre plateforme de streaming dédiée aux films, séries, animés et productions asiatiques. Découvrez un monde de divertissement sans limites.';
    
    footerBrand.appendChild(footerLogo);
    footerBrand.appendChild(footerDescription);
    
    // Copyright
    const copyright = document.createElement('div');
    copyright.className = 'copyright';
    copyright.style = 'color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1);';
    copyright.textContent = '© ' + new Date().getFullYear() + ' FloDrama. Tous droits réservés.';
    
    // Assembler le footer
    footerContainer.appendChild(footerBrand);
    footerContainer.appendChild(copyright);
    
    footer.appendChild(footerContainer);
    
    return footer;
  }
  
  // Fonction pour ajouter les styles CSS
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = \`
      /* Variables CSS */
      :root {
        --color-primary: #3b82f6;
        --color-accent: #d946ef;
        --color-background: #121118;
        --color-background-secondary: #1A1926;
        --color-text-primary: #ffffff;
        --color-text-secondary: rgba(255, 255, 255, 0.7);
        --gradient-primary: linear-gradient(to right, #3b82f6, #d946ef);
        --transition-default: all 0.3s ease;
      }
      
      /* Styles de base */
      body {
        margin: 0;
        padding: 0;
        font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: var(--color-background);
        color: var(--color-text-primary);
        line-height: 1.5;
      }
      
      * {
        box-sizing: border-box;
      }
      
      /* Conteneur principal */
      .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      
      .main-content {
        flex: 1;
      }
      
      /* Styles de la navbar */
      .navbar {
        background: rgba(26, 25, 38, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.5rem 0;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      
      .nav-link:hover {
        color: var(--color-accent);
      }
      
      /* Styles du carrousel héroïque */
      .hero-slide.active {
        opacity: 1;
      }
      
      .slide-cta:hover {
        transform: scale(1.05);
      }
      
      /* Styles des sections de contenu */
      .content-card {
        transition: transform 0.3s ease;
      }
      
      .content-card:hover {
        transform: scale(1.05);
        z-index: 10;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .navbar-container {
          flex-wrap: wrap;
        }
        
        .nav-links {
          order: 3;
          width: 100%;
          margin: 1rem 0 0;
          overflow-x: auto;
        }
        
        .hero-carousel {
          height: 50vh;
        }
      }
    \`;
    
    document.head.appendChild(style);
  }
  
  // Fonction pour initialiser les interactions
  function initializeInteractions() {
    console.log('Initialisation des interactions...');
    
    // Ajouter des événements aux liens de navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('mouseover', function() {
        this.style.color = '#d946ef';
      });
      
      link.addEventListener('mouseout', function() {
        this.style.color = '#fff';
      });
    });
    
    // Initialiser le défilement automatique du carrousel héroïque
    initializeHeroCarousel();
  }
  
  // Fonction pour initialiser le carrousel héroïque
  function initializeHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    let currentSlide = 0;
    
    // Fonction pour passer au slide suivant
    function nextSlide() {
      slides[currentSlide].classList.remove('active');
      slides[currentSlide].style.opacity = '0';
      
      currentSlide = (currentSlide + 1) % slides.length;
      
      slides[currentSlide].classList.add('active');
      slides[currentSlide].style.opacity = '1';
    }
    
    // Changer de slide toutes les 5 secondes
    setInterval(nextSlide, 5000);
  }
})();
  `;
  
  // Créer les répertoires de sortie s'ils n'existent pas
  const frontendDistDir = path.join(__dirname, '../Frontend/dist');
  const publicJsDir = path.join(__dirname, '../public/js');
  
  if (!fs.existsSync(frontendDistDir)) {
    fs.mkdirSync(frontendDistDir, { recursive: true });
  }
  
  if (!fs.existsSync(publicJsDir)) {
    fs.mkdirSync(publicJsDir, { recursive: true });
  }
  
  // Écrire le contenu dans les fichiers de sortie
  fs.writeFileSync(outputPath, bundleContent);
  fs.writeFileSync(publicOutputPath, bundleContent);
  
  console.log(`Bundle.js généré avec succès dans ${outputPath}`);
  console.log(`Bundle.js copié dans ${publicOutputPath}`);
};

// Exécuter la fonction principale
createBundle();
