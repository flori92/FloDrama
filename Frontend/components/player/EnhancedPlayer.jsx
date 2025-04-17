import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './EnhancedPlayer.css';

/**
 * Lecteur vidéo amélioré pour FloDrama
 * Supporte plusieurs sources vidéo, qualités et sous-titres
 */
const EnhancedPlayer = ({ 
  videoSources, 
  title, 
  episodeInfo, 
  subtitles = [], 
  onClose, 
  autoPlay = true,
  poster = null,
  nextEpisode = null,
  previousEpisode = null
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState('off');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const navigate = useNavigate();
  
  // Déterminer la source vidéo active en fonction de la qualité sélectionnée
  const activeSource = videoSources.find(source => 
    selectedQuality === 'auto' ? source.quality === 'auto' : source.quality === selectedQuality
  ) || videoSources[0];
  
  // Gérer le chargement initial de la vidéo
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      // Événements de chargement
      const handleLoadStart = () => setIsBuffering(true);
      const handleCanPlay = () => setIsBuffering(false);
      const handleLoadedMetadata = () => setDuration(video.duration);
      
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [activeSource]);
  
  // Gérer la lecture/pause
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      if (isPlaying) {
        video.play().catch(error => {
          console.error('Erreur de lecture:', error);
          setIsPlaying(false);
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying, activeSource]);
  
  // Mettre à jour le temps actuel pendant la lecture
  useEffect(() => {
    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Afficher l'écran de fin lorsque la vidéo est presque terminée
      if (video.duration > 0 && video.currentTime / video.duration > 0.95) {
        setShowEndScreen(true);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setShowEndScreen(true);
    };
    
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, []);
  
  // Gérer le volume et le mode muet
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      video.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Gérer l'affichage/masquage automatique des contrôles
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      // Réinitialiser le timer
      clearTimeout(controlsTimerRef.current);
      
      // Masquer les contrôles après 3 secondes d'inactivité
      controlsTimerRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    const player = playerRef.current;
    
    if (player) {
      player.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        player.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(controlsTimerRef.current);
      };
    }
  }, [isPlaying]);
  
  // Gérer le mode plein écran
  const toggleFullscreen = () => {
    const player = playerRef.current;
    
    if (!document.fullscreenElement) {
      player.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Erreur lors du passage en plein écran:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Erreur lors de la sortie du plein écran:', err);
      });
    }
  };
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '00:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Gérer le changement de position dans la vidéo
  const handleSeek = (e) => {
    const video = videoRef.current;
    const progressBar = e.currentTarget;
    const pos = (e.pageX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    
    if (video && !isNaN(video.duration)) {
      video.currentTime = pos * video.duration;
      setCurrentTime(video.currentTime);
    }
  };
  
  // Naviguer vers l'épisode suivant/précédent
  const handleNavigateEpisode = (episodeId) => {
    if (episodeId) {
      navigate(`/player?id=${episodeId}`);
    }
  };
  
  return (
    <div 
      className={`enhanced-player ${showControls ? 'show-controls' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      ref={playerRef}
      onClick={() => setIsPlaying(!isPlaying)}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={activeSource.url}
        poster={poster}
        onClick={(e) => e.stopPropagation()}
        className="enhanced-player-video"
      >
        {subtitles.map((subtitle, index) => (
          <track 
            key={index}
            kind="subtitles"
            src={subtitle.url}
            srcLang={subtitle.language}
            label={subtitle.label}
            default={selectedSubtitle === subtitle.language}
          />
        ))}
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      
      {/* Indicateur de chargement */}
      {isBuffering && (
        <div className="enhanced-player-buffer">
          <div className="enhanced-player-spinner"></div>
        </div>
      )}
      
      {/* Écran de fin */}
      {showEndScreen && (
        <div className="enhanced-player-end-screen" onClick={(e) => e.stopPropagation()}>
          <div className="enhanced-player-end-content">
            <h2>{title}</h2>
            {nextEpisode && (
              <button 
                className="enhanced-player-next-button"
                onClick={() => handleNavigateEpisode(nextEpisode.id)}
              >
                Épisode suivant: {nextEpisode.title}
              </button>
            )}
            <div className="enhanced-player-end-buttons">
              <button onClick={() => {
                setShowEndScreen(false);
                videoRef.current.currentTime = 0;
                setIsPlaying(true);
              }}>
                Revoir
              </button>
              <button onClick={onClose}>
                Retour
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Barre de titre */}
      <div className="enhanced-player-title" onClick={(e) => e.stopPropagation()}>
        <button className="enhanced-player-back" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1>{title}</h1>
          {episodeInfo && <p>{episodeInfo}</p>}
        </div>
      </div>
      
      {/* Contrôles */}
      <div className="enhanced-player-controls" onClick={(e) => e.stopPropagation()}>
        {/* Barre de progression */}
        <div className="enhanced-player-progress" onClick={handleSeek}>
          <div 
            className="enhanced-player-progress-filled" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
        
        {/* Contrôles principaux */}
        <div className="enhanced-player-main-controls">
          <div className="enhanced-player-left-controls">
            {/* Bouton lecture/pause */}
            <button 
              className="enhanced-player-control-button"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
            
            {/* Boutons précédent/suivant */}
            {previousEpisode && (
              <button 
                className="enhanced-player-control-button"
                onClick={() => handleNavigateEpisode(previousEpisode.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="19 20 9 12 19 4 19 20"></polygon>
                  <line x1="5" y1="19" x2="5" y2="5"></line>
                </svg>
              </button>
            )}
            
            {nextEpisode && (
              <button 
                className="enhanced-player-control-button"
                onClick={() => handleNavigateEpisode(nextEpisode.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"></polygon>
                  <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
              </button>
            )}
            
            {/* Contrôle du volume */}
            <div className="enhanced-player-volume-container">
              <button 
                className="enhanced-player-control-button"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6"/>
                  </svg>
                ) : volume > 0.5 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  setIsMuted(newVolume === 0);
                }}
                className="enhanced-player-volume-slider"
              />
            </div>
            
            {/* Affichage du temps */}
            <div className="enhanced-player-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="enhanced-player-right-controls">
            {/* Menu des sous-titres */}
            <div className="enhanced-player-menu-container">
              <button 
                className="enhanced-player-control-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubtitleMenu(!showSubtitleMenu);
                  setShowQualityMenu(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                  <polyline points="17 2 12 7 7 2"></polyline>
                </svg>
              </button>
              
              {showSubtitleMenu && (
                <div className="enhanced-player-menu">
                  <div 
                    className={`enhanced-player-menu-item ${selectedSubtitle === 'off' ? 'active' : ''}`}
                    onClick={() => setSelectedSubtitle('off')}
                  >
                    Désactivés
                  </div>
                  {subtitles.map((subtitle, index) => (
                    <div 
                      key={index}
                      className={`enhanced-player-menu-item ${selectedSubtitle === subtitle.language ? 'active' : ''}`}
                      onClick={() => setSelectedSubtitle(subtitle.language)}
                    >
                      {subtitle.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Menu des qualités */}
            <div className="enhanced-player-menu-container">
              <button 
                className="enhanced-player-control-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQualityMenu(!showQualityMenu);
                  setShowSubtitleMenu(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </button>
              
              {showQualityMenu && (
                <div className="enhanced-player-menu">
                  <div 
                    className={`enhanced-player-menu-item ${selectedQuality === 'auto' ? 'active' : ''}`}
                    onClick={() => setSelectedQuality('auto')}
                  >
                    Auto
                  </div>
                  {videoSources
                    .filter(source => source.quality !== 'auto')
                    .sort((a, b) => {
                      const qualityA = parseInt(a.quality.replace('p', ''));
                      const qualityB = parseInt(b.quality.replace('p', ''));
                      return qualityB - qualityA;
                    })
                    .map((source, index) => (
                      <div 
                        key={index}
                        className={`enhanced-player-menu-item ${selectedQuality === source.quality ? 'active' : ''}`}
                        onClick={() => setSelectedQuality(source.quality)}
                      >
                        {source.quality}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            
            {/* Bouton plein écran */}
            <button 
              className="enhanced-player-control-button"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPlayer;
