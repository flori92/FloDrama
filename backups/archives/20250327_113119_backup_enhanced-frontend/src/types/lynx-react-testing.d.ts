declare module '@lynx/react/testing' {
  import { ReactElement } from 'react';

  interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    hydrate?: boolean;
    wrapper?: React.ComponentType;
  }

  interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement | DocumentFragment) => void;
    rerender: (ui: ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
    getByText: (text: string | RegExp) => HTMLElement;
    getByTestId: (testId: string) => HTMLElement;
  }

  export function render(
    ui: ReactElement,
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
