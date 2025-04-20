import { useState, useEffect } from 'react';
import React from 'react';

import { ContentCard } from '../ContentCard';
import './styles.css';

interface Content {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  trailerUrl?: string;
  backdropUrl?: string;
  rating?: number;
  genres?: string[];
  duration?: string;
}

interface ContentGridProps {
  title: string;
  contents: Content[];
  category?: string;
  onContentSelect?: (id: string) => void;
  onWatchlistToggle?: (id: string) => void;
}

export const ContentGrid = ({
  title,
  contents,
  category,
  onContentSelect,
  onWatchlistToggle
}: ContentGridProps) => {
  const [visibleContents, setVisibleContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Animation pour l'apparition progressive des cartes
  const gridAnimation = useAnimation({
    initial: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    duration: 600,
    easing: 'easeOutCubic'
  });

  // Effet de défilement infini
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading) {
            loadMoreContent();
          }
        });
      },
      { threshold: 0.1 }
    );

    const sentinel = document.querySelector('.content-grid__sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [isLoading, contents]);

  const loadMoreContent = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Simulation du chargement progressif
      const currentLength = visibleContents.length;
      const nextBatch = contents.slice(currentLength, currentLength + 8);
      
      if (nextBatch.length > 0) {
        setVisibleContents(prev => [...prev, ...nextBatch]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    setVisibleContents(contents.slice(0, 12));
  }, [contents]);

  return (
    <div className="content-grid-container">
      {/* En-tête de la section */}
      <div className="content-grid__header">
        <span className="content-grid__title">{title}</span>
        {category && (
          <div 
            className="content-grid__more"
            onClick={() => onContentSelect?.('category:' + category)}
          >
            <span>Voir plus</span>
          </div>
        )}
      </div>

      {/* Grille de contenu */}
      <div className="content-grid" animation={gridAnimation}>
        {visibleContents.map((content, index) => (
          <div 
            key={content.id}
            className="content-grid__item"
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <ContentCard
              {...content}
              onWatchlistToggle={onWatchlistToggle}
              onClick={() => onContentSelect?.(content.id)}
            />
          </div>
        ))}
      </div>

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="content-grid__loading">
          <span>Chargement...</span>
        </div>
      )}

      {/* Sentinel pour le défilement infini */}
      {visibleContents.length < contents.length && (
        <div className="content-grid__sentinel" />
      )}

      {/* Message si aucun contenu */}
      {contents.length === 0 && (
        <div className="content-grid__empty">
          <span>Aucun contenu disponible pour le moment</span>
        </div>
      )}
    </div>
  );
};
