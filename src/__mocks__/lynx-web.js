// Mock pour @lynx/web
module.exports = {
  // Fonctions spécifiques à la plateforme web
  initialize: jest.fn(),
  
  // Utilitaires de navigation
  navigate: jest.fn(),
  goBack: jest.fn(),
  
  // Gestionnaires d'événements web
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  
  // Autres fonctionnalités web
  getWindowSize: jest.fn().mockReturnValue({ width: 1024, height: 768 }),
  getDeviceInfo: jest.fn().mockReturnValue({ platform: 'web', userAgent: 'test' })
};
