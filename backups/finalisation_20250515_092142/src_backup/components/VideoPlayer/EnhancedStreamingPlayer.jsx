import React, { useState, useEffect, useRef, useCallback } from 'react';
import './StreamingPlayer.css';

/**
 * Lecteur vidéo amélioré pour FloDrama
 * Prend en charge la nouvelle architecture de streaming avec proxy Cloudflare
 * Supporte les animes, dramas et films Bollywood
 */
const EnhancedStreamingPlayer = ({
  contentType, // 'anime', 'drama', 'bollywood'
  contentId,
  episodeNumber,
  title,
  metadata = {},
  poster,
  onError,
  onPlay,
  onEnd,
  apiBaseUrl = 'https://api.flodrama.com/api'
}) => {
  // Référence vers l'élément vidéo
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  
  // États du lecteur
  const [streamData, setStreamData] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [availableSubtitles, setAvailableSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Timer pour masquer les contrôles
  const controlsTimerRef = useRef(null);

  // Récupération des informations de streaming
  useEffect(() => {
    const fetchStreamingInfo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let url;
        
        // Construire l'URL en fonction du type de contenu
        switch (contentType) {
          case 'anime':
            url = `${apiBaseUrl}/anime/${contentId}/streaming/${episodeNumber}`;
            break;
          case 'drama':
            url = `${apiBaseUrl}/drama/${contentId}/streaming/${episodeNumber}`;
            break;
          case 'bollywood':
            url = `${apiBaseUrl}/bollywood/${contentId}/streaming`;
            break;
          default:
            throw new Error('Type de contenu non pris en charge');
        }
        
        // Effectuer la requête
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        // Traiter la réponse
        const data = await response.json();
        
        if (!data.sources || data.sources.length === 0) {
          throw new Error('Aucune source de streaming disponible');
        }
        
        // Stocker les données de streaming
        setStreamData(data);
        
        // Sélectionner la meilleure qualité par défaut
        const qualities = data.sources.map(source => source.quality);
        const bestQuality = getBestQuality(qualities);
        setSelectedQuality(bestQuality);
        
        // Sélectionner la source correspondante
        const bestSource = data.sources.find(source => source.quality === bestQuality);
        setSelectedSource(bestSource);
        
        // Récupérer les sous-titres disponibles
        if (data.subtitles && data.subtitles.length > 0) {
          setAvailableSubtitles(data.subtitles);
          setSelectedSubtitle(data.subtitles[0]); // Sélectionner le premier sous-titre par défaut
        }
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
      
      // Nettoyer le timer des contrôles
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [contentType, contentId, episodeNumber, apiBaseUrl, onError]);
  
  // Sélectionner la meilleure qualité disponible
  const getBestQuality = (qualities) => {
    const qualityOrder = ['1080p', '720p', '480p', '360p'];
    
    for (const quality of qualityOrder) {
      if (qualities.includes(quality)) {
        return quality;
      }
    }
    
    return qualities[0]; // Retourner la première qualité si aucune correspondance
  };

  // Mise à jour de la source vidéo lorsque la qualité ou la source change
  useEffect(() => {
    if (!selectedSource || !videoRef.current) {
      return;
    }
    
    const currentTime = videoRef.current.currentTime;
    const wasPlaying = !videoRef.current.paused;
    
    // Mettre à jour la source
    videoRef.current.src = selectedSource.url;
    videoRef.current.load();
    
    // Restaurer la position et l'état de lecture
    videoRef.current.currentTime = currentTime;
    
    if (wasPlaying) {
      videoRef.current.play().catch(error => {
        console.error('Erreur lors de la reprise de la lecture:', error);
      });
    }
  }, [selectedSource]);

  // Gestionnaires d'événements vidéo
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setBuffering(false);
    
    if (onPlay) {
      onPlay();
    }
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    
    if (onEnd) {
      onEnd();
    }
  }, [onEnd]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setWatchTime(Math.max(watchTime, videoRef.current.currentTime));
    }
  }, [watchTime]);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleError = useCallback((e) => {
    console.error('Erreur de lecture vidéo:', e);
    setError('Erreur lors de la lecture de la vidéo. Veuillez réessayer.');
    setBuffering(false);
    
    if (onError) {
      onError(e);
    }
  }, [onError]);

  const handleWaiting = useCallback(() => {
    setBuffering(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setBuffering(false);
  }, []);

  // Actions de contrôle du lecteur
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play().catch(error => {
        console.error('Erreur lors de la lecture:', error);
        setError('Impossible de lancer la lecture. Veuillez réessayer.');
      });
    } else {
      videoRef.current.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error('Erreur lors du passage en plein écran:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const seekTo = useCallback((time) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = time;
  }, []);

  const changeQuality = useCallback((quality) => {
    if (!streamData) return;
    
    const source = streamData.sources.find(source => source.quality === quality);
    
    if (source) {
      setSelectedQuality(quality);
      setSelectedSource(source);
    }
  }, [streamData]);

  const changeSubtitle = useCallback((subtitle) => {
    setSelectedSubtitle(subtitle);
  }, []);

  // Gestion des contrôles
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    // Réinitialiser le timer
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    // Masquer les contrôles après 3 secondes
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Formater le temps (secondes -> MM:SS)
  const formatTime = useCallback((timeInSeconds) => {
    if (!timeInSeconds) {
      return '00:00';
    }
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="enhanced-streaming-player loading">
        <div className="loading-spinner"></div>
        <p>Chargement du contenu...</p>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="enhanced-streaming-player error">
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Affichage du lecteur vidéo
  return (
    <div 
      ref={playerContainerRef}
      className={`enhanced-streaming-player ${isPlaying ? 'playing' : ''} ${showControls ? 'show-controls' : ''}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div className="video-container">
        <video
          ref={videoRef}
          poster={poster}
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onVolumeChange={handleVolumeChange}
          onError={handleError}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onClick={togglePlay}
        >
          {/* Les pistes de sous-titres sont ajoutées dynamiquement */}
          {selectedSubtitle && (
            <track 
              kind="subtitles" 
              src={selectedSubtitle.url} 
              srcLang={selectedSubtitle.language} 
              label={selectedSubtitle.label || selectedSubtitle.language} 
              default 
            />
          )}
          <p>Votre navigateur ne prend pas en charge la lecture vidéo HTML5.</p>
        </video>
        
        {/* Indicateur de mise en mémoire tampon */}
        {buffering && (
          <div className="buffering-indicator">
            <div className="buffering-spinner"></div>
            <p>Chargement...</p>
          </div>
        )}
        
        {/* Contrôles personnalisés */}
        <div className={`custom-controls ${showControls ? 'visible' : ''}`}>
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
              {isPlaying ? 
                <svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg> : 
                <svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
          </div>
          
          <div className="bottom-controls">
            <div className="progress-container">
              <span className="time-display">{formatTime(currentTime)}</span>
              <div className="progress-bar-container">
                <div className="progress-bar-background"></div>
                <div 
                  className="progress-bar-watched" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
                <input
                  type="range"
                  className="progress-bar-input"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                />
              </div>
              <span className="duration-display">{formatTime(duration)}</span>
            </div>
            
            <div className="right-controls">
              <div className="volume-control">
                <button className="volume-button" onClick={toggleMute}>
                  {isMuted ? 
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg> : 
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  }
                </button>
                <input
                  type="range"
                  className="volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVolume = Number(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume;
                      videoRef.current.muted = newVolume === 0;
                    }
                  }}
                />
              </div>
              
              <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
                <svg width="24" height="24" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
              </button>
              
              <button className="fullscreen-button" onClick={toggleFullscreen}>
                {isFullscreen ? 
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg> : 
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                }
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu des paramètres */}
        {showSettings && (
          <div className="settings-menu">
            <div className="settings-section">
              <h4>Qualité</h4>
              <ul className="quality-options">
                {streamData && streamData.sources.map(source => (
                  <li 
                    key={source.quality} 
                    className={selectedQuality === source.quality ? 'selected' : ''}
                    onClick={() => changeQuality(source.quality)}
                  >
                    {source.quality}
                    {selectedQuality === source.quality && (
                      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            {availableSubtitles.length > 0 && (
              <div className="settings-section">
                <h4>Sous-titres</h4>
                <ul className="subtitle-options">
                  <li 
                    className={!selectedSubtitle ? 'selected' : ''}
                    onClick={() => changeSubtitle(null)}
                  >
                    Désactivés
                    {!selectedSubtitle && (
                      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    )}
                  </li>
                  {availableSubtitles.map(subtitle => (
                    <li 
                      key={subtitle.language} 
                      className={selectedSubtitle === subtitle ? 'selected' : ''}
                      onClick={() => changeSubtitle(subtitle)}
                    >
                      {subtitle.label || subtitle.language}
                      {selectedSubtitle === subtitle && (
                        <svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Informations supplémentaires */}
      {streamData && selectedQuality && (
        <div className="stream-info">
          <span className="quality-badge">{selectedQuality}</span>
          {contentType && (
            <span className="content-type-badge">
              {contentType === 'anime' ? 'Anime' : contentType === 'drama' ? 'Drama' : 'Bollywood'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedStreamingPlayer;
