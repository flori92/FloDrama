// Service de recommandations personnalisées pour FloDrama
// Implémente un système de recommandations basé sur l'IA et les préférences utilisateur

/**
 * Service de recommandations personnalisées
 * @class RecommendationService
 */
export class RecommendationService {
  /**
   * Constructeur du service de recommandations
   * @param {ContentDataService} contentDataService - Service de données de contenu
   * @param {FavoritesService} favoritesService - Service de favoris
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.preferencesKey - Clé pour les préférences (défaut: 'user_preferences')
   * @param {string} config.historyKey - Clé pour l'historique (défaut: 'watch_history')
   */
  constructor(contentDataService, favoritesService, storageService = null, config = {}) {
    this.contentDataService = contentDataService;
    this.favoritesService = favoritesService;
    this.storageService = storageService;
    this.preferencesKey = config.preferencesKey || 'user_preferences';
    this.historyKey = config.historyKey || 'watch_history';
    
    // Initialiser les préférences et l'historique
    this.userPreferences = {
      genres: {},
      actors: {},
      directors: {},
      categories: {},
      lastUpdated: null
    };
    
    this.watchHistory = [];
    
    // Charger les données
    this._loadUserData();
    
    console.log('RecommendationService initialisé');
  }
  
  /**
   * Charger les données utilisateur
   * @private
   */
  async _loadUserData() {
    await Promise.all([
      this._loadUserPreferences(),
      this._loadWatchHistory()
    ]);
  }
  
