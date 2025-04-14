import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppleStyleCard from '../cards/AppleStyleCard';

/**
 * Carousel horizontal pour afficher une liste de contenus
 * @param {string} title - Titre du carousel
 * @param {Array} items - Liste des éléments à afficher
 * @param {string} size - Taille des cartes ('sm', 'md', 'lg')
 */
const ContentCarousel = ({ title, items = [], size = 'md' }) => {
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
  if (!items.length) return null;
  
  return (
    <section className="relative py-4">
      {/* Titre du carousel */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        
        {/* Bouton "Voir tout" si plus de 8 éléments */}
        {items.length > 8 && (
          <button className="text-gray-400 hover:text-white text-sm">
            Voir tout
          </button>
        )}
      </div>
      
      {/* Conteneur du carousel avec flèches de navigation */}
      <div className="relative group">
        {/* Flèche gauche */}
        {showLeftArrow && (
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-70 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={() => scroll('left')}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        {/* Conteneur des cartes avec défilement horizontal */}
        <div 
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide scroll-smooth py-2 px-1"
          onScroll={checkArrows}
        >
          <div className="flex space-x-4">
            {items.map((item) => (
              <div key={item.id} className="flex-shrink-0">
                <AppleStyleCard item={item} size={size} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Flèche droite */}
        {showRightArrow && (
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-70 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={() => scroll('right')}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  );
};

export default ContentCarousel;
