/**
 * Composant VideoPlayer pour FloDrama
 * Lecteur vidéo avancé avec gestion des sources multiples et design conforme à l'identité visuelle
 */

import React, { useState, useEffect, useRef } from 'react';
import videoStreamingService from '../services/videoStreamingService';

// Styles conformes à l'identité visuelle FloDrama
const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#121118',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  playerWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  player: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: 2
  },
  overlayVisible: {
    opacity: 1
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121118',
    zIndex: 3
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    borderTop: '4px solid #3b82f6',
    borderRight: '4px solid #9333ea',
    borderBottom: '4px solid #d946ef',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: 'white',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '14px'
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '16px',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
    zIndex: 3
  },
  button: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease'
  },
  buttonHover: {
    transform: 'scale(1.1)'
  },
  title: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    color: 'white',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '20px',
    fontWeight: 'bold',
    zIndex: 3,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #3b82f6, #d946ef)',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
    borderRadius: '8px'
  },
  errorButton: {
    background: 'white',
    color: '#3b82f6',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    marginTop: '16px',
    cursor: 'pointer',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: 'bold',
    transition: 'transform 0.2s ease, background-color 0.2s ease'
  },
  qualitySelector: {
    position: 'absolute',
    bottom: '60px',
    right: '16px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '8px',
    padding: '8px',
    zIndex: 4,
    display: 'none'
  },
  qualitySelectorVisible: {
    display: 'block'
  },
  qualityOption: {
    color: 'white',
    padding: '8px 16px',
    cursor: 'pointer',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '14px',
    transition: 'background-color 0.2s ease',
    borderRadius: '4px'
  },
  qualityOptionHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  qualityOptionActive: {
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    color: 'white'
  },
  sourceInfo: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  sourceIcon: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#10b981'
  }
};

