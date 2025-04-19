// Service de catégorisation de contenu pour FloDrama
// Analyse et catégorise le contenu en fonction de divers critères

/**
 * Service de catégorisation de contenu
 * @class ContentCategorizer
 */
export class ContentCategorizer {
  /**
   * Constructeur du service de catégorisation
   * @param {Object} config - Configuration du service
   * @param {Object} config.genreMapping - Mapping des genres
   * @param {Object} config.categoryRules - Règles de catégorisation
   */
  constructor(config = {}) {
    // Mapping des genres pour normalisation
    this.genreMapping = config.genreMapping || {
      // Genres principaux
      'action': 'Action',
      'aventure': 'Aventure',
      'animation': 'Animation',
      'comédie': 'Comédie',
      'crime': 'Crime',
      'documentaire': 'Documentaire',
      'drame': 'Drame',
      'fantaisie': 'Fantaisie',
      'historique': 'Historique',
      'horreur': 'Horreur',
      'mystère': 'Mystère',
      'romance': 'Romance',
      'science-fiction': 'Science-Fiction',
      'thriller': 'Thriller',
      'guerre': 'Guerre',
      'western': 'Western',
      
      // Sous-genres et variantes
      'sci-fi': 'Science-Fiction',
      'sf': 'Science-Fiction',
      'policier': 'Crime',
      'romantique': 'Romance',
      'épouvante': 'Horreur',
      'fantasy': 'Fantaisie',
      'biopic': 'Biographie',
      'biographie': 'Biographie',
      'musical': 'Comédie Musicale',
      'comédie musicale': 'Comédie Musicale',
      'sport': 'Sport',
      'famille': 'Famille'
    };
    
    // Règles de catégorisation
    this.categoryRules = config.categoryRules || {
      // Règles pour les types de contenu
      typeRules: {
        'film': ['movie', 'film', 'long-métrage', 'long métrage'],
        'série': ['series', 'série', 'tv show', 'show', 'émission'],
        'anime': ['anime', 'animation japonaise', 'dessin animé japonais'],
        'documentaire': ['documentary', 'documentaire', 'doc'],
        'spectacle': ['stand-up', 'spectacle', 'concert', 'one-man show']
      },
      
      // Règles pour les origines
      originRules: {
        'corée': ['korean', 'korea', 'corée', 'coréen', 'k-drama', 'kdrama'],
        'japon': ['japanese', 'japan', 'japon', 'japonais', 'j-drama', 'jdrama'],
        'chine': ['chinese', 'china', 'chine', 'chinois', 'c-drama', 'cdrama'],
        'taïwan': ['taiwanese', 'taiwan', 'taïwan', 'taïwanais', 't-drama', 'tdrama'],
        'thaïlande': ['thai', 'thailand', 'thaïlande', 'thaïlandais', 'lakorn'],
        'inde': ['indian', 'india', 'inde', 'indien', 'bollywood', 'tollywood'],
        'usa': ['american', 'america', 'usa', 'états-unis', 'américain', 'hollywood'],
        'france': ['french', 'france', 'français'],
        'royaume-uni': ['british', 'uk', 'royaume-uni', 'britannique', 'angleterre', 'anglais']
      }
    };
    
    console.log('ContentCategorizer initialisé');
  }
  
  /**
   * Normaliser un genre
   * @param {string} genre - Genre à normaliser
   * @returns {string} - Genre normalisé
   */
  normalizeGenre(genre) {
    if (!genre) return null;
    
    const lowerGenre = genre.toLowerCase().trim();
    return this.genreMapping[lowerGenre] || genre;
  }
  
  /**
   * Normaliser une liste de genres
   * @param {Array|string} genres - Liste de genres ou genre unique
   * @returns {Array} - Liste de genres normalisés
   */
  normalizeGenres(genres) {
    if (!genres) return [];
    
    // Convertir en tableau si nécessaire
    const genreArray = Array.isArray(genres) ? genres : [genres];
    
    // Normaliser chaque genre et éliminer les doublons
    const normalizedGenres = genreArray
      .map(genre => this.normalizeGenre(genre))
      .filter(Boolean);
    
    return [...new Set(normalizedGenres)];
  }
  
