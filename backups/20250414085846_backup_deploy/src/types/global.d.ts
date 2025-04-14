/// <reference types="react" />
/// <reference types="node" />
/// <reference types="jest" />

declare namespace JSX {
  interface IntrinsicElements {
    div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    video: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
    source: React.DetailedHTMLProps<React.SourceHTMLAttributes<HTMLSourceElement>, HTMLSourceElement>;
    button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
    select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
    option: React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      LynxRuntime: {
        initialize: jest.Mock;
        render: jest.Mock;
      };
    }
  }

  interface Window {
    LynxRuntime: {
      initialize: () => void;
      render: () => void;
    };
  }
}

declare module '@lynx/react' {
  export * from 'react';
  export { default } from 'react';
}

declare module '@lynx/player' {
  export interface PlayerConfig {
    videoUrl: string;
    autoplay?: boolean;
    controls?: boolean;
    muted?: boolean;
    volume?: number;
    quality?: {
      default?: string;
      options?: string[];
    };
    monitoring?: {
      enabled?: boolean;
      interval?: number;
    };
  }

  export class LynxPlayer {
    constructor(config: PlayerConfig);
    play(): void;
    pause(): void;
    setQuality(quality: string): void;
    setVolume(volume: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
  }
}

export {};
