// Déclarations de types pour les modules Lynx

declare module '@lynx/core' {
  export const createRoot: (container: HTMLElement) => any;
  export const runOnMainThread: (callback: () => void) => void;
  export const runOnBackground: (callback: () => void) => void;
  export const initialize: (options: any) => void;
}

declare module '@lynx/react' {
  import React from 'react';
  
  export const useMainThreadRef: () => React.RefObject<any>;
  export const useLynxGlobalEventListener: (event: string, callback: (data: any) => void) => void;
  export const useInitData: () => any;
  
  export interface ViewProps {
    testID?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface TextProps {
    style?: React.CSSProperties;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface ImageProps {
    source?: { uri: string };
    style?: React.CSSProperties;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    [key: string]: any;
  }
  
  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const Image: React.FC<ImageProps>;
}

declare module '@lynx/player' {
  import React from 'react';
  
  export interface VideoPlayerProps {
    videoUrl: string;
    title: string;
    poster?: string;
    autoplay?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onError?: (error: Error) => void;
    onEnd?: () => void;
  }
  
  export const VideoPlayer: React.FC<VideoPlayerProps>;
}

declare module '@lynx/web' {
  export const initialize: (options: any) => void;
  export const getDeviceInfo: () => any;
}
