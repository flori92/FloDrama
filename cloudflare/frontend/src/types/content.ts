/**
 * Types pour les contenus de FloDrama
 */

// Type pour les éléments de contenu
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  poster?: string; // Alias pour posterUrl dans certains contextes
  imageUrl?: string; // URL alternative pour l'image
  backdrop?: string;
  releaseDate: string;
  year?: string | number; // Année de sortie (peut être extraite de releaseDate)
  rating: number;
  duration: number;
  trailerUrl?: string;
  trailer_url?: string; // Format alternatif pour trailerUrl
  videoId?: string; // ID de la vidéo pour la lecture
  watch_url?: string; // URL pour regarder le contenu
  category?: string;
  content_type?: string; // Type de contenu (drama, anime, movie, bollywood)
  genres?: string[];
  episodeCount?: number;
  seasonCount?: number;
  language?: string;
  country?: string;
  status?: 'ongoing' | 'completed' | 'upcoming';
  progress?: number; // Pour le contenu "Continuer à regarder"
  popularity?: number; // Score de popularité
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
