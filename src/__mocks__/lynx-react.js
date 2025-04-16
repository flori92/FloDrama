// Mock pour @lynx/react
const React = require('react');

module.exports = {
  // Hooks personnalisés
  useMainThreadRef: jest.fn().mockReturnValue({ current: {} }),
  useLynxGlobalEventListener: jest.fn(),
  useInitData: jest.fn().mockReturnValue({}),
  
  // Composants React adaptés
  View: props => React.createElement('div', props),
  Text: props => React.createElement('span', props),
  Image: props => React.createElement('img', props),
  
  // Fonctions utilitaires
  createRoot: jest.fn(),
  render: jest.fn()
};
