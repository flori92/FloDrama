import React, { useState, useEffect } from 'react';
import { useMetadata } from '../hooks/useMetadata';
import AppleStyleHero from '../components/widgets/AppleStyleHero';
import FrenchMovieBanner from '../components/widgets/FrenchMovieBanner';
import ContentCarousel from '../components/carousel/ContentCarousel';
import { motion } from 'framer-motion';

/**
 * Page d'accueil principale de FloDrama
 * Redesign inspiré du style Apple TV+
 */
const HomePage = () => {
  const { 
    isLoading, 
    error, 
    getFeaturedItems,
    getTrendingItems,
    getRecommendedItems,
    getAllItems,
    getFrenchMovies
  } = useMetadata();
  
  const [featured, setFeatured] = useState(null);
  const [featuredFrenchMovie, setFeaturedFrenchMovie] = useState(null);
  const [sections, setSections] = useState({
    nouveautes: { title: 'Nouveautés', items: [] },
    tendances: { title: 'Tendances', items: [] },
    recommandes: { title: 'Recommandés pour vous', items: [] },
    dramas: { title: 'Dramas', items: [] },
    movies: { title: 'Films', items: [] },
    anime: { title: 'Anime', items: [] },
    romance: { title: 'Romance', items: [] },
    frenchMovies: { title: 'Cinéma Français', items: [] }
  });
  
  // Charger les données une fois les métadonnées disponibles
  useEffect(() => {
    if (isLoading || error) return;
    
    // Récupérer le contenu en vedette
    const featuredItems = getFeaturedItems();
    if (featuredItems.length > 0) {
      setFeatured(featuredItems[0]);
    }
    
    // Récupérer les films français en vedette
    const frenchMovies = getFrenchMovies ? getFrenchMovies() : [];
    if (frenchMovies && frenchMovies.length > 0) {
      setFeaturedFrenchMovie(frenchMovies[0]);
    }
    
    // Récupérer les sections
    const allItems = getAllItems();
    const dramaItems = allItems.filter(item => item.type === 'drama');
    const movieItems = allItems.filter(item => item.type === 'movie');
    const animeItems = allItems.filter(item => item.type === 'anime');
    const romanceItems = allItems.filter(item => item.genres?.includes('Romance')).slice(0, 8);
    
    setSections({
      nouveautes: { 
        title: 'Nouveautés', 
        subtitle: 'Les dernières sorties ajoutées à FloDrama',
        items: getFeaturedItems()
      },
      tendances: { 
        title: 'Tendances', 
        subtitle: 'Ce que tout le monde regarde en ce moment',
        items: getTrendingItems()
      },
      recommandes: { 
        title: 'Recommandés pour vous', 
        subtitle: 'Sélectionnés selon vos préférences',
        items: getRecommendedItems()
      },
      dramas: { 
        title: 'Dramas', 
        subtitle: 'Séries dramatiques asiatiques',
        items: dramaItems
      },
      movies: { 
        title: 'Films', 
        subtitle: 'Longs métrages à découvrir',
        items: movieItems
      },
      anime: { 
        title: 'Anime', 
        subtitle: 'Animation japonaise de qualité',
        items: animeItems
      },
      romance: {
        title: 'Romance',
        subtitle: 'Des histoires d\'amour qui vous toucheront',
        items: romanceItems
      },
      frenchMovies: {
        title: 'Cinéma Français',
        subtitle: 'Le meilleur du cinéma français',
        items: frenchMovies || []
      }
    });
  }, [isLoading, error, getFeaturedItems, getTrendingItems, getRecommendedItems, getAllItems, getFrenchMovies]);

  // Animation pour les sections
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Erreur de chargement</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Impossible de charger les données. Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Héro principal */}
      {featured && <AppleStyleHero item={featured} />}
      
      {/* Contenu principal */}
      <div className="container mx-auto px-4 mt-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Section Nouveautés */}
          {sections.nouveautes.items.length > 0 && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{sections.nouveautes.title}</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{sections.nouveautes.subtitle}</p>
              <ContentCarousel items={sections.nouveautes.items} />
            </motion.section>
          )}
          
          {/* Section Films Français avec bannière spéciale */}
          {featuredFrenchMovie && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {sections.frenchMovies.title}
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {sections.frenchMovies.subtitle}
              </p>
              <FrenchMovieBanner movie={featuredFrenchMovie} />
              
              {sections.frenchMovies.items.length > 1 && (
                <div className="mt-8">
                  <ContentCarousel items={sections.frenchMovies.items.slice(1)} />
                </div>
              )}
            </motion.section>
          )}
          
          {/* Section Tendances */}
          {sections.tendances.items.length > 0 && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{sections.tendances.title}</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{sections.tendances.subtitle}</p>
              <ContentCarousel items={sections.tendances.items} />
            </motion.section>
          )}
          
          {/* Section Recommandés */}
          {sections.recommandes.items.length > 0 && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{sections.recommandes.title}</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{sections.recommandes.subtitle}</p>
              <ContentCarousel items={sections.recommandes.items} />
            </motion.section>
          )}
          
          {/* Section Dramas */}
          {sections.dramas.items.length > 0 && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{sections.dramas.title}</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{sections.dramas.subtitle}</p>
              <ContentCarousel items={sections.dramas.items} />
            </motion.section>
          )}
          
          {/* Section Films */}
          {sections.movies.items.length > 0 && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{sections.movies.title}</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{sections.movies.subtitle}</p>
              <ContentCarousel items={sections.movies.items} />
            </motion.section>
          )}
          
          {/* Section Anime */}
          {sections.anime.items.length > 0 && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{sections.anime.title}</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{sections.anime.subtitle}</p>
              <ContentCarousel items={sections.anime.items} />
            </motion.section>
          )}
          
          {/* Section Romance */}
          {sections.romance.items.length > 0 && (
            <motion.section variants={sectionVariants}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{sections.romance.title}</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{sections.romance.subtitle}</p>
              <ContentCarousel items={sections.romance.items} />
            </motion.section>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
