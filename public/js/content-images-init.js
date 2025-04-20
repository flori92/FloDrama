/**
 * Script d'initialisation des images de contenu pour FloDrama
 * Ce fichier assure que toutes les cartes de contenu sont correctement initialisées
 * avec les attributs nécessaires pour le chargement des images et des données réelles.
 */

// Données de contenu intégrées directement dans le script pour éviter les problèmes de chargement
const CONTENT_DATA = {
  "items": [
    // Dramas coréens
    {
      "id": "drama001",
      "title": "Crash Landing on You",
      "originalTitle": "사랑의 불시착",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2019,
      "rating": 9.2,
      "episodes": 16,
      "genres": ["Romance", "Comédie", "Drame"]
    },
    {
      "id": "drama002",
      "title": "Goblin",
      "originalTitle": "도깨비",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2016,
      "rating": 9.0,
      "episodes": 16,
      "genres": ["Fantastique", "Romance", "Drame"]
    },
    {
      "id": "drama003",
      "title": "Itaewon Class",
      "originalTitle": "이태원 클라쓰",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2020,
      "rating": 8.7,
      "episodes": 16,
      "genres": ["Drame", "Business"]
    },
    {
      "id": "drama004",
      "title": "Reply 1988",
      "originalTitle": "응답하라 1988",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2015,
      "rating": 9.4,
      "episodes": 20,
      "genres": ["Comédie", "Drame", "Nostalgie"]
    },
    {
      "id": "drama005",
      "title": "My Mister",
      "originalTitle": "나의 아저씨",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2018,
      "rating": 9.6,
      "episodes": 16,
      "genres": ["Drame", "Slice of Life"]
    },
    {
      "id": "drama006",
      "title": "Hospital Playlist",
      "originalTitle": "슬기로운 의사생활",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2020,
      "rating": 9.0,
      "episodes": 12,
      "genres": ["Médical", "Comédie", "Amitié"]
    },
    {
      "id": "drama007",
      "title": "Extraordinary Attorney Woo",
      "originalTitle": "이상한 변호사 우영우",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2022,
      "rating": 9.1,
      "episodes": 16,
      "genres": ["Juridique", "Drame", "Comédie"]
    },
    {
      "id": "drama008",
      "title": "Squid Game",
      "originalTitle": "오징어 게임",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2021,
      "rating": 8.9,
      "episodes": 9,
      "genres": ["Thriller", "Drame", "Survival"]
    },
    {
      "id": "drama009",
      "title": "Mr. Sunshine",
      "originalTitle": "미스터 션샤인",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2018,
      "rating": 9.2,
      "episodes": 24,
      "genres": ["Historique", "Romance", "Drame"]
    },
    {
      "id": "drama010",
      "title": "It's Okay to Not Be Okay",
      "originalTitle": "사이코지만 괜찮아",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2020,
      "rating": 8.8,
      "episodes": 16,
      "genres": ["Romance", "Drame", "Psychologique"]
    },
    {
      "id": "drama011",
      "title": "Vincenzo",
      "originalTitle": "빈센조",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2021,
      "rating": 9.0,
      "episodes": 20,
      "genres": ["Comédie", "Crime", "Drame"]
    },
    {
      "id": "drama012",
      "title": "Signal",
      "originalTitle": "시그널",
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2016,
      "rating": 9.3,
      "episodes": 16,
      "genres": ["Crime", "Thriller", "Fantastique"]
    },
    
    // Films asiatiques
    {
      "id": "movie001",
      "title": "Parasite",
      "originalTitle": "기생충",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2019,
      "rating": 9.5,
      "duration": 132,
      "genres": ["Thriller", "Drame", "Comédie noire"]
    },
    {
      "id": "movie002",
      "title": "Train to Busan",
      "originalTitle": "부산행",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2016,
      "rating": 8.6,
      "duration": 118,
      "genres": ["Horreur", "Action", "Thriller"]
    },
    {
      "id": "movie003",
      "title": "The Handmaiden",
      "originalTitle": "아가씨",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2016,
      "rating": 8.8,
      "duration": 145,
      "genres": ["Drame", "Thriller", "Romance"]
    },
    {
      "id": "movie004",
      "title": "Oldboy",
      "originalTitle": "올드보이",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2003,
      "rating": 8.4,
      "duration": 120,
      "genres": ["Thriller", "Drame", "Action"]
    },
    {
      "id": "movie005",
      "title": "Shoplifters",
      "originalTitle": "万引き家族",
      "type": "movie",
      "category": "movie",
      "country": "jp",
      "year": 2018,
      "rating": 8.1,
      "duration": 121,
      "genres": ["Drame", "Crime"]
    },
    {
      "id": "movie006",
      "title": "3 Idiots",
      "originalTitle": "3 इडियट्स",
      "type": "movie",
      "category": "movie",
      "country": "in",
      "year": 2009,
      "rating": 8.4,
      "duration": 170,
      "genres": ["Comédie", "Drame"]
    },
    {
      "id": "movie007",
      "title": "Burning",
      "originalTitle": "버닝",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2018,
      "rating": 7.5,
      "duration": 148,
      "genres": ["Mystère", "Drame", "Thriller"]
    },
    {
      "id": "movie008",
      "title": "A Taxi Driver",
      "originalTitle": "택시운전사",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2017,
      "rating": 8.0,
      "duration": 137,
      "genres": ["Drame", "Historique"]
    },
    {
      "id": "movie009",
      "title": "Dangal",
      "originalTitle": "दंगल",
      "type": "movie",
      "category": "movie",
      "country": "in",
      "year": 2016,
      "rating": 8.3,
      "duration": 161,
      "genres": ["Biographie", "Sport", "Drame"]
    },
    {
      "id": "movie010",
      "title": "I Saw the Devil",
      "originalTitle": "악마를 보았다",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2010,
      "rating": 7.8,
      "duration": 142,
      "genres": ["Thriller", "Action", "Horreur"]
    },
    {
      "id": "movie011",
      "title": "The Wailing",
      "originalTitle": "곡성",
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2016,
      "rating": 7.5,
      "duration": 156,
      "genres": ["Horreur", "Mystère", "Thriller"]
    },
    {
      "id": "movie012",
      "title": "PK",
      "originalTitle": "पीके",
      "type": "movie",
      "category": "movie",
      "country": "in",
      "year": 2014,
      "rating": 8.1,
      "duration": 153,
      "genres": ["Comédie", "Drame", "Science-Fiction"]
    },
    
    // Animes japonais
    {
      "id": "anime001",
      "title": "Your Name",
      "originalTitle": "君の名は",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2016,
      "rating": 9.3,
      "duration": 106,
      "genres": ["Animation", "Romance", "Fantastique"]
    },
    {
      "id": "anime002",
      "title": "Demon Slayer",
      "originalTitle": "鬼滅の刃",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2019,
      "rating": 9.0,
      "episodes": 26,
      "genres": ["Action", "Aventure", "Fantastique"]
    },
    {
      "id": "anime003",
      "title": "Attack on Titan",
      "originalTitle": "進撃の巨人",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2013,
      "rating": 9.1,
      "episodes": 75,
      "genres": ["Action", "Drame", "Fantastique"]
    },
    {
      "id": "anime004",
      "title": "Spirited Away",
      "originalTitle": "千と千尋の神隠し",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2001,
      "rating": 8.6,
      "duration": 125,
      "genres": ["Animation", "Aventure", "Fantastique"]
    },
    {
      "id": "anime005",
      "title": "My Hero Academia",
      "originalTitle": "僕のヒーローアカデミア",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2016,
      "rating": 8.4,
      "episodes": 88,
      "genres": ["Action", "Comédie", "Super-héros"]
    },
    {
      "id": "anime006",
      "title": "Jujutsu Kaisen",
      "originalTitle": "呪術廻戦",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2020,
      "rating": 8.7,
      "episodes": 24,
      "genres": ["Action", "Surnaturel", "Démons"]
    },
    {
      "id": "anime007",
      "title": "Spy x Family",
      "originalTitle": "スパイファミリー",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2022,
      "rating": 8.6,
      "episodes": 25,
      "genres": ["Action", "Comédie", "Espionnage"]
    },
    {
      "id": "anime008",
      "title": "Death Note",
      "originalTitle": "デスノート",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2006,
      "rating": 9.0,
      "episodes": 37,
      "genres": ["Thriller", "Surnaturel", "Psychologique"]
    },
    {
      "id": "anime009",
      "title": "One Piece",
      "originalTitle": "ワンピース",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 1999,
      "rating": 8.9,
      "episodes": 1000,
      "genres": ["Action", "Aventure", "Comédie"]
    },
    {
      "id": "anime010",
      "title": "Naruto",
      "originalTitle": "ナルト",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2002,
      "rating": 8.4,
      "episodes": 220,
      "genres": ["Action", "Aventure", "Fantastique"]
    },
    {
      "id": "anime011",
      "title": "Fullmetal Alchemist: Brotherhood",
      "originalTitle": "鋼の錬金術師 FULLMETAL ALCHEMIST",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2009,
      "rating": 9.1,
      "episodes": 64,
      "genres": ["Action", "Aventure", "Fantastique"]
    },
    {
      "id": "anime012",
      "title": "Violet Evergarden",
      "originalTitle": "ヴァイオレット・エヴァーガーデン",
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2018,
      "rating": 8.9,
      "episodes": 13,
      "genres": ["Drame", "Fantastique", "Tranche de vie"]
    }
  ]
};

