// Service de recommandations personnalisées pour FloDrama
// Implémente un système de recommandations basé sur l'IA et les préférences utilisateur

export class RecommendationService {
  constructor(contentDataService, favoritesService) {
    this.contentDataService = contentDataService;
    this.favoritesService = favoritesService;
    this.userPreferences = this.loadUserPreferences();
    this.watchHistory = this.loadWatchHistory();
    console.log('RecommendationService initialisé');
  }

  // Charger les préférences utilisateur depuis le stockage local
  loadUserPreferences() {
    try {
      const storedPreferences = localStorage.getItem('flodrama_user_preferences');
      return storedPreferences ? JSON.parse(storedPreferences) : {
        genres: {},
        actors: {},
        directors: {},
        categories: {}
      };
    } catch (error) {
      console.error('Erreur lors du chargement des préférences utilisateur:', error);
      return {
        genres: {},
        actors: {},
        directors: {},
        categories: {}
      };
    }
  }

  // Charger l'historique de visionnage depuis le stockage local
  loadWatchHistory() {
    try {
      const storedHistory = localStorage.getItem('flodrama_watch_history');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique de visionnage:', error);
      return [];
    }
  }

  // Sauvegarder les préférences utilisateur
  saveUserPreferences() {
    try {
      localStorage.setItem('flodrama_user_preferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences utilisateur:', error);
    }
  }

  // Sauvegarder l'historique de visionnage
  saveWatchHistory() {
    try {
      localStorage.setItem('flodrama_watch_history', JSON.stringify(this.watchHistory));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique de visionnage:', error);
    }
  }

  // Mettre à jour les préférences utilisateur en fonction du contenu visionné
  updatePreferences(contentItem) {
    // Mettre à jour les préférences de genre
    if (contentItem.genre) {
      const genres = Array.isArray(contentItem.genre) ? contentItem.genre : [contentItem.genre];
      genres.forEach(genre => {
        this.userPreferences.genres[genre] = (this.userPreferences.genres[genre] || 0) + 1;
      });
    }
    
    // Mettre à jour les préférences d'acteurs
    if (contentItem.actors) {
      contentItem.actors.forEach(actor => {
        this.userPreferences.actors[actor] = (this.userPreferences.actors[actor] || 0) + 1;
      });
    }
    
    // Mettre à jour les préférences de réalisateurs
    if (contentItem.director) {
      const directors = Array.isArray(contentItem.director) ? contentItem.director : [contentItem.director];
      directors.forEach(director => {
        this.userPreferences.directors[director] = (this.userPreferences.directors[director] || 0) + 1;
      });
    }
    
    // Mettre à jour les préférences de catégories
    if (contentItem.category) {
      this.userPreferences.categories[contentItem.category] = 
        (this.userPreferences.categories[contentItem.category] || 0) + 1;
    }
    
    // Sauvegarder les préférences mises à jour
    this.saveUserPreferences();
    console.log('Préférences utilisateur mises à jour');
  }

  // Ajouter un élément à l'historique de visionnage
  addToWatchHistory(contentItem) {
    // Vérifier si l'élément est déjà dans l'historique
    const existingIndex = this.watchHistory.findIndex(item => item.id === contentItem.id);
    
    // Créer l'entrée d'historique
    const historyEntry = {
      id: contentItem.id,
      title: contentItem.title,
      type: contentItem.type,
      image: contentItem.image,
      watchedAt: new Date().toISOString(),
      progress: contentItem.progress || 0
    };
    
    // Mettre à jour ou ajouter l'entrée
    if (existingIndex !== -1) {
      this.watchHistory[existingIndex] = historyEntry;
    } else {
      this.watchHistory.unshift(historyEntry);
    }
    
    // Limiter la taille de l'historique
    if (this.watchHistory.length > 100) {
      this.watchHistory = this.watchHistory.slice(0, 100);
    }
    
    // Sauvegarder l'historique mis à jour
    this.saveWatchHistory();
    
    // Mettre à jour les préférences utilisateur
    this.updatePreferences(contentItem);
    
    console.log(`Ajouté à l'historique de visionnage: ${contentItem.title}`);
  }

  // Obtenir les recommandations personnalisées
  async getPersonalizedRecommendations(limit = 10) {
    try {
      // Récupérer tout le contenu disponible
      const allContent = await this.contentDataService.getAllContent();
      
      // Si l'utilisateur n'a pas d'historique, retourner les tendances
      if (this.watchHistory.length === 0) {
        console.log('Aucun historique de visionnage, retour des tendances');
        return this.getTrendingContent(allContent, limit);
      }
      
      // Calculer les scores de recommandation pour chaque élément
      const scoredContent = allContent.map(item => {
        // Éviter de recommander du contenu déjà vu récemment
        const recentlyWatched = this.watchHistory
          .slice(0, 10)
          .some(historyItem => historyItem.id === item.id);
        
        if (recentlyWatched) {
          return { ...item, score: -1 };
        }
        
        // Calculer le score basé sur les préférences utilisateur
        let score = 0;
        
        // Score basé sur le genre
        if (item.genre) {
          const genres = Array.isArray(item.genre) ? item.genre : [item.genre];
          genres.forEach(genre => {
            score += this.userPreferences.genres[genre] || 0;
          });
        }
        
        // Score basé sur les acteurs
        if (item.actors) {
          item.actors.forEach(actor => {
            score += this.userPreferences.actors[actor] || 0;
          });
        }
        
        // Score basé sur les réalisateurs
        if (item.director) {
          const directors = Array.isArray(item.director) ? item.director : [item.director];
          directors.forEach(director => {
            score += this.userPreferences.directors[director] || 0;
          });
        }
        
        // Score basé sur la catégorie
        if (item.category) {
          score += this.userPreferences.categories[item.category] || 0;
        }
        
        // Bonus pour les favoris
        if (this.favoritesService.isFavorite(item.id)) {
          score += 5;
        }
        
        return { ...item, score };
      });
      
      // Filtrer les éléments avec un score positif et trier par score
      const recommendations = scoredContent
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // Si nous n'avons pas assez de recommandations, compléter avec des tendances
      if (recommendations.length < limit) {
        const trending = this.getTrendingContent(
          allContent.filter(item => !recommendations.some(rec => rec.id === item.id)),
          limit - recommendations.length
        );
        
        return [...recommendations, ...trending];
      }
      
      return recommendations;
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      return [];
    }
  }

