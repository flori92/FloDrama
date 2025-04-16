/**
 * Composant VideoPlayerWithRecommendations pour FloDrama
 * Intègre le lecteur vidéo avancé avec le système de recommandations intelligent
 */

import React, { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './VideoPlayer';
import { useRecommendations } from '../hooks/useRecommendations';

// Styles conformes à l'identité visuelle FloDrama
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#121118',
    color: 'white',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  playerSection: {
    flex: '1 0 auto',
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9'
  },
  recommendationsSection: {
    padding: '20px',
    backgroundColor: '#1A1926'
  },
  recommendationsTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '16px',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block'
  },
  recommendationsSubtitle: {
    fontSize: '14px',
    opacity: '0.7',
    marginBottom: '20px'
  },
  recommendationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
    marginTop: '20px'
  },
  recommendationCard: {
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    backgroundColor: '#121118',
    position: 'relative'
  },
  recommendationCardHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
  },
  recommendationImage: {
    width: '100%',
    aspectRatio: '2/3',
    objectFit: 'cover'
  },
  recommendationInfo: {
    padding: '12px'
  },
  recommendationTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  recommendationMeta: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    display: 'flex',
    justifyContent: 'space-between'
  },
  recommendationReason: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  contextualSection: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '20px',
    backgroundColor: '#121118'
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '20px'
  },
  statCard: {
    flex: 1,
    padding: '16px',
    backgroundColor: '#1A1926',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  statLabel: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  factorsPill: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    marginRight: '8px',
    marginBottom: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#3b82f6'
  },
  explanationBox: {
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.5',
    marginTop: '16px'
  }
};

/**
 * Composant intégrant le lecteur vidéo avec le système de recommandations
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant React
 */
