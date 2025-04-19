// Service de recherche avancé pour FloDrama
// Implémente un système de recherche avec indexation, filtrage et suggestions

/**
 * Service de recherche
 * @class SearchService
 */
export class SearchService {
  /**
   * Constructeur du service de recherche
   * @param {ContentDataService} contentDataService - Service de données de contenu
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.historyKey - Clé pour l'historique de recherche (défaut: 'search_history')
   * @param {number} config.maxHistoryItems - Nombre maximum d'éléments dans l'historique (défaut: 20)
   * @param {number} config.maxSuggestions - Nombre maximum de suggestions (défaut: 5)
   * @param {boolean} config.enableFuzzySearch - Activer la recherche approximative (défaut: true)
   */
  constructor(contentDataService = null, storageService = null, config = {}) {
    this.contentDataService = contentDataService;
    this.storageService = storageService;
    this.historyKey = config.historyKey || 'search_history';
    this.maxHistoryItems = config.maxHistoryItems || 20;
    this.maxSuggestions = config.maxSuggestions || 5;
    this.enableFuzzySearch = config.enableFuzzySearch !== undefined ? config.enableFuzzySearch : true;
    
    // Index de recherche
    this.searchIndex = [];
    this.searchHistory = [];
    
    // Charger l'historique de recherche
    this._loadSearchHistory();
    
    // Initialiser l'index de recherche
    this.initializeSearchIndex();
    
    console.log('SearchService initialisé');
  }
  
