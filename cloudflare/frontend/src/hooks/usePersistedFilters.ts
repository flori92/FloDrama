/**
 * Hook personnalisé pour gérer la persistance des filtres dans localStorage
 * 
 * Ce hook permet de stocker les filtres sélectionnés par l'utilisateur
 * pour chaque catégorie de contenu, afin qu'ils soient conservés entre les visites.
 */

import { useState, useEffect } from 'react';

/**
 * Interface générique pour les filtres de toutes les catégories
 */
export interface FilterState {
  genre?: string;
  year?: string;
  country?: string;
  season?: string;
  decade?: string;
  sortBy: string;
  [key: string]: any;
}

/**
 * Hook personnalisé pour persister les filtres dans le localStorage
 * @param categoryKey Clé unique pour identifier la catégorie (film, drama, anime, bollywood)
 * @param defaultFilters Valeurs par défaut des filtres
 * @returns [filterState, setFilters] - État des filtres et fonction pour les mettre à jour
 */
export function usePersistedFilters<T extends FilterState>(
  categoryKey: string,
  defaultFilters: T
): [T, (newFilters: Partial<T> | ((prev: T) => T)) => void] {
  // Clé complète pour le localStorage (préfixée pour éviter les collisions)
  const storageKey = `flodrama_filters_${categoryKey}`;
  
  // Initialisation des filtres depuis localStorage ou valeurs par défaut
  const [filters, setFiltersState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultFilters;
    
    try {
      const savedFilters = localStorage.getItem(storageKey);
      
      if (savedFilters) {
        // Fusionner les filtres sauvegardés avec les valeurs par défaut pour s'assurer
        // que tous les champs nécessaires sont présents (cas où le schéma aurait changé)
        return { ...defaultFilters, ...JSON.parse(savedFilters) };
      }
      
      return defaultFilters;
    } catch (error) {
      console.error('Erreur lors de la récupération des filtres depuis localStorage:', error);
      return defaultFilters;
    }
  });
  
  // Fonction pour mettre à jour les filtres et les sauvegarder
  const setFilters = (newFilters: Partial<T> | ((prev: T) => T)) => {
    setFiltersState(prev => {
      const nextFilters = typeof newFilters === 'function'
        ? newFilters(prev)
        : { ...prev, ...newFilters };
      
      // Sauvegarder dans localStorage
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(nextFilters));
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des filtres dans localStorage:', error);
      }
      
      return nextFilters;
    });
  };
  
  // Écouter les changements de filtres entre différents onglets/fenêtres
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const updatedFilters = JSON.parse(event.newValue);
          setFiltersState(prev => ({ ...prev, ...updatedFilters }));
        } catch (error) {
          console.error('Erreur lors du traitement des filtres depuis le stockage:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey]);
  
  return [filters, setFilters];
}

export default usePersistedFilters;
