declare module '@testing-library/react' {
  import { ReactElement } from 'react';

  interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    hydrate?: boolean;
    wrapper?: React.ComponentType<any>;
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
    queryByText: (text: string | RegExp) => HTMLElement | null;
    queryByTestId: (testId: string) => HTMLElement | null;
    findByText: (text: string | RegExp) => Promise<HTMLElement>;
    findByTestId: (testId: string) => Promise<HTMLElement>;
    getAllByText: (text: string | RegExp) => HTMLElement[];
    getAllByTestId: (testId: string) => HTMLElement[];
  }

  export function render(
    ui: ReactElement,
    options?: RenderOptions
  ): RenderResult;

  export const fireEvent: {
    click: (element: Element | null) => boolean;
    change: (element: Element | null, options?: { target: { value: string } }) => boolean;
    submit: (element: Element | null) => boolean;
    keyDown: (element: Element | null, options?: object) => boolean;
    keyUp: (element: Element | null, options?: object) => boolean;
    keyPress: (element: Element | null, options?: object) => boolean;
    focus: (element: Element | null) => boolean;
    blur: (element: Element | null) => boolean;
  };

  export function cleanup(): void;
  export function waitFor<T>(callback: () => T | Promise<T>, options?: object): Promise<T>;
  export function waitForElementToBeRemoved<T>(callback: () => T | Promise<T>, options?: object): Promise<void>;
}
