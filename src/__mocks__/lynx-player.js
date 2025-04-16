// Mock pour @lynx/player
const React = require('react');

module.exports = {
  // Composant de lecture vidéo
  VideoPlayer: props => React.createElement('div', {
    className: 'lynx-video-player',
    'data-testid': 'lynx-video-player',
    ...props
  }, 'Mock Video Player'),
  
  // Contrôles de lecture
  PlayButton: props => React.createElement('button', {
    className: 'lynx-play-button',
    ...props
  }, 'Play'),
  
  PauseButton: props => React.createElement('button', {
    className: 'lynx-pause-button',
    ...props
  }, 'Pause'),
  
  // Événements de lecture
  onPlay: jest.fn(),
  onPause: jest.fn(),
  onError: jest.fn(),
  onEnd: jest.fn()
};