// Générateur d'IDs pour les contenus supplémentaires
function generateContentId(category, index) {
  const paddedIndex = String(index).padStart(3, '0');
  return `${category}${paddedIndex}`;
}

// Générateur de données de contenu supplémentaires pour s'assurer qu'il y a assez de données
function generateAdditionalContent() {
  // Titres de dramas coréens populaires
  const dramaNames = [
    "The Glory", "Sweet Home", "Kingdom", "Descendants of the Sun", "Strong Girl Bong-soon", 
    "My Love from the Star", "Hometown Cha-Cha-Cha", "True Beauty", "Start-Up", "Business Proposal",
    "The King: Eternal Monarch", "Weightlifting Fairy Kim Bok-joo", "What's Wrong with Secretary Kim",
    "Healer", "While You Were Sleeping", "The Legend of the Blue Sea", "Flower of Evil", "Vagabond",
    "Memories of the Alhambra", "Mystic Pop-up Bar", "Hotel del Luna", "Move to Heaven", "Navillera"
  ];
  
  // Titres de films asiatiques populaires
  const movieNames = [
    "The Chaser", "Mother", "Joint Security Area", "Memories of Murder", "Thirst",
    "A Tale of Two Sisters", "Sympathy for Lady Vengeance", "New World", "The Host",
    "Silenced", "The Man from Nowhere", "The Good, the Bad, the Weird", "Snowpiercer",
    "Sunny", "The Villainess", "The Gangster, The Cop, The Devil", "Extreme Job",
    "Veteran", "The Thieves", "Assassination", "The Admiral: Roaring Currents"
  ];
  
  // Titres d'animes japonais populaires
  const animeNames = [
    "Hunter x Hunter", "Steins;Gate", "Cowboy Bebop", "Code Geass", "Monster",
    "Haikyuu!!", "Vinland Saga", "Made in Abyss", "Mushoku Tensei", "Re:Zero",
    "Mob Psycho 100", "Gintama", "Neon Genesis Evangelion", "Fruits Basket",
    "Demon Slayer: Mugen Train", "Your Lie in April", "Tokyo Ghoul", "Parasyte",
    "Black Clover", "Dr. Stone", "The Promised Neverland", "Erased", "Dororo"
  ];
  
  const additionalItems = [];
  
  // Générer des dramas supplémentaires
  for (let i = 13; i <= 36; i++) {
    const nameIndex = i - 13;
    const title = dramaNames[nameIndex % dramaNames.length];
    additionalItems.push({
      "id": generateContentId("drama", i),
      "title": title,
      "type": "drama",
      "category": "drama",
      "country": "kr",
      "year": 2015 + (i % 10),
      "rating": 7.5 + (Math.random() * 2),
      "episodes": 16,
      "genres": ["Drame", "Romance", "Comédie"].slice(0, 1 + (i % 3))
    });
  }
  
  // Générer des films supplémentaires
  for (let i = 13; i <= 36; i++) {
    const nameIndex = i - 13;
    const title = movieNames[nameIndex % movieNames.length];
    additionalItems.push({
      "id": generateContentId("movie", i),
      "title": title,
      "type": "movie",
      "category": "movie",
      "country": "kr",
      "year": 2010 + (i % 15),
      "rating": 7.0 + (Math.random() * 2.5),
      "duration": 100 + (i % 60),
      "genres": ["Thriller", "Action", "Drame", "Crime"].slice(0, 1 + (i % 3))
    });
  }
  
  // Générer des animes supplémentaires
  for (let i = 13; i <= 36; i++) {
    const nameIndex = i - 13;
    const title = animeNames[nameIndex % animeNames.length];
    additionalItems.push({
      "id": generateContentId("anime", i),
      "title": title,
      "type": "anime",
      "category": "anime",
      "country": "jp",
      "year": 2005 + (i % 18),
      "rating": 7.5 + (Math.random() * 2),
      "episodes": 12 + (i % 24),
      "genres": ["Action", "Aventure", "Fantastique", "Drame", "Comédie"].slice(0, 1 + (i % 4))
    });
  }
  
  return additionalItems;
}

