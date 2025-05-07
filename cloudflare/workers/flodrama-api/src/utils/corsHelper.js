/**
 * @file corsHelper.js
 * @description Utilitaires pour la gestion des CORS (Cross-Origin Resource Sharing)
 */

/**
 * Configure les en-têtes CORS pour une réponse
 * @param {Request} request - Requête entrante
 * @returns {Response} - Réponse avec en-têtes CORS configurés
 */
export function setupCORS(request) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get('Origin') || '*';
  
  // Configurer les en-têtes CORS standards
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 heures en secondes
    'Access-Control-Allow-Credentials': 'true'
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
  const corsHeaders = setupCORS(request);
  
  // Si c'est déjà une réponse pour OPTIONS, ne rien modifier
  if (request.method === 'OPTIONS' && response.status === 204) {
    return response;
  }
  
  // Créer une nouvelle réponse avec les headers CORS ajoutés
  const newResponse = new Response(response.body, response);
  
  // Ajouter chaque header CORS
  for (const [key, value] of Object.entries(corsHeaders)) {
    newResponse.headers.set(key, value);
  }
  
  return newResponse;
}
