/**
 * Intégrateur de recommandations pour FloDrama
 * Combine les différentes sources de recommandations pour générer des suggestions finales
 */

import RecommendationAlgorithm from './algorithms/RecommendationAlgorithm';
import ContentSimilarityEngine from './engines/ContentSimilarityEngine';
import ContextualRecommender from './engines/ContextualRecommender';
import UserBehaviorAnalyzer from './analyzers/UserBehaviorAnalyzer';
import { getUserHistory, getUserPreferences } from '../api/UserService';
import { RECOMMENDATION_TYPES, CONTENT_TYPES, WEIGHTS } from './constants';

class RecommendationIntegrator {
  constructor() {
    // Initialiser les composants du système de recommandation
    this.algorithm = new RecommendationAlgorithm();
    this.similarityEngine = new ContentSimilarityEngine();
    this.contextualRecommender = new ContextualRecommender();
    this.behaviorAnalyzer = new UserBehaviorAnalyzer();
    
    // Cache pour les recommandations
    this.recommendationCache = new Map();
    
    console.log('Intégrateur de recommandations FloDrama initialisé');
  }
  
  /**
   * Génère des recommandations personnalisées pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recommandation
   * @returns {Promise<Array>} Liste des recommandations
   */
  async getRecommendations(userId, options = {}) {
    try {
      // Extraire les options
      const {
        type = RECOMMENDATION_TYPES.PERSONALIZED,
        contentType = null,
        limit = 10,
        includeWatched = false,
        diversityLevel = 'medium',
        contextualBoost = true,
        forceRefresh = false
      } = options;
      
      // Construire la clé de cache
      const cacheKey = this._buildCacheKey(userId, options);
      
      // Vérifier le cache si le rafraîchissement n'est pas forcé
      if (!forceRefresh && this.recommendationCache.has(cacheKey)) {
        const cachedData = this.recommendationCache.get(cacheKey);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Utiliser le cache si les données ont moins de 30 minutes
        if (cacheAge < 1800000) {
          console.log(`Utilisation des recommandations en cache pour l'utilisateur ${userId}`);
          return cachedData.recommendations;
        }
      }
      
      // Récupérer l'historique et les préférences de l'utilisateur
      const userHistory = await getUserHistory(userId);
      const userPreferences = await getUserPreferences(userId);
      
      // Analyser le comportement de l'utilisateur
      const behaviorInsights = this.behaviorAnalyzer.analyzeUserBehavior(userHistory);
      
      // Générer les recommandations selon le type demandé
      let recommendations = [];
      
      switch (type) {
        case RECOMMENDATION_TYPES.SIMILAR:
          // Recommandations basées sur un contenu spécifique
          if (options.contentId) {
            recommendations = await this._getSimilarContentRecommendations(
              options.contentId, 
              limit,
              contentType
            );
          } else if (userHistory?.recentlyWatched?.length > 0) {
            // Utiliser le contenu le plus récemment regardé
            const recentContent = userHistory.recentlyWatched[0];
            recommendations = await this._getSimilarContentRecommendations(
              recentContent.id,
              limit,
              contentType
            );
          }
          break;
          
        case RECOMMENDATION_TYPES.TRENDING:
          // Recommandations basées sur les tendances
          recommendations = await this._getTrendingRecommendations(
            limit,
            contentType,
            userPreferences
          );
          break;
          
        case RECOMMENDATION_TYPES.CONTEXTUAL:
          // Recommandations basées sur le contexte
          recommendations = await this._getContextualRecommendations(
            userId,
            limit,
            contentType
          );
          break;
          
        case RECOMMENDATION_TYPES.PERSONALIZED:
        default:
          // Recommandations personnalisées (combinaison de toutes les sources)
          recommendations = await this._getPersonalizedRecommendations(
            userId,
            userHistory,
            userPreferences,
            behaviorInsights,
            limit,
            contentType,
            contextualBoost
          );
          break;
      }
      
      // Filtrer les contenus déjà regardés si demandé
      if (!includeWatched && userHistory) {
        const watchedIds = new Set([
          ...(userHistory.recentlyWatched || []).map(item => item.id),
          ...(userHistory.completed || []).map(item => item.id)
        ]);
        
        recommendations = recommendations.filter(item => !watchedIds.has(item.id));
      }
      
      // Diversifier les recommandations si demandé
      if (diversityLevel !== 'none') {
        recommendations = this.algorithm.diversifyRecommendations(
          recommendations,
          diversityLevel
        );
      }
      
      // Limiter le nombre de résultats
      recommendations = recommendations.slice(0, limit);
      
      // Mettre en cache les recommandations
      this.recommendationCache.set(cacheKey, {
        recommendations,
        timestamp: Date.now()
      });
      
      return recommendations;
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      return [];
    }
  }
  
