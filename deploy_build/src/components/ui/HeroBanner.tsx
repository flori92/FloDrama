import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { HybridComponent } from "@/adapters/hybrid-component";
import { cn } from "@/lib/utils";

interface HeroContent {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  logo?: string;
  videoUrl?: string;
}

interface HeroBannerProps {
  content?: HeroContent[];
  className?: string;
  interval?: number;
  onPlay?: (content: HeroContent) => void;
  onMoreInfo?: (content: HeroContent) => void;
  onAddToList?: (content: HeroContent) => void;
}

/**
 * Bannière héro pour la page d'accueil
 * Version adaptée du Template_Front pour FloDrama
 */
export function HeroBanner({
  content,
  className,
  interval = 8000,
  onPlay,
  onMoreInfo,
  onAddToList
}: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  
  // Effet de parallaxe au défilement
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // Contenu par défaut si aucun n'est fourni
  const defaultContent: HeroContent[] = [
    {
      title: "Pachinko",
      subtitle: "Nouvelle Saison",
      description:
        "Une saga familiale épique qui s'étend sur quatre générations, depuis la Corée sous occupation japonaise jusqu'au Japon moderne.",
      image: "https://d1pbqs2b6em4ha.cloudfront.net/images/pachinko-banner.jpg",
      logo: "https://d1pbqs2b6em4ha.cloudfront.net/images/pachinko-logo.png",
    },
    {
      title: "The Glory",
      subtitle: "Série Originale",
      description:
        "Après avoir subi d'horribles brimades à l'école, une femme met au point un plan élaboré pour se venger de ses bourreaux.",
      image: "https://d1pbqs2b6em4ha.cloudfront.net/images/the-glory-banner.jpg",
      logo: "https://d1pbqs2b6em4ha.cloudfront.net/images/the-glory-logo.png",
    },
  ];

  const heroContent = content || defaultContent;
  const current = heroContent[currentIndex];

  // Gestionnaires d'événements
  const handlePlay = () => {
    if (onPlay) onPlay(current);
  };

  const handleMoreInfo = () => {
    if (onMoreInfo) onMoreInfo(current);
  };

  const handleAddToList = () => {
    if (onAddToList) onAddToList(current);
  };
  
  // Navigation entre les diapositives avec useCallback
  const handleNextSlide = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % heroContent.length);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  }, [isTransitioning, heroContent.length]);
  
  const handlePrevSlide = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + heroContent.length) % heroContent.length);
    
    // Réinitialiser l'état de transition après l'animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  }, [isTransitioning, heroContent.length]);

  // Rotation automatique du contenu
  useEffect(() => {
    if (isPaused || isTransitioning) return;
    
    const autoRotate = setInterval(() => {
      handleNextSlide();
    }, interval);
    
    return () => clearInterval(autoRotate);
  }, [interval, isPaused, isTransitioning, handleNextSlide]);

  // Utiliser le composant hybride pour la bannière
  return (
    <HybridComponent
      componentName="HeroBanner"
      componentProps={{
        className: cn("relative w-full h-[85vh] overflow-hidden", className),
        onMouseEnter: () => {
          setIsHovering(true);
          setIsPaused(true);
        },
        onMouseLeave: () => {
          setIsHovering(false);
          setIsPaused(false);
        },
        ref: bannerRef
      }}
    >
      {/* Arrière-plan animé avec effet parallaxe */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: 1, 
            scale: isHovering ? 1.05 : 1,
            y: isHovering ? -10 : 0
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ y, opacity }}
        >
          {/* Image d'arrière-plan */}
          <motion.div 
            className="absolute inset-0"
            animate={{ 
              scale: isHovering ? 1.05 : 1
            }}
            transition={{ duration: 8, ease: "easeInOut" }}
          >
            <img
              src={current.image}
              alt={current.title}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Overlay dégradé amélioré */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" 
            animate={{ opacity: isHovering ? 0.7 : 0.9 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" 
            animate={{ opacity: isHovering ? 0.7 : 0.9 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Effet de particules (optionnel) */}
          <div className="absolute inset-0 bg-[url('/src/assets/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        </motion.div>
      </AnimatePresence>

      {/* Contenu de la bannière */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ 
                  duration: 0.7, 
                  delay: 0.2,
                  ease: "easeOut" 
                }}
              >
                {/* Logo ou titre avec animation */}
                {current.logo ? (
                  <motion.img
                    src={current.logo}
                    alt={current.title}
                    className="h-28 mb-6 object-contain object-left"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  />
                ) : (
                  <motion.h1 
                    className="text-6xl font-bold mb-3 text-white/90"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {current.title}
                  </motion.h1>
                )}

                {/* Sous-titre avec animation */}
                {current.subtitle && (
                  <motion.div 
                    className="mb-5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <span className="inline-block bg-primary px-4 py-1.5 text-sm font-medium rounded-md">
                      {current.subtitle}
                    </span>
                  </motion.div>
                )}

                {/* Description avec animation */}
                <motion.p 
                  className="text-xl text-gray-300 mb-8 line-clamp-3 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  {current.description}
                </motion.p>

                {/* Boutons d'action avec animation */}
                <motion.div 
                  className="flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <motion.button
                    onClick={handlePlay}
                    className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-md flex items-center gap-2 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Lecture
                  </motion.button>
                  
                  <motion.button
                    onClick={handleMoreInfo}
                    className="bg-gray-700/80 hover:bg-gray-600/80 px-8 py-3 rounded-md flex items-center gap-2 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Plus d&apos;infos
                  </motion.button>
                  
                  <motion.button
                    onClick={handleAddToList}
                    className="bg-transparent hover:bg-gray-700/50 border border-gray-500 px-3 py-3 rounded-md flex items-center"
                    aria-label="Ajouter à ma liste"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </motion.button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Contrôles de navigation */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <motion.button
          onClick={handlePrevSlide}
          className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-r-md ml-2"
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.9 }}
          disabled={isTransitioning}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center">
        <motion.button
          onClick={handleNextSlide}
          className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-l-md mr-2"
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.9 }}
          disabled={isTransitioning}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </div>

      {/* Indicateurs de position */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            {heroContent.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => !isTransitioning && setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-primary w-10" : "bg-white/50 w-5"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Aller au contenu ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </HybridComponent>
  );
}
