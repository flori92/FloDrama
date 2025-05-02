// jest.setup.js
import '@testing-library/jest-dom';

// Mock des variables d'environnement
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'example-anon-key';

// Mock global fetch
global.fetch = jest.fn();

// Mock import.meta.env pour Jest (support des variables Vite dans les tests)
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      // Ajoute ici toutes les variables d'environnement nécessaires à tes tests
    }
  }
};

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
