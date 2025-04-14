export interface ContentMetadata {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  releaseDate: string;
  language: string;
  subtitles: string[];
  categories: string[];
  rating: number;
  views: number;
}

export interface ContentRecommendation {
  content: ContentMetadata;
  similarity: {
    contentId: string;
    score: number;
  }[];
  factors: {
    name: string;
    weight: number;
  }[];
}

export interface RecommendationCarouselProps {
  userId: string;
  categories?: string[];
  onContentSelect?: (content: ContentMetadata) => void;
}
