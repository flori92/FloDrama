import React from 'react';
import { HomeHero } from './ui/hero-section';
import { ContentCarousel } from './ui/carousel';
import { ContentCard, ContentRow, FeaturedContentCard } from './ui/content-card';
import { AnimatedElement, AnimatedSequence } from './ui/animated-element';

/**
 * Exemple d'utilisation des composants UI modernes dans FloDrama
 * Ce composant montre comment intégrer les héros, carrousels et cartes animées
 */
const HomeHeroExample: React.FC = () => {
  // Données d'exemple pour les films/séries
  const featuredContent = [
    {
      id: 1,
      title: "Le Grand Voyage",
      description: "Une aventure épique à travers le temps et l'espace",
      imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/media/hero1.jpg",
      category: "Film",
      date: "Mars 2025"
    },
    {
      id: 2,
      title: "Horizons Lointains",
      description: "Découvrez les confins de l'univers dans cette série captivante",
      imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/media/hero2.jpg",
      category: "Série",
      date: "Avril 2025"
    },
    {
      id: 3,
      title: "Destins Croisés",
      description: "Quand le destin réunit des étrangers aux parcours extraordinaires",
      imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/media/hero3.jpg",
      category: "Mini-série",
      date: "Mai 2025"
    }
  ];

  const recentContent = [
    {
      id: 4,
      title: "La Dernière Frontière",
      description: "Une exploration des limites de l'humanité",
      imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/media/content1.jpg",
      category: "Documentaire",
      date: "Février 2025"
    },
    {
      id: 5,
      title: "Échos du Passé",
      description: "Un voyage dans le temps à travers les souvenirs",
      imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/media/content2.jpg",
      category: "Film",
      date: "Janvier 2025"
    },
    {
      id: 6,
      title: "Rêves Éveillés",
      description: "Quand la réalité et l'imaginaire se confondent",
      imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/media/content3.jpg",
      category: "Série",
      date: "Mars 2025"
    },
    {
      id: 7,
      title: "Au-delà des Apparences",
      description: "Rien n'est ce qu'il semble être dans ce thriller haletant",
      imageUrl: "https://d1pbqs2b6em4ha.cloudfront.net/media/content4.jpg",
      category: "Film",
      date: "Février 2025"
    }
  ];

  // Fonction de gestion des clics
  const handleContentClick = (id: number) => {
    console.log(`Contenu ${id} cliqué`);
    // Navigation ou ouverture de modal ici
  };

  return (
    <div className="home-page">
      {/* Section Héro avec Carousel */}
      <section className="hero-carousel-section">
        <ContentCarousel>
          {featuredContent.map(content => (
            <div key={content.id} className="w-full h-full">
              <HomeHero
                title={content.title}
                subtitle={content.description}
                backgroundImage={content.imageUrl}
                ctaText="Regarder maintenant"
                ctaAction={() => handleContentClick(content.id)}
                overlayOpacity={0.4}
              />
            </div>
          ))}
        </ContentCarousel>
      </section>

      {/* Section Contenu en vedette */}
      <section className="featured-content-section py-12 px-4 md:px-8">
        <AnimatedElement animation="slide-up" className="mb-8">
          <h2 className="text-3xl font-bold text-center">Contenus en Vedette</h2>
          <p className="text-center text-gray-600 mt-2">Découvrez nos sélections du moment</p>
        </AnimatedElement>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <AnimatedSequence
            animation="slide-up"
            staggerDelay={0.2}
            initialDelay={0.3}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            {featuredContent.map(content => (
              <FeaturedContentCard
                key={content.id}
                title={content.title}
                description={content.description}
                imageUrl={content.imageUrl}
                category={content.category}
                date={content.date}
                onClick={() => handleContentClick(content.id)}
              />
            ))}
          </AnimatedSequence>
        </div>
      </section>

      {/* Section Contenu récent */}
      <section className="recent-content-section py-12 px-4 md:px-8 bg-gray-50">
        <ContentRow title="Ajouts Récents">
          {recentContent.map(content => (
            <ContentCard
              key={content.id}
              title={content.title}
              description={content.description}
              imageUrl={content.imageUrl}
              category={content.category}
              date={content.date}
              onClick={() => handleContentClick(content.id)}
              size="medium"
            />
          ))}
        </ContentRow>
      </section>
    </div>
  );
};

export default HomeHeroExample;
