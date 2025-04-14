import React, { useRef } from "react";
import { motion } from "framer-motion";
import { HybridComponent } from "@/adapters/hybrid-component";
import { ContentCard, ContentItem } from "./ContentCard";
import { cn } from "@/lib/utils";

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
  className?: string;
  layout?: 'grid' | 'carousel';
  columns?: 2 | 3 | 4;
  onSeeAll?: () => void;
}

/**
 * Section de contenu avec disposition en grille ou carrousel
 * Version adaptée du Template_Front pour FloDrama
 */
export function ContentSection({
  title,
  subtitle,
  items,
  className,
  layout = 'carousel',
  columns = 4,
  onSeeAll
}: ContentSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fonction de défilement horizontal pour le mode carrousel
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

  // Utiliser le composant hybride pour la section de contenu
  return (
    <HybridComponent
      componentName="ContentSection"
      componentProps={{
        className: cn("py-8", className)
      }}
    >
      <div className="container mx-auto px-4">
        {/* En-tête avec titre et contrôles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <motion.h2
              className="text-2xl font-bold"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {title}
            </motion.h2>
            
            {subtitle && (
              <motion.p
                className="text-gray-400 mt-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            {layout === 'carousel' && (
              <>
                {/* Boutons de navigation */}
                <button
                  onClick={() => scroll("left")}
                  className="rounded-full p-2 hover:bg-white/10 text-white"
                  aria-label="Défiler vers la gauche"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                
                <button
                  onClick={() => scroll("right")}
                  className="rounded-full p-2 hover:bg-white/10 text-white"
                  aria-label="Défiler vers la droite"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
            
            {onSeeAll && (
              <button
                onClick={onSeeAll}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Voir tout
              </button>
            )}
          </div>
        </div>

        {/* Contenu en mode carrousel ou grille */}
        {layout === 'carousel' ? (
          <div
            ref={containerRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item) => (
              <div key={item.id} className="flex-none w-[220px] md:w-[240px] lg:w-[280px]">
                <ContentCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "grid gap-4",
            columns === 2 && "grid-cols-1 sm:grid-cols-2",
            columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {items.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </HybridComponent>
  );
}
