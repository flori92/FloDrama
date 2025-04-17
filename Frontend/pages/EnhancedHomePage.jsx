import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import EnhancedHeroBanner from '../components/hero/EnhancedHeroBanner';
import EnhancedContentCarousel from '../components/carousel/EnhancedContentCarousel';
import EnhancedNavbar from '../components/layout/EnhancedNavbar';
import EnhancedFooter from '../components/layout/EnhancedFooter';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllItems, fetchPopularItems, fetchRecentItems, fetchItemsByType, fetchContinueWatching } from '../api/enhanced-metadata';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import './EnhancedHomePage.css';

/**
 * Page d'accueil améliorée pour FloDrama
 * Avec sections dynamiques, animations fluides et expérience utilisateur optimisée
 */
const EnhancedHomePage = () => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredItem, setFeaturedItem] = useState(null);
  const [sections, setSections] = useState({
    continueWatching: { title: 'Continuer à regarder', items: [] },
    popular: { title: 'Populaires', items: [] },
    recent: { title: 'Récemment ajoutés', items: [] },
    dramas: { title: 'Dramas', items: [] },
    movies: { title: 'Films', items: [] },
    anime: { title: 'Anime', items: [] },
    korean: { title: 'Corée du Sud', items: [] },
    japanese: { title: 'Japon', items: [] }
  });
  
  const sectionsRef = useRef({});
  const [visibleSections, setVisibleSections] = useState({});
  
  // Observer pour détecter les sections visibles
  useEffect(() => {
    const handleScroll = () => {
      // La variable scrollY n'est pas utilisée, nous la supprimons
    };
    
    window.addEventListener('scroll', handleScroll);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          setVisibleSections((prev) => ({
            ...prev,
            [id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );
    
    // Copier la référence actuelle pour éviter les problèmes lors du nettoyage
    const currentSectionsRef = { ...sectionsRef.current };
    
    Object.keys(currentSectionsRef).forEach((key) => {
      if (currentSectionsRef[key]) {
        observer.observe(currentSectionsRef[key]);
      }
    });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      Object.keys(currentSectionsRef).forEach((key) => {
        if (currentSectionsRef[key]) {
          observer.unobserve(currentSectionsRef[key]);
        }
      });
    };
  }, []);
  
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
          // Sélectionner un élément aléatoire parmi les 5 meilleurs
          const randomIndex = Math.floor(Math.random() * Math.min(5, potentialFeatured.length));
          setFeaturedItem(potentialFeatured[randomIndex]);
        } else {
          // Fallback si aucun élément ne correspond aux critères
          setFeaturedItem(allItems[0]);
        }
        
        // Récupérer les éléments populaires
        const popularItems = await fetchPopularItems();
        
        // Récupérer les éléments récents
        const recentItems = await fetchRecentItems();
        
        // Récupérer les dramas
        const dramaItems = await fetchItemsByType('drama');
        
        // Récupérer les films
        const movieItems = await fetchItemsByType('movie');
        
        // Récupérer les animes
        const animeItems = await fetchItemsByType('anime');
        
        // Récupérer les contenus coréens
        const koreanItems = allItems.filter(item => item.country === 'kr');
        
        // Récupérer les contenus japonais
        const japaneseItems = allItems.filter(item => item.country === 'jp');
        
        // Récupérer les éléments "Continuer à regarder" si l'utilisateur est connecté
        let continueWatchingItems = [];
        if (user) {
          continueWatchingItems = await fetchContinueWatching(user.id);
        }
        
        // Mettre à jour les sections
        setSections({
          continueWatching: { 
            title: 'Continuer à regarder', 
            items: continueWatchingItems 
          },
          popular: { 
            title: 'Populaires sur FloDrama', 
            items: popularItems 
          },
          recent: { 
            title: 'Récemment ajoutés', 
            items: recentItems 
          },
          dramas: { 
            title: 'Dramas', 
            items: dramaItems,
            category: 'drama'
          },
          movies: { 
            title: 'Films', 
            items: movieItems,
            category: 'movie'
          },
          anime: { 
            title: 'Anime', 
            items: animeItems,
            category: 'anime'
          },
          korean: { 
            title: 'Corée du Sud', 
            items: koreanItems,
            category: 'drama'
          },
          japanese: { 
            title: 'Japon', 
            items: japaneseItems,
            category: 'drama'
          }
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  // Gérer le clic sur un élément
  const handleItemClick = (item) => {
    navigate(`/details/${item.id}`);
  };
  
  // Gérer le clic sur le bouton Regarder
  const handlePlay = (item) => {
    navigate(`/watch/${item.id}`);
  };
  
  // Gérer le clic sur le bouton Plus d'infos
  const handleInfo = (item) => {
    navigate(`/details/${item.id}`);
  };
  
  // Gérer le clic sur le bouton Ajouter/Retirer de ma liste
  const handleToggleWatchlist = (item) => {
    toggleWatchlist(item);
  };
  
  // Rendu de l'état de chargement
  if (isLoading) {
    return (
      <div className="enhanced-loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  // Rendu de l'état d'erreur
  if (error) {
    return (
      <div className="enhanced-error-container">
        <h2>Une erreur est survenue</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }
  
  return (
    <div className="enhanced-home-page">
      {/* Navbar */}
      <EnhancedNavbar />
      
      {/* Bannière héroïque */}
      {featuredItem && (
        <EnhancedHeroBanner
          item={featuredItem}
          onPlay={handlePlay}
          onAddToWatchlist={handleToggleWatchlist}
          onInfo={handleInfo}
          isInWatchlist={isInWatchlist(featuredItem.id)}
        />
      )}
      
      {/* Sections de contenu */}
      <div className="enhanced-content-sections">
        {/* Section "Continuer à regarder" (conditionnelle) */}
        {user && sections.continueWatching.items.length > 0 && (
          <motion.section
            id="section-continue-watching"
            ref={el => sectionsRef.current['continueWatching'] = el}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: visibleSections['section-continue-watching'] ? 1 : 0,
              y: visibleSections['section-continue-watching'] ? 0 : 20
            }}
            transition={{ duration: 0.5 }}
            className="enhanced-content-section"
          >
            <EnhancedContentCarousel
              title={sections.continueWatching.title}
              items={sections.continueWatching.items}
              onItemClick={handleItemClick}
              isWatchlist={false}
              category="drama"
            />
          </motion.section>
        )}
        
        {/* Section "Populaires" */}
        <motion.section
          id="section-popular"
          ref={el => sectionsRef.current['popular'] = el}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: visibleSections['section-popular'] ? 1 : 0,
            y: visibleSections['section-popular'] ? 0 : 20
          }}
          transition={{ duration: 0.5 }}
          className="enhanced-content-section"
        >
          <EnhancedContentCarousel
            title={sections.popular.title}
            items={sections.popular.items}
            onItemClick={handleItemClick}
            isWatchlist={false}
            category="drama"
          />
        </motion.section>
        
        {/* Section "Dramas" */}
        <motion.section
          id="section-dramas"
          ref={el => sectionsRef.current['dramas'] = el}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: visibleSections['section-dramas'] ? 1 : 0,
            y: visibleSections['section-dramas'] ? 0 : 20
          }}
          transition={{ duration: 0.5 }}
          className="enhanced-content-section"
        >
          <EnhancedContentCarousel
            title={sections.dramas.title}
            items={sections.dramas.items}
            onItemClick={handleItemClick}
            isWatchlist={false}
            category="drama"
          />
        </motion.section>
        
        {/* Section "Films" */}
        <motion.section
          id="section-movies"
          ref={el => sectionsRef.current['movies'] = el}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: visibleSections['section-movies'] ? 1 : 0,
            y: visibleSections['section-movies'] ? 0 : 20
          }}
          transition={{ duration: 0.5 }}
          className="enhanced-content-section"
        >
          <EnhancedContentCarousel
            title={sections.movies.title}
            items={sections.movies.items}
            onItemClick={handleItemClick}
            isWatchlist={false}
            category="movie"
          />
        </motion.section>
        
        {/* Section "Récemment ajoutés" */}
        <motion.section
          id="section-recent"
          ref={el => sectionsRef.current['recent'] = el}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: visibleSections['section-recent'] ? 1 : 0,
            y: visibleSections['section-recent'] ? 0 : 20
          }}
          transition={{ duration: 0.5 }}
          className="enhanced-content-section"
        >
          <EnhancedContentCarousel
            title={sections.recent.title}
            items={sections.recent.items}
            onItemClick={handleItemClick}
            isWatchlist={false}
            category="drama"
          />
        </motion.section>
        
        {/* Section "Anime" */}
        {sections.anime.items.length > 0 && (
          <motion.section
            id="section-anime"
            ref={el => sectionsRef.current['anime'] = el}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: visibleSections['section-anime'] ? 1 : 0,
              y: visibleSections['section-anime'] ? 0 : 20
            }}
            transition={{ duration: 0.5 }}
            className="enhanced-content-section"
          >
            <EnhancedContentCarousel
              title={sections.anime.title}
              items={sections.anime.items}
              onItemClick={handleItemClick}
              isWatchlist={false}
              category="anime"
            />
          </motion.section>
        )}
        
        {/* Section "Corée du Sud" */}
        {sections.korean.items.length > 0 && (
          <motion.section
            id="section-korean"
            ref={el => sectionsRef.current['korean'] = el}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: visibleSections['section-korean'] ? 1 : 0,
              y: visibleSections['section-korean'] ? 0 : 20
            }}
            transition={{ duration: 0.5 }}
            className="enhanced-content-section"
          >
            <EnhancedContentCarousel
              title={sections.korean.title}
              items={sections.korean.items}
              onItemClick={handleItemClick}
              isWatchlist={false}
              category="drama"
            />
          </motion.section>
        )}
        
        {/* Section "Japon" */}
        {sections.japanese.items.length > 0 && (
          <motion.section
            id="section-japanese"
            ref={el => sectionsRef.current['japanese'] = el}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: visibleSections['section-japanese'] ? 1 : 0,
              y: visibleSections['section-japanese'] ? 0 : 20
            }}
            transition={{ duration: 0.5 }}
            className="enhanced-content-section"
          >
            <EnhancedContentCarousel
              title={sections.japanese.title}
              items={sections.japanese.items}
              onItemClick={handleItemClick}
              isWatchlist={false}
              category="drama"
            />
          </motion.section>
        )}
      </div>
      
      {/* Footer */}
      <EnhancedFooter />
    </div>
  );
};

export default EnhancedHomePage;