// Ajouter des données supplémentaires
CONTENT_DATA.items = [...CONTENT_DATA.items, ...generateAdditionalContent()];

// Déterminer la catégorie de contenu en fonction de l'URL
function getContentCategory() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('dramas') || path.includes('drama')) {
    return 'drama';
  } else if (path.includes('films') || path.includes('film') || path.includes('movie')) {
    return 'movie';
  } else if (path.includes('animes') || path.includes('anime')) {
    return 'anime';
  } else if (path.includes('bollywood')) {
    return 'movie'; // Utiliser les films pour Bollywood en attendant une catégorie dédiée
  }
  
  // Par défaut, retourner un mix de contenu
  return 'mix';
}

// Filtrer les données de contenu en fonction de la catégorie
function filterContentByCategory(metadata, category, limit = 36) {
  if (!metadata || !metadata.items || !Array.isArray(metadata.items)) {
    console.warn('Métadonnées invalides');
    return [];
  }
  
  let filteredItems = [];
  
  if (category === 'mix') {
    // Prendre un mix de différentes catégories
    const dramas = metadata.items.filter(item => item.category === 'drama').slice(0, 12);
    const movies = metadata.items.filter(item => item.category === 'movie').slice(0, 12);
    const animes = metadata.items.filter(item => item.category === 'anime').slice(0, 12);
    
    filteredItems = [...dramas, ...movies, ...animes];
  } else {
    // Filtrer par catégorie spécifique
    filteredItems = metadata.items.filter(item => item.category === category);
  }
  
  // Limiter le nombre d'éléments
  return filteredItems.slice(0, limit);
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initialisation des images de contenu FloDrama avec données intégrées...');
  console.log(`Base de données de contenu: ${CONTENT_DATA.items.length} éléments disponibles`);
  
  // Initialiser les cartes de contenu si le système d'images est chargé
  if (window.FloDramaImageSystem && typeof window.FloDramaImageSystem.initContentCards === 'function') {
    try {
      // Déterminer la catégorie de contenu
      const category = getContentCategory();
      console.log(`Catégorie de contenu détectée: ${category}`);
      
      // Filtrer les données de contenu
      const contentData = filterContentByCategory(CONTENT_DATA, category);
      console.log(`${contentData.length} éléments de contenu chargés pour la catégorie ${category}`);
      
      // Initialiser les cartes de contenu
      window.FloDramaImageSystem.initContentCards();
      
      // Mettre à jour les titres et informations des cartes
      updateContentCards(contentData);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des images de contenu:', error);
    }
  } else {
    console.warn('Le système d\'images FloDrama n\'est pas chargé. Les images de contenu ne seront pas initialisées.');
  }
});

