/**
 * Page de démonstration du lecteur vidéo avec recommandations pour FloDrama
 * Intègre le lecteur vidéo avancé et le système de recommandations
 */

import React, { useState, useEffect } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { useSimilarRecommendations, useContextualRecommendations } from '../hooks/useRecommendations';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { localContent } from '../api/local-content-data';

// Styles conformes à l'identité visuelle FloDrama
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: '#121118',
    color: 'white',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block'
  },
  playerSection: {
    width: '100%',
    aspectRatio: '16/9',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '32px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
  },
  contentInfo: {
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: '#1A1926',
    borderRadius: '8px'
  },
  contentTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px'
  },
  contentMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px'
  },
  contentDescription: {
    lineHeight: '1.6',
    fontSize: '16px'
  },
  recommendationsSection: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '20px',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block'
  },
  recommendationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px'
  },
  recommendationCard: {
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    backgroundColor: '#121118',
    border: '1px solid rgba(255, 255, 255, 0.1)'
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
  statsSummary: {
    display: 'flex',
    gap: '16px',
    marginTop: '32px'
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1926',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  statLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  contextualFactorsSection: {
    marginTop: '32px',
    padding: '20px',
    backgroundColor: '#1A1926',
    borderRadius: '8px'
  },
  factorsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  factorPill: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    borderRadius: '20px',
    margin: '0 8px 8px 0',
    fontSize: '14px'
  }
};

/**
 * Simulation des facteurs contextuels pour la démo
 * @returns {Object} Facteurs contextuels
 */
const getContextualFactors = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Déterminer le moment de la journée
  let timeOfDay;
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'Matin';
  } else if (hour >= 12 && hour < 14) {
    timeOfDay = 'Midi';
  } else if (hour >= 14 && hour < 18) {
    timeOfDay = 'Après-midi';
  } else if (hour >= 18 && hour < 22) {
    timeOfDay = 'Soirée';
  } else {
    timeOfDay = 'Nuit';
  }
  
  // Déterminer la saison
  const month = now.getMonth();
  let season;
  if (month >= 2 && month < 5) {
    season = 'Printemps';
  } else if (month >= 5 && month < 8) {
    season = 'Été';
  } else if (month >= 8 && month < 11) {
    season = 'Automne';
  } else {
    season = 'Hiver';
  }
  
  // Détecter l'appareil (simplifié pour la démo)
  const device = window.innerWidth <= 768 ? 'Mobile' : 
                window.innerWidth <= 1024 ? 'Tablette' : 'Desktop';
  
  return {
    timeOfDay,
    season,
    device
  };
};

/**
 * Simulation des statistiques de visionnage pour la démo
 * @returns {Object} Statistiques
 */
const getViewingStats = () => {
  return {
    clickRate: Math.floor(Math.random() * 20) + 65, // 65-85%
    completionRate: Math.floor(Math.random() * 25) + 60, // 60-85%
    avgWatchTime: Math.floor(Math.random() * 15) + 25, // 25-40 minutes
    satisfaction: (Math.random() * 1 + 4).toFixed(1) // 4.0-5.0
  };
};

/**
 * Page de démonstration du lecteur vidéo avec recommandations
 */
