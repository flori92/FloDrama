/**
 * @file RecommendationService.js
 * @description Service de recommandations personnalisées pour FloDrama
 * Ce service analyse les préférences utilisateur, l'historique de visionnage et génère des suggestions personnalisées
 */

import { ContentDataService } from '../content/ContentDataService.js';

export class RecommendationService {
  /**
   * Initialise le service de recommandations
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    this.contentService = new ContentDataService();
    this.userPreferencesKey = 'flodrama_user_preferences';
    this.watchHistoryKey = 'flodrama_watch_history';
    this.options = {
      useAI: options.useAI !== undefined ? options.useAI : false,
      weightFactors: {
        genre: options.weightFactors?.genre || 0.4,
        actors: options.weightFactors?.actors || 0.2,
        director: options.weightFactors?.director || 0.1,
        recency: options.weightFactors?.recency || 0.2,
        popularity: options.weightFactors?.popularity || 0.1
      }
    };
  }

  /**
   * Récupère les recommandations personnalisées pour l'utilisateur
   * @param {number} limit - Nombre maximum de recommandations à retourner
   * @returns {Promise<Array>} - Liste des contenus recommandés
   */
  async getPersonalizedRecommendations(limit = 10) {
    try {
      // Récupérer les préférences utilisateur et l'historique
      const userPreferences = this.getUserPreferences();
      const watchHistory = this.getWatchHistory();
      
      // Si aucune donnée utilisateur n'est disponible, retourner des recommandations générales
      if (!userPreferences && (!watchHistory || watchHistory.length === 0)) {
        return this.getGeneralRecommendations(limit);
      }
      
      // Récupérer tous les contenus disponibles
      const allContent = await this.contentService.getAllContent();
      
      // Filtrer les contenus déjà vus (sauf si ce sont des séries avec de nouveaux épisodes)
      const unwatchedContent = this.filterUnwatchedContent(allContent, watchHistory);
      
      // Calculer les scores de pertinence pour chaque contenu
      const scoredContent = this.calculateRelevanceScores(unwatchedContent, userPreferences);
      
      // Trier par score et limiter le nombre de résultats
      return scoredContent
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        .map(({ relevanceScore, ...contentWithoutScore }) => contentWithoutScore);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      return this.getGeneralRecommendations(limit);
    }
  }

  /**
   * Récupère des recommandations générales (non personnalisées)
   * @param {number} limit - Nombre maximum de recommandations à retourner
   * @returns {Promise<Array>} - Liste des contenus recommandés
   */
  async getGeneralRecommendations(limit = 10) {
    try {
      // Récupérer les contenus les plus populaires
      const popularContent = await this.contentService.getContentByFilter({
        sortBy: 'popularity',
        limit
      });
      
      return popularContent;
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations générales:', error);
      return [];
    }
  }

