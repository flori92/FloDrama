/**
 * Service de recommandations intelligentes pour FloDrama
 * Utilise des algorithmes d'IA pour personnaliser les recommandations de contenu
 */

import { getUserPreferences, getUserHistory } from '../api/UserService';
import { getContentDetails, searchContent } from '../api/ContentService';
import { logEvent } from '../monitoring/AnalyticsService';
import RecommendationAlgorithm from './algorithms/RecommendationAlgorithm';
import ContentSimilarityEngine from './engines/ContentSimilarityEngine';
import UserBehaviorAnalyzer from './analyzers/UserBehaviorAnalyzer';
import ContextualRecommender from './engines/ContextualRecommender';
import { CONTENT_TYPES, RECOMMENDATION_TYPES, WEIGHTS } from './constants';

class RecommendationService {
  constructor() {
    this.similarityEngine = new ContentSimilarityEngine();
    this.behaviorAnalyzer = new UserBehaviorAnalyzer();
    this.contextualRecommender = new ContextualRecommender();
    this.algorithm = new RecommendationAlgorithm({
      similarityEngine: this.similarityEngine,
      behaviorAnalyzer: this.behaviorAnalyzer,
      contextualRecommender: this.contextualRecommender
    });
    
    // Initialiser les poids des facteurs de recommandation
    this.weights = { ...WEIGHTS };
    
    // Cache pour les recommandations récentes
    this.recommendationsCache = new Map();
    
    console.log('Service de recommandations FloDrama initialisé');
  }
  
  /**
   * Obtient des recommandations personnalisées pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recommandation
   * @param {string} options.type - Type de recommandation (trending, similar, personalized)
   * @param {number} options.limit - Nombre maximum de recommandations
   * @param {string} options.contentType - Type de contenu (drama, movie, anime)
   * @param {string} options.referenceContentId - ID du contenu de référence pour les recommandations similaires
   * @returns {Promise<Array>} Liste des contenus recommandés
   */
  async getRecommendations(userId, options = {}) {
    const defaultOptions = {
      type: RECOMMENDATION_TYPES.PERSONALIZED,
      limit: 10,
      contentType: CONTENT_TYPES.ALL,
      referenceContentId: null
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      // Vérifier le cache pour les recommandations récentes
      const cacheKey = this._generateCacheKey(userId, finalOptions);
      if (this.recommendationsCache.has(cacheKey)) {
        const cachedData = this.recommendationsCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 3600000) { // Cache valide pour 1 heure
          console.log('Recommandations récupérées depuis le cache');
          return cachedData.recommendations;
        }
      }
      
      // Récupérer les données utilisateur
      const [userPreferences, userHistory] = await Promise.all([
        getUserPreferences(userId),
        getUserHistory(userId)
      ]);
      
      // Obtenir les recommandations selon le type demandé
      let recommendations;
      
      switch (finalOptions.type) {
        case RECOMMENDATION_TYPES.SIMILAR:
          if (!finalOptions.referenceContentId) {
            throw new Error('referenceContentId est requis pour les recommandations similaires');
          }
          recommendations = await this._getSimilarContent(finalOptions.referenceContentId, finalOptions);
          break;
          
        case RECOMMENDATION_TYPES.TRENDING:
          recommendations = await this._getTrendingContent(finalOptions);
          break;
          
        case RECOMMENDATION_TYPES.PERSONALIZED:
        default:
          recommendations = await this._getPersonalizedRecommendations(
            userId, 
            userPreferences, 
            userHistory, 
            finalOptions
          );
          break;
      }
      
      // Filtrer par type de contenu si spécifié
      if (finalOptions.contentType !== CONTENT_TYPES.ALL) {
        recommendations = recommendations.filter(item => item.type === finalOptions.contentType);
      }
      
      // Limiter le nombre de résultats
      recommendations = recommendations.slice(0, finalOptions.limit);
      
      // Mettre en cache les recommandations
      this.recommendationsCache.set(cacheKey, {
        recommendations,
        timestamp: Date.now()
      });
      
      // Journaliser l'événement pour l'analyse
      logEvent('recommendations_generated', {
        userId,
        recommendationType: finalOptions.type,
        contentType: finalOptions.contentType,
        count: recommendations.length
      });
      
      return recommendations;
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      throw error;
    }
  }
  
  /**
   * Obtient des recommandations personnalisées basées sur les préférences et l'historique
   * @private
   */
  async _getPersonalizedRecommendations(userId, userPreferences, userHistory, options) {
    // Récupérer le contexte utilisateur (heure, appareil, etc.)
    const userContext = await this.contextualRecommender.getUserContext(userId);
    
    // Analyser le comportement utilisateur
    const behaviorInsights = this.behaviorAnalyzer.analyzeUserBehavior(userHistory);
    
    // Exécuter l'algorithme de recommandation
    const recommendationParams = {
      userId,
      userPreferences,
      userHistory,
      userContext,
      behaviorInsights,
      weights: this.weights,
      options
    };
    
    return this.algorithm.generateRecommendations(recommendationParams);
  }
  
  /**
   * Obtient du contenu similaire à un contenu de référence
   * @private
   */
  async _getSimilarContent(contentId, options) {
    // Récupérer les détails du contenu de référence
    const referenceContent = await getContentDetails(contentId);
    
    // Utiliser le moteur de similarité pour trouver du contenu similaire
    return this.similarityEngine.findSimilarContent(referenceContent, options);
  }
  
  /**
   * Obtient le contenu tendance
   * @private
   */
  async _getTrendingContent(options) {
    // Rechercher le contenu tendance
    const trendingContent = await searchContent({
      sort: 'popularity',
      limit: options.limit * 2, // Récupérer plus de résultats pour le filtrage
      type: options.contentType
    });
    
    // Ajouter un score de diversité pour éviter de recommander trop de contenu similaire
    return this.algorithm.diversifyRecommendations(trendingContent);
  }
  
  /**
   * Génère une clé de cache unique pour les options de recommandation
   * @private
   */
  _generateCacheKey(userId, options) {
    return `${userId}:${options.type}:${options.contentType}:${options.limit}:${options.referenceContentId || 'none'}`;
  }
  
  /**
   * Ajuste les poids des facteurs de recommandation en fonction du feedback utilisateur
   * @param {Object} newWeights - Nouveaux poids à appliquer
   */
  adjustWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    this.algorithm.updateWeights(this.weights);
    console.log('Poids des recommandations ajustés:', this.weights);
  }
  
  /**
   * Invalide le cache des recommandations pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  invalidateCache(userId) {
    // Supprimer toutes les entrées de cache pour cet utilisateur
    for (const key of this.recommendationsCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.recommendationsCache.delete(key);
      }
    }
    console.log(`Cache de recommandations invalidé pour l'utilisateur ${userId}`);
  }
}

// Exporter une instance singleton du service
const recommendationService = new RecommendationService();
export default recommendationService;
