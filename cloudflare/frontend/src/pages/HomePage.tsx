/**
 * Page d'accueil de FloDrama
 * 
 * Cette page présente les recommandations personnalisées, les contenus populaires
 * et les dernières sorties avec prévisualisation des trailers au survol.
 */

import React, { useState, useEffect } from 'react';
import ContentGrid from '../components/ContentGrid';
import { fetchContentByCategory, ContentItem } from '../services/apiService';
import useRecommendations from '../hooks/useRecommendations';
import { motion } from 'framer-motion';

// Composant de bannière héro avec trailer en arrière-plan
const HeroBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Données de démonstration pour la bannière
  const heroItems = [
    {
      id: 'hero1',
      title: 'Squid Game',
      description: 'Des personnes en difficulté financière sont invitées à participer à une mystérieuse compétition de survie.',
      backdrop: 'https://assets.nflxext.com/ffe/siteui/vlv3/ab4b0b22-2ddf-4d48-ae88-c201ae0267e2/0efe6360-4f6d-4b10-beb5-71fde8073859/FR-fr-20231030-popsignuptwoweeks-perspective_alpha_website_small.jpg',
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/31c9291ab41fac05471db4e73aa11717/manifest/video.m3u8'
    },
    {
      id: 'hero2',
      title: 'Vincenzo',
      description: 'Un avocat italo-coréen spécialisé dans le travail avec la mafia retourne en Corée et utilise ses compétences pour obtenir justice.',
      backdrop: 'https://assets.nflxext.com/ffe/siteui/vlv3/ab4b0b22-2ddf-4d48-ae88-c201ae0267e2/0efe6360-4f6d-4b10-beb5-71fde8073859/FR-fr-20231030-popsignuptwoweeks-perspective_alpha_website_small.jpg',
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/31c9291ab41fac05471db4e73aa11717/manifest/video.m3u8'
    },
    {
      id: 'hero3',
      title: 'Demon Slayer',
      description: 'Après que sa famille a été brutalement tuée et sa sœur transformée en démon, Tanjiro Kamado se lance dans une quête dangereuse pour venger sa famille et guérir sa sœur.',
      backdrop: 'https://assets.nflxext.com/ffe/siteui/vlv3/ab4b0b22-2ddf-4d48-ae88-c201ae0267e2/0efe6360-4f6d-4b10-beb5-71fde8073859/FR-fr-20231030-popsignuptwoweeks-perspective_alpha_website_small.jpg',
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/31c9291ab41fac05471db4e73aa11717/manifest/video.m3u8'
    }
  ];
  
  // Rotation automatique de la bannière
  useEffect(() => {
    if (isHovering) {
      return; // Arrêter la rotation automatique pendant le survol
    }
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroItems.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isHovering, heroItems.length]);
  
  const currentHero = heroItems[currentIndex];
  
  return (
    <div 
      className="relative w-full h-[70vh] mb-8 overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Arrière-plan avec effet de flou */}
      <div className="absolute inset-0 z-0">
        <img 
          src={currentHero.backdrop} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10"></div>
      </div>
      
      {/* Contenu de la bannière */}
      <div className="relative z-20 flex flex-col justify-center h-full max-w-5xl mx-auto px-6">
        <motion.div
          key={currentHero.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-white"
        >
          <h1 className="text-5xl font-bold mb-4">{currentHero.title}</h1>
          <p className="text-xl max-w-2xl mb-8">{currentHero.description}</p>
          
          <div className="flex flex-wrap gap-4">
            <motion.button
              className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full font-medium shadow-lg hover:bg-white/90 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Regarder</span>
            </motion.button>
            
            <motion.button
              className="flex items-center space-x-2 border border-white/30 bg-transparent text-white px-6 py-3 rounded-full font-medium hover:bg-white/10 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Plus d'infos</span>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Indicateurs de navigation */}
        <div className="absolute bottom-8 left-6 flex space-x-2">
          {heroItems.map((_, index) => (
            <motion.button
              key={index}
              className="p-3 rounded-full border border-white/30 hover:bg-gradient-to-r hover:from-blue-500 hover:to-fuchsia-500 text-white transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              onClick={() => setCurrentIndex(index)}
            >
              <div className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-white/30'}`}></div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Page d'accueil principale
const HomePage: React.FC = () => {
  // ID utilisateur fictif pour la démo
  const userId = 'user123';
  
  // Récupération des recommandations personnalisées
  const { 
    recommendations, 
    isLoading: isLoadingRecommendations,
    refreshRecommendations
  } = useRecommendations({
    userId,
    initialParams: { limit: 12 }
  });
  
  // État pour les autres catégories de contenu
  const [popularContent, setPopularContent] = useState<ContentItem[]>([]);
  const [newReleases, setNewReleases] = useState<ContentItem[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  
  // Chargement des contenus populaires
  useEffect(() => {
    const loadPopularContent = async () => {
      try {
        setIsLoadingPopular(true);
        const data = await fetchContentByCategory('drama', 1, 12);
        setPopularContent(data);
      } catch (error) {
        console.error('Erreur lors du chargement des contenus populaires:', error);
      } finally {
        setIsLoadingPopular(false);
      }
    };
    
    loadPopularContent();
  }, []);
  
  // Chargement des nouvelles sorties
  useEffect(() => {
    const loadNewReleases = async () => {
      try {
        setIsLoadingNew(true);
        const data = await fetchContentByCategory('anime', 1, 12);
        setNewReleases(data);
      } catch (error) {
        console.error('Erreur lors du chargement des nouvelles sorties:', error);
      } finally {
        setIsLoadingNew(false);
      }
    };
    
    loadNewReleases();
  }, []);
  
  return (
    <div className="bg-flo-dark min-h-screen">
      {/* Bannière héro */}
      <HeroBanner />
      
      <div className="container mx-auto px-4 pb-12">
        {/* Recommandations personnalisées */}
        <ContentGrid
          title="Recommandations pour vous"
          items={recommendations}
          userId={userId}
          isLoading={isLoadingRecommendations}
          onRefresh={refreshRecommendations}
        />
        
        {/* Contenus populaires */}
        <ContentGrid
          title="Populaires en ce moment"
          items={popularContent}
          userId={userId}
          contentType="drama"
          isLoading={isLoadingPopular}
        />
        
        {/* Nouvelles sorties */}
        <ContentGrid
          title="Nouvelles sorties"
          items={newReleases}
          userId={userId}
          contentType="anime"
          isLoading={isLoadingNew}
        />
      </div>
    </div>
  );
};

export default HomePage;
