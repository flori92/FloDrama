import React, { useEffect, useState } from 'react';
import { useHybridComponent } from '@/hooks/useHybridComponent';
import { HybridComponent } from '@/adapters/hybrid-component';
import RecommandationService, { ContenuMedia } from '@/services/RecommandationService';

interface CarouselRecommandationsProps {
  userId: string;
  nombreElements?: number;
  onSelectionContenu?: (contenu: ContenuMedia) => void;
  className?: string;
}

/**
 * Composant de carrousel pour les recommandations
 * Utilise Lynx par défaut avec fallback vers React-Slick
 */
const CarouselRecommandations: React.FC<CarouselRecommandationsProps> = ({
  userId,
  nombreElements = 10,
  onSelectionContenu,
  className = ''
}) => {
  const [contenus, setContenus] = useState<ContenuMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Configuration du composant hybride
  const { isUsingLynx, adaptedProps } = useHybridComponent('Carousel', {
    infinite: true,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      }
    ]
  });

  // Chargement des recommandations
  useEffect(() => {
    const chargerRecommandations = async () => {
      try {
        setIsLoading(true);
        // Simuler les préférences pour l'exemple
        const preferences = {
          genresPrefers: ['action', 'drame', 'comédie'],
          historique: [],
          favoris: []
        };
        
        const recommandations = await RecommandationService.getRecommandations(
          userId,
          preferences,
          nombreElements
        );
        
        setContenus(recommandations);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    chargerRecommandations();
  }, [userId, nombreElements]);

  if (isLoading) {
    return <div className="chargement">Chargement des recommandations...</div>;
  }

  if (error) {
    return (
      <div className="erreur">
        Une erreur est survenue lors du chargement des recommandations.
      </div>
    );
  }

  return (
    <div className={`carousel-recommandations ${className}`}>
      <h2 className="titre-section">Recommandations pour vous</h2>
      
      <HybridComponent
        componentName="Carousel"
        isLynx={isUsingLynx}
        props={adaptedProps}
      >
        {contenus.map((contenu) => (
          <div
            key={contenu.id}
            className="carte-contenu"
            onClick={() => onSelectionContenu?.(contenu)}
          >
            <div className="carte-image">
              <img src={contenu.imageUrl} alt={contenu.titre} loading="lazy" />
              {contenu.type === 'serie' && (
                <span className="badge-serie">Série</span>
              )}
            </div>
            
            <div className="carte-info">
              <h3 className="titre">{contenu.titre}</h3>
              <p className="description">{contenu.description}</p>
              
              <div className="meta-info">
                {contenu.duree && (
                  <span className="duree">{contenu.duree} min</span>
                )}
                {contenu.note && (
                  <span className="note">★ {contenu.note.toFixed(1)}</span>
                )}
              </div>
              
              <div className="genres">
                {contenu.genres.map((genre) => (
                  <span key={genre} className="tag-genre">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </HybridComponent>
    </div>
  );
};

export default CarouselRecommandations;
