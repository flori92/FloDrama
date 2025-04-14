import { useState, useEffect, useCallback } from 'react';
import MockContentService from '../services/MockContentService';

/**
 * Hook personnalisé pour gérer les métadonnées de FloDrama
 * Version simplifiée utilisant le service de contenu mockée
 */
export const useMetadata = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fonction pour obtenir les éléments en vedette
  const getFeaturedItems = useCallback(() => {
    return MockContentService.getFeaturedItems();
  }, []);
  
  // Fonction pour obtenir les éléments tendance
  const getTrendingItems = useCallback(() => {
    return MockContentService.getTrendingItems();
  }, []);
  
  // Fonction pour obtenir les éléments recommandés
  const getRecommendedItems = useCallback(() => {
    return MockContentService.getRecommendedItems();
  }, []);
  
  // Fonction pour obtenir tous les éléments
  const getAllItems = useCallback((type) => {
    return MockContentService.getAllItems(type);
  }, []);
  
  // Fonction pour obtenir les films français
  const getFrenchMovies = useCallback(() => {
    return MockContentService.getFrenchMovies();
  }, []);
  
  // Fonction pour rechercher des contenus
  const searchContent = useCallback((query) => {
    return MockContentService.searchItems(query);
  }, []);
  
  // Fonction pour obtenir un élément par ID
  const getItemById = useCallback((id) => {
    return MockContentService.getItemById(id);
  }, []);
  
  // Fonction pour obtenir les éléments similaires
  const getSimilarItems = useCallback((item, count = 5) => {
    return MockContentService.getSimilarItems(item, count);
  }, []);
  
  // Fonction pour rafraîchir les données
  const refresh = useCallback(() => {
    console.log('Rafraîchissement des données mockées');
    return Promise.resolve(true);
  }, []);
  
  return {
    isLoading,
    error,
    getFeaturedItems,
    getTrendingItems,
    getRecommendedItems,
    getAllItems,
    getFrenchMovies,
    searchContent,
    getItemById,
    getSimilarItems,
    refresh
  };
};

export default useMetadata;
