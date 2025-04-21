import { useState, useEffect, useCallback } from 'react';
import RecommandationService, { 
  ContenuMedia, 
  PreferencesUtilisateur 
} from '@/services/RecommandationService';

interface UseRecommandationsOptions {
  userId: string;
  nombreElements?: number;
  intervalleMiseAJour?: number; // en millisecondes
}

interface UseRecommandationsResult {
  contenus: ContenuMedia[];
  isLoading: boolean;
  error: Error | null;
  rafraichirRecommandations: () => Promise<void>;
  mettreAJourPreferences: (preferences: Partial<PreferencesUtilisateur>) => Promise<void>;
}

/**
 * Hook personnalisé pour gérer les recommandations
 * Intègre la logique de mise à jour automatique et de gestion d'état
 */
export const useRecommandations = ({
  userId,
  nombreElements = 10,
  intervalleMiseAJour = 5 * 60 * 1000 // 5 minutes par défaut
}: UseRecommandationsOptions): UseRecommandationsResult => {
  const [contenus, setContenus] = useState<ContenuMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [preferences, setPreferences] = useState<PreferencesUtilisateur>({
    genresPrefers: [],
    languesPreferees: [],
    parametres: {
      autoplay: false,
      qualitePreferee: 'auto',
      sousTitresParDefaut: true,
      langueAudioPreferee: 'fr'
    }
  });

  // Fonction de chargement des recommandations
  const chargerRecommandations = useCallback(async () => {
    try {
      setIsLoading(true);
      const recommandations = await RecommandationService.getRecommandations(
        userId,
        nombreElements
      );
      setContenus(recommandations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement des recommandations'));
      // Log détaillé pour le débogage
      console.error('Erreur lors du chargement des recommandations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, nombreElements]);

  // Mise à jour des préférences
  const mettreAJourPreferences = async (nouvellesPreferences: Partial<PreferencesUtilisateur>) => {
    try {
      const succes = await RecommandationService.mettreAJourPreferences(userId, nouvellesPreferences);
      
      if (succes) {
        setPreferences(prev => ({
          ...prev,
          ...nouvellesPreferences
        }));
        
        // Recharger les recommandations avec les nouvelles préférences
        await chargerRecommandations();
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
    chargerRecommandations();

    // Mettre en place l'intervalle de rafraîchissement
    const intervalId = setInterval(chargerRecommandations, intervalleMiseAJour);

    // Nettoyage lors du démontage
    return () => {
      clearInterval(intervalId);
    };
  }, [chargerRecommandations, intervalleMiseAJour]);

  // Fonction de rafraîchissement manuel
  const rafraichirRecommandations = async () => {
    await chargerRecommandations();
  };

  return {
    contenus,
    isLoading,
    error,
    rafraichirRecommandations,
    mettreAJourPreferences
  };
};

// Types d'export pour TypeScript
export type { ContenuMedia, PreferencesUtilisateur };
