import '@lynx/core/testing';
import { I18nManager } from '@lynx/core';
import { i18nConfig } from '../i18n/config';

// Configuration de l'environnement de test
beforeAll(() => {
  // Initialisation du gestionnaire de traductions
  I18nManager.init(i18nConfig);
  
  // Mock des API natives
  global.fetch = jest.fn();
  
  // Mock du localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
  };
  global.localStorage = localStorageMock;
  
  // Mock des dimensions de l'écran
  global.window.innerWidth = 1024;
  global.window.innerHeight = 768;
});

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// Configuration des matchers personnalisés
expect.extend({
  toBeValidComponent(received) {
    const pass = received && typeof received.type === 'function';
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid component`
        : `Expected ${received} to be a valid component`
    };
  }
});