const VideoPlayerDemo = () => {
  // États
  const [selectedContent, setSelectedContent] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [contextualFactors, setContextualFactors] = useState(null);
  const [viewingStats, setViewingStats] = useState(null);
  const [watchTime, setWatchTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Récupérer les recommandations similaires et contextuelles
  const { 
    recommendations: similarRecommendations, 
    loading: similarLoading 
  } = useSimilarRecommendations(selectedContent?.id || 'default', { limit: 4 });
  
  const { 
    recommendations: contextualRecommendations, 
    loading: contextualLoading 
  } = useContextualRecommendations('user123', { limit: 4 });
  
  // Simuler les facteurs contextuels et les statistiques au chargement initial
  useEffect(() => {
    setContextualFactors(getContextualFactors());
    setViewingStats(getViewingStats());
    
    // Sélectionner un contenu initial depuis les données locales
    const featured = localContent.featured || [];
    if (featured.length > 0) {
      setSelectedContent(featured[0]);
    }
  }, []);
  
  // Simuler le comptage du temps de visionnage
  useEffect(() => {
    let interval;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);
  
  // Gestionnaires d'événements
  const handlePlayPause = (isPlaying) => {
    setIsPlaying(isPlaying);
  };
  
  const handleSelectContent = (content) => {
    setSelectedContent(content);
    setWatchTime(0);
    setIsPlaying(false);
    
    // Générer de nouvelles statistiques pour ce contenu
    setViewingStats(getViewingStats());
  };
  
  // Formater la durée en minutes et secondes
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Rendu des recommandations
  const renderRecommendations = (recommendations, title) => {
    return (
      <div style={styles.recommendationsSection}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        
        <div style={styles.recommendationsGrid}>
          {recommendations.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              style={{
                ...styles.recommendationCard,
                ...(hoveredCard === item.id ? styles.recommendationCardHover : {})
              }}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleSelectContent(item)}
            >
              <img
                src={item.poster || getOptimizedImageUrl(item.id)}
                alt={item.title}
                style={styles.recommendationImage}
                onError={(e) => {
                  e.target.src = `https://source.unsplash.com/300x450/?movie,${item.title.replace(/ /g, ',')}`;
                }}
              />
              <div style={styles.recommendationInfo}>
                <div style={styles.recommendationTitle}>
                  {item.title}
                </div>
                <div style={styles.recommendationMeta}>
                  <span>{item.year}</span>
                  <span>⭐ {item.rating || '4.5'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Si aucun contenu n'est sélectionné, afficher un message de chargement
  if (!selectedContent) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>FloDrama - Chargement...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>FloDrama - Lecteur Intelligent</h1>
      </div>
      
      <div style={styles.playerSection}>
        <VideoPlayer
          contentId={selectedContent.id}
          title={selectedContent.title}
          autoplay={false}
          onPlay={() => handlePlayPause(true)}
          onPause={() => handlePlayPause(false)}
          posterImage={selectedContent.poster || getOptimizedImageUrl(selectedContent.id)}
        />
      </div>
      
      <div style={styles.contentInfo}>
        <h2 style={styles.contentTitle}>{selectedContent.title}</h2>
        <div style={styles.contentMeta}>
          <span>{selectedContent.year}</span>
          <span>{selectedContent.genre}</span>
          <span>⭐ {selectedContent.rating || '4.5'}</span>
          <span>Temps de visionnage: {formatDuration(watchTime)}</span>
        </div>
        <p style={styles.contentDescription}>
          {selectedContent.description || 'Aucune description disponible pour ce contenu.'}
        </p>
      </div>
      
      {/* Facteurs contextuels */}
      <div style={styles.contextualFactorsSection}>
        <h3 style={styles.factorsTitle}>Facteurs contextuels</h3>
        {contextualFactors && Object.entries(contextualFactors).map(([key, value]) => (
          <span key={key} style={styles.factorPill}>
            {key === 'timeOfDay' ? 'Moment' : key === 'device' ? 'Appareil' : 'Saison'}: {value}
          </span>
        ))}
        
        <p style={{ marginTop: '16px', fontSize: '14px', lineHeight: '1.6' }}>
          Notre système de recommandations prend en compte le moment de la journée, 
          la saison et l'appareil que vous utilisez pour vous proposer du contenu adapté 
          à votre contexte actuel de visionnage.
        </p>
      </div>
      
      {/* Recommandations similaires */}
      {!similarLoading && similarRecommendations?.length > 0 && 
        renderRecommendations(similarRecommendations, 'Recommandations similaires')}
      
      {/* Recommandations contextuelles */}
      {!contextualLoading && contextualRecommendations?.length > 0 && 
        renderRecommendations(contextualRecommendations, 'Recommandations contextuelles')}
      
      {/* Statistiques de visionnage */}
      <h2 style={styles.sectionTitle}>Statistiques de visionnage</h2>
      <div style={styles.statsSummary}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{viewingStats?.clickRate}%</div>
          <div style={styles.statLabel}>Taux de clics</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{viewingStats?.completionRate}%</div>
          <div style={styles.statLabel}>Taux de complétion</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{viewingStats?.avgWatchTime}min</div>
          <div style={styles.statLabel}>Temps moyen</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{viewingStats?.satisfaction}</div>
          <div style={styles.statLabel}>Satisfaction</div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerDemo;
