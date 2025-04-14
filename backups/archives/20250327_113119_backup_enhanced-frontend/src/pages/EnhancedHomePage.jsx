import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import EnhancedHeroBanner from '../components/hero/EnhancedHeroBanner';
import EnhancedContentCarousel from '../components/carousel/EnhancedContentCarousel';
import EnhancedHeader from '../components/layout/EnhancedHeader';
import EnhancedFooter from '../components/layout/EnhancedFooter';
import { fetchAllItems, fetchPopularItems, fetchRecentItems, fetchItemsByType } from '../api/enhanced-metadata';
import { useWatchlist } from '../hooks/useWatchlist';

/**
 * Page d'accueil améliorée pour FloDrama
 * Utilise les composants optimisés pour une expérience utilisateur fluide
 */
const EnhancedHomePage = () => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredItem, setFeaturedItem] = useState(null);
  const [sections, setSections] = useState({
    popular: { title: 'Populaires', items: [] },
    recent: { title: 'Récemment ajoutés', items: [] },
    dramas: { title: 'Dramas', items: [] },
    movies: { title: 'Films', items: [] },
    anime: { title: 'Anime', items: [] },
    korean: { title: 'Corée du Sud', items: [] },
    japanese: { title: 'Japon', items: [] }
  });
  
  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Récupérer tous les éléments
        const allItems = await fetchAllItems();
        
        if (!allItems || allItems.length === 0) {
          throw new Error('Aucune donnée disponible');
        }
        
        // Élément en vedette (choisir un élément avec une bonne note et une image d'arrière-plan)
        const potentialFeatured = allItems
          .filter(item => item.backdropUrl && item.rating >= 8)
          .sort((a, b) => b.rating - a.rating);
        
        if (potentialFeatured.length > 0) {
          // Choisir un élément aléatoire parmi les 5 meilleurs
          const randomIndex = Math.floor(Math.random() * Math.min(5, potentialFeatured.length));
          setFeaturedItem(potentialFeatured[randomIndex]);
        } else {
          // Fallback: prendre le premier élément disponible
          setFeaturedItem(allItems[0]);
        }
        
        // Récupérer les éléments populaires
        const popularItems = await fetchPopularItems(20);
        
        // Récupérer les éléments récents
        const recentItems = await fetchRecentItems(20);
        
        // Récupérer les dramas
        const dramas = await fetchItemsByType('drama');
        
        // Récupérer les films
        const movies = await fetchItemsByType('movie');
        
        // Récupérer les animes
        const animes = allItems.filter(item => 
          item.genres && item.genres.some(genre => 
            genre.toLowerCase().includes('anime') || genre.toLowerCase().includes('animation')
          )
        );
        
        // Filtrer par pays
        const koreanContent = allItems.filter(item => 
          item.country && item.country.toLowerCase().includes('corée')
        );
        
        const japaneseContent = allItems.filter(item => 
          item.country && item.country.toLowerCase().includes('japon')
        );
        
        // Mettre à jour les sections
        setSections({
          popular: { title: 'Populaires', items: popularItems },
          recent: { title: 'Récemment ajoutés', items: recentItems },
          dramas: { title: 'Dramas', items: dramas },
          movies: { title: 'Films', items: movies },
          anime: { title: 'Anime', items: animes.length > 0 ? animes : [] },
          korean: { title: 'Corée du Sud', items: koreanContent },
          japanese: { title: 'Japon', items: japaneseContent }
        });
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Gérer la lecture
  const handlePlay = (item) => {
    navigate(`/watch/${item.id}`);
  };
  
  // Gérer l'ajout à la liste
  const handleAddToWatchlist = (item) => {
    toggleWatchlist(item);
  };
  
  // Gérer le clic sur Plus d'infos
  const handleInfo = (item) => {
    navigate(`/details/${item.id}`);
  };
  
  // Afficher un message de chargement
  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#141414',
        color: 'white'
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div style={{ 
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#E50914',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <h2 style={{ marginTop: '20px' }}>Chargement de FloDrama...</h2>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#141414',
        color: 'white',
        padding: '0 20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#E50914', marginBottom: '20px' }}>Une erreur est survenue</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#E50914',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }
  
  return (
    <div className="enhanced-home-page" style={{ backgroundColor: '#141414', color: 'white', minHeight: '100vh' }}>
      {/* En-tête */}
      <EnhancedHeader />
      
      {/* Bannière héroïque */}
      {featuredItem && (
        <EnhancedHeroBanner
          item={featuredItem}
          onPlay={handlePlay}
          onAddToWatchlist={handleAddToWatchlist}
          onInfo={handleInfo}
          isInWatchlist={isInWatchlist(featuredItem.id)}
        />
      )}
      
      {/* Sections de contenu */}
      <div style={{ padding: '0 40px 40px 40px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Section Populaires */}
          {sections.popular.items.length > 0 && (
            <EnhancedContentCarousel
              title={sections.popular.title}
              items={sections.popular.items}
              cardSize="md"
              onPlay={handlePlay}
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
          
          {/* Section Récemment ajoutés */}
          {sections.recent.items.length > 0 && (
            <EnhancedContentCarousel
              title={sections.recent.title}
              items={sections.recent.items}
              cardSize="md"
              onPlay={handlePlay}
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
          
          {/* Section Dramas */}
          {sections.dramas.items.length > 0 && (
            <EnhancedContentCarousel
              title={sections.dramas.title}
              items={sections.dramas.items}
              cardSize="md"
              onPlay={handlePlay}
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
          
          {/* Section Films */}
          {sections.movies.items.length > 0 && (
            <EnhancedContentCarousel
              title={sections.movies.title}
              items={sections.movies.items}
              cardSize="md"
              onPlay={handlePlay}
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
          
          {/* Section Anime */}
          {sections.anime.items.length > 0 && (
            <EnhancedContentCarousel
              title={sections.anime.title}
              items={sections.anime.items}
              cardSize="md"
              onPlay={handlePlay}
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
          
          {/* Section Corée du Sud */}
          {sections.korean.items.length > 0 && (
            <EnhancedContentCarousel
              title={sections.korean.title}
              items={sections.korean.items}
              cardSize="md"
              onPlay={handlePlay}
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
          
          {/* Section Japon */}
          {sections.japanese.items.length > 0 && (
            <EnhancedContentCarousel
              title={sections.japanese.title}
              items={sections.japanese.items}
              cardSize="md"
              onPlay={handlePlay}
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
        </motion.div>
      </div>
      
      {/* Pied de page */}
      <EnhancedFooter />
    </div>
  );
};

export default EnhancedHomePage;
