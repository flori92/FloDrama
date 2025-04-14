import React, { useState, useEffect } from 'react';
// Importer directement depuis l'index des adaptateurs
import { View, Text, ScrollView, TouchableOpacity, Image, styled, useNavigation } from '../../adapters';

// Types pour les recommandations
export interface Recommendation {
  id: string;
  title: string;
  imageUrl: string;
  type: 'movie' | 'series' | 'anime';
  rating?: number;
  releaseYear?: number;
  duration?: number;
  genres?: string[];
}

interface RecommendationCarouselProps {
  title: string;
  recommendations: Recommendation[];
  onItemPress?: (item: Recommendation) => void;
  maxItems?: number;
  showRating?: boolean;
  showYear?: boolean;
  testID?: string;
}

// Styles pour le carousel
const CarouselContainer = styled(View)`
  margin-vertical: 16px;
`;

const CarouselTitle = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-left: 16px;
  color: ${(props: any) => props.theme?.colors?.text || '#000'};
`;

const ItemsContainer = styled(ScrollView)`
  padding-horizontal: 8px;
`;

const ItemContainer = styled(TouchableOpacity)`
  width: 140px;
  margin-horizontal: 8px;
`;

const ItemImage = styled(Image)`
  width: 100%;
  height: 200px;
  border-radius: 8px;
`;

const ItemTitle = styled(Text)`
  font-size: 14px;
  margin-top: 8px;
  color: ${(props: any) => props.theme?.colors?.text || '#000'};
`;

const ItemMeta = styled(Text)`
  font-size: 12px;
  color: ${(props: any) => props.theme?.colors?.textSecondary || '#666'};
  margin-top: 4px;
`;

const RatingBadge = styled(View)`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 12px;
`;

const RatingText = styled(Text)`
  color: #FFC107;
  font-size: 12px;
  font-weight: bold;
`;

/**
 * Composant carousel pour afficher des recommandations de contenu
 */
export const RecommendationCarousel: React.FC<RecommendationCarouselProps> = ({
  title,
  recommendations,
  onItemPress,
  maxItems = 10,
  showRating = true,
  showYear = true,
  testID
}) => {
  const navigation = useNavigation();
  const [items, setItems] = useState<Recommendation[]>([]);

  useEffect(() => {
    // Limiter le nombre d'éléments affichés
    setItems(recommendations.slice(0, maxItems));
  }, [recommendations, maxItems]);

  const handleItemPress = (item: Recommendation) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      // Navigation par défaut vers la page de détails
      navigation.navigate('ContentDetails', { contentId: item.id });
    }
  };

  return (
    <CarouselContainer testID={testID}>
      <CarouselTitle>{title}</CarouselTitle>
      <ItemsContainer
        horizontal
        showsHorizontalScrollIndicator={false}
        testID={`${testID}-scrollview`}
      >
        {items.map((item) => (
          <ItemContainer
            key={item.id}
            onPress={() => handleItemPress(item)}
            testID={`${testID}-item-${item.id}`}
          >
            <ItemImage
              source={{ uri: item.imageUrl }}
              resizeMode="cover"
              testID={`${testID}-image-${item.id}`}
            />
            {showRating && item.rating && (
              <RatingBadge>
                <RatingText>{item.rating.toFixed(1)}</RatingText>
              </RatingBadge>
            )}
            <ItemTitle numberOfLines={2}>{item.title}</ItemTitle>
            {showYear && item.releaseYear && (
              <ItemMeta>{item.releaseYear}</ItemMeta>
            )}
          </ItemContainer>
        ))}
      </ItemsContainer>
    </CarouselContainer>
  );
};

export default RecommendationCarousel;
