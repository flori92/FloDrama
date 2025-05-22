/**
 * @file corsHelper.js
 * @description Utilitaires pour la gestion des CORS (Cross-Origin Resource Sharing)
 */

// Liste des domaines autorisés
const ALLOWED_ORIGINS = [
  // Domaines principaux
  'https://flodrama.com',
  'https://www.flodrama.com',
  'https://flotv.live',
  'https://www.flotv.live',
  'https://flodrama.org',
  'https://flodrama.net',
  'https://flodrama.info',
  // Domaines de développement et test
  'https://flodrama-frontend.pages.dev',
  'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev',
  // Environnements de développement local
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  // AWS CloudFront
  'https://d1pbqs2b6em4ha.cloudfront.net',
  // Tous les sous-domaines de pages.dev pour les déploiements de test
  /.*\.flodrama-frontend\.pages\.dev$/
];

/**
 * Configure les en-têtes CORS pour une réponse
 * @param {Request} request - Requête entrante
 * @returns {Response|Object} - Réponse pour OPTIONS ou headers CORS
 */
export function setupCORS(request) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get('Origin');
  
  // Déterminer l'origine à utiliser dans les en-têtes
  let allowedOrigin = '*'; // Par défaut, autoriser toutes les origines
  
  if (origin) {
    // Vérifier si l'origine est dans la liste des origines autorisées
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    // Si l'origine est autorisée, l'utiliser spécifiquement pour une meilleure sécurité
    if (isAllowed) {
      allowedOrigin = origin;
    }
  }
  
  // Configurer les en-têtes CORS standards
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin, Cache-Control, X-Auth-Token, X-Content-Type-Options',
    'Access-Control-Max-Age': '86400', // 24 heures en secondes
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
    // Ajouter Vary pour le cache correct avec différentes origines
    'Vary': 'Origin'
  };
  
  // Pour les requêtes OPTIONS (preflight), renvoyer une réponse vide avec les headers
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Pour les autres requêtes, retourner les headers
  return corsHeaders;
}

/**
 * Ajoute les en-têtes CORS à une réponse existante
 * @param {Response} response - Réponse existante
 * @param {Request} request - Requête entrante
 * @returns {Response} - Réponse avec en-têtes CORS
 */
export function addCorsHeaders(response, request) {
  // Si pas de requête, retourner la réponse telle quelle
  if (!request) {
    return response;
  }

  const corsHeaders = setupCORS(request);
  
  // Si c'est déjà une réponse pour OPTIONS, ne rien modifier
  if (request.method === 'OPTIONS' && response instanceof Response && response.status === 204) {
    return response;
  }
  
  // Si pas de headers CORS (objet vide) ou si ce n'est pas une instance de Response, retourner la réponse telle quelle
  if (Object.keys(corsHeaders).length === 0 || !(response instanceof Response)) {
    return response;
  }
  
  // Créer une nouvelle réponse avec les headers CORS ajoutés
  const newResponse = new Response(response.body, response);
  
  // Ajouter chaque header CORS
  for (const [key, value] of Object.entries(corsHeaders)) {
    newResponse.headers.set(key, value);
  }
  
  // Ajouter un header spécifique pour éviter les problèmes avec les requêtes credentials
  const origin = request.headers.get('Origin');
  if (origin) {
    // Vérifier si l'origine est autorisée avant de la définir spécifiquement
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      // Définir explicitement l'origine autorisée
      newResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
  }
  
  return newResponse;
}
