import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { lazyLoad } from '../utils/lazyLoader';
import MediaCard from '../components/MediaCard';
import AppErrorBoundary from '../components/AppErrorBoundary';
import localImageFallback from '../utils/localImageFallback';
import cacheManager from '../utils/cacheManager';

// Chargement paresseux des composants lourds
const LazyAppleStyleHero = lazyLoad(() => import('../components/widgets/AppleStyleHero'));
const LazyFrenchMovieBanner = lazyLoad(() => import('../components/widgets/FrenchMovieBanner'));

/**
 * Carrousel de contenu optimisé avec lazy loading
 */
const OptimizedContentCarousel = ({ title, items, onItemClick, onPlayClick, onTitleClick }) => {
  // Mémoriser les items pour éviter des re-rendus inutiles
  const memoizedItems = useMemo(() => items || [], [items]);
  
  if (!memoizedItems.length) return null;
  
  return (
    <div className="optimized-carousel">
      <div className="carousel-header">
        <h2 className="carousel-title" onClick={onTitleClick}>{title}</h2>
        <button className="see-all-button" onClick={onTitleClick}>
          Voir tout
        </button>
      </div>
      
      <div className="carousel-container">
        {memoizedItems.map((item) => (
          <div key={item.id} className="carousel-item">
            <MediaCard
              id={item.id}
              title={item.title}
              posterPath={item.poster_path || item.posterPath}
              backdropPath={item.backdrop_path || item.backdropPath}
              type={item.type || 'movie'}
              year={item.release_date?.substring(0, 4) || item.releaseDate?.substring(0, 4) || item.year}
              rating={item.vote_average || item.rating || 0}
              genres={item.genres || []}
              onClick={() => onItemClick(item)}
            />
          </div>
        ))}
      </div>
      
      <style jsx="true">{`
        .optimized-carousel {
          margin-bottom: 40px;
        }
        
        .carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 0 16px;
        }
        
        .carousel-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          cursor: pointer;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
          transition: opacity 0.3s ease;
        }
        
        .carousel-title:hover {
          opacity: 0.8;
        }
        
        .see-all-button {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          transition: border-color 0.3s ease, transform 0.3s ease;
        }
        
        .see-all-button:hover {
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
        }
        
        .carousel-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          padding: 0 16px;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        .carousel-container::-webkit-scrollbar {
          height: 6px;
        }
        
        .carousel-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .carousel-container::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
        }
        
        @media (max-width: 768px) {
          .carousel-container {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }
          
          .carousel-title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Page d'accueil optimisée de FloDrama
 * Utilise le lazy loading, le caching et la gestion d'erreurs
 */
const OptimizedHomePage = () => {
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
  
  // Initialiser les utilitaires au chargement de la page
  useEffect(() => {
    try {
      // Initialiser les placeholders pour les images
      localImageFallback.createPlaceholders();
      
      // Précharger les images importantes
      const importantImages = [
        '/assets/images/logo.png',
        '/assets/static/placeholders/poster-placeholder.svg',
        '/assets/static/placeholders/backdrop-placeholder.svg'
      ];
      
      importantImages.forEach(img => {
        localImageFallback.preloadAndCacheImage(img)
          .catch(err => console.warn(`Impossible de précharger ${img}:`, err));
      });
    } catch (error) {
      console.warn('Erreur lors de l\'initialisation des utilitaires:', error);
    }
  }, []);
  
  // Charger les données une fois les métadonnées disponibles
  useEffect(() => {
    if (isLoading || error) return;
    
    try {
      // Vérifier si les données sont en cache
      const cachedSections = cacheManager.getCache('homepage_sections', 'metadata');
      const cachedFeatured = cacheManager.getCache('homepage_featured', 'metadata');
      const cachedFrenchMovie = cacheManager.getCache('homepage_french_movie', 'metadata');
      
      if (cachedSections && cachedFeatured && cachedFrenchMovie) {
        console.log('Utilisation des données en cache pour la page d\'accueil');
        setSections(cachedSections);
        setFeatured(cachedFeatured);
        setFeaturedFrenchMovie(cachedFrenchMovie);
        return;
      }
      
      // Récupérer le contenu en vedette
      const featuredItems = getFeaturedItems();
      if (featuredItems && featuredItems.length > 0) {
        const featuredItem = featuredItems[0];
        setFeatured(featuredItem);
        cacheManager.setCache('homepage_featured', featuredItem, 'metadata');
      }
      
      // Récupérer les films français en vedette
      const frenchMovies = getFrenchMovies ? getFrenchMovies() : [];
      if (frenchMovies && frenchMovies.length > 0) {
        const frenchMovie = frenchMovies[0];
        setFeaturedFrenchMovie(frenchMovie);
        cacheManager.setCache('homepage_french_movie', frenchMovie, 'metadata');
      }
      
      // Mettre à jour les sections
      const updatedSections = {
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
      };
      
      setSections(updatedSections);
      cacheManager.setCache('homepage_sections', updatedSections, 'metadata');
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
        <style jsx="true">{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 70vh;
            color: white;
          }
          
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #d946ef;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 20px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <AppErrorBoundary>
      <motion.div 
        className="optimized-home-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Héro en style Apple TV+ avec lazy loading */}
        {featured && (
          <LazyAppleStyleHero 
            item={featured}
            onPlay={() => handlePlayContent(featured)}
            onInfo={() => handleShowDetails(featured)}
          />
        )}
        
        {/* Carrousels de contenu optimisés */}
        <div className="content-section">
          {Object.entries(sections).map(([key, section]) => 
            section.items && section.items.length > 0 ? (
              <OptimizedContentCarousel 
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
        
        {/* Bannière de films français avec lazy loading */}
        {featuredFrenchMovie && (
          <LazyFrenchMovieBanner 
            movie={featuredFrenchMovie}
            onPlay={() => handlePlayContent(featuredFrenchMovie)}
            onInfo={() => handleShowDetails(featuredFrenchMovie)}
          />
        )}
        
        <style jsx="true">{`
          .optimized-home-page {
            padding-bottom: 60px;
            background-color: #121118;
          }
          
          .content-section {
            margin-top: 40px;
          }
        `}</style>
      </motion.div>
    </AppErrorBoundary>
  );
};

export default OptimizedHomePage;
