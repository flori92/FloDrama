import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EnhancedContentCard from '../cards/EnhancedContentCard';

/**
 * Carrousel de contenu amélioré pour FloDrama
 * Affiche une rangée de cartes de contenu avec navigation fluide
 */
const EnhancedContentCarousel = ({
  title,
  items = [],
  cardSize = 'md',
  onPlay,
  onAddToWatchlist,
  onLike,
  onDislike,
  isInWatchlist,
  isLiked,
  isDisliked
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const carouselRef = useRef(null);
  
  // Nombre d'éléments visibles en fonction de la taille de la carte
  const getVisibleItems = () => {
    const width = window.innerWidth;
    
    switch (cardSize) {
      case 'sm':
        return Math.floor(width / 170);
      case 'lg':
        return Math.floor(width / 270);
      case 'xl':
        return Math.floor(width / 320);
      case 'md':
      default:
        return Math.floor(width / 220);
    }
  };
  
  const visibleItems = getVisibleItems();
  
  // Mettre à jour les états de navigation
  useEffect(() => {
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex + visibleItems < items.length);
  }, [currentIndex, items.length, visibleItems]);
  
  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const newVisibleItems = getVisibleItems();
      
      // Ajuster l'index si nécessaire
      if (currentIndex + newVisibleItems > items.length) {
        const newIndex = Math.max(0, items.length - newVisibleItems);
        setCurrentIndex(newIndex);
      }
      
      // Mettre à jour les états de navigation
      setCanScrollLeft(currentIndex > 0);
      setCanScrollRight(currentIndex + newVisibleItems < items.length);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex, items.length]);
  
  // Naviguer vers la gauche
  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - Math.floor(visibleItems / 2)));
    }
  };
  
  // Naviguer vers la droite
  const scrollRight = () => {
    if (currentIndex + visibleItems < items.length) {
      setCurrentIndex(Math.min(items.length - visibleItems, currentIndex + Math.floor(visibleItems / 2)));
    }
  };
  
  // Si pas d'éléments, ne rien afficher
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className="enhanced-carousel-container" style={{ margin: '30px 0' }}>
      {/* Titre de la section */}
      {title && (
        <h2 style={{ 
          marginBottom: '16px', 
          fontSize: '24px', 
          fontWeight: 'bold',
          paddingLeft: '20px'
        }}>
          {title}
        </h2>
      )}
      
      <div style={{ position: 'relative' }}>
        {/* Bouton de navigation gauche */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            style={{
              position: 'absolute',
              left: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        {/* Conteneur du carrousel */}
        <div
          ref={carouselRef}
          style={{
            overflow: 'hidden',
            padding: '10px 20px'
          }}
        >
          <motion.div
            style={{
              display: 'flex',
              gap: '10px'
            }}
            animate={{
              x: `calc(-${currentIndex * (100 / visibleItems)}%)`
            }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
          >
            {items.map((item, index) => (
              <EnhancedContentCard
                key={item.id || index}
                item={item}
                size={cardSize}
                index={index}
                onPlay={onPlay}
                onAddToWatchlist={onAddToWatchlist}
                onLike={onLike}
                onDislike={onDislike}
                isInWatchlist={typeof isInWatchlist === 'function' ? isInWatchlist(item.id) : false}
                isLiked={typeof isLiked === 'function' ? isLiked(item.id) : false}
                isDisliked={typeof isDisliked === 'function' ? isDisliked(item.id) : false}
              />
            ))}
          </motion.div>
        </div>
        
        {/* Bouton de navigation droite */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            style={{
              position: 'absolute',
              right: '0',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedContentCarousel;
