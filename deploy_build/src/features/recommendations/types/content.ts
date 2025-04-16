export interface ContentMetadata {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  categories: string[];
  createdAt: string;
}

export interface ContentRecommendation {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  score: number;
  metadata: ContentMetadata;
}

export interface RecommendationCarouselProps {
  userId: string;
  categories?: string[];
  onContentSelect?: (content: ContentMetadata) => void;
}
