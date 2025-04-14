declare module 'react-dom' {
  import { ReactElement } from 'react';

  function render(element: ReactElement, container: Element | null): void;
  function unmountComponentAtNode(container: Element | null): boolean;
  function createPortal(children: ReactElement, container: Element): ReactElement;

  const version: string;

  export { render, unmountComponentAtNode, createPortal, version };
}
