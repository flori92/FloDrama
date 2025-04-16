import React, { useRef, useState, useEffect } from 'react';
import { View, Text } from '@lynx-js/core';
import { useHotkeys } from '@lynx-js/hooks';
import { PlayIcon, PauseIcon } from '@/assets/icons/icons';
import WatchParty from '../features/WatchParty';
import '@/styles/components/videoPlayer.scss';
import { videoProxyService } from '../../services/VideoProxyService';

interface VideoPlayerProps {
  videoId: string;
  episodeId: string;
  title: string;
  source: string;
  subtitles?: {
    language: string;
    url: string;
  }[];
  quality?: {
    label: string;
    url: string;
  }[];
  onNext?: () => void;
  onPrevious?: () => void;
  autoPlay?: boolean;
  watchPartyEnabled?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  episodeId,
  title,
  // Paramètre non utilisé mais conservé pour compatibilité avec l'interface
  source: _source,
  // Paramètre non utilisé mais conservé pour compatibilité avec l'interface
  subtitles: _subtitles = [],
  quality = [],
  onNext,
  onPrevious,
  autoPlay = true,
  watchPartyEnabled = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState(quality[0]?.label || 'auto');
  const [qualityOptions, setQuality] = useState<{ label: string; url: string }[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [showWatchParty, setShowWatchParty] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingQuality, setLoadingQuality] = useState(false);
  const [lastPlayPosition, setLastPlayPosition] = useState(0);

  // Gestion des raccourcis clavier
  useHotkeys({
    'space': () => togglePlay(),
    'k': () => togglePlay(),
    'f': () => toggleFullscreen(),
    'm': () => toggleMute(),
    'arrowleft': () => seek(-10),
    'arrowright': () => seek(10),
    'arrowup': () => adjustVolume(0.1),
    'arrowdown': () => adjustVolume(-0.1),
  });

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Récupération de l'URL sécurisée via le service de proxy
        const streamData = await videoProxyService.getSecureStreamUrl(videoId, selectedQuality, sessionId);
        
        if (videoRef.current) {
          const videoElement = videoRef.current;
          videoElement.src = streamData.url;
          videoElement.load();
          
          // Mise à jour des qualités disponibles
          if (streamData.availableQualities && streamData.availableQualities.length > 0) {
            const newQualityOptions = streamData.availableQualities.map(q => ({ 
              label: q, 
              url: '' // L'URL sera générée dynamiquement lors du changement de qualité
            }));
            setQuality(newQualityOptions);
          }
          
          // Restaurer la dernière position de lecture si elle existe
          if (lastPlayPosition > 0) {
            videoElement.currentTime = lastPlayPosition;
          }
          
          // Lecture automatique si demandée
          if (autoPlay) {
            try {
              await videoElement.play();
              setIsPlaying(true);
            } catch (playError) {
              console.error('Erreur de lecture automatique:', playError);
              setIsPlaying(false);
            }
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la vidéo:', error);
        setError('Impossible de charger la vidéo. Veuillez réessayer plus tard.');
        setIsLoading(false);
      }
    };

