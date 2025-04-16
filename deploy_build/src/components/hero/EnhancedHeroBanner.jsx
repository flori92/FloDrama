import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Plus, Check, Volume2, VolumeX } from 'lucide-react';
import { getBackdropUrl } from '../../config/aws-config';
import './EnhancedHeroBanner.css';

/**
 * Bannière héroïque améliorée pour FloDrama
 * Affiche un contenu en vedette avec des animations, effets de parallaxe
 * et lecture automatique de la bande-annonce
 */
const EnhancedHeroBanner = ({
  item,
  onPlay,
  onAddToWatchlist,
  onInfo,
  isInWatchlist = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const videoRef = useRef(null);
  const bannerRef = useRef(null);
  
  // Gérer le défilement pour l'effet de parallaxe
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Démarrer la lecture de la bande-annonce après un délai
  useEffect(() => {
    if (imageLoaded && item?.trailerUrl && videoRef.current) {
      const timer = setTimeout(() => {
        setTrailerPlaying(true);
        videoRef.current.play().catch(() => {
          // En cas d'échec de lecture automatique (politiques de navigateur)
          setTrailerPlaying(false);
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [imageLoaded, item]);
  
  // Gérer le chargement de l'image
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Gérer l'erreur de chargement de l'image
  const handleImageError = () => {
    setImageFailed(true);
    
    // Essayer de charger l'image depuis l'URL de secours
    if (item && item.id) {
      const imgElement = document.getElementById(`hero-backdrop-${item.id}`);
      if (imgElement) {
        imgElement.src = getBackdropUrl(item.id);
      }
    }
  };
  
  // Basculer le son de la bande-annonce
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };
  
  // Si pas d'élément, ne rien afficher
  if (!item) return null;
  
  // URL de l'image d'arrière-plan
  const backdropUrl = item.backdropUrl || (item.id ? getBackdropUrl(item.id) : '');
  
  // Limiter la description à 200 caractères
  const truncatedSynopsis = item.synopsis && item.synopsis.length > 200
    ? `${item.synopsis.substring(0, 200)}...`
    : item.synopsis;
  
  // Calculer l'opacité du gradient en fonction du défilement
  const gradientOpacity = Math.min(0.8 + (scrollPosition / 1000), 1);
  
  // Calculer la position de l'image d'arrière-plan pour l'effet de parallaxe
  const yOffset = scrollPosition * 0.5; // Vitesse de l'effet de parallaxe
  
  return (
    <div 
      className="enhanced-hero-banner"
      ref={bannerRef}
      style={{
        '--gradient-opacity': gradientOpacity
      }}
    >
      {/* Arrière-plan avec effet de parallaxe */}
      <div className="hero-background" style={{ transform: `translateY(${yOffset}px)` }}>
        {item.trailerUrl && trailerPlaying ? (
          <div className="hero-video-container">
            <video
              ref={videoRef}
              className="hero-video"
              autoPlay
              loop
              muted={muted}
              playsInline
            >
              <source src={item.trailerUrl} type="video/mp4" />
            </video>
            <button 
              className="hero-video-mute-toggle" 
              onClick={toggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
            >
              {muted ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              className="hero-image-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded && !imageFailed ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                id={`hero-backdrop-${item.id}`}
                src={backdropUrl}
                alt={item.title}
                className="hero-image"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Gradient de superposition */}
        <div className="hero-gradient"></div>
      </div>
      
      {/* Contenu de la bannière */}
      <div className="hero-content">
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Badge de catégorie */}
          {item.category && (
            <div className="hero-badge">
              {item.category === 'drama' ? 'Drama' : 
               item.category === 'movie' ? 'Film' : 
               item.category === 'anime' ? 'Anime' : 'Série'}
            </div>
          )}
          
          {/* Titre */}
          <h1 className="hero-title">{item.title}</h1>
          
          {/* Métadonnées */}
          <div className="hero-metadata">
            {item.year && <span className="hero-year">{item.year}</span>}
            {item.rating && (
              <span className="hero-rating">
                <span className="hero-rating-star">★</span> {item.rating}
              </span>
            )}
            {item.duration && <span className="hero-duration">{item.duration}</span>}
            {item.maturityRating && <span className="hero-maturity">{item.maturityRating}</span>}
          </div>
          
          {/* Synopsis */}
          {truncatedSynopsis && (
            <p className="hero-synopsis">{truncatedSynopsis}</p>
          )}
          
          {/* Genres */}
          {item.genres && item.genres.length > 0 && (
            <div className="hero-genres">
              {item.genres.map((genre, index) => (
                <span key={`genre-${index}`} className="hero-genre">
                  {genre}
                </span>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="hero-actions">
            <button 
              className="hero-button hero-button-primary"
              onClick={() => onPlay && onPlay(item)}
              aria-label="Regarder"
            >
              <Play size={20} />
              <span>Regarder</span>
            </button>
            
            <button 
              className="hero-button hero-button-secondary"
              onClick={() => onInfo && onInfo(item)}
              aria-label="Plus d&apos;infos"
            >
              <Info size={20} />
              <span>Plus d&apos;infos</span>
            </button>
            
            <button 
              className={`hero-button hero-button-icon ${isInWatchlist ? 'active' : ''}`}
              onClick={() => onAddToWatchlist && onAddToWatchlist(item)}
              aria-label={isInWatchlist ? "Retirer de ma liste" : "Ajouter à ma liste"}
              title={isInWatchlist ? "Retirer de ma liste" : "Ajouter à ma liste"}
            >
              {isInWatchlist ? <Check size={24} /> : <Plus size={24} />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedHeroBanner;
