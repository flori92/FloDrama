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
  
  // Fonction pour obtenir les sections (pour compatibilité)
  const getSectionItems = useCallback((sectionId) => {
    // Sections prédéfinies
    const predefinedSections = {
      'featured': { title: 'En Vedette', items: getFeaturedItems() },
      'trending': { title: 'Tendances', items: getTrendingItems() },
      'recommended': { title: 'Recommandés pour vous', items: getRecommendedItems() },
      'dramas': { title: 'Dramas', items: getAllItems('drama') },
      'movies': { title: 'Films', items: getAllItems('movie') },
      'anime': { title: 'Anime', items: getAllItems('anime') },
      'french': { title: 'Cinéma Français', items: getFrenchMovies() }
    };
    
    if (predefinedSections[sectionId]) {
      return predefinedSections[sectionId];
    }
    
    // Sections personnalisées (pour compatibilité)
    const customSections = {
      'nouveautes': { title: 'Nouveautés', items: getFeaturedItems() },
      'tendances': { title: 'Tendances', items: getTrendingItems() },
      'recommandes': { title: 'Recommandés pour vous', items: getRecommendedItems() },
      'romance': { title: 'Romance', items: getAllItems().filter(item => item.genres?.includes('Romance')).slice(0, 10) },
      'action': { title: 'Action', items: getAllItems().filter(item => item.genres?.includes('Action')).slice(0, 10) }
    };
    
    return customSections[sectionId] || { title: '', items: [] };
  }, [getFeaturedItems, getTrendingItems, getRecommendedItems, getAllItems, getFrenchMovies]);
  
  // Fonction pour obtenir les widgets (pour compatibilité)
  const getWidgets = useCallback(() => {
    const featuredItems = getFeaturedItems();
    
    if (featuredItems.length === 0) return [];
    
    return [
      {
        id: 'hero-featured',
        type: 'featured',
        position: 'hero',
        content: {
          id: featuredItems[0].id,
          tagline: featuredItems[0].description || 'Découvrez ce contenu exclusif',
          cta: 'Regarder maintenant',
          item: featuredItems[0]
        }
      }
    ];
  }, [getFeaturedItems]);
  
  // Fonction pour obtenir les catégories
  const getCategories = useCallback(() => {
    return [
      { id: 'drama', name: 'Dramas', count: getAllItems('drama').length },
      { id: 'movie', name: 'Films', count: getAllItems('movie').length },
      { id: 'anime', name: 'Anime', count: getAllItems('anime').length },
      { id: 'french', name: 'Cinéma Français', count: getFrenchMovies().length }
    ];
  }, [getAllItems, getFrenchMovies]);
  
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
    getSectionItems,
    getWidgets,
    getCategories,
    refresh
  };
};
