/**
 * Service de contenu simplifié utilisant des données mockées
 * Ce service remplace temporairement ContentDataService pour le déploiement Vercel
 */

import { mockData } from '../data/mockData';

class MockContentService {
  constructor() {
    this.mockData = mockData;
    console.log('[MockContentService] Initialisation avec données mockées');
  }

  /**
   * Initialise le service
   */
  async init() {
    console.log('[MockContentService] Service initialisé avec succès');
    return true;
  }

  /**
   * Précharge les données pour la page d'accueil
   */
  async preloadHomePageData() {
    console.log('[MockContentService] Préchargement des données de la page d\'accueil');
    return this.mockData.homePageData;
  }

  /**
   * Récupère les éléments en vedette
   */
  getFeaturedItems() {
    return this.mockData.homePageData.popular.slice(0, 5);
  }

  /**
   * Récupère les éléments tendance
   */
  getTrendingItems() {
    return this.mockData.homePageData.popular.slice(0, 10);
  }

  /**
   * Récupère les éléments recommandés
   */
  getRecommendedItems() {
    // Mélanger les éléments pour simuler des recommandations
    const allItems = [
      ...this.mockData.dramas,
      ...this.mockData.movies,
      ...this.mockData.animes
    ];
    
    // Fonction de mélange aléatoire
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    
    return shuffleArray(allItems).slice(0, 10);
  }

  /**
   * Récupère tous les éléments d'un type spécifique
   */
  getAllItems(type) {
    switch (type) {
      case 'drama':
        return this.mockData.dramas;
      case 'movie':
        return this.mockData.movies;
      case 'anime':
        return this.mockData.animes;
      case 'french':
        return this.mockData.frenchMovies;
      default:
        return [
          ...this.mockData.dramas,
          ...this.mockData.movies,
          ...this.mockData.animes,
          ...this.mockData.frenchMovies
        ];
    }
  }

  /**
   * Récupère les films français
   */
  getFrenchMovies() {
    return this.mockData.frenchMovies;
  }

  /**
   * Recherche des éléments par mot-clé
   */
  searchItems(query) {
    if (!query || query.length < 2) {
      return [];
    }
    
    const allItems = [
      ...this.mockData.dramas,
      ...this.mockData.movies,
      ...this.mockData.animes,
      ...this.mockData.frenchMovies
    ];
    
    const normalizedQuery = query.toLowerCase();
    
    return allItems.filter(item => 
      item.title.toLowerCase().includes(normalizedQuery) ||
      (item.description && item.description.toLowerCase().includes(normalizedQuery)) ||
      (item.genres && item.genres.some(genre => genre.toLowerCase().includes(normalizedQuery)))
    );
  }

  /**
   * Récupère les détails d'un élément par son ID
   */
  getItemById(id) {
    const allItems = [
      ...this.mockData.dramas,
      ...this.mockData.movies,
      ...this.mockData.animes,
      ...this.mockData.frenchMovies
    ];
    
    return allItems.find(item => item.id === id);
  }

  /**
   * Récupère les éléments similaires à un élément donné
   */
  getSimilarItems(item, count = 5) {
    if (!item) {
      return [];
    }
    
    const sameTypeItems = this.getAllItems(item.type);
    
    // Exclure l'élément lui-même
    const filteredItems = sameTypeItems.filter(i => i.id !== item.id);
    
    // Trier par similarité (même genre)
    const sortedItems = filteredItems.sort((a, b) => {
      const aCommonGenres = a.genres ? a.genres.filter(genre => item.genres && item.genres.includes(genre)).length : 0;
      const bCommonGenres = b.genres ? b.genres.filter(genre => item.genres && item.genres.includes(genre)).length : 0;
      return bCommonGenres - aCommonGenres;
    });
    
    return sortedItems.slice(0, count);
  }
}

// Exporter une instance unique
const mockContentService = new MockContentService();
export default mockContentService;
