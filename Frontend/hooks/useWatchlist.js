import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer la liste de visionnage (watchlist) de l'utilisateur
 * Permet d'ajouter, supprimer et vérifier si un élément est dans la liste
 */
export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la liste depuis le localStorage au montage du composant
  useEffect(() => {
    const loadWatchlist = () => {
      try {
        const savedWatchlist = localStorage.getItem('flodrama_watchlist');
        if (savedWatchlist) {
          setWatchlist(JSON.parse(savedWatchlist));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la liste de visionnage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  // Sauvegarder la liste dans le localStorage à chaque modification
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('flodrama_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, isLoading]);

  // Vérifier si un élément est dans la liste
  const isInWatchlist = useCallback((itemId) => {
    return watchlist.some(item => item.id === itemId);
  }, [watchlist]);

  // Ajouter un élément à la liste
  const addToWatchlist = useCallback((item) => {
    if (!item || !item.id) return;
    
    setWatchlist(prev => {
      // Vérifier si l'élément est déjà dans la liste
      if (prev.some(existingItem => existingItem.id === item.id)) {
        return prev;
      }
      
      // Ajouter l'élément avec la date d'ajout
      return [...prev, {
        id: item.id,
        title: item.title,
        poster: item.poster,
        type: item.type || 'drama',
        year: item.year,
        addedAt: new Date().toISOString()
      }];
    });
  }, []);

  // Supprimer un élément de la liste
  const removeFromWatchlist = useCallback((itemId) => {
    setWatchlist(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Basculer un élément dans la liste (ajouter s'il n'y est pas, supprimer s'il y est)
  const toggleWatchlist = useCallback((item) => {
    if (isInWatchlist(item.id)) {
      removeFromWatchlist(item.id);
      return false; // Retourne false pour indiquer que l'élément a été supprimé
    } else {
      addToWatchlist(item);
      return true; // Retourne true pour indiquer que l'élément a été ajouté
    }
  }, [isInWatchlist, removeFromWatchlist, addToWatchlist]);

  // Obtenir tous les éléments de la liste
  const getWatchlist = useCallback(() => {
    return [...watchlist].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }, [watchlist]);

  return {
    watchlist: getWatchlist(),
    isLoading,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist
  };
};

export default useWatchlist;
