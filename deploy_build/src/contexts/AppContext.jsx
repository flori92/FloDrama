import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import mockData from '../data/mockData';

/**
 * Contexte principal de l'application FloDrama
 * Centralise la gestion des données et des préférences
 */
const AppContext = createContext();

/**
 * Hook personnalisé pour utiliser le contexte de l'application
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext doit être utilisé à l'intérieur d'un AppProvider");
  }
  return context;
};

/**
 * Fournisseur du contexte de l'application
 * Gère l'état global et les données
 */
export const AppProvider = ({ children }) => {
  // État du thème
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // État des données
  const [contentData, setContentData] = useState({
    popular: [],
    dramas: [],
    movies: [],
    animes: [],
    frenchMovies: []
  });
  
  // État de chargement
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Charger les données mockées au démarrage
  useEffect(() => {
    try {
      console.log('Chargement des données mockées...');
      
      // Vérifier si les données mockées sont disponibles
      if (mockData) {
        // Utiliser directement les données de homePageData si disponibles
        if (mockData.homePageData) {
          setContentData({
            popular: mockData.homePageData.popular || [],
            dramas: mockData.dramas || [],
            movies: mockData.movies || [],
            animes: mockData.animes || [],
            frenchMovies: mockData.frenchMovies || []
          });
        } else {
          // Fallback au format précédent
          setContentData({
            popular: [...(mockData.dramas || []), ...(mockData.movies || []), ...(mockData.animes || [])].slice(0, 10),
            dramas: mockData.dramas || [],
            movies: mockData.movies || [],
            animes: mockData.animes || [],
            frenchMovies: mockData.frenchMovies || []
          });
        }
      } else {
        console.warn('Données mockées non disponibles');
        setContentData({
          popular: [],
          dramas: [],
          movies: [],
          animes: [],
          frenchMovies: []
        });
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);
  
  // Basculer le thème
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
    // Appliquer le thème au document
    document.body.classList.toggle('theme-dark', !isDarkMode);
    document.body.classList.toggle('theme-light', isDarkMode);
  }, [isDarkMode]);
  
  // Obtenir les éléments en vedette
  const getFeaturedItems = useCallback(() => {
    return contentData.popular.slice(0, 5);
  }, [contentData.popular]);
  
  // Obtenir les éléments tendance
  const getTrendingItems = useCallback(() => {
    return contentData.popular;
  }, [contentData.popular]);
  
  // Obtenir les éléments recommandés
  const getRecommendedItems = useCallback(() => {
    // Mélanger les éléments pour simuler des recommandations
    const allItems = [
      ...contentData.dramas,
      ...contentData.movies,
      ...contentData.animes
    ];
    
    // Fonction de mélange aléatoire
    const shuffleArray = (array) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };
    
    return shuffleArray(allItems).slice(0, 10);
  }, [contentData]);
  
  // Obtenir tous les éléments d'un type spécifique
  const getAllItems = useCallback((type) => {
    switch (type) {
      case 'drama':
        return contentData.dramas;
      case 'movie':
        return contentData.movies;
      case 'anime':
        return contentData.animes;
      case 'french':
        return contentData.frenchMovies;
      default:
        return [
          ...contentData.dramas,
          ...contentData.movies,
          ...contentData.animes,
          ...contentData.frenchMovies
        ];
    }
  }, [contentData]);
  
  // Obtenir les films français
  const getFrenchMovies = useCallback(() => {
    return contentData.frenchMovies;
  }, [contentData.frenchMovies]);
  
  // Rechercher des éléments par mot-clé
  const searchItems = useCallback((query) => {
    if (!query || query.length < 2) {
      return [];
    }
    
    const allItems = [
      ...contentData.dramas,
      ...contentData.movies,
      ...contentData.animes,
      ...contentData.frenchMovies
    ];
    
    const normalizedQuery = query.toLowerCase();
    
    return allItems.filter(item => 
      item.title.toLowerCase().includes(normalizedQuery) ||
      (item.description && item.description.toLowerCase().includes(normalizedQuery)) ||
      (item.genres && item.genres.some(genre => genre.toLowerCase().includes(normalizedQuery)))
    );
  }, [contentData]);
  
  // Obtenir un élément par son ID
  const getItemById = useCallback((id) => {
    const allItems = [
      ...contentData.dramas,
      ...contentData.movies,
      ...contentData.animes,
      ...contentData.frenchMovies
    ];
    
    return allItems.find(item => item.id === id);
  }, [contentData]);
  
  // Obtenir les éléments similaires à un élément donné
  const getSimilarItems = useCallback((item, count = 5) => {
    if (!item) {
      return [];
    }
    
    const sameTypeItems = getAllItems(item.type);
    
    // Exclure l'élément lui-même
    const filteredItems = sameTypeItems.filter(i => i.id !== item.id);
    
    // Trier par similarité (même genre)
    const sortedItems = filteredItems.sort((a, b) => {
      const aCommonGenres = a.genres ? a.genres.filter(genre => item.genres && item.genres.includes(genre)).length : 0;
      const bCommonGenres = b.genres ? b.genres.filter(genre => item.genres && item.genres.includes(genre)).length : 0;
      return bCommonGenres - aCommonGenres;
    });
    
    return sortedItems.slice(0, count);
  }, [getAllItems]);
  
  // Obtenir les sections (pour compatibilité)
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
  
  // Valeur du contexte
  const contextValue = {
    // Thème
    isDarkMode,
    toggleTheme,
    theme: {
      colors: {
        primary: '#3b82f6',
        accent: '#d946ef',
        gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
        background: isDarkMode ? '#121118' : '#f5f5f5',
        surface: isDarkMode ? '#1A1926' : '#ffffff',
        text: isDarkMode ? '#ffffff' : '#121118',
        textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px'
      },
      transitions: {
        default: '0.3s ease'
      }
    },
    
    // Données
    isLoading,
    error,
    contentData,
    
    // Méthodes
    getFeaturedItems,
    getTrendingItems,
    getRecommendedItems,
    getAllItems,
    getFrenchMovies,
    searchItems,
    getItemById,
    getSimilarItems,
    getSectionItems
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
