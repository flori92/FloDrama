import { useState, useEffect } from 'react';
import {
  getUserPreferences,
  updateUserPreferences,
  likeContent,
  dislikeContent,
  addToFavorites,
  removeFromFavorites
} from '../services/userPreferencesService';

interface UserPreferences {
  favoris: string[];
  notesMoyennes: Record<string, number>;
  historique: Array<{
    contenuId: string;
    dateVisionnage: string;
    tempsVisionnage: number;
    termine: boolean;
  }>;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  addFavori: (contentId: string) => Promise<void>;
  removeFavori: (contentId: string) => Promise<void>;
  setLike: (contentId: string, genre: string) => Promise<void>;
  setDislike: (contentId: string, genre: string) => Promise<void>;
}

export function useUserPreferences(userId: string, token: string): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserPreferences(userId, token);
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement des préférences'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const addFavori = async (contentId: string) => {
    try {
      await addToFavorites(userId, contentId, token);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur ajout favori'));
    }
  };

  const removeFavori = async (contentId: string) => {
    try {
      await removeFromFavorites(userId, contentId, token);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur retrait favori'));
    }
  };

  const setLike = async (contentId: string, genre: string) => {
    try {
      await likeContent(userId, contentId, genre, token);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur like'));
    }
  };

  const setDislike = async (contentId: string, genre: string) => {
    try {
      await dislikeContent(userId, contentId, genre, token);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur dislike'));
    }
  };

  return {
    preferences,
    isLoading,
    error,
    refresh,
    addFavori,
    removeFavori,
    setLike,
    setDislike
  };
}
