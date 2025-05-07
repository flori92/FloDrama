/**
 * Composant de carrousel de contenu pour FloDrama
 * 
 * Ce composant affiche un carrousel horizontal de cartes de contenu
 * avec navigation et défilement fluide.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ContentCard from './ContentCard';
import { ContentItem } from '../types/content';

interface ContentCarouselProps {
  title: string;
  items: ContentItem[];
  viewAllLink?: string;
  loading?: boolean;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({
  title,
  items,
  viewAllLink,
  loading = false
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);

  // Vérifier si les flèches doivent être affichées
  useEffect(() => {
    const updateArrows = () => {
      if (!carouselRef.current) {
        return;
      }
      
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10); // Marge pour éviter les problèmes d'arrondi
    };

    // Mettre à jour les flèches au montage et au redimensionnement
    updateArrows();
    window.addEventListener('resize', updateArrows);
    
    // Observer les changements de scroll
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', updateArrows);
    }

    return () => {
      window.removeEventListener('resize', updateArrows);
      if (carousel) {
        carousel.removeEventListener('scroll', updateArrows);
      }
    };
  }, [items]);

  // Gérer le défilement vers la gauche
  const handleScrollLeft = () => {
    if (!carouselRef.current) {
      return;
    }
    
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    carouselRef.current.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  };

  // Gérer le défilement vers la droite
  const handleScrollRight = () => {
    if (!carouselRef.current) {
      return;
    }
    
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    carouselRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  // Gérer le début du glissement
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setInitialScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  // Gérer le glissement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      return;
    }
    e.preventDefault();
    
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Multiplicateur de vitesse
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScrollLeft - walk;
    }
  };

  // Gérer la fin du glissement
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gérer le départ du curseur de la zone
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Gérer le début du toucher (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0));
    setInitialScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  // Gérer le mouvement du toucher (mobile)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) {
      return;
    }
    
    const x = e.touches[0].pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScrollLeft - walk;
    }
  };

  // Générer des éléments de squelette pendant le chargement
  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="carousel-item-skeleton min-w-[180px] md:min-w-[220px] aspect-[2/3] bg-flo-secondary rounded-xl animate-pulse"
      />
    ));
  };

  return (
    <div className="content-carousel my-8">
      <div className="container mx-auto px-4">
        {/* En-tête du carrousel avec titre et lien "Voir tout" */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-flo-blue hover:text-flo-violet transition-colors duration-300 flex items-center"
            >
              Voir tout
              <svg
                className="w-5 h-5 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )}
        </div>

        {/* Conteneur du carrousel avec navigation */}
        <div className="relative group">
          {/* Flèche gauche */}
          {showLeftArrow && (
            <button
              className="carousel-arrow left-arrow absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 hover:bg-flo-violet/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={handleScrollLeft}
              aria-label="Défiler vers la gauche"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Conteneur des éléments du carrousel */}
          <div
            ref={carouselRef}
            className="carousel-items flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
          >
            {loading
              ? renderSkeletons()
              : items.map((item) => (
                  <div
                    key={item.id}
                    className="carousel-item min-w-[180px] md:min-w-[220px] flex-shrink-0"
                  >
                    <ContentCard item={item} />
                  </div>
                ))}
          </div>

          {/* Flèche droite */}
          {showRightArrow && (
            <button
              className="carousel-arrow right-arrow absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 hover:bg-flo-violet/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={handleScrollRight}
              aria-label="Défiler vers la droite"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Utilisation de React.memo pour éviter les rendus inutiles
// Le composant ne sera re-rendu que si ses props changent de manière significative
export default React.memo(ContentCarousel, (prevProps, nextProps) => {
  // Vérifier si le titre a changé
  if (prevProps.title !== nextProps.title) {
    return false;
  }
  
  // Vérifier si l'état de chargement a changé
  if (prevProps.loading !== nextProps.loading) {
    return false;
  }
  
  // Vérifier si le lien "Voir tout" a changé
  if (prevProps.viewAllLink !== nextProps.viewAllLink) {
    return false;
  }
  
  // Vérifier si le nombre d'éléments a changé
  if (prevProps.items.length !== nextProps.items.length) {
    return false;
  }
  
  // Vérifier si les IDs des éléments ont changé
  // Cette vérification est plus rapide que de comparer tous les objets en profondeur
  const prevIds = prevProps.items.map(item => item.id).join(',');
  const nextIds = nextProps.items.map(item => item.id).join(',');
  
  return prevIds === nextIds;
});