  /**
   * Charger les préférences utilisateur
   * @private
   */
  async _loadUserPreferences() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        const preferences = await this.storageService.get(this.preferencesKey);
        if (preferences) {
          this.userPreferences = preferences;
        }
      } else {
        // Fallback sur localStorage
        const storedPreferences = localStorage.getItem(`flodrama_${this.preferencesKey}`);
        if (storedPreferences) {
          this.userPreferences = JSON.parse(storedPreferences);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences utilisateur:', error);
      // Garder les préférences par défaut
    }
  }
  
  /**
   * Charger l'historique de visionnage
   * @private
   */
  async _loadWatchHistory() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        const history = await this.storageService.get(this.historyKey);
        if (history) {
          this.watchHistory = history;
        }
      } else {
        // Fallback sur localStorage
        const storedHistory = localStorage.getItem(`flodrama_${this.historyKey}`);
        if (storedHistory) {
          this.watchHistory = JSON.parse(storedHistory);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique de visionnage:', error);
      // Garder l'historique par défaut (vide)
    }
  }
  
  /**
   * Sauvegarder les préférences utilisateur
   * @private
   */
  async _saveUserPreferences() {
    try {
      // Mettre à jour la date de dernière modification
      this.userPreferences.lastUpdated = new Date().toISOString();
      
      if (this.storageService) {
        // Utiliser le service de stockage
        await this.storageService.set(this.preferencesKey, this.userPreferences);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(
          `flodrama_${this.preferencesKey}`, 
          JSON.stringify(this.userPreferences)
        );
      }
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('user-preferences-updated', {
        detail: { preferences: this.userPreferences }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences utilisateur:', error);
    }
  }
  
  /**
   * Sauvegarder l'historique de visionnage
   * @private
   */
  async _saveWatchHistory() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        await this.storageService.set(this.historyKey, this.watchHistory);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(
          `flodrama_${this.historyKey}`, 
          JSON.stringify(this.watchHistory)
        );
      }
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('watch-history-updated', {
        detail: { history: this.watchHistory }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique de visionnage:', error);
    }
  }
  
  /**
   * Mettre à jour les préférences utilisateur en fonction du contenu visionné
   * @param {Object} contentItem - Élément de contenu
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async updatePreferences(contentItem) {
    if (!contentItem) {
      console.error('Élément de contenu non fourni pour updatePreferences');
      return false;
    }
    
    try {
      // Mettre à jour les préférences de genre
      if (contentItem.genre) {
        const genres = Array.isArray(contentItem.genre) ? contentItem.genre : [contentItem.genre];
        genres.forEach(genre => {
          if (genre) {
            this.userPreferences.genres[genre] = (this.userPreferences.genres[genre] || 0) + 1;
          }
        });
      }
      
      // Mettre à jour les préférences d'acteurs
      if (contentItem.actors) {
        contentItem.actors.forEach(actor => {
          if (actor) {
            this.userPreferences.actors[actor] = (this.userPreferences.actors[actor] || 0) + 1;
          }
        });
      }
      
      // Mettre à jour les préférences de réalisateurs
      if (contentItem.director) {
        const directors = Array.isArray(contentItem.director) ? contentItem.director : [contentItem.director];
        directors.forEach(director => {
          if (director) {
            this.userPreferences.directors[director] = (this.userPreferences.directors[director] || 0) + 1;
          }
        });
      }
      
      // Mettre à jour les préférences de catégories
      if (contentItem.category) {
        this.userPreferences.categories[contentItem.category] = 
          (this.userPreferences.categories[contentItem.category] || 0) + 1;
      }
      
      // Sauvegarder les préférences mises à jour
      await this._saveUserPreferences();
      
      console.log('Préférences utilisateur mises à jour');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      return false;
    }
  }

  /**
   * Ajouter un élément à l'historique de visionnage
   * @param {Object} contentItem - Élément de contenu
   * @param {Object} options - Options
   * @param {number} options.progress - Progression en pourcentage
   * @param {boolean} options.completed - Indique si le visionnage est terminé
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async addToWatchHistory(contentItem, options = {}) {
    if (!contentItem || !contentItem.id) {
      console.error('Élément de contenu invalide pour addToWatchHistory');
      return false;
    }
    
    try {
      // Vérifier si l'élément est déjà dans l'historique
      const existingIndex = this.watchHistory.findIndex(item => item.id === contentItem.id);
      
      // Déterminer la progression
      let progress = options.progress || 0;
      if (options.completed) {
        progress = 100;
      }
      
      // Créer l'entrée d'historique
      const historyEntry = {
        id: contentItem.id,
        title: contentItem.title || `Élément ${contentItem.id}`,
        type: contentItem.type || 'unknown',
        image: contentItem.image || null,
        watchedAt: new Date().toISOString(),
        progress: progress,
        metadata: {
          category: contentItem.category || null,
          genre: contentItem.genre || null,
          year: contentItem.year || null
        }
      };
      
      // Mettre à jour ou ajouter l'entrée
      if (existingIndex !== -1) {
        // Ne mettre à jour que si la progression est supérieure
        if (progress > this.watchHistory[existingIndex].progress) {
          this.watchHistory[existingIndex] = {
            ...this.watchHistory[existingIndex],
            ...historyEntry
          };
        } else {
          // Mettre à jour uniquement la date de visionnage
          this.watchHistory[existingIndex].watchedAt = historyEntry.watchedAt;
        }
      } else {
        // Ajouter une nouvelle entrée
        this.watchHistory.unshift(historyEntry);
      }
      
      // Limiter la taille de l'historique
      if (this.watchHistory.length > 100) {
        this.watchHistory = this.watchHistory.slice(0, 100);
      }
      
      // Sauvegarder l'historique
      await this._saveWatchHistory();
      
      // Mettre à jour les préférences utilisateur
      if (progress > 50) {
        await this.updatePreferences(contentItem);
      }
      
      console.log(`Élément ajouté à l'historique: ${historyEntry.title}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
      return false;
    }
  }
  
  /**
   * Obtenir les recommandations personnalisées
   * @param {Object} options - Options
   * @param {number} options.limit - Nombre d'éléments à récupérer
   * @param {boolean} options.includeWatched - Inclure les éléments déjà visionnés
   * @returns {Promise<Array>} - Liste des recommandations
   */
  async getPersonalizedRecommendations(options = {}) {
    const { limit = 10, includeWatched = false } = options;
    
    try {
      // Récupérer tout le contenu disponible
      const allContent = await this.contentDataService.getAllContent();
      
      // Si pas de préférences ou d'historique, retourner les tendances
      if (Object.keys(this.userPreferences.genres).length === 0 && 
          this.watchHistory.length === 0) {
        return this.getTrendingContent(allContent, limit);
      }
      
      // Obtenir les IDs des éléments déjà visionnés
      const watchedIds = new Set(this.watchHistory.map(item => item.id));
      
      // Filtrer le contenu selon les préférences
      let filteredContent = allContent;
      
      // Exclure les éléments déjà visionnés si demandé
      if (!includeWatched) {
        filteredContent = filteredContent.filter(item => !watchedIds.has(item.id));
      }
      
      // Calculer un score pour chaque élément
      const scoredContent = filteredContent.map(item => {
        let score = 0;
        
        // Score basé sur les genres
        if (item.genre) {
          const genres = Array.isArray(item.genre) ? item.genre : [item.genre];
          genres.forEach(genre => {
            if (this.userPreferences.genres[genre]) {
              score += this.userPreferences.genres[genre] * 2;
            }
          });
        }
        
        // Score basé sur les acteurs
        if (item.actors) {
          item.actors.forEach(actor => {
            if (this.userPreferences.actors[actor]) {
              score += this.userPreferences.actors[actor] * 1.5;
            }
          });
        }
        
        // Score basé sur les réalisateurs
        if (item.director) {
          const directors = Array.isArray(item.director) ? item.director : [item.director];
          directors.forEach(director => {
            if (this.userPreferences.directors[director]) {
              score += this.userPreferences.directors[director] * 3;
            }
          });
        }
        
        // Score basé sur la catégorie
        if (item.category && this.userPreferences.categories[item.category]) {
          score += this.userPreferences.categories[item.category];
        }
        
        // Score basé sur les favoris
        if (this.favoritesService && this.favoritesService.isFavorite(item.id)) {
          score += 5;
        }
        
        // Bonus pour les nouveautés
        if (item.year === new Date().getFullYear().toString()) {
          score += 2;
        }
        
        // Bonus pour les contenus bien notés
        if (item.rating && item.rating > 8) {
          score += (item.rating - 8) * 2;
        }
        
        return { ...item, recommendationScore: score };
      });
      
      // Trier par score et limiter
      const recommendations = scoredContent
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
      
      console.log(`${recommendations.length} recommandations personnalisées générées`);
      return recommendations;
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      return [];
    }
  }
  
  /**
   * Obtenir le contenu tendance
   * @param {Array} content - Liste de contenu
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Array} - Liste des tendances
   */
  getTrendingContent(content, limit = 10) {
    if (!content || !Array.isArray(content)) {
      return [];
    }
    
    // Simuler un algorithme de tendance (les plus récents avec les meilleures notes)
    return [...content]
      .sort((a, b) => {
        // Combiner l'année et la note pour le tri
        const scoreA = (parseInt(a.year) || 0) * 10 + (a.rating || 0);
        const scoreB = (parseInt(b.year) || 0) * 10 + (b.rating || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
  
  /**
   * Obtenir des recommandations basées sur un élément spécifique
   * @param {Object} contentItem - Élément de contenu
   * @param {Object} options - Options
   * @param {number} options.limit - Nombre d'éléments à récupérer
   * @param {boolean} options.includeWatched - Inclure les éléments déjà visionnés
   * @returns {Promise<Array>} - Liste des recommandations
   */
  async getSimilarContent(contentItem, options = {}) {
    const { limit = 6, includeWatched = false } = options;
    
    if (!contentItem) {
      console.error('Élément de contenu non fourni pour getSimilarContent');
      return [];
    }
    
    try {
      // Utiliser le service de contenu si disponible
      if (this.contentDataService.getSimilarContent) {
        return await this.contentDataService.getSimilarContent(contentItem, limit);
      }
      
      // Implémentation de secours
      const allContent = await this.contentDataService.getAllContent();
      
      // Obtenir les IDs des éléments déjà visionnés
      const watchedIds = new Set(this.watchHistory.map(item => item.id));
      
      // Exclure l'élément de référence et les éléments déjà visionnés si demandé
      let otherContent = allContent.filter(item => item.id !== contentItem.id);
      
      if (!includeWatched) {
        otherContent = otherContent.filter(item => !watchedIds.has(item.id));
      }
      
      // Calculer un score de similarité pour chaque élément
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
  
  /**
   * Obtenir l'historique de visionnage
   * @param {number} limit - Limite
   * @returns {Array} - Historique de visionnage
   */
  getWatchHistory(limit = 20) {
    return this.watchHistory.slice(0, limit);
  }
  
  /**
   * Obtenir les préférences utilisateur
   * @returns {Object} - Préférences utilisateur
   */
  getUserPreferences() {
    return { ...this.userPreferences };
  }
  
  /**
   * Obtenir les genres préférés de l'utilisateur
   * @param {number} limit - Limite
   * @returns {Array} - Liste des genres préférés
   */
  getFavoriteGenres(limit = 5) {
    return Object.entries(this.userPreferences.genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genre]) => genre);
  }
  
  /**
   * Réinitialiser les préférences utilisateur
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async resetUserPreferences() {
    try {
      this.userPreferences = {
        genres: {},
        actors: {},
        directors: {},
        categories: {},
        lastUpdated: new Date().toISOString()
      };
      
      await this._saveUserPreferences();
      console.log('Préférences utilisateur réinitialisées');
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des préférences:', error);
      return false;
    }
  }
  
  /**
   * Effacer l'historique de visionnage
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clearWatchHistory() {
    try {
      this.watchHistory = [];
      await this._saveWatchHistory();
      console.log('Historique de visionnage effacé');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'historique:', error);
      return false;
    }
  }
  
  /**
   * Générer des recommandations basées sur l'IA (simulation)
   * @param {string} userQuery - Requête utilisateur
   * @param {Object} options - Options
   * @param {number} options.limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} - Liste des recommandations
   */
  async getAIRecommendations(userQuery, options = {}) {
    const { limit = 10 } = options;
    
    if (!userQuery || userQuery.trim() === '') {
      return [];
    }
    
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
      
      // Filtrer par la requête utilisateur
      const keywords = userQuery.toLowerCase().split(/\s+/);
      filteredContent = filteredContent.filter(item => {
        const searchableText = [
          item.title,
          item.category,
          item.type,
          ...(item.genre ? (Array.isArray(item.genre) ? item.genre : [item.genre]) : []),
          ...(item.actors || []),
          ...(item.director ? (Array.isArray(item.director) ? item.director : [item.director]) : []),
          item.year,
          item.description
        ].join(' ').toLowerCase();
        
        return keywords.some(keyword => searchableText.includes(keyword));
      });
      
      // Calculer un score de pertinence
      const scoredContent = filteredContent.map(item => {
        let relevanceScore = 0;
        
        // Score basé sur la correspondance des mots-clés
        keywords.forEach(keyword => {
          // Titre contient le mot-clé
          if (item.title.toLowerCase().includes(keyword)) {
            relevanceScore += 5;
          }
          
          // Description contient le mot-clé
          if (item.description && item.description.toLowerCase().includes(keyword)) {
            relevanceScore += 2;
          }
          
          // Genre contient le mot-clé
          if (item.genre) {
            const genres = Array.isArray(item.genre) ? item.genre : [item.genre];
            if (genres.some(genre => genre.toLowerCase().includes(keyword))) {
              relevanceScore += 3;
            }
          }
        });
        
        // Bonus pour les préférences utilisateur
        if (item.genre) {
          const genres = Array.isArray(item.genre) ? item.genre : [item.genre];
          genres.forEach(genre => {
            if (this.userPreferences.genres[genre]) {
              relevanceScore += this.userPreferences.genres[genre];
            }
          });
        }
        
        return { ...item, relevanceScore };
      });
      
      // Trier par score de pertinence et limiter
      return scoredContent
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations IA:', error);
      return [];
    }
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default RecommendationService;
