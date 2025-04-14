/**
 * Hook pour utiliser le système de recommandations FloDrama
 * Permet d'accéder facilement aux recommandations personnalisées dans les composants
 */

import { useState, useEffect } from 'react';
import RecommendationIntegrator from '../services/recommendations/RecommendationIntegrator';
import { RECOMMENDATION_TYPES } from '../services/recommendations/constants';

// Instance singleton du système de recommandations
const recommendationSystem = new RecommendationIntegrator();

/**
 * Hook pour récupérer des recommandations personnalisées
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options de recommandation
 * @returns {Object} Données de recommandation, état de chargement et erreurs
 */
export const useRecommendations = (userId, options = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Options par défaut
  const defaultOptions = {
    type: RECOMMENDATION_TYPES.PERSONALIZED,
    contentType: null,
    limit: 10,
    includeWatched: false,
    diversityLevel: 'medium',
    contextualBoost: true,
    forceRefresh: false
  };
  
  // Fusionner les options par défaut avec les options fournies
  const mergedOptions = { ...defaultOptions, ...options };
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchRecommendations = async () => {
      if (!userId) {
        setLoading(false);
        setRecommendations([]);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les recommandations
        const results = await recommendationSystem.getRecommendations(userId, mergedOptions);
        
        // Mettre à jour l'état si le composant est toujours monté
        if (isMounted) {
          setRecommendations(results);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des recommandations:', err);
        
        // Mettre à jour l'état d'erreur si le composant est toujours monté
        if (isMounted) {
          setError(err.message || 'Une erreur est survenue lors de la récupération des recommandations');
          setLoading(false);
        }
      }
    };
    
    fetchRecommendations();
    
    // Nettoyage lors du démontage du composant
    return () => {
      isMounted = false;
    };
  }, [
    userId, 
    mergedOptions.type, 
    mergedOptions.contentType, 
    mergedOptions.limit,
    mergedOptions.includeWatched,
    mergedOptions.diversityLevel,
    mergedOptions.forceRefresh,
    // Ne pas inclure contextualBoost et contentId dans les dépendances
    // pour éviter des rechargements inutiles
  ]);
  
  // Exposer des méthodes utiles
  const refreshRecommendations = () => {
    // Forcer le rafraîchissement des recommandations
    setLoading(true);
    recommendationSystem.invalidateUserCache(userId);
    
    // Récupérer de nouvelles recommandations
    recommendationSystem.getRecommendations(userId, {
      ...mergedOptions,
      forceRefresh: true
    }).then(results => {
      setRecommendations(results);
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'Une erreur est survenue lors du rafraîchissement des recommandations');
      setLoading(false);
    });
  };
  
  return {
    recommendations,
    loading,
    error,
    refreshRecommendations
  };
};

/**
 * Hook pour récupérer des recommandations similaires à un contenu spécifique
 * @param {string} contentId - ID du contenu de référence
 * @param {Object} options - Options de recommandation
 * @returns {Object} Données de recommandation, état de chargement et erreurs
 */
export const useSimilarRecommendations = (contentId, options = {}) => {
  // Utiliser le hook de base avec le type SIMILAR
  return useRecommendations('system', {
    type: RECOMMENDATION_TYPES.SIMILAR,
    contentId,
    ...options
  });
};

/**
 * Hook pour récupérer des recommandations tendance
 * @param {Object} options - Options de recommandation
 * @returns {Object} Données de recommandation, état de chargement et erreurs
 */
export const useTrendingRecommendations = (options = {}) => {
  // Utiliser le hook de base avec le type TRENDING
  return useRecommendations('system', {
    type: RECOMMENDATION_TYPES.TRENDING,
    ...options
  });
};

/**
 * Hook pour récupérer des recommandations contextuelles
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options de recommandation
 * @returns {Object} Données de recommandation, état de chargement et erreurs
 */
export const useContextualRecommendations = (userId, options = {}) => {
  // Utiliser le hook de base avec le type CONTEXTUAL
  return useRecommendations(userId, {
    type: RECOMMENDATION_TYPES.CONTEXTUAL,
    ...options
  });
};

export default useRecommendations;
