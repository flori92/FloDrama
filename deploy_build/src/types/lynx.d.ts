// Types pour simuler les composants Lynx
declare module '@lynx-js/core' {
  export interface LynxComponentProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface ViewProps extends LynxComponentProps {
    layout?: 'linear' | 'flex' | 'grid' | 'relative';
    direction?: 'row' | 'column';
  }

  export interface TextProps extends LynxComponentProps {
    numberOfLines?: number;
    selectable?: boolean;
  }

  export interface ImageProps extends LynxComponentProps {
    src: string;
    mode?: 'cover' | 'contain' | 'center';
    loading?: 'lazy' | 'eager';
  }
}

declare module '@lynx-js/react' {
  import { ViewProps, TextProps, ImageProps } from '@lynx-js/core';
  import React from 'react';

  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const Image: React.FC<ImageProps>;

  export function useMainThreadRef<T>(): React.RefObject<T>;
  export function useLynxGlobalEventListener(
    event: string,
    callback: (data: any) => void
  ): void;
  export function useInitData<T>(): T;
}

declare module '@lynx-js/runtime' {
  export function runOnMainThread<T>(callback: () => T): Promise<T>;
  export function runOnBackground<T>(callback: () => T): Promise<T>;
  export function createRoot(
    container: Element,
    options?: { hydrate?: boolean }
  ): { render: (element: React.ReactNode) => void };
}
