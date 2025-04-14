/**
 * Algorithme principal de recommandation pour FloDrama
 * Combine plusieurs approches pour générer des recommandations personnalisées
 */

import { ALGORITHM_PARAMS, WEIGHTS, THRESHOLDS } from '../constants';

class RecommendationAlgorithm {
  constructor(engines) {
    this.similarityEngine = engines.similarityEngine;
    this.behaviorAnalyzer = engines.behaviorAnalyzer;
    this.contextualRecommender = engines.contextualRecommender;
    this.weights = { ...WEIGHTS };
    
    console.log('Algorithme de recommandation FloDrama initialisé');
  }
  
  /**
   * Génère des recommandations personnalisées pour un utilisateur
   * @param {Object} params - Paramètres pour la génération de recommandations
   * @returns {Promise<Array>} Liste des contenus recommandés avec scores
   */
  async generateRecommendations(params) {
    const {
      userId,
      userPreferences,
      userHistory,
      userContext,
      behaviorInsights,
      weights = this.weights,
      options
    } = params;
    
    try {
      // 1. Récupérer les candidats potentiels basés sur les préférences utilisateur
      const preferenceBasedCandidates = await this._getPreferenceBasedCandidates(
        userPreferences,
        options
      );
      
      // 2. Récupérer les candidats basés sur l'historique de visionnage
      const historyBasedCandidates = await this._getHistoryBasedCandidates(
        userHistory,
        options
      );
      
      // 3. Récupérer les candidats basés sur le contexte actuel
      const contextBasedCandidates = await this._getContextBasedCandidates(
        userContext,
        options
      );
      
      // 4. Récupérer les candidats populaires et récents
      const popularAndRecentCandidates = await this._getPopularAndRecentCandidates(options);
      
      // 5. Fusionner tous les candidats et éliminer les doublons
      const allCandidates = this._mergeCandidates([
        preferenceBasedCandidates,
        historyBasedCandidates,
        contextBasedCandidates,
        popularAndRecentCandidates
      ]);
      
      // 6. Calculer un score pour chaque candidat
      const scoredCandidates = this._scoreCandidates(
        allCandidates,
        {
          userPreferences,
          userHistory,
          userContext,
          behaviorInsights
        },
        weights
      );
      
      // 7. Trier les candidats par score
      const rankedCandidates = scoredCandidates.sort((a, b) => b.score - a.score);
      
      // 8. Appliquer la diversification pour éviter trop de contenus similaires
      const diversifiedCandidates = this.diversifyRecommendations(rankedCandidates);
      
      // 9. Retourner les résultats finaux
      return diversifiedCandidates.map(candidate => ({
        ...candidate.content,
        recommendationScore: candidate.score,
        recommendationReason: candidate.reason
      }));
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les candidats basés sur les préférences utilisateur
   * @private
   */
  async _getPreferenceBasedCandidates(userPreferences, options) {
    // Extraire les genres préférés
    const preferredGenres = userPreferences.genres || [];
    
    // Extraire les acteurs/actrices préférés
    const preferredActors = userPreferences.actors || [];
    
    // Extraire les réalisateurs préférés
    const preferredDirectors = userPreferences.directors || [];
    
    // Récupérer les candidats pour chaque préférence
    const genreCandidates = await this.similarityEngine.getContentByGenres(
      preferredGenres,
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    const actorCandidates = await this.similarityEngine.getContentByActors(
      preferredActors,
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    const directorCandidates = await this.similarityEngine.getContentByDirectors(
      preferredDirectors,
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    // Fusionner tous les candidats
    return this._mergeCandidates([genreCandidates, actorCandidates, directorCandidates])
      .map(content => ({
        content,
        source: 'preferences',
        reason: this._generateRecommendationReason(content, userPreferences)
      }));
  }
  
  /**
   * Récupère les candidats basés sur l'historique de visionnage
   * @private
   */
  async _getHistoryBasedCandidates(userHistory, options) {
    // Extraire les contenus récemment regardés
    const recentlyWatched = userHistory.recentlyWatched || [];
    
    // Récupérer des contenus similaires pour chaque contenu récemment regardé
    const similarContentPromises = recentlyWatched
      .slice(0, 5) // Limiter aux 5 derniers contenus regardés
      .map(item => this.similarityEngine.findSimilarContent(
        item.contentId,
        { limit: 5 }
      ));
    
    const similarContentResults = await Promise.all(similarContentPromises);
    
    // Aplatir les résultats
    const similarContent = similarContentResults.flat();
    
    // Récupérer la suite des séries en cours
    const continueWatching = await this._getContinueWatchingCandidates(userHistory);
    
    // Fusionner tous les candidats
    return this._mergeCandidates([similarContent, continueWatching])
      .map(content => ({
        content,
        source: 'history',
        reason: this._generateContinueWatchingReason(content, userHistory)
      }));
  }
  
  /**
   * Récupère les candidats basés sur le contexte utilisateur
   * @private
   */
  async _getContextBasedCandidates(userContext, options) {
    // Récupérer des recommandations basées sur l'heure de la journée
    const timeBasedRecommendations = await this.contextualRecommender.getRecommendationsByTime(
      userContext.timeOfDay,
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    // Récupérer des recommandations basées sur l'appareil
    const deviceBasedRecommendations = await this.contextualRecommender.getRecommendationsByDevice(
      userContext.deviceType,
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    // Récupérer des recommandations basées sur la saison
    const seasonBasedRecommendations = await this.contextualRecommender.getRecommendationsBySeason(
      userContext.season,
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    // Fusionner tous les candidats
    return this._mergeCandidates([
      timeBasedRecommendations,
      deviceBasedRecommendations,
      seasonBasedRecommendations
    ]).map(content => ({
      content,
      source: 'context',
      reason: this._generateContextualReason(content, userContext)
    }));
  }
  
  /**
   * Récupère les candidats populaires et récents
   * @private
   */
  async _getPopularAndRecentCandidates(options) {
    // Récupérer les contenus populaires
    const popularContent = await this.similarityEngine.getPopularContent(
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    // Récupérer les contenus récents
    const recentContent = await this.similarityEngine.getRecentContent(
      ALGORITHM_PARAMS.MAX_RECOMMENDATIONS_PER_CATEGORY
    );
    
    // Fusionner tous les candidats
    return this._mergeCandidates([popularContent, recentContent])
      .map(content => ({
        content,
        source: content.releaseDate && this._isNewContent(content.releaseDate) ? 'recent' : 'popular',
        reason: this._generatePopularityReason(content)
      }));
  }
  
  /**
   * Récupère les candidats pour continuer le visionnage
   * @private
   */
  async _getContinueWatchingCandidates(userHistory) {
    const inProgressContent = userHistory.inProgress || [];
    
    // Filtrer pour ne garder que les contenus qui ne sont pas terminés
    const notCompletedContent = inProgressContent.filter(item => {
      return item.progress && item.progress.percentage < THRESHOLDS.WATCHED_PERCENTAGE;
    });
    
    // Récupérer les détails complets pour chaque contenu
    const contentDetailsPromises = notCompletedContent.map(item => 
      this.similarityEngine.getContentDetails(item.contentId)
    );
    
    return Promise.all(contentDetailsPromises);
  }
  
  /**
   * Fusionne plusieurs listes de candidats en éliminant les doublons
   * @private
   */
  _mergeCandidates(candidateLists) {
    // Aplatir toutes les listes
    const allCandidates = candidateLists.flat();
    
    // Éliminer les doublons en utilisant les IDs
    const uniqueCandidates = [];
    const seenIds = new Set();
    
    for (const candidate of allCandidates) {
      const content = candidate.content || candidate;
      if (!seenIds.has(content.id)) {
        seenIds.add(content.id);
        uniqueCandidates.push(content);
      }
    }
    
    return uniqueCandidates;
  }
  
  /**
   * Calcule un score pour chaque candidat
   * @private
   */
  _scoreCandidates(candidates, userData, weights) {
    return candidates.map(content => {
      // Initialiser le score
      let score = 0;
      let reasons = [];
      
      // Score basé sur les préférences utilisateur
      const preferenceScore = this._calculatePreferenceScore(content, userData.userPreferences);
      score += preferenceScore * weights.userPreferences;
      if (preferenceScore > 0.7) {
        reasons.push('preferences');
      }
      
      // Score basé sur l'historique de visionnage
      const historyScore = this._calculateHistoryScore(content, userData.userHistory);
      score += historyScore * weights.watchHistory;
      if (historyScore > 0.7) {
        reasons.push('history');
      }
      
      // Score basé sur le contexte
      const contextScore = this._calculateContextScore(content, userData.userContext);
      score += contextScore * weights.contextual;
      if (contextScore > 0.7) {
        reasons.push('context');
      }
      
      // Score basé sur la popularité
      const popularityScore = content.popularity || 0.5;
      score += popularityScore * weights.popularity;
      if (popularityScore > 0.8) {
        reasons.push('popular');
      }
      
      // Score basé sur la nouveauté
      const recencyScore = this._calculateRecencyScore(content);
      score += recencyScore * weights.recency;
      if (recencyScore > 0.8) {
        reasons.push('recent');
      }
      
      // Générer une raison principale pour la recommandation
      const reason = this._selectMainReason(reasons, content, userData);
      
      return {
        content,
        score,
        reason
      };
    });
  }
  
  /**
   * Calcule un score basé sur les préférences utilisateur
   * @private
   */
  _calculatePreferenceScore(content, userPreferences) {
    let score = 0;
    let matchCount = 0;
    
    // Vérifier les correspondances de genre
    const preferredGenres = userPreferences.genres || [];
    const contentGenres = content.genres || [];
    
    for (const genre of contentGenres) {
      if (preferredGenres.includes(genre)) {
        score += 0.2;
        matchCount++;
      }
    }
    
    // Vérifier les correspondances d'acteurs
    const preferredActors = userPreferences.actors || [];
    const contentActors = content.actors || [];
    
    for (const actor of contentActors) {
      if (preferredActors.includes(actor)) {
        score += 0.15;
        matchCount++;
      }
    }
    
    // Vérifier les correspondances de réalisateurs
    const preferredDirectors = userPreferences.directors || [];
    const contentDirector = content.director;
    
    if (contentDirector && preferredDirectors.includes(contentDirector)) {
      score += 0.15;
      matchCount++;
    }
    
    // Normaliser le score entre 0 et 1
    return Math.min(score, 1);
  }
  
  /**
   * Calcule un score basé sur l'historique de visionnage
   * @private
   */
  _calculateHistoryScore(content, userHistory) {
    let score = 0;
    
    // Vérifier si l'utilisateur a déjà regardé du contenu similaire
    const recentlyWatched = userHistory.recentlyWatched || [];
    
    for (const watched of recentlyWatched) {
      // Vérifier les correspondances de genre
      const watchedGenres = watched.genres || [];
      const contentGenres = content.genres || [];
      
      const commonGenres = watchedGenres.filter(genre => contentGenres.includes(genre));
      if (commonGenres.length > 0) {
        score += 0.1 * commonGenres.length;
      }
      
      // Vérifier si c'est la suite d'une série
      if (watched.seriesId && content.seriesId && watched.seriesId === content.seriesId) {
        score += 0.5;
      }
    }
    
    // Normaliser le score entre 0 et 1
    return Math.min(score, 1);
  }
  
  /**
   * Calcule un score basé sur le contexte utilisateur
   * @private
   */
  _calculateContextScore(content, userContext) {
    let score = 0;
    
    // Score basé sur l'heure de la journée
    const timeOfDay = userContext.timeOfDay;
    const contentDuration = content.duration || 0;
    
    // Préférer les contenus courts le matin et à midi
    if ((timeOfDay === 'morning' || timeOfDay === 'noon') && contentDuration < 30) {
      score += 0.2;
    }
    
    // Préférer les contenus plus longs le soir
    if (timeOfDay === 'evening' && contentDuration > 45) {
      score += 0.2;
    }
    
    // Score basé sur l'appareil
    const deviceType = userContext.deviceType;
    
    // Préférer les contenus courts sur mobile
    if (deviceType === 'mobile' && contentDuration < 30) {
      score += 0.2;
    }
    
    // Préférer les contenus haute qualité sur TV
    if (deviceType === 'tv' && content.quality === 'HD') {
      score += 0.2;
    }
    
    // Score basé sur la saison
    const season = userContext.season;
    const contentGenres = content.genres || [];
    
    // Préférer les comédies romantiques au printemps
    if (season === 'spring' && contentGenres.includes('romance')) {
      score += 0.1;
    }
    
    // Préférer les thrillers en automne
    if (season === 'autumn' && contentGenres.includes('thriller')) {
      score += 0.1;
    }
    
    // Normaliser le score entre 0 et 1
    return Math.min(score, 1);
  }
  
  /**
   * Calcule un score basé sur la nouveauté du contenu
   * @private
   */
  _calculateRecencyScore(content) {
    if (!content.releaseDate) {
      return 0.5; // Score moyen si pas de date
    }
    
    const releaseDate = new Date(content.releaseDate);
    const now = new Date();
    
    // Calculer la différence en jours
    const diffTime = Math.abs(now - releaseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Si le contenu est sorti il y a moins de 30 jours, score élevé
    if (diffDays <= ALGORITHM_PARAMS.NEW_CONTENT_PERIOD_DAYS) {
      return 1.0;
    }
    
    // Sinon, score décroissant avec le temps
    return Math.max(0, 1 - (diffDays / 365));
  }
  
  /**
   * Vérifie si un contenu est considéré comme nouveau
   * @private
   */
  _isNewContent(releaseDate) {
    const release = new Date(releaseDate);
    const now = new Date();
    
    // Calculer la différence en jours
    const diffTime = Math.abs(now - release);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= ALGORITHM_PARAMS.NEW_CONTENT_PERIOD_DAYS;
  }
  
  /**
   * Génère une raison de recommandation basée sur les préférences
   * @private
   */
  _generateRecommendationReason(content, userPreferences) {
    const preferredGenres = userPreferences.genres || [];
    const contentGenres = content.genres || [];
    
    const commonGenres = contentGenres.filter(genre => preferredGenres.includes(genre));
    
    if (commonGenres.length > 0) {
      return `Basé sur votre intérêt pour ${commonGenres.join(', ')}`;
    }
    
    return 'Recommandé pour vous';
  }
  
  /**
   * Génère une raison de recommandation pour continuer le visionnage
   * @private
   */
  _generateContinueWatchingReason(content, userHistory) {
    const inProgressContent = userHistory.inProgress || [];
    
    // Vérifier si c'est la suite d'une série
    for (const inProgress of inProgressContent) {
      if (inProgress.seriesId && content.seriesId && inProgress.seriesId === content.seriesId) {
        if (inProgress.season === content.season && inProgress.episode + 1 === content.episode) {
          return `Prochain épisode de ${content.seriesTitle}`;
        }
        
        if (inProgress.season + 1 === content.season && content.episode === 1) {
          return `Nouvelle saison de ${content.seriesTitle}`;
        }
      }
    }
    
    // Vérifier si c'est similaire à quelque chose déjà regardé
    const recentlyWatched = userHistory.recentlyWatched || [];
    for (const watched of recentlyWatched) {
      const watchedGenres = watched.genres || [];
      const contentGenres = content.genres || [];
      
      const commonGenres = watchedGenres.filter(genre => contentGenres.includes(genre));
      if (commonGenres.length > 0) {
        return `Similaire à ${watched.title} que vous avez regardé`;
      }
    }
    
    return 'Basé sur votre historique';
  }
  
  /**
   * Génère une raison de recommandation basée sur le contexte
   * @private
   */
  _generateContextualReason(content, userContext) {
    const timeOfDay = userContext.timeOfDay;
    const deviceType = userContext.deviceType;
    
    if (timeOfDay === 'morning') {
      return 'Parfait pour commencer la journée';
    }
    
    if (timeOfDay === 'evening') {
      return 'Idéal pour votre soirée';
    }
    
    if (deviceType === 'mobile') {
      return 'Format adapté pour mobile';
    }
    
    if (deviceType === 'tv') {
      return 'Expérience optimale sur grand écran';
    }
    
    return 'Adapté à votre situation actuelle';
  }
  
  /**
   * Génère une raison de recommandation basée sur la popularité
   * @private
   */
  _generatePopularityReason(content) {
    if (content.releaseDate && this._isNewContent(content.releaseDate)) {
      return 'Nouvelle sortie populaire';
    }
    
    return 'Très populaire en ce moment';
  }
  
  /**
   * Sélectionne la raison principale pour une recommandation
   * @private
   */
  _selectMainReason(reasons, content, userData) {
    if (reasons.includes('preferences')) {
      return this._generateRecommendationReason(content, userData.userPreferences);
    }
    
    if (reasons.includes('history')) {
      return this._generateContinueWatchingReason(content, userData.userHistory);
    }
    
    if (reasons.includes('context')) {
      return this._generateContextualReason(content, userData.userContext);
    }
    
    if (reasons.includes('recent')) {
      return 'Nouvelle sortie';
    }
    
    if (reasons.includes('popular')) {
      return 'Très populaire en ce moment';
    }
    
    return 'Recommandé pour vous';
  }
  
  /**
   * Diversifie les recommandations pour éviter trop de contenus similaires
   * @public
   */
  diversifyRecommendations(recommendations) {
    // Si moins de 3 recommandations, pas besoin de diversifier
    if (recommendations.length < 3) {
      return recommendations;
    }
    
    const diversified = [];
    const genreCounts = {};
    
    // Ajouter les recommandations en limitant le nombre par genre
    for (const recommendation of recommendations) {
      const content = recommendation.content || recommendation;
      const genres = content.genres || [];
      
      // Vérifier si ce genre est déjà trop représenté
      let shouldAdd = true;
      for (const genre of genres) {
        genreCounts[genre] = genreCounts[genre] || 0;
        
        // Si plus de 3 contenus de ce genre déjà ajoutés, réduire le score
        if (genreCounts[genre] >= 3) {
          recommendation.score *= ALGORITHM_PARAMS.DIVERSITY_FACTOR;
          
          // Si le score devient trop bas, ne pas ajouter
          if (recommendation.score < 0.3) {
            shouldAdd = false;
            break;
          }
        }
      }
      
      if (shouldAdd) {
        diversified.push(recommendation);
        
        // Incrémenter les compteurs de genre
        for (const genre of genres) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      }
    }
    
    // Trier à nouveau par score
    return diversified.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Met à jour les poids des facteurs de recommandation
   * @public
   */
  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
  }
}

export default RecommendationAlgorithm;
