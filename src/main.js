// Fichier principal pour l'initialisation de l'interface enrichie de FloDrama
// Intègre tous les services et composants pour créer une expérience utilisateur complète

// Importer les services
import { ContentDataService } from './services/ContentDataService.js';
import { SearchService } from './services/SearchService.js';
import { FavoritesService } from './services/FavoritesService.js';
import { RecommendationService } from './services/RecommendationService.js';

// Importer les composants
import { SearchComponent } from './components/SearchComponent.js';
import { FavoritesComponent } from './components/FavoritesComponent.js';
import { RecommendationComponent } from './components/RecommendationComponent.js';

// Classe principale de l'application FloDrama
export class FloDramaApp {
  constructor() {
    // Initialiser les services
    this.contentDataService = new ContentDataService();
    this.favoritesService = new FavoritesService();
    this.searchService = new SearchService(this.contentDataService);
    this.recommendationService = new RecommendationService(
      this.contentDataService,
      this.favoritesService
    );

    // Initialiser les composants
    this.searchComponent = new SearchComponent(
      this.searchService,
      this.contentDataService
    );
    this.favoritesComponent = new FavoritesComponent(
      this.favoritesService,
      this.contentDataService
    );
    this.recommendationComponent = new RecommendationComponent(
      this.recommendationService,
      this.contentDataService
    );

    console.log('FloDramaApp initialisée');
  }

  // Initialiser l'application
  async initialize() {
    console.log('Initialisation de FloDramaApp...');

    // Vérifier si l'élément racine existe
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Élément racine non trouvé');
      return;
    }

    // Créer la structure de base
    const app = document.createElement('div');
    app.className = 'app';
    app.style = `
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: #121118;
      color: white;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Ajouter la navbar avancée
    app.appendChild(this.createNavbar());

    // Ajouter le contenu principal
    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    mainContent.style = `
      flex: 1;
      padding-top: 1rem;
    `;

    // Ajouter le carrousel héroïque
    mainContent.appendChild(this.createHeroCarousel());

    // Ajouter les sections de contenu
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    contentContainer.style = `
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 2rem;
    `;

    // Ajouter les recommandations
    await this.recommendationComponent.render(contentContainer);

    // Ajouter les favoris
    this.favoritesComponent.render(contentContainer);

    mainContent.appendChild(contentContainer);
    app.appendChild(mainContent);

    // Ajouter le footer
    app.appendChild(this.createFooter());

    // Remplacer le contenu de l'élément racine
    rootElement.innerHTML = '';
    rootElement.appendChild(app);

    // Ajouter les styles globaux
    this.addGlobalStyles();

    console.log('FloDramaApp initialisée avec succès');
  }

  // Créer la navbar avancée
  createNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.style = `
      background: rgba(26, 25, 38, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    `;

    const navbarContainer = document.createElement('div');
    navbarContainer.className = 'navbar-container';
    navbarContainer.style = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 2rem;
      max-width: 1440px;
      margin: 0 auto;
    `;

    // Logo et marque
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    logoContainer.style = `
      display: flex;
      align-items: center;
    `;

    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.className = 'logo-link';
    logoLink.style = `
      display: flex;
      align-items: center;
      text-decoration: none;
    `;

    // Logo avec dégradé
    const logoText = document.createElement('h1');
    logoText.className = 'logo-text';
    logoText.textContent = 'FloDrama';
    logoText.style = `
      font-size: 1.5rem;
      font-weight: bold;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    `;

    logoLink.appendChild(logoText);
    logoContainer.appendChild(logoLink);

    // Navigation
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    navLinks.style = `
      display: flex;
      gap: 1.5rem;
    `;

    // Liens de navigation
    const links = [
      { text: 'Accueil', href: '/' },
      { text: 'Dramas', href: '/dramas' },
      { text: 'Films', href: '/films' },
      { text: 'Animés', href: '/animes' },
      { text: 'Bollywood', href: '/bollywood' },
      { text: 'Ma Liste', href: '/my-list' }
    ];

    links.forEach(link => {
      const linkElement = document.createElement('a');
      linkElement.href = link.href;
      linkElement.textContent = link.text;
      linkElement.className = 'nav-link';
      linkElement.style = `
        color: white;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s ease;
        padding: 0.5rem 0;
        position: relative;
      `;

      // Effet de survol
      linkElement.addEventListener('mouseover', function() {
        this.style.color = '#d946ef';
      });

      linkElement.addEventListener('mouseout', function() {
        this.style.color = 'white';
      });

      navLinks.appendChild(linkElement);
    });

    // Barre de recherche
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    this.searchComponent.render(searchContainer);

    // Assembler la navbar
    navbarContainer.appendChild(logoContainer);
    navbarContainer.appendChild(navLinks);
    navbarContainer.appendChild(searchContainer);
    navbar.appendChild(navbarContainer);

    return navbar;
  }

