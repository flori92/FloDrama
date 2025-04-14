import React from '@lynx/react';
import { LynxView, LynxText, LynxImage, LynxScrollView, LynxTouchable, LynxSpinner } from '@lynx/core';
import { useTheme } from '@lynx/hooks';
import { AIRecommendationService } from '../services/AIRecommendationService';
import { ContentMetadata, ContentRecommendation, RecommendationCarouselProps } from '../types/content';

export const RecommendationCarousel: React.FC<RecommendationCarouselProps> = ({
  userId,
  categories = [],
  onContentSelect
}) => {
  const theme = useTheme();
  const [recommendations, setRecommendations] = React.useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const recommendationService = React.useMemo(() => new AIRecommendationService(), []);

  const loadRecommendations = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userRecommendations = await recommendationService.getRecommendations(userId, categories);
      setRecommendations(userRecommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [userId, categories, recommendationService]);

  React.useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleContentPress = (content: ContentMetadata) => {
    onContentSelect?.(content);
  };

  if (loading) {
    return (
      <LynxView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg
        }}
        testID="recommendations-loading"
      >
        <LynxSpinner
          size="large"
          color={theme.colors.primary}
        />
      </LynxView>
    );
  }

  if (error) {
    return (
      <LynxView
        style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.error,
          borderRadius: theme.radius.md
        }}
        testID="recommendations-error"
      >
        <LynxText
          style={{
            color: theme.colors.onError,
            fontSize: theme.fontSize.md
          }}
        >
          {error}
        </LynxText>
      </LynxView>
    );
  }

  return (
    <LynxView
      style={{
        marginVertical: theme.spacing.md
      }}
      testID="recommendations-container"
    >
      <LynxText
        style={{
          fontSize: theme.fontSize.lg,
          fontWeight: 'bold',
          marginBottom: theme.spacing.md,
          color: theme.colors.text
        }}
        testID="recommendations-title"
      >
        Recommandations personnalisées
      </LynxText>

      <LynxScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0
        }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md
        }}
        testID="recommendations-scroll"
      >
        {recommendations.map((recommendation) => (
          <LynxTouchable
            key={recommendation.content.id}
            onPress={() => handleContentPress(recommendation.content)}
            style={{
              marginRight: theme.spacing.md,
              width: 200,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              overflow: 'hidden'
            }}
            testID={`recommendation-item-${recommendation.content.id}`}
          >
            <LynxImage
              source={{ uri: recommendation.content.thumbnailUrl }}
              style={{
                width: '100%',
                height: 120
              }}
              resizeMode="cover"
            />
            <LynxView
              style={{
                padding: theme.spacing.sm
              }}
            >
              <LynxText
                style={{
                  fontSize: theme.fontSize.md,
                  fontWeight: 'bold',
                  marginBottom: theme.spacing.xs,
                  color: theme.colors.text
                }}
                numberOfLines={2}
              >
                {recommendation.content.title}
              </LynxText>
              <LynxText
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text,
                  opacity: 0.7
                }}
                numberOfLines={3}
              >
                {recommendation.content.description}
              </LynxText>
            </LynxView>
          </LynxTouchable>
        ))}
      </LynxScrollView>
    </LynxView>
  );
};
