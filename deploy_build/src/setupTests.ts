/// <reference types="@types/jest" />
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Configuration globale pour les tests
global.beforeEach(() => {
  // Réinitialisation de l'environnement de test avant chaque test
  jest.clearAllMocks();
});

global.afterEach(() => {
  // Nettoyage après chaque test
  cleanup();
});

// Configuration des timeouts pour les tests asynchrones
jest.setTimeout(10000); // 10 secondes

interface VideoPlayerProps {
  onError?: (error: Error) => void;
  onPlay?: () => void;
  videoUrl?: string;
  title?: string;
  poster?: string;
}

// Configuration des mocks pour le lecteur vidéo
jest.mock('./components/video/VideoPlayer', () => {
  const MockVideoPlayer = jest.fn().mockImplementation(({ onError, onPlay }: VideoPlayerProps) => {
    // Simulation d'erreur pour les tests
    if (onError) {
      setTimeout(() => {
        onError(new Error('Erreur de lecture vidéo'));
      }, 100);
    }
    
    return {
      play: jest.fn().mockImplementation(() => {
        if (onPlay) onPlay();
        return Promise.resolve();
      }),
      pause: jest.fn().mockImplementation(() => Promise.resolve()),
      seek: jest.fn().mockImplementation(() => Promise.resolve()),
      getCurrentTime: jest.fn().mockImplementation(() => Promise.resolve(0)),
      getDuration: jest.fn().mockImplementation(() => Promise.resolve(100)),
      on: jest.fn(),
      off: jest.fn()
    };
  });
  
  return MockVideoPlayer;
});
