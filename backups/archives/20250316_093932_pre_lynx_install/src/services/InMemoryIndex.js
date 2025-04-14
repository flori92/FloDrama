/**
 * Service d'indexation et de recherche en mémoire
 * Utilisé comme fallback lorsque Elasticsearch n'est pas disponible
 */

class InMemoryIndex {
  constructor() {
    this.items = [];
    this.lastUpdate = null;
  }

  /**
   * Ajoute un élément à l'index
   * @param {Object} item - Élément à ajouter
   */
  addItem(item) {
    // Vérifier si l'élément existe déjà (par titre)
    const existingIndex = this.items.findIndex(
      existing => existing.title === item.title && existing.source === item.source
    );

    if (existingIndex !== -1) {
      // Mettre à jour l'élément existant
      this.items[existingIndex] = {
        ...this.items[existingIndex],
        ...item,
        updated_at: new Date()
      };
    } else {
      // Ajouter un nouvel élément
      this.items.push({
        ...item,
        created_at: item.created_at || new Date(),
        updated_at: new Date()
      });
    }

    this.lastUpdate = new Date();
  }

  /**
   * Supprime un élément de l'index
   * @param {String} title - Titre de l'élément à supprimer
   * @param {String} source - Source de l'élément à supprimer
   * @returns {Boolean} True si l'élément a été supprimé
   */
  removeItem(title, source) {
    const initialLength = this.items.length;
    this.items = this.items.filter(
      item => !(item.title === title && item.source === source)
    );
    
    if (this.items.length !== initialLength) {
      this.lastUpdate = new Date();
      return true;
    }
    
    return false;
  }

  /**
   * Vide l'index
   */
  clear() {
    this.items = [];
    this.lastUpdate = new Date();
  }

  /**
   * Recherche dans l'index
   * @param {String} query - Terme de recherche
   * @returns {Array} Résultats de recherche
   */
  search(query) {
    if (!query || query.trim() === '') {
      return [];
    }

    // Normaliser la requête pour la recherche
    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = normalizedQuery.split(/\s+/);

    // Fonction pour calculer un score de pertinence simple
    const calculateScore = (item) => {
      let score = 0;
      
      // Vérifier le titre (poids plus élevé)
      const title = (item.title || '').toLowerCase();
      if (title.includes(normalizedQuery)) {
        score += 10;
      }
      
      // Vérifier chaque terme de la requête dans le titre
      for (const term of queryTerms) {
        if (title.includes(term)) {
          score += 5;
        }
      }
      
      // Vérifier la description
      const description = (item.description || '').toLowerCase();
      if (description.includes(normalizedQuery)) {
        score += 3;
      }
      
      // Vérifier chaque terme de la requête dans la description
      for (const term of queryTerms) {
        if (description.includes(term)) {
          score += 1;
        }
      }
      
      // Vérifier les genres
      if (item.genres) {
        for (const genre of item.genres) {
          const normalizedGenre = genre.toLowerCase();
          if (normalizedGenre.includes(normalizedQuery) || normalizedQuery.includes(normalizedGenre)) {
            score += 2;
          }
        }
      }
      
      return score;
    };

    // Filtrer les éléments avec un score > 0 et trier par score décroissant
    return this.items
      .map(item => ({ ...item, _score: calculateScore(item) }))
      .filter(item => item._score > 0)
      .sort((a, b) => b._score - a._score);
  }

  /**
   * Récupère des suggestions pour l'autocomplétion
   * @param {String} prefix - Préfixe pour l'autocomplétion
   * @param {Number} size - Nombre de suggestions à retourner
   * @returns {Array} Suggestions d'autocomplétion
   */
  getSuggestions(prefix, size = 10) {
    if (!prefix || prefix.trim() === '') {
      return [];
    }

    const normalizedPrefix = prefix.toLowerCase().trim();
    
    // Trouver les titres qui commencent par le préfixe
    const exactMatches = this.items
      .filter(item => item.title && item.title.toLowerCase().startsWith(normalizedPrefix))
      .map(item => item.title);
    
    // Trouver les titres qui contiennent le préfixe
    const partialMatches = this.items
      .filter(item => item.title && !item.title.toLowerCase().startsWith(normalizedPrefix) && 
                     item.title.toLowerCase().includes(normalizedPrefix))
      .map(item => item.title);
    
    // Combiner les résultats et limiter la taille
    return [...new Set([...exactMatches, ...partialMatches])].slice(0, size);
  }

  /**
   * Récupère les statistiques de l'index
   * @returns {Object} Statistiques de l'index
   */
  getStats() {
    return {
      documentCount: this.items.length,
      lastUpdate: this.lastUpdate
    };
  }
}

// Créer une instance singleton
const inMemoryIndex = new InMemoryIndex();

export { inMemoryIndex };
