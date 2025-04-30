// Composant de sections de contenu pour FloDrama
// Implémente les différentes sections de contenu avec cartes et carrousels

export const contentSections = `
// Fonction pour créer les sections de contenu
function createContentSections() {
  const contentSections = createElementWithHTML('div', { 
    class: 'content-sections',
    style: 'padding: 0 2rem; max-width: 1440px; margin: 0 auto;'
  });
  
  // Sections à créer
  const sections = [
    { title: 'Tendances', type: 'trending', items: getTrendingItems() },
    { title: 'Recommandé pour vous', type: 'recommended', items: getRecommendedItems() },
    { title: 'Dramas Coréens', type: 'korean', items: getKoreanDramas() },
    { title: 'Films Populaires', type: 'movies', items: getPopularMovies() },
    { title: 'Animés', type: 'anime', items: getAnimeItems() },
    { title: 'Bollywood', type: 'bollywood', items: getBollywoodItems() },
    { title: 'Continuer à regarder', type: 'continue-watching', items: getContinueWatchingItems() },
    { title: 'Ma Liste', type: 'my-list', items: getMyListItems() }
  ];
  
  // Créer chaque section
  sections.forEach(section => {
    const sectionElement = createContentSection(section);
    contentSections.appendChild(sectionElement);
  });
  
  return contentSections;
}

// Fonction pour créer une section de contenu
function createContentSection(section) {
  const sectionElement = createElementWithHTML('section', { 
    class: 'content-section ' + section.type + '-section',
    'data-section-type': section.type,
    style: 'margin-bottom: 3rem;'
  });
  
  // Titre de la section avec dégradé
  const sectionHeader = createElementWithHTML('div', { 
    class: 'section-header',
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;'
  });
  
  const sectionTitle = createElementWithHTML('h2', { 
    class: 'section-title',
    style: 'font-size: 1.5rem; font-weight: 600; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;'
  }, section.title);
  
  // Bouton "Voir tout"
  const viewAllButton = createElementWithHTML('a', { 
    href: '/' + section.type,
    class: 'view-all-button',
    style: 'color: rgba(255, 255, 255, 0.7); text-decoration: none; font-size: 0.9rem; transition: color 0.3s ease;'
  }, 'Voir tout');
  
  // Ajouter l'événement de survol
  viewAllButton.addEventListener('mouseover', function() {
    this.style.color = '#d946ef';
  });
  
  viewAllButton.addEventListener('mouseout', function() {
    this.style.color = 'rgba(255, 255, 255, 0.7)';
  });
  
  // Assembler l'en-tête
  sectionHeader.appendChild(sectionTitle);
  sectionHeader.appendChild(viewAllButton);
  
  // Carrousel de contenu
  const contentCarousel = createContentCarousel(section.items, section.type);
  
  // Assembler la section
  sectionElement.appendChild(sectionHeader);
  sectionElement.appendChild(contentCarousel);
  
  return sectionElement;
}

// Fonction pour créer un carrousel de contenu
function createContentCarousel(items, sectionType) {
  const carouselContainer = createElementWithHTML('div', { 
    class: 'content-carousel-container',
    style: 'position: relative; overflow: hidden;'
  });
  
  // Conteneur des cartes
  const cardsContainer = createElementWithHTML('div', { 
    class: 'cards-container',
    'data-section-type': sectionType,
    style: 'display: flex; gap: 1rem; transition: transform 0.5s ease; padding: 0.5rem 0;'
  });
  
  // Ajouter chaque carte
  items.forEach(item => {
    const card = createContentCard(item);
    cardsContainer.appendChild(card);
  });
  
  // Contrôles du carrousel
  const carouselControls = createElementWithHTML('div', { 
    class: 'carousel-controls',
    style: 'position: absolute; top: 50%; transform: translateY(-50%); width: 100%; display: flex; justify-content: space-between; pointer-events: none;'
  });
  
  // Bouton précédent
  const prevButton = createElementWithHTML('button', { 
    class: 'carousel-control prev',
    'data-section-type': sectionType,
    'aria-label': 'Précédent',
    style: 'width: 40px; height: 40px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.7); border: none; color: white; font-size: 1.2rem; cursor: pointer; pointer-events: auto; opacity: 0; transition: opacity 0.3s ease;'
  }, '❮');
  
  // Bouton suivant
  const nextButton = createElementWithHTML('button', { 
    class: 'carousel-control next',
    'data-section-type': sectionType,
    'aria-label': 'Suivant',
    style: 'width: 40px; height: 40px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.7); border: none; color: white; font-size: 1.2rem; cursor: pointer; pointer-events: auto; opacity: 0; transition: opacity 0.3s ease;'
  }, '❯');
  
  // Ajouter les événements
  carouselContainer.addEventListener('mouseover', function() {
    prevButton.style.opacity = '1';
    nextButton.style.opacity = '1';
  });
  
  carouselContainer.addEventListener('mouseout', function() {
    prevButton.style.opacity = '0';
    nextButton.style.opacity = '0';
  });
  
  // Ajouter les événements de clic
  prevButton.addEventListener('click', function() {
    navigateContentCarousel(sectionType, 'prev');
  });
  
  nextButton.addEventListener('click', function() {
    navigateContentCarousel(sectionType, 'next');
  });
  
  // Assembler les contrôles
  carouselControls.appendChild(prevButton);
  carouselControls.appendChild(nextButton);
  
  // Assembler le carrousel
  carouselContainer.appendChild(cardsContainer);
  carouselContainer.appendChild(carouselControls);
  
  return carouselContainer;
}

// Fonction pour créer une carte de contenu
function createContentCard(item) {
  const card = createElementWithHTML('div', { 
    class: 'content-card',
    'data-id': item.id,
    'data-type': item.type,
    style: 'flex: 0 0 auto; width: 200px; border-radius: 8px; overflow: hidden; position: relative; transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer;'
  });
  
  // Image du contenu
  const imageContainer = createElementWithHTML('div', { 
    class: 'card-image-container',
    style: 'position: relative; width: 100%; height: 300px; overflow: hidden;'
  });
  
  const image = createElementWithHTML('img', { 
    src: item.image,
    alt: item.title,
    loading: 'lazy',
    style: 'width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;'
  });
  
  // Overlay avec informations et boutons
  const overlay = createElementWithHTML('div', { 
    class: 'card-overlay',
    style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(18, 17, 24, 0.9), transparent 70%); opacity: 0; transition: opacity 0.3s ease; display: flex; flex-direction: column; justify-content: flex-end; padding: 1rem;'
  });
  
  // Titre
  const title = createElementWithHTML('h3', { 
    class: 'card-title',
    style: 'margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; color: white;'
  }, item.title);
  
  // Info (année, durée, etc.)
  const info = createElementWithHTML('div', { 
    class: 'card-info',
    style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: rgba(255, 255, 255, 0.7);'
  });
  
  // Année
  const year = createElementWithHTML('span', { 
    class: 'card-year'
  }, item.year);
  
  // Durée
  const duration = createElementWithHTML('span', { 
    class: 'card-duration'
  }, item.duration);
  
  // Catégorie
  const category = createElementWithHTML('span', { 
    class: 'card-category'
  }, item.category);
  
  // Assembler les infos
  info.appendChild(year);
  info.appendChild(createElementWithHTML('span', {}, '•'));
  info.appendChild(duration);
  info.appendChild(createElementWithHTML('span', {}, '•'));
  info.appendChild(category);
  
  // Boutons d'action
  const actionButtons = createElementWithHTML('div', { 
    class: 'card-actions',
    style: 'display: flex; gap: 0.5rem;'
  });
  
  // Bouton play
  const playButton = createElementWithHTML('button', { 
    class: 'play-button',
    'aria-label': 'Lire ' + item.title,
    style: 'width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(to right, #3b82f6, #d946ef); border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;'
  }, '<span style="margin-left: 2px;">▶</span>');
  
  // Bouton info
  const infoButton = createElementWithHTML('button', { 
    class: 'info-button',
    'aria-label': 'Plus d’informations sur ' + item.title,
    style: 'width: 30px; height: 30px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;'
  }, 'ℹ');
  
  // Bouton ajouter aux favoris
  const favoriteButton = createElementWithHTML('button', { 
    class: 'favorite-button',
    'aria-label': 'Ajouter ' + item.title + ' aux favoris',
    style: 'width: 30px; height: 30px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;'
  }, '♡');
  
  // Assembler les boutons
  actionButtons.appendChild(playButton);
  actionButtons.appendChild(infoButton);
  actionButtons.appendChild(favoriteButton);
  
  // Assembler l'overlay
  overlay.appendChild(title);
  overlay.appendChild(info);
  overlay.appendChild(actionButtons);
  
  // Assembler la carte
  imageContainer.appendChild(image);
  imageContainer.appendChild(overlay);
  card.appendChild(imageContainer);
  
  // Ajouter les événements pour les effets de survol
  card.addEventListener('mouseover', function() {
    this.style.transform = 'scale(1.05)';
    this.style.zIndex = '10';
    this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
    image.style.transform = 'scale(1.1)';
    overlay.style.opacity = '1';
  });
  
  card.addEventListener('mouseout', function() {
    this.style.transform = 'scale(1)';
    this.style.zIndex = '1';
    this.style.boxShadow = 'none';
    image.style.transform = 'scale(1)';
    overlay.style.opacity = '0';
  });
  
  return card;
}

// Fonction pour naviguer dans un carrousel de contenu
function navigateContentCarousel(sectionType, direction) {
  const cardsContainer = document.querySelector('.cards-container[data-section-type="' + sectionType + '"]');
  
  if (!cardsContainer) return;
  
  const cardWidth = 216; // Largeur de la carte + gap
  const visibleCards = Math.floor(cardsContainer.clientWidth / cardWidth);
  const scrollAmount = cardWidth * Math.min(visibleCards, 5);
  
  // Position actuelle
  const currentPosition = cardsContainer.style.transform ? 
    parseInt(cardsContainer.style.transform.replace('translateX(', '').replace('px)', '')) : 0;
  
  // Calculer la nouvelle position
  let newPosition;
  if (direction === 'prev') {
    newPosition = Math.min(0, currentPosition + scrollAmount);
  } else {
    const maxScroll = -(cardsContainer.scrollWidth - cardsContainer.clientWidth);
    newPosition = Math.max(maxScroll, currentPosition - scrollAmount);
  }
  
  // Appliquer la transformation
  cardsContainer.style.transform = 'translateX(' + newPosition + 'px)';
}

// Fonctions pour obtenir les données de contenu
function getTrendingItems() {
  return [
    { id: 1, title: 'Crash Landing on You', year: '2019', duration: '1h20', category: 'Drama', type: 'drama', image: '/public/assets/images/content/trending1.jpg' },
    { id: 2, title: 'Squid Game', year: '2021', duration: '50min', category: 'Thriller', type: 'drama', image: '/public/assets/images/content/trending2.jpg' },
    { id: 3, title: 'Demon Slayer', year: '2020', duration: '24min', category: 'Anime', type: 'anime', image: '/public/assets/images/content/trending3.jpg' },
    { id: 4, title: 'Vincenzo', year: '2021', duration: '1h10', category: 'Crime', type: 'drama', image: '/public/assets/images/content/trending4.jpg' },
    { id: 5, title: 'My Name', year: '2021', duration: '50min', category: 'Action', type: 'drama', image: '/public/assets/images/content/trending5.jpg' },
    { id: 6, title: 'Itaewon Class', year: '2020', duration: '1h10', category: 'Drama', type: 'drama', image: '/public/assets/images/content/trending6.jpg' },
    { id: 7, title: 'Kingdom', year: '2019', duration: '50min', category: 'Historique', type: 'drama', image: '/public/assets/images/content/trending7.jpg' },
    { id: 8, title: 'Jujutsu Kaisen', year: '2020', duration: '24min', category: 'Anime', type: 'anime', image: '/public/assets/images/content/trending8.jpg' }
  ];
}

function getRecommendedItems() {
  return [
    { id: 9, title: 'Hospital Playlist', year: '2020', duration: '1h30', category: 'Drama', type: 'drama', image: '/public/assets/images/content/recommended1.jpg' },
    { id: 10, title: 'Reply 1988', year: '2015', duration: '1h30', category: 'Comédie', type: 'drama', image: '/public/assets/images/content/recommended2.jpg' },
    { id: 11, title: 'Attack on Titan', year: '2013', duration: '24min', category: 'Anime', type: 'anime', image: '/public/assets/images/content/recommended3.jpg' },
    { id: 12, title: 'It's Okay to Not Be Okay', year: '2020', duration: '1h10', category: 'Romance', type: 'drama', image: '/public/assets/images/content/recommended4.jpg' },
    { id: 13, title: 'Hometown Cha-Cha-Cha', year: '2021', duration: '1h10', category: 'Romance', type: 'drama', image: '/public/assets/images/content/recommended5.jpg' },
    { id: 14, title: 'My Hero Academia', year: '2016', duration: '24min', category: 'Anime', type: 'anime', image: '/public/assets/images/content/recommended6.jpg' },
    { id: 15, title: 'Goblin', year: '2016', duration: '1h10', category: 'Fantaisie', type: 'drama', image: '/public/assets/images/content/recommended7.jpg' },
    { id: 16, title: 'Naruto Shippuden', year: '2007', duration: '24min', category: 'Anime', type: 'anime', image: '/public/assets/images/content/recommended8.jpg' }
  ];
}

function getKoreanDramas() {
  return [
    { id: 17, title: 'Descendants of the Sun', year: '2016', duration: '1h', category: 'Action', type: 'drama', image: '/public/assets/images/content/korean1.jpg' },
    { id: 18, title: 'True Beauty', year: '2020', duration: '1h10', category: 'Comédie', type: 'drama', image: '/public/assets/images/content/korean2.jpg' },
    { id: 19, title: 'Signal', year: '2016', duration: '1h', category: 'Crime', type: 'drama', image: '/public/assets/images/content/korean3.jpg' },
    { id: 20, title: 'Mr. Queen', year: '2020', duration: '1h20', category: 'Historique', type: 'drama', image: '/public/assets/images/content/korean4.jpg' },
    { id: 21, title: 'Flower of Evil', year: '2020', duration: '1h10', category: 'Thriller', type: 'drama', image: '/public/assets/images/content/korean5.jpg' },
    { id: 22, title: 'Start-Up', year: '2020', duration: '1h10', category: 'Business', type: 'drama', image: '/public/assets/images/content/korean6.jpg' },
    { id: 23, title: 'My Mister', year: '2018', duration: '1h30', category: 'Drame', type: 'drama', image: '/public/assets/images/content/korean7.jpg' },
    { id: 24, title: 'The King: Eternal Monarch', year: '2020', duration: '1h10', category: 'Fantaisie', type: 'drama', image: '/public/assets/images/content/korean8.jpg' }
  ];
}

function getPopularMovies() {
  return [
    { id: 25, title: 'Parasite', year: '2019', duration: '2h12', category: 'Thriller', type: 'movie', image: '/public/assets/images/content/movie1.jpg' },
    { id: 26, title: 'Train to Busan', year: '2016', duration: '1h58', category: 'Horreur', type: 'movie', image: '/public/assets/images/content/movie2.jpg' },
    { id: 27, title: 'The Handmaiden', year: '2016', duration: '2h25', category: 'Drame', type: 'movie', image: '/public/assets/images/content/movie3.jpg' },
    { id: 28, title: 'Oldboy', year: '2003', duration: '2h', category: 'Thriller', type: 'movie', image: '/public/assets/images/content/movie4.jpg' },
    { id: 29, title: 'I Saw the Devil', year: '2010', duration: '2h24', category: 'Thriller', type: 'movie', image: '/public/assets/images/content/movie5.jpg' },
    { id: 30, title: 'A Taxi Driver', year: '2017', duration: '2h17', category: 'Historique', type: 'movie', image: '/public/assets/images/content/movie6.jpg' },
    { id: 31, title: 'The Wailing', year: '2016', duration: '2h36', category: 'Horreur', type: 'movie', image: '/public/assets/images/content/movie7.jpg' },
    { id: 32, title: 'Burning', year: '2018', duration: '2h28', category: 'Mystère', type: 'movie', image: '/public/assets/images/content/movie8.jpg' }
  ];
}

function getAnimeItems() {
  return [
    { id: 33, title: 'One Piece', year: '1999', duration: '24min', category: 'Aventure', type: 'anime', image: '/public/assets/images/content/anime1.jpg' },
    { id: 34, title: 'Death Note', year: '2006', duration: '24min', category: 'Thriller', type: 'anime', image: '/public/assets/images/content/anime2.jpg' },
    { id: 35, title: 'Fullmetal Alchemist', year: '2009', duration: '24min', category: 'Action', type: 'anime', image: '/public/assets/images/content/anime3.jpg' },
    { id: 36, title: 'Hunter x Hunter', year: '2011', duration: '24min', category: 'Aventure', type: 'anime', image: '/public/assets/images/content/anime4.jpg' },
    { id: 37, title: 'Steins;Gate', year: '2011', duration: '24min', category: 'Sci-Fi', type: 'anime', image: '/public/assets/images/content/anime5.jpg' },
    { id: 38, title: 'Your Name', year: '2016', duration: '1h46', category: 'Romance', type: 'anime', image: '/public/assets/images/content/anime6.jpg' },
    { id: 39, title: 'Violet Evergarden', year: '2018', duration: '24min', category: 'Drame', type: 'anime', image: '/public/assets/images/content/anime7.jpg' },
    { id: 40, title: 'Demon Slayer: Mugen Train', year: '2020', duration: '1h57', category: 'Action', type: 'anime', image: '/public/assets/images/content/anime8.jpg' }
  ];
}

function getBollywoodItems() {
  return [
    { id: 41, title: '3 Idiots', year: '2009', duration: '2h50', category: 'Comédie', type: 'bollywood', image: '/public/assets/images/content/bollywood1.jpg' },
    { id: 42, title: 'Dangal', year: '2016', duration: '2h41', category: 'Sport', type: 'bollywood', image: '/public/assets/images/content/bollywood2.jpg' },
    { id: 43, title: 'PK', year: '2014', duration: '2h33', category: 'Comédie', type: 'bollywood', image: '/public/assets/images/content/bollywood3.jpg' },
    { id: 44, title: 'Bajrangi Bhaijaan', year: '2015', duration: '2h43', category: 'Drame', type: 'bollywood', image: '/public/assets/images/content/bollywood4.jpg' },
    { id: 45, title: 'Lagaan', year: '2001', duration: '3h44', category: 'Sport', type: 'bollywood', image: '/public/assets/images/content/bollywood5.jpg' },
    { id: 46, title: 'Kabhi Khushi Kabhie Gham', year: '2001', duration: '3h30', category: 'Drame', type: 'bollywood', image: '/public/assets/images/content/bollywood6.jpg' },
    { id: 47, title: 'Dilwale Dulhania Le Jayenge', year: '1995', duration: '3h10', category: 'Romance', type: 'bollywood', image: '/public/assets/images/content/bollywood7.jpg' },
    { id: 48, title: 'Kuch Kuch Hota Hai', year: '1998', duration: '3h05', category: 'Romance', type: 'bollywood', image: '/public/assets/images/content/bollywood8.jpg' }
  ];
}

function getContinueWatchingItems() {
  return [
    { id: 49, title: 'Crash Landing on You', year: '2019', duration: 'Épisode 7', category: 'Drama', type: 'drama', image: '/public/assets/images/content/continue1.jpg', progress: 45 },
    { id: 50, title: 'Squid Game', year: '2021', duration: 'Épisode 3', category: 'Thriller', type: 'drama', image: '/public/assets/images/content/continue2.jpg', progress: 75 },
    { id: 51, title: 'Demon Slayer', year: '2020', duration: 'Épisode 12', category: 'Anime', type: 'anime', image: '/public/assets/images/content/continue3.jpg', progress: 30 },
    { id: 52, title: 'Parasite', year: '2019', duration: '1h05 restante', category: 'Thriller', type: 'movie', image: '/public/assets/images/content/continue4.jpg', progress: 50 }
  ];
}

function getMyListItems() {
  return [
    { id: 53, title: 'Kingdom', year: '2019', duration: '2 saisons', category: 'Historique', type: 'drama', image: '/public/assets/images/content/mylist1.jpg' },
    { id: 54, title: 'Your Name', year: '2016', duration: '1h46', category: 'Romance', type: 'anime', image: '/public/assets/images/content/mylist2.jpg' },
    { id: 55, title: 'Parasite', year: '2019', duration: '2h12', category: 'Thriller', type: 'movie', image: '/public/assets/images/content/mylist3.jpg' },
    { id: 56, title: 'Dangal', year: '2016', duration: '2h41', category: 'Sport', type: 'bollywood', image: '/public/assets/images/content/mylist4.jpg' }
  ];
}
`;
