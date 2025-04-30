// Test du service d'analytics
import analytics from '@services/analytics';

// Mock de createClient et des méthodes Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null }))
    })),
    auth: {
      session: jest.fn(() => ({ user: { id: 'test-user-id' } }))
    }
  }))
}));

// Mock des variables d'environnement
beforeAll(() => {
  // Ces valeurs sont déjà mockées dans jest.setup.js
  // mais on les redéfinit ici pour être sûr
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://flodrama.com/films',
      pathname: '/films'
    },
    writable: true
  });
  
  Object.defineProperty(document, 'referrer', {
    value: 'https://google.com',
    writable: true
  });
  
  Object.defineProperty(document, 'title', {
    value: 'FloDrama - Films',
    writable: true
  });
});

describe('Service Analytics', () => {
  it('devrait être défini', () => {
    expect(analytics).toBeDefined();
  });

  // Autres tests à implémenter quand le service sera utilisé dans l'application
});
