import React from 'react';
import { Card } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Spinner } from '@/components/ui/Spinner';
import { ContentRecommendation } from '../types/content';

interface RecommendationCarouselProps {
  recommendations: ContentRecommendation[];
  loading?: boolean;
  onSelect?: (recommendation: ContentRecommendation) => void;
}

export const RecommendationCarousel: React.FC<RecommendationCarouselProps> = ({
  recommendations,
  loading = false,
  onSelect,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune recommandation disponible
      </div>
    );
  }

  return (
    <ScrollArea className="w-full" horizontal>
      <div className="flex space-x-4 p-4">
        {recommendations.map((recommendation) => (
          <div key={recommendation.id}>
            <Card
              className="w-64 cursor-pointer transition-transform hover:scale-105"
              onClick={() => onSelect?.(recommendation)}
              hoverable
            >
              <div className="relative h-36">
                <img
                  src={recommendation.thumbnailUrl}
                  alt={recommendation.title}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                  {recommendation.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {recommendation.description}
                </p>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
