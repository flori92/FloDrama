import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './EnhancedContentCarousel.css';

/**
 * Carrousel de contenu amélioré pour FloDrama
 * Avec animations fluides, navigation tactile et préchargement
 */
const EnhancedContentCarousel = ({
  title,
  items = [],
  onItemClick,
  isWatchlist = false,
  onRemoveFromWatchlist,
  category = 'drama'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [visibleItems, setVisibleItems] = useState(5);
  const [showControls, setShowControls] = useState(false);
  
  const carouselRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Déterminer le nombre d'éléments visibles en fonction de la largeur de l'écran
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 576) {
        setVisibleItems(2);
      } else if (width < 768) {
        setVisibleItems(3);
      } else if (width < 1200) {
        setVisibleItems(4);
      } else {
        setVisibleItems(5);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Précharger les images des éléments
  useEffect(() => {
    if (items && items.length > 0) {
      items.forEach(item => {
        if (item.posterUrl) {
          const img = new Image();
          img.src = item.posterUrl;
        }
      });
    }
  }, [items]);
  
  // Gérer le défilement du carrousel
  const handleScroll = (direction) => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollAmount = direction === 'left' ? -1 : 1;
    const itemWidth = container.offsetWidth / visibleItems;
    const newIndex = Math.min(
      Math.max(0, currentIndex + scrollAmount * visibleItems),
      Math.max(0, items.length - visibleItems)
    );
    
    setCurrentIndex(newIndex);
    container.scrollTo({
      left: newIndex * itemWidth,
      behavior: 'smooth'
    });
  };
  
  // Gérer le début du glissement
  const handleMouseDown = (e) => {
    if (!carouselRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };
  
  // Gérer le glissement tactile
  const handleTouchStart = (e) => {
    if (!carouselRef.current) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };
  
  // Gérer le mouvement pendant le glissement
  const handleMouseMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };
  
  // Gérer le mouvement tactile
  const handleTouchMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };
  
  // Gérer la fin du glissement
  const handleDragEnd = () => {
    setIsDragging(false);
    
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const itemWidth = container.offsetWidth / visibleItems;
    const newIndex = Math.round(container.scrollLeft / itemWidth);
    
    setCurrentIndex(newIndex);
  };
  
  // Gérer le survol d'un élément
  const handleItemHover = (item) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(item);
    }, 500);
  };
  
  // Gérer la fin du survol
  const handleItemLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 300);
  };
  
  // Si pas d'éléments, ne rien afficher
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="enhanced-carousel-container"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Titre de la section */}
      {title && (
        <div className="carousel-header">
          <h2 className="carousel-title">{title}</h2>
          {items.length > visibleItems && (
            <div className="carousel-nav-indicators">
              <div className="carousel-indicators">
                {Array.from({ length: Math.ceil(items.length / visibleItems) }).map((_, i) => (
                  <div 
                    key={`indicator-${i}`}
                    className={`carousel-indicator ${Math.floor(currentIndex / visibleItems) === i ? 'active' : ''}`}
                    onClick={() => {
                      const newIndex = i * visibleItems;
                      setCurrentIndex(newIndex);
                      carouselRef.current.scrollTo({
                        left: newIndex * (carouselRef.current.offsetWidth / visibleItems),
                        behavior: 'smooth'
                      });
                    }}
                  />
                ))}
              </div>
              <Link to={`/${category === 'movie' ? 'films' : category === 'drama' ? 'dramas' : 'nouveautes'}`} className="carousel-view-all">
                Voir tout
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Contrôles de navigation */}
      {items.length > visibleItems && (
        <>
          <button 
            className={`carousel-control carousel-control-left ${showControls || currentIndex > 0 ? 'visible' : ''}`}
            onClick={() => handleScroll('left')}
            disabled={currentIndex === 0}
            aria-label="Précédent"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            className={`carousel-control carousel-control-right ${showControls || currentIndex < items.length - visibleItems ? 'visible' : ''}`}
            onClick={() => handleScroll('right')}
            disabled={currentIndex >= items.length - visibleItems}
            aria-label="Suivant"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      
      {/* Conteneur du carrousel */}
      <div 
        ref={carouselRef}
        className="carousel-items-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
      >
        {items.map((item, index) => (
          <div 
            key={`${item.id}-${index}`}
            className={`carousel-item-wrapper ${hoveredItem?.id === item.id ? 'hovered' : ''}`}
            style={{
              '--visible-items': visibleItems
            }}
            onMouseEnter={() => handleItemHover(item)}
            onMouseLeave={handleItemLeave}
          >
            <motion.div 
              className="carousel-item"
              whileHover={{ 
                scale: 1.1,
                zIndex: 10,
                transition: { duration: 0.3 }
              }}
              onClick={() => onItemClick && onItemClick(item)}
            >
              {/* Image de l'élément */}
              <div className="carousel-item-image-container">
                <img 
                  src={item.posterUrl} 
                  alt={item.title}
                  className="carousel-item-image"
                  loading="lazy"
                />
                
                {/* Overlay au survol */}
                <div className="carousel-item-overlay">
                  <div className="carousel-item-actions">
                    <Link 
                      to={`/watch/${item.id}`} 
                      className="carousel-item-action carousel-item-action-play"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </Link>
                    
                    {isWatchlist ? (
                      <button 
                        className="carousel-item-action carousel-item-action-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromWatchlist && onRemoveFromWatchlist(item);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    ) : (
                      <Link 
                        to={`/details/${item.id}`} 
                        className="carousel-item-action carousel-item-action-info"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Informations de l'élément */}
              <div className="carousel-item-info">
                <h3 className="carousel-item-title">{item.title}</h3>
                
                <div className="carousel-item-metadata">
                  {item.year && <span className="carousel-item-year">{item.year}</span>}
                  {item.rating && (
                    <span className="carousel-item-rating">
                      <span className="carousel-item-rating-star">★</span>
                      {item.rating}
                    </span>
                  )}
                  {item.episodes && (
                    <span className="carousel-item-episodes">
                      {item.episodes} ep.
                    </span>
                  )}
                </div>
                
                {item.genres && item.genres.length > 0 && (
                  <div className="carousel-item-genres">
                    {item.genres.slice(0, 2).map((genre, idx) => (
                      <span key={`genre-${idx}`} className="carousel-item-genre">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedContentCarousel;
