import React, { useState, useEffect, useRef } from 'react';
import './StreamingPlayer.css';

/**
 * Composant de lecteur vidéo utilisant le proxy de streaming
 * Ce composant récupère les informations de streaming via l'API proxy
 * et affiche la vidéo sans stocker le contenu localement
 */
const StreamingPlayer = ({
  contentId,
  title,
  metadata = {},
  poster,
  onError,
  onPlay,
  onEnd
}) => {
  // Référence vers l'élément vidéo
  const videoRef = useRef(null);
  
  // États du lecteur
  const [streamData, setStreamData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // URL de l'API proxy
  const proxyUrl = 'https://api-media.flodrama.com';
  
  // Récupération des informations de streaming
  useEffect(() => {
    const fetchStreamingInfo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Construire l'URL du proxy avec l'ID du contenu
        const url = `${proxyUrl}/stream/${contentId}`;
        
        // Effectuer la requête
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        // Traiter la réponse
        const data = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.message || 'Erreur lors du chargement de la vidéo');
        }
        
        // Si la réponse indique que l'URL a besoin d'être rafraîchie
        if (data.needsRefresh) {
          setNeedsRefresh(true);
          throw new Error('Les informations de streaming ont expiré et doivent être rafraîchies');
        }
        
        // Stocker les données de streaming
        setStreamData(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations de streaming:', error);
        setError(error.message);
        
        // Appeler la fonction de callback en cas d'erreur
        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Appeler la fonction de récupération
    fetchStreamingInfo();
    
    // Nettoyage lors du démontage du composant
    return () => {
      // Arrêter la lecture et libérer les ressources
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [contentId, onError, proxyUrl]);
  
  // Configurer la vidéo lorsque les données de streaming sont disponibles
  useEffect(() => {
    if (!streamData || !videoRef.current) {
    return;
  }
    
    const setupVideo = () => {
      try {
        const video = videoRef.current;
        
        // Configurer la politique de référence
        if (streamData.referrer_policy) {
          video.referrerPolicy = streamData.referrer_policy;
        }
        
        // Définir la source vidéo directement
        video.src = streamData.streaming_url;
        
        // Ajouter les sous-titres si disponibles
        if (streamData.subtitles && streamData.subtitles.length > 0) {
          // Supprimer les pistes existantes
          while (video.firstChild) {
            video.removeChild(video.firstChild);
          }
          
          // Ajouter les nouvelles pistes
          streamData.subtitles.forEach((subtitle, index) => {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = subtitle.language || 'Français';
            track.srclang = subtitle.language || 'fr';
            track.src = subtitle.url;
            track.default = index === 0; // Premier sous-titre par défaut
            video.appendChild(track);
          });
        }
      } catch (error) {
        console.error('Erreur lors de la configuration de la vidéo:', error);
        setError('Erreur lors de la configuration de la vidéo');
      }
    };
    
    setupVideo();
  }, [streamData]);
  
  // Gestionnaires d'événements vidéo
  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay();
    }
  };
  
  const handlePause = () => {
    setIsPlaying(false);
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnd) {
      onEnd();
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };
  
  const handleError = (e) => {
    console.error('Erreur de lecture vidéo:', e);
    setError('Erreur lors de la lecture de la vidéo. Veuillez réessayer.');
    if (onError) {
      onError(e);
    }
  };
  
  // Actions de contrôle du lecteur
  const togglePlay = () => {
    if (!videoRef.current) {
      return;
    }
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };
  
  const toggleMute = () => {
    if (!videoRef.current) {
      return;
    }
    
    videoRef.current.muted = !videoRef.current.muted;
  };
  
  const toggleFullscreen = () => {
    if (!videoRef.current) {
      return;
    }
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  
  const seekTo = (time) => {
    if (!videoRef.current) {
      return;
    }
    
    videoRef.current.currentTime = time;
  };
  
  const refreshStream = async () => {
    setNeedsRefresh(false);
    setIsLoading(true);
    
    try {
      // Appel au service de rafraîchissement
      const refreshUrl = `${proxyUrl}/refresh-stream/${contentId}`;
      const response = await fetch(refreshUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setStreamData(data);
        setError(null);
      } else {
        throw new Error(data.message || 'Erreur lors du rafraîchissement du stream');
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du stream:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) {
      return '00:00';
    }
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="streaming-player loading">
        <div className="loading-spinner"></div>
        <p>Chargement du contenu...</p>
      </div>
    );
  }
  
  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="streaming-player error">
        <div className="error-message">
          <p>{error}</p>
          {needsRefresh && (
            <button className="refresh-button" onClick={refreshStream}>
              Rafraîchir le stream
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Affichage du lecteur vidéo
  return (
    <div className={`streaming-player ${isPlaying ? 'playing' : ''}`}>
      <div className="video-container">
        <video
          ref={videoRef}
          poster={poster}
          controls
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onVolumeChange={handleVolumeChange}
          onError={handleError}
        >
          {/* Les pistes de sous-titres sont ajoutées dynamiquement */}
          <p>Votre navigateur ne prend pas en charge la lecture vidéo HTML5.</p>
        </video>
        
        {/* Contrôles personnalisés (facultatif) */}
        <div className="custom-controls">
          <div className="top-controls">
            <h3 className="video-title">{title}</h3>
            {metadata.episodeNumber && (
              <span className="episode-badge">
                Épisode {metadata.episodeNumber}
                {metadata.seasonNumber > 1 ? ` - Saison ${metadata.seasonNumber}` : ''}
              </span>
            )}
          </div>
          
          <div className="center-controls">
            <button className="play-button" onClick={togglePlay}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>
          
          <div className="bottom-controls">
            <div className="progress-container">
              <span className="time-display">{formatTime(currentTime)}</span>
              <input
                type="range"
                className="progress-bar"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
              />
              <span className="duration-display">{formatTime(duration)}</span>
            </div>
            
            <div className="right-controls">
              <button className="volume-button" onClick={toggleMute}>
                {isMuted ? '🔇' : '🔊'}
              </button>
              
              <button className="fullscreen-button" onClick={toggleFullscreen}>
                {isFullscreen ? '⤓' : '⤢'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Informations supplémentaires (facultatif) */}
      {streamData && streamData.quality && (
        <div className="stream-info">
          <span className="quality-badge">{streamData.quality}</span>
        </div>
      )}
    </div>
  );
};

export default StreamingPlayer;
