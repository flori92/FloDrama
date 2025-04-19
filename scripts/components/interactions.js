// Composant d'interactions pour FloDrama
// Implémente les interactions utilisateur et animations

export const interactions = `
// Fonction pour initialiser les interactions
function initializeInteractions() {
  // Initialiser le carrousel héroïque
  initializeHeroCarousel();
  
  // Initialiser les carrousels de contenu
  initializeContentCarousels();
  
  // Initialiser la barre de recherche
  initializeSearch();
  
  // Initialiser les favoris
  initializeFavorites();
  
  // Initialiser les notifications
  initializeNotifications();
  
  // Initialiser le système d'images
  initializeImageSystem();
  
  console.log('Interactions initialisées avec succès');
}

// Fonction pour initialiser le carrousel héroïque
function initializeHeroCarousel() {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  
  const slides = carousel.querySelectorAll('.hero-slide');
  const indicators = carousel.querySelectorAll('.slide-indicator');
  const prevButton = carousel.querySelector('.carousel-control.prev');
  const nextButton = carousel.querySelector('.carousel-control.next');
  
  if (!slides.length) return;
  
  let currentSlide = 0;
  let autoplayInterval;
  
  // Fonction pour aller à un slide spécifique
  const goToSlide = (index) => {
    // Désactiver tous les slides
    slides.forEach((slide) => {
      slide.classList.remove('active');
      slide.style.opacity = '0';
    });
    
    // Désactiver tous les indicateurs
    indicators.forEach((indicator) => {
      indicator.classList.remove('active');
      indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    });
    
    // Activer le nouveau slide
    slides[index].classList.add('active');
    slides[index].style.opacity = '1';
    
    // Activer le nouvel indicateur
    if (indicators[index]) {
      indicators[index].classList.add('active');
      indicators[index].style.backgroundColor = '#d946ef';
    }
    
    // Mettre à jour l'index courant
    currentSlide = index;
  };
  
  // Fonction pour aller au slide suivant
  const nextSlide = () => {
    const newIndex = (currentSlide + 1) % slides.length;
    goToSlide(newIndex);
  };
  
  // Fonction pour aller au slide précédent
  const prevSlide = () => {
    const newIndex = (currentSlide - 1 + slides.length) % slides.length;
    goToSlide(newIndex);
  };
  
  // Ajouter les événements de clic aux boutons
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      prevSlide();
      resetAutoplay();
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      nextSlide();
      resetAutoplay();
    });
  }
  
  // Ajouter les événements de clic aux indicateurs
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      goToSlide(index);
      resetAutoplay();
    });
  });
  
  // Fonction pour démarrer le défilement automatique
  const startAutoplay = () => {
    autoplayInterval = setInterval(nextSlide, 5000);
  };
  
  // Fonction pour réinitialiser le défilement automatique
  const resetAutoplay = () => {
    clearInterval(autoplayInterval);
    startAutoplay();
  };
  
  // Démarrer le défilement automatique
  startAutoplay();
  
  // Mettre en pause le défilement automatique lors du survol
  carousel.addEventListener('mouseenter', () => {
    clearInterval(autoplayInterval);
  });
  
  // Reprendre le défilement automatique lorsque la souris quitte le carrousel
  carousel.addEventListener('mouseleave', () => {
    startAutoplay();
  });
  
  console.log('Carrousel héroïque initialisé');
}

// Fonction pour initialiser les carrousels de contenu
function initializeContentCarousels() {
  const carousels = document.querySelectorAll('.content-carousel-container');
  
  carousels.forEach((carousel) => {
    const cardsContainer = carousel.querySelector('.cards-container');
    const prevButton = carousel.querySelector('.carousel-control.prev');
    const nextButton = carousel.querySelector('.carousel-control.next');
    
    if (!cardsContainer) return;
    
    const sectionType = cardsContainer.getAttribute('data-section-type');
    
    // Fonction pour naviguer dans le carrousel
    const navigate = (direction) => {
      const cardWidth = 216; // Largeur de la carte + gap
      const visibleCards = Math.floor(carousel.clientWidth / cardWidth);
      const scrollAmount = cardWidth * Math.min(visibleCards, 5);
      
      // Position actuelle
      const currentPosition = cardsContainer.style.transform ? 
        parseInt(cardsContainer.style.transform.replace('translateX(', '').replace('px)', '')) : 0;
      
      // Calculer la nouvelle position
      let newPosition;
      if (direction === 'prev') {
        newPosition = Math.min(0, currentPosition + scrollAmount);
      } else {
        const maxScroll = -(cardsContainer.scrollWidth - carousel.clientWidth);
        newPosition = Math.max(maxScroll, currentPosition - scrollAmount);
      }
      
      // Appliquer la transformation
      cardsContainer.style.transform = 'translateX(' + newPosition + 'px)';
    };
    
    // Ajouter les événements de clic aux boutons
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        navigate('prev');
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        navigate('next');
      });
    }
  });
  
  console.log('Carrousels de contenu initialisés');
}

// Fonction pour initialiser la barre de recherche
function initializeSearch() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;
  
  // Ajouter l'événement de soumission
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        console.log('Recherche pour:', searchTerm);
        
        // Simuler une recherche
        alert('Recherche pour: ' + searchTerm);
        
        // Réinitialiser l'entrée
        searchInput.value = '';
      }
    }
  });
  
  console.log('Barre de recherche initialisée');
}

// Fonction pour initialiser les favoris
function initializeFavorites() {
  const favoriteButtons = document.querySelectorAll('.favorite-button');
  
  favoriteButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      
      const card = button.closest('.content-card');
      if (!card) return;
      
      const contentId = card.getAttribute('data-id');
      const contentType = card.getAttribute('data-type');
      
      // Simuler l'ajout aux favoris
      console.log('Ajout aux favoris:', contentId, contentType);
      
      // Changer l'apparence du bouton
      if (button.textContent === '♡') {
        button.textContent = '♥';
        button.style.color = '#d946ef';
      } else {
        button.textContent = '♡';
        button.style.color = 'white';
      }
    });
  });
  
  console.log('Boutons de favoris initialisés');
}

// Fonction pour initialiser les notifications
function initializeNotifications() {
  const notificationsButton = document.querySelector('.notifications-button');
  if (!notificationsButton) return;
  
  notificationsButton.addEventListener('click', () => {
    console.log('Ouverture des notifications');
    
    // Simuler l'ouverture des notifications
    alert('Notifications: Aucune nouvelle notification');
  });
  
  console.log('Système de notifications initialisé');
}

// Fonction pour initialiser le système d'images
function initializeImageSystem() {
  // Vérifier si le système d'images est déjà chargé
  if (window.FloDramaImageSystem) {
    console.log('Système d\'images déjà chargé');
    return;
  }
  
  // Configuration des sources d'images
  const imageSources = [
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
  ];
  
  // Fonction pour sélectionner la source disponible avec la priorité la plus élevée
  const selectBestSource = () => {
    return imageSources.sort((a, b) => a.priority - b.priority)[0];
  };
  
  // Fonction pour générer l'URL d'une image
  const generateImageUrl = (contentId, type) => {
    const source = selectBestSource();
    const pathTemplate = `/assets/images/${type}/${contentId}.jpg`;
    
    return source.baseUrl + pathTemplate;
  };
  
  // Fonction pour précharger les images
  const preloadImages = (images) => {
    images.forEach((imageData) => {
      const img = new Image();
      img.src = generateImageUrl(imageData.id, imageData.type);
    });
  };
  
  // Créer le système d'images
  window.FloDramaImageSystem = {
    sources: imageSources,
    selectBestSource,
    generateImageUrl,
    preloadImages
  };
  
  console.log('Système d\'images initialisé');
  
  // Précharger les images des tendances
  const trendingItems = getTrendingItems();
  if (trendingItems && trendingItems.length) {
    window.FloDramaImageSystem.preloadImages(trendingItems);
  }
}
`;