// Mettre à jour les cartes de contenu avec les données réelles
function updateContentCards(contentData) {
  const contentCards = document.querySelectorAll('.content-card');
  console.log(`Mise à jour de ${contentCards.length} cartes de contenu avec ${contentData.length} éléments de données`);
  
  contentCards.forEach((card, index) => {
    // Utiliser l'index modulo pour s'assurer que toutes les cartes ont des données
    const dataIndex = index % contentData.length;
    const data = contentData[dataIndex];
    
    // Mettre à jour l'ID de contenu pour les images
    const poster = card.querySelector('.card-poster');
    if (poster) {
      const img = poster.querySelector('img') || poster;
      img.setAttribute('data-content-id', data.id);
      img.setAttribute('data-type', 'poster');
      img.setAttribute('data-title', data.title);
      img.setAttribute('data-category', data.category);
      
      // Forcer le rechargement de l'image avec le nouvel ID
      if (window.FloDramaImageSystem) {
        const sources = window.FloDramaImageSystem.generateImageSources(data.id, 'poster');
        if (sources.length > 0) {
          img.src = sources[0];
        }
      }
    }
    
    // Ajouter ou mettre à jour le titre
    let titleElement = card.querySelector('.card-title');
    if (!titleElement) {
      titleElement = document.createElement('div');
      titleElement.className = 'card-title';
      card.appendChild(titleElement);
    }
    titleElement.textContent = data.title;
    
    // Ajouter ou mettre à jour les métadonnées (année, genres)
    let metaElement = card.querySelector('.card-meta');
    if (!metaElement) {
      metaElement = document.createElement('div');
      metaElement.className = 'card-meta';
      card.appendChild(metaElement);
    }
    
    // Formater les métadonnées
    const year = data.year || '';
    const genres = data.genres && Array.isArray(data.genres) ? data.genres.join(', ') : '';
    metaElement.textContent = `${year}${genres ? ' • ' + genres : ''}`;
    
    // Ajouter des styles CSS si nécessaire
    if (!card.classList.contains('card-styled')) {
      card.classList.add('card-styled');
      
      // Styles pour le titre
      titleElement.style.color = '#FFFFFF';
      titleElement.style.fontWeight = 'bold';
      titleElement.style.fontSize = '0.9rem';
      titleElement.style.margin = '8px 0 4px 0';
      titleElement.style.padding = '0 8px';
      
      // Styles pour les métadonnées
      metaElement.style.color = 'rgba(255, 255, 255, 0.7)';
      metaElement.style.fontSize = '0.8rem';
      metaElement.style.padding = '0 8px 8px 8px';
      
      // Ajouter un style de curseur pour indiquer que la carte est cliquable
      card.style.cursor = 'pointer';
    }
    
    // Stocker les données du contenu dans la carte pour y accéder lors du clic
    card.dataset.contentId = data.id;
    card.dataset.contentTitle = data.title;
    card.dataset.contentCategory = data.category;
    card.dataset.contentYear = data.year;
    
    // Ajouter un gestionnaire d'événement de clic pour la navigation
    card.onclick = function() {
      navigateToContentDetail(data);
    };
  });
  
  console.log(`${Math.min(contentCards.length, contentData.length)} cartes de contenu mises à jour avec des données réelles`);
}

