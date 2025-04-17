/** @jsxImportSource react */
// L'import de React est nécessaire pour les mocks et les tests
// @ts-ignore - Ignorer l'avertissement d'import non utilisé
import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock du composant BrowserRouter pour éviter les problèmes avec React Router
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: any }) => <div>{children}</div>,
  Routes: ({ children }: { children: any }) => <div>{children}</div>,
  Route: () => <div>Route mockée</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children }: { children: any }) => <a href="/#">{children}</a>
}));

// Mock des composants React
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    useEffect: jest.fn((fn) => fn()),
    useState: jest.fn((initialState) => [initialState, jest.fn()])
  };
});

// Mock du composant VideoPlayer
jest.mock('./components/video/VideoPlayer', () => {
  return function MockVideoPlayer(props: any) {
    return <div data-testid="video-player">{props.title}</div>;
  };
});

// Mock du service vidéo
jest.mock('./services/video/VideoService', () => ({
  VideoService: {
    getInstance: () => ({
      getVideos: () => [
        {
          id: '1',
          title: 'Découverte de la Normandie',
          description: 'Une visite guidée de la Normandie',
          thumbnail: 'normandie.jpg',
          url: 'video-normandie.mp4'
        },
        {
          id: '2',
          title: 'Les Secrets de Paris',
          description: 'Exploration des quartiers cachés de Paris',
          thumbnail: 'paris.jpg',
          url: 'video-paris.mp4'
        }
      ]
    })
  }
}));

// Mock des composants Lynx
jest.mock('./adapters/lynx-components', () => ({
  View: ({ children, testID, ...props }: any) => (
    <div data-testid={testID} {...props}>{children}</div>
  ),
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Image: ({ source, ...props }: any) => <img src={source?.uri} alt="" {...props} />
}));

describe('Environnement de test', () => {
  test('peut rendre un composant simple', () => {
    const SimpleComponent = () => {
      return <div>Test d'environnement</div>;
    };
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Test d\'environnement')).toBeInTheDocument();
  });
});

describe('App Component', () => {
  beforeEach(() => {
    // Configuration de l'environnement de test
    (global as any).ReactRuntime = {
      initialize: jest.fn(),
      render: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('le composant App peut être rendu sans erreur', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
