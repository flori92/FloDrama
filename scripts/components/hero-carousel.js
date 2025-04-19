// Composant de carrousel héroïque pour FloDrama
// Implémente un carrousel dynamique avec défilement automatique et contrôles

export const heroCarousel = `
// Fonction pour créer le carrousel héroïque
function createHeroCarousel() {
  const heroCarousel = createElementWithHTML('section', { 
    class: 'hero-carousel',
    style: 'position: relative; height: 70vh; max-height: 600px; overflow: hidden; margin-bottom: 2rem;'
  });
  
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
  const slidesContainer = createElementWithHTML('div', { 
    class: 'slides-container',
    style: 'position: relative; width: 100%; height: 100%;'
  });
  
  // Ajouter chaque slide
  slides.forEach((slide, index) => {
    const slideElement = createHeroSlide(slide, index === 0);
    slidesContainer.appendChild(slideElement);
  });
  
  // Ajouter les contrôles du carrousel
  const carouselControls = createCarouselControls(slides.length);
  
  // Ajouter les indicateurs de slide
  const slideIndicators = createSlideIndicators(slides.length);
  
  // Assembler le carrousel
  heroCarousel.appendChild(slidesContainer);
  heroCarousel.appendChild(carouselControls);
  heroCarousel.appendChild(slideIndicators);
  
  // Initialiser le défilement automatique
  initializeCarouselAutoplay(heroCarousel, slides.length);
  
  return heroCarousel;
}

// Fonction pour créer un slide du carrousel héroïque
function createHeroSlide(slide, isActive = false) {
  const slideElement = createElementWithHTML('div', { 
    class: 'hero-slide' + (isActive ? ' active' : ''),
    'data-slide-id': slide.id,
    style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: ' + (isActive ? '1' : '0') + '; transition: opacity 0.5s ease; overflow: hidden;'
  });
  
  // Image d'arrière-plan avec dégradé
  const slideBackground = createElementWithHTML('div', { 
    class: 'slide-background',
    style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(to right, rgba(18, 17, 24, 0.9), rgba(18, 17, 24, 0.6)), url(' + slide.image + '); background-size: cover; background-position: center;'
  });
  
  // Contenu du slide
  const slideContent = createElementWithHTML('div', { 
    class: 'slide-content',
    style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 5rem;'
  });
  
  // Titre avec dégradé
  const slideTitle = createElementWithHTML('h2', { 
    class: 'slide-title',
    style: 'font-size: 3rem; font-weight: 700; margin-bottom: 1rem; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; max-width: 60%;'
  }, slide.title);
  
  // Sous-titre
  const slideSubtitle = createElementWithHTML('p', { 
    class: 'slide-subtitle',
    style: 'font-size: 1.5rem; color: rgba(255, 255, 255, 0.8); margin-bottom: 2rem; max-width: 50%;'
  }, slide.subtitle);
  
  // Bouton d'action avec dégradé
  const slideCta = createElementWithHTML('a', { 
    href: slide.link,
    class: 'slide-cta',
    style: 'display: inline-block; padding: 0.75rem 2rem; background: linear-gradient(to right, #3b82f6, #d946ef); border-radius: 4px; color: white; text-decoration: none; font-weight: 600; transition: transform 0.3s ease;'
  }, slide.cta);
  
  // Ajouter l'événement de survol pour l'effet de scale
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
  
  return slideElement;
}

// Fonction pour créer les contrôles du carrousel
function createCarouselControls(slideCount) {
  const controlsContainer = createElementWithHTML('div', { 
    class: 'carousel-controls',
    style: 'position: absolute; top: 50%; transform: translateY(-50%); width: 100%; display: flex; justify-content: space-between; padding: 0 2rem; z-index: 10;'
  });
  
  // Bouton précédent
  const prevButton = createElementWithHTML('button', { 
    class: 'carousel-control prev',
    'aria-label': 'Slide précédent',
    style: 'width: 50px; height: 50px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.5); border: none; color: white; font-size: 1.5rem; cursor: pointer; transition: background-color 0.3s ease;'
  }, '❮');
  
  // Bouton suivant
  const nextButton = createElementWithHTML('button', { 
    class: 'carousel-control next',
    'aria-label': 'Slide suivant',
    style: 'width: 50px; height: 50px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.5); border: none; color: white; font-size: 1.5rem; cursor: pointer; transition: background-color 0.3s ease;'
  }, '❯');
  
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
  
  // Ajouter les événements de clic
  prevButton.addEventListener('click', function() {
    navigateCarousel('prev');
  });
  
  nextButton.addEventListener('click', function() {
    navigateCarousel('next');
  });
  
  // Assembler les contrôles
  controlsContainer.appendChild(prevButton);
  controlsContainer.appendChild(nextButton);
  
  return controlsContainer;
}

// Fonction pour créer les indicateurs de slide
function createSlideIndicators(slideCount) {
  const indicatorsContainer = createElementWithHTML('div', { 
    class: 'slide-indicators',
    style: 'position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; z-index: 10;'
  });
  
  // Créer un indicateur pour chaque slide
  for (let i = 0; i < slideCount; i++) {
    const indicator = createElementWithHTML('button', { 
      class: 'slide-indicator' + (i === 0 ? ' active' : ''),
      'data-slide-index': i,
      'aria-label': 'Aller au slide ' + (i + 1),
      style: 'width: 12px; height: 12px; border-radius: 50%; background-color: ' + (i === 0 ? '#d946ef' : 'rgba(255, 255, 255, 0.5)') + '; border: none; cursor: pointer; transition: background-color 0.3s ease, transform 0.3s ease;'
    });
    
    // Ajouter l'événement de survol
    indicator.addEventListener('mouseover', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'scale(1.2)';
      }
    });
    
    indicator.addEventListener('mouseout', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'scale(1)';
      }
    });
    
    // Ajouter l'événement de clic
    indicator.addEventListener('click', function() {
      const slideIndex = parseInt(this.getAttribute('data-slide-index'));
      goToSlide(slideIndex);
    });
    
    indicatorsContainer.appendChild(indicator);
  }
  
  return indicatorsContainer;
}

// Fonction pour initialiser le défilement automatique
function initializeCarouselAutoplay(carousel, slideCount) {
  let currentSlide = 0;
  
  // Changer de slide toutes les 5 secondes
  setInterval(() => {
    currentSlide = (currentSlide + 1) % slideCount;
    goToSlide(currentSlide);
  }, 5000);
}

// Fonction pour naviguer dans le carrousel
function navigateCarousel(direction) {
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
  
  // Mettre à jour les slides
  slides[activeIndex].classList.remove('active');
  slides[activeIndex].style.opacity = '0';
  
  slides[newIndex].classList.add('active');
  slides[newIndex].style.opacity = '1';
  
  // Mettre à jour les indicateurs
  indicators[activeIndex].classList.remove('active');
  indicators[activeIndex].style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
  
  indicators[newIndex].classList.add('active');
  indicators[newIndex].style.backgroundColor = '#d946ef';
}

// Fonction pour aller à un slide spécifique
function goToSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.slide-indicator');
  
  if (!slides.length) return;
  
  // Trouver le slide actif
  let activeIndex = 0;
  slides.forEach((slide, i) => {
    if (slide.classList.contains('active')) {
      activeIndex = i;
    }
    
    // Désactiver tous les slides
    slide.classList.remove('active');
    slide.style.opacity = '0';
    
    // Désactiver tous les indicateurs
    if (indicators[i]) {
      indicators[i].classList.remove('active');
      indicators[i].style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    }
  });
  
  // Activer le nouveau slide
  slides[index].classList.add('active');
  slides[index].style.opacity = '1';
  
  // Activer le nouvel indicateur
  if (indicators[index]) {
    indicators[index].classList.add('active');
    indicators[index].style.backgroundColor = '#d946ef';
  }
}
`;
