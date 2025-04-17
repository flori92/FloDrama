import React, { useRef } from "react";
import { motion } from "framer-motion";
import { HybridComponent } from "@/adapters/hybrid-component";
import { ContentCard, ContentItem } from "./ContentCard";
import { cn } from "@/lib/utils";

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  className?: string;
  onSeeAll?: () => void;
}

/**
 * Rangée de contenu avec défilement horizontal
 * Version adaptée du Template_Front pour FloDrama
 */
export function ContentRow({ title, items, className, onSeeAll }: ContentRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fonction de défilement horizontal
  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const { scrollLeft, clientWidth } = containerRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;

      containerRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  // Utiliser le composant hybride pour la rangée de contenu
  return (
    <HybridComponent
      componentName="ContentRow"
      componentProps={{
        className: cn("py-4", className)
      }}
    >
      <div className="container mx-auto px-4">
        {/* En-tête avec titre et contrôles */}
        <div className="flex items-center justify-between mb-4">
          <motion.h2
            className="text-xl font-medium tracking-tight hover:text-transparent hover:bg-gradient-to-r from-blue-400 to-fuchsia-500 bg-clip-text transition-colors duration-200"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h2>
          
          <div className="flex items-center gap-4">
            {/* Boutons de navigation */}
            <button
              onClick={() => scroll("left")}
              className="rounded-full p-1 hover:bg-white/10 text-white"
              aria-label="Défiler vers la gauche"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            
            <button
              onClick={() => scroll("right")}
              className="rounded-full p-1 hover:bg-white/10 text-white"
              aria-label="Défiler vers la droite"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            
            {onSeeAll && (
              <button
                onClick={onSeeAll}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Voir tout
              </button>
            )}
          </div>
        </div>

        {/* Conteneur avec défilement horizontal */}
        <div
          ref={containerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div key={item.id} className="flex-none w-[180px] md:w-[200px] lg:w-[220px]">
              <ContentCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </HybridComponent>
  );
}
