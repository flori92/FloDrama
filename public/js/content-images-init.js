/**
 * Script d'initialisation des images de contenu pour FloDrama
 * Ce fichier assure que toutes les cartes de contenu sont correctement initialisées
 * avec les attributs nécessaires pour le chargement des images et des données réelles.
 */

// Données de contenu intégrées directement dans le script pour éviter les problèmes de chargement
const CONTENT_DATA = {
  "items": [
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
    }
  ]
};

// Déterminer la catégorie de contenu en fonction de l'URL
function getContentCategory() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('dramas') || path.includes('drama')) {
    return 'drama';
  } else if (path.includes('films') || path.includes('film') || path.includes('movie')) {
    return 'movie';
  } else if (path.includes('animes') || path.includes('anime')) {
    return 'anime';
  }
  
  // Par défaut, retourner un mix de contenu
  return 'mix';
}

// Filtrer les données de contenu en fonction de la catégorie
function filterContentByCategory(metadata, category, limit = 10) {
  if (!metadata || !metadata.items || !Array.isArray(metadata.items)) {
    console.warn('Métadonnées invalides');
    return [];
  }
  
  let filteredItems = [];
  
  if (category === 'mix') {
    // Prendre un mix de différentes catégories
    const dramas = metadata.items.filter(item => item.category === 'drama').slice(0, 4);
    const movies = metadata.items.filter(item => item.category === 'movie').slice(0, 3);
    const animes = metadata.items.filter(item => item.category === 'anime').slice(0, 3);
    
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
  
  contentCards.forEach((card, index) => {
    if (index < contentData.length) {
      const data = contentData[index];
      
      // Mettre à jour l'ID de contenu pour les images
      const poster = card.querySelector('.card-poster');
      if (poster) {
        const img = poster.querySelector('img') || poster;
        img.setAttribute('data-content-id', data.id);
        img.setAttribute('data-type', 'poster');
        
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
      }
    }
  });
  
  console.log(`${Math.min(contentCards.length, contentData.length)} cartes de contenu mises à jour avec des données réelles`);
}
