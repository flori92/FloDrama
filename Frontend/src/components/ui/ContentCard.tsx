import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { HybridComponent } from "@/adapters/hybrid-component";
import { HoverPreview } from "./HoverPreview";
import { cn } from "@/lib/utils";

// Types pour le contenu
export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  category?: string;
  year?: number;
  rating?: number;
  duration?: string;
  tags?: string[];
}

interface ContentCardProps {
  item: ContentItem;
  featured?: boolean;
  onClick?: (item: ContentItem) => void;
  className?: string;
}

/**
 * Carte de contenu avec animations et effets au survol
 * Version adaptée du Template_Front pour FloDrama
 */
export function ContentCard({ item, featured = false, onClick, className }: ContentCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isInList, setIsInList] = useState(false);

  const handleCardClick = () => {
    if (onClick) onClick(item);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInList(!isInList);
  };

  // Utiliser le composant hybride pour la carte
  return (
    <HybridComponent
      componentName="ContentCard"
      componentProps={{
        className: cn(
          "relative overflow-hidden transition-all duration-300 rounded-2xl shadow-lg bg-gradient-to-br from-flo-night/90 via-flo-blue/5 to-flo-fuchsia/10 border-2 border-transparent hover:border-flo-fuchsia hover:scale-105 hover:shadow-2xl group cursor-pointer",
          featured ? "w-full" : "w-full",
          isHovering ? "z-20" : "z-0",
          className
        ),
        onClick: handleCardClick
      }}
    >
      {/* Utiliser le composant HoverPreview pour la prévisualisation au survol */}
      <HoverPreview
        imageUrl={item.imageUrl}
        videoUrl={item.videoPreviewUrl}
        alt={item.title}
        aspectRatio={featured ? "video" : "portrait"}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
      >
        {/* Overlay dégradé au survol */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 bg-gradient-to-t from-flo-fuchsia/80 via-flo-blue/60 to-transparent transition-opacity duration-300 rounded-2xl" />
        {/* Badge catégorie */}
        {item.category && (
          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-md bg-gradient-to-r from-flo-fuchsia via-flo-blue to-flo-violet text-white uppercase tracking-wide`}>
            {item.category}
          </span>
        )}
        {/* Badge nouveauté */}
        {item.tags?.includes('nouveau') && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold bg-flo-violet/90 text-white shadow-md uppercase tracking-wide animate-pulse">
            Nouveau
          </span>
        )}
        {/* Contenu de la carte */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-extrabold leading-tight mb-1 bg-gradient-to-r from-flo-blue via-flo-fuchsia to-flo-violet bg-clip-text text-transparent drop-shadow-lg">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-flo-gray mb-2">
            {item.year && <span>{item.year}</span>}
            {item.duration && <span>{item.duration}</span>}
            {item.rating && (
              <span className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {item.rating}
              </span>
            )}
          </div>
          {/* Description (visible uniquement au survol ou si featured) */}
          <AnimatePresence>
            {(isHovering || featured) && item.description && (
              <p className={`text-sm text-flo-gray line-clamp-2 mb-3 transition-all duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                {item.description}
              </p>
            )}
          </AnimatePresence>
          {/* Boutons d'action (visibles uniquement au survol) */}
          <AnimatePresence>
            {isHovering && (
              <div className={`flex items-center gap-2 mt-2 transition-all duration-300 ${isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <button
                  className="bg-gradient-to-r from-flo-blue to-flo-fuchsia text-white font-bold rounded-full p-2 flex items-center gap-1 shadow-lg hover:scale-110 transition-all duration-200"
                  onClick={handleCardClick}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Lecture</span>
                </button>
                <button
                  className={`rounded-full p-2 border-2 border-flo-blue bg-flo-blue/10 hover:bg-flo-fuchsia/30 hover:border-flo-fuchsia transition-all duration-200 ${isInList ? 'ring-2 ring-flo-fuchsia' : ''}`}
                  onClick={handleAddToList}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  className={`rounded-full p-2 border-2 border-flo-blue bg-flo-blue/10 hover:bg-flo-fuchsia/30 hover:border-flo-fuchsia transition-all duration-200 ${isLiked ? 'ring-2 ring-flo-blue' : ''}`}
                  onClick={handleLike}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </button>
                <button
                  className={`rounded-full p-2 border-2 border-flo-fuchsia bg-flo-fuchsia/10 hover:bg-flo-blue/30 hover:border-flo-blue transition-all duration-200 ${isDisliked ? 'ring-2 ring-flo-fuchsia' : ''}`}
                  onClick={handleDislike}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                  </svg>
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </HoverPreview>
    </HybridComponent>
  );
}
