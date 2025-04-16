import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import AppleStyleHero from '../components/widgets/AppleStyleHero';
import FrenchMovieBanner from '../components/widgets/FrenchMovieBanner';
import ContentCarousel from '../components/carousel/ContentCarousel';
import { motion } from 'framer-motion';

/**
 * Page d'accueil principale de FloDrama
 * Redesign inspiré du style Apple TV+
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { 
    isLoading, 
    error, 
    getFeaturedItems,
    getTrendingItems,
    getRecommendedItems,
    getAllItems,
    getFrenchMovies
  } = useAppContext();
  
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
    
    try {
      // Récupérer le contenu en vedette
      const featuredItems = getFeaturedItems();
      if (featuredItems && featuredItems.length > 0) {
        setFeatured(featuredItems[0]);
      }
      
      // Récupérer les films français en vedette
      const frenchMovies = getFrenchMovies ? getFrenchMovies() : [];
      if (frenchMovies && frenchMovies.length > 0) {
        setFeaturedFrenchMovie(frenchMovies[0]);
      }
      
      // Mettre à jour les sections
      setSections({
        nouveautes: { title: 'Nouveautés', items: getFeaturedItems() || [] },
        tendances: { title: 'Tendances', items: getTrendingItems() || [] },
        recommandes: { title: 'Recommandés pour vous', items: getRecommendedItems() || [] },
        dramas: { title: 'Dramas', items: getAllItems('drama') || [] },
        movies: { title: 'Films', items: getAllItems('movie') || [] },
        anime: { title: 'Anime', items: getAllItems('anime') || [] },
        romance: { 
          title: 'Romance', 
          items: getAllItems().filter(item => item.genres?.includes('Romance')).slice(0, 10) || [] 
        },
        frenchMovies: { title: 'Cinéma Français', items: getFrenchMovies() || [] }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données de la page d\'accueil:', error);
    }
  }, [isLoading, error, getFeaturedItems, getTrendingItems, getRecommendedItems, getAllItems, getFrenchMovies]);
  
  // Gestionnaires d'événements pour les actions utilisateur
  const handlePlayContent = (item) => {
    console.log('Lecture de', item.title);
    navigate(`/watch/${item.id}`);
  };
  
  const handleShowDetails = (item) => {
    console.log('Affichage des détails pour', item.title);
    navigate(`/details/${item.id}`);
  };
  
  const handleCategoryClick = (category) => {
    console.log('Navigation vers la catégorie', category);
    navigate(`/category/${category.toLowerCase()}`);
  };
  
  // Afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des contenus...</p>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Héro en style Apple TV+ */}
      {featured && (
        <AppleStyleHero 
          item={featured}
          onPlay={() => handlePlayContent(featured)}
          onInfo={() => handleShowDetails(featured)}
        />
      )}
      
      {/* Carrousels de contenu */}
      <div className="content-section">
        {Object.entries(sections).map(([key, section]) => 
          section.items && section.items.length > 0 ? (
            <ContentCarousel 
              key={key}
              title={section.title}
              items={section.items}
              onItemClick={(item) => handleShowDetails(item)}
              onPlayClick={(item) => handlePlayContent(item)}
              onTitleClick={() => handleCategoryClick(key)}
            />
          ) : null
        )}
      </div>
      
      {/* Bannière de films français */}
      {featuredFrenchMovie && (
        <FrenchMovieBanner 
          movie={featuredFrenchMovie}
          onPlay={() => handlePlayContent(featuredFrenchMovie)}
          onInfo={() => handleShowDetails(featuredFrenchMovie)}
        />
      )}
    </motion.div>
  );
};

export default HomePage;
