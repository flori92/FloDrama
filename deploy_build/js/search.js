/**
 * FloDrama - Module de recherche
 * 
 * Ce module gère la fonctionnalité de recherche sur l'ensemble du site FloDrama.
 * Il permet de rechercher des dramas, films et animés par titre, acteur, genre, etc.
 */

// Base de données simulée pour la démo
const contentDatabase = [
  { 
    id: 1, 
    title: "Crash Landing on You", 
    type: "drama", 
    year: 2019, 
    genres: ["Romance", "Comédie"], 
    actors: ["Hyun Bin", "Son Ye-jin"],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente."
  },
  { 
    id: 2, 
    title: "Goblin", 
    type: "drama", 
    year: 2016, 
    genres: ["Fantastique", "Romance"], 
    actors: ["Gong Yoo", "Kim Go-eun"],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Un goblin immortel cherche une mariée humaine pour mettre fin à sa vie éternelle."
  },
  { 
    id: 3, 
    title: "Parasite", 
    type: "film", 
    year: 2019, 
    genres: ["Thriller", "Drame"], 
    actors: ["Song Kang-ho", "Lee Sun-kyun"],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Une famille pauvre s'immisce dans la vie d'une famille riche, avec des conséquences inattendues."
  },
  { 
    id: 4, 
    title: "Demon Slayer", 
    type: "anime", 
    year: 2019, 
    genres: ["Action", "Fantastique"], 
    actors: [],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Un jeune homme devient chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon."
  },
  { 
    id: 5, 
    title: "It's Okay to Not Be Okay", 
    type: "drama", 
    year: 2020, 
    genres: ["Romance", "Drame"], 
    actors: ["Kim Soo-hyun", "Seo Ye-ji"],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Un employé d'hôpital psychiatrique et une auteure de livres pour enfants guérissent mutuellement leurs blessures émotionnelles."
  },
  { 
    id: 6, 
    title: "Attack on Titan", 
    type: "anime", 
    year: 2013, 
    genres: ["Action", "Drame"], 
    actors: [],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Dans un monde où l'humanité vit entourée de murs pour se protéger des Titans, un jeune homme jure de se venger après une attaque dévastatrice."
  },
  { 
    id: 7, 
    title: "Train to Busan", 
    type: "film", 
    year: 2016, 
    genres: ["Horreur", "Action"], 
    actors: ["Gong Yoo", "Ma Dong-seok"],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Un père et sa fille se retrouvent piégés dans un train lors d'une apocalypse zombie en Corée du Sud."
  },
  { 
    id: 8, 
    title: "Reply 1988", 
    type: "drama", 
    year: 2015, 
    genres: ["Comédie", "Drame"], 
    actors: ["Lee Hye-ri", "Park Bo-gum"],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Cinq familles vivant dans le même quartier de Séoul en 1988 partagent leurs joies et leurs peines."
  },
  { 
    id: 9, 
    title: "Your Name", 
    type: "anime", 
    year: 2016, 
    genres: ["Romance", "Fantastique"], 
    actors: [],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Deux adolescents se retrouvent mystérieusement liés l'un à l'autre en échangeant leurs corps."
  },
  { 
    id: 10, 
    title: "Vincenzo", 
    type: "drama", 
    year: 2021, 
    genres: ["Action", "Comédie"], 
    actors: ["Song Joong-ki", "Jeon Yeo-been"],
    image: "/public/assets/static/placeholders/logo-placeholder.svg",
    description: "Un avocat italo-coréen de la mafia retourne en Corée et utilise ses compétences pour combattre de puissantes entreprises."
  }
];

class SearchModule {
  constructor() {
    this.searchOverlay = null;
    this.searchInput = null;
    this.searchResults = null;
    this.closeButton = null;
    this.searchForm = null;
    this.filterButtons = null;
    this.activeFilter = 'all';
    
    this.init();
  }
  
  init() {
    // Créer l'overlay de recherche
    this.createSearchOverlay();
    
    // Ajouter les écouteurs d'événements
    this.addEventListeners();
  }
  
