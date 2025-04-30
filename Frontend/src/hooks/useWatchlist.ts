import { useState, useEffect } from 'react';
import { getWatchlist, updateWatchProgress } from '../services/watchlistService';

interface WatchlistItem {
  contenuId: string;
  dateVisionnage: string;
  tempsVisionnage: number;
  termine: boolean;
}

interface UseWatchlistReturn {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateProgress: (contentId: string, tempsVisionnage: number, termine: boolean) => Promise<void>;
}

export function useWatchlist(userId: string, token: string): UseWatchlistReturn {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWatchlist(userId, token);
      setWatchlist(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement de la watchlist'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const updateProgress = async (contentId: string, tempsVisionnage: number, termine: boolean) => {
    try {
      await updateWatchProgress(userId, contentId, tempsVisionnage, termine, token);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur mise à jour progression'));
    }
  };

  return {
    watchlist,
    isLoading,
    error,
    refresh,
    updateProgress
  };
}
