// Service de recherche pour FloDrama
// Implémente un système de recherche avancé pour trouver du contenu

export class SearchService {
  constructor(contentDataService) {
    this.contentDataService = contentDataService;
    this.searchHistory = [];
    this.initializeSearchIndex();
    console.log('SearchService initialisé');
  }

  // Initialiser l'index de recherche
  async initializeSearchIndex() {
    try {
      // Récupérer tout le contenu disponible
      const allContent = await this.contentDataService.getAllContent();
      
      // Créer un index de recherche simple
      this.searchIndex = allContent.map(item => ({
        id: item.id,
        title: item.title.toLowerCase(),
        category: item.category.toLowerCase(),
        type: item.type.toLowerCase(),
        tags: (item.tags || []).map(tag => tag.toLowerCase()),
        year: item.year,
        searchableText: [
          item.title,
          item.category,
          item.type,
          ...(item.tags || []),
          item.year
        ].join(' ').toLowerCase()
      }));
      
      console.log(`Index de recherche créé avec ${this.searchIndex.length} éléments`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'index de recherche:', error);
      this.searchIndex = [];
    }
  }

  // Rechercher du contenu
  search(query, filters = {}) {
    if (!query || query.trim() === '') {
      return [];
    }
    
    // Enregistrer la recherche dans l'historique
    this.addToSearchHistory(query);
    
    // Normaliser la requête
    const normalizedQuery = query.toLowerCase().trim();
    
    // Effectuer la recherche
    let results = this.searchIndex.filter(item => {
      // Vérifier si la requête correspond au texte recherchable
      const matchesQuery = item.searchableText.includes(normalizedQuery);
      
      // Appliquer les filtres si présents
      let matchesFilters = true;
      
      if (filters.type && filters.type !== 'all') {
        matchesFilters = matchesFilters && item.type === filters.type.toLowerCase();
      }
      
      if (filters.category && filters.category !== 'all') {
        matchesFilters = matchesFilters && item.category === filters.category.toLowerCase();
      }
      
      if (filters.year) {
        matchesFilters = matchesFilters && item.year === filters.year;
      }
      
      return matchesQuery && matchesFilters;
    });
    
    // Trier les résultats par pertinence
    results = this.rankResults(results, normalizedQuery);
    
    console.log(`Recherche pour "${query}" : ${results.length} résultats trouvés`);
    return results;
  }

  // Classer les résultats par pertinence
  rankResults(results, query) {
    return results.map(item => {
      // Calculer un score de pertinence simple
      let relevanceScore = 0;
      
      // Titre exact = score élevé
      if (item.title === query) {
        relevanceScore += 10;
      }
      // Titre contient la requête = score moyen
      else if (item.title.includes(query)) {
        relevanceScore += 5;
      }
      
      // Correspondance de catégorie
      if (item.category.includes(query)) {
        relevanceScore += 3;
      }
      
      // Correspondance de tags
      if (item.tags.some(tag => tag.includes(query))) {
        relevanceScore += 2;
      }
      
      return {
        ...item,
        relevanceScore
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Ajouter une requête à l'historique de recherche
  addToSearchHistory(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Éviter les doublons
    if (!this.searchHistory.includes(normalizedQuery)) {
      this.searchHistory.unshift(normalizedQuery);
      
      // Limiter la taille de l'historique
      if (this.searchHistory.length > 10) {
        this.searchHistory.pop();
      }
    }
  }

  // Obtenir l'historique de recherche
  getSearchHistory() {
    return this.searchHistory;
  }

  // Obtenir des suggestions de recherche basées sur l'entrée partielle
  getSuggestions(partialQuery) {
    if (!partialQuery || partialQuery.trim() === '') {
      return [];
    }
    
    const normalizedQuery = partialQuery.toLowerCase().trim();
    
    // Rechercher dans l'index pour des suggestions
    const titleSuggestions = this.searchIndex
      .filter(item => item.title.includes(normalizedQuery))
      .map(item => item.title)
      .slice(0, 5);
    
    // Ajouter des suggestions de l'historique
    const historySuggestions = this.searchHistory
      .filter(item => item.includes(normalizedQuery))
      .slice(0, 3);
    
    // Combiner et dédupliquer les suggestions
    const allSuggestions = [...new Set([...titleSuggestions, ...historySuggestions])];
    
    return allSuggestions.slice(0, 5); // Limiter à 5 suggestions
  }

  // Effacer l'historique de recherche
  clearSearchHistory() {
    this.searchHistory = [];
    console.log('Historique de recherche effacé');
  }
}
