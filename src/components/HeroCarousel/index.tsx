import { useEffect, useState, useRef } from 'react';
import React from 'react';

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

  // Animation avec React hooks
  const [isAnimating, setIsAnimating] = useState(false);
  const [isContentAnimating, setIsContentAnimating] = useState(false);
  const slideRef = useRef(null);
  const contentRef = useRef(null);
  
  // Fonction pour déclencher les animations
  const triggerAnimations = () => {
    setIsAnimating(true);
    setIsContentAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsContentAnimating(false);
    }, 800);
  };

  // Gestion du défilement automatique
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contents.length);
      triggerAnimations();
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
    triggerAnimations();
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
    <div 
      className="hero-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fond avec effet parallaxe */}
      <div className={`hero-carousel__background ${isAnimating ? "animating" : ""}`} ref={slideRef}>
        {showTrailer && currentContent.trailerUrl ? (
          <video
            className="hero-carousel__trailer"
            src={currentContent.trailerUrl}
            autoPlay
            muted
            loop
          />
        ) : (
          <img
            className="hero-carousel__backdrop"
            src={currentContent.backdropUrl}
            alt={currentContent.title}
          />
        )}
        <div className="hero-carousel__overlay" />
      </div>

      {/* Contenu */}
      <div className={`hero-carousel__content ${isContentAnimating ? "animating" : ""}`} ref={contentRef}>
        <span className="hero-carousel__title">
          {currentContent.title}
        </span>

        {/* Métadonnées */}
        <div className="hero-carousel__metadata">
          {currentContent.rating && (
            <span className="hero-carousel__rating">
              ★ {currentContent.rating.toFixed(1)}
            </span>
          )}
          {currentContent.releaseDate && (
            <span className="hero-carousel__date">
              {new Date(currentContent.releaseDate).getFullYear()}
            </span>
          )}
          {currentContent.duration && (
            <span className="hero-carousel__duration">
              {currentContent.duration}
            </span>
          )}
        </div>

        {/* Genres */}
        <div className="hero-carousel__genres">
          {currentContent.genres.map((genre, index) => (
            <span key={index} className="hero-carousel__genre">
              {genre}
            </span>
          ))}
        </div>

        {/* Description */}
        <span className="hero-carousel__description">
          {currentContent.description}
        </span>

        {/* Boutons d'action */}
        <div className="hero-carousel__actions">
          <div 
            className="hero-carousel__button hero-carousel__button--primary"
            onClick={() => onContentSelect?.(currentContent.id)}
          >
            <img
              src="/icons/play.svg"
              alt="Lecture"
              className="hero-carousel__button-icon"
            />
            <span>Regarder</span>
          </div>
          <div 
            className="hero-carousel__button hero-carousel__button--secondary"
            onClick={() => setShowTrailer(!showTrailer)}
          >
            <img
              src={showTrailer ? "/icons/info.svg" : "/icons/play-trailer.svg"}
              alt={showTrailer ? "Plus d'infos" : "Bande annonce"}
              className="hero-carousel__button-icon"
            />
            <span>{showTrailer ? "Plus d'infos" : "Bande annonce"}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="hero-carousel__navigation">
        {contents.map((_, index) => (
          <div
            key={index}
            className={`hero-carousel__dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          >
            <div 
              className="hero-carousel__dot-progress"
              style={{
                animationDuration: `${autoPlayInterval}ms`,
                animationPlayState: isPlaying && index === currentIndex ? 'running' : 'paused'
              }}
            />
          </div>
        ))}
      </div>

      {/* Boutons précédent/suivant */}
      <div 
        className="hero-carousel__arrow hero-carousel__arrow--prev"
        onClick={() => handleDotClick((currentIndex - 1 + contents.length) % contents.length)}
      >
        <img src="/icons/chevron-left.svg" alt="Précédent" />
      </div>
      <div 
        className="hero-carousel__arrow hero-carousel__arrow--next"
        onClick={() => handleDotClick((currentIndex + 1) % contents.length)}
      >
        <img src="/icons/chevron-right.svg" alt="Suivant" />
      </div>
    </div>
  );
};
