import React, { useRef } from "react";
import { motion } from "framer-motion";
import { HybridComponent } from "../../adapters/hybrid-component";
import { ContentCard, ContentItem } from "./ContentCard";
import { cn } from "../../lib/utils";

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
            className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-flo-blue via-flo-fuchsia to-flo-violet bg-clip-text text-transparent drop-shadow-lg hover:scale-105 transition-all duration-200"
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
              className="rounded-full p-2 bg-flo-blue/10 hover:bg-flo-fuchsia/30 text-flo-blue hover:text-flo-fuchsia shadow-md border-2 border-flo-blue hover:border-flo-fuchsia transition-all duration-200"
              aria-label="Défiler vers la gauche"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            
            <button
              onClick={() => scroll("right")}
              className="rounded-full p-2 bg-flo-blue/10 hover:bg-flo-fuchsia/30 text-flo-blue hover:text-flo-fuchsia shadow-md border-2 border-flo-blue hover:border-flo-fuchsia transition-all duration-200"
              aria-label="Défiler vers la droite"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            
            {onSeeAll && (
              <button
                onClick={onSeeAll}
                className="text-sm font-semibold bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent hover:underline hover:scale-105 transition-all duration-200"
              >
                Voir tout
              </button>
            )}
          </div>
        </div>

        {/* Conteneur avec défilement horizontal */}
        <div
          ref={containerRef}
          className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items && items.length > 0 && items.map((item) => (
            <div key={item.id} className="flex-none w-[180px] md:w-[200px] lg:w-[220px]">
              <ContentCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </HybridComponent>
  );
}

export default ContentRow;