  /**
   * Détecter le type de contenu
   * @param {Object} item - Élément de contenu
   * @returns {string} - Type détecté
   */
  detectContentType(item) {
    // Si le type est déjà défini, le normaliser
    if (item.type) {
      const lowerType = item.type.toLowerCase().trim();
      
      // Vérifier dans les règles de type
      for (const [type, keywords] of Object.entries(this.categoryRules.typeRules)) {
        if (keywords.includes(lowerType)) {
          return type;
        }
      }
      
      // Si pas trouvé dans les règles mais défini, retourner tel quel
      return item.type;
    }
    
    // Essayer de détecter à partir d'autres propriétés
    const searchText = [
      item.title,
      item.description,
      ...(item.tags || [])
    ].join(' ').toLowerCase();
    
    // Vérifier dans les règles de type
    for (const [type, keywords] of Object.entries(this.categoryRules.typeRules)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return type;
        }
      }
    }
    
    // Heuristiques supplémentaires
    if (item.duration) {
      // Si durée < 60 minutes, probablement un épisode
      if (item.duration.includes('min') && parseInt(item.duration) < 60) {
        return 'série';
      }
      
      // Si durée > 60 minutes, probablement un film
      if (item.duration.includes('min') && parseInt(item.duration) > 60) {
        return 'film';
      }
      
      // Si format hh:mm, analyser
      if (item.duration.includes(':')) {
        const [hours, minutes] = item.duration.split(':').map(Number);
        if (hours > 0 || minutes > 60) {
          return 'film';
        } else {
          return 'série';
        }
      }
    }
    
    // Par défaut
    return 'film';
  }
  
  /**
   * Détecter l'origine du contenu
   * @param {Object} item - Élément de contenu
   * @returns {string|null} - Origine détectée
   */
  detectContentOrigin(item) {
    // Si l'origine est déjà définie
    if (item.origin) {
      const lowerOrigin = item.origin.toLowerCase().trim();
      
      // Vérifier dans les règles d'origine
      for (const [origin, keywords] of Object.entries(this.categoryRules.originRules)) {
        if (keywords.includes(lowerOrigin)) {
          return origin;
        }
      }
      
      // Si pas trouvé dans les règles mais défini, retourner tel quel
      return item.origin;
    }
    
    // Essayer de détecter à partir d'autres propriétés
    const searchText = [
      item.title,
      item.description,
      ...(item.tags || [])
    ].join(' ').toLowerCase();
    
    // Vérifier dans les règles d'origine
    for (const [origin, keywords] of Object.entries(this.categoryRules.originRules)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return origin;
        }
      }
    }
    
    // Heuristiques supplémentaires basées sur le titre ou les acteurs
    if (item.title) {
      // Titres coréens typiques
      if (/^(Mr\.|Ms\.|The) [A-Z][a-z]+ (of|from|in|and) [A-Z][a-z]+/.test(item.title)) {
        return 'corée';
      }
      
      // Titres japonais typiques
      if (item.title.includes('!') && /[A-Z][a-z]+ [A-Z][a-z]+!!+/.test(item.title)) {
        return 'japon';
      }
      
      // Titres indiens typiques
      if (/^[A-Z][a-z]+ Ki [A-Z][a-z]+/.test(item.title)) {
        return 'inde';
      }
    }
    
    // Pas d'origine détectée
    return null;
  }
  
  /**
   * Catégoriser un élément de contenu
   * @param {Object} item - Élément de contenu
   * @returns {Object} - Élément catégorisé
   */
  categorizeItem(item) {
    if (!item) return null;
    
    const categorizedItem = { ...item };
    
    // Normaliser les genres
    if (item.genre) {
      categorizedItem.genre = this.normalizeGenres(item.genre);
    }
    
    // Détecter le type si non défini ou à normaliser
    if (!item.type || this.shouldNormalizeType(item.type)) {
      categorizedItem.type = this.detectContentType(item);
    }
    
    // Détecter l'origine si non définie
    if (!item.origin) {
      const detectedOrigin = this.detectContentOrigin(item);
      if (detectedOrigin) {
        categorizedItem.origin = detectedOrigin;
      }
    }
    
    // Calculer une catégorie principale basée sur le type et le genre principal
    categorizedItem.mainCategory = this.calculateMainCategory(categorizedItem);
    
    return categorizedItem;
  }
  
  /**
   * Vérifier si un type doit être normalisé
   * @param {string} type - Type à vérifier
   * @returns {boolean} - Vrai si le type doit être normalisé
   * @private
   */
  shouldNormalizeType(type) {
    if (!type) return true;
    
    const lowerType = type.toLowerCase().trim();
    
    // Vérifier si le type correspond à une règle
    for (const [normalizedType, keywords] of Object.entries(this.categoryRules.typeRules)) {
      if (keywords.includes(lowerType) && lowerType !== normalizedType) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Calculer la catégorie principale d'un élément
   * @param {Object} item - Élément de contenu
   * @returns {string} - Catégorie principale
   * @private
   */
  calculateMainCategory(item) {
    // Priorité 1: Type + Origine
    if (item.type && item.origin) {
      return `${item.type} ${item.origin}`;
    }
    
    // Priorité 2: Type + Genre principal
    if (item.type && item.genre && item.genre.length > 0) {
      return `${item.type} ${item.genre[0]}`;
    }
    
    // Priorité 3: Type seul
    if (item.type) {
      return item.type;
    }
    
    // Priorité 4: Genre principal seul
    if (item.genre && item.genre.length > 0) {
      return item.genre[0];
    }
    
    // Par défaut
    return 'Non catégorisé';
  }
  
  /**
   * Catégoriser une liste d'éléments
   * @param {Array} items - Liste d'éléments
   * @returns {Array} - Liste d'éléments catégorisés
   */
  categorizeItems(items) {
    if (!items || !Array.isArray(items)) return [];
    
    return items.map(item => this.categorizeItem(item));
  }
  
  /**
   * Grouper des éléments par catégorie
   * @param {Array} items - Liste d'éléments
   * @param {string} categoryField - Champ de catégorie (défaut: 'mainCategory')
   * @returns {Object} - Éléments groupés par catégorie
   */
  groupByCategory(items, categoryField = 'mainCategory') {
    if (!items || !Array.isArray(items)) return {};
    
    // Catégoriser les éléments
    const categorizedItems = this.categorizeItems(items);
    
    // Grouper par catégorie
    return categorizedItems.reduce((groups, item) => {
      const category = item[categoryField] || 'Non catégorisé';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      
      groups[category].push(item);
      return groups;
    }, {});
  }
  
  /**
   * Extraire les catégories disponibles
   * @param {Array} items - Liste d'éléments
   * @param {string} categoryField - Champ de catégorie (défaut: 'mainCategory')
   * @returns {Array} - Liste des catégories
   */
  extractCategories(items, categoryField = 'mainCategory') {
    if (!items || !Array.isArray(items)) return [];
    
    // Catégoriser les éléments
    const categorizedItems = this.categorizeItems(items);
    
    // Extraire les catégories uniques
    const categories = categorizedItems
      .map(item => item[categoryField])
      .filter(Boolean);
    
    return [...new Set(categories)];
  }
  
  /**
   * Suggérer des catégories similaires
   * @param {string} category - Catégorie de référence
   * @param {Array} allCategories - Toutes les catégories disponibles
   * @param {number} limit - Nombre de suggestions
   * @returns {Array} - Catégories similaires
   */
  suggestSimilarCategories(category, allCategories, limit = 5) {
    if (!category || !allCategories || !Array.isArray(allCategories)) {
      return [];
    }
    
    // Normaliser la catégorie
    const normalizedCategory = category.toLowerCase().trim();
    
    // Extraire les mots-clés de la catégorie
    const categoryWords = normalizedCategory.split(/\s+/);
    
    // Calculer un score de similarité pour chaque catégorie
    const scoredCategories = allCategories
      .filter(cat => cat.toLowerCase() !== normalizedCategory) // Exclure la catégorie elle-même
      .map(cat => {
        const catWords = cat.toLowerCase().split(/\s+/);
        let score = 0;
        
        // Score basé sur les mots communs
        categoryWords.forEach(word => {
          if (catWords.includes(word)) {
            score += 2;
          }
        });
        
        // Score basé sur les mots similaires
        categoryWords.forEach(word => {
          catWords.forEach(catWord => {
            if (catWord.includes(word) || word.includes(catWord)) {
              score += 1;
            }
          });
        });
        
        return { category: cat, score };
      });
    
    // Trier par score et limiter
    return scoredCategories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.category);
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default ContentCategorizer;