  // Créer le carrousel héroïque
  createHeroCarousel() {
    const heroCarousel = document.createElement('section');
    heroCarousel.className = 'hero-carousel';
    heroCarousel.style = `
      position: relative;
      height: 70vh;
      max-height: 600px;
      overflow: hidden;
      margin-bottom: 3rem;
    `;

    // Créer les slides du carrousel
    const slides = [
      {
        id: 1,
        title: 'Découvrez les meilleurs dramas coréens',
        subtitle: 'Des histoires captivantes qui vous transporteront',
        image: '/public/assets/images/hero/1.svg',
        cta: 'Explorer',
        link: '/dramas'
      },
      {
        id: 2,
        title: 'Films Bollywood à ne pas manquer',
        subtitle: 'L\'excellence du cinéma indien',
        image: '/public/assets/images/hero/2.svg',
        cta: 'Voir la sélection',
        link: '/bollywood'
      },
      {
        id: 3,
        title: 'Animés populaires du moment',
        subtitle: 'Les séries qui font sensation au Japon',
        image: '/public/assets/images/hero/3.svg',
        cta: 'Découvrir',
        link: '/animes'
      }
    ];

    // Conteneur des slides
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'slides-container';
    slidesContainer.style = `
      position: relative;
      width: 100%;
      height: 100%;
    `;

    // Créer chaque slide
    slides.forEach((slide, index) => {
      const slideElement = document.createElement('div');
      slideElement.className = `hero-slide ${index === 0 ? 'active' : ''}`;
      slideElement.dataset.slideId = slide.id;
      slideElement.style = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: ${index === 0 ? '1' : '0'};
        transition: opacity 0.5s ease;
        overflow: hidden;
      `;

      // Image d'arrière-plan avec dégradé
      const slideBackground = document.createElement('div');
      slideBackground.className = 'slide-background';
      slideBackground.style = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: linear-gradient(to right, rgba(18, 17, 24, 0.9), rgba(18, 17, 24, 0.6)), url(${slide.image});
        background-size: cover;
        background-position: center;
      `;

      // Contenu du slide
      const slideContent = document.createElement('div');
      slideContent.className = 'slide-content';
      slideContent.style = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 5rem;
      `;

      // Titre avec dégradé
      const slideTitle = document.createElement('h2');
      slideTitle.className = 'slide-title';
      slideTitle.textContent = slide.title;
      slideTitle.style = `
        font-size: 3rem;
        font-weight: 700;
        margin-bottom: 1rem;
        background: linear-gradient(to right, #3b82f6, #d946ef);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        max-width: 60%;
      `;

      // Sous-titre
      const slideSubtitle = document.createElement('p');
      slideSubtitle.className = 'slide-subtitle';
      slideSubtitle.textContent = slide.subtitle;
      slideSubtitle.style = `
        font-size: 1.5rem;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 2rem;
        max-width: 50%;
      `;

      // Bouton d'action avec dégradé
      const slideCta = document.createElement('a');
      slideCta.href = slide.link;
      slideCta.className = 'slide-cta';
      slideCta.textContent = slide.cta;
      slideCta.style = `
        display: inline-block;
        padding: 0.75rem 2rem;
        background: linear-gradient(to right, #3b82f6, #d946ef);
        border-radius: 8px;
        color: white;
        text-decoration: none;
        font-weight: 600;
        transition: transform 0.3s ease;
      `;

      // Effet de survol
      slideCta.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.05)';
      });

      slideCta.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
      });

      // Assembler le contenu du slide
      slideContent.appendChild(slideTitle);
      slideContent.appendChild(slideSubtitle);
      slideContent.appendChild(slideCta);

      // Assembler le slide
      slideElement.appendChild(slideBackground);
      slideElement.appendChild(slideContent);
      slidesContainer.appendChild(slideElement);
    });

    // Contrôles du carrousel
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'carousel-controls';
    controlsContainer.style = `
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 2rem;
      z-index: 10;
    `;

    // Bouton précédent
    const prevButton = document.createElement('button');
    prevButton.className = 'carousel-control prev';
    prevButton.innerHTML = '❮';
    prevButton.style = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    `;

    // Bouton suivant
    const nextButton = document.createElement('button');
    nextButton.className = 'carousel-control next';
    nextButton.innerHTML = '❯';
    nextButton.style = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    `;

    // Ajouter les événements de survol
    prevButton.addEventListener('mouseover', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    });

    prevButton.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    });

    nextButton.addEventListener('mouseover', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    });

    nextButton.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    });

    // Ajouter les événements de navigation
    prevButton.addEventListener('click', () => this.navigateCarousel('prev'));
    nextButton.addEventListener('click', () => this.navigateCarousel('next'));

    // Assembler les contrôles
    controlsContainer.appendChild(prevButton);
    controlsContainer.appendChild(nextButton);

    // Indicateurs de slide
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'slide-indicators';
    indicatorsContainer.style = `
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      z-index: 10;
    `;

    // Créer un indicateur pour chaque slide
    slides.forEach((slide, index) => {
      const indicator = document.createElement('button');
      indicator.className = `slide-indicator ${index === 0 ? 'active' : ''}`;
      indicator.dataset.slideIndex = index;
      indicator.style = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${index === 0 ? '#d946ef' : 'rgba(255, 255, 255, 0.5)'};
        border: none;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.3s ease;
      `;

      // Ajouter l'événement de clic
      indicator.addEventListener('click', () => this.goToSlide(index));

      indicatorsContainer.appendChild(indicator);
    });

    // Assembler le carrousel
    heroCarousel.appendChild(slidesContainer);
    heroCarousel.appendChild(controlsContainer);
    heroCarousel.appendChild(indicatorsContainer);

    // Initialiser le défilement automatique
    this.initCarouselAutoplay();

    return heroCarousel;
  }

  // Initialiser le défilement automatique du carrousel
  initCarouselAutoplay() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.hero-slide');
    
    if (!slides.length) return;
    
    // Changer de slide toutes les 5 secondes
    setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      this.goToSlide(currentSlide);
    }, 5000);
  }

  // Naviguer dans le carrousel
  navigateCarousel(direction) {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.slide-indicator');
    
    if (!slides.length) return;
    
    // Trouver le slide actif
    let activeIndex = 0;
    slides.forEach((slide, index) => {
      if (slide.classList.contains('active')) {
        activeIndex = index;
      }
    });
    
    // Calculer le nouvel index
    let newIndex;
    if (direction === 'prev') {
      newIndex = (activeIndex - 1 + slides.length) % slides.length;
    } else {
      newIndex = (activeIndex + 1) % slides.length;
    }
    
    // Aller au nouveau slide
    this.goToSlide(newIndex);
  }

  // Aller à un slide spécifique
  goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.slide-indicator');
    
    if (!slides.length) return;
    
    // Désactiver tous les slides et indicateurs
    slides.forEach((slide, i) => {
      slide.classList.remove('active');
      slide.style.opacity = '0';
      
      if (indicators[i]) {
        indicators[i].classList.remove('active');
        indicators[i].style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      }
    });
    
    // Activer le nouveau slide et indicateur
    slides[index].classList.add('active');
    slides[index].style.opacity = '1';
    
    if (indicators[index]) {
      indicators[index].classList.add('active');
      indicators[index].style.backgroundColor = '#d946ef';
    }
  }

  // Créer le footer
  createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.style = `
      background-color: #1A1926;
      padding: 3rem 0;
      margin-top: 2rem;
    `;

    const footerContainer = document.createElement('div');
    footerContainer.className = 'footer-container';
    footerContainer.style = `
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 2rem;
    `;

    // Logo et description
    const footerBrand = document.createElement('div');
    footerBrand.className = 'footer-brand';
    footerBrand.style = `
      margin-bottom: 2rem;
    `;

    // Logo avec dégradé
    const footerLogo = document.createElement('div');
    footerLogo.className = 'footer-logo';
    footerLogo.style = `
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    `;

    const logoText = document.createElement('h2');
    logoText.className = 'logo-text';
    logoText.textContent = 'FloDrama';
    logoText.style = `
      font-size: 1.5rem;
      font-weight: bold;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    `;

    footerLogo.appendChild(logoText);

    // Description
    const footerDescription = document.createElement('p');
    footerDescription.className = 'footer-description';
    footerDescription.textContent = 'FloDrama est votre plateforme de streaming dédiée aux films, séries, animés et productions asiatiques. Découvrez un monde de divertissement sans limites.';
    footerDescription.style = `
      color: rgba(255, 255, 255, 0.7);
      max-width: 400px;
    `;

    footerBrand.appendChild(footerLogo);
    footerBrand.appendChild(footerDescription);

    // Copyright
    const copyright = document.createElement('div');
    copyright.className = 'copyright';
    copyright.textContent = `© ${new Date().getFullYear()} FloDrama. Tous droits réservés.`;
    copyright.style = `
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    `;

    // Assembler le footer
    footerContainer.appendChild(footerBrand);
    footerContainer.appendChild(copyright);
    footer.appendChild(footerContainer);

    return footer;
  }

  // Ajouter les styles globaux
  addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
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
        --border-radius-sm: 4px;
        --border-radius-md: 8px;
        --border-radius-lg: 12px;
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
      
      /* Styles responsifs */
      @media (max-width: 768px) {
        .hero-carousel {
          height: 50vh;
        }
        
        .slide-title {
          font-size: 2rem !important;
          max-width: 80% !important;
        }
        
        .slide-subtitle {
          font-size: 1.2rem !important;
          max-width: 80% !important;
        }
        
        .nav-links {
          display: none !important;
        }
      }
      
      @media (max-width: 480px) {
        .slide-content {
          padding: 0 2rem !important;
        }
        
        .slide-title {
          font-size: 1.5rem !important;
          max-width: 100% !important;
        }
        
        .slide-subtitle {
          font-size: 1rem !important;
          max-width: 100% !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  const app = new FloDramaApp();
  app.initialize();
});
