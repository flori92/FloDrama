/**
 * Adaptateur pour @lynx/core
 * 
 * Ce fichier sert d'adaptateur pour le package @lynx/core qui n'est pas disponible publiquement.
 * Il implémente des composants React qui simulent le comportement des composants Lynx.
 */

import React, { CSSProperties, useRef, useEffect } from 'react';

// Types pour les props des composants Lynx
interface LynxViewProps {
  style?: CSSProperties;
  testID?: string;
  children?: React.ReactNode;
}

interface LynxTextProps {
  style?: CSSProperties;
  testID?: string;
  children?: React.ReactNode;
}

interface LynxImageProps {
  source: { uri: string };
  style?: CSSProperties;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  testID?: string;
  alt?: string;
}

interface LynxVideoProps {
  source: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onBufferedChange?: (buffered: number) => void;
  style?: CSSProperties;
  testID?: string;
}

interface LynxScrollViewProps {
  children?: React.ReactNode;
  style?: CSSProperties;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: CSSProperties;
  onScroll?: (event: { x: number; y: number }) => void;
  testID?: string;
}

type ObjectFit = 'cover' | 'contain' | 'fill' | 'none';

// Implémentation des composants Lynx avec des composants React standard
export const LynxView: React.FC<LynxViewProps> = ({ style, testID, children }) => {
  return (
    <div data-testid={testID} style={style}>
      {children}
    </div>
  );
};

export const LynxText: React.FC<LynxTextProps> = ({ style, testID, children }) => {
  return (
    <span data-testid={testID} style={style}>
      {children}
    </span>
  );
};

export const LynxImage: React.FC<LynxImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  onLoad,
  onError,
  testID,
  alt = '',
}) => {
  const getObjectFit = (mode: typeof resizeMode): ObjectFit => {
    switch (mode) {
      case 'stretch':
        return 'fill';
      case 'center':
        return 'none';
      default:
        return mode;
    }
  };

  return (
    <img
      src={source.uri}
      style={{
        ...style,
        objectFit: getObjectFit(resizeMode),
      }}
      onLoad={onLoad}
      onError={() => onError?.(new Error('Image loading failed'))}
      data-testid={testID}
      alt={alt}
    />
  );
};

export const LynxVideo: React.FC<LynxVideoProps> = ({
  source,
  poster,
  autoplay = false,
  onPlay,
  onPause,
  onEnded,
  onError,
  onTimeUpdate,
  onDurationChange,
  style,
  testID,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => onPlay && onPlay();
    const handlePause = () => onPause && onPause();
    const handleEnded = () => onEnded && onEnded();
    const handleError = () => onError && onError(new Error('Erreur de lecture vidéo'));
    const handleTimeUpdate = () => onTimeUpdate && video.currentTime && onTimeUpdate(video.currentTime);
    const handleDurationChange = () => onDurationChange && video.duration && onDurationChange(video.duration);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [onPlay, onPause, onEnded, onError, onTimeUpdate, onDurationChange]);

  return (
    <video
      ref={videoRef}
      src={source}
      poster={poster}
      autoPlay={autoplay}
      style={style}
      data-testid={testID}
      controls
    />
  );
};

export const LynxScrollView: React.FC<LynxScrollViewProps> = ({
  children,
  style,
  horizontal,
  contentContainerStyle,
  onScroll,
  testID,
}) => {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      const target = e.currentTarget;
      onScroll({
        x: target.scrollLeft,
        y: target.scrollTop,
      });
    }
  };

  const scrollStyle: CSSProperties = {
    overflowX: horizontal ? 'auto' : 'hidden',
    overflowY: horizontal ? 'hidden' : 'auto',
    WebkitOverflowScrolling: 'touch',
    ...style,
  };

  return (
    <div
      style={scrollStyle}
      onScroll={handleScroll}
      data-testid={testID}
    >
      <div style={contentContainerStyle}>
        {children}
      </div>
    </div>
  );
};

// Service Lynx pour la gestion de la configuration
export class LynxService {
  protected config: any;
  protected events: any;

  constructor() {
    this.config = {};
    this.events = {};
  }

  async configure(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
    return Promise.resolve();
  }
}
