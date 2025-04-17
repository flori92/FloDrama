/**
 * ApiService.mock.js
 * 
 * Service simulant les appels API pour le développement et les tests
 * Fournit des données mockées pour éviter les appels réseau en développement
 */

// Données mockées pour les contenus populaires
const mockPopularContent = {
  popular: Array(10).fill().map((_, i) => ({
    id: `popular-${i}`,
    title: `Contenu populaire ${i+1}`,
    originalTitle: i % 2 === 0 ? `Original Title ${i+1}` : null,
    image: '/assets/placeholder.jpg',
    type: i % 3 === 0 ? 'movie' : i % 3 === 1 ? 'drama' : 'anime',
    year: 2020 + (i % 5),
    rating: (3 + (i % 10) / 5).toFixed(1),
    genres: ['Action', 'Romance', 'Comédie'].slice(0, 1 + (i % 3))
  })),
  dramas: Array(10).fill().map((_, i) => ({
    id: `drama-${i}`,
    title: `Drama ${i+1}`,
    originalTitle: `드라마 ${i+1}`,
    image: '/assets/placeholder.jpg',
    type: 'drama',
    year: 2018 + (i % 7),
    rating: (4 + (i % 10) / 10).toFixed(1),
    genres: ['Romance', 'Comédie', 'Thriller'].slice(0, 1 + (i % 3)),
    episodes: 16 + (i % 8)
  })),
  animes: Array(10).fill().map((_, i) => ({
    id: `anime-${i}`,
    title: `Anime ${i+1}`,
    originalTitle: `アニメ ${i+1}`,
    image: '/assets/placeholder.jpg',
    type: 'anime',
    year: 2019 + (i % 6),
    rating: (4.2 + (i % 8) / 10).toFixed(1),
    genres: ['Fantasy', 'Action', 'School'].slice(0, 1 + (i % 3)),
    episodes: 12 + (i % 13)
  })),
  movies: Array(10).fill().map((_, i) => ({
    id: `movie-${i}`,
    title: `Film ${i+1}`,
    originalTitle: i % 2 === 0 ? `Original Film ${i+1}` : null,
    image: '/assets/placeholder.jpg',
    type: 'movie',
    year: 2017 + (i % 8),
    rating: (3.8 + (i % 12) / 10).toFixed(1),
    genres: ['Drame', 'Thriller', 'Action'].slice(0, 1 + (i % 3)),
    duration: `${1 + (i % 2)}h ${10 + (i % 50)}min`
  })),
  french: Array(10).fill().map((_, i) => ({
    id: `french-${i}`,
    title: `Film Français ${i+1}`,
    originalTitle: null,
    image: '/assets/placeholder.jpg',
    type: 'movie',
    year: 2019 + (i % 6),
    rating: (3.5 + (i % 15) / 10).toFixed(1),
    genres: ['Comédie', 'Drame', 'Romance'].slice(0, 1 + (i % 3)),
    duration: `${1 + (i % 2)}h ${15 + (i % 45)}min`,
    country: 'France'
  }))
};

// Données mockées pour les recherches
const mockSearchResults = {
  'drama': mockPopularContent.dramas.slice(0, 5),
  'anime': mockPopularContent.animes.slice(0, 5),
  'movie': mockPopularContent.movies.slice(0, 5),
  'action': [
    ...mockPopularContent.movies.filter(m => m.genres.includes('Action')).slice(0, 3),
    ...mockPopularContent.dramas.filter(m => m.genres.includes('Action')).slice(0, 2),
    ...mockPopularContent.animes.filter(m => m.genres.includes('Action')).slice(0, 2)
  ],
  'romance': [
    ...mockPopularContent.dramas.filter(m => m.genres.includes('Romance')).slice(0, 4),
    ...mockPopularContent.movies.filter(m => m.genres.includes('Romance')).slice(0, 3)
  ],
  'français': mockPopularContent.french.slice(0, 7)
};

// Simuler un délai réseau
const simulateNetworkDelay = (min = 300, max = 1200) => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Simuler une erreur réseau aléatoire
const simulateRandomError = (errorRate = 0.05) => {
  if (Math.random() < errorRate) {
    throw new Error('Erreur réseau simulée');
  }
};

/**
 * Service API mocké pour le développement
 */
class ApiServiceMock {
  /**
   * Récupère les contenus populaires
   * @returns {Promise<Object>} Données populaires
   */
  async getPopularContent() {
    await simulateNetworkDelay(500, 1500);
    simulateRandomError(0.02);
    return mockPopularContent;
  }
  
