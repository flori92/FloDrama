import { useEffect, useState } from 'react';
import { View, Text, Image, Video } from '@lynx-js/core';
import { useAnimation } from '@lynx-js/hooks';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import './styles.css';

interface HeroContent {
  id: string;
  title: string;
  description: string;
  backdropUrl: string;
  trailerUrl?: string;
  genres: string[];
  rating?: number;
  releaseDate?: string;
  duration?: string;
}

interface HeroCarouselProps {
  contents: HeroContent[];
  autoPlayInterval?: number;
  onContentSelect?: (id: string) => void;
}

export const HeroCarousel = ({
  contents,
  autoPlayInterval = 8000,
  onContentSelect
}: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const { preferences } = useUserPreferences();

  // Animations Lynx
  const slideAnimation = useAnimation({
    initial: { opacity: 0, scale: 1.1 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    duration: 800,
    easing: 'easeOutCubic'
  });

  const contentAnimation = useAnimation({
    initial: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
    duration: 600,
    easing: 'easeOutCubic'
  });

  // Gestion du défilement automatique
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contents.length);
      setShowTrailer(false);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, contents.length, autoPlayInterval]);

  // Gestion de la lecture du trailer
  useEffect(() => {
    if (preferences.autoplayTrailers && contents[currentIndex].trailerUrl) {
      const timer = setTimeout(() => {
        setShowTrailer(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, preferences.autoplayTrailers]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setShowTrailer(false);
  };

  const handleMouseEnter = () => {
    setIsPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsPlaying(true);
  };

  const currentContent = contents[currentIndex];

  return (
    <View 
      className="hero-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fond avec effet parallaxe */}
      <View className="hero-carousel__background" animation={slideAnimation}>
        {showTrailer && currentContent.trailerUrl ? (
          <Video
            className="hero-carousel__trailer"
            src={currentContent.trailerUrl}
            autoPlay
            muted
            loop
          />
        ) : (
          <Image
            className="hero-carousel__backdrop"
            src={currentContent.backdropUrl}
            alt={currentContent.title}
          />
        )}
        <View className="hero-carousel__overlay" />
      </View>

      {/* Contenu */}
      <View className="hero-carousel__content" animation={contentAnimation}>
        <Text className="hero-carousel__title">
          {currentContent.title}
        </Text>

        {/* Métadonnées */}
        <View className="hero-carousel__metadata">
          {currentContent.rating && (
            <Text className="hero-carousel__rating">
              ★ {currentContent.rating.toFixed(1)}
            </Text>
          )}
          {currentContent.releaseDate && (
            <Text className="hero-carousel__date">
              {new Date(currentContent.releaseDate).getFullYear()}
            </Text>
          )}
          {currentContent.duration && (
            <Text className="hero-carousel__duration">
              {currentContent.duration}
            </Text>
          )}
        </View>

        {/* Genres */}
        <View className="hero-carousel__genres">
          {currentContent.genres.map((genre, index) => (
            <Text key={index} className="hero-carousel__genre">
              {genre}
            </Text>
          ))}
        </View>

        {/* Description */}
        <Text className="hero-carousel__description">
          {currentContent.description}
        </Text>

        {/* Boutons d'action */}
        <View className="hero-carousel__actions">
          <View 
            className="hero-carousel__button hero-carousel__button--primary"
            onClick={() => onContentSelect?.(currentContent.id)}
          >
            <Image
              src="/icons/play.svg"
              alt="Lecture"
              className="hero-carousel__button-icon"
            />
            <Text>Regarder</Text>
          </View>
          <View 
            className="hero-carousel__button hero-carousel__button--secondary"
            onClick={() => setShowTrailer(!showTrailer)}
          >
            <Image
              src={showTrailer ? "/icons/info.svg" : "/icons/play-trailer.svg"}
              alt={showTrailer ? "Plus d'infos" : "Bande annonce"}
              className="hero-carousel__button-icon"
            />
            <Text>{showTrailer ? "Plus d'infos" : "Bande annonce"}</Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View className="hero-carousel__navigation">
        {contents.map((_, index) => (
          <View
            key={index}
            className={`hero-carousel__dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          >
            <View 
              className="hero-carousel__dot-progress"
              style={{
                animationDuration: `${autoPlayInterval}ms`,
                animationPlayState: isPlaying && index === currentIndex ? 'running' : 'paused'
              }}
            />
          </View>
        ))}
      </View>

      {/* Boutons précédent/suivant */}
      <View 
        className="hero-carousel__arrow hero-carousel__arrow--prev"
        onClick={() => handleDotClick((currentIndex - 1 + contents.length) % contents.length)}
      >
        <Image src="/icons/chevron-left.svg" alt="Précédent" />
      </View>
      <View 
        className="hero-carousel__arrow hero-carousel__arrow--next"
        onClick={() => handleDotClick((currentIndex + 1) % contents.length)}
      >
        <Image src="/icons/chevron-right.svg" alt="Suivant" />
      </View>
    </View>
  );
};
