import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { monitorVideoPerformance } from '../../utils/monitoring';
import './VideoPlayer.css';

/**
 * Composant de lecteur vidéo
 * @param {Object} props - Propriétés du composant
 * @param {string} props.src - URL de la vidéo
 * @param {string} props.poster - URL de l'image d'aperçu
 * @param {string} props.title - Titre de la vidéo
 * @param {boolean} props.autoPlay - Lecture automatique
 * @param {boolean} props.controls - Afficher les contrôles
 * @param {Function} props.onError - Callback d'erreur
 * @param {Function} props.onPlay - Callback de lecture
 * @param {Function} props.onPause - Callback de pause
 * @param {Function} props.onEnded - Callback de fin
 * @param {Function} props.onTimeUpdate - Callback de mise à jour du temps
 * @param {Function} props.onDurationChange - Callback de changement de durée
 * @returns {JSX.Element} - Composant React
 */
const VideoPlayer = forwardRef(({ 
  src, 
  poster, 
  title, 
  autoPlay = false, 
  controls = true, 
  onError, 
  onPlay, 
  onPause, 
  onEnded,
  onTimeUpdate,
  onDurationChange
}, ref) => {
  const videoRef = useRef(null);
  const metricsRef = useRef(null);
  
  // Exposer les méthodes via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => console.error('Erreur lors de la lecture:', err));
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    },
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => videoRef.current ? videoRef.current.currentTime : 0,
    getDuration: () => videoRef.current ? videoRef.current.duration : 0,
    getVideoElement: () => videoRef.current
  }));
  
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
  
  // Gérer les événements de temps
  const handleTimeUpdate = () => {
    if (onTimeUpdate && videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };
  
  // Gérer les événements de durée
  const handleDurationChange = () => {
    if (onDurationChange && videoRef.current) {
      onDurationChange(videoRef.current.duration);
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
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          playsInline
        >
          <source src={src} type="video/mp4" />
          Votre navigateur ne prend pas en charge la lecture vidéo.
        </video>
      </div>
    </div>
  );
});

export default VideoPlayer;
