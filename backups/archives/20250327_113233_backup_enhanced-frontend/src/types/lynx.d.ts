declare module '@lynx/react' {
  export * from 'react';
  export { default } from 'react';
}

declare module '@lynx/core' {
  import { FC, CSSProperties, ReactNode } from 'react';

  interface LynxViewProps {
    style?: CSSProperties;
    testID?: string;
    children?: ReactNode;
  }

  interface LynxButtonProps {
    onPress?: () => void;
    style?: CSSProperties;
    testID?: string;
    children?: ReactNode;
  }

  interface LynxTextProps {
    style?: CSSProperties;
    testID?: string;
    children?: ReactNode;
  }

  interface LynxVideoProps {
    source: string;
    poster?: string;
    autoplay?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    onError?: (error: Error) => void;
    onQualityChange?: (quality: string) => void;
    onTimeUpdate?: (currentTime: number) => void;
    onDurationChange?: (duration: number) => void;
    onBufferedChange?: (buffered: number) => void;
    style?: CSSProperties;
    testID?: string;
  }

  interface LynxImageProps {
    source: { uri: string } | number;
    style?: CSSProperties;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
    onLoad?: () => void;
    onError?: (error: Error) => void;
    testID?: string;
  }

  interface LynxScrollViewProps {
    children?: ReactNode;
    style?: CSSProperties;
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    contentContainerStyle?: CSSProperties;
    onScroll?: (event: { x: number; y: number }) => void;
    testID?: string;
  }

  interface LynxTouchableProps {
    onPress?: () => void;
    children?: ReactNode;
    style?: CSSProperties;
    disabled?: boolean;
    testID?: string;
  }

  interface LynxTextInputProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    style?: CSSProperties;
    secureTextEntry?: boolean;
    multiline?: boolean;
    maxLength?: number;
    testID?: string;
  }

  interface LynxSpinnerProps {
    color?: string;
    size?: 'small' | 'large';
    style?: CSSProperties;
    testID?: string;
  }

  interface LynxProviderProps {
    children?: ReactNode;
    theme?: any;
  }

  export const LynxView: FC<LynxViewProps>;
  export const LynxText: FC<LynxTextProps>;
  export const LynxImage: FC<LynxImageProps>;
  export const LynxButton: FC<LynxButtonProps>;
  export const LynxScrollView: FC<LynxScrollViewProps>;
  export const LynxTouchable: FC<LynxTouchableProps>;
  export const LynxTextInput: FC<LynxTextInputProps>;
  export const LynxSpinner: FC<LynxSpinnerProps>;
  export const LynxProvider: FC<LynxProviderProps>;
  export const LynxVideo: FC<LynxVideoProps>;

  export class LynxService {
    protected config: any;
    protected events: any;
    constructor();
    configure(config: any): Promise<void>;
  }
}

declare module '@lynx/hooks' {
  interface Theme {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      error: string;
      text: string;
      onPrimary: string;
      onSecondary: string;
      onBackground: string;
      onSurface: string;
      onError: string;
    };
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    radius: {
      sm: number;
      md: number;
      lg: number;
    };
    fontSize: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  }

  export function useTheme(): Theme;

  export function useNavigation(): {
    navigate: (route: string, params?: any) => void;
    goBack: () => void;
    replace: (route: string, params?: any) => void;
  };
}

declare module '@lynx/theme' {
  import { ReactNode } from 'react';

  interface ThemeProviderProps {
    theme: any;
    children: ReactNode;
  }

  export const ThemeProvider: React.FC<ThemeProviderProps>;
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

declare module '@lynx/navigation' {
  export interface NavigationProps {
    initialRouteName: string;
    children: ReactNode;
  }

  export const NavigationContainer: React.FC<NavigationProps>;
  export const createStackNavigator: () => {
    Navigator: React.FC<any>;
    Screen: React.FC<any>;
  };
}
