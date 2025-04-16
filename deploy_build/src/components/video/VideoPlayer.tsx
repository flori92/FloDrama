import React from 'react';
import type { FC, SyntheticEvent } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onQualityChange?: (quality: string) => void;
}

interface PlayerMetrics {
  currentTime: number;
  duration: number;
  buffered: number;
  quality: string;
}

const VideoPlayer: FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  poster,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
  onError,
  onQualityChange
}) => {
  const [isPlaying, setIsPlaying] = React.useState(autoplay);
  const [metrics, setMetrics] = React.useState<PlayerMetrics>({
    currentTime: 0,
    duration: 0,
    buffered: 0,
    quality: 'auto'
  });

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handlePlay = React.useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = React.useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = React.useCallback(() => {
    setIsPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const handleError = React.useCallback((error: Error) => {
    onError?.(error);
  }, [onError]);

  const handleQualityChange = React.useCallback((quality: string) => {
    setMetrics(prev => ({ ...prev, quality }));
    onQualityChange?.(quality);
  }, [onQualityChange]);

  const handleTimeUpdate = React.useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setMetrics(prev => ({
        ...prev,
        currentTime: video.currentTime
      }));
    }
  }, []);

  const handleDurationChange = React.useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setMetrics(prev => ({
        ...prev,
        duration: video.duration
      }));
    }
  }, []);

  const handleProgress = React.useCallback(() => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0) {
      const buffered = video.buffered.end(video.buffered.length - 1);
      setMetrics(prev => ({
        ...prev,
        buffered
      }));
    }
  }, []);

  const togglePlayPause = React.useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play().catch(error => handleError(error));
      } else {
        video.pause();
      }
    }
  }, [handleError]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return React.createElement('div', {
    style: {
      width: '100%',
      maxWidth: 1280,
      backgroundColor: '#1a1a1a',
      borderRadius: 8,
      overflow: 'hidden'
    },
    'data-testid': 'video-player-container'
  }, 
    React.createElement('video', {
      key: 'video',
      ref: videoRef,
      src: videoUrl,
      poster: poster,
      autoPlay: autoplay,
      onPlay: handlePlay,
      onPause: handlePause,
      onEnded: handleEnded,
      onError: (e: SyntheticEvent<HTMLVideoElement, Event>) => {
        const target = e.currentTarget as HTMLVideoElement;
        if (target && target.error) {
          handleError(new Error(target.error.message || "Erreur de lecture vidéo"));
        } else {
          handleError(new Error("Erreur inconnue lors de la lecture"));
        }
      },
      onTimeUpdate: handleTimeUpdate,
      onDurationChange: handleDurationChange,
      onProgress: handleProgress,
      style: {
        width: '100%',
        aspectRatio: '16/9'
      },
      'data-testid': 'video-element'
    }),
    React.createElement('div', {
      key: 'controls',
      style: {
        padding: 16,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      },
      'data-testid': 'video-controls'
    },
      React.createElement('button', {
        key: 'play-pause',
        onClick: togglePlayPause,
        style: {
          backgroundColor: '#007aff',
          padding: 8,
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
          color: '#ffffff'
        },
        'data-testid': 'play-pause-button'
      }, isPlaying ? 'Pause' : 'Lecture'),
      React.createElement('div', {
        key: 'time',
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          color: '#ffffff'
        },
        'data-testid': 'time-display'
      }, `${formatTime(metrics.currentTime)} / ${formatTime(metrics.duration)}`),
      React.createElement('div', {
        key: 'quality',
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          color: '#ffffff'
        },
        'data-testid': 'quality-selector',
        onClick: () => handleQualityChange('hd')
      }, `Qualité: ${metrics.quality}`)
    ),
    React.createElement('h2', {
      key: 'title',
      style: {
        padding: 16,
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        margin: 0
      },
      'data-testid': 'video-title'
    }, title)
  );
};

export default VideoPlayer;
