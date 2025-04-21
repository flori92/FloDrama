import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ContenuMedia } from '../services/RecommandationService';

interface UserState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  preferences: {
    favoriteGenres: string[];
    preferredContentTypes: string[];
    language: string;
    theme: 'dark' | 'light' | 'system';
    notifications: {
      newContent: boolean;
      recommendations: boolean;
      updates: boolean;
    };
  };
  watchlist: string[];
  viewingHistory: {
    contentId: string;
    timestamp: string;
    progress: number;
  }[];
  setUser: (user: UserState['user']) => void;
  setPreferences: (preferences: Partial<UserState['preferences']>) => void;
  addToWatchlist: (contentId: string) => void;
  removeFromWatchlist: (contentId: string) => void;
  updateViewingHistory: (contentId: string, progress: number) => void;
}

export const useStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      preferences: {
        favoriteGenres: ['action', 'drama'],
        preferredContentTypes: ['drama', 'movie'],
        language: 'fr',
        theme: 'dark',
        notifications: {
          newContent: true,
          recommendations: true,
          updates: true,
        },
      },
      watchlist: [],
      viewingHistory: [],
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setPreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
      addToWatchlist: (contentId) =>
        set((state) => ({
          watchlist: [...new Set([...state.watchlist, contentId])],
        })),
      removeFromWatchlist: (contentId) =>
        set((state) => ({
          watchlist: state.watchlist.filter((id) => id !== contentId),
        })),
      updateViewingHistory: (contentId, progress) =>
        set((state) => {
          const timestamp = new Date().toISOString();
          const currentHistory = state.viewingHistory.filter(
            (item) => item.contentId !== contentId
          );
          return {
            viewingHistory: [
              { contentId, timestamp, progress },
              ...currentHistory,
            ].slice(0, 100), // Garder uniquement les 100 derniers éléments
          };
        }),
    }),
    {
      name: 'flodrama-storage',
    }
  )
); 