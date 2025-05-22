/**
 * Configuration de l'authentification Google pour FloDrama
 * Ce fichier contient les paramètres spécifiques à l'authentification Google
 */

// ID client OAuth Google
export const GOOGLE_CLIENT_ID = '791063237298-gddcp2gov7b9nbh0v77qdtb5borgj4sb.apps.googleusercontent.com';

// URLs de redirection autorisées
export const REDIRECT_URIS = [
  'https://5244e28e.flodrama-frontend.pages.dev/auth/google/callback',
  'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev/auth/google/callback',
  'https://flodrama.com/auth/google/callback',
  'http://localhost:5173/auth/google/callback'
];

// Domaines autorisés
export const AUTHORIZED_DOMAINS = [
  'https://5244e28e.flodrama-frontend.pages.dev',
  'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev',
  'https://flodrama.com',
  'http://localhost:5173'
];

// Configuration de l'authentification Google
export const GOOGLE_AUTH_CONFIG = {
  client_id: GOOGLE_CLIENT_ID,
  redirect_uri: window.location.hostname.includes('localhost') 
    ? 'http://localhost:5173/auth/google/callback'
    : window.location.hostname.includes('5244e28e') 
      ? 'https://5244e28e.flodrama-frontend.pages.dev/auth/google/callback'
      : window.location.hostname.includes('identite-visuelle-flodrama')
        ? 'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev/auth/google/callback'
        : 'https://flodrama.com/auth/google/callback',
  scope: 'email profile',
  response_type: 'token'
};