    loadVideo();
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (videoRef.current) {
        const videoElement = videoRef.current;
        // Enregistrer la session de visionnage avant de quitter
        try {
          videoProxyService.recordViewingSession(
            videoId,
            selectedQuality,
            videoElement.currentTime,
            sessionId
          );
        } catch (e) {
          console.error('Erreur lors de l\'enregistrement de la session:', e);
        }
        
        videoElement.pause();
        videoElement.src = '';
        videoElement.load();
      }
    };
  }, [videoId, selectedQuality, autoPlay, sessionId, lastPlayPosition]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.removeEventListener('play', handlePlay);
        videoRef.current.removeEventListener('pause', handlePause);
      }
    };
  }, []);

  useEffect(() => {
    // Récupérer la dernière position de lecture depuis le localStorage
    const savedPosition = localStorage.getItem(`video_position_${videoId}`);
    if (savedPosition) {
      setLastPlayPosition(parseFloat(savedPosition));
    }

    // Sauvegarder la position toutes les 5 secondes
    const savePositionInterval = setInterval(() => {
      if (videoRef.current) {
        const videoElement = videoRef.current;
        if (videoElement.currentTime > 0) {
          localStorage.setItem(`video_position_${videoId}`, videoElement.currentTime.toString());
        }
      }
    }, 5000);

    return () => {
      clearInterval(savePositionInterval);
      // Sauvegarder la position finale lors du démontage
      if (videoRef.current) {
        const videoElement = videoRef.current;
        if (videoElement.currentTime > 0) {
          localStorage.setItem(`video_position_${videoId}`, videoElement.currentTime.toString());
        }
      }
    };
  }, [videoId]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      const newTime = currentTime + seconds;
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
    }
  };

  const adjustVolume = (delta: number) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(isMuted ? 0 : videoRef.current.volume + delta, 1));
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      setIsMuted(!isMuted);
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    // Réinitialiser le délai d'expiration des contrôles
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Masquer les contrôles après 3 secondes d'inactivité si la vidéo est en lecture
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const changeQuality = (newQuality: string) => {
    if (newQuality !== selectedQuality && videoRef.current) {
      // Sauvegarder la position actuelle et l'état de lecture
      const currentTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      
      setLoadingQuality(true);
      
      // Récupérer une nouvelle URL pour la qualité sélectionnée
      videoProxyService.getSecureStreamUrl(videoId, newQuality, sessionId).then(streamData => {
        if (videoRef.current) {
          // Mettre à jour la source avec la nouvelle URL
          videoRef.current.src = streamData.url;
          videoRef.current.load();
          
          // Restaurer la position de lecture
          videoRef.current.currentTime = currentTime;
          
          // Ajouter un événement pour reprendre la lecture une fois les métadonnées chargées
          videoRef.current.addEventListener('loadedmetadata', () => {
            videoRef.current.currentTime = currentTime;
            if (wasPlaying) {
              videoRef.current.play().catch(e => console.error('Erreur lors de la reprise de lecture:', e));
            }
            setLoadingQuality(false);
          }, { once: true });
          
          setSelectedQuality(newQuality);
        }
      }).catch(error => {
        console.error('Erreur lors du changement de qualité:', error);
        setLoadingQuality(false);
        setError(`Impossible de charger la qualité ${newQuality}. Veuillez réessayer.`);
      });
    }
  };

  return (
    <View 
      className="video-player"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <View className="video-player__loading">
          <Text>Chargement de la vidéo...</Text>
        </View>
      )}
      
      {error && (
        <View className="video-player__error">
          <Text>{error}</Text>
          <button onClick={() => window.location.reload()} className="video-player__button">
            Réessayer
          </button>
        </View>
      )}
      
      <video
        ref={videoRef}
        className="video-player__video"
        autoPlay={autoPlay}
        crossOrigin="anonymous"
      >
        {/* Les sources seront définies dynamiquement via l'API */}
      </video>

      {/* Contrôles */}
      <View className={`video-player__controls ${showControls ? 'visible' : ''}`}>
        {/* Barre de progression */}
        <View className="video-player__progress">
          <View 
            className="video-player__progress-bar"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            className="video-player__progress-input"
          />
        </View>

        {/* Contrôles principaux */}
        <View className="video-player__controls-main">
          <View className="video-player__controls-left">
            <button onClick={togglePlay} className="video-player__button">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={() => seek(-10)} className="video-player__button">
              -10s
            </button>
            <button onClick={() => seek(10)} className="video-player__button">
              +10s
            </button>
            <View className="video-player__time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </View>
          </View>

          <View className="video-player__controls-right">
            {watchPartyEnabled && (
              <button 
                onClick={() => setShowWatchParty(!showWatchParty)}
                className={`video-player__button ${showWatchParty ? 'active' : ''}`}
              >
                Watch Party
              </button>
            )}
            <View className="video-player__dropdown">
              <button className="video-player__button" disabled={loadingQuality}>
                {loadingQuality ? 'Chargement...' : selectedQuality}
              </button>
              <View className="video-player__dropdown-content">
                {qualityOptions.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => changeQuality(q.label)}
                    className={`video-player__dropdown-item ${
                      selectedQuality === q.label ? 'active' : ''
                    }`}
                    disabled={loadingQuality}
                  >
                    {q.label}
                  </button>
                ))}
              </View>
            </View>
            <button onClick={toggleFullscreen} className="video-player__button">
              Plein écran
            </button>
          </View>
        </View>
      </View>

      {/* Watch Party */}
      {watchPartyEnabled && showWatchParty && (
        <WatchParty
          videoId={videoId}
          episodeId={episodeId}
        />
      )}

      {/* Titre de l'épisode */}
      <View className="video-player__title">
        <Text>{title}</Text>
      </View>

      {/* Boutons de navigation épisodes */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="video-player__nav-button video-player__nav-button--prev"
        >
          Épisode précédent
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="video-player__nav-button video-player__nav-button--next"
        >
          Épisode suivant
        </button>
      )}
    </View>
  );
};

export default VideoPlayer;
