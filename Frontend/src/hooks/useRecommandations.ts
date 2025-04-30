import { useState, useEffect, useCallback } from 'react';
import { RecommandationService, ContenuMedia } from '@/services/RecommandationService';

interface UserPreferences {
  favoriteGenres: string[];
  preferredContentTypes: string[];
  language: string;
  subtitlesEnabled: boolean;
  autoplayEnabled: boolean;
}

interface UseRecommandationsOptions {
  userPreferences?: UserPreferences;
  nombreElements?: number;
  rafraichissementAutomatique?: boolean;
  intervalleRafraichissement?: number;
}

interface UseRecommandationsResult {
  recommandations: ContenuMedia[];
  isLoading: boolean;
  error: Error | null;
  rafraichir: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les recommandations
 * Intègre la logique de mise à jour automatique et de gestion d'état
 */
export const useRecommandations = (options: UseRecommandationsOptions = {}) => {
  const {
    userPreferences,
    nombreElements = 10,
    rafraichissementAutomatique = false,
    intervalleRafraichissement = 5000,
  } = options;

  const [recommandations, setRecommandations] = useState<ContenuMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommandations = useCallback(async () => {
    try {
      setIsLoading(true);
      const recommandationService = RecommandationService.getInstance();
      const recommendations = await recommandationService.getRecommendations(
        userPreferences,
        nombreElements
      );
      setRecommandations(recommendations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    } finally {
      setIsLoading(false);
    }
  }, [userPreferences, nombreElements]);

  useEffect(() => {
    fetchRecommandations();

    if (rafraichissementAutomatique) {
      const interval = setInterval(fetchRecommandations, intervalleRafraichissement);
      return () => clearInterval(interval);
    }
  }, [fetchRecommandations, rafraichissementAutomatique, intervalleRafraichissement]);

  return {
    recommandations,
    isLoading,
    error,
    rafraichir: fetchRecommandations,
  };
};

// Types d'export pour TypeScript
export type { ContenuMedia };
