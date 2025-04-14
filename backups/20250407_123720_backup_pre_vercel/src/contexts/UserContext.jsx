import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * Contexte pour gérer les données utilisateur
 */
const UserContext = createContext();

/**
 * Fournisseur du contexte utilisateur
 * Gère l'authentification, les préférences et l'historique de visionnage
 */
export const UserProvider = ({ children }) => {
  // États pour stocker les données utilisateur
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [preferences, setPreferences] = useState({
    subtitleLanguage: 'fr',
    videoQuality: 'auto',
    autoplay: true,
    darkMode: true
  });
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Charger les données utilisateur depuis le stockage local au montage
  useEffect(() => {
    const loadUserData = () => {
      setIsLoading(true);
      
      // Charger les données utilisateur
      const storedUser = localStorage.getItem('flodrama_user');
      const storedPreferences = localStorage.getItem('flodrama_preferences');
      const storedWatchHistory = localStorage.getItem('flodrama_watch_history');
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Erreur lors du chargement des données utilisateur:', error);
          localStorage.removeItem('flodrama_user');
        }
      }
      
      if (storedPreferences) {
        try {
          const parsedPreferences = JSON.parse(storedPreferences);
          setPreferences(prev => ({ ...prev, ...parsedPreferences }));
        } catch (error) {
          console.error('Erreur lors du chargement des préférences:', error);
          localStorage.removeItem('flodrama_preferences');
        }
      }
      
      if (storedWatchHistory) {
        try {
          const parsedWatchHistory = JSON.parse(storedWatchHistory);
          setWatchHistory(parsedWatchHistory);
        } catch (error) {
          console.error('Erreur lors du chargement de l\'historique de visionnage:', error);
          localStorage.removeItem('flodrama_watch_history');
        }
      }
      
      setIsLoading(false);
    };
    
    loadUserData();
  }, []);
  
  // Sauvegarder les données utilisateur dans le stockage local à chaque modification
  useEffect(() => {
    if (user) {
      localStorage.setItem('flodrama_user', JSON.stringify(user));
    }
  }, [user]);
  
  // Sauvegarder les préférences dans le stockage local à chaque modification
  useEffect(() => {
    localStorage.setItem('flodrama_preferences', JSON.stringify(preferences));
  }, [preferences]);
  
  // Sauvegarder l'historique de visionnage dans le stockage local à chaque modification
  useEffect(() => {
    localStorage.setItem('flodrama_watch_history', JSON.stringify(watchHistory));
  }, [watchHistory]);
  
  /**
   * Connecter un utilisateur
   * @param {Object} userData - Données de l'utilisateur
   */
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  /**
   * Déconnecter l'utilisateur
   */
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('flodrama_user');
  };
  
  /**
   * Mettre à jour les préférences utilisateur
   * @param {Object} newPreferences - Nouvelles préférences
   */
  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };
  
  /**
   * Ajouter un élément à l'historique de visionnage
   * @param {Object} item - Élément à ajouter
   * @param {number} progress - Progression de visionnage (0-100)
   */
  const addToWatchHistory = (item, progress = 0) => {
    if (!item || !item.id) return;
    
    setWatchHistory(prev => {
      // Vérifier si l'élément existe déjà dans l'historique
      const existingIndex = prev.findIndex(entry => entry.id === item.id);
      
      if (existingIndex !== -1) {
        // Mettre à jour l'élément existant
        const updatedHistory = [...prev];
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          progress,
          lastWatched: new Date().toISOString()
        };
        return updatedHistory;
      } else {
        // Ajouter un nouvel élément
        const newEntry = {
          id: item.id,
          title: item.title,
          posterUrl: item.posterUrl,
          type: item.type,
          progress,
          lastWatched: new Date().toISOString()
        };
        
        // Limiter l'historique à 100 éléments
        const newHistory = [newEntry, ...prev];
        if (newHistory.length > 100) {
          return newHistory.slice(0, 100);
        }
        return newHistory;
      }
    });
  };
  
  /**
   * Supprimer un élément de l'historique de visionnage
   * @param {string} id - ID de l'élément à supprimer
   */
  const removeFromWatchHistory = (id) => {
    setWatchHistory(prev => prev.filter(item => item.id !== id));
  };
  
  /**
   * Vider l'historique de visionnage
   */
  const clearWatchHistory = () => {
    setWatchHistory([]);
  };
  
  /**
   * Obtenir la progression de visionnage d'un élément
   * @param {string} id - ID de l'élément
   * @returns {number} - Progression (0-100)
   */
  const getWatchProgress = (id) => {
    if (!id) return 0;
    
    const historyItem = watchHistory.find(item => item.id === id);
    return historyItem ? historyItem.progress : 0;
  };
  
  // Valeur du contexte
  const value = {
    user,
    isAuthenticated,
    preferences,
    watchHistory,
    isLoading,
    login,
    logout,
    updatePreferences,
    addToWatchHistory,
    removeFromWatchHistory,
    clearWatchHistory,
    getWatchProgress
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte utilisateur
 * @returns {Object} - Fonctions et données utilisateur
 */
export const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser doit être utilisé à l\'intérieur d\'un UserProvider');
  }
  
  return context;
};
