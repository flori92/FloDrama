/**
 * Composant de carrousel de recommandations pour FloDrama
 * 
 * Affiche un carrousel de recommandations personnalisées basées sur
 * différents facteurs comme le contexte, les préférences utilisateur
 * et l'historique de visionnage.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useRecommendations from '../../hooks/useRecommendations';
import './RecommendationCarousel.css';

/**
 * Composant de carrousel de recommandations
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre du carrousel
 * @param {string} props.type - Type de recommandation (trending, personalized, contextual, similar, continue_watching)
 * @param {string} props.contentId - ID du contenu pour les recommandations similaires
 * @param {number} props.limit - Nombre de recommandations à afficher
 * @param {boolean} props.showReasons - Afficher les raisons des recommandations
 * @param {boolean} props.autoScroll - Activer le défilement automatique
 * @returns {JSX.Element} - Composant de carrousel
 */
const RecommendationCarousel = ({
  title = 'Recommandations pour vous',
  type = 'personalized',
  contentId = null,
  limit = 10,
  showReasons = true,
  autoScroll = false
}) => {
  // Utiliser le hook de recommandations
  const { 
    recommendations, 
    loading, 
    error, 
    contextData, 
    refreshRecommendations,
    CONFIG
  } = useRecommendations({
    type,
    contentId,
    limit,
    useCache: true
  });
  
  // Références et états pour le carrousel
  const carouselRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [autoScrollActive, setAutoScrollActive] = useState(autoScroll);
  const [hoverState, setHoverState] = useState(false);
  
  // Calculer la position maximale de défilement
  useEffect(() => {
    if (carouselRef.current) {
      const { scrollWidth, clientWidth } = carouselRef.current;
      setMaxScroll(scrollWidth - clientWidth);
    }
  }, [recommendations]);
  
  // Gestion du défilement automatique
  useEffect(() => {
    let scrollInterval;
    
    if (autoScrollActive && !hoverState && !loading && recommendations.length > 0 && maxScroll > 0) {
      scrollInterval = setInterval(() => {
        setScrollPosition(prev => {
          const newPosition = prev + 1;
          if (newPosition >= maxScroll) {
            return 0;
          }
          return newPosition;
        });
      }, 50);
    }
    
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [autoScrollActive, hoverState, loading, recommendations, maxScroll]);
  
  // Appliquer la position de défilement
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);
  
  // Fonction pour faire défiler vers la gauche
  const scrollLeft = () => {
    setAutoScrollActive(false);
    const newPosition = Math.max(0, scrollPosition - 300);
    setScrollPosition(newPosition);
  };
  
  // Fonction pour faire défiler vers la droite
  const scrollRight = () => {
    setAutoScrollActive(false);
    const newPosition = Math.min(maxScroll, scrollPosition + 300);
    setScrollPosition(newPosition);
  };
  
  // Gérer le survol du carrousel
  const handleMouseEnter = () => {
    setHoverState(true);
  };
  
  const handleMouseLeave = () => {
    setHoverState(false);
  };
  
  // Fonction pour obtenir le texte de raison approprié
  const getReasonText = (item) => {
    if (!showReasons) return null;
    
    if (item.reason) return item.reason;
    
    if (type === CONFIG.types.TRENDING) {
      return 'Populaire en ce moment';
    } else if (type === CONFIG.types.PERSONALIZED) {
      return 'Basé sur vos préférences';
    } else if (type === CONFIG.types.CONTEXTUAL) {
      return contextData?.timeOfDay === 'morning' 
        ? 'Parfait pour commencer la journée' 
        : 'Recommandé pour le moment';
    } else if (type === CONFIG.types.SIMILAR) {
      return 'Contenu similaire';
    } else if (type === CONFIG.types.CONTINUE_WATCHING) {
      return 'Continuer à regarder';
    }
    
    return null;
  };
  
  // Fonction pour obtenir le score approprié
  const getScore = (item) => {
    if (item.trendingScore) return item.trendingScore;
    if (item.personalScore) return item.personalScore;
    if (item.contextScore) return item.contextScore;
    if (item.similarityScore) return item.similarityScore;
    return null;
  };
  
  // Fonction pour formater la date de dernier visionnage
  const formatLastWatched = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // Moins d'une heure
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Moins d'un jour
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    // Moins d'une semaine
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    
    // Format de date standard
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  
  // Rendu du composant
  return (
    <div className="recommendation-carousel-container">
      <div className="recommendation-carousel-header">
        <h2 className="recommendation-carousel-title">{title}</h2>
        
        {!loading && recommendations.length > 0 && (
          <div className="recommendation-carousel-controls">
            <button 
              className="recommendation-carousel-refresh" 
              onClick={refreshRecommendations}
              aria-label="Rafraîchir les recommandations"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            
            <div className="recommendation-carousel-nav-buttons">
              <button 
                className="recommendation-carousel-nav-button" 
                onClick={scrollLeft}
                disabled={scrollPosition <= 0}
                aria-label="Défiler vers la gauche"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <button 
                className="recommendation-carousel-nav-button" 
                onClick={scrollRight}
                disabled={scrollPosition >= maxScroll}
                aria-label="Défiler vers la droite"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="recommendation-carousel-loading">
          <div className="recommendation-carousel-loading-spinner"></div>
          <p>Chargement des recommandations...</p>
        </div>
      ) : error ? (
        <div className="recommendation-carousel-error">
          <p>Erreur: {error}</p>
          <button onClick={refreshRecommendations}>Réessayer</button>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="recommendation-carousel-empty">
          <p>Aucune recommandation disponible pour le moment.</p>
        </div>
      ) : (
        <div 
          className="recommendation-carousel" 
          ref={carouselRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {recommendations.map((item) => (
            <Link 
              key={`${item.id}-${item.episodeId || 'main'}`}
              to={item.episodeId 
                ? `/player/${item.id}/${item.episodeId}` 
                : `/content/${item.id}`
              }
              className="recommendation-item"
            >
              <div className="recommendation-item-image-container">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="recommendation-item-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/media/fallback-poster.svg';
                  }}
                />
                
                {item.progress && (
                  <div className="recommendation-item-progress-container">
                    <div 
                      className="recommendation-item-progress-bar"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}
                
                {getScore(item) && (
                  <div className="recommendation-item-score">
                    {getScore(item)}%
                  </div>
                )}
              </div>
              
              <div className="recommendation-item-info">
                <h3 className="recommendation-item-title">{item.title}</h3>
                
                <div className="recommendation-item-details">
                  {item.year && <span className="recommendation-item-year">{item.year}</span>}
                  {item.type && (
                    <span className={`recommendation-item-type recommendation-item-type-${item.type}`}>
                      {item.type === 'drama' ? 'Drama' : item.type === 'anime' ? 'Anime' : 'Film'}
                    </span>
                  )}
                  {item.rating && <span className="recommendation-item-rating">★ {item.rating}</span>}
                </div>
                
                {type === CONFIG.types.CONTINUE_WATCHING && item.lastWatched && (
                  <div className="recommendation-item-last-watched">
                    {formatLastWatched(item.lastWatched)}
                  </div>
                )}
                
                {showReasons && getReasonText(item) && (
                  <div className="recommendation-item-reason">
                    {getReasonText(item)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationCarousel;
