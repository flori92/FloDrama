/**
 * Composant Hero Banner pour FloDrama
 * 
 * Ce composant affiche un carrousel dynamique alternant entre images et vidéos
 * pour mettre en avant les contenus phares de la plateforme.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../services/apiService';
import { openVideoPlayer } from '../services/videoService';
import './HeroBanner.css';

interface HeroBannerProps {
  items: ContentItem[];
  autoplayInterval?: number; // Intervalle en ms entre les transitions
  showTrailers?: boolean;    // Activer l'affichage des bandes-annonces
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  items,
  autoplayInterval = 8000,
  showTrailers = true
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const autoplayTimerRef = useRef<number | null>(null);
  
  // Initialiser les références vidéo
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, items.length);
  }, [items]);
  
  // Gérer l'autoplay du carrousel
  useEffect(() => {
    const startAutoplayTimer = () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }
      
      // Ne pas avancer automatiquement si une vidéo est en cours de lecture
      if (!isVideoPlaying) {
        autoplayTimerRef.current = window.setTimeout(() => {
          goToNext();
        }, autoplayInterval);
      }
    };
    
    startAutoplayTimer();
    
    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [activeIndex, autoplayInterval, isVideoPlaying]);
  
  // Passer à l'élément suivant du carrousel
  const goToNext = () => {
    if (isTransitioning) {
      return;
    }
    
    setIsTransitioning(true);
    
    // Arrêter la vidéo en cours si elle existe
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.pause();
      currentVideo.currentTime = 0;
    }
    
    setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000); // Correspond à la durée de transition CSS
  };
  
  // Passer à l'élément précédent du carrousel
  const goToPrev = () => {
    if (isTransitioning) {
      return;
    }
    
    setIsTransitioning(true);
    
    // Arrêter la vidéo en cours si elle existe
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.pause();
      currentVideo.currentTime = 0;
    }
    
    setActiveIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000); // Correspond à la durée de transition CSS
  };
  
  // Gérer la lecture de la vidéo
  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };
  
  // Gérer la fin de la vidéo
  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    goToNext();
  };
  
  // Gérer le clic sur le bouton de lecture
  const handlePlayClick = () => {
    const currentItem = items[activeIndex];
    
    // Si l'élément a un ID vidéo, ouvrir le lecteur vidéo
    if (currentItem.videoId) {
      openVideoPlayer(currentItem.videoId, {
        poster: currentItem.posterUrl
      });
    }
  };
  
  // Vérifier si l'élément actif a une bande-annonce
  const hasTrailer = (index: number) => {
    return showTrailers && items[index].trailerUrl;
  };
  
  // Vérifier si l'élément actif a une vidéo complète
  const hasVideo = (index: number) => {
    return items[index].videoId;
  };
  
  // Rendre le composant
  return (
    <div className="hero-banner">
      {/* Conteneur des slides */}
      <div className="hero-slides">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const showTrailer = hasTrailer(index);
          
          return (
            <div 
              key={item.id} 
              className={`hero-slide ${isActive ? 'active' : ''}`}
            >
              {/* Contenu du slide */}
              <div className="hero-slide-content">
                {/* Arrière-plan (image ou vidéo) */}
                {showTrailer ? (
                  <div className="hero-slide-video-container">
                    <video
                      ref={el => videoRefs.current[index] = el}
                      className="hero-slide-video"
                      src={item.trailerUrl}
                      poster={item.posterUrl}
                      muted
                      playsInline
                      loop={false}
                      autoPlay={isActive}
                      onPlay={handleVideoPlay}
                      onEnded={handleVideoEnded}
                    />
                  </div>
                ) : (
                  <div 
                    className="hero-slide-image" 
                    style={{ backgroundImage: `url(${item.posterUrl})` }}
                  />
                )}
                
                {/* Overlay avec dégradé */}
                <div className="hero-slide-overlay" />
                
                {/* Informations sur le contenu */}
                <div className="hero-slide-info">
                  <h2 className="hero-slide-title">{item.title}</h2>
                  
                  {item.genres && (
                    <div className="hero-slide-genres">
                      {item.genres.map(genre => (
                        <span key={genre} className="hero-slide-genre">{genre}</span>
                      ))}
                    </div>
                  )}
                  
                  <p className="hero-slide-description">{item.description}</p>
                  
                  <div className="hero-slide-actions">
                    {hasVideo(index) && (
                      <button 
                        className="hero-slide-play-button"
                        onClick={handlePlayClick}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                        </svg>
                        Regarder
                      </button>
                    )}
                    
                    {hasTrailer(index) && !showTrailer && (
                      <button className="hero-slide-trailer-button">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4H20V16H4V4Z" stroke="currentColor" strokeWidth="2" />
                          <path d="M10 20H14" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 16V20" stroke="currentColor" strokeWidth="2" />
                          <path d="M10 8L15 12L10 16V8Z" fill="currentColor" />
                        </svg>
                        Bande-annonce
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Contrôles du carrousel */}
      <div className="hero-controls">
        <button 
          className="hero-control prev"
          onClick={goToPrev}
          aria-label="Contenu précédent"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        
        <div className="hero-indicators">
          {items.map((_, index) => (
            <button
              key={index}
              className={`hero-indicator ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Aller au contenu ${index + 1}`}
            />
          ))}
        </div>
        
        <button 
          className="hero-control next"
          onClick={goToNext}
          aria-label="Contenu suivant"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HeroBanner;
