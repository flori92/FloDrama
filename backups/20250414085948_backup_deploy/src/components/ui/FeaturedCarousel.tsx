import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HybridComponent } from "@/adapters/hybrid-component";
import { ContentCard, ContentItem } from "./ContentCard";
import { cn } from "@/lib/utils";

interface FeaturedCarouselProps {
  title: string;
  items: ContentItem[];
  className?: string;
  autoPlayInterval?: number;
}

/**
 * Carrousel pour les contenus en vedette
 * Version adaptée du Template_Front pour FloDrama
 */
export function FeaturedCarousel({
  title,
  items,
  className,
  autoPlayInterval = 5000,
}: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Calculer les dimensions du carrousel en fonction de la fenêtre
  useEffect(() => {
    const updateDimensions = () => {
      // Mise à jour des dimensions si nécessaire
      if (carouselRef.current) {
        // Les dimensions sont calculées mais utilisées directement dans le style
        carouselRef.current.style.height = `${carouselRef.current.offsetWidth * 0.5625}px`; // Ratio 16:9
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fonction pour passer à la diapositive suivante avec useCallback
  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700);
  }, [isTransitioning, items.length]);

  // Fonction pour passer à la diapositive précédente
  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700);
  };

  // Rotation automatique du carrousel
  useEffect(() => {
    if (isPaused || isTransitioning || items.length <= 1) return;
    
    const autoAdvance = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);
    
    return () => clearInterval(autoAdvance);
  }, [autoPlayInterval, isPaused, isTransitioning, items.length, nextSlide]);

  // Faire défiler les miniatures pour que la miniature active soit visible
  useEffect(() => {
    if (thumbnailsRef.current) {
      const thumbnails = thumbnailsRef.current.querySelectorAll('.thumbnail');
      if (thumbnails[currentIndex]) {
        thumbnails[currentIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex]);

  // Utiliser le composant hybride pour le carrousel
  return (
    <HybridComponent
      componentName="Carousel"
      componentProps={{
        className: cn("py-12", className)
      }}
    >
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex gap-2">
            <motion.button 
              onClick={prevSlide} 
              className="rounded-full p-2 bg-black/30 hover:bg-black/50 text-white"
              aria-label="Précédent"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isTransitioning}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>
            <motion.button 
              onClick={nextSlide} 
              className="rounded-full p-2 bg-black/30 hover:bg-black/50 text-white"
              aria-label="Suivant"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isTransitioning}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.button>
          </div>
        </motion.div>

        {/* Carrousel principal avec effet parallaxe */}
        <div 
          className="relative overflow-hidden rounded-xl"
          ref={carouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="w-full relative"
            >
              {/* Arrière-plan avec effet parallaxe */}
              <motion.div 
                className="absolute inset-0 overflow-hidden"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <img 
                  src={items[currentIndex].imageUrl} 
                  alt={items[currentIndex].title} 
                  className="w-full h-full object-cover blur-sm opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black"></div>
              </motion.div>

              {/* Contenu principal */}
              <ContentCard 
                item={items[currentIndex]} 
                featured={true} 
              />
            </motion.div>
          </AnimatePresence>

          {/* Indicateurs de position */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {items.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => !isTransitioning && setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-primary w-8" : "bg-white/50 w-2"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Aller à l'élément ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Miniatures en dessous avec défilement horizontal */}
        <motion.div 
          className="mt-6 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div 
            className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            ref={thumbnailsRef}
          >
            {items.map((item, index) => (
              <motion.div 
                key={item.id} 
                className={`thumbnail flex-shrink-0 cursor-pointer transition-all duration-300 mx-2 snap-center ${
                  index === currentIndex ? "ring-2 ring-primary scale-105 z-10" : "opacity-70 hover:opacity-100"
                }`}
                style={{ width: '180px' }}
                onClick={() => !isTransitioning && setCurrentIndex(index)}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full aspect-video object-cover"
                  />
                  {index === currentIndex && (
                    <motion.div 
                      className="absolute inset-0 bg-primary/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs font-medium text-white truncate">{item.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Ombres de défilement */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
        </motion.div>
      </div>
    </HybridComponent>
  );
}
