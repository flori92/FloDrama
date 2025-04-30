// Types pour les contenus de l'application
export type ContentType = 'drama' | 'anime' | 'film' | 'bollywood';

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
}

export interface Carousel {
  id: string;
  title: string;
  type: string;
  items: ContentItem[];
  position?: number;
  is_active?: boolean;
}

export interface HeroBanner {
  id: string;
  items: {
    id: string;
    title: string;
    description: string;
    backdrop: string;
    poster?: string;
    type: ContentType;
    content_id: string;
  }[];
}

export interface SearchResponse {
  results: ContentItem[];
  resultsCount: number;
  status?: 'loading' | 'completed' | 'error';
}
