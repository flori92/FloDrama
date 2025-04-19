/**
 * FloDrama - Script de gestion des cartes de contenu
 * Remplace les placeholders par de vraies cartes avec gradients et contenus
 */

document.addEventListener('DOMContentLoaded', function() {
  // Gradients pour les posters
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #FB7185 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
    'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
    'linear-gradient(135deg, #6366F1 0%, #10B981 100%)'
  ];
  
  // Données pour les cartes Tendances
  const trendingData = [
    { title: 'Crash Landing on You', year: '2019', genres: 'Romance, Comédie' },
    { title: 'Squid Game', year: '2021', genres: 'Thriller, Drame' },
    { title: 'Demon Slayer', year: '2019', genres: 'Action, Fantaisie' },
    { title: 'Vincenzo', year: '2021', genres: 'Crime, Comédie' },
    { title: 'My Name', year: '2021', genres: 'Action, Thriller' }
  ];
  
  // Données pour les cartes Dramas
  const dramaData = [
    { title: 'It\'s Okay to Not Be Okay', year: '2020', genres: 'Romance, Drame' },
    { title: 'Reply 1988', year: '2015', genres: 'Comédie, Drame' },
    { title: 'Queen of Tears', year: '2024', genres: 'Romance, Drame' },
    { title: 'Moving', year: '2023', genres: 'Action, Fantastique' },
    { title: 'My Mister', year: '2018', genres: 'Drame' }
  ];
  
  // Fonction pour appliquer un gradient à un élément
  function applyGradient(element, gradientIndex) {
    if (!element) return;
    
    // Obtenir un index aléatoire si non fourni
    const index = (gradientIndex !== undefined) ? gradientIndex % gradients.length : Math.floor(Math.random() * gradients.length);
    
    // Appliquer le gradient
    element.style.backgroundImage = gradients[index];
    element.style.height = '250px';
    element.style.borderRadius = '8px';
    element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  }
  
  // Fonction pour mettre à jour toutes les cartes d'une section
  function updateCards(sectionTitle, data) {
    // Trouver la section par son titre
    const sectionElement = Array.from(document.querySelectorAll('.section-title')).find(
      title => title.textContent.trim() === sectionTitle
    );
    
    if (!sectionElement) return;
    
    // Trouver le conteneur de cartes dans cette section
    const cardContainer = sectionElement.closest('.section').querySelector('.content-grid');
    
    if (!cardContainer) return;
    
    // Obtenir toutes les cartes dans ce conteneur
    const cards = cardContainer.querySelectorAll('.content-card');
    
    // Mettre à jour chaque carte
    cards.forEach((card, index) => {
      // Si nous avons des données pour cette carte
      if (data && data[index]) {
        const cardData = data[index];
        
        // Mettre à jour le poster
        const posterElement = card.querySelector('.card-poster');
        if (posterElement) {
          applyGradient(posterElement, index);
          
          // Ajouter un effet hover
          card.addEventListener('mouseenter', function() {
            posterElement.style.transform = 'scale(1.05)';
            posterElement.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
          });
          
          card.addEventListener('mouseleave', function() {
            posterElement.style.transform = 'scale(1)';
            posterElement.style.boxShadow = 'none';
          });
        }
        
        // Mettre à jour le titre et les métadonnées
        const titleElement = card.querySelector('.card-title');
        if (titleElement && cardData.title) {
          titleElement.textContent = cardData.title;
        }
        
        const metaElement = card.querySelector('.card-meta');
        if (metaElement && cardData.year && cardData.genres) {
          metaElement.textContent = `${cardData.year} • ${cardData.genres}`;
        }
      } else {
        // Fallback pour les cartes sans données
        const posterElement = card.querySelector('.card-poster');
        if (posterElement) {
          applyGradient(posterElement, index);
        }
      }
    });
  }
  
  // Mettre à jour toutes les sections
  updateCards('Tendances', trendingData);
  updateCards('Dramas Populaires', dramaData);
  
  console.log('FloDrama content cards initialized');
});
