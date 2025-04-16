import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, Minimize, ChevronLeft, SkipForward, SkipBack } from 'lucide-react';

/**
 * Lecteur vidéo amélioré pour FloDrama
 * Offre une expérience de visionnage optimale avec contrôles personnalisés
 */
const EnhancedVideoPlayer = ({
  videoUrl,
  posterUrl,
  title,
  episodeInfo,
  onBack,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode = false,
  hasPreviousEpisode = false,
  subtitles = []
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState('off');
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  // Qualités disponibles (à adapter selon les sources réelles)
  const qualities = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: '1080p' },
    { label: '720p', value: '720p' },
    { label: '480p', value: '480p' },
    { label: '360p', value: '360p' }
  ];
  
  // Formater le temps en minutes:secondes
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Gérer le chargement de la vidéo
  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      
      // Passer automatiquement à l'épisode suivant s'il existe
      if (hasNextEpisode && onNextEpisode) {
        setTimeout(() => {
          onNextEpisode();
        }, 3000);
      }
    };
    
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [hasNextEpisode, onNextEpisode]);
  
  // Gérer l'affichage des contrôles
  useEffect(() => {
    const hideControls = () => {
      if (isPlaying) {
        setShowControls(false);
      }
    };
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(hideControls, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);
  
  // Gérer le plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Lecture/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Changer la position de lecture
  const handleProgressChange = (e) => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    const newTime = percentage * video.duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };
  
  // Changer le volume
  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.max(0, Math.min(1, x / width));
    
    video.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  // Couper/Rétablir le son
  const toggleMute = () => {
    const video = videoRef.current;
    
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume || 0.5;
      video.muted = false;
    } else {
      video.muted = true;
    }
    
    setIsMuted(!isMuted);
  };
  
  // Activer/Désactiver le plein écran
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Erreur lors du passage en plein écran: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Changer la qualité
  const changeQuality = (quality) => {
    // Logique pour changer la qualité (à adapter selon l'implémentation réelle)
    console.log(`Changement de qualité: ${quality}`);
    setSelectedQuality(quality);
    setIsSettingsOpen(false);
  };
  
  // Changer les sous-titres
  const changeSubtitle = (subtitle) => {
    console.log(`Changement de sous-titres: ${subtitle}`);
    setSelectedSubtitle(subtitle);
    setIsSettingsOpen(false);
    
    // Logique pour activer/désactiver les sous-titres
    const tracks = videoRef.current?.textTracks;
    
    if (tracks) {
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = tracks[i].language === subtitle ? 'showing' : 'hidden';
      }
    }
  };
  
  // Afficher les contrôles au survol
  const handleMouseMove = () => {
    setShowControls(true);
  };
  
  return (
    <div
      ref={containerRef}
      className="enhanced-video-player"
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onClick={togglePlay}
        preload="auto"
      >
        {/* Sous-titres */}
        {subtitles.map((subtitle, index) => (
          <track
            key={index}
            kind="subtitles"
            src={subtitle.url}
            srcLang={subtitle.language}
            label={subtitle.label}
            default={subtitle.default}
          />
        ))}
      </video>
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white'
          }}
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray="60 30"
            />
          </svg>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      
      {/* Bouton de lecture central */}
      {!isPlaying && showControls && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer'
          }}
          onClick={togglePlay}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(229, 9, 20, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Play size={40} color="white" />
          </div>
        </motion.div>
      )}
      
      {/* Contrôles */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '20px',
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
              color: 'white'
            }}
          >
            {/* Titre et informations */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}
            >
              <div>
                <button
                  onClick={onBack}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <ChevronLeft size={20} />
                  Retour
                </button>
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{title}</h3>
                {episodeInfo && (
                  <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
                    {episodeInfo}
                  </p>
                )}
              </div>
              <div style={{ width: '80px' }}></div> {/* Espace pour équilibrer */}
            </div>
            
            {/* Barre de progression */}
            <div
              style={{
                width: '100%',
                height: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
              onClick={handleProgressChange}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#E50914',
                  borderRadius: '5px'
                }}
              ></div>
            </div>
            
            {/* Contrôles principaux */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Lecture/Pause */}
                <button
                  onClick={togglePlay}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                
                {/* Épisode précédent */}
                <button
                  onClick={onPreviousEpisode}
                  disabled={!hasPreviousEpisode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: hasPreviousEpisode ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    cursor: hasPreviousEpisode ? 'pointer' : 'default',
                    opacity: hasPreviousEpisode ? 1 : 0.5
                  }}
                >
                  <SkipBack size={24} />
                </button>
                
                {/* Épisode suivant */}
                <button
                  onClick={onNextEpisode}
                  disabled={!hasNextEpisode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: hasNextEpisode ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    cursor: hasNextEpisode ? 'pointer' : 'default',
                    opacity: hasNextEpisode ? 1 : 0.5
                  }}
                >
                  <SkipForward size={24} />
                </button>
                
                {/* Volume */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button
                    onClick={toggleMute}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  
                  <div
                    style={{
                      width: '80px',
                      height: '5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                    onClick={handleVolumeChange}
                  >
                    <div
                      style={{
                        width: `${isMuted ? 0 : volume * 100}%`,
                        height: '100%',
                        backgroundColor: 'white',
                        borderRadius: '5px'
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Temps */}
                <div style={{ fontSize: '14px' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Paramètres */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <Settings size={24} />
                  </button>
                  
                  {/* Menu des paramètres */}
                  {isSettingsOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '40px',
                        right: '0',
                        width: '200px',
                        backgroundColor: 'rgba(28, 28, 28, 0.9)',
                        borderRadius: '5px',
                        padding: '10px',
                        zIndex: 10
                      }}
                    >
                      {/* Qualité */}
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', opacity: 0.8 }}>
                          Qualité
                        </p>
                        {qualities.map((quality) => (
                          <div
                            key={quality.value}
                            onClick={() => changeQuality(quality.value)}
                            style={{
                              padding: '8px 10px',
                              cursor: 'pointer',
                              backgroundColor: selectedQuality === quality.value ? 'rgba(229, 9, 20, 0.5)' : 'transparent',
                              borderRadius: '3px'
                            }}
                          >
                            {quality.label}
                          </div>
                        ))}
                      </div>
                      
                      {/* Sous-titres */}
                      <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', opacity: 0.8 }}>
                          Sous-titres
                        </p>
                        <div
                          onClick={() => changeSubtitle('off')}
                          style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            backgroundColor: selectedSubtitle === 'off' ? 'rgba(229, 9, 20, 0.5)' : 'transparent',
                            borderRadius: '3px'
                          }}
                        >
                          Désactivés
                        </div>
                        {subtitles.map((subtitle) => (
                          <div
                            key={subtitle.language}
                            onClick={() => changeSubtitle(subtitle.language)}
                            style={{
                              padding: '8px 10px',
                              cursor: 'pointer',
                              backgroundColor: selectedSubtitle === subtitle.language ? 'rgba(229, 9, 20, 0.5)' : 'transparent',
                              borderRadius: '3px'
                            }}
                          >
                            {subtitle.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Plein écran */}
                <button
                  onClick={toggleFullscreen}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedVideoPlayer;
