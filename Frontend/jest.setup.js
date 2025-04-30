// jest.setup.js
import '@testing-library/jest-dom';

// Mock des variables d'environnement
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'example-anon-key';

// Mock global fetch
global.fetch = jest.fn();

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