  /**
   * Charger l'historique de recherche
   * @private
   */
  async _loadSearchHistory() {
    try {
      if (this.storageService) {
        const history = await this.storageService.get(this.historyKey);
        if (history && Array.isArray(history)) {
          this.searchHistory = history;
        }
      } else {
        // Fallback sur localStorage
        const storedHistory = localStorage.getItem(`flodrama_${this.historyKey}`);
        if (storedHistory) {
          this.searchHistory = JSON.parse(storedHistory);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique de recherche:', error);
      this.searchHistory = [];
    }
  }
  
  /**
   * Sauvegarder l'historique de recherche
   * @private
   */
  async _saveSearchHistory() {
    try {
      if (this.storageService) {
        await this.storageService.set(this.historyKey, this.searchHistory);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(
          `flodrama_${this.historyKey}`, 
          JSON.stringify(this.searchHistory)
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique de recherche:', error);
    }
  }
  
  /**
   * Initialiser l'index de recherche
   * @returns {Promise<boolean>} - Succès de l'initialisation
   */
  async initializeSearchIndex() {
    try {
      if (!this.contentDataService) {
        console.error('ContentDataService non disponible');
        return false;
      }
      
      // Récupérer tout le contenu disponible
      const allContent = await this.contentDataService.getAllContent();
      
      if (!allContent || !Array.isArray(allContent)) {
        console.error('Contenu non disponible ou invalide');
        return false;
      }
      
      // Créer un index de recherche avancé
      this.searchIndex = allContent.map(item => ({
        id: item.id,
        title: item.title.toLowerCase(),
        originalTitle: item.title,
        description: (item.description || '').toLowerCase(),
        category: (item.category || '').toLowerCase(),
        type: (item.type || '').toLowerCase(),
        tags: (item.tags || []).map(tag => tag.toLowerCase()),
        actors: (item.actors || []).map(actor => actor.toLowerCase()),
        directors: (item.directors || []).map(director => director.toLowerCase()),
        year: item.year,
        origin: (item.origin || '').toLowerCase(),
        searchableText: [
          item.title,
          item.description || '',
          item.category || '',
          item.type || '',
          ...(item.tags || []),
          ...(item.actors || []),
          ...(item.directors || []),
          item.year,
          item.origin || ''
        ].join(' ').toLowerCase()
      }));
      
      console.log(`Index de recherche créé avec ${this.searchIndex.length} éléments`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'index de recherche:', error);
      this.searchIndex = [];
      return false;
    }
  }
  
  /**
   * Rechercher du contenu
   * @param {string} query - Requête de recherche
   * @param {Object} filters - Filtres de recherche
   * @param {string} filters.type - Type de contenu
   * @param {string} filters.category - Catégorie de contenu
   * @param {number} filters.year - Année de sortie
   * @param {string} filters.origin - Origine du contenu
   * @param {Array<string>} filters.tags - Tags à filtrer
   * @param {number} limit - Limite de résultats
   * @returns {Array} - Résultats de recherche
   */
  search(query, filters = {}, limit = 50) {
    if (!query || query.trim() === '') {
      return [];
    }
    
    // Enregistrer la recherche dans l'historique
    this.addToSearchHistory(query);
    
    // Normaliser la requête
    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = normalizedQuery.split(/\s+/);
    
    // Effectuer la recherche
    let results = this.searchIndex.filter(item => {
      // Vérifier si la requête correspond au texte recherchable
      let matchesQuery = false;
      
      if (this.enableFuzzySearch) {
        // Recherche approximative: correspondance si au moins 70% des termes sont trouvés
        const matchingTerms = queryTerms.filter(term => 
          item.searchableText.includes(term)
        );
        matchesQuery = matchingTerms.length / queryTerms.length >= 0.7;
      } else {
        // Recherche exacte: tous les termes doivent être présents
        matchesQuery = queryTerms.every(term => 
          item.searchableText.includes(term)
        );
      }
      
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
      
      if (filters.origin && filters.origin !== 'all') {
        matchesFilters = matchesFilters && item.origin === filters.origin.toLowerCase();
      }
      
      if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
        matchesFilters = matchesFilters && filters.tags.some(tag => 
          item.tags.includes(tag.toLowerCase())
        );
      }
      
      return matchesQuery && matchesFilters;
    });
    
    // Trier les résultats par pertinence
    results = this.rankResults(results, normalizedQuery);
    
    // Limiter le nombre de résultats
    if (limit > 0 && results.length > limit) {
      results = results.slice(0, limit);
    }
    
    console.log(`Recherche pour "${query}" : ${results.length} résultats trouvés`);
    
    // Transformer les résultats pour inclure les données originales
    return results.map(item => ({
      id: item.id,
      title: item.originalTitle,
      relevanceScore: item.relevanceScore
    }));
  }
  
  /**
   * Classer les résultats par pertinence
   * @param {Array} results - Résultats de recherche
   * @param {string} query - Requête de recherche
   * @returns {Array} - Résultats classés
   * @private
   */
  rankResults(results, query) {
    const queryTerms = query.split(/\s+/);
    
    return results.map(item => {
      // Calculer un score de pertinence avancé
      let relevanceScore = 0;
      
      // Titre exact = score très élevé
      if (item.title === query) {
        relevanceScore += 100;
      }
      // Titre commence par la requête = score élevé
      else if (item.title.startsWith(query)) {
        relevanceScore += 50;
      }
      // Titre contient la requête = score moyen
      else if (item.title.includes(query)) {
        relevanceScore += 30;
      }
      
      // Correspondance de termes individuels dans le titre
      queryTerms.forEach(term => {
        if (item.title.includes(term)) {
          relevanceScore += 5;
        }
      });
      
      // Correspondance de catégorie
      if (item.category.includes(query)) {
        relevanceScore += 20;
      }
      
      // Correspondance de tags
      if (item.tags.some(tag => tag.includes(query))) {
        relevanceScore += 15;
      }
      
      // Correspondance d'acteurs
      if (item.actors && item.actors.some(actor => actor.includes(query))) {
        relevanceScore += 10;
      }
      
      // Correspondance de réalisateurs
      if (item.directors && item.directors.some(director => director.includes(query))) {
        relevanceScore += 10;
      }
      
      // Correspondance dans la description
      if (item.description && item.description.includes(query)) {
        relevanceScore += 5;
      }
      
      return {
        ...item,
        relevanceScore
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  /**
   * Ajouter une requête à l'historique de recherche
   * @param {string} query - Requête de recherche
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async addToSearchHistory(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Éviter les requêtes vides
    if (normalizedQuery === '') {
      return false;
    }
    
    // Éviter les doublons
    const existingIndex = this.searchHistory.indexOf(normalizedQuery);
    if (existingIndex !== -1) {
      // Si la requête existe déjà, la déplacer en tête de liste
      this.searchHistory.splice(existingIndex, 1);
    }
    
    // Ajouter la requête en tête de liste
    this.searchHistory.unshift(normalizedQuery);
    
    // Limiter la taille de l'historique
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }
    
    // Sauvegarder l'historique
    await this._saveSearchHistory();
    
    return true;
  }
  
  /**
   * Obtenir l'historique de recherche
   * @param {number} limit - Limite de résultats
   * @returns {Array} - Historique de recherche
   */
  getSearchHistory(limit = 0) {
    if (limit > 0 && this.searchHistory.length > limit) {
      return this.searchHistory.slice(0, limit);
    }
    return [...this.searchHistory];
  }
  
  /**
   * Obtenir des suggestions de recherche basées sur l'entrée partielle
   * @param {string} partialQuery - Requête partielle
   * @returns {Array} - Suggestions de recherche
   */
  getSuggestions(partialQuery) {
    if (!partialQuery || partialQuery.trim() === '') {
      return [];
    }
    
    const normalizedQuery = partialQuery.toLowerCase().trim();
    
    // Rechercher dans l'index pour des suggestions
    const titleSuggestions = this.searchIndex
      .filter(item => item.title.includes(normalizedQuery))
      .map(item => item.originalTitle)
      .slice(0, this.maxSuggestions);
    
    // Ajouter des suggestions de l'historique
    const historySuggestions = this.searchHistory
      .filter(item => item.includes(normalizedQuery))
      .slice(0, Math.floor(this.maxSuggestions / 2));
    
    // Ajouter des suggestions de tags
    const tagSuggestions = this.searchIndex
      .flatMap(item => item.tags)
      .filter((tag, index, self) => 
        tag.includes(normalizedQuery) && self.indexOf(tag) === index
      )
      .slice(0, Math.floor(this.maxSuggestions / 2));
    
    // Combiner et dédupliquer les suggestions
    const allSuggestions = [...new Set([...titleSuggestions, ...historySuggestions, ...tagSuggestions])];
    
    return allSuggestions.slice(0, this.maxSuggestions);
  }
  
  /**
   * Effacer l'historique de recherche
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clearSearchHistory() {
    this.searchHistory = [];
    await this._saveSearchHistory();
    console.log('Historique de recherche effacé');
    return true;
  }
  
  /**
   * Obtenir les filtres disponibles
   * @returns {Object} - Filtres disponibles
   */
  getAvailableFilters() {
    // Extraire les types uniques
    const types = [...new Set(
      this.searchIndex.map(item => item.type).filter(Boolean)
    )];
    
    // Extraire les catégories uniques
    const categories = [...new Set(
      this.searchIndex.map(item => item.category).filter(Boolean)
    )];
    
    // Extraire les années uniques
    const years = [...new Set(
      this.searchIndex.map(item => item.year).filter(Boolean)
    )].sort((a, b) => b - a); // Tri décroissant
    
    // Extraire les origines uniques
    const origins = [...new Set(
      this.searchIndex.map(item => item.origin).filter(Boolean)
    )];
    
    // Extraire les tags les plus populaires
    const allTags = this.searchIndex.flatMap(item => item.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    
    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
    
    return {
      types,
      categories,
      years,
      origins,
      popularTags
    };
  }
  
  /**
   * Recherche avancée avec opérateurs
   * @param {string} advancedQuery - Requête avancée
   * @param {Object} options - Options de recherche
   * @returns {Array} - Résultats de recherche
   */
  advancedSearch(advancedQuery, options = {}) {
    // Exemple de syntaxe: "drama type:series year:2020 -romance"
    
    if (!advancedQuery || advancedQuery.trim() === '') {
      return [];
    }
    
    const normalizedQuery = advancedQuery.toLowerCase().trim();
    
    // Extraire les opérateurs
    const operators = {
      include: [],
      exclude: [],
      type: null,
      category: null,
      year: null,
      tag: []
    };
    
    // Analyser la requête
    const terms = normalizedQuery.match(/(-?"[^"]+"|[^\s]+)/g) || [];
    
    let mainQuery = '';
    
    terms.forEach(term => {
      // Terme négatif
      if (term.startsWith('-')) {
        operators.exclude.push(term.substring(1).replace(/"/g, ''));
      }
      // Opérateur de type
      else if (term.startsWith('type:')) {
        operators.type = term.substring(5);
      }
      // Opérateur de catégorie
      else if (term.startsWith('category:')) {
        operators.category = term.substring(9);
      }
      // Opérateur d'année
      else if (term.startsWith('year:')) {
        const yearStr = term.substring(5);
        const year = parseInt(yearStr, 10);
        if (!isNaN(year)) {
          operators.year = year;
        }
      }
      // Opérateur de tag
      else if (term.startsWith('tag:')) {
        operators.tag.push(term.substring(4));
      }
      // Terme normal
      else {
        const cleanTerm = term.replace(/"/g, '');
        operators.include.push(cleanTerm);
        mainQuery += ' ' + cleanTerm;
      }
    });
    
    mainQuery = mainQuery.trim();
    
    // Construire les filtres
    const filters = {
      type: operators.type,
      category: operators.category,
      year: operators.year,
      tags: operators.tag
    };
    
    // Effectuer la recherche principale
    let results = this.search(mainQuery, filters, 0);
    
    // Filtrer les résultats exclus
    if (operators.exclude.length > 0) {
      results = results.filter(item => {
        const searchableText = [
          item.title,
          item.category || '',
          item.type || '',
          ...(item.tags || [])
        ].join(' ').toLowerCase();
        
        return !operators.exclude.some(term => 
          searchableText.includes(term)
        );
      });
    }
    
    // Limiter les résultats
    const limit = options.limit || 50;
    if (limit > 0 && results.length > limit) {
      results = results.slice(0, limit);
    }
    
    console.log(`Recherche avancée pour "${advancedQuery}" : ${results.length} résultats trouvés`);
    return results;
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default SearchService;
