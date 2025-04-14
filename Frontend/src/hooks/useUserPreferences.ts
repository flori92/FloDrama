import { useState, useEffect } from 'react';
import { RecommandationService } from '../services/RecommandationService';

interface UserPreferences {
  autoplayTrailers: boolean;
  enableNotifications: boolean;
  preferredLanguages: string[];
  preferredGenres: string[];
  subtitleLanguage: string;
  videoQuality: 'auto' | '480p' | '720p' | '1080p';
  watchlist: string[];
  likedContent: string[];
  dislikedContent: string[];
  viewingHistory: {
    contentId: string;
    timestamp: string;
    progress: number;
  }[];
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  isLoading: boolean;
  error: Error | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  toggleWatchlist: (contentId: string) => Promise<void>;
  updateContentPreference: (contentId: string, preference: 'like' | 'dislike' | 'neutral') => Promise<void>;
  updateViewingProgress: (contentId: string, progress: number) => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  autoplayTrailers: true,
  enableNotifications: true,
  preferredLanguages: ['fr', 'ko', 'ja', 'zh'],
  preferredGenres: [],
  subtitleLanguage: 'fr',
  videoQuality: 'auto',
  watchlist: [],
  likedContent: [],
  dislikedContent: [],
  viewingHistory: []
};

export const useUserPreferences = (): UseUserPreferencesReturn => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Chargement initial des préférences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      // Récupération des préférences depuis le localStorage
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }

      // Synchronisation avec le backend
      const serverPrefs = await RecommandationService.getUserPreferences();
      if (serverPrefs) {
        const mergedPrefs = {
          ...defaultPreferences,
          ...JSON.parse(savedPrefs || '{}'),
          ...serverPrefs
        };
        setPreferences(mergedPrefs);
        localStorage.setItem('userPreferences', JSON.stringify(mergedPrefs));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des préférences'));
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...updates };
      setPreferences(updatedPreferences);
      localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));

      // Synchronisation avec le backend
      await RecommandationService.updateUserPreferences(updates);

      // Mise à jour des recommandations si nécessaire
      if (updates.preferredGenres || updates.preferredLanguages) {
        await RecommandationService.refreshRecommendations();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour des préférences'));
      throw err;
    }
  };

  const toggleWatchlist = async (contentId: string) => {
    try {
      const isInWatchlist = preferences.watchlist.includes(contentId);
      const updatedWatchlist = isInWatchlist
        ? preferences.watchlist.filter(id => id !== contentId)
        : [...preferences.watchlist, contentId];

      await updatePreferences({ watchlist: updatedWatchlist });
      await RecommandationService.updateWatchlist(contentId, !isInWatchlist);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour de la liste de lecture'));
      throw err;
    }
  };

  const updateContentPreference = async (contentId: string, preference: 'like' | 'dislike' | 'neutral') => {
    try {
      const { likedContent, dislikedContent } = preferences;

      let updatedLiked = [...likedContent];
      let updatedDisliked = [...dislikedContent];

      // Mise à jour des listes selon la préférence
      switch (preference) {
        case 'like':
          updatedLiked = [...new Set([...likedContent, contentId])];
          updatedDisliked = dislikedContent.filter(id => id !== contentId);
          break;
        case 'dislike':
          updatedDisliked = [...new Set([...dislikedContent, contentId])];
          updatedLiked = likedContent.filter(id => id !== contentId);
          break;
        case 'neutral':
          updatedLiked = likedContent.filter(id => id !== contentId);
          updatedDisliked = dislikedContent.filter(id => id !== contentId);
          break;
      }

      await updatePreferences({
        likedContent: updatedLiked,
        dislikedContent: updatedDisliked
      });

      // Mise à jour des recommandations
      await RecommandationService.updateContentPreference(contentId, preference);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour des préférences de contenu'));
      throw err;
    }
  };

  const updateViewingProgress = async (contentId: string, progress: number) => {
    try {
      const timestamp = new Date().toISOString();
      const currentHistory = preferences.viewingHistory.filter(
        item => item.contentId !== contentId
      );

      const updatedHistory = [
        { contentId, timestamp, progress },
        ...currentHistory
      ].slice(0, 100); // Garder uniquement les 100 derniers éléments

      await updatePreferences({ viewingHistory: updatedHistory });
      await RecommandationService.updateViewingProgress(contentId, progress);

      // Si le contenu est terminé (progress >= 0.9), mettre à jour les recommandations
      if (progress >= 0.9) {
        await RecommandationService.refreshRecommendations();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour de la progression'));
      throw err;
    }
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    toggleWatchlist,
    updateContentPreference,
    updateViewingProgress
  };
};
