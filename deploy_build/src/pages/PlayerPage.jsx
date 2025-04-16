import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/PlayerPage.css';

/**
 * Page du lecteur vidéo
 * Permet de regarder les films, séries et animes
 */
const PlayerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const controlsTimeoutRef = useRef(null);

  // Extraire l'ID et le titre du contenu depuis les paramètres d'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const contentId = searchParams.get('id');
    const contentTitle = searchParams.get('title');
    
    if (!contentId) {
      setError('Aucun identifiant de contenu spécifié');
      setIsLoading(false);
      return;
    }
    
    // Simuler le chargement des données depuis l'API
    const fetchContentDetails = async () => {
      try {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Données mockées pour l'exemple
        const mockContent = {
          id: contentId,
          title: contentTitle || 'Vidéo sans titre',
          streamingUrl: 'https://example.com/stream/12345',
          // Dans une vraie application, l'URL serait récupérée depuis l'API
          // Pour l'exemple, on utilise une vidéo de démonstration
          videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          subtitles: [
            { language: 'Français', src: '/subtitles/fr.vtt' },
            { language: 'English', src: '/subtitles/en.vtt' }
          ],
          qualities: [
            { label: '1080p', value: '1080p' },
            { label: '720p', value: '720p' },
            { label: '480p', value: '480p' },
            { label: 'Auto', value: 'auto' }
          ]
        };
        
        setContent(mockContent);
      } catch (err) {
        console.error('Erreur lors du chargement des détails du contenu:', err);
        setError('Impossible de charger les détails du contenu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContentDetails();
    
    // Nettoyer le timeout lors du démontage du composant
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [location.search]);

  // Gérer les événements du lecteur vidéo
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleDurationChange = () => {
      setDuration(videoElement.duration);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
    };
    
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === videoElement ||
        document.webkitFullscreenElement === videoElement ||
        document.mozFullScreenElement === videoElement ||
        document.msFullscreenElement === videoElement
      );
    };
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [videoRef.current]);

  // Afficher/masquer les contrôles lors du mouvement de la souris
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Fonctions de contrôle du lecteur
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleFullscreen = () => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    if (!isFullscreen) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.mozRequestFullScreen) {
        videoElement.mozRequestFullScreen();
      } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleQualityChange = (e) => {
    setQuality(e.target.value);
    // Dans une vraie application, ici on changerait la source de la vidéo
    // en fonction de la qualité sélectionnée
  };

  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '00:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="player-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la vidéo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <Link to="/" className="back-home-link">Retour à l'accueil</Link>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="player-error">
        <h2>Contenu non trouvé</h2>
        <p>La vidéo demandée n'existe pas ou a été supprimée.</p>
        <Link to="/" className="back-home-link">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div 
      className={`player-page ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-player"
          src={content.videoSrc}
          onClick={togglePlay}
          onLoadedData={() => setIsLoading(false)}
          autoPlay
        >
          {content.subtitles && content.subtitles.map((subtitle, index) => (
            <track 
              key={index}
              kind="subtitles"
              src={subtitle.src}
              srcLang={subtitle.language.toLowerCase()}
              label={subtitle.language}
            />
          ))}
          Votre navigateur ne prend pas en charge la lecture de vidéos.
        </video>
        
        {/* Overlay des contrôles */}
        <div className={`video-controls ${showControls ? 'visible' : ''}`}>
          <div className="top-controls">
            <button className="back-button" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="video-title">{content.title}</h1>
          </div>
          
          <div className="center-controls">
            <button className="play-pause-button" onClick={togglePlay}>
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
          </div>
          
          <div className="bottom-controls">
            <div className="progress-container">
              <input
                type="range"
                className="progress-bar"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
              />
              <div 
                className="progress-fill" 
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            
            <div className="controls-row">
              <div className="left-controls">
                <button className="control-button" onClick={togglePlay}>
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                
                <div className="volume-control">
                  <button className="control-button">
                    <i className={`fas ${
                      volume === 0 ? 'fa-volume-mute' : 
                      volume < 0.5 ? 'fa-volume-down' : 
                      'fa-volume-up'
                    }`}></i>
                  </button>
                  <input
                    type="range"
                    className="volume-slider"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                  />
                </div>
                
                <div className="time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span> / </span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="right-controls">
                <div className="quality-selector">
                  <select 
                    value={quality} 
                    onChange={handleQualityChange}
                    className="quality-select"
                  >
                    {content.qualities.map((q, index) => (
                      <option key={index} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button className="control-button" onClick={toggleFullscreen}>
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
