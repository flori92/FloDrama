import React, { useEffect, useState } from 'react';
// Importation directe des types sans dépendances obsolètes
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

// Type pour le contenu média
interface ContenuMedia {
  id: string;
  titre: string;
  description: string;
  imageUrl: string;
  type: 'film' | 'serie' | 'anime';
  genres: string[];
  note?: number;
  duree?: number;
}

// Service de recommandation simplifié
const RecommandationService = {
  getRecommandations: async (
    userId: string, 
    preferences: any, 
    limit: number
  ): Promise<ContenuMedia[]> => {
    // Simulation de données pour l'exemple
    // Dans une implémentation réelle, cela ferait un appel API
    return [
      {
        id: '1',
        titre: 'Crash Landing on You',
        description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.',
        imageUrl: '/images/dramas/crash-landing-on-you.jpg',
        type: 'serie',
        genres: ['Romance', 'Drame', 'Comédie'],
        note: 9.2,
        duree: 70
      },
      {
        id: '2',
        titre: 'Itaewon Class',
        description: 'Un ex-détenu et ses amis luttent pour réussir dans le quartier animé d'Itaewon.',
        imageUrl: '/images/dramas/itaewon-class.jpg',
        type: 'serie',
        genres: ['Drame', 'Affaires'],
        note: 8.7,
        duree: 70
      },
      {
        id: '3',
        titre: 'Demon Slayer',
        description: 'Tanjiro devient un chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.',
        imageUrl: '/images/animes/demon-slayer.jpg',
        type: 'anime',
        genres: ['Action', 'Aventure', 'Surnaturel'],
        note: 9.5,
        duree: 24
      },
      {
        id: '4',
        titre: 'Parasite',
        description: 'Une famille pauvre s'infiltre dans la maison d'une famille riche, avec des conséquences inattendues.',
        imageUrl: '/images/films/parasite.jpg',
        type: 'film',
        genres: ['Drame', 'Thriller', 'Comédie noire'],
        note: 9.3,
        duree: 132
      },
      {
        id: '5',
        titre: 'Kingdom',
        description: 'Dans la Corée médiévale, un prince héritier enquête sur une mystérieuse épidémie.',
        imageUrl: '/images/dramas/kingdom.jpg',
        type: 'serie',
        genres: ['Historique', 'Horreur', 'Action'],
        note: 8.9,
        duree: 50
      }
    ];
  }
};

interface CarouselRecommandationsProps {
  userId: string;
  nombreElements?: number;
  onSelectionContenu?: (contenu: ContenuMedia) => void;
  className?: string;
}

/**
 * Composant de carrousel pour les recommandations
 * Utilise react-responsive-carousel
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

  // Configuration du carrousel
  const carouselSettings = {
    infiniteLoop: true,
    showThumbs: false,
    showStatus: false,
    showIndicators: true,
    autoPlay: true,
    interval: 3000,
    stopOnHover: true,
    centerMode: true,
    centerSlidePercentage: 20,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          centerSlidePercentage: 33.33
        }
      },
      {
        breakpoint: 600,
        settings: {
          centerSlidePercentage: 50
        }
      }
    ]
  };

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
      
      <Carousel {...carouselSettings}>
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
      </Carousel>
    </div>
  );
};

export default CarouselRecommandations;
