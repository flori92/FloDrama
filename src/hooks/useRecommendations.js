/**
 * Hook pour l'utilisation du système de recommandations de FloDrama
 * 
 * Ce hook permet d'accéder facilement aux recommandations personnalisées
 * basées sur le contexte, le comportement utilisateur et les préférences.
 * 
 * Il s'intègre avec les composants ContextualRecommender, UserBehaviorAnalyzer
 * et RecommendationIntegrator pour fournir des recommandations pertinentes.
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import userDataService from '../services/UserDataService';
import indexedDBManager from '../utils/indexedDBManager';
import cacheManager from '../utils/cacheManager';

// Configuration
const CONFIG = {
  // Nombre de recommandations à charger par défaut
  defaultLimit: 10,
  
  // Durée de vie du cache des recommandations (en ms)
  cacheTTL: 30 * 60 * 1000, // 30 minutes
  
  // Préfixe pour les clés de cache
  cachePrefix: 'recommendations_',
  
  // Types de recommandations
  types: {
    TRENDING: 'trending',
    PERSONALIZED: 'personalized',
    CONTEXTUAL: 'contextual',
    SIMILAR: 'similar',
    CONTINUE_WATCHING: 'continue_watching'
  }
};

/**
 * Hook pour accéder aux recommandations
 * @param {Object} options - Options de configuration
 * @param {string} options.type - Type de recommandation (trending, personalized, contextual, similar, continue_watching)
 * @param {string} options.contentId - ID du contenu pour les recommandations similaires
 * @param {number} options.limit - Nombre de recommandations à charger
 * @param {boolean} options.useCache - Utiliser le cache pour les recommandations
 * @returns {Object} - État et fonctions pour gérer les recommandations
 */
