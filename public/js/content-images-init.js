/**
 * Script d'initialisation des images de contenu pour FloDrama
 * Ce fichier assure que toutes les cartes de contenu sont correctement initialisées
 * avec les attributs nécessaires pour le chargement des images et des données fictives.
 */

// Catalogue de contenu fictif pour démonstration
const MOCK_CONTENT = {
  dramas: [
    { id: 'drama001', title: 'Crash Landing on You', year: '2019', genres: ['Romance', 'Comédie'], origin: 'Corée' },
    { id: 'drama002', title: 'It\'s Okay to Not Be Okay', year: '2020', genres: ['Romance', 'Drame'], origin: 'Corée' },
    { id: 'drama003', title: 'Reply 1988', year: '2015', genres: ['Comédie', 'Drame'], origin: 'Corée' },
    { id: 'drama004', title: 'Queen of Tears', year: '2024', genres: ['Romance', 'Drame'], origin: 'Corée' },
    { id: 'drama005', title: 'Moving', year: '2023', genres: ['Action', 'Fantastique'], origin: 'Corée' },
    { id: 'drama006', title: 'My Mister', year: '2018', genres: ['Drame'], origin: 'Corée' },
    { id: 'drama007', title: 'Goblin', year: '2016', genres: ['Romance', 'Fantastique'], origin: 'Corée' },
    { id: 'drama008', title: 'Hospital Playlist', year: '2020', genres: ['Comédie', 'Médical'], origin: 'Corée' },
    { id: 'drama009', title: 'Extraordinary Attorney Woo', year: '2022', genres: ['Drame', 'Juridique'], origin: 'Corée' },
    { id: 'drama010', title: 'Squid Game', year: '2021', genres: ['Thriller', 'Drame'], origin: 'Corée' }
  ],
  films: [
    { id: 'film001', title: 'Parasite', year: '2019', genres: ['Thriller', 'Drame'], origin: 'Corée' },
    { id: 'film002', title: '3 Idiots', year: '2009', genres: ['Comédie', 'Drame'], origin: 'Inde' },
    { id: 'film003', title: 'Train to Busan', year: '2016', genres: ['Horreur', 'Action'], origin: 'Corée' },
    { id: 'film004', title: 'Your Name', year: '2016', genres: ['Animation', 'Romance'], origin: 'Japon' },
    { id: 'film005', title: 'The Handmaiden', year: '2016', genres: ['Drame', 'Thriller'], origin: 'Corée' },
    { id: 'film006', title: 'Dangal', year: '2016', genres: ['Sport', 'Biographie'], origin: 'Inde' },
    { id: 'film007', title: 'Oldboy', year: '2003', genres: ['Action', 'Drame'], origin: 'Corée' },
    { id: 'film008', title: 'PK', year: '2014', genres: ['Comédie', 'Science-Fiction'], origin: 'Inde' },
    { id: 'film009', title: 'Shoplifters', year: '2018', genres: ['Drame'], origin: 'Japon' },
    { id: 'film010', title: 'Demon Slayer: Mugen Train', year: '2020', genres: ['Animation', 'Action'], origin: 'Japon' }
  ],
  animes: [
    { id: 'anime001', title: 'Demon Slayer', year: '2019', genres: ['Action', 'Fantaisie'], origin: 'Japon' },
    { id: 'anime002', title: 'Attack on Titan', year: '2013', genres: ['Action', 'Drame'], origin: 'Japon' },
    { id: 'anime003', title: 'My Hero Academia', year: '2016', genres: ['Action', 'Super-héros'], origin: 'Japon' },
    { id: 'anime004', title: 'Jujutsu Kaisen', year: '2020', genres: ['Action', 'Surnaturel'], origin: 'Japon' },
    { id: 'anime005', title: 'Spy x Family', year: '2022', genres: ['Comédie', 'Action'], origin: 'Japon' },
    { id: 'anime006', title: 'One Piece', year: '1999', genres: ['Aventure', 'Action'], origin: 'Japon' },
    { id: 'anime007', title: 'Naruto', year: '2002', genres: ['Action', 'Aventure'], origin: 'Japon' },
    { id: 'anime008', title: 'Death Note', year: '2006', genres: ['Thriller', 'Surnaturel'], origin: 'Japon' },
    { id: 'anime009', title: 'Fullmetal Alchemist: Brotherhood', year: '2009', genres: ['Action', 'Aventure'], origin: 'Japon' },
    { id: 'anime010', title: 'Vinland Saga', year: '2019', genres: ['Action', 'Historique'], origin: 'Japon' }
  ]
};

// Déterminer la catégorie de contenu en fonction de l'URL
function getContentCategory() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('dramas') || path.includes('drama')) {
    return 'dramas';
  } else if (path.includes('films') || path.includes('film') || path.includes('movie')) {
    return 'films';
  } else if (path.includes('animes') || path.includes('anime')) {
    return 'animes';
  }
  
  // Par défaut, retourner un mix de contenu
  return 'mix';
}

// Obtenir des données de contenu en fonction de la catégorie
function getContentData(category, limit = 10) {
  if (category === 'mix') {
    // Mélanger du contenu de toutes les catégories
    const allContent = [
      ...MOCK_CONTENT.dramas.slice(0, 3),
      ...MOCK_CONTENT.films.slice(0, 4),
      ...MOCK_CONTENT.animes.slice(0, 3)
    ];
    return allContent.slice(0, limit);
  }
  
  return MOCK_CONTENT[category] ? MOCK_CONTENT[category].slice(0, limit) : [];
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initialisation des images de contenu FloDrama...');
  
  // Initialiser les cartes de contenu si le système d'images est chargé
  if (window.FloDramaImageSystem && typeof window.FloDramaImageSystem.initContentCards === 'function') {
    // Attendre un court instant pour s'assurer que le DOM est complètement chargé
    setTimeout(() => {
      // Déterminer la catégorie de contenu
      const category = getContentCategory();
      console.log(`Catégorie de contenu détectée: ${category}`);
      
      // Obtenir les données de contenu
      const contentData = getContentData(category);
      console.log(`${contentData.length} éléments de contenu chargés`);
      
      // Initialiser les cartes de contenu
      window.FloDramaImageSystem.initContentCards();
      
      // Mettre à jour les titres et informations des cartes
      updateContentCards(contentData);
    }, 100);
  } else {
    console.warn('Le système d\'images FloDrama n\'est pas chargé. Les images de contenu ne seront pas initialisées.');
  }
});

// Mettre à jour les cartes de contenu avec les données fictives
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
      metaElement.textContent = `${data.year} • ${data.genres.join(', ')}`;
      
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
  
  console.log(`${Math.min(contentCards.length, contentData.length)} cartes de contenu mises à jour avec des données`);
}
