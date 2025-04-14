import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VideoPlayer from './components/video/VideoPlayer';
import { View, Text, Image } from './adapters/lynx-components';

interface VideoData {
  id: string;
  title: string;
  url: string;
  poster?: string;
}

interface AppState {
  videos: VideoData[];
  currentVideo: VideoData | null;
  error: string | null;
}

const initialState: AppState = {
  videos: [
    {
      id: '1',
      title: 'Découverte de la Normandie',
      url: 'https://example.com/videos/normandie.mp4',
      poster: 'https://example.com/thumbnails/normandie.jpg'
    },
    {
      id: '2',
      title: 'Les Secrets de Paris',
      url: 'https://example.com/videos/paris.mp4',
      poster: 'https://example.com/thumbnails/paris.jpg'
    }
  ],
  currentVideo: null,
  error: null
};

// Définir un type pour les éléments React
type ReactComponent = React.ReactNode;

// Composant App défini comme une fonction standard
function App() {
  const [state, setState] = React.useState<AppState>(initialState);

  const handlePlay = React.useCallback(() => {
    console.log('Lecture démarrée');
  }, []);

  const handlePause = React.useCallback(() => {
    console.log('Lecture en pause');
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setState(prev => ({ ...prev, error: error.message }));
  }, []);

  const handleVideoSelect = React.useCallback((video: VideoData) => {
    setState(prev => ({ ...prev, currentVideo: video }));
  }, []);

  const renderVideoCard = (video: VideoData): ReactComponent => {
    return (
      <View
        key={video.id}
        testID="video-card"
        className="video-card"
        onClick={() => handleVideoSelect(video)}
        style={{
          cursor: 'pointer',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <Image
          source={{ uri: video.poster || '' }}
          style={{
            width: '100%',
            aspectRatio: '16/9',
            objectFit: 'cover'
          }}
        />
        <Text
          style={{
            padding: '1rem',
            margin: 0,
            color: '#ffffff'
          }}
        >
          {video.title}
        </Text>
      </View>
    );
  };

  const renderHeader = (): ReactComponent => {
    return (
      <View
        style={{
          marginBottom: '2rem',
          textAlign: 'center'
        }}
      >
        <Text
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#ffffff'
          }}
        >
          FloDrama
        </Text>
      </View>
    );
  };

  const renderError = (): ReactComponent => {
    return state.error ? (
      <View
        testID="error-message"
        className="error-message"
        style={{
          backgroundColor: '#ff0000',
          color: '#ffffff',
          padding: '1rem',
          borderRadius: '4px',
          marginTop: '1rem'
        }}
      >
        <Text>{state.error}</Text>
      </View>
    ) : null;
  };

  const renderVideoGrid = (): ReactComponent => {
    return (
      <View
        className="video-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}
      >
        {state.videos.map(renderVideoCard)}
      </View>
    );
  };

  const renderVideoPlayer = (): ReactComponent => {
    return state.currentVideo ? (
      <div key="video-player-container">
        <VideoPlayer
          videoUrl={state.currentVideo.url}
          title={state.currentVideo.title}
          poster={state.currentVideo.poster}
          onPlay={handlePlay}
          onPause={handlePause}
          onError={handleError}
        />
      </div>
    ) : null;
  };

  const render404 = (): ReactComponent => {
    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <Text
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#ffffff'
          }}
        >
          404 - Page non trouvée
        </Text>
        <Text
          style={{
            color: '#ffffff'
          }}
        >
          La page que vous recherchez n'existe pas.
        </Text>
      </View>
    );
  };

  return (
    <BrowserRouter>
      <View
        className="app"
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          padding: '20px'
        }}
      >
        {renderHeader()}
        {renderError()}
        <Routes>
          <Route path="/" element={
            <>
              {renderVideoGrid()}
              {renderVideoPlayer()}
            </>
          } />
          <Route path="*" element={render404()} />
        </Routes>
      </View>
    </BrowserRouter>
  );
}

// Exporter le composant App
export default App;
