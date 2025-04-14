declare module '@lynx-js/core' {
  import React from 'react';
  
  export const View: React.FC<{
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }>;
  
  export const Text: React.FC<{
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }>;
  
  export const Video: React.ForwardRefExoticComponent<{
    src?: string;
    className?: string;
    autoPlay?: boolean;
    crossOrigin?: string;
    onMouseMove?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    onEnded?: () => void;
    [key: string]: any;
  } & React.RefAttributes<HTMLVideoElement>>;
}

declare module '@lynx-js/hooks' {
  export function useHotkeys(options: {
    [key: string]: () => void;
  }): void;
}
