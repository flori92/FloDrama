import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ContentDataService from '../services/ContentDataService';
import SmartScrapingService from '../services/SmartScrapingService';
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
  const [availableQualities, setAvailableQualities] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const controlsTimeoutRef = useRef(null);

  // Extraire l'ID et le titre du contenu depuis les paramètres d'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const contentId = searchParams.get('id');
    const episodeId = searchParams.get('episode');
    
    if (!contentId) {
      setError('Aucun identifiant de contenu spécifié');
      setIsLoading(false);
      return;
    }
    
    // Charger les détails du contenu
    const fetchContentDetails = async () => {
      try {
        setIsLoading(true);
        
        let contentDetails = null;
        let episodesList = [];
        let streamingUrl = null;
        let subtitles = [];
        let qualities = [];
        
        // Essayer de récupérer les données depuis ContentDataService
        if (ContentDataService) {
          try {
            contentDetails = await ContentDataService.getContentDetails(contentId);
            
            // Récupérer les épisodes si c'est une série ou un anime
            if (contentDetails && (contentDetails.type === 'drama' || contentDetails.type === 'anime')) {
              episodesList = await ContentDataService.getContentEpisodes(contentId);
            }
          } catch (contentError) {
            console.warn('Erreur lors de la récupération des données depuis ContentDataService:', contentError);
          }
        }
        
        // Fallback vers SmartScrapingService si nécessaire
        if (!contentDetails && SmartScrapingService) {
          try {
            contentDetails = await SmartScrapingService.getContentDetails(contentId);
            
            // Récupérer les épisodes si c'est une série ou un anime
            if (contentDetails && (contentDetails.type === 'drama' || contentDetails.type === 'anime')) {
              episodesList = await SmartScrapingService.getContentEpisodes(contentId);
            }
          } catch (scrapingError) {
            console.error('Erreur lors de la récupération des données depuis SmartScrapingService:', scrapingError);
            throw scrapingError;
          }
        }
        
        if (!contentDetails) {
          throw new Error('Impossible de récupérer les détails du contenu');
        }
        
        // Déterminer l'épisode à lire
        let episodeToPlay = null;
        
        if (episodesList && episodesList.length > 0) {
          if (episodeId) {
            // Rechercher l'épisode spécifié
            episodeToPlay = episodesList.find(ep => ep.id === episodeId);
          }
          
          // Si aucun épisode spécifié ou non trouvé, prendre le premier
          if (!episodeToPlay) {
            episodeToPlay = episodesList[0];
          }
          
          setEpisodes(episodesList);
          setSelectedEpisode(episodeToPlay);
        }
        
        // Récupérer l'URL de streaming
        if (episodeToPlay) {
          // Pour un épisode de série/anime
          try {
            if (SmartScrapingService && SmartScrapingService.getStreamingUrl) {
              streamingUrl = await SmartScrapingService.getStreamingUrl(contentId, episodeToPlay.id);
              
              // Récupérer les sous-titres
              if (SmartScrapingService.getSubtitles) {
                subtitles = await SmartScrapingService.getSubtitles(contentId, episodeToPlay.id);
              }
              
              // Récupérer les qualités disponibles
              if (SmartScrapingService.getAvailableQualities) {
                qualities = await SmartScrapingService.getAvailableQualities(contentId, episodeToPlay.id);
              }
            }
          } catch (streamError) {
            console.error('Erreur lors de la récupération de l\'URL de streaming pour l\'épisode:', streamError);
          }
        } else {
          // Pour un film
          try {
            if (SmartScrapingService && SmartScrapingService.getStreamingUrl) {
              streamingUrl = await SmartScrapingService.getStreamingUrl(contentId);
              
              // Récupérer les sous-titres
              if (SmartScrapingService.getSubtitles) {
                subtitles = await SmartScrapingService.getSubtitles(contentId);
              }
              
              // Récupérer les qualités disponibles
              if (SmartScrapingService.getAvailableQualities) {
                qualities = await SmartScrapingService.getAvailableQualities(contentId);
              }
            }
          } catch (streamError) {
            console.error('Erreur lors de la récupération de l\'URL de streaming pour le film:', streamError);
          }
        }
        
        // Si aucune URL de streaming n'a été trouvée, utiliser une URL de démonstration
        if (!streamingUrl) {
          console.warn('Aucune URL de streaming trouvée, utilisation d\'une URL de démonstration');
          streamingUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        }
        
        // Si aucune qualité n'a été trouvée, utiliser des valeurs par défaut
        if (!qualities || qualities.length === 0) {
          qualities = [
            { label: '1080p', value: '1080p' },
            { label: '720p', value: '720p' },
            { label: '480p', value: '480p' },
            { label: 'Auto', value: 'auto' }
          ];
        }
        
        // Préparer les données du contenu
        const contentData = {
          ...contentDetails,
          videoSrc: streamingUrl,
          subtitles: subtitles || [],
          qualities: qualities
        };
        
        setContent(contentData);
        setAvailableQualities(qualities);
        
        // Enregistrer la progression de visionnage
        if (ContentDataService && ContentDataService.updateWatchHistory) {
          try {
            ContentDataService.updateWatchHistory(contentId, episodeToPlay ? episodeToPlay.id : null);
          } catch (historyError) {
            console.warn('Erreur lors de la mise à jour de l\'historique de visionnage:', historyError);
          }
        }
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
      
      // Passer automatiquement à l'épisode suivant si disponible
      if (selectedEpisode && episodes.length > 1) {
        const currentIndex = episodes.findIndex(ep => ep.id === selectedEpisode.id);
        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
          const nextEpisode = episodes[currentIndex + 1];
          navigate(`/player?id=${content.id}&episode=${nextEpisode.id}`);
        }
      }
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
    
    // Sauvegarder la progression toutes les 30 secondes
    const saveProgressInterval = setInterval(() => {
      if (content && videoElement.currentTime > 0) {
        try {
          // Sauvegarder la progression dans localStorage comme fallback
          localStorage.setItem(`progress_${content.id}${selectedEpisode ? '_' + selectedEpisode.id : ''}`, videoElement.currentTime);
          
          // Sauvegarder la progression via ContentDataService si disponible
          if (ContentDataService && ContentDataService.saveWatchProgress) {
            ContentDataService.saveWatchProgress(
              content.id,
              selectedEpisode ? selectedEpisode.id : null,
              videoElement.currentTime,
              videoElement.duration
            );
          }
        } catch (error) {
          console.warn('Erreur lors de la sauvegarde de la progression:', error);
        }
      }
    }, 30000);
    
    // Nettoyer les écouteurs d'événements
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
      
      clearInterval(saveProgressInterval);
    };
  }, [content, selectedEpisode, episodes, navigate]);

  // Afficher/masquer les contrôles lors du mouvement de la souris
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Masquer les contrôles après 3 secondes d'inactivité
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
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) return;
    
    try {
      if (!isFullscreen) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
          videoContainer.mozRequestFullScreen();
        } else if (videoContainer.msRequestFullscreen) {
          videoContainer.msRequestFullscreen();
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
    } catch (error) {
      console.error('Erreur lors du changement de mode plein écran:', error);
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleQualityChange = (e) => {
    const newQuality = e.target.value;
    setQuality(newQuality);
    
    // Implémenter le changement de qualité
    // Dans une vraie application, cela nécessiterait de changer la source vidéo
    console.log(`Qualité changée à ${newQuality}`);
  };
  
  // Changer d'épisode
  const changeEpisode = (episodeId) => {
    navigate(`/player?id=${content.id}&episode=${episodeId}`);
  };

  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '00:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Afficher le chargement
  if (isLoading) {
    return (
      <div className="player-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur
  if (error || !content) {
    return (
      <div className="player-page error">
        <div className="error-container">
          <h2>Erreur de lecture</h2>
          <p>{error || "Impossible de charger la vidéo"}</p>
          <button className="back-button" onClick={() => navigate(-1)}>
            Retour
          </button>
        </div>
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
            <h1 className="video-title">
              {content.title}
              {selectedEpisode && ` - ${selectedEpisode.title || `Épisode ${selectedEpisode.number}`}`}
            </h1>
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
                {availableQualities.length > 0 && (
                  <div className="quality-selector">
                    <select 
                      value={quality} 
                      onChange={handleQualityChange}
                      className="quality-select"
                    >
                      {availableQualities.map((q, index) => (
                        <option key={index} value={q.value}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <button className="control-button" onClick={toggleFullscreen}>
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Liste des épisodes (pour les séries et animes) */}
      {episodes.length > 1 && (
        <div className="episodes-list">
          <h2 className="episodes-title">Épisodes</h2>
          <div className="episodes-grid">
            {episodes.map((episode) => (
              <button
                key={episode.id}
                className={`episode-item ${selectedEpisode && selectedEpisode.id === episode.id ? 'active' : ''}`}
                onClick={() => changeEpisode(episode.id)}
              >
                <div className="episode-number">{episode.number}</div>
                <div className="episode-info">
                  <div className="episode-title">{episode.title || `Épisode ${episode.number}`}</div>
                  {episode.duration && <div className="episode-duration">{formatTime(episode.duration)}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPage;