  /**
   * Génère des recommandations basées sur un contenu similaire
   * @private
   */
  async _getSimilarContentRecommendations(contentId, limit, contentType) {
    try {
      // Récupérer les contenus similaires
      const similarContent = await this.similarityEngine.findSimilarContent(
        contentId,
        limit * 2,
        contentType
      );
      
      // Trier par score de similarité
      return similarContent.sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations similaires:', error);
      return [];
    }
  }
  
  /**
   * Génère des recommandations basées sur les tendances
   * @private
   */
  async _getTrendingRecommendations(limit, contentType, userPreferences) {
    try {
      // Récupérer les contenus tendance
      const trendingContent = await this.algorithm.getTrendingContent(
        limit * 2,
        contentType
      );
      
      // Si des préférences utilisateur sont disponibles, personnaliser les tendances
      if (userPreferences) {
        return this.algorithm.personalizeRecommendations(
          trendingContent,
          userPreferences,
          WEIGHTS.TRENDING_PERSONALIZATION
        ).slice(0, limit);
      }
      
      return trendingContent.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations tendance:', error);
      return [];
    }
  }
  
  /**
   * Génère des recommandations basées sur le contexte
   * @private
   */
  async _getContextualRecommendations(userId, limit, contentType) {
    try {
      // Récupérer le contexte utilisateur
      const userContext = await this.contextualRecommender.getUserContext(userId);
      
      // Récupérer des recommandations basées sur l'heure de la journée
      const timeRecommendations = await this.contextualRecommender.getRecommendationsByTime(
        userContext.timeOfDay,
        limit
      );
      
      // Récupérer des recommandations basées sur l'appareil
      const deviceRecommendations = await this.contextualRecommender.getRecommendationsByDevice(
        userContext.deviceType,
        limit
      );
      
      // Récupérer des recommandations basées sur la saison
      const seasonRecommendations = await this.contextualRecommender.getRecommendationsBySeason(
        userContext.season,
        limit
      );
      
      // Combiner les recommandations
      const allRecommendations = [
        ...timeRecommendations.map(item => ({ ...item, contextSource: 'time', contextScore: item.contextScore || 0.5 })),
        ...deviceRecommendations.map(item => ({ ...item, contextSource: 'device', contextScore: item.contextScore || 0.5 })),
        ...seasonRecommendations.map(item => ({ ...item, contextSource: 'season', contextScore: item.contextScore || 0.5 }))
      ];
      
      // Filtrer par type de contenu si spécifié
      const filteredRecommendations = contentType
        ? allRecommendations.filter(item => item.type === contentType)
        : allRecommendations;
      
      // Dédupliquer les recommandations
      const uniqueRecommendations = this._deduplicateRecommendations(filteredRecommendations);
      
      // Trier par score contextuel
      return uniqueRecommendations
        .sort((a, b) => b.contextScore - a.contextScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations contextuelles:', error);
      return [];
    }
  }
  
  /**
   * Génère des recommandations personnalisées (combinaison de toutes les sources)
   * @private
   */
  async _getPersonalizedRecommendations(
    userId,
    userHistory,
    userPreferences,
    behaviorInsights,
    limit,
    contentType,
    contextualBoost
  ) {
    try {
      // Récupérer des recommandations de chaque source
      
      // 1. Recommandations basées sur le contenu récemment regardé
      let similarRecommendations = [];
      if (userHistory?.recentlyWatched?.length > 0) {
        const recentContent = userHistory.recentlyWatched[0];
        similarRecommendations = await this._getSimilarContentRecommendations(
          recentContent.id,
          limit,
          contentType
        );
      }
      
      // 2. Recommandations tendance
      const trendingRecommendations = await this._getTrendingRecommendations(
        limit,
        contentType,
        userPreferences
      );
      
      // 3. Recommandations contextuelles
      let contextualRecommendations = [];
      if (contextualBoost) {
        contextualRecommendations = await this._getContextualRecommendations(
          userId,
          limit,
          contentType
        );
      }
      
      // 4. Recommandations basées sur les préférences de genre
      let genreRecommendations = [];
      if (behaviorInsights?.genrePreferences?.preferredGenres?.length > 0) {
        genreRecommendations = await this.algorithm.getRecommendationsByGenres(
          behaviorInsights.genrePreferences.preferredGenres,
          limit,
          contentType
        );
      }
      
      // Combiner toutes les sources de recommandations
      const allRecommendations = [
        ...similarRecommendations.map(item => ({ 
          ...item, 
          source: 'similar', 
          weight: WEIGHTS.PERSONALIZED.SIMILAR 
        })),
        ...trendingRecommendations.map(item => ({ 
          ...item, 
          source: 'trending', 
          weight: WEIGHTS.PERSONALIZED.TRENDING 
        })),
        ...contextualRecommendations.map(item => ({ 
          ...item, 
          source: 'contextual', 
          weight: WEIGHTS.PERSONALIZED.CONTEXTUAL 
        })),
        ...genreRecommendations.map(item => ({ 
          ...item, 
          source: 'genre', 
          weight: WEIGHTS.PERSONALIZED.GENRE 
        }))
      ];
      
      // Filtrer par type de contenu si spécifié
      const filteredRecommendations = contentType
        ? allRecommendations.filter(item => item.type === contentType)
        : allRecommendations;
      
      // Dédupliquer les recommandations
      const uniqueRecommendations = this._deduplicateRecommendations(filteredRecommendations);
      
      // Calculer un score final pour chaque recommandation
      const scoredRecommendations = uniqueRecommendations.map(item => {
        // Score de base pondéré par la source
        let finalScore = item.weight || 0.5;
        
        // Ajouter le score de similarité s'il existe
        if (item.similarityScore) {
          finalScore += item.similarityScore * WEIGHTS.SCORE_FACTORS.SIMILARITY;
        }
        
        // Ajouter le score contextuel s'il existe
        if (item.contextScore) {
          finalScore += item.contextScore * WEIGHTS.SCORE_FACTORS.CONTEXT;
        }
        
        // Ajouter un boost pour les genres préférés
        if (behaviorInsights?.genrePreferences?.preferredGenres) {
          const genres = item.genres || [];
          const preferredGenres = behaviorInsights.genrePreferences.preferredGenres;
          
          const genreOverlap = genres.filter(genre => preferredGenres.includes(genre)).length;
          if (genreOverlap > 0) {
            finalScore += (genreOverlap / genres.length) * WEIGHTS.SCORE_FACTORS.GENRE;
          }
        }
        
        // Ajouter un boost pour les contenus récents
        if (item.releaseDate) {
          const releaseDate = new Date(item.releaseDate);
          const now = new Date();
          const ageInDays = (now - releaseDate) / (1000 * 60 * 60 * 24);
          
          if (ageInDays < 30) {
            finalScore += WEIGHTS.SCORE_FACTORS.RECENCY;
          }
        }
        
        return {
          ...item,
          finalScore
        };
      });
      
      // Trier par score final
      return scoredRecommendations
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations personnalisées:', error);
      return [];
    }
  }
  
  /**
   * Déduplique les recommandations par ID
   * @private
   */
  _deduplicateRecommendations(recommendations) {
    const uniqueMap = new Map();
    
    recommendations.forEach(item => {
      if (!uniqueMap.has(item.id) || item.contextScore > uniqueMap.get(item.id).contextScore) {
        uniqueMap.set(item.id, item);
      }
    });
    
    return Array.from(uniqueMap.values());
  }
  
  /**
   * Construit une clé de cache pour les recommandations
   * @private
   */
  _buildCacheKey(userId, options) {
    const {
      type = RECOMMENDATION_TYPES.PERSONALIZED,
      contentType = 'all',
      limit = 10,
      includeWatched = false,
      diversityLevel = 'medium',
      contentId = ''
    } = options;
    
    return `${userId}:${type}:${contentType}:${limit}:${includeWatched}:${diversityLevel}:${contentId}`;
  }
  
  /**
   * Invalide le cache pour un utilisateur spécifique
   * @param {string} userId - ID de l'utilisateur
   */
  invalidateUserCache(userId) {
    // Supprimer toutes les entrées de cache pour cet utilisateur
    for (const key of this.recommendationCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.recommendationCache.delete(key);
      }
    }
    console.log(`Cache de recommandations invalidé pour l'utilisateur ${userId}`);
  }
  
  /**
   * Invalide tout le cache
   */
  clearCache() {
    this.recommendationCache.clear();
    this.similarityEngine.clearCache();
    this.contextualRecommender.clearCache();
    console.log('Cache du système de recommandations vidé');
  }
}

export default RecommendationIntegrator;
