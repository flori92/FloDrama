/// <reference types="jest" />
import { ReactElement, JSXElementConstructor } from 'react';

declare global {
  namespace NodeJS {
    interface Global {
      LynxRuntime: {
        initialize: jest.Mock;
        render: jest.Mock;
      };
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      video: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    }
  }
}

declare module '@lynx/react/testing' {
  export interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    wrapper?: React.ComponentType;
  }

  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement | DocumentFragment) => void;
    rerender: (ui: ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
    getByText: (text: string | RegExp) => HTMLElement;
    getByTestId: (testId: string) => HTMLElement;
    findByText: (text: string | RegExp) => Promise<HTMLElement>;
    findByTestId: (testId: string) => Promise<HTMLElement>;
  }

  export function render(
    ui: ReactElement<any, string | JSXElementConstructor<any>>,
    options?: RenderOptions
  ): RenderResult;

  export const fireEvent: {
    click: (element: Element | null) => boolean;
    change: (element: Element | null, options?: { target: { value: string } }) => boolean;
    submit: (element: Element | null) => boolean;
  };

  export function cleanup(): void;
  export function waitFor<T>(callback: () => T | Promise<T>): Promise<T>;
}

declare module '@lynx/react' {
  import * as React from 'react';
  export * from 'react';
  export default React;

  export interface LynxComponentProps {
    'data-testid'?: string;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface VideoPlayerProps extends LynxComponentProps {
    src: string;
    title: string;
    poster?: string;
    autoPlay?: boolean;
    onError?: (error: Error) => void;
  }
}
