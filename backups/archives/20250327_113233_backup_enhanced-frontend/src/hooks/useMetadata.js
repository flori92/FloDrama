import { useState, useEffect, useCallback } from 'react';
import { fetchMetadata } from '../api/metadata.js';

/**
 * Hook personnalisé pour gérer les métadonnées de FloDrama
 * Fournit un accès aux données et des fonctions utilitaires
 */
export const useMetadata = () => {
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fonction pour charger les métadonnées
  const loadMetadata = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchMetadata();
      setMetadata(data);
    } catch (err) {
      console.error('Erreur lors du chargement des métadonnées:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Charger les métadonnées au montage du composant
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);
  
  // Fonction pour obtenir un élément par ID
  const getItemById = useCallback((id) => {
    if (!metadata) return null;
    
    // Rechercher dans toutes les sections
    for (const section of ['dramas', 'movies', 'anime', 'bollywood']) {
      if (!metadata[section]) continue;
      
      const found = metadata[section].find(item => item.id === id);
      if (found) return { ...found, section };
    }
    
    return null;
  }, [metadata]);
  
  // Fonction pour obtenir tous les éléments
  const getAllItems = useCallback(() => {
    if (!metadata) return [];
    
    const allItems = [];
    ['dramas', 'movies', 'anime', 'bollywood'].forEach(section => {
      if (metadata[section]) {
        metadata[section].forEach(item => {
          allItems.push({ ...item, section });
        });
      }
    });
    
    return allItems;
  }, [metadata]);
  
  // Fonction pour obtenir les éléments mis en avant
  const getFeaturedItems = useCallback(() => {
    if (!metadata?.featured) return [];
    
    return metadata.featured.map(id => getItemById(id)).filter(Boolean);
  }, [metadata, getItemById]);
  
  // Fonction pour obtenir les éléments tendances
  const getTrendingItems = useCallback(() => {
    if (!metadata?.trending) return [];
    
    return metadata.trending.map(id => getItemById(id)).filter(Boolean);
  }, [metadata, getItemById]);
  
  // Fonction pour obtenir les éléments recommandés
  const getRecommendedItems = useCallback(() => {
    if (!metadata?.recommended) return [];
    
    return metadata.recommended.map(id => getItemById(id)).filter(Boolean);
  }, [metadata, getItemById]);
  
  // Fonction pour obtenir les éléments d'une section
  const getSectionItems = useCallback((sectionId) => {
    if (!metadata) return { title: '', items: [] };
    
    // Sections prédéfinies
    const predefinedSections = {
      'featured': { title: 'En Vedette', items: getFeaturedItems() },
      'trending': { title: 'Tendances', items: getTrendingItems() },
      'recommended': { title: 'Recommandés pour vous', items: getRecommendedItems() },
      'dramas': { title: 'Dramas', items: metadata.dramas || [] },
      'movies': { title: 'Films', items: metadata.movies || [] },
      'anime': { title: 'Anime', items: metadata.anime || [] },
      'bollywood': { title: 'Bollywood', items: metadata.bollywood || [] },
    };
    
    if (predefinedSections[sectionId]) {
      return predefinedSections[sectionId];
    }
    
    // Sections personnalisées (pour compatibilité)
    const customSections = {
      'nouveautes': { title: 'Nouveautés', items: getFeaturedItems() },
      'tendances': { title: 'Tendances', items: getTrendingItems() },
      'historiques': { title: 'Drames Historiques', items: metadata.dramas?.slice(0, 4) || [] },
      'romance': { title: 'Romance', items: getAllItems().filter(item => item.genres?.includes('Romance')).slice(0, 4) },
      'action': { title: 'Action', items: getAllItems().filter(item => item.genres?.includes('Action')).slice(0, 4) }
    };
    
    return customSections[sectionId] || { title: '', items: [] };
  }, [metadata, getFeaturedItems, getTrendingItems, getRecommendedItems, getAllItems]);
  
  // Fonction pour obtenir les widgets (pour compatibilité)
  const getWidgets = useCallback(() => {
    if (!metadata) return [];
    
    // Créer des widgets à partir des données existantes
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
  }, [metadata, getFeaturedItems]);
  
  // Fonction pour obtenir les catégories
  const getCategories = useCallback(() => {
    return metadata?.categories || [];
  }, [metadata]);
  
  // Fonction pour rechercher des contenus
  const searchContent = useCallback((query, filters = {}) => {
    if (!query || !metadata) return [];
    
    const allItems = getAllItems();
    const normalizedQuery = query.toLowerCase().trim();
    
    return allItems.filter(item => {
      // Filtrer par texte
      const matchesText = 
        item.title.toLowerCase().includes(normalizedQuery) || 
        item.originalTitle?.toLowerCase().includes(normalizedQuery) || 
        item.synopsis?.toLowerCase().includes(normalizedQuery);
      
      if (!matchesText) return false;
      
      // Filtrer par type
      if (filters.type && item.type !== filters.type) return false;
      
      // Filtrer par genre
      if (filters.genre && !item.genres?.includes(filters.genre)) return false;
      
      // Filtrer par pays
      if (filters.country && item.country !== filters.country) return false;
      
      // Filtrer par année
      if (filters.year && item.year !== filters.year) return false;
      
      // Filtrer par note minimale
      if (filters.minRating && item.rating < filters.minRating) return false;
      
      return true;
    });
  }, [metadata, getAllItems]);
  
  // Fonction pour obtenir les films français
  const getFrenchMovies = useCallback(() => {
    if (!metadata) return [];
    
    return getAllItems().filter(item => 
      // Filtrer par source
      (item.source === 'cinepulse' || item.source === 'xalaflix') ||
      // Ou par pays de production
      (item.country && item.country.toLowerCase() === 'france') ||
      // Ou par langue
      (item.language && item.language.toLowerCase() === 'français')
    );
  }, [metadata, getAllItems]);
  
  return {
    isLoading,
    error,
    metadata,
    getItemById,
    getAllItems,
    getFeaturedItems,
    getTrendingItems,
    getRecommendedItems,
    getSectionItems,
    getWidgets,
    getCategories,
    searchContent,
    getFrenchMovies,
    refresh: loadMetadata
  };
};
