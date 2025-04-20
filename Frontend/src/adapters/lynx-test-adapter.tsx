import React from 'react';
import { render } from '@testing-library/react';

// Adaptateur pour les tests uniquement
export const renderWithLynx = (ui: React.ReactElement) => {
  const mockLynxContext = {
    mainThread: {
      current: {
        postMessage: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
    },
    backgroundThread: {
      current: {
        postMessage: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
    }
  };

  return {
    ...render(ui),
    lynxContext: mockLynxContext
  };
};

// Mock des fonctions Lynx pour les tests
export const mockLynxFunctions = {
  runOnMainThread: (fn: () => void) => fn(),
  runOnBackground: (fn: () => void) => fn(),
  getInitData: () => ({}),
  createRoot: () => ({
    render: (element: React.ReactElement) => element
  })
};

// Types pour les tests
export interface TestRenderOptions {
  withLynxContext?: boolean;
  mockInitData?: Record<string, unknown>;
}

// Utilitaires de test spécifiques à Lynx
export const createTestProps = <T extends Record<string, unknown>>(props: T) => ({
  testID: 'test-component',
  ...props
});
