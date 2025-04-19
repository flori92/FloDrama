// Composant de recherche pour FloDrama
// Implémente l'interface utilisateur pour la recherche de contenu

export class SearchComponent {
  constructor(searchService, contentDataService) {
    this.searchService = searchService;
    this.contentDataService = contentDataService;
    this.searchResults = [];
    this.suggestions = [];
    this.isSearchActive = false;
    this.searchQuery = '';
    this.filters = {
      type: 'all',
      category: 'all',
      year: ''
    };
    console.log('SearchComponent initialisé');
  }

  // Rendre le composant de recherche
  render(container) {
    // Créer le conteneur de recherche
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style = `
      position: relative;
      width: 100%;
      max-width: 300px;
    `;

    // Créer le champ de recherche
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Rechercher...';
    searchInput.className = 'search-input';
    searchInput.style = `
      width: 100%;
      padding: 0.5rem 2.5rem 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    `;

    // Créer l'icône de recherche
    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = '🔍';
    searchIcon.style = `
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
    `;

    // Créer le conteneur de suggestions
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style = `
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background-color: #1A1926;
      border-radius: 0 0 10px 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      z-index: 100;
      display: none;
      overflow: hidden;
    `;

    // Créer le conteneur de résultats
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results';
    resultsContainer.style = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(18, 17, 24, 0.95);
      z-index: 1000;
      display: none;
      flex-direction: column;
      padding: 2rem;
      overflow-y: auto;
    `;

    // Créer l'en-tête des résultats
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'results-header';
    resultsHeader.style = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    `;

    // Titre des résultats
    const resultsTitle = document.createElement('h2');
    resultsTitle.className = 'results-title';
    resultsTitle.style = `
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    `;
    resultsTitle.textContent = 'Résultats de recherche';

    // Bouton de fermeture
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '✕';
    closeButton.style = `
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    `;

    // Conteneur des filtres
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'filters-container';
    filtersContainer.style = `
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    `;

    // Filtre de type
    const typeFilter = this.createFilter('Type', ['all', 'drama', 'film', 'anime', 'bollywood']);
    
    // Filtre de catégorie
    const categoryFilter = this.createFilter('Catégorie', ['all', 'action', 'comédie', 'drame', 'romance', 'thriller']);

    // Conteneur des résultats de recherche
    const searchResultsGrid = document.createElement('div');
    searchResultsGrid.className = 'search-results-grid';
    searchResultsGrid.style = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    `;

    // Message de résultats vides
    const emptyResults = document.createElement('div');
    emptyResults.className = 'empty-results';
    emptyResults.style = `
      text-align: center;
      padding: 3rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.1rem;
      display: none;
    `;
    emptyResults.textContent = 'Aucun résultat trouvé pour votre recherche.';

    // Assembler les composants
    resultsHeader.appendChild(resultsTitle);
    resultsHeader.appendChild(closeButton);

    filtersContainer.appendChild(typeFilter);
    filtersContainer.appendChild(categoryFilter);

    resultsContainer.appendChild(resultsHeader);
    resultsContainer.appendChild(filtersContainer);
    resultsContainer.appendChild(searchResultsGrid);
    resultsContainer.appendChild(emptyResults);

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(suggestionsContainer);

    // Ajouter les gestionnaires d'événements
    searchInput.addEventListener('input', () => this.handleSearchInput(searchInput, suggestionsContainer));
    searchInput.addEventListener('focus', () => this.handleSearchFocus(searchInput, suggestionsContainer));
    searchInput.addEventListener('blur', () => setTimeout(() => this.handleSearchBlur(suggestionsContainer), 200));
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch(searchInput.value, resultsContainer, searchResultsGrid, emptyResults, resultsTitle);
      }
    });

    searchIcon.addEventListener('click', () => {
      this.handleSearch(searchInput.value, resultsContainer, searchResultsGrid, emptyResults, resultsTitle);
    });

    closeButton.addEventListener('click', () => {
      this.closeSearch(resultsContainer);
    });

    // Ajouter à la page
    container.appendChild(searchContainer);
    document.body.appendChild(resultsContainer);

    return searchContainer;
  }

  // Créer un filtre
  createFilter(label, options) {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.style = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    const filterLabel = document.createElement('label');
    filterLabel.textContent = label + ':';
    filterLabel.style = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    `;

    const filterSelect = document.createElement('select');
    filterSelect.className = 'filter-select';
    filterSelect.style = `
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: white;
      padding: 0.3rem 0.5rem;
      font-size: 0.9rem;
    `;

    // Ajouter les options
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option === 'all' ? 'Tous' : option.charAt(0).toUpperCase() + option.slice(1);
      filterSelect.appendChild(optionElement);
    });

    // Ajouter l'événement de changement
    filterSelect.addEventListener('change', () => {
      if (label === 'Type') {
        this.filters.type = filterSelect.value;
      } else if (label === 'Catégorie') {
        this.filters.category = filterSelect.value;
      }

      // Mettre à jour les résultats si la recherche est active
      if (this.isSearchActive) {
        this.updateSearchResults();
      }
    });

    filterContainer.appendChild(filterLabel);
    filterContainer.appendChild(filterSelect);

    return filterContainer;
  }

  // Gérer l'entrée de recherche
  handleSearchInput(searchInput, suggestionsContainer) {
    const query = searchInput.value.trim();
    this.searchQuery = query;

    if (query.length >= 2) {
      // Obtenir des suggestions
      this.suggestions = this.searchService.getSuggestions(query);
      this.renderSuggestions(suggestionsContainer);
      suggestionsContainer.style.display = 'block';
    } else {
      suggestionsContainer.style.display = 'none';
    }
  }

  // Gérer le focus sur le champ de recherche
  handleSearchFocus(searchInput, suggestionsContainer) {
    searchInput.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    searchInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';

    // Afficher les suggestions si la requête est assez longue
    if (this.searchQuery.length >= 2) {
      this.renderSuggestions(suggestionsContainer);
      suggestionsContainer.style.display = 'block';
    }
  }

  // Gérer la perte de focus sur le champ de recherche
  handleSearchBlur(suggestionsContainer) {
    suggestionsContainer.style.display = 'none';
  }

  // Gérer la recherche
  handleSearch(query, resultsContainer, resultsGrid, emptyResults, resultsTitle) {
    if (!query || query.trim() === '') return;

    this.searchQuery = query.trim();
    this.isSearchActive = true;

    // Effectuer la recherche
    this.searchResults = this.searchService.search(this.searchQuery, this.filters);

    // Mettre à jour le titre
    resultsTitle.textContent = `Résultats pour "${this.searchQuery}"`;

    // Rendre les résultats
    this.renderSearchResults(resultsGrid, emptyResults);

    // Afficher le conteneur de résultats
    resultsContainer.style.display = 'flex';
  }

  // Mettre à jour les résultats de recherche
  updateSearchResults() {
    // Effectuer la recherche avec les filtres mis à jour
    this.searchResults = this.searchService.search(this.searchQuery, this.filters);

    // Trouver le conteneur de résultats et le message vide
    const resultsGrid = document.querySelector('.search-results-grid');
    const emptyResults = document.querySelector('.empty-results');

    // Rendre les résultats mis à jour
    if (resultsGrid && emptyResults) {
      this.renderSearchResults(resultsGrid, emptyResults);
    }
  }

  // Rendre les suggestions
  renderSuggestions(container) {
    container.innerHTML = '';

    if (this.suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    this.suggestions.forEach(suggestion => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.textContent = suggestion;
      suggestionItem.style = `
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
      `;

      suggestionItem.addEventListener('mouseover', () => {
        suggestionItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });

      suggestionItem.addEventListener('mouseout', () => {
        suggestionItem.style.backgroundColor = 'transparent';
      });

      suggestionItem.addEventListener('click', () => {
        // Mettre à jour le champ de recherche
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.value = suggestion;
          this.searchQuery = suggestion;
        }

        // Effectuer la recherche
        const resultsContainer = document.querySelector('.search-results');
        const resultsGrid = document.querySelector('.search-results-grid');
        const emptyResults = document.querySelector('.empty-results');
        const resultsTitle = document.querySelector('.results-title');

        if (resultsContainer && resultsGrid && emptyResults && resultsTitle) {
          this.handleSearch(suggestion, resultsContainer, resultsGrid, emptyResults, resultsTitle);
        }

        // Cacher les suggestions
        container.style.display = 'none';
      });

      container.appendChild(suggestionItem);
    });
  }

  // Rendre les résultats de recherche
  renderSearchResults(container, emptyMessage) {
    container.innerHTML = '';

    if (this.searchResults.length === 0) {
      emptyMessage.style.display = 'block';
      return;
    }

    emptyMessage.style.display = 'none';

    this.searchResults.forEach(result => {
      const resultCard = this.createResultCard(result);
      container.appendChild(resultCard);
    });
  }

  // Créer une carte de résultat
  createResultCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style = `
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
      background-color: #1A1926;
    `;

    // Image
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image-container';
    imageContainer.style = `
      position: relative;
      width: 100%;
      height: 300px;
      overflow: hidden;
    `;

    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title;
    image.style = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    `;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.style = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 1rem;
      background: linear-gradient(to top, rgba(26, 25, 38, 1), rgba(26, 25, 38, 0));
    `;

    // Titre
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;
    title.style = `
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
    `;

    // Infos
    const info = document.createElement('div');
    info.className = 'card-info';
    info.style = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    `;

    // Année
    const year = document.createElement('span');
    year.textContent = item.year;

    // Séparateur
    const separator = document.createElement('span');
    separator.textContent = '•';

    // Catégorie
    const category = document.createElement('span');
    category.textContent = item.category;

    // Assembler les infos
    info.appendChild(year);
    info.appendChild(separator);
    info.appendChild(category);

    // Assembler l'overlay
    overlay.appendChild(title);
    overlay.appendChild(info);

    // Assembler la carte
    imageContainer.appendChild(image);
    imageContainer.appendChild(overlay);
    card.appendChild(imageContainer);

    // Ajouter les événements
    card.addEventListener('mouseover', () => {
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
      image.style.transform = 'scale(1.1)';
    });

    card.addEventListener('mouseout', () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
      image.style.transform = 'scale(1)';
    });

    card.addEventListener('click', () => {
      // Simuler l'ouverture de la page de détails
      alert(`Ouverture des détails pour: ${item.title}`);
    });

    return card;
  }

  // Fermer la recherche
  closeSearch(resultsContainer) {
    resultsContainer.style.display = 'none';
    this.isSearchActive = false;
  }
}
