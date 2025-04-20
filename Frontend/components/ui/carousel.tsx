import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Types pour les composants du carrousel
interface CarouselProps {
  children: ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface CarouselItemProps {
  children: ReactNode;
  index: number;
  currentIndex: number;
  totalItems: number;
}

// Composant principal du carrousel
export const Carousel = ({
  children,
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
  showProgress = false,
  className = '',
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const itemsCount = React.Children.count(children);

  // Navigation entre les éléments
  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % itemsCount);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [itemsCount, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + itemsCount) % itemsCount);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [itemsCount, isTransitioning]);

  const goToIndex = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [currentIndex, isTransitioning]);

  // Gestion de l'autoplay
  useEffect(() => {
    if (!autoPlay || isPaused || itemsCount <= 1 || isTransitioning) return;

    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, isPaused, goToNext, itemsCount, isTransitioning]);

  // Gestion des touches clavier pour l'accessibilité
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Calcul du pourcentage de progression pour la barre
  const progressPercentage = ((currentIndex + 1) / itemsCount) * 100;

  // Rendu du carrousel
  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Contenu en carousel"
    >
      <div className="carousel-container relative w-full h-full">
        {React.Children.map(children, (child, index) => (
          <CarouselItem 
            key={index} 
            index={index} 
            currentIndex={currentIndex}
            totalItems={itemsCount}
          >
            {child}
          </CarouselItem>
        ))}
      </div>

      {/* Flèches de navigation */}
      {showArrows && itemsCount > 1 && (
        <>
          <button 
            onClick={goToPrev}
            className={cn(
              "carousel-arrow carousel-arrow-prev absolute left-4 top-1/2 transform -translate-y-1/2",
              "bg-black/50 text-white rounded-full p-2 z-10 hover:bg-black/70 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-white/50",
              isTransitioning && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Précédent"
            disabled={isTransitioning}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button 
            onClick={goToNext}
            className={cn(
              "carousel-arrow carousel-arrow-next absolute right-4 top-1/2 transform -translate-y-1/2",
              "bg-black/50 text-white rounded-full p-2 z-10 hover:bg-black/70 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-white/50",
              isTransitioning && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Suivant"
            disabled={isTransitioning}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Indicateurs de position */}
      {showDots && itemsCount > 1 && (
        <div className="carousel-dots absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {Array.from({ length: itemsCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex ? "bg-white w-8" : "bg-white/50 w-2",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
              aria-label={`Aller à l'élément ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
              disabled={isTransitioning}
            />
          ))}
        </div>
      )}

      {/* Barre de progression */}
      {showProgress && itemsCount > 1 && (
        <div className="carousel-progress absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-linear"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </div>
  );
};

// Composant pour chaque élément du carrousel
const CarouselItem = ({ children, index, currentIndex, totalItems }: CarouselItemProps) => {
  const isActive = index === currentIndex;
  const isPrev = (index === currentIndex - 1) || (currentIndex === 0 && index === totalItems - 1);
  const isNext = (index === currentIndex + 1) || (currentIndex === totalItems - 1 && index === 0);

  return (
    <div
      className={cn(
        "carousel-item absolute inset-0 w-full h-full transition-all duration-500 ease-in-out",
        isActive ? "opacity-100 translate-x-0 z-10" : "opacity-0 z-0",
        isPrev && "-translate-x-full",
        isNext && "translate-x-full",
        !isActive && !isPrev && !isNext && "translate-x-full"
      )}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
};

// Composant pour le carrousel de contenu
export const ContentCarousel = ({ children, className = '' }: { children: ReactNode[], className?: string }) => {
  return (
    <Carousel 
      className={cn("content-carousel h-[500px]", className)}
      autoPlay={true}
      interval={6000}
      showArrows={true}
      showDots={true}
      showProgress={true}
    >
      {children}
    </Carousel>
  );
};

// Composant pour le carrousel de héros
export const HeroCarousel = ({ children, className = '' }: { children: ReactNode[], className?: string }) => {
  return (
    <Carousel 
      className={cn("hero-carousel h-[600px]", className)}
      autoPlay={true}
      interval={8000}
      showArrows={true}
      showDots={true}
      showProgress={true}
    >
      {children}
    </Carousel>
  );
};
