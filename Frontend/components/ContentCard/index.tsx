import { useEffect, useState } from 'react';
import { View, Text, Image, Video } from '@lynx-js/core';
import { useAnimation, useHover } from '@lynx-js/hooks';
import { RecommandationService } from '../../services/RecommandationService';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import './styles.css';

interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  trailerUrl?: string;
  backdropUrl?: string;
  rating?: number;
  genres?: string[];
  duration?: string;
  inWatchlist?: boolean;
  onWatchlistToggle?: (id: string) => void;
}

export const ContentCard = ({
  id,
  title,
  description,
  posterUrl,
  trailerUrl,
  backdropUrl,
  rating,
  genres,
  duration,
  inWatchlist,
  onWatchlistToggle
}: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const { preferences } = useUserPreferences();
  
  // Animations Lynx
  const cardAnimation = useAnimation({
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -10 },
    duration: 300,
    easing: 'easeOutCubic'
  });

  const contentAnimation = useAnimation({
    initial: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    duration: 200,
    easing: 'easeOutCubic'
  });

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (preferences.autoplayTrailers && trailerUrl) {
      setTimeout(() => setShowTrailer(true), 500);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTrailer(false);
  };

  const handleLike = async () => {
    try {
      if (isDisliked) setIsDisliked(false);
      setIsLiked(!isLiked);
      await RecommandationService.updateContentPreference(id, !isLiked ? 'like' : 'neutral');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  };

  const handleDislike = async () => {
    try {
      if (isLiked) setIsLiked(false);
      setIsDisliked(!isDisliked);
      await RecommandationService.updateContentPreference(id, !isDisliked ? 'dislike' : 'neutral');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  };

  const handleWatchlistToggle = () => {
    onWatchlistToggle?.(id);
  };

  return (
    <View
      className="content-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animation={cardAnimation}
    >
      {/* Image principale */}
      <Image
        className="content-card__poster"
        src={posterUrl}
        alt={title}
        loading="lazy"
      />

      {/* Overlay avec contenu détaillé */}
      <View
        className={`content-card__overlay ${isHovered ? 'visible' : ''}`}
        animation={contentAnimation}
      >
        {/* Trailer ou backdrop */}
        {showTrailer && trailerUrl ? (
          <Video
            className="content-card__trailer"
            src={trailerUrl}
            autoPlay
            muted
            loop
          />
        ) : (
          <Image
            className="content-card__backdrop"
            src={backdropUrl || posterUrl}
            alt={title}
          />
        )}

        {/* Informations */}
        <View className="content-card__content">
          <Text className="content-card__title">{title}</Text>
          
          {/* Métadonnées */}
          <View className="content-card__metadata">
            {rating && (
              <Text className="content-card__rating">
                ★ {rating.toFixed(1)}
              </Text>
            )}
            {duration && (
              <Text className="content-card__duration">
                {duration}
              </Text>
            )}
          </View>

          {/* Genres */}
          {genres && genres.length > 0 && (
            <View className="content-card__genres">
              {genres.map((genre, index) => (
                <Text key={index} className="content-card__genre">
                  {genre}
                </Text>
              ))}
            </View>
          )}

          {/* Description */}
          <Text className="content-card__description">
            {description}
          </Text>

          {/* Actions */}
          <View className="content-card__actions">
            <View
              className={`content-card__action ${isLiked ? 'active' : ''}`}
              onClick={handleLike}
            >
              <Image
                src={isLiked ? '/icons/thumb-up-filled.svg' : '/icons/thumb-up.svg'}
                alt="Like"
              />
            </View>
            <View
              className={`content-card__action ${isDisliked ? 'active' : ''}`}
              onClick={handleDislike}
            >
              <Image
                src={isDisliked ? '/icons/thumb-down-filled.svg' : '/icons/thumb-down.svg'}
                alt="Dislike"
              />
            </View>
            <View
              className={`content-card__action ${inWatchlist ? 'active' : ''}`}
              onClick={handleWatchlistToggle}
            >
              <Image
                src={inWatchlist ? '/icons/bookmark-filled.svg' : '/icons/bookmark.svg'}
                alt="Ajouter à la liste"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
