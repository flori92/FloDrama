import React from 'react';
const { createContext, useState, useContext, useEffect } = React;
import { fetchAllItems, fetchPopularItems, fetchRecentItems, fetchItemsByType } from '../api/enhanced-metadata';

/**
 * Contexte pour gérer les métadonnées de l'application
 */
const MetadataContext = createContext();

/**
 * Fournisseur du contexte de métadonnées
 * Gère le chargement et la mise à disposition des données de contenu
 */
export const MetadataProvider = ({ children }) => {
  // États pour stocker les données
  const [allItems, setAllItems] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [dramaItems, setDramaItems] = useState([]);
  const [movieItems, setMovieItems] = useState([]);
  const [animeItems, setAnimeItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Charger les données au montage du composant
  useEffect(() => {
    loadAllData();
    
    // Rafraîchir les données toutes les 30 minutes
    const refreshInterval = setInterval(() => {
      loadAllData();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  /**
   * Charger toutes les données nécessaires
   */
  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer tous les éléments
      const items = await fetchAllItems();
      setAllItems(items);
      
      // Récupérer les éléments populaires
      const popular = await fetchPopularItems(20);
      setPopularItems(popular);
      
      // Récupérer les éléments récents
      const recent = await fetchRecentItems(20);
      setRecentItems(recent);
      
      // Récupérer les dramas
      const dramas = await fetchItemsByType('drama');
      setDramaItems(dramas);
      
      // Récupérer les films
      const movies = await fetchItemsByType('movie');
      setMovieItems(movies);
      
      // Récupérer les animes (filtrer par genre)
      const animes = items.filter(item => 
        item.genres && item.genres.some(genre => 
          genre.toLowerCase().includes('anime') || genre.toLowerCase().includes('animation')
        )
      );
      setAnimeItems(animes);
      
      // Mettre à jour la date de dernière mise à jour
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erreur lors du chargement des métadonnées:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Récupérer un élément par son ID
   * @param {string} id - ID de l'élément à récupérer
   * @returns {Object|null} - Élément trouvé ou null
   */
  const getItemById = (id) => {
    if (!id || !allItems.length) return null;
    return allItems.find(item => item.id === id) || null;
  };
  
  /**
   * Rechercher des éléments par titre
   * @param {string} query - Requête de recherche
   * @returns {Array} - Éléments correspondants
   */
  const searchItems = (query) => {
    if (!query || !allItems.length) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return allItems.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const originalTitle = item.originalTitle?.toLowerCase() || '';
      
      return title.includes(normalizedQuery) || 
             originalTitle.includes(normalizedQuery);
    });
  };
  
  /**
   * Filtrer les éléments par pays
   * @param {string} country - Pays à filtrer
   * @returns {Array} - Éléments correspondants
   */
  const filterByCountry = (country) => {
    if (!country || !allItems.length) return [];
    
    const normalizedCountry = country.toLowerCase().trim();
    
    return allItems.filter(item => {
      const itemCountry = item.country?.toLowerCase() || '';
      return itemCountry.includes(normalizedCountry);
    });
  };
  
  /**
   * Filtrer les éléments par genre
   * @param {string} genre - Genre à filtrer
   * @returns {Array} - Éléments correspondants
   */
  const filterByGenre = (genre) => {
    if (!genre || !allItems.length) return [];
    
    const normalizedGenre = genre.toLowerCase().trim();
    
    return allItems.filter(item => {
      return item.genres && item.genres.some(g => 
        g.toLowerCase().includes(normalizedGenre)
      );
    });
  };
  
  /**
   * Obtenir des éléments similaires à un élément donné
   * @param {string} id - ID de l'élément de référence
   * @param {number} limit - Nombre maximum d'éléments à retourner
   * @returns {Array} - Éléments similaires
   */
  const getSimilarItems = (id, limit = 10) => {
    const item = getItemById(id);
    
    if (!item || !allItems.length) return [];
    
    // Filtrer les éléments par genre et pays similaires
    const similarItems = allItems.filter(otherItem => {
      // Exclure l'élément lui-même
      if (otherItem.id === id) return false;
      
      // Vérifier si les genres correspondent
      const hasMatchingGenre = item.genres && otherItem.genres && 
        item.genres.some(genre => otherItem.genres.includes(genre));
      
      // Vérifier si le pays correspond
      const hasMatchingCountry = item.country && otherItem.country && 
        item.country === otherItem.country;
      
      return hasMatchingGenre || hasMatchingCountry;
    });
    
    // Trier par pertinence (nombre de genres en commun)
    return similarItems
      .sort((a, b) => {
        const aMatchCount = item.genres.filter(genre => a.genres.includes(genre)).length;
        const bMatchCount = item.genres.filter(genre => b.genres.includes(genre)).length;
        return bMatchCount - aMatchCount;
      })
      .slice(0, limit);
  };
  
  // Valeur du contexte
  const value = {
    allItems,
    popularItems,
    recentItems,
    dramaItems,
    movieItems,
    animeItems,
    isLoading,
    error,
    lastUpdated,
    getItemById,
    searchItems,
    filterByCountry,
    filterByGenre,
    getSimilarItems,
    refreshData: loadAllData
  };
  
  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte de métadonnées
 * @returns {Object} - Fonctions et données des métadonnées
 */
export const useMetadata = () => {
  const context = useContext(MetadataContext);
  
  if (!context) {
    throw new Error('useMetadata doit être utilisé à l\'intérieur d\'un MetadataProvider');
  }
  
  return context;
};
