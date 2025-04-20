import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Video } from '@lynx-js/core';
import { useHotkeys } from '@lynx-js/hooks';
import { PlayIcon, PauseIcon } from '@/assets/icons/icons';
import { WatchParty } from '../features/WatchParty';
import '@/styles/components/videoPlayer.scss';
import videoProxyService from '@/services/VideoProxyService';

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
  source,
  subtitles = [],
  quality = [],
  onNext,
  onPrevious,
  autoPlay = true,
  watchPartyEnabled = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState(quality[0]?.label || 'auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState('off');
  const [showWatchParty, setShowWatchParty] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const [streamUrl, setStreamUrl] = useState(source);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Récupération de l'URL de streaming sécurisée
  useEffect(() => {
    const fetchSecureStreamUrl = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        
        // Récupérer l'URL de streaming sécurisée via notre service de proxy
        const secureUrl = await videoProxyService.getSecureStreamUrl(
          videoId, 
          selectedQuality
        );
        
        setStreamUrl(secureUrl);
        setIsLoading(false);
        
        // Si autoPlay est activé, démarrer la lecture automatiquement
        if (autoPlay && videoRef.current) {
          videoRef.current.play().catch(err => {
            console.error('Erreur lors de la lecture automatique:', err);
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du stream:', error);
        setErrorMessage('Impossible de charger la vidéo. Veuillez réessayer plus tard.');
        setIsLoading(false);
      }
    };
    
    fetchSecureStreamUrl();
  }, [videoId, selectedQuality, autoPlay]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Enregistrer la progression toutes les 30 secondes
      if (Math.floor(video.currentTime) % 30 === 0 && video.currentTime > 0) {
        videoProxyService.recordViewingSession(videoId, selectedQuality, video.currentTime);
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoId, selectedQuality]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const seek = (seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = currentTime + seconds;
    videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
  };

  const adjustVolume = (delta: number) => {
    if (!videoRef.current) return;
    
    const newVolume = Math.max(0, Math.min(volume + delta, 1));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleQualityChange = (newQuality: string) => {
    const qualitySource = quality.find(q => q.label === newQuality);
    if (qualitySource && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      videoRef.current.src = qualitySource.url;
      videoRef.current.currentTime = currentTime;
      if (isPlaying) videoRef.current.play();
      setSelectedQuality(newQuality);
    }
  };

  const handleSubtitleChange = (language: string) => {
    setSelectedSubtitle(language);
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = tracks[i].language === language ? 'showing' : 'hidden';
      }
    }
  };

  return (
    <View className="video-player-container">
      {isLoading ? (
        <View className="video-loading">
          <Text>Chargement de la vidéo...</Text>
        </View>
      ) : errorMessage ? (
        <View className="video-error">
          <Text>{errorMessage}</Text>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </View>
      ) : (
        <>
          <Video
            ref={videoRef}
            src={streamUrl}
            className="video-element"
            onMouseMove={handleMouseMove}
            onClick={togglePlay}
          >
            {subtitles.map((subtitle, index) => (
              <track
                key={index}
                kind="subtitles"
                src={subtitle.url}
                srcLang={subtitle.language}
                label={subtitle.language}
              />
            ))}
          </Video>

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
                  <button className="video-player__button">
                    {selectedQuality}
                  </button>
                  <View className="video-player__dropdown-content">
                    {quality.map((q) => (
                      <button
                        key={q.label}
                        onClick={() => handleQualityChange(q.label)}
                        className={`video-player__dropdown-item ${
                          selectedQuality === q.label ? 'active' : ''
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </View>
                </View>
                <View className="video-player__dropdown">
                  <button className="video-player__button">
                    {selectedSubtitle === 'off' ? 'CC' : selectedSubtitle}
                  </button>
                  <View className="video-player__dropdown-content">
                    <button
                      onClick={() => handleSubtitleChange('off')}
                      className={`video-player__dropdown-item ${
                        selectedSubtitle === 'off' ? 'active' : ''
                      }`}
                    >
                      Désactivé
                    </button>
                    {subtitles.map((subtitle) => (
                      <button
                        key={subtitle.language}
                        onClick={() => handleSubtitleChange(subtitle.language)}
                        className={`video-player__dropdown-item ${
                          selectedSubtitle === subtitle.language ? 'active' : ''
                        }`}
                      >
                        {subtitle.language}
                      </button>
                    ))}
                  </View>
                </View>
                <button onClick={toggleFullscreen} className="video-player__button">
                  {isFullscreen ? 'Quitter' : 'Plein écran'}
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
        </>
      )}
    </View>
  );
};

export default VideoPlayer;
