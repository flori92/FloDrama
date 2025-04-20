import React, { useState, useEffect } from 'react';
import { ContentCard } from '../ContentCard';
import './styles.css';

interface ContentItem {
  id: string;
  title: string;
  imageUrl: string;
  rating: number;
  year: number;
  type: string;
}

interface ContentGridProps {
  items: ContentItem[];
  title: string;
  emptyMessage?: string;
  onItemClick?: (item: ContentItem) => void;
  loading?: boolean;
}

/**
 * Grille de contenu responsive pour afficher des cartes de contenu
 */
const ContentGrid: React.FC<ContentGridProps> = ({
  items = [],
  title,
  emptyMessage = "Aucun contenu disponible",
  onItemClick,
  loading = false
}) => {
  const [visibleItems, setVisibleItems] = useState<ContentItem[]>([]);
  
  // Effet pour animer l'apparition des éléments
  useEffect(() => {
    if (!loading && items.length > 0) {
      // Afficher progressivement les éléments
      const timer = setTimeout(() => {
        setVisibleItems(items);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [items, loading]);

  // Affichage du chargement
  if (loading) {
    return (
      <div className="content-grid-container">
        <h2 className="content-grid-title">{title}</h2>
        <div className="content-grid-loading">
          <div className="loading-spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Affichage du message si aucun contenu
  if (items.length === 0) {
    return (
      <div className="content-grid-container">
        <h2 className="content-grid-title">{title}</h2>
        <div className="content-grid-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Affichage normal de la grille
  return (
    <div className="content-grid-container">
      <h2 className="content-grid-title">{title}</h2>
      <div className="content-grid">
        {visibleItems.map((item, index) => (
          <div 
            key={item.id || index} 
            className="content-grid-item fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ContentCard
              item={item}
              onClick={() => onItemClick && onItemClick(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentGrid;
