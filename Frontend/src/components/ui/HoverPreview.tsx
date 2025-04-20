import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AspectRatio = "video" | "portrait" | "square" | "wide";

interface HoverPreviewProps {
  imageUrl: string;
  videoUrl?: string;
  alt: string;
  aspectRatio?: AspectRatio;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Composant de prévisualisation au survol pour les cartes de contenu
 * Affiche une image par défaut et joue une vidéo au survol
 */
export function HoverPreview({
  imageUrl,
  videoUrl,
  alt,
  aspectRatio = "portrait",
  onHoverStart,
  onHoverEnd,
  children,
  className
}: HoverPreviewProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gérer le survol
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (onHoverStart) onHoverStart();

    // Démarrer la prévisualisation vidéo après un court délai
    if (videoUrl) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => console.error("Échec de lecture vidéo:", err));
          setShowPlayIndicator(true);
          
          // Masquer l'indicateur de lecture après 1.5 secondes
          playIndicatorTimeoutRef.current = setTimeout(() => {
            setShowPlayIndicator(false);
          }, 1500);
        }
      }, 800);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (onHoverEnd) onHoverEnd();

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (playIndicatorTimeoutRef.current) {
      clearTimeout(playIndicatorTimeoutRef.current);
      playIndicatorTimeoutRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setShowPlayIndicator(false);
    }
  };

  // Nettoyer les timeouts lors du démontage
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (playIndicatorTimeoutRef.current) {
        clearTimeout(playIndicatorTimeoutRef.current);
      }
    };
  }, []);

  // Définir le ratio d'aspect
  const aspectRatioClass = {
    video: "aspect-video",
    portrait: "aspect-[2/3]",
    square: "aspect-square",
    wide: "aspect-[16/9]"
  }[aspectRatio];

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-md",
        aspectRatioClass,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image ou prévisualisation vidéo */}
      <div className="absolute inset-0 bg-black">
        {isHovering && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
        )}

        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Indicateur de lecture */}
      <AnimatePresence>
        {showPlayIndicator && (
          <div 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-4 transition-opacity duration-300 ${showPlayIndicator ? 'opacity-100' : 'opacity-0'}`}
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </div>
        )}
      </AnimatePresence>

      {/* Contenu enfant (titre, description, boutons, etc.) */}
      {children}
    </div>
  );
}
