/**
 * EnhancedVideoPlayer
 * 
 * Composant de lecteur vidéo amélioré qui utilise VideoPlaybackService
 * pour gérer la récupération des URLs et la lecture des vidéos
 */

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from '../../adapters/react-native-adapter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faExpand, faCompress, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';
import VideoPlayer from './VideoPlayer';
import videoPlaybackService from '../../services/VideoPlaybackService';
import { useTheme } from '../../hooks/useTheme';

/**
 * Composant de lecteur vidéo amélioré
 */
const EnhancedVideoPlayer = forwardRef(({
  contentId,
  title,
  poster,
  autoPlay = false,
  controls = true,
  onTimeUpdate,
  onPlayStateChange,
  onError,
  onEnded,
  style,
  showQualitySelector = true,
}, ref) => {
  const { colors } = useTheme();
  const videoRef = useRef(null);
  const playerId = useRef(`player-${Date.now()}`).current;
  
  // États
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  
  // Initialiser le lecteur
  useEffect(() => {
    // Nettoyer lors du démontage
    return () => {
      videoPlaybackService.destroyPlayer(playerId);
    };
  }, [playerId]);
  
  // Charger la vidéo lorsque contentId change
  useEffect(() => {
    const loadVideo = async () => {
      if (!contentId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Initialiser le lecteur si nécessaire
        if (videoRef.current && !videoPlaybackService.playerInstances.has(playerId)) {
          videoPlaybackService.initializePlayer(playerId, videoRef.current);
        }
        
        // Charger la vidéo
        const success = await videoPlaybackService.loadVideo(playerId, contentId, {
          autoplay: autoPlay,
          volume,
          muted: isMuted,
        });
        
        if (!success) {
          throw new Error('Impossible de charger la vidéo');
        }
        
        // Récupérer les informations du lecteur
        const playerInstance = videoPlaybackService.playerInstances.get(playerId);
        if (playerInstance) {
          setAvailableQualities(playerInstance.qualities || []);
          setCurrentQuality(playerInstance.currentQuality || null);
          setVideoUrl(playerInstance.currentSource?.url || '');
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la vidéo:', err);
        setError(err.message || 'Erreur lors du chargement de la vidéo');
        
        if (onError) {
          onError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVideo();
  }, [contentId, playerId, autoPlay, volume, isMuted, onError]);
  
  // Gérer les événements du lecteur
  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  }, [onTimeUpdate]);
  
  const handlePlayStateChange = useCallback((playing) => {
    setIsPlaying(playing);
    
    if (onPlayStateChange) {
      onPlayStateChange(playing);
    }
  }, [onPlayStateChange]);
  
  const handleDurationChange = useCallback((newDuration) => {
    setDuration(newDuration);
  }, []);
  
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    videoPlaybackService.setVolume(playerId, newVolume);
  }, [playerId]);
  
  const handleMuteToggle = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    videoPlaybackService.setMuted(playerId, newMutedState);
  }, [playerId, isMuted]);
  
  const handleFullscreenToggle = useCallback(() => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    videoPlaybackService.setFullscreen(playerId, newFullscreenState);
  }, [playerId, isFullscreen]);
  
  const handleQualityChange = useCallback((resolution) => {
    videoPlaybackService.changeQuality(playerId, resolution);
    setShowQualityMenu(false);
    
    // Mettre à jour la qualité actuelle
    const playerInstance = videoPlaybackService.playerInstances.get(playerId);
    if (playerInstance) {
      setCurrentQuality(playerInstance.currentQuality || null);
    }
  }, [playerId]);
  
  // Exposer les méthodes via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      videoPlaybackService.playPause(playerId, true);
    },
    pause: () => {
      videoPlaybackService.playPause(playerId, false);
    },
    seekTo: (time) => {
      videoPlaybackService.seek(playerId, time);
    },
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    isPlaying: () => isPlaying,
  }));
  
  // Rendu du sélecteur de qualité
  const renderQualitySelector = () => {
    if (!showQualitySelector || availableQualities.length <= 1) {
      return null;
    }
    
    return (
      <View style={styles.qualityContainer}>
        <TouchableOpacity 
          style={[styles.qualityButton, { backgroundColor: colors.background2 }]}
          onPress={() => setShowQualityMenu(!showQualityMenu)}
        >
          <FontAwesomeIcon icon={faCog} color={colors.icon} size={14} />
          <Text style={[styles.qualityButtonText, { color: colors.text }]}>
            {currentQuality?.resolution || 'Auto'}
          </Text>
        </TouchableOpacity>
        
        {showQualityMenu && (
          <View style={[styles.qualityMenu, { backgroundColor: colors.background2 }]}>
            {availableQualities.map((quality) => (
              <TouchableOpacity
                key={quality.resolution}
                style={[
                  styles.qualityMenuItem,
                  currentQuality?.resolution === quality.resolution && { backgroundColor: colors.primary + '30' }
                ]}
                onPress={() => handleQualityChange(quality.resolution)}
              >
                <Text 
                  style={[
                    styles.qualityMenuItemText, 
                    { 
                      color: currentQuality?.resolution === quality.resolution 
                        ? colors.primary 
                        : colors.text 
                    }
                  ]}
                >
                  {quality.name} ({quality.resolution})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  // Rendu des contrôles additionnels
  const renderAdditionalControls = () => {
    return (
      <View style={styles.additionalControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleMuteToggle}
        >
          <FontAwesomeIcon 
            icon={isMuted ? faVolumeMute : faVolumeUp} 
            color={colors.icon} 
            size={16} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleFullscreenToggle}
        >
          <FontAwesomeIcon 
            icon={isFullscreen ? faCompress : faExpand} 
            color={colors.icon} 
            size={16} 
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Rendu principal
  return (
    <View style={[styles.container, style]}>
      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement de la vidéo...
          </Text>
        </View>
      ) : error ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      ) : (
        <>
          <VideoPlayer
            ref={videoRef}
            src={videoUrl}
            poster={poster}
            title={title}
            autoPlay={autoPlay}
            controls={controls}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => handlePlayStateChange(true)}
            onPause={() => handlePlayStateChange(false)}
            onDurationChange={handleDurationChange}
            onEnded={onEnded}
            onError={(e) => {
              console.error('Erreur du lecteur vidéo:', e);
              if (onError) onError(e);
            }}
          />
          
          {renderQualitySelector()}
          {renderAdditionalControls()}
        </>
      )}
    </View>
  );
});

EnhancedVideoPlayer.propTypes = {
  contentId: PropTypes.string.isRequired,
  title: PropTypes.string,
  poster: PropTypes.string,
  autoPlay: PropTypes.bool,
  controls: PropTypes.bool,
  onTimeUpdate: PropTypes.func,
  onPlayStateChange: PropTypes.func,
  onError: PropTypes.func,
  onEnded: PropTypes.func,
  style: PropTypes.object,
  showQualitySelector: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  qualityContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  qualityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
  qualityButtonText: {
    marginLeft: 5,
    fontSize: 12,
  },
  qualityMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 5,
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  qualityMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  qualityMenuItemText: {
    fontSize: 12,
  },
  additionalControls: {
    position: 'absolute',
    bottom: 60,
    right: 10,
    flexDirection: 'row',
    zIndex: 10,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default EnhancedVideoPlayer;
