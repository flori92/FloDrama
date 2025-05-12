/**
 * FloDrama CORS Proxy Worker
 * 
 * Ce worker sert de proxy CORS pour l'API FloDrama.
 * Il gère correctement les en-têtes CORS pour permettre les requêtes
 * cross-origin avec credentials.
 */

// Liste des domaines autorisés
const ALLOWED_ORIGINS = [
  'https://flodrama.com',
  'https://www.flodrama.com',
  'https://flodrama-frontend.pages.dev',
  'https://*.flodrama-frontend.pages.dev',
  'https://flodrama.pages.dev',
  'https://new-flodrama.pages.dev',
  'http://localhost:5173' // Pour le développement local
];

// URL de l'API backend
const API_URL = 'https://flodrama-content-api.florifavi.workers.dev';

/**
 * Vérifie si l'origine est autorisée
 */
function isOriginAllowed(origin) {
  if (!origin) return false;
  
  return ALLOWED_ORIGINS.some(allowedOrigin => {
    if (allowedOrigin === origin) return true;
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace('*', '.*');
      const regex = new RegExp(pattern);
      return regex.test(origin);
    }
    return false;
  });
}

/**
 * Gère les requêtes CORS preflight (OPTIONS)
 */
function handleOptions(request) {
  const origin = request.headers.get('Origin');
  const accessControlRequestMethod = request.headers.get('Access-Control-Request-Method');
  
  // Vérifier si l'origine est autorisée
  if (!isOriginAllowed(origin)) {
    return new Response('Origin not allowed', { status: 403 });
  }
  
  // Répondre avec les en-têtes CORS appropriés
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-google-client-id, x-google-oauth-token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 heures
    }
  });
}

/**
 * Gère les requêtes normales
 */
async function handleRequest(request) {
  const origin = request.headers.get('Origin');
  
  // Vérifier si l'origine est autorisée
  if (!isOriginAllowed(origin)) {
    return new Response('Origin not allowed', { status: 403 });
  }
  
  // Construire l'URL de l'API
  const url = new URL(request.url);
  let pathname = url.pathname;
  
  // Corriger les URLs mal formées qui contiennent des doublons de domaine
  if (pathname.includes('https://')) {
    // Extraire uniquement le chemin après le dernier domaine
    const parts = pathname.split('/');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes('https:') || parts[i].includes('http:')) {
        // Trouver l'index du dernier segment de domaine
        const domainSegments = parts.slice(i);
        const domainEndIndex = domainSegments.findIndex(segment => segment.includes('.dev') || segment.includes('.com'));
        if (domainEndIndex !== -1) {
          // Reconstruire le chemin en prenant uniquement ce qui suit le domaine
          pathname = '/' + parts.slice(i + domainEndIndex + 1).join('/');
          break;
        }
      }
    }
  }
  
  const apiUrl = new URL(pathname + url.search, API_URL);
  
  // Copier les en-têtes de la requête originale
  const requestHeaders = new Headers(request.headers);
  
  // Supprimer les en-têtes qui peuvent causer des problèmes
  requestHeaders.delete('Host');
  
  // Créer une nouvelle requête pour l'API
  const apiRequest = new Request(apiUrl.toString(), {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
    redirect: 'follow'
  });
  
  try {
    // Envoyer la requête à l'API
    const response = await fetch(apiRequest);
    
    // Copier les en-têtes de la réponse
    const responseHeaders = new Headers(response.headers);
    
    // Ajouter les en-têtes CORS
    responseHeaders.set('Access-Control-Allow-Origin', origin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    
    // Créer une nouvelle réponse avec les en-têtes CORS
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    // En cas d'erreur, renvoyer une réponse d'erreur
    return new Response(JSON.stringify({
      status: 'error',
      message: `Erreur lors de la requête à l'API: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }
}

/**
 * Fonction principale du Worker
 */
export default {
  async fetch(request, env, ctx) {
    // Gérer les requêtes OPTIONS (preflight CORS)
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // Gérer les autres requêtes
    return handleRequest(request);
  }
};
