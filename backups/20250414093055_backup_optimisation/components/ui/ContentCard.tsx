import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
          "relative overflow-hidden transition-all duration-300",
          featured ? "w-full" : "w-full",
          isHovering ? "scale-105 z-20 shadow-2xl" : "scale-100",
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
        {/* Badge de catégorie */}
        {item.category && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-3 left-3 bg-primary/80 text-white text-xs px-2 py-1 rounded-full"
          >
            {item.category}
          </motion.div>
        )}

        {/* Contenu de la carte */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <motion.h3 
            className="text-lg font-bold leading-tight mb-1"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {item.title}
          </motion.h3>
          
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            {item.year && <span>{item.year}</span>}
            {item.duration && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {item.duration}
              </span>
            )}
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
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-gray-300 line-clamp-2 mb-3"
              >
                {item.description}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Tags (visibles uniquement au survol) */}
          <AnimatePresence>
            {isHovering && item.tags && item.tags.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex flex-wrap gap-1 mb-3"
              >
                {item.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index} 
                    className="text-xs bg-white/20 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boutons d'action (visibles uniquement au survol) */}
          <AnimatePresence>
            {isHovering && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 mt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary text-white hover:bg-primary/90 rounded-full p-2 flex items-center gap-1"
                  onClick={handleCardClick}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Lecture</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`rounded-full p-2 ${isInList ? "bg-green-600" : "bg-white/20 hover:bg-white/30"}`}
                  onClick={handleAddToList}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`rounded-full p-2 ${isLiked ? "bg-blue-600" : "bg-white/20 hover:bg-white/30"}`}
                  onClick={handleLike}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`rounded-full p-2 ${isDisliked ? "bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
                  onClick={handleDislike}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </HoverPreview>
    </HybridComponent>
  );
}
