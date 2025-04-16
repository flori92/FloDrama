import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { fetchVideoLinks, checkLinkValidity } from '../../services/videoScraper';
import logger from '../../utils/logger';

/**
 * Composant de lecteur vidéo pour FloDrama
 * Utilise le service de scraping pour récupérer les liens vidéos
 * et les lire directement sans stocker les fichiers sur notre infrastructure
 */
const VideoPlayer = ({ 
  contentId, 
  contentType = 'DRAMA', 
  episode = 1, 
  season = 1,
  autoplay = false,
  poster = '',
  onError = () => {},
  onPlay = () => {},
  onPause = () => {},
  onEnd = () => {}
}) => {
  // Nous utilisons setVideoSources mais pas directement videoSources
  // car nous accédons aux sources via currentSource
  const [, setVideoSources] = useState([]);
  const [currentSource, setCurrentSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quality, setQuality] = useState('auto');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [, setLastActivity] = useState(Date.now());
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  // Charger les sources vidéo au chargement du composant
  useEffect(() => {
    let isMounted = true; // Pour éviter les mises à jour sur un composant démonté
    
    const loadVideoSources = async () => {
      try {
        if (!isMounted) return;
        
        setIsLoading(true);
        setError(null);
        
        // Récupérer les liens vidéos depuis le service de scraping
        const links = await fetchVideoLinks(contentId, contentType, { 
          season, 
          episode,
          quality 
        });
        
        if (!isMounted) return;
        
        if (links.length === 0) {
          throw new Error('Aucune source vidéo disponible');
        }
        
        setVideoSources(links);
        
        // Sélectionner la première source disponible
        for (const source of links) {
          if (!isMounted) return;
          
          const isValid = await checkLinkValidity(source.url);
          if (isValid) {
            setCurrentSource(source);
            break;
          }
        }
        
        if (!currentSource && isMounted) {
          throw new Error('Aucune source vidéo valide trouvée');
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Erreur lors du chargement des sources vidéo', error);
          setError(error.message);
          onError(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadVideoSources();
    
    // Capturer la référence actuelle pour le nettoyage
    const videoElement = videoRef.current;
    
    // Nettoyage
    return () => {
      isMounted = false; // Marquer le composant comme démonté
      if (videoElement) {
        videoElement.pause();
      }
    };
  }, [contentId, contentType, episode, season, quality, onError, currentSource]);
  
  // Gérer l'autoplay
  useEffect(() => {
    if (videoRef.current && currentSource && autoplay && !isLoading) {
      videoRef.current.play()
        .catch(error => {
          logger.warn('Autoplay bloqué par le navigateur', error);
        });
    }
  }, [currentSource, autoplay, isLoading]);
  
  // Masquer les contrôles après une période d'inactivité
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setShowControls(true);
      
      // Réinitialiser le timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    // Ajouter les écouteurs d'événements
    const playerElement = playerRef.current;
    if (playerElement) {
      playerElement.addEventListener('mousemove', handleActivity);
      playerElement.addEventListener('click', handleActivity);
      playerElement.addEventListener('touchstart', handleActivity);
    }
    
    // Nettoyage
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      if (playerElement) {
        playerElement.removeEventListener('mousemove', handleActivity);
        playerElement.removeEventListener('click', handleActivity);
        playerElement.removeEventListener('touchstart', handleActivity);
      }
    };
  }, [isPlaying]);
  
  // Gérer les événements du lecteur vidéo
  const handlePlay = () => {
    setIsPlaying(true);
    onPlay();
  };
  
  const handlePause = () => {
    setIsPlaying(false);
    onPause();
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    onEnd();
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const videoDuration = videoRef.current.duration;
      
      if (videoDuration) {
        setProgress((currentTime / videoDuration) * 100);
      }
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
    logger.error('Erreur de lecture vidéo', e);
    setError('Erreur lors de la lecture de la vidéo');
    onError(e);
  };
  
  // Fonctions de contrôle du lecteur
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play()
          .catch(error => {
            logger.error('Erreur lors de la lecture', error);
          });
      }
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };
  
  const changeVolume = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };
  
  const seekByPercentage = (percentage) => {
    if (videoRef.current && duration) {
      const newTime = (percentage / 100) * duration;
      videoRef.current.currentTime = newTime;
    }
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && playerRef.current) {
      playerRef.current.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch(error => {
          logger.error('Erreur lors du passage en plein écran', error);
        });
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch(error => {
          logger.error('Erreur lors de la sortie du plein écran', error);
        });
    }
  };
  
  const changeQuality = (newQuality) => {
    if (newQuality !== quality) {
      // Sauvegarder la position actuelle
      const currentTime = videoRef.current?.currentTime || 0;
      const wasPlaying = isPlaying;
      
      // Changer la qualité
      setQuality(newQuality);
      
      // Restaurer la position et l'état de lecture après le chargement
      const handleSourceLoaded = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          
          if (wasPlaying) {
            videoRef.current.play()
              .catch(error => {
                logger.warn('Erreur lors de la reprise de la lecture', error);
              });
          }
          
          videoRef.current.removeEventListener('loadeddata', handleSourceLoaded);
        }
      };
      
      if (videoRef.current) {
        videoRef.current.addEventListener('loadeddata', handleSourceLoaded);
      }
    }
  };
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '00:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculer le temps actuel
  const currentTime = videoRef.current ? videoRef.current.currentTime : 0;
  
  // Utiliser l'URL du poster si fournie, sinon utiliser une image par défaut
  const posterUrl = poster ? poster : '/assets/default-poster.jpg';
  
  return (
    <div 
      ref={playerRef}
      className={`relative w-full aspect-video bg-[#0066CC] overflow-hidden ${isLoading ? 'animate-pulse' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Vidéo */}
      {currentSource && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={currentSource.url}
          poster={posterUrl}
          preload="metadata"
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onVolumeChange={handleVolumeChange}
          onError={handleError}
        >
          {/* Sous-titres */}
          {currentSource.subtitles?.map((subtitle, index) => (
            <track 
              key={index}
              kind="subtitles"
              src={subtitle.url}
              srcLang={subtitle.language}
              label={subtitle.label}
              default={subtitle.default}
            />
          ))}
          Votre navigateur ne prend pas en charge la lecture vidéo.
        </video>
      )}
      
      {/* Overlay de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0066CC] bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1601D]"></div>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0066CC] bg-opacity-75 text-white p-4">
          <div className="text-red-500 text-xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Erreur de lecture
          </div>
          <p className="text-center mb-4">{error}</p>
          <button 
            className="bg-[#F1601D] hover:bg-[#e04e10] text-white font-bold py-2 px-4 rounded"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      )}
      
      {/* Contrôles du lecteur */}
      {showControls && !isLoading && !error && (
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-[#0066CC]/70 to-transparent p-4">
          {/* Titre et informations */}
          <div className="flex items-center justify-between">
            <div className="text-white font-bold">
              {contentType === 'DRAMA' ? `Saison ${season} · Épisode ${episode}` : 'Film'}
            </div>
            
            {/* Sélecteur de qualité */}
            <div className="relative group">
              <button className="text-white bg-[#0066CC]/50 rounded px-2 py-1 text-sm">
                {quality === 'auto' ? 'Auto' : quality}
              </button>
              
              <div className="absolute right-0 mt-1 hidden group-hover:block bg-[#0066CC]/80 rounded overflow-hidden">
                {['auto', '1080p', '720p', '480p', '360p'].map((q) => (
                  <button 
                    key={q}
                    className={`block w-full text-left px-3 py-1 text-sm ${q === quality ? 'bg-[#F1601D]' : 'hover:bg-gray-700'}`}
                    onClick={() => changeQuality(q)}
                  >
                    {q === 'auto' ? 'Auto' : q}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Contrôles principaux */}
          <div className="flex flex-col space-y-2">
            {/* Barre de progression */}
            <div className="relative w-full h-1 bg-gray-600 cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percentage = ((e.clientX - rect.left) / rect.width) * 100;
              seekByPercentage(percentage);
            }}>
              <div 
                className="absolute top-0 left-0 h-full bg-[#F1601D]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Boutons et temps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Lecture/Pause */}
                <button 
                  className="text-white hover:text-[#F1601D]"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
                
                {/* Volume */}
                <div className="flex items-center space-x-2">
                  <button 
                    className="text-white hover:text-[#F1601D]"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-20 accent-[#F1601D]"
                  />
                </div>
                
                {/* Temps */}
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              {/* Plein écran */}
              <button 
                className="text-white hover:text-[#F1601D]"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VideoPlayer.propTypes = {
  contentId: PropTypes.string.isRequired,
  contentType: PropTypes.oneOf(['DRAMA', 'MOVIE']),
  episode: PropTypes.number,
  season: PropTypes.number,
  autoplay: PropTypes.bool,
  poster: PropTypes.string,
  onError: PropTypes.func,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onEnd: PropTypes.func
};

export default VideoPlayer;
