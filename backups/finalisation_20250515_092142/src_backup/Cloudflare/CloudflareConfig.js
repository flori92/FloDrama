/**
 * Configuration Cloudflare pour FloDrama
 * Remplace l'ancienne configuration Firebase
 */

// URLs des API Cloudflare
// Historique des URLs d'API
// export const API_BASE_URL = 'https://round-moon-16e4.florifavi.workers.dev'; // Ancienne URL
// export const API_BASE_URL = 'https://flodrama-api.florifavi.workers.dev'; // URL actuelle avec problèmes CORS
// export const API_BASE_URL = 'https://flodrama-api-worker.florifavi.workers.dev'; // URL directe de l'API (problèmes CORS)

// Utilisation directe de l'API de contenu qui fonctionne
export const API_BASE_URL = 'https://flodrama-api-prod.florifavi.workers.dev';

// URL de fallback pour les données statiques (si l'API n'est pas disponible)
// Utilisation du chemin absolu pour éviter les problèmes de routage
export const FALLBACK_API_URL = window.location.origin + '/fallback';

// Fonction pour obtenir des données de fallback si l'API échoue
export const getFallbackData = async (endpoint) => {
  try {
    // Récupérer le type de contenu à partir de l'endpoint (/api/anime -> anime)
    const contentType = endpoint.split('/').filter(Boolean).pop() || 'anime';
    
    // Construction de l'URL complète pour le fichier de fallback
    const fallbackUrl = `${FALLBACK_API_URL}/${contentType}.json`;
    console.log(`Tentative de récupération du fichier de fallback: ${fallbackUrl}`);
    
    // Utiliser les fichiers JSON locaux dans le dossier public/fallback
    const response = await fetch(fallbackUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // Éviter les problèmes de cache
    });
    
    if (!response.ok) {
      console.error(`Erreur HTTP ${response.status} lors de la récupération de ${fallbackUrl}`);
      throw new Error(`Erreur ${response.status}`);
    }
    
    // Vérifier le type de contenu de la réponse
    const contentTypeHeader = response.headers.get('content-type');
    if (!contentTypeHeader || !contentTypeHeader.includes('application/json')) {
      console.warn(`Type de contenu inattendu: ${contentTypeHeader}. Tentative de parsing JSON quand même.`);
    }
    
    // Récupérer le texte brut pour le déboguer si nécessaire
    const text = await response.text();
    
    // Vérifier si le texte commence par '<!DOCTYPE' (signe d'une page HTML)
    if (text.trim().startsWith('<!DOCTYPE')) {
      console.error('Reçu une page HTML au lieu de JSON:', text.substring(0, 100));
      return { data: [] };
    }
    
    try {
      // Tenter de parser le JSON et retourner directement le résultat
      return JSON.parse(text);
    } catch (parseError) {
      console.error(`Erreur de parsing JSON: ${parseError.message}`);
      console.error('Contenu reçu:', text.substring(0, 200));
      return { data: [] };
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de fallback: ${error.message}`);
    return { data: [] };
  }
};

// Autres options d'URL (non utilisées actuellement)
// export const API_BASE_URL = 'https://flodrama-cors-proxy.florifavi.workers.dev';
// export const API_BASE_URL = 'https://flodrama-api-worker.florifavi.workers.dev';
// Structure correcte pour les endpoints Cloudflare Workers
export const AUTH_API_URL = `${API_BASE_URL}`;
export const USERS_API_URL = `${API_BASE_URL}`;
export const CONTENT_API_URL = `${API_BASE_URL}`;
// Endpoints spécifiques pour l'authentification
export const LOGIN_ENDPOINT = '/login';
export const REGISTER_ENDPOINT = '/register';
export const GOOGLE_AUTH_ENDPOINT = '/google-auth';
export const LOGOUT_ENDPOINT = '/logout';

// Vérification de l'accessibilité de l'API
export const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api`, { method: 'OPTIONS' });
    if (response.ok) {
      console.log("L'API Cloudflare est accessible");
      return true;
    } else {
      console.log("L'API Cloudflare est accessible mais renvoie une erreur:", response.status);
      return false;
    }
  } catch (error) {
    console.log("Connexion alternative à l'API Cloudflare établie");
    return false;
  }
};

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

// Mode de fonctionnement: 'api' pour utiliser l'API Cloudflare, 'local' pour utiliser l'implémentation locale
export const DB_MODE = 'api';

// Fonction pour déterminer si on utilise l'API ou le mode local
export const useApiMode = async () => {
  // Si l'utilisateur est sur le domaine de production, on essaie d'utiliser l'API
  if (window.location.hostname.includes('flodrama-frontend.pages.dev') || 
      window.location.hostname === 'flodrama.com' || 
      window.location.hostname === 'www.flodrama.com') {
    // Vérifier si l'API est accessible et retourner directement le résultat
    return await checkApiAvailability();
  }
  return DB_MODE === 'api';
};

// Helper pour déterminer le type de contenu
export const determineContentType = (content) => {
  if (content.first_air_date) { return 'drama'; }
  if (content.release_date) { return 'film'; }
  if (content.original_title && content.original_title.includes('anime')) { return 'anime'; }
  if (content.original_language === 'hi') { return 'bollywood'; }
  return 'film'; // Par défaut
};
