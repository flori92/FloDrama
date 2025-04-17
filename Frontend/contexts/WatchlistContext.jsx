import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * Contexte pour gérer la liste de visionnage de l'utilisateur
 */
const WatchlistContext = createContext();

/**
 * Fournisseur du contexte de liste de visionnage
 * Gère l'ajout, la suppression et la récupération des éléments de la liste
 */
export const WatchlistProvider = ({ children }) => {
  // État local pour stocker les éléments de la liste
  const [watchlist, setWatchlist] = useState([]);
  
  // Charger la liste depuis le stockage local au montage
  useEffect(() => {
    const storedWatchlist = localStorage.getItem('flodrama_watchlist');
    
    if (storedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(storedWatchlist);
        setWatchlist(parsedWatchlist);
      } catch (error) {
        console.error('Erreur lors du chargement de la liste de visionnage:', error);
        // En cas d'erreur, réinitialiser la liste
        localStorage.setItem('flodrama_watchlist', JSON.stringify([]));
      }
    }
  }, []);
  
  // Sauvegarder la liste dans le stockage local à chaque modification
  useEffect(() => {
    localStorage.setItem('flodrama_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);
  
  /**
   * Vérifier si un élément est dans la liste
   * @param {string} id - ID de l'élément à vérifier
   * @returns {boolean} - True si l'élément est dans la liste
   */
  const isInWatchlist = (id) => {
    return watchlist.some(item => item.id === id);
  };
  
  /**
   * Ajouter ou supprimer un élément de la liste
   * @param {Object} item - Élément à ajouter ou supprimer
   * @returns {boolean} - True si l'élément a été ajouté, false s'il a été supprimé
   */
  const toggleWatchlist = (item) => {
    if (!item || !item.id) return false;
    
    if (isInWatchlist(item.id)) {
      // Supprimer l'élément de la liste
      setWatchlist(prev => prev.filter(i => i.id !== item.id));
      return false;
    } else {
      // Ajouter l'élément à la liste
      const itemToAdd = {
        id: item.id,
        title: item.title,
        posterUrl: item.posterUrl,
        type: item.type,
        year: item.year,
        addedAt: new Date().toISOString()
      };
      
      setWatchlist(prev => [...prev, itemToAdd]);
      return true;
    }
  };
  
  /**
   * Supprimer un élément de la liste
   * @param {string} id - ID de l'élément à supprimer
   */
  const removeFromWatchlist = (id) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };
  
  /**
   * Vider complètement la liste
   */
  const clearWatchlist = () => {
    setWatchlist([]);
  };
  
  // Valeur du contexte
  const value = {
    watchlist,
    isInWatchlist,
    toggleWatchlist,
    removeFromWatchlist,
    clearWatchlist
  };
  
  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte de liste de visionnage
 * @returns {Object} - Fonctions et données de la liste de visionnage
 */
export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  
  if (!context) {
    throw new Error('useWatchlist doit être utilisé à l\'intérieur d\'un WatchlistProvider');
  }
  
  return context;
};
