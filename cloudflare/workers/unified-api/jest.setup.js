// Configuration globale pour les tests Jest
global.fetch = jest.fn();

// Réinitialiser les mocks avant chaque test
beforeEach(() => {
  jest.resetAllMocks();
  
  // Mock par défaut pour fetch
  global.fetch.mockImplementation(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  );
});

// Nettoyer après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