  /**
   * Recherche des contenus
   * @param {String} query - Requête de recherche
   * @returns {Promise<Array>} Résultats de recherche
   */
  async searchContent(query) {
    await simulateNetworkDelay();
    simulateRandomError();
    
    // Recherche simple dans les données mockées
    const normalizedQuery = query.toLowerCase().trim();
    
    if (mockSearchResults[normalizedQuery]) {
      return mockSearchResults[normalizedQuery];
    }
    
    // Recherche par correspondance partielle
    const results = [];
    
    // Chercher dans tous les types de contenu
    Object.values(mockPopularContent).forEach(contentList => {
      contentList.forEach(content => {
        if (
          content.title.toLowerCase().includes(normalizedQuery) ||
          (content.originalTitle && content.originalTitle.toLowerCase().includes(normalizedQuery)) ||
          content.genres.some(g => g.toLowerCase().includes(normalizedQuery))
        ) {
          // Éviter les doublons
          if (!results.some(r => r.id === content.id)) {
            results.push(content);
          }
        }
      });
    });
    
    return results.slice(0, 10);
  }
  
  /**
   * Récupère les détails d'un contenu
   * @param {String} id - Identifiant du contenu
   * @returns {Promise<Object>} Détails du contenu
   */
  async getContentDetails(id) {
    await simulateNetworkDelay();
    simulateRandomError();
    
    // Chercher dans tous les types de contenu
    let content = null;
    
    Object.values(mockPopularContent).forEach(contentList => {
      const found = contentList.find(item => item.id === id);
      if (found) {
        content = found;
      }
    });
    
    if (!content) {
      throw new Error(`Contenu non trouvé: ${id}`);
    }
    
    // Ajouter des détails supplémentaires
    return {
      ...content,
      description: `Ceci est une description générée pour ${content.title}. Ce contenu est disponible en streaming sur FloDrama.`,
      streamingUrl: `https://example.com/stream/${id}`,
      trailerUrl: `https://example.com/trailer/${id}`,
      cast: Array(5).fill().map((_, i) => ({
        name: `Acteur ${i+1}`,
        role: `Personnage ${i+1}`,
        image: '/assets/placeholder-actor.jpg'
      })),
      director: content.type === 'movie' ? 'Réalisateur Exemple' : 'Directeur Exemple',
      writer: 'Scénariste Exemple',
      related: Array(6).fill().map((_, i) => ({
        id: `related-${content.type}-${i}`,
        title: `${content.type === 'movie' ? 'Film' : content.type === 'drama' ? 'Drama' : 'Anime'} similaire ${i+1}`,
        image: '/assets/placeholder.jpg',
        type: content.type
      }))
    };
  }
  
  /**
   * Récupère les suggestions pour l'autocomplétion
   * @param {String} query - Début de requête
   * @returns {Promise<Array>} Suggestions
   */
  async getSuggestions(query) {
    await simulateNetworkDelay(100, 300);
    
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];
    
    const suggestions = [
      'action', 'aventure', 'animation', 'anime',
      'comédie', 'crime', 'documentaire', 'drame',
      'famille', 'fantaisie', 'français', 'historique',
      'horreur', 'musical', 'mystère', 'romance',
      'science-fiction', 'thriller', 'guerre', 'western'
    ].filter(s => s.includes(normalizedQuery));
    
    // Ajouter des titres de contenu
    Object.values(mockPopularContent).forEach(contentList => {
      contentList.forEach(content => {
        if (content.title.toLowerCase().includes(normalizedQuery)) {
          suggestions.push(content.title);
        }
      });
    });
    
    // Limiter et dédupliquer
    return [...new Set(suggestions)].slice(0, 8);
  }
  
  /**
   * Récupère les nouveaux contenus
   * @returns {Promise<Array>} Nouveaux contenus
   */
  async getNewContent() {
    await simulateNetworkDelay();
    
    // Mélanger et prendre quelques éléments de chaque catégorie
    const newContent = [
      ...mockPopularContent.dramas.slice(0, 3),
      ...mockPopularContent.animes.slice(0, 3),
      ...mockPopularContent.movies.slice(0, 3),
      ...mockPopularContent.french.slice(0, 3)
    ];
    
    // Mélanger le tableau
    return newContent.sort(() => Math.random() - 0.5);
  }
}

export default new ApiServiceMock();
