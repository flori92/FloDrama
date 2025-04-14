import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Rotation automatique du contenu
  useEffect(() => {
    if (isPaused) return;
    
    const autoRotate = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroContent.length);
    }, interval);
    
    return () => clearInterval(autoRotate);
  }, [heroContent.length, interval, isPaused]);

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
        }
      }}
    >
      {/* Arrière-plan animé */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: isHovering ? 1.02 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Image d'arrière-plan */}
          <div className="absolute inset-0">
            <img
              src={current.image}
              alt={current.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Overlay dégradé */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Contenu de la bannière */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Logo ou titre */}
                {current.logo ? (
                  <img
                    src={current.logo}
                    alt={current.title}
                    className="h-24 mb-4 object-contain object-left"
                  />
                ) : (
                  <h1 className="text-5xl font-bold mb-2">{current.title}</h1>
                )}

                {/* Sous-titre */}
                {current.subtitle && (
                  <div className="mb-4">
                    <span className="inline-block bg-primary px-3 py-1 text-sm font-medium rounded">
                      {current.subtitle}
                    </span>
                  </div>
                )}

                {/* Description */}
                <p className="text-lg text-gray-300 mb-6 line-clamp-3">
                  {current.description}
                </p>

                {/* Boutons d'action */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handlePlay}
                    className="bg-white text-black hover:bg-white/90 px-6 py-2 rounded-md flex items-center gap-2 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Lecture
                  </button>
                  
                  <button
                    onClick={handleMoreInfo}
                    className="bg-gray-700/80 hover:bg-gray-600/80 px-6 py-2 rounded-md flex items-center gap-2 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Plus d'infos
                  </button>
                  
                  <button
                    onClick={handleAddToList}
                    className="bg-transparent hover:bg-gray-700/50 border border-gray-500 px-3 py-2 rounded-md flex items-center"
                    aria-label="Ajouter à ma liste"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Indicateurs de position */}
      <div className="absolute bottom-8 left-0 right-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            {heroContent.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex ? "bg-white w-8" : "bg-white/50 w-4"
                }`}
                aria-label={`Aller au contenu ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </HybridComponent>
  );
}