  /**
   * Récupère des recommandations similaires à un contenu spécifique
   * @param {string} contentId - ID du contenu de référence
   * @param {number} limit - Nombre maximum de recommandations à retourner
   * @returns {Promise<Array>} - Liste des contenus similaires
   */
  async getSimilarContent(contentId, limit = 6) {
    try {
      // Récupérer le contenu de référence
      const referenceContent = await this.contentService.getContentById(contentId);
      
      if (!referenceContent) {
        throw new Error(`Contenu avec l'ID ${contentId} non trouvé`);
      }
      
      // Récupérer tous les contenus disponibles
      const allContent = await this.contentService.getAllContent();
      
      // Exclure le contenu de référence
      const otherContent = allContent.filter(item => item.id !== contentId);
      
      // Calculer les scores de similarité
      const scoredContent = this.calculateSimilarityScores(otherContent, referenceContent);
      
      // Trier par score et limiter le nombre de résultats
      return scoredContent
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit)
        .map(({ similarityScore, ...contentWithoutScore }) => contentWithoutScore);
    } catch (error) {
      console.error('Erreur lors de la récupération des contenus similaires:', error);
      return [];
    }
  }

  /**
   * Récupère les recommandations basées sur une description textuelle
   * @param {string} description - Description textuelle des préférences
   * @param {number} limit - Nombre maximum de recommandations à retourner
   * @returns {Promise<Array>} - Liste des contenus recommandés
   */
  async getRecommendationsByDescription(description, limit = 10) {
    try {
      if (!description || description.trim() === '') {
        return this.getGeneralRecommendations(limit);
      }
      
      // Si l'IA n'est pas activée, utiliser une recherche par mots-clés
      if (!this.options.useAI) {
        return this.getRecommendationsByKeywords(description, limit);
      }
      
      // Implémenter ici l'intégration avec un service d'IA pour l'analyse de texte
      // Pour l'instant, utiliser la recherche par mots-clés comme fallback
      return this.getRecommendationsByKeywords(description, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations par description:', error);
      return this.getGeneralRecommendations(limit);
    }
  }

  /**
   * Récupère les recommandations basées sur des mots-clés
   * @param {string} keywords - Mots-clés de recherche
   * @param {number} limit - Nombre maximum de recommandations à retourner
   * @returns {Promise<Array>} - Liste des contenus recommandés
   */
  async getRecommendationsByKeywords(keywords, limit = 10) {
    try {
      // Extraire les mots-clés significatifs
      const keywordList = this.extractKeywords(keywords);
      
      // Récupérer tous les contenus disponibles
      const allContent = await this.contentService.getAllContent();
      
      // Calculer les scores de pertinence basés sur les mots-clés
      const scoredContent = allContent.map(item => {
        const score = this.calculateKeywordMatchScore(item, keywordList);
        return { ...item, keywordScore: score };
      });
      
      // Trier par score et limiter le nombre de résultats
      return scoredContent
        .filter(item => item.keywordScore > 0) // Ignorer les contenus sans correspondance
        .sort((a, b) => b.keywordScore - a.keywordScore)
        .slice(0, limit)
        .map(({ keywordScore, ...contentWithoutScore }) => contentWithoutScore);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations par mots-clés:', error);
      return this.getGeneralRecommendations(limit);
    }
  }

  /**
   * Extrait les mots-clés significatifs d'une chaîne de texte
   * @param {string} text - Texte à analyser
   * @returns {Array<string>} - Liste des mots-clés
   */
  extractKeywords(text) {
    if (!text) return [];
    
    // Convertir en minuscules et supprimer la ponctuation
    const cleanText = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    
    // Diviser en mots
    const words = cleanText.split(/\s+/);
    
    // Filtrer les mots vides (stop words)
    const stopWords = [
      'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'au', 'aux',
      'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
      'ce', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
      'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
      'que', 'qui', 'quoi', 'dont', 'où',
      'avec', 'sans', 'pour', 'par', 'en', 'dans', 'sur', 'sous',
      'est', 'sont', 'être', 'avoir',
      'a', 'à', 'ai', 'as', 'avons', 'avez', 'ont',
      'suis', 'es', 'est', 'sommes', 'êtes', 'sont'
    ];
    
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Calcule le score de correspondance entre un contenu et une liste de mots-clés
   * @param {Object} content - Contenu à évaluer
   * @param {Array<string>} keywords - Liste des mots-clés
   * @returns {number} - Score de correspondance
   */
  calculateKeywordMatchScore(content, keywords) {
    if (!keywords || keywords.length === 0) return 0;
    
    let score = 0;
    
    // Textes à analyser dans le contenu
    const textsToSearch = [
      content.title || '',
      content.description || '',
      content.genre || '',
      content.actors?.join(' ') || '',
      content.director || '',
      content.tags?.join(' ') || ''
    ].map(text => text.toLowerCase());
    
    // Calculer le score pour chaque mot-clé
    keywords.forEach(keyword => {
      // Points pour les correspondances exactes
      textsToSearch.forEach((text, index) => {
        // Donner plus de poids au titre et au genre
        const fieldWeight = index === 0 ? 3 : // Titre
                           index === 2 ? 2 : // Genre
                           1; // Autres champs
        
        if (text.includes(keyword)) {
          // Correspondance exacte
          score += fieldWeight;
          
          // Bonus pour les mots entiers
          if (new RegExp(`\\b${keyword}\\b`).test(text)) {
            score += fieldWeight * 0.5;
          }
        }
      });
    });
    
    return score;
  }

  /**
   * Filtre les contenus pour exclure ceux déjà vus
   * @param {Array} allContent - Tous les contenus disponibles
   * @param {Array} watchHistory - Historique de visionnage
   * @returns {Array} - Contenus non visionnés
   */
  filterUnwatchedContent(allContent, watchHistory) {
    if (!watchHistory || watchHistory.length === 0) {
      return allContent;
    }
    
    // Créer un ensemble des IDs de contenu vus
    const watchedIds = new Set(watchHistory.map(item => item.contentId));
    
    // Créer un ensemble des séries vues avec leur dernier épisode
    const watchedSeries = {};
    watchHistory.forEach(item => {
      if (item.episodeNumber) {
        if (!watchedSeries[item.contentId] || item.episodeNumber > watchedSeries[item.contentId]) {
          watchedSeries[item.contentId] = item.episodeNumber;
        }
      }
    });
    
    return allContent.filter(content => {
      // Si c'est une série avec des épisodes
      if (content.episodesAvailable > 1) {
        // Inclure si de nouveaux épisodes sont disponibles
        const lastWatchedEpisode = watchedSeries[content.id] || 0;
        return lastWatchedEpisode < content.episodesAvailable;
      }
      
      // Sinon, inclure si pas encore vu
      return !watchedIds.has(content.id);
    });
  }

  /**
   * Calcule les scores de pertinence pour chaque contenu
   * @param {Array} contents - Contenus à évaluer
   * @param {Object} preferences - Préférences utilisateur
   * @returns {Array} - Contenus avec scores de pertinence
   */
  calculateRelevanceScores(contents, preferences) {
    if (!contents || contents.length === 0) {
      return [];
    }
    
    // Si aucune préférence n'est disponible, utiliser uniquement la popularité
    if (!preferences) {
      return contents.map(content => ({
        ...content,
        relevanceScore: content.popularity || 0.5
      }));
    }
    
    const { favoriteGenres, favoriteActors, favoriteDirectors } = preferences;
    
    return contents.map(content => {
      let score = 0;
      
      // Score basé sur le genre
      if (favoriteGenres && content.genre) {
        const genreScore = this.calculateGenreScore(content.genre, favoriteGenres);
        score += genreScore * this.options.weightFactors.genre;
      }
      
      // Score basé sur les acteurs
      if (favoriteActors && content.actors) {
        const actorsScore = this.calculateActorsScore(content.actors, favoriteActors);
        score += actorsScore * this.options.weightFactors.actors;
      }
      
      // Score basé sur le réalisateur
      if (favoriteDirectors && content.director) {
        const directorScore = this.calculateDirectorScore(content.director, favoriteDirectors);
        score += directorScore * this.options.weightFactors.director;
      }
      
      // Score basé sur la récence
      const recencyScore = this.calculateRecencyScore(content.releaseDate);
      score += recencyScore * this.options.weightFactors.recency;
      
      // Score basé sur la popularité
      score += (content.popularity || 0.5) * this.options.weightFactors.popularity;
      
      return {
        ...content,
        relevanceScore: score
      };
    });
  }

  /**
   * Calcule les scores de similarité entre des contenus et un contenu de référence
   * @param {Array} contents - Contenus à évaluer
   * @param {Object} referenceContent - Contenu de référence
   * @returns {Array} - Contenus avec scores de similarité
   */
  calculateSimilarityScores(contents, referenceContent) {
    if (!contents || contents.length === 0 || !referenceContent) {
      return [];
    }
    
    return contents.map(content => {
      let score = 0;
      
      // Similarité de genre (40%)
      if (content.genre && referenceContent.genre) {
        if (content.genre === referenceContent.genre) {
          score += 0.4;
        }
      }
      
      // Similarité d'acteurs (20%)
      if (content.actors && referenceContent.actors) {
        const commonActors = content.actors.filter(actor => 
          referenceContent.actors.includes(actor)
        );
        
        if (commonActors.length > 0) {
          score += 0.2 * (commonActors.length / Math.min(content.actors.length, referenceContent.actors.length));
        }
      }
      
      // Similarité de réalisateur (15%)
      if (content.director && referenceContent.director && 
          content.director === referenceContent.director) {
        score += 0.15;
      }
      
      // Similarité de type (15%)
      if (content.type && referenceContent.type && 
          content.type === referenceContent.type) {
        score += 0.15;
      }
      
      // Similarité d'année (10%)
      if (content.year && referenceContent.year) {
        const yearDiff = Math.abs(content.year - referenceContent.year);
        if (yearDiff <= 5) {
          score += 0.1 * (1 - yearDiff / 5);
        }
      }
      
      return {
        ...content,
        similarityScore: score
      };
    });
  }

  /**
   * Calcule un score basé sur la correspondance de genre
   * @param {string} contentGenre - Genre du contenu
   * @param {Array} favoriteGenres - Genres préférés de l'utilisateur
   * @returns {number} - Score de correspondance
   */
  calculateGenreScore(contentGenre, favoriteGenres) {
    if (!contentGenre || !favoriteGenres || favoriteGenres.length === 0) {
      return 0;
    }
    
    // Normaliser le genre du contenu
    const normalizedContentGenre = contentGenre.toLowerCase();
    
    // Vérifier si le genre est dans les favoris
    for (const genre of favoriteGenres) {
      if (normalizedContentGenre.includes(genre.toLowerCase())) {
        // Donner un score plus élevé pour une correspondance exacte
        if (normalizedContentGenre === genre.toLowerCase()) {
          return 1.0;
        }
        return 0.8;
      }
    }
    
    return 0;
  }

  /**
   * Calcule un score basé sur la correspondance d'acteurs
   * @param {Array} contentActors - Acteurs du contenu
   * @param {Array} favoriteActors - Acteurs préférés de l'utilisateur
   * @returns {number} - Score de correspondance
   */
  calculateActorsScore(contentActors, favoriteActors) {
    if (!contentActors || !favoriteActors || 
        contentActors.length === 0 || favoriteActors.length === 0) {
      return 0;
    }
    
    // Normaliser les noms d'acteurs
    const normalizedContentActors = contentActors.map(actor => actor.toLowerCase());
    const normalizedFavoriteActors = favoriteActors.map(actor => actor.toLowerCase());
    
    // Compter les acteurs favoris présents dans le contenu
    const commonActors = normalizedContentActors.filter(actor => 
      normalizedFavoriteActors.some(favActor => actor.includes(favActor))
    );
    
    if (commonActors.length === 0) {
      return 0;
    }
    
    // Le score est proportionnel au nombre d'acteurs favoris présents
    return Math.min(1, commonActors.length / 3);
  }

  /**
   * Calcule un score basé sur la correspondance de réalisateur
   * @param {string} contentDirector - Réalisateur du contenu
   * @param {Array} favoriteDirectors - Réalisateurs préférés de l'utilisateur
   * @returns {number} - Score de correspondance
   */
  calculateDirectorScore(contentDirector, favoriteDirectors) {
    if (!contentDirector || !favoriteDirectors || favoriteDirectors.length === 0) {
      return 0;
    }
    
    // Normaliser le nom du réalisateur
    const normalizedContentDirector = contentDirector.toLowerCase();
    
    // Vérifier si le réalisateur est dans les favoris
    for (const director of favoriteDirectors) {
      if (normalizedContentDirector.includes(director.toLowerCase())) {
        // Donner un score plus élevé pour une correspondance exacte
        if (normalizedContentDirector === director.toLowerCase()) {
          return 1.0;
        }
        return 0.8;
      }
    }
    
    return 0;
  }

  /**
   * Calcule un score basé sur la récence du contenu
   * @param {string|Date} releaseDate - Date de sortie du contenu
   * @returns {number} - Score de récence
   */
  calculateRecencyScore(releaseDate) {
    if (!releaseDate) {
      return 0.5; // Score moyen pour les contenus sans date
    }
    
    const now = new Date();
    const contentDate = new Date(releaseDate);
    
    // Vérifier si la date est valide
    if (isNaN(contentDate.getTime())) {
      return 0.5;
    }
    
    // Calculer la différence en années
    const yearDiff = (now - contentDate) / (1000 * 60 * 60 * 24 * 365);
    
    // Les contenus de moins d'un an obtiennent un score élevé
    if (yearDiff < 1) {
      return 1.0;
    }
    
    // Les contenus de moins de 3 ans obtiennent un score dégressif
    if (yearDiff < 3) {
      return 1.0 - (yearDiff - 1) / 2;
    }
    
    // Les contenus plus anciens obtiennent un score minimal
    return 0.2;
  }

  /**
   * Récupère les préférences utilisateur depuis le stockage local
   * @returns {Object|null} - Préférences utilisateur
   */
  getUserPreferences() {
    try {
      const preferencesJson = localStorage.getItem(this.userPreferencesKey);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupère l'historique de visionnage depuis le stockage local
   * @returns {Array|null} - Historique de visionnage
   */
  getWatchHistory() {
    try {
      const historyJson = localStorage.getItem(this.watchHistoryKey);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique de visionnage:', error);
      return [];
    }
  }

  /**
   * Met à jour les préférences utilisateur
   * @param {Object} preferences - Nouvelles préférences
   */
  updateUserPreferences(preferences) {
    try {
      const currentPreferences = this.getUserPreferences() || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };
      localStorage.setItem(this.userPreferencesKey, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences utilisateur:', error);
    }
  }

  /**
   * Ajoute un élément à l'historique de visionnage
   * @param {Object} watchItem - Élément à ajouter à l'historique
   */
  addToWatchHistory(watchItem) {
    try {
      if (!watchItem || !watchItem.contentId) {
        throw new Error('Données de visionnage invalides');
      }
      
      const history = this.getWatchHistory() || [];
      
      // Vérifier si l'élément existe déjà
      const existingIndex = history.findIndex(item => 
        item.contentId === watchItem.contentId && 
        item.episodeNumber === watchItem.episodeNumber
      );
      
      if (existingIndex >= 0) {
        // Mettre à jour l'élément existant
        history[existingIndex] = {
          ...history[existingIndex],
          ...watchItem,
          timestamp: new Date().toISOString()
        };
      } else {
        // Ajouter un nouvel élément
        history.push({
          ...watchItem,
          timestamp: new Date().toISOString()
        });
      }
      
      // Limiter la taille de l'historique (garder les 100 derniers éléments)
      const trimmedHistory = history.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 100);
      
      localStorage.setItem(this.watchHistoryKey, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique de visionnage:', error);
    }
  }
}

// Exporter la classe pour une utilisation dans d'autres modules
export default RecommendationService;
