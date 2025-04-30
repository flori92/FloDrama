import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContentCard, ContentItem } from "./ContentCard";
import { cn } from "@/lib/utils";

interface FeaturedCarouselProps {
  title: string;
  items: ContentItem[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

/**
 * Carrousel pour les contenus en vedette
 * Version adaptée du Template_Front pour FloDrama
 */
export function FeaturedCarousel({ 
  title, 
  items, 
  className,
  autoPlay = true,
  interval = 6000
}: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Calculer la largeur du carrousel pour l'animation
  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, [items]);

  // Navigation entre les diapositives
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  // Avancement automatique du carrousel
  useEffect(() => {
    if (!autoPlay || isPaused) return;
    
    const autoAdvance = setInterval(() => {
      nextSlide();
    }, interval);
    
    return () => clearInterval(autoAdvance);
  }, [currentIndex, autoPlay, isPaused, interval]);

  // Utiliser un composant React standard au lieu du composant hybride
  return (
    <section className={cn("py-12", className)}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex gap-2">
            <button 
              onClick={prevSlide} 
              className="rounded-full p-2 bg-black/30 hover:bg-black/50 text-white"
              aria-label="Précédent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button 
              onClick={nextSlide} 
              className="rounded-full p-2 bg-black/30 hover:bg-black/50 text-white"
              aria-label="Suivant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carrousel principal */}
        <div 
          className="relative overflow-hidden"
          ref={carouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full"
            >
              <ContentCard 
                item={items[currentIndex]} 
                featured={true} 
              />
            </motion.div>
          </AnimatePresence>

          {/* Indicateurs de position */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-white w-4" : "bg-white/50"
                }`}
                aria-label={`Aller à l'élément ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Miniatures en dessous */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className={`cursor-pointer transition-all ${
                index === currentIndex ? "ring-2 ring-primary scale-105" : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full aspect-video object-cover rounded-md"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