const useRecommendations = ({
  type = CONFIG.types.PERSONALIZED,
  contentId = null,
  limit = CONFIG.defaultLimit,
  useCache = true
}) => {
  // État
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contextData, setContextData] = useState(null);
  
  /**
   * Détermine le contexte actuel de l'utilisateur
   * @returns {Object} - Données de contexte
   */
  const getCurrentContext = useCallback(() => {
    // Obtenir l'heure actuelle
    const now = new Date();
    const hour = now.getHours();
    
    // Déterminer le moment de la journée
    let timeOfDay;
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 22) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }
    
    // Déterminer la saison
    const month = now.getMonth();
    let season;
    if (month >= 2 && month < 5) {
      season = 'spring';
    } else if (month >= 5 && month < 8) {
      season = 'summer';
    } else if (month >= 8 && month < 11) {
      season = 'autumn';
    } else {
      season = 'winter';
    }
    
    // Déterminer l'appareil
    let device = 'desktop';
    if (window.innerWidth <= 768) {
      device = 'mobile';
    } else if (window.innerWidth <= 1024) {
      device = 'tablet';
    }
    
    // Construire l'objet de contexte
    return {
      timeOfDay,
      season,
      device,
      weekday: now.getDay(),
      hour,
      timestamp: now.getTime()
    };
  }, []);
  
  /**
   * Génère une clé de cache unique pour les recommandations
   * @returns {string} - Clé de cache
   */
  const getCacheKey = useCallback(() => {
    const userId = userDataService.userId || 'guest';
    
    if (type === CONFIG.types.SIMILAR && contentId) {
      return `${CONFIG.cachePrefix}${type}_${contentId}_${limit}`;
    }
    
    return `${CONFIG.cachePrefix}${type}_${userId}_${limit}`;
  }, [type, contentId, limit]);
  
  /**
   * Charge les recommandations depuis le cache
   * @returns {Promise<Array|null>} - Recommandations ou null si non trouvées
   */
  const loadFromCache = useCallback(async () => {
    if (!useCache) return null;
    
    const cacheKey = getCacheKey();
    
    // Essayer de charger depuis IndexedDB
    let cachedData = await indexedDBManager.getItem('content', cacheKey);
    
    // Si non trouvé, essayer le cache local
    if (!cachedData) {
      cachedData = cacheManager.getCache(cacheKey, 'metadata');
    }
    
    // Vérifier si les données sont valides
    if (cachedData && cachedData.timestamp) {
      const now = Date.now();
      if (now - cachedData.timestamp < CONFIG.cacheTTL) {
        return cachedData.data;
      }
    }
    
    return null;
  }, [getCacheKey, useCache]);
  
  /**
   * Enregistre les recommandations dans le cache
   * @param {Array} data - Recommandations à enregistrer
   */
  const saveToCache = useCallback(async (data) => {
    if (!useCache || !data) return;
    
    const cacheKey = getCacheKey();
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    // Enregistrer dans IndexedDB
    await indexedDBManager.setItem('content', cacheKey, cacheData);
    
    // Enregistrer dans le cache local pour un accès rapide
    cacheManager.setCache(cacheKey, cacheData, 'metadata');
  }, [getCacheKey, useCache]);
  
  /**
   * Charge les recommandations tendance
   * @returns {Promise<Array>} - Recommandations tendance
   */
  const loadTrendingRecommendations = useCallback(async () => {
    // Dans une vraie application, ces données viendraient d'une API
    // Pour l'exemple, on utilise des données statiques
    return [
      {
        id: 'drama001',
        title: 'Crash Landing on You',
        type: 'drama',
        image: '/assets/media/posters/drama001/poster.jpg',
        rating: 9.2,
        year: 2020,
        trendingScore: 98
      },
      {
        id: 'drama002',
        title: 'Itaewon Class',
        type: 'drama',
        image: '/assets/media/posters/drama002/poster.jpg',
        rating: 8.7,
        year: 2020,
        trendingScore: 95
      },
      {
        id: 'anime001',
        title: 'Demon Slayer',
        type: 'anime',
        image: '/assets/media/posters/anime001/poster.jpg',
        rating: 9.5,
        year: 2019,
        trendingScore: 97
      }
    ];
  }, []);
  
  /**
   * Charge les recommandations personnalisées
   * @returns {Promise<Array>} - Recommandations personnalisées
   */
  const loadPersonalizedRecommendations = useCallback(async () => {
    try {
      // Récupérer l'historique de visionnage
      const watchHistory = await userDataService.getWatchHistory();
      
      // Récupérer les préférences utilisateur
      const preferences = await userDataService.getPreferences();
      
      // Dans une vraie application, ces données seraient utilisées pour générer
      // des recommandations via un algorithme ou une API
      // Pour l'exemple, on utilise des données statiques
      return [
        {
          id: 'drama005',
          title: 'Reply 1988',
          type: 'drama',
          image: '/assets/media/posters/drama005/poster.jpg',
          rating: 9.7,
          year: 2015,
          personalScore: 92,
          reason: 'Basé sur vos préférences pour les dramas de vie quotidienne'
        },
        {
          id: 'drama006',
          title: 'Hospital Playlist',
          type: 'drama',
          image: '/assets/media/posters/drama006/poster.jpg',
          rating: 9.1,
          year: 2020,
          personalScore: 90,
          reason: 'Similaire à Reply 1988 que vous avez apprécié'
        },
        {
          id: 'anime002',
          title: 'Attack on Titan',
          type: 'anime',
          image: '/assets/media/posters/anime002/poster.jpg',
          rating: 9.4,
          year: 2013,
          personalScore: 88,
          reason: 'Basé sur votre intérêt pour les animes d\'action'
        }
      ];
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations personnalisées:', error);
      return [];
    }
  }, []);
  
  /**
   * Charge les recommandations contextuelles
   * @returns {Promise<Array>} - Recommandations contextuelles
   */
  const loadContextualRecommendations = useCallback(async () => {
    try {
      // Récupérer le contexte actuel
      const context = getCurrentContext();
      setContextData(context);
      
      // Dans une vraie application, le contexte serait utilisé pour générer
      // des recommandations via un algorithme ou une API
      // Pour l'exemple, on utilise des données statiques adaptées au contexte
      
      let contextualItems = [];
      
      // Recommandations selon le moment de la journée
      if (context.timeOfDay === 'morning') {
        contextualItems = [
          {
            id: 'drama008',
            title: 'Good Morning Call',
            type: 'drama',
            image: '/assets/media/posters/drama008/poster.jpg',
            rating: 8.2,
            year: 2016,
            contextScore: 85,
            reason: 'Parfait pour commencer la journée'
          }
        ];
      } else if (context.timeOfDay === 'night') {
        contextualItems = [
          {
            id: 'drama009',
            title: 'While You Were Sleeping',
            type: 'drama',
            image: '/assets/media/posters/drama009/poster.jpg',
            rating: 8.8,
            year: 2017,
            contextScore: 90,
            reason: 'Idéal pour une soirée détente'
          }
        ];
      }
      
      // Ajouter des recommandations selon la saison
      if (context.season === 'summer') {
        contextualItems.push({
          id: 'drama010',
          title: 'Our Beloved Summer',
          type: 'drama',
          image: '/assets/media/posters/drama010/poster.jpg',
          rating: 8.9,
          year: 2021,
          contextScore: 88,
          reason: 'Ambiance estivale parfaite pour la saison'
        });
      } else if (context.season === 'winter') {
        contextualItems.push({
          id: 'drama011',
          title: 'Winter Sonata',
          type: 'drama',
          image: '/assets/media/posters/drama011/poster.jpg',
          rating: 8.5,
          year: 2002,
          contextScore: 87,
          reason: 'Ambiance hivernale idéale pour la saison'
        });
      }
      
      return contextualItems;
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations contextuelles:', error);
      return [];
    }
  }, [getCurrentContext]);
  
  /**
   * Charge les recommandations similaires à un contenu
   * @returns {Promise<Array>} - Recommandations similaires
   */
  const loadSimilarRecommendations = useCallback(async () => {
    try {
      if (!contentId) {
        throw new Error('contentId est requis pour les recommandations similaires');
      }
      
      // Dans une vraie application, ces données viendraient d'une API
      // Pour l'exemple, on utilise des données statiques
      return [
        {
          id: 'drama012',
          title: 'Boys Over Flowers',
          type: 'drama',
          image: '/assets/media/posters/drama012/poster.jpg',
          rating: 8.3,
          year: 2009,
          similarityScore: 85,
          reason: 'Même genre et thématique'
        },
        {
          id: 'drama013',
          title: 'The Heirs',
          type: 'drama',
          image: '/assets/media/posters/drama013/poster.jpg',
          rating: 8.2,
          year: 2013,
          similarityScore: 82,
          reason: 'Acteurs similaires et même ambiance'
        }
      ];
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations similaires:', error);
      return [];
    }
  }, [contentId]);
  
  /**
   * Charge les recommandations "Continuer à regarder"
   * @returns {Promise<Array>} - Recommandations pour continuer à regarder
   */
  const loadContinueWatchingRecommendations = useCallback(async () => {
    try {
      // Récupérer l'historique de visionnage
      const watchHistory = await userDataService.getWatchHistory();
      
      // Récupérer les progressions
      const progressPromises = watchHistory.slice(0, 5).map(async (item) => {
        const progress = await userDataService.getWatchProgress(item.contentId, item.episodeId);
        return { ...item, progress };
      });
      
      const progressItems = await Promise.all(progressPromises);
      
      // Filtrer les éléments non terminés
      const continueItems = progressItems.filter(
        item => item.progress && !item.progress.completed
      );
      
      // Dans une vraie application, on récupérerait les détails des contenus
      // Pour l'exemple, on utilise des données statiques
      return continueItems.map(item => ({
        id: item.contentId,
        title: `Contenu ${item.contentId}`,
        type: item.contentId.includes('drama') ? 'drama' : 'anime',
        image: `/assets/media/posters/${item.contentId}/poster.jpg`,
        episodeId: item.episodeId,
        progress: item.progress.percent,
        position: item.progress.position,
        lastWatched: item.progress.timestamp
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations "Continuer à regarder":', error);
      return [];
    }
  }, []);
  
  /**
   * Charge les recommandations selon le type spécifié
   */
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Essayer de charger depuis le cache
      const cachedRecommendations = await loadFromCache();
      
      if (cachedRecommendations) {
        setRecommendations(cachedRecommendations);
        setLoading(false);
        return;
      }
      
      // Charger les recommandations selon le type
      let data = [];
      
      switch (type) {
        case CONFIG.types.TRENDING:
          data = await loadTrendingRecommendations();
          break;
        
        case CONFIG.types.PERSONALIZED:
          data = await loadPersonalizedRecommendations();
          break;
        
        case CONFIG.types.CONTEXTUAL:
          data = await loadContextualRecommendations();
          break;
        
        case CONFIG.types.SIMILAR:
          data = await loadSimilarRecommendations();
          break;
        
        case CONFIG.types.CONTINUE_WATCHING:
          data = await loadContinueWatchingRecommendations();
          break;
        
        default:
          throw new Error(`Type de recommandation non supporté: ${type}`);
      }
      
      // Limiter le nombre de recommandations
      const limitedData = data.slice(0, limit);
      
      // Enregistrer dans le cache
      await saveToCache(limitedData);
      
      // Mettre à jour l'état
      setRecommendations(limitedData);
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations:', error);
      setError(error.message || 'Erreur lors du chargement des recommandations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [
    type, 
    limit, 
    loadFromCache, 
    saveToCache, 
    loadTrendingRecommendations, 
    loadPersonalizedRecommendations, 
    loadContextualRecommendations, 
    loadSimilarRecommendations, 
    loadContinueWatchingRecommendations
  ]);
  
  /**
   * Rafraîchit les recommandations
   */
  const refreshRecommendations = useCallback(() => {
    // Forcer le rechargement en ignorant le cache
    const loadWithoutCache = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Charger les recommandations selon le type
        let data = [];
        
        switch (type) {
          case CONFIG.types.TRENDING:
            data = await loadTrendingRecommendations();
            break;
          
          case CONFIG.types.PERSONALIZED:
            data = await loadPersonalizedRecommendations();
            break;
          
          case CONFIG.types.CONTEXTUAL:
            data = await loadContextualRecommendations();
            break;
          
          case CONFIG.types.SIMILAR:
            data = await loadSimilarRecommendations();
            break;
          
          case CONFIG.types.CONTINUE_WATCHING:
            data = await loadContinueWatchingRecommendations();
            break;
          
          default:
            throw new Error(`Type de recommandation non supporté: ${type}`);
        }
        
        // Limiter le nombre de recommandations
        const limitedData = data.slice(0, limit);
        
        // Enregistrer dans le cache
        await saveToCache(limitedData);
        
        // Mettre à jour l'état
        setRecommendations(limitedData);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement des recommandations:', error);
        setError(error.message || 'Erreur lors du rafraîchissement des recommandations');
      } finally {
        setLoading(false);
      }
    };
    
    loadWithoutCache();
  }, [
    type, 
    limit, 
    saveToCache, 
    loadTrendingRecommendations, 
    loadPersonalizedRecommendations, 
    loadContextualRecommendations, 
    loadSimilarRecommendations, 
    loadContinueWatchingRecommendations
  ]);
  
  // Charger les recommandations au montage du composant
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);
  
  // Retourner l'état et les fonctions
  return {
    recommendations,
    loading,
    error,
    contextData,
    refreshRecommendations,
    CONFIG
  };
};

export default useRecommendations;