  createSearchOverlay() {
    // Créer l'élément overlay s'il n'existe pas déjà
    if (!document.getElementById('searchOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'searchOverlay';
      overlay.className = 'search-overlay';
      
      overlay.innerHTML = `
        <div class="search-container">
          <div class="search-header">
            <h2>Rechercher sur FloDrama</h2>
            <button class="search-close" id="searchClose">×</button>
          </div>
          <form class="search-form" id="searchForm">
            <div class="search-input-container">
              <input type="text" id="searchInput" class="search-input" placeholder="Titre, acteur, genre..." autocomplete="off">
              <button type="submit" class="search-submit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </form>
          <div class="search-filters">
            <button class="filter-button active" data-filter="all">Tous</button>
            <button class="filter-button" data-filter="drama">Dramas</button>
            <button class="filter-button" data-filter="film">Films</button>
            <button class="filter-button" data-filter="anime">Animés</button>
          </div>
          <div class="search-results" id="searchResults">
            <div class="search-placeholder">
              <p>Commencez à taper pour rechercher...</p>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Ajouter les styles CSS nécessaires
      this.addSearchStyles();
    }
    
    // Récupérer les éléments
    this.searchOverlay = document.getElementById('searchOverlay');
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');
    this.closeButton = document.getElementById('searchClose');
    this.searchForm = document.getElementById('searchForm');
    this.filterButtons = document.querySelectorAll('.filter-button');
  }
  
  addSearchStyles() {
    // Vérifier si les styles existent déjà
    if (!document.getElementById('searchStyles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'searchStyles';
      
      styleElement.textContent = `
        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(18, 17, 24, 0.97);
          z-index: 1100;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 80px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          overflow-y: auto;
        }
        
        .search-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        
        .search-container {
          width: 100%;
          max-width: 800px;
          padding: 0 20px;
        }
        
        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          color: white;
        }
        
        .search-header h2 {
          font-size: 24px;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .search-close {
          background: none;
          border: none;
          color: white;
          font-size: 32px;
          cursor: pointer;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        
        .search-close:hover {
          opacity: 1;
          color: #d946ef;
        }
        
        .search-form {
          margin-bottom: 20px;
        }
        
        .search-input-container {
          position: relative;
          display: flex;
        }
        
        .search-input {
          width: 100%;
          padding: 15px 50px 15px 20px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 30px;
          color: white;
          font-size: 18px;
          transition: all 0.3s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #d946ef;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .search-submit {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
        }
        
        .search-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .filter-button {
          padding: 8px 16px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .filter-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .filter-button.active {
          background: linear-gradient(to right, #3b82f6, #d946ef);
          border-color: transparent;
        }
        
        .search-results {
          color: white;
          min-height: 200px;
        }
        
        .search-placeholder {
          text-align: center;
          padding: 40px 0;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .search-no-results {
          text-align: center;
          padding: 40px 0;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
          padding-bottom: 40px;
        }
        
        .result-card {
          background-color: rgba(26, 25, 38, 0.8);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .result-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .result-poster {
          width: 100%;
          aspect-ratio: 2/3;
          background: linear-gradient(to top, #3b82f6, #d946ef);
          position: relative;
        }
        
        .result-type {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          background-color: rgba(0, 0, 0, 0.7);
          border-radius: 4px;
          font-size: 12px;
        }
        
        .result-info {
          padding: 10px;
        }
        
        .result-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .result-meta {
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 8px;
        }
        
        .result-description {
          font-size: 12px;
          opacity: 0.8;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        @media (max-width: 768px) {
          .search-container {
            padding: 0 15px;
          }
          
          .search-header h2 {
            font-size: 20px;
          }
          
          .search-input {
            padding: 12px 45px 12px 15px;
            font-size: 16px;
          }
          
          .result-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `;
      
      document.head.appendChild(styleElement);
    }
  }
  
  addEventListeners() {
    // Ouvrir la recherche lorsqu'on clique sur le bouton de recherche
    const searchButtons = document.querySelectorAll('.search-button');
    searchButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSearch();
      });
    });
    
    // Fermer la recherche
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.closeSearch();
      });
    }
    
    // Fermer la recherche avec la touche Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.searchOverlay.classList.contains('active')) {
        this.closeSearch();
      }
    });
    
    // Soumettre le formulaire de recherche
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.performSearch();
      });
    }
    
    // Recherche en temps réel lors de la saisie
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.performSearch();
      });
    }
    
    // Filtres
    if (this.filterButtons) {
      this.filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.activeFilter = button.dataset.filter;
          
          // Mettre à jour l'état actif des boutons
          this.filterButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          // Relancer la recherche avec le nouveau filtre
          this.performSearch();
        });
      });
    }
  }
  
  openSearch() {
    if (this.searchOverlay) {
      this.searchOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus sur le champ de recherche
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.focus();
        }
      }, 100);
    }
  }
  
  closeSearch() {
    if (this.searchOverlay) {
      this.searchOverlay.classList.remove('active');
      document.body.style.overflow = '';
      
      // Réinitialiser la recherche
      if (this.searchInput) {
        this.searchInput.value = '';
      }
      
      // Réinitialiser les résultats
      this.resetResults();
    }
  }
  
  resetResults() {
    if (this.searchResults) {
      this.searchResults.innerHTML = `
        <div class="search-placeholder">
          <p>Commencez à taper pour rechercher...</p>
        </div>
      `;
    }
  }
  
  performSearch() {
    const query = this.searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
      this.resetResults();
      return;
    }
    
    // Filtrer les résultats
    let results = contentDatabase.filter(item => {
      // Filtrer par type si un filtre est actif
      if (this.activeFilter !== 'all' && item.type !== this.activeFilter) {
        return false;
      }
      
      // Rechercher dans le titre
      if (item.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Rechercher dans les genres
      if (item.genres.some(genre => genre.toLowerCase().includes(query))) {
        return true;
      }
      
      // Rechercher dans les acteurs
      if (item.actors.some(actor => actor.toLowerCase().includes(query))) {
        return true;
      }
      
      // Rechercher dans l'année
      if (item.year.toString().includes(query)) {
        return true;
      }
      
      return false;
    });
    
    this.displayResults(results);
  }
  
  displayResults(results) {
    if (!this.searchResults) return;
    
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="search-no-results">
          <p>Aucun résultat trouvé pour votre recherche.</p>
        </div>
      `;
      return;
    }
    
    let html = '<div class="result-grid">';
    
    results.forEach(item => {
      const typeLabel = {
        'drama': 'Drama',
        'film': 'Film',
        'anime': 'Animé'
      }[item.type];
      
      html += `
        <div class="result-card">
          <div class="result-poster">
            <div class="result-type">${typeLabel}</div>
          </div>
          <div class="result-info">
            <h3 class="result-title">${item.title}</h3>
            <p class="result-meta">${item.year} • ${item.genres.join(', ')}</p>
            <p class="result-description">${item.description}</p>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    this.searchResults.innerHTML = html;
  }
}

// Initialiser le module de recherche lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  window.searchModule = new SearchModule();
});
