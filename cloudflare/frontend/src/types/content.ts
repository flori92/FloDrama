/**
 * Types pour les contenus de FloDrama
 */

// Type pour les éléments de contenu
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdrop?: string;
  releaseDate: string;
  rating: number;
  duration: number;
  trailerUrl?: string;
  videoId?: string; // ID de la vidéo pour la lecture
  category?: string;
  genres?: string[];
  episodeCount?: number;
  seasonCount?: number;
  language?: string;
  country?: string;
  status?: 'ongoing' | 'completed' | 'upcoming';
  progress?: number; // Pour le contenu "Continuer à regarder"
}

// Type pour les réponses de l'API
export interface ApiResponse<T> {
  data: T;
  status: string;
  message?: string;
}

// Type pour les paramètres de requête
export interface QueryParams {
  page?: number;
  limit?: number;
  year?: string | number;
  genre?: string;
  language?: string;
  sort?: string;
}

// Type pour les préférences utilisateur
export interface UserPreferences {
  genres: string[];
  languages: string[];
  contentTypes: string[];
}

// Type pour l'historique de visionnage
export interface WatchHistory {
  contentId: string;
  progress: number;
  lastWatched: string;
}