// Ajout des animations CSS
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .video-player-progress {
    width: 100%;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.2);
    position: relative;
    cursor: pointer;
    margin: 0 16px;
  }
  
  .video-player-progress-bar {
    height: 100%;
    background: linear-gradient(to right, #3b82f6, #d946ef);
    position: absolute;
    top: 0;
    left: 0;
    transition: width 0.1s linear;
  }
  
  .video-player-progress:hover .video-player-progress-handle {
    transform: scale(1);
  }
  
  .video-player-progress-handle {
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    position: absolute;
    top: -6px;
    transform: scale(0);
    transition: transform 0.2s ease;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }
`;
document.head.appendChild(styleSheet);

/**
 * Composant VideoPlayer pour FloDrama
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant React
 */
const VideoPlayer = ({
  contentId,
  title,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
  onError,
  width = '100%',
  height = '100%',
  posterImage
}) => {
  // Références
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  
  // États
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [sourceInfo, setSourceInfo] = useState(null);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('720p');
  const [availableQualities, setAvailableQualities] = useState(['720p', '480p', '360p']);
  
  // Initialisation du lecteur
  useEffect(() => {
    if (!contentId || !containerRef.current) return;
    
    const initPlayer = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        
        // Récupérer les informations de source
        const result = await videoStreamingService.playContent(
          contentId,
          containerRef.current,
          {
            autoplay,
            width,
            height,
            quality: currentQuality
          }
        );
        
        // Mettre à jour la référence au lecteur et les informations de source
        playerRef.current = result.player;
        setSourceInfo(result.sourceInfo);
        
        // Si c'est un lecteur HTML5 (pas un iframe)
        if (playerRef.current.tagName === 'VIDEO') {
          videoRef.current = playerRef.current;
          
          // Configurer les événements du lecteur
          videoRef.current.addEventListener('loadedmetadata', () => {
            setDuration(videoRef.current.duration);
            setIsLoading(false);
          });
          
          videoRef.current.addEventListener('timeupdate', () => {
            setCurrentTime(videoRef.current.currentTime);
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
          });
          
          videoRef.current.addEventListener('play', () => {
            setIsPlaying(true);
            if (onPlay) onPlay();
          });
          
          videoRef.current.addEventListener('pause', () => {
            setIsPlaying(false);
            if (onPause) onPause();
          });
          
          videoRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
            if (onEnded) onEnded();
          });
          
          videoRef.current.addEventListener('error', (e) => {
            handleError(e);
          });
          
          // Si autoplay est activé
          if (autoplay) {
            videoRef.current.play().catch((e) => {
              console.warn('Autoplay prevented:', e);
              setIsPlaying(false);
            });
          }
        } else {
          // Pour les iframes (YouTube, Vimeo)
          setIsLoading(false);
        }
        
      } catch (error) {
        handleError(error);
      }
    };
    
    initPlayer();
    
    return () => {
      // Nettoyage
      if (contentId) {
        videoStreamingService.stopPlayback(contentId);
      }
    };
  }, [contentId, autoplay, currentQuality]);
  
  // Fonction pour gérer les erreurs
  const handleError = (error) => {
    console.error('Erreur de lecture vidéo:', error);
    setIsError(true);
    setIsLoading(false);
    setErrorMessage('Une erreur est survenue lors de la lecture de cette vidéo.');
    if (onError) onError(error);
  };
  
  // Fonction pour basculer la lecture/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(handleError);
    }
  };
  
  // Fonction pour changer la position de lecture
  const handleProgressChange = (e) => {
    if (!videoRef.current) return;
    
    const progressBar = e.currentTarget;
    const position = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    const newTime = position * duration;
    
    videoRef.current.currentTime = newTime;
  };
  
  // Fonction pour afficher/masquer les contrôles
  const handleMouseMovement = () => {
    setShowControls(true);
    clearTimeout(window.controlsTimeout);
    
    window.controlsTimeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };
  
  // Fonction pour changer la qualité
  const changeQuality = (quality) => {
    setCurrentQuality(quality);
    setShowQualitySelector(false);
    
    // Mémoriser la position actuelle
    const currentPosition = videoRef.current ? videoRef.current.currentTime : 0;
    
    // Recharger la vidéo avec la nouvelle qualité
    videoStreamingService.stopPlayback(contentId);
    
    // Un court délai pour s'assurer que le nettoyage est terminé
    setTimeout(() => {
      videoStreamingService.playContent(
        contentId,
        containerRef.current,
        {
          autoplay: true,
          width,
          height,
          quality,
          startTime: currentPosition
        }
      ).then(result => {
        playerRef.current = result.player;
        setSourceInfo(result.sourceInfo);
        
        if (playerRef.current.tagName === 'VIDEO') {
          videoRef.current = playerRef.current;
          videoRef.current.currentTime = currentPosition;
        }
      }).catch(handleError);
    }, 100);
  };
  
  // Fonction pour formater le temps
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Rendu du composant
  return (
    <div
      ref={containerRef}
      style={{ ...styles.container, width, height }}
      onMouseMove={handleMouseMovement}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isLoading && (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loadingText}>Chargement...</div>
        </div>
      )}
      
      {isError && (
        <div style={styles.errorContainer}>
          <h3>Erreur de lecture</h3>
          <p>{errorMessage || 'Impossible de lire cette vidéo.'}</p>
          <button
            style={styles.errorButton}
            onClick={() => {
              setIsLoading(true);
              setIsError(false);
              videoStreamingService.stopPlayback(contentId);
              setTimeout(() => {
                videoStreamingService.playContent(
                  contentId,
                  containerRef.current,
                  {
                    autoplay: true,
                    width,
                    height,
                    quality: currentQuality,
                    forceRefresh: true
                  }
                ).catch(handleError);
              }, 500);
            }}
          >
            Réessayer
          </button>
        </div>
      )}
      
      {!isLoading && !isError && title && (
        <div style={styles.title}>{title}</div>
      )}
      
      {sourceInfo && (
        <div style={styles.sourceInfo}>
          <div style={styles.sourceIcon}></div>
          {sourceInfo.primarySource}
        </div>
      )}
      
      <div
        style={{
          ...styles.overlay,
          ...(showControls ? styles.overlayVisible : {})
        }}
      >
        <div style={styles.controls}>
          <button
            style={styles.button}
            onClick={togglePlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="video-player-progress" onClick={handleProgressChange}>
            <div
              className="video-player-progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
            <div
              className="video-player-progress-handle"
              style={{ left: `${progress}%` }}
            ></div>
          </div>
          
          <div style={{ color: 'white', fontSize: '14px', marginLeft: '8px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <button
            style={styles.button}
            onClick={() => setShowQualitySelector(!showQualitySelector)}
          >
            ⚙️
          </button>
        </div>
      </div>
      
      <div
        style={{
          ...styles.qualitySelector,
          ...(showQualitySelector ? styles.qualitySelectorVisible : {})
        }}
      >
        {availableQualities.map((quality) => (
          <div
            key={quality}
            style={{
              ...styles.qualityOption,
              ...(quality === currentQuality ? styles.qualityOptionActive : {})
            }}
            onClick={() => changeQuality(quality)}
          >
            {quality}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPlayer;
