/**
 * Configuration Cloudflare pour FloDrama
 * Remplace l'ancienne configuration Firebase
 */

// URLs des API Cloudflare
export const API_BASE_URL = 'https://flodrama-api-prod.florifavi.workers.dev';
// Suppression du préfixe /api qui cause des erreurs 404
export const AUTH_API_URL = `${API_BASE_URL}/auth`;
export const USERS_API_URL = `${API_BASE_URL}/users`;
export const CONTENT_API_URL = `${API_BASE_URL}/content`;

// Informations Cloudflare (depuis la mémoire du projet)
export const CLOUDFLARE_CONFIG = {
  accountId: '42fc982266a2c31b942593b18097e4b3',
  dbId: '39a4a8fd-f1fd-49ab-abcc-290fd473a311',
  kvNamespace: '7388919bd83241cfab509b44f819bb2f',
  streamDomain: 'customer-ehlynuge6dnzfnfd.cloudflarestream.com'
};

// Helper pour gérer les réponses API
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Helper pour déterminer le type de contenu
export const determineContentType = (content) => {
  if (content.first_air_date) { return 'drama'; }
  if (content.release_date) { return 'film'; }
  if (content.original_title && content.original_title.includes('anime')) { return 'anime'; }
  if (content.original_language === 'hi') { return 'bollywood'; }
  return 'film'; // Par défaut
};
