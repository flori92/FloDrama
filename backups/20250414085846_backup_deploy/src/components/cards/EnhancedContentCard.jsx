import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Plus, Check, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPosterUrl } from '../../config/aws-config';

/**
 * Carte de contenu améliorée pour FloDrama
 * Affiche les dramas, films et autres contenus avec des animations fluides
 * et une gestion robuste des images
 */
const EnhancedContentCard = ({ 
  item, 
  size = 'md', 
  index = 0,
  onPlay,
  onAddToWatchlist,
  onLike,
  onDislike,
  isInWatchlist = false,
  isLiked = false,
  isDisliked = false
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const cardRef = useRef(null);
  
  // Gérer le chargement de l'image
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Gérer l'erreur de chargement de l'image
  const handleImageError = () => {
    setImageFailed(true);
    
    // Essayer de charger l'image depuis l'URL de secours
    if (item && item.id) {
      const imgElement = cardRef.current?.querySelector('img');
      if (imgElement) {
        imgElement.src = getPosterUrl(item.id);
      }
    }
  };
  
  // Définir les dimensions de la carte en fonction de la taille
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: '150px', height: '225px' };
      case 'lg':
        return { width: '250px', height: '375px' };
      case 'xl':
        return { width: '300px', height: '450px' };
      case 'md':
      default:
        return { width: '200px', height: '300px' };
    }
  };
  
  // Animations pour la carte
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        delay: index * 0.1,
        ease: 'easeOut'
      }
    },
    hover: { 
      scale: 1.05,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
      transition: { duration: 0.3 }
    }
  };
  
  // Animations pour l'overlay
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } }
  };
  
  // Si pas d'élément, ne rien afficher
  if (!item) return null;
  
  // Obtenir les dimensions
  const dimensions = getDimensions();
  
  // URL de l'image
  const imageUrl = item.posterUrl || (item.id ? getPosterUrl(item.id) : '');
  
  // Titre à afficher (limité à 2 lignes)
  const displayTitle = item.title || '';
  
  return (
    <motion.div
      ref={cardRef}
      className="enhanced-content-card"
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      onHoverStart={() => setShowOverlay(true)}
      onHoverEnd={() => setShowOverlay(false)}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        margin: '10px',
        backgroundColor: '#1a1a1a',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Link to={`/watch/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {/* Image d'arrière-plan */}
        {!imageFailed ? (
          <img
            src={imageUrl}
            alt={displayTitle}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
        ) : (
          <div 
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2a2a2a',
              color: '#888'
            }}
          >
            <Info size={40} />
          </div>
        )}
        
        {/* Overlay au survol */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px'
              }}
            >
              {/* Informations en haut */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px' }}>
                    <Star size={16} fill="#FFD700" stroke="#FFD700" />
                    <span style={{ marginLeft: '4px', fontSize: '14px', fontWeight: 'bold' }}>{item.rating}</span>
                  </div>
                )}
                
                {item.year && (
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}>
                    {item.year}
                  </div>
                )}
              </div>
              
              {/* Informations en bas */}
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: size === 'sm' ? '14px' : '16px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {displayTitle}
                </h3>
                
                {/* Genres */}
                {item.genres && item.genres.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                    {item.genres.slice(0, 3).map((genre, idx) => (
                      <span 
                        key={idx} 
                        style={{ 
                          fontSize: '12px', 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          padding: '2px 6px', 
                          borderRadius: '4px' 
                        }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPlay && onPlay(item);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E50914',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={20} />
                  </button>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToWatchlist && onAddToWatchlist(item);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer'
                      }}
                    >
                      {isInWatchlist ? <Check size={20} /> : <Plus size={20} />}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onLike && onLike(item);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isLiked ? 'rgba(0,255,0,0.3)' : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer'
                      }}
                    >
                      <ThumbsUp size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
};

export default EnhancedContentCard;
