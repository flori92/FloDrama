import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from './ContentCard';

interface ContentItem {
  id: string | number;
  title: string;
  image: string;
  year?: string | number;
  match?: number;
  rating?: string;
  duration?: string;
  description?: string;
  videoPreview?: string;
}

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  onSeeAll?: () => void;
}

const ContentRow: React.FC<ContentRowProps> = ({ title, items, onSeeAll }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isRowHovered, setIsRowHovered] = useState(false);
  
  // Fonction pour vérifier la position de défilement et mettre à jour les flèches
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px de marge
  };
  
  // Fonctions de défilement horizontal
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollTo({
      left: scrollContainerRef.current.scrollLeft - scrollAmount,
      behavior: 'smooth'
    });
  };
  
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollTo({
      left: scrollContainerRef.current.scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  };
  
  return (
    <section 
      className="relative mb-12 py-2"
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      {/* En-tête de section avec titre */}
      <div className="flex items-center justify-between mb-4 px-4">
        <motion.h2 
          className="text-xl font-medium text-white relative group"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {title}
          <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
        </motion.h2>
        
        {/* Bouton "Voir tout" */}
        {onSeeAll && (
          <motion.button
            className="text-sm text-white/70 hover:text-white flex items-center"
            whileHover={{ scale: 1.05 }}
            onClick={onSeeAll}
          >
            Voir tout
            <ChevronRight className="w-4 h-4 ml-1" />
          </motion.button>
        )}
      </div>
      
      {/* Conteneur de défilement horizontal */}
      <div className="relative">
        {/* Dégradé gauche */}
        <div 
          className={`absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            showLeftArrow && isRowHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Dégradé droit */}
        <div 
          className={`absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            showRightArrow && isRowHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Flèche gauche */}
        <motion.button
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 backdrop-blur-sm text-white border border-white/30 hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 transition-all duration-300 ${
            showLeftArrow && isRowHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={scrollLeft}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        
        {/* Flèche droite */}
        <motion.button
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 backdrop-blur-sm text-white border border-white/30 hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 transition-all duration-300 ${
            showRightArrow && isRowHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={scrollRight}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
        
        {/* Liste défilante de cartes */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-4 px-4 scroll-smooth"
          onScroll={checkScrollPosition}
        >
          <div className="flex gap-3">
            {items.map(item => (
              <ContentCard
                key={item.id}
                id={item.id}
                title={item.title}
                image={item.image}
                year={item.year}
                match={item.match}
                rating={item.rating}
                duration={item.duration}
                description={item.description}
                videoPreview={item.videoPreview}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentRow;
