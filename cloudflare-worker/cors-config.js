// CORS Proxy Worker pour FloDrama API
// Ce Worker simple ajoute les headers CORS nécessaires aux réponses de l'API FloDrama

// Configuration des domaines autorisés
const ALLOWED_ORIGINS = [
  'https://flodrama.com',
  'https://www.flodrama.com',
  'https://flodrama-frontend.pages.dev',
  'https://*.flodrama-frontend.pages.dev'
];

// URL de l'API cible
const API_URL = 'https://flodrama-api-worker.florifavi.workers.dev';

export default {
  async fetch(request, env, ctx) {
    // Récupérer l'origine de la requête
    const origin = request.headers.get('Origin') || '';
    
    // Vérifier si l'origine est autorisée
    const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    // Si c'est une requête OPTIONS (pre-flight CORS), renvoyer les headers CORS
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest(origin, isAllowed);
    }
    
    // Créer une nouvelle requête pour l'API cible
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname + url.search, API_URL);
    
    // Copier les headers de la requête originale
    const headers = new Headers(request.headers);
    
    // Créer la nouvelle requête
    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'follow'
    });
    
    // Envoyer la requête à l'API cible
    const response = await fetch(newRequest);
    
    // Créer une nouvelle réponse avec les headers CORS
    const newResponse = new Response(response.body, response);
    
    // Ajouter les headers CORS
    if (isAllowed) {
      newResponse.headers.set('Access-Control-Allow-Origin', origin);
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    return newResponse;
  }
};

// Fonction pour gérer les requêtes OPTIONS (pre-flight CORS)
function handleCorsPreflightRequest(origin, isAllowed) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400' // 24 heures
  });
  
  // Ajouter les headers spécifiques à l'origine
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  return new Response(null, {
    status: 204, // No Content
    headers
  });
}
