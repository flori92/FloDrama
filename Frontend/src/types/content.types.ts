// Types pour les contenus de l'application
export type ContentType = 'drama' | 'anime' | 'film' | 'bollywood';

// Interface pour les éléments de contenu de base
export interface ContentItem {
  id: string;
  title: string;
  original_title?: string;
  poster: string;
  backdrop?: string;
  year: number;
  rating: number;
  language: string;
  source: string;
  type: ContentType;
}

// Interface pour les éléments de contenu avec backdrop obligatoire
export interface ContentItemWithBackdrop extends ContentItem {
  backdrop: string;
}

// Interface pour les détails d'un contenu
export interface ContentDetail extends ContentItem {
  description: string;
  synopsis: string;
  genres: string[];
  tags?: string[];
  actors?: string[];
  director?: string;
  episode_count?: number;
  episodes?: any[];
  seasons?: any[];
  duration?: number;
  status?: string;
  release_date?: string;
  streaming_urls?: { quality: string; url: string }[];
  trailers?: { title?: string; url: string }[];
  images?: string[];
  subtitles?: { language: string; url: string }[];
  related_content?: ContentItem[];
  user_ratings?: any;
  popularity_score?: number;
  is_premium?: boolean;
  gallery?: string[];
  image?: string;
  content_id?: string;
  content_type?: string;
}

// Interface pour un carousel
export interface Carousel {
  id: string;
  title: string;
  type: string;
  items: ContentItem[];
  position?: number;
  is_active?: boolean;
}

// Interface pour un élément de bannière
export interface HeroBannerItem {
  id: string;
  title: string;
  description: string;
  backdrop: string;
  poster?: string;
  type: ContentType;
  content_id: string;
}

// Interface pour une bannière
export interface HeroBanner {
  id: string;
  items: HeroBannerItem[];
}

// Interface pour les résultats de recherche
export interface SearchResponse {
  results: ContentItem[];
  resultsCount: number;
  status?: 'loading' | 'completed' | 'error';
}