const VideoPlayerWithRecommendations = ({
  contentId,
  title,
  description,
  genre,
  year,
  showStats = false
}) => {
  // États
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentContent, setCurrentContent] = useState({
    id: contentId,
    title,
    description,
    genre,
    year
  });
  const [watchTime, setWatchTime] = useState(0);
  const [started, setStarted] = useState(false);
  
  // Hook de recommandations
  const {
    recommendations,
    contextualFactors,
    stats,
    getRecommendations
  } = useRecommendations(contentId);
  
  // Mettre à jour les recommandations lorsque le contenu change
  useEffect(() => {
    if (contentId) {
      setCurrentContent({
        id: contentId,
        title,
        description,
        genre,
        year
      });
      
      getRecommendations(contentId);
    }
  }, [contentId, title, getRecommendations]);
  
  // Simuler le temps de visionnage
  useEffect(() => {
    let interval;
    
    if (started) {
      interval = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [started]);
  
  // Gérer la lecture/pause
  const handlePlay = useCallback(() => {
    setStarted(true);
  }, []);
  
  const handlePause = useCallback(() => {
    setStarted(false);
  }, []);
  
  // Gérer la fin de la vidéo
  const handleEnded = useCallback(() => {
    setStarted(false);
    // Ici, vous pourriez lancer automatiquement la prochaine vidéo recommandée
  }, []);
  
  // Sélectionner un contenu recommandé
  const handleSelectRecommendation = useCallback((recommendation) => {
    setCurrentContent({
      id: recommendation.id,
      title: recommendation.title,
      description: recommendation.description || 'Aucune description disponible.',
      genre: recommendation.genre || 'Non catégorisé',
      year: recommendation.year || 'Inconnu'
    });
    
    setWatchTime(0);
    setStarted(false);
    
    // Mettre à jour les recommandations
    getRecommendations(recommendation.id);
  }, [getRecommendations]);
  
  // Formatter les facteurs contextuels pour l'affichage
  const formatContextualFactors = useCallback(() => {
    if (!contextualFactors) return 'Aucun facteur contextuel disponible.';
    
    const factors = [];
    
    if (contextualFactors.timeOfDay) {
      factors.push(`Moment de la journée: ${contextualFactors.timeOfDay}`);
    }
    
    if (contextualFactors.device) {
      factors.push(`Appareil: ${contextualFactors.device}`);
    }
    
    if (contextualFactors.season) {
      factors.push(`Saison: ${contextualFactors.season}`);
    }
    
    return factors.length > 0 ? factors.join(' • ') : 'Aucun facteur contextuel disponible.';
  }, [contextualFactors]);
  
  // Rendre le titre de la raison de recommandation
  const renderRecommendationReason = (recommendation) => {
    if (!recommendation.reason) return null;
    
    let backgroundColor;
    switch (recommendation.reason.type) {
      case 'contextual':
        backgroundColor = 'rgba(59, 130, 246, 0.7)'; // Bleu
        break;
      case 'behavioral':
        backgroundColor = 'rgba(217, 70, 239, 0.7)'; // Fuchsia
        break;
      case 'similar':
        backgroundColor = 'rgba(16, 185, 129, 0.7)'; // Vert
        break;
      default:
        backgroundColor = 'rgba(0, 0, 0, 0.7)';
    }
    
    return (
      <div 
        style={{
          ...styles.recommendationReason,
          backgroundColor
        }}
      >
        {recommendation.reason.label}
      </div>
    );
  };
  
  return (
    <div style={styles.container}>
      {/* Section lecteur vidéo */}
      <div style={styles.playerSection}>
        <VideoPlayer
          contentId={currentContent.id}
          title={currentContent.title}
          autoplay={false}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      </div>
      
      {/* Section informations sur le contenu */}
      <div style={styles.recommendationsSection}>
        <h1 style={styles.recommendationsTitle}>{currentContent.title}</h1>
        <div style={styles.recommendationMeta}>
          {currentContent.year} • {currentContent.genre}
        </div>
        <p style={{ marginTop: '12px', lineHeight: '1.5' }}>
          {currentContent.description}
        </p>
        
        {/* Section recommandations */}
        <h2 style={{ ...styles.recommendationsTitle, marginTop: '32px' }}>
          Recommandations pour vous
        </h2>
        <p style={styles.recommendationsSubtitle}>
          Sur la base de vos préférences et du contenu actuel
        </p>
        
        <div style={styles.recommendationsGrid}>
          {recommendations && recommendations.map((recommendation, index) => (
            <div
              key={`${recommendation.id}-${index}`}
              style={{
                ...styles.recommendationCard,
                ...(hoveredCard === recommendation.id ? styles.recommendationCardHover : {})
              }}
              onMouseEnter={() => setHoveredCard(recommendation.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleSelectRecommendation(recommendation)}
            >
              <img
                src={recommendation.image}
                alt={recommendation.title}
                style={styles.recommendationImage}
              />
              {renderRecommendationReason(recommendation)}
              <div style={styles.recommendationInfo}>
                <div style={styles.recommendationTitle}>
                  {recommendation.title}
                </div>
                <div style={styles.recommendationMeta}>
                  <span>{recommendation.year}</span>
                  <span>⭐ {recommendation.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Section facteurs contextuels et statistiques (optionnelle) */}
      {showStats && (
        <div style={styles.contextualSection}>
          <h2 style={styles.recommendationsTitle}>Facteurs contextuels</h2>
          <div style={{ marginTop: '16px' }}>
            {contextualFactors && Object.entries(contextualFactors).map(([key, value]) => (
              <span key={key} style={styles.factorsPill}>
                {key === 'timeOfDay' ? 'Heure' : key === 'device' ? 'Appareil' : 'Saison'}: {value}
              </span>
            ))}
          </div>
          
          <div style={styles.explanationBox}>
            Le système de recommandations de FloDrama prend en compte de multiples facteurs comme 
            le moment de la journée, votre appareil, et la saison actuelle. Ces facteurs sont combinés 
            avec votre historique de visionnage et vos préférences implicites pour générer des 
            recommandations personnalisées.
          </div>
          
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats ? stats.clickRate : '0'}%</div>
              <div style={styles.statLabel}>Taux de clics</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats ? stats.completionRate : '0'}%</div>
              <div style={styles.statLabel}>Taux de complétion</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats ? `${stats.avgWatchTime}min` : '0min'}</div>
              <div style={styles.statLabel}>Temps moyen</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{watchTime > 0 ? Math.floor(watchTime / 60) : 0}min</div>
              <div style={styles.statLabel}>Temps actuel</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerWithRecommendations;
