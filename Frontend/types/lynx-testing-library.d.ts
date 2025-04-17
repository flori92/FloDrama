declare module '@lynx/testing-library' {
  import { ReactElement } from 'react';

  export interface RenderResult {
    getByText: (text: string) => HTMLElement;
    getByTestId: (testId: string) => HTMLElement;
    container: HTMLElement;
    rerender: (ui: ReactElement) => void;
    unmount: () => void;
  }

  export function render(ui: ReactElement): RenderResult;

  export const fireEvent: {
    click: (element: HTMLElement) => void;
    press: (element: HTMLElement) => void;
    change: (element: HTMLElement, options: { target: { value: string } }) => void;
  };

  export function cleanup(): void;

  export function waitFor(callback: () => void | Promise<void>, options?: {
    timeout?: number;
    interval?: number;
  }): Promise<void>;

  export function within(element: HTMLElement): RenderResult;
}