/**
 * Navigue vers la page de détail du contenu
 * @param {Object} contentData - Données du contenu
 */
function navigateToContentDetail(contentData) {
  try {
    console.log(`Navigation vers la page de détail pour: ${contentData.title} (${contentData.id})`);
    
    // Construire l'URL de la page de détail
    let detailUrl;
    
    // Vérifier si nous sommes sur GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io') || 
                          window.location.hostname === 'flodrama.com';
    
    // Créer un slug à partir du titre
    const slug = contentData.title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    if (isGitHubPages) {
      // Sur GitHub Pages, utiliser des chemins relatifs
      detailUrl = `./content-detail.html?id=${contentData.id}&title=${encodeURIComponent(contentData.title)}&slug=${slug}`;
    } else {
      // En développement local ou autre environnement
      const baseUrl = window.location.pathname.includes('index.html') 
        ? window.location.pathname.replace('index.html', '')
        : window.location.pathname;
      
      detailUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}content-detail.html?id=${contentData.id}&title=${encodeURIComponent(contentData.title)}&slug=${slug}`;
    }
    
    // Sauvegarder les données du contenu dans sessionStorage pour y accéder sur la page de détail
    sessionStorage.setItem('currentContent', JSON.stringify(contentData));
    
    // Rediriger vers la page de détail
    window.location.href = detailUrl;
  } catch (error) {
    console.error(`Erreur lors de la navigation vers la page de détail: ${error.message}`);
    alert(`Impossible d'afficher les détails de ${contentData.title}. Veuillez réessayer.`);
  }
}
