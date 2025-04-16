import React, { useEffect, useRef } from 'react';
import { monitorVideoPerformance } from '../../utils/monitoring';
import './VideoPlayer.css';

const VideoPlayer = ({ 
  src, 
  poster, 
  title, 
  autoPlay = false, 
  controls = true, 
  onError, 
  onPlay, 
  onPause, 
  onEnded 
}) => {
  const videoRef = useRef(null);
  const metricsRef = useRef(null);
  
  // Fonction pour basculer vers la source de secours en cas d'erreur
  const handleError = (e) => {
    console.error('Erreur de lecture vidéo:', e);
    
    // Appeler le callback d'erreur si fourni
    if (onError && typeof onError === 'function') {
      onError(e);
    }
    
    // Vérifier si le fallback est activé
    if (process.env.VITE_VIDEO_FALLBACK_ENABLED === 'true' && src.includes('cloudfront')) {
      // Construire l'URL de fallback
      const videoId = src.split('/').pop().split('?')[0];
      const fallbackSrc = `/api/video/fallback/${videoId}`;
      
      console.log('Basculement vers la source de secours:', fallbackSrc);
      
      // Mettre à jour la source vidéo
      if (videoRef.current) {
        videoRef.current.src = fallbackSrc;
        videoRef.current.load();
        videoRef.current.play().catch(err => console.error('Erreur lors de la lecture du fallback:', err));
      }
    }
  };
  
  // Initialiser le monitoring des performances
  useEffect(() => {
    if (videoRef.current) {
      metricsRef.current = monitorVideoPerformance(videoRef.current);
    }
    
    return () => {
      // Nettoyage si nécessaire
      metricsRef.current = null;
    };
  }, []);
  
  // Mettre à jour la source vidéo lorsqu'elle change
  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.load();
      
      if (autoPlay) {
        videoRef.current.play().catch(err => console.error('Erreur lors de la lecture automatique:', err));
      }
    }
  }, [src, autoPlay]);
  
  return (
    <div className="video-player-container">
      {title && <h3 className="video-title">{title}</h3>}
      
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-player"
          poster={poster}
          controls={controls}
          onError={handleError}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          playsInline
        >
          <source src={src} type="video/mp4" />
          Votre navigateur ne prend pas en charge la lecture vidéo.
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;
