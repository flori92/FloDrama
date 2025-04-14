import React, { useState, useEffect } from 'react';
import { useMetadata } from '../hooks/useMetadata';
import AppleStyleHero from '../components/widgets/AppleStyleHero';
import ContentCarousel from '../components/carousel/ContentCarousel';
import DynamicCarousel from '../components/DynamicCarousel';
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
    getAllItems
  } = useMetadata();
  
  const [featured, setFeatured] = useState(null);
  const [sections, setSections] = useState({
    nouveautes: { title: 'Nouveautés', items: [] },
    tendances: { title: 'Tendances', items: [] },
    recommandes: { title: 'Recommandés pour vous', items: [] },
    dramas: { title: 'Dramas', items: [] },
    movies: { title: 'Films', items: [] },
    anime: { title: 'Anime', items: [] },
    romance: { title: 'Romance', items: [] }
  });
  
  // Charger les données une fois les métadonnées disponibles
  useEffect(() => {
    if (isLoading || error) return;
    
    // Récupérer le contenu en vedette
    const featuredItems = getFeaturedItems();
    if (featuredItems.length > 0) {
      setFeatured(featuredItems[0]);
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
      }
    });
  }, [isLoading, error, getFeaturedItems, getTrendingItems, getRecommendedItems, getAllItems]);

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
  
  // Afficher un message de chargement pendant le chargement des données
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Chargement des contenus...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Afficher un message d'erreur en cas d'erreur
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-lg px-4">
            <h2 className="text-2xl font-bold text-fuchsia-500 mb-4">Oups, une erreur s'est produite</h2>
            <p className="text-white mb-6">Nous n'avons pas pu charger les contenus. Veuillez réessayer ultérieurement.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <main className="flex-1">
        {/* Section Héro */}
        {featured && <AppleStyleHero item={featured} />}
        
        {/* Sections de contenu */}
        <motion.div 
          className="pt-8 pb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Carrousel Dynamique - Nouveautés */}
          <motion.div variants={sectionVariants}>
            <DynamicCarousel 
              title="À découvrir sur FloDrama" 
              dataSource="latest" 
              refreshInterval={5000} 
            />
          </motion.div>
          
          {/* Nouveautés */}
          {sections.nouveautes.items.length > 0 && (
            <motion.div variants={sectionVariants}>
              <ContentCarousel 
                title={sections.nouveautes.title}
                items={sections.nouveautes.items}
                size="md"
              />
            </motion.div>
          )}
          
          {/* Carrousel Dynamique - Films Populaires */}
          <motion.div variants={sectionVariants}>
            <DynamicCarousel 
              title="Films Populaires" 
              dataSource="movies" 
              refreshInterval={5000} 
            />
          </motion.div>
          
          {/* Tendances */}
          {sections.tendances.items.length > 0 && (
            <motion.div variants={sectionVariants}>
              <ContentCarousel 
                title={sections.tendances.title}
                items={sections.tendances.items}
                size="md"
              />
            </motion.div>
          )}
          
          {/* Carrousel Dynamique - K-Shows */}
          <motion.div variants={sectionVariants}>
            <DynamicCarousel 
              title="K-Shows Populaires" 
              dataSource="kshows" 
              refreshInterval={5000} 
            />
          </motion.div>
          
          {/* Recommandés */}
          {sections.recommandes.items.length > 0 && (
            <motion.div variants={sectionVariants}>
              <ContentCarousel 
                title={sections.recommandes.title}
                items={sections.recommandes.items}
                size="lg"
              />
            </motion.div>
          )}
          
          {/* Dramas */}
          {sections.dramas.items.length > 0 && (
            <motion.div variants={sectionVariants}>
              <ContentCarousel 
                title={sections.dramas.title}
                items={sections.dramas.items}
                size="md"
              />
            </motion.div>
          )}
          
          {/* Films */}
          {sections.movies.items.length > 0 && (
            <motion.div variants={sectionVariants}>
              <ContentCarousel 
                title={sections.movies.title}
                items={sections.movies.items}
                size="md"
              />
            </motion.div>
          )}
          
          {/* Anime */}
          {sections.anime.items.length > 0 && (
            <motion.div variants={sectionVariants}>
              <ContentCarousel 
                title={sections.anime.title}
                items={sections.anime.items}
                size="md"
              />
            </motion.div>
          )}
          
          {/* Romance */}
          {sections.romance.items.length > 0 && (
            <motion.div variants={sectionVariants}>
              <ContentCarousel 
                title={sections.romance.title}
                items={sections.romance.items}
                size="md"
              />
            </motion.div>
          )}
          
          {/* Carrousel Dynamique - Animés */}
          <motion.div variants={sectionVariants}>
            <DynamicCarousel 
              title="Animés Populaires" 
              dataSource="anime" 
              refreshInterval={5000} 
            />
          </motion.div>
          
          {/* Carrousel Dynamique - Bollywood */}
          <motion.div variants={sectionVariants}>
            <DynamicCarousel 
              title="Bollywood Populaires" 
              dataSource="bollywood" 
              refreshInterval={5000} 
            />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default HomePage;
