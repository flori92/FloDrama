/**
 * Hook de recommandations pour FloDrama
 * 
 * Ce hook gère les recommandations personnalisées basées sur les préférences
 * utilisateur et l'historique de visionnage, adapté pour l'architecture Cloudflare.
 */

import { useState, useEffect, useCallback } from 'react';
import recommendationService, { 
  UserPreferences, 
  RecommendationParams 
} from '../services/recommendationService';
import { ContentItem } from '../services/apiService';

interface UseRecommendationsOptions {
  userId: string;
  initialParams?: RecommendationParams;
  refreshInterval?: number; // en millisecondes
}

interface UseRecommendationsResult {
  recommendations: ContentItem[];
  isLoading: boolean;
  error: Error | null;
  refreshRecommendations: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les recommandations
 * Intègre la logique de mise à jour automatique et de gestion d'état
 */
export function useRecommendations({
  userId,
  initialParams = { limit: 10 },
  refreshInterval = 5 * 60 * 1000 // 5 minutes par défaut
}: UseRecommendationsOptions): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<RecommendationParams>(initialParams);

  // Fonction de chargement des recommandations
  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await recommendationService.getPersonalizedRecommendations(userId, params);
      setRecommendations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement des recommandations'));
      console.error('Erreur lors du chargement des recommandations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, params]);

  // Mise à jour des préférences utilisateur
  const updateUserPreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const success = await recommendationService.updateUserPreferences(userId, newPreferences);
      
      if (success) {
        // Recharger les recommandations avec les nouvelles préférences
        await loadRecommendations();
      } else {
        throw new Error('Échec de la mise à jour des préférences');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de mise à jour des préférences'));
      console.error('Erreur lors de la mise à jour des préférences:', err);
    }
  };

  // Chargement initial et mise en place de l'intervalle de rafraîchissement
  useEffect(() => {
    loadRecommendations();

    // Mettre en place l'intervalle de rafraîchissement
    const intervalId = setInterval(loadRecommendations, refreshInterval);

    // Nettoyage lors du démontage
    return () => {
      clearInterval(intervalId);
    };
  }, [loadRecommendations, refreshInterval]);

  // Fonction de rafraîchissement manuel
  const refreshRecommendations = async () => {
    await loadRecommendations();
  };

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations,
    updateUserPreferences
  };
}

export default useRecommendations;