  // Obtenir le contenu tendance
  getTrendingContent(content, limit = 10) {
    // Simuler des tendances en sélectionnant des éléments aléatoires
    // Dans un système réel, cela serait basé sur la popularité, les vues, etc.
    const shuffled = [...content].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  // Obtenir des recommandations basées sur un élément spécifique
  async getSimilarContent(contentItem, limit = 6) {
    try {
      // Récupérer tout le contenu disponible
      const allContent = await this.contentDataService.getAllContent();
      
      // Filtrer l'élément actuel
      const otherContent = allContent.filter(item => item.id !== contentItem.id);
      
      // Calculer les scores de similarité
      const scoredContent = otherContent.map(item => {
        let similarityScore = 0;
        
        // Même type
        if (item.type === contentItem.type) {
          similarityScore += 2;
        }
        
        // Même catégorie
        if (item.category === contentItem.category) {
          similarityScore += 3;
        }
        
        // Genres communs
        if (item.genre && contentItem.genre) {
          const itemGenres = Array.isArray(item.genre) ? item.genre : [item.genre];
          const contentGenres = Array.isArray(contentItem.genre) ? contentItem.genre : [contentItem.genre];
          
          itemGenres.forEach(genre => {
            if (contentGenres.includes(genre)) {
              similarityScore += 2;
            }
          });
        }
        
        // Acteurs communs
        if (item.actors && contentItem.actors) {
          item.actors.forEach(actor => {
            if (contentItem.actors.includes(actor)) {
              similarityScore += 2;
            }
          });
        }
        
        // Même réalisateur
        if (item.director && contentItem.director) {
          const itemDirectors = Array.isArray(item.director) ? item.director : [item.director];
          const contentDirectors = Array.isArray(contentItem.director) ? contentItem.director : [contentItem.director];
          
          itemDirectors.forEach(director => {
            if (contentDirectors.includes(director)) {
              similarityScore += 3;
            }
          });
        }
        
        // Année proche
        if (item.year && contentItem.year) {
          const yearDiff = Math.abs(parseInt(item.year) - parseInt(contentItem.year));
          if (yearDiff <= 3) {
            similarityScore += 1;
          }
        }
        
        return { ...item, similarityScore };
      });
      
      // Trier par score de similarité et limiter
      return scoredContent
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations similaires:', error);
      return [];
    }
  }

  // Obtenir l'historique de visionnage
  getWatchHistory(limit = 20) {
    return this.watchHistory.slice(0, limit);
  }

  // Obtenir les préférences utilisateur
  getUserPreferences() {
    return { ...this.userPreferences };
  }

  // Obtenir les genres préférés de l'utilisateur
  getFavoriteGenres(limit = 5) {
    return Object.entries(this.userPreferences.genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genre]) => genre);
  }

  // Réinitialiser les préférences utilisateur
  resetUserPreferences() {
    this.userPreferences = {
      genres: {},
      actors: {},
      directors: {},
      categories: {}
    };
    this.saveUserPreferences();
    console.log('Préférences utilisateur réinitialisées');
  }

  // Effacer l'historique de visionnage
  clearWatchHistory() {
    this.watchHistory = [];
    this.saveWatchHistory();
    console.log('Historique de visionnage effacé');
  }

  // Générer des recommandations basées sur l'IA (simulation)
  async getAIRecommendations(userQuery, limit = 10) {
    try {
      // Dans un système réel, cette fonction appellerait une API d'IA
      // Pour l'instant, nous simulons une réponse basée sur les préférences
      
      // Récupérer tout le contenu disponible
      const allContent = await this.contentDataService.getAllContent();
      
      // Obtenir les genres préférés
      const favoriteGenres = this.getFavoriteGenres();
      
      // Filtrer le contenu correspondant aux genres préférés
      let filteredContent = allContent;
      if (favoriteGenres.length > 0) {
        filteredContent = allContent.filter(item => {
          if (!item.genre) return false;
          const itemGenres = Array.isArray(item.genre) ? item.genre : [item.genre];
          return itemGenres.some(genre => favoriteGenres.includes(genre));
        });
      }
      
      // Si la requête utilisateur contient des mots-clés, filtrer davantage
      if (userQuery && userQuery.trim() !== '') {
        const keywords = userQuery.toLowerCase().split(/\s+/);
        filteredContent = filteredContent.filter(item => {
          const searchableText = [
            item.title,
            item.category,
            item.type,
            ...(item.genre ? (Array.isArray(item.genre) ? item.genre : [item.genre]) : []),
            ...(item.actors || []),
            ...(item.director ? (Array.isArray(item.director) ? item.director : [item.director]) : []),
            item.year
          ].join(' ').toLowerCase();
          
          return keywords.some(keyword => searchableText.includes(keyword));
        });
      }
      
      // Mélanger et limiter les résultats
      const shuffled = [...filteredContent].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations IA:', error);
      return [];
    }
  }
}
