/**
 * Composant de carrousel de recommandations pour FloDrama
 * Affiche les recommandations personnalisées avec une interface visuellement cohérente
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ContentCard from '../content/ContentCard';
import { useRecommendations } from '../../hooks/useRecommendations';
import { RECOMMENDATION_TYPES } from '../../services/recommendations/constants';

const RecommendationCarousel = ({ 
  title = "Recommandations pour vous", 
  userId,
  type = RECOMMENDATION_TYPES.PERSONALIZED,
  contentType = null,
  limit = 10,
  showSource = false,
  className = ""
}) => {
  const { recommendations, loading, error } = useRecommendations(userId, {
    type,
    contentType,
    limit: limit + 2, // Charger quelques éléments supplémentaires pour une meilleure expérience
    contextualBoost: true
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(5);
  const carouselRef = useRef(null);
  
  // Ajuster le nombre d'éléments visibles en fonction de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleItems(2);
      } else if (width < 768) {
        setVisibleItems(3);
      } else if (width < 1024) {
        setVisibleItems(4);
      } else {
        setVisibleItems(5);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Naviguer vers la gauche
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : 0
    );
  };
  
  // Naviguer vers la droite
  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex + visibleItems < recommendations.length 
        ? prevIndex + 1 
        : prevIndex
    );
  };
  
  // Obtenir l'icône et la couleur en fonction du type de recommandation
  const getRecommendationIcon = () => {
    switch (type) {
      case RECOMMENDATION_TYPES.PERSONALIZED:
        return <SparklesIcon className="w-5 h-5 text-fuchsia-500" />;
      case RECOMMENDATION_TYPES.SIMILAR:
        return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>;
      case RECOMMENDATION_TYPES.TRENDING:
        return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>;
      case RECOMMENDATION_TYPES.CONTEXTUAL:
        return <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>;
      default:
        return <SparklesIcon className="w-5 h-5 text-fuchsia-500" />;
    }
  };
  
  // Rendu du composant de chargement
  if (loading) {
    return (
      <div className={`mb-8 ${className}`}>
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <div className="ml-2 animate-pulse">
            {getRecommendationIcon()}
          </div>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(visibleItems)].map((_, index) => (
            <div 
              key={index} 
              className="flex-none w-48 h-72 bg-gray-800 rounded-lg animate-pulse"
              style={{ minWidth: '192px' }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Rendu en cas d'erreur
  if (error) {
    return (
      <div className={`mb-8 ${className}`}>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <div className="p-4 bg-red-900 bg-opacity-30 rounded-lg">
          <p className="text-red-400">
            Une erreur est survenue lors du chargement des recommandations.
          </p>
        </div>
      </div>
    );
  }
  
  // Rendu si aucune recommandation n'est disponible
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`mb-8 ${className}`}>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <div className="p-4 bg-gray-800 bg-opacity-30 rounded-lg">
          <p className="text-gray-400">
            Aucune recommandation disponible pour le moment.
          </p>
        </div>
      </div>
    );
  }
  
  // Rendu principal du carrousel
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <div className="ml-2">
            {getRecommendationIcon()}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-1 rounded-full ${
              currentIndex === 0 
                ? 'text-gray-600 cursor-not-allowed' 
                : 'text-white hover:bg-white hover:bg-opacity-10'
            }`}
            aria-label="Précédent"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex + visibleItems >= recommendations.length}
            className={`p-1 rounded-full ${
              currentIndex + visibleItems >= recommendations.length
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-white hover:bg-white hover:bg-opacity-10'
            }`}
            aria-label="Suivant"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="relative overflow-hidden" ref={carouselRef}>
        <motion.div
          className="flex space-x-4"
          animate={{
            x: -currentIndex * (carouselRef.current?.offsetWidth / visibleItems || 0)
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {recommendations.map((item, index) => (
            <div 
              key={item.id || index} 
              className="flex-none"
              style={{ width: `calc(100% / ${visibleItems})` }}
            >
              <ContentCard 
                content={item} 
                showBadge={showSource && item.source}
                badgeText={item.source ? capitalizeFirstLetter(item.source) : null}
                badgeColor={getBadgeColor(item.source)}
              />
              
              {/* Afficher la source de la recommandation si demandé */}
              {showSource && item.contextSource && (
                <div className="mt-1 text-xs text-gray-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  {getContextSourceLabel(item.contextSource)}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// Fonctions utilitaires
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getBadgeColor = (source) => {
  switch (source) {
    case 'similar':
      return 'bg-blue-500';
    case 'trending':
      return 'bg-red-500';
    case 'contextual':
      return 'bg-green-500';
    case 'genre':
      return 'bg-purple-500';
    default:
      return 'bg-gradient-to-r from-blue-500 to-fuchsia-500';
  }
};

const getContextSourceLabel = (contextSource) => {
  switch (contextSource) {
    case 'time':
      return 'Adapté à votre horaire';
    case 'device':
      return 'Optimisé pour votre appareil';
    case 'season':
      return 'Parfait pour cette saison';
    default:
      return 'Recommandation contextuelle';
  }
};

export default RecommendationCarousel;
