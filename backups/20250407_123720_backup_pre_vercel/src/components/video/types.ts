import { PlayerConfig } from '@lynx/player';

export type VideoQuality = 'auto' | '1080p' | '720p' | '480p' | '360p';

export interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onQualityChange?: (quality: VideoQuality) => void;
}

export interface PlayerMetrics {
  bufferingTime: number;
  playbackQuality: VideoQuality;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface VideoPlayerConfig extends PlayerConfig {
  videoUrl: string;
  autoplay: boolean;
  controls: boolean;
  muted: boolean;
  volume: number;
  quality: {
    default: VideoQuality;
    options: VideoQuality[];
  };
  monitoring: {
    enabled: boolean;
    interval: number;
  };
}
