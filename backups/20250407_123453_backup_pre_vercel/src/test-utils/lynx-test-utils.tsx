import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Types pour simuler l'environnement Lynx
interface LynxThread {
  postMessage: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
}

interface LynxTestContext {
  mainThread: LynxThread;
  backgroundThread: LynxThread;
}

// Options de rendu étendues pour Lynx
interface LynxRenderOptions extends RenderOptions {
  initialLynxState?: Record<string, unknown>;
}

// Création d'un contexte de test Lynx
const createLynxTestContext = (): LynxTestContext => ({
  mainThread: {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  backgroundThread: {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

// Wrapper pour fournir le contexte Lynx
const LynxTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="lynx-root">
      {children}
    </div>
  );
};

// Fonction de rendu personnalisée pour les tests
export const renderWithLynx = (
  ui: React.ReactElement,
  options: LynxRenderOptions = {}
) => {
  const lynxContext = createLynxTestContext();
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <LynxTestWrapper>
      {children}
    </LynxTestWrapper>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    lynxContext
  };
};

// Mock des fonctions Lynx pour les tests
export const mockLynxAPI = {
  runOnMainThread: (fn: () => void) => fn(),
  runOnBackground: (fn: () => void) => setTimeout(fn, 0),
  getInitData: () => ({}),
  createRoot: () => ({
    render: (element: React.ReactElement) => element
  })
};

// Utilitaires pour les tests
export const createTestId = (componentName: string, suffix?: string) => 
  `lynx-${componentName}${suffix ? `-${suffix}` : ''}`;

export const getLynxElement = (container: HTMLElement, testId: string) =>
  container.querySelector(`[data-testid="${testId}"]`);

// Types pour les props de test
export interface LynxTestProps {
  testID?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

// Re-export des utilitaires de test React Testing Library
export * from '@testing-library/react';
