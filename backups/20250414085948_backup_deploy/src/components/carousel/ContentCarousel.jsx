import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppleStyleCard from '../cards/AppleStyleCard';
import { motion } from 'framer-motion';

/**
 * Carousel horizontal pour afficher une liste de contenus
 * @param {string} title - Titre du carousel
 * @param {Array} items - Liste des éléments à afficher
 * @param {string} size - Taille des cartes ('sm', 'md', 'lg')
 * @param {function} onItemClick - Fonction appelée lors du clic sur un élément
 * @param {function} onPlayClick - Fonction appelée lors du clic sur le bouton de lecture
 * @param {function} onTitleClick - Fonction appelée lors du clic sur le titre
 */
const ContentCarousel = ({ 
  title, 
  items = [], 
  size = 'md', 
  subtitle = '',
  onItemClick = () => {},
  onPlayClick = () => {},
  onTitleClick = () => {}
}) => {
  const carouselRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Vérifier si les flèches doivent être affichées
  const checkArrows = () => {
    if (!carouselRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };
  
  // Vérifier les flèches au chargement et au redimensionnement
  useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, []);
  
  // Faire défiler le carousel
  const scroll = (direction) => {
    if (!carouselRef.current) return;
    
    const scrollAmount = direction === 'left' ? -400 : 400;
    carouselRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
    
    // Vérifier l'état des flèches après le défilement
    setTimeout(checkArrows, 400);
  };
  
  // Si aucun élément, ne pas afficher le carousel
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  
  // Filtrer les éléments invalides
  const validItems = items.filter(item => item && item.id);
  
  if (validItems.length === 0) return null;
  
  return (
    <motion.section 
      className="relative py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Titre du carousel */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <motion.h2 
            className="text-2xl font-bold cursor-pointer"
            style={{ color: 'var(--color-text-primary)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onTitleClick}
            whileHover={{ color: 'var(--color-accent)' }}
          >
            {title}
          </motion.h2>
          {subtitle && (
            <motion.p 
              className="text-sm mt-1"
              style={{ color: 'var(--color-text-secondary)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        
        {/* Bouton "Voir tout" si plus de 8 éléments */}
        {validItems.length > 8 && (
          <motion.button 
            className="text-sm nav-link"
            style={{ color: 'var(--color-text-secondary)' }}
            whileHover={{ 
              color: 'var(--color-accent)',
              scale: 1.05
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onClick={onTitleClick}
          >
            Voir tout
          </motion.button>
        )}
      </div>
      
      {/* Conteneur du carousel avec flèches de navigation */}
      <div className="relative group">
        {/* Flèche gauche */}
        {showLeftArrow && (
          <motion.button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ 
              scale: 1.1, 
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-text-primary)'
            }}
            onClick={() => scroll('left')}
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft size={24} />
          </motion.button>
        )}
        
        {/* Conteneur des cartes avec défilement horizontal */}
        <div 
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide scroll-smooth py-4 px-1"
          onScroll={checkArrows}
        >
          <div className="flex space-x-5">
            {validItems.map((item, index) => (
              <div key={item.id || Math.random().toString(36).substring(7)} className="flex-shrink-0">
                <AppleStyleCard 
                  item={item} 
                  size={size} 
                  index={index} 
                  onClick={() => onItemClick(item)}
                  onPlayClick={() => onPlayClick(item)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Flèche droite */}
        {showRightArrow && (
          <motion.button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ 
              scale: 1.1, 
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-text-primary)'
            }}
            onClick={() => scroll('right')}
            aria-label="Défiler vers la droite"
          >
            <ChevronRight size={24} />
          </motion.button>
        )}
      </div>
    </motion.section>
  );
};

export default ContentCarousel;
