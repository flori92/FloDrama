// Mock pour @lynx/core
module.exports = {
  // Composants de base
  View: 'div',
  Text: 'span',
  Image: 'img',
  
  // Utilitaires
  createRoot: jest.fn(),
  render: jest.fn(),
  
  // Gestionnaires d'événements
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  
  // Autres fonctionnalités
  getInitData: jest.fn().mockReturnValue({}),
  runOnMainThread: jest.fn(fn => fn()),
  runOnBackground: jest.fn(fn => fn())
};
