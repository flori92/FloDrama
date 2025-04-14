declare module '@lynx/player' {
  export interface PlayerConfig {
    videoUrl: string;
    title?: string;
    poster?: string;
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
    quality?: {
      default?: string;
      options?: string[];
    };
  }

  export interface PlayerEvents {
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    onError?: (error: Error) => void;
    onQualityChange?: (quality: string) => void;
  }

  export interface PlayerStats {
    buffered: number;
    duration: number;
    currentTime: number;
    volume: number;
    quality: string;
    state: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  }

  export class LynxPlayer {
    constructor(config: PlayerConfig);
    configure(config: Partial<PlayerConfig>): void;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    seek(time: number): void;
    setVolume(volume: number): void;
    setQuality(quality: string): void;
    getStats(): PlayerStats;
    on<K extends keyof PlayerEvents>(event: K, handler: PlayerEvents[K]): void;
    off<K extends keyof PlayerEvents>(event: K, handler: PlayerEvents[K]): void;
    destroy(): void;
  }
}
