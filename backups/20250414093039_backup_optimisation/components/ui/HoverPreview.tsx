import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [playIndicatorTimeout, setPlayIndicatorTimeout] = useState<number | null>(null);

  // Gérer le survol
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (onHoverStart) onHoverStart();

    // Démarrer la prévisualisation vidéo après un court délai
    if (videoUrl) {
      const timeoutId = window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => console.error("Échec de lecture vidéo:", err));
          setShowPlayIndicator(true);
          
          // Masquer l'indicateur de lecture après 1.5 secondes
          const indicatorTimeoutId = window.setTimeout(() => {
            setShowPlayIndicator(false);
          }, 1500);
          
          setPlayIndicatorTimeout(indicatorTimeoutId);
        }
      }, 600); // Délai réduit pour une réponse plus rapide
      
      setHoverTimeout(timeoutId);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (onHoverEnd) onHoverEnd();

    if (hoverTimeout !== null) {
      window.clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    if (playIndicatorTimeout !== null) {
      window.clearTimeout(playIndicatorTimeout);
      setPlayIndicatorTimeout(null);
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
      if (hoverTimeout !== null) {
        window.clearTimeout(hoverTimeout);
      }
      if (playIndicatorTimeout !== null) {
        window.clearTimeout(playIndicatorTimeout);
      }
    };
  }, [hoverTimeout, playIndicatorTimeout]);

  // Définir le ratio d'aspect
  const aspectRatioClass = {
    video: "aspect-video",
    portrait: "aspect-[2/3]",
    square: "aspect-square",
    wide: "aspect-[16/9]"
  }[aspectRatio];

  return (
    <motion.div 
      className={cn(
        "relative overflow-hidden rounded-md",
        aspectRatioClass,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Image ou prévisualisation vidéo */}
      <div className="absolute inset-0 bg-black">
        {isHovering && videoUrl ? (
          <motion.video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            muted
            loop
            playsInline
          />
        ) : (
          <motion.img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Overlay dégradé avec animation */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: isHovering ? 0.7 : 0.5 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Indicateur de lecture */}
      <AnimatePresence>
        {showPlayIndicator && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-4"
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effet de brillance au survol */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut", repeat: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Contenu enfant (titre, description, boutons, etc.) */}
      {children}
    </motion.div>
  );
}
