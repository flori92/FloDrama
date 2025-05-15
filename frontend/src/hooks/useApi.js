/**
 * Hook personnalisé pour faciliter l'utilisation du service API dans les composants React
 * Ce hook gère automatiquement les états de chargement, d'erreur et de données
 */

import { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

/**
 * Hook pour effectuer des appels API avec gestion d'état
 * @param {string} method - Méthode du service API à appeler (ex: 'getTrending', 'getRecent')
 * @param {Array} params - Paramètres à passer à la méthode API
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.skip - Si true, l'appel API n'est pas effectué
 * @param {Function} options.onSuccess - Callback appelé en cas de succès
 * @param {Function} options.onError - Callback appelé en cas d'erreur
 * @returns {Object} - { data, loading, error, refetch }
 */
const useApi = (method, params = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [callCount, setCallCount] = useState(0);

  // Vérifier que la méthode existe dans le service API
  if (!ApiService[method]) {
    console.error(`La méthode ${method} n'existe pas dans le service API`);
    setError(`La méthode ${method} n'existe pas dans le service API`);
  }

  // Fonction pour effectuer l'appel API
  const fetchData = async () => {
    if (options.skip) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Appeler dynamiquement la méthode du service API avec les paramètres
      const result = await ApiService[method](...params);
      setData(result);
      
      // Appeler le callback onSuccess si défini
      if (options.onSuccess) {
        options.onSuccess(result);
      }
    } catch (err) {
      console.error(`Erreur lors de l'appel à ${method}:`, err);
      setError(err.message || 'Une erreur est survenue');
      
      // Appeler le callback onError si défini
      if (options.onError) {
        options.onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Effet pour effectuer l'appel API au montage ou lorsque les dépendances changent
  useEffect(() => {
    fetchData();
  }, [method, JSON.stringify(params), options.skip, callCount]);

  // Fonction pour relancer l'appel API manuellement
  const refetch = () => {
    setCallCount(prev => prev + 1);
  };

  return { data, loading, error, refetch };
};

export default useApi;
