/**
 * @file index-minimal.js
 * @description Version simplifiée du Worker API Gateway pour FloDrama
 * Permet un premier déploiement fonctionnel sans dépendances externes (KV, R2)
 */

// Configuration des en-têtes CORS 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * Crée une réponse JSON standardisée
 */
function createResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-cache'
      }
    }
  );
}

/**
 * Gestionnaire des requêtes média - version simplifiée
 */
async function handleMediaRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const mediaId = path.split('/').pop();
  
  // URL de fallback selon le type
  const mediaType = url.searchParams.get('type') || 'default';
  const fallbacks = {
    'trailer': '/images/placeholder-trailer.jpg',
    'episode': '/images/placeholder-episode.jpg',
    'movie': '/images/placeholder-movie.jpg',
    'default': '/images/placeholder.jpg'
  };
  
  try {
    // Construction de l'URL Cloudflare Stream
    const streamUrl = `https://customer-${env.STREAM_ACCOUNT_ID}.cloudflarestream.com/${mediaId}/watch`;
    
    // Tentative de récupération du média
    const response = await fetch(streamUrl, { cf: { cacheTtl: 3600 } });
    
    // Si le média est accessible, on le transmet
    if (response.ok) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('Content-Type'),
          ...corsHeaders,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    // Sinon, on retourne l'URL de fallback
    return createResponse({
      status: "error",
      message: `Média ${mediaId} non disponible`,
      fallbackUrl: fallbacks[mediaType] || fallbacks.default
    });
    
  } catch (error) {
    console.error(`Erreur média ${mediaId}: ${error.message}`);
    
    return createResponse({
      status: "error",
      message: "Erreur lors de l'accès au média",
      mediaId,
      fallbackUrl: fallbacks[mediaType] || fallbacks.default
    }, 500);
  }
}

/**
 * Gestionnaire principal des requêtes
 */
export default {
  async fetch(request, env, ctx) {
    // Gestion des requêtes OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    const url = new URL(request.url);
    
    try {
      // Route principale pour les médias
      if (url.pathname.startsWith('/media/')) {
        return await handleMediaRequest(request, env);
      }
      
      // Route de statut/vérification API
      if (url.pathname === '/' || url.pathname === '/api') {
        return createResponse({
          status: "ok",
          name: "FloDrama API Gateway",
          version: "1.0.0",
          environment: env.ENVIRONMENT || 'development'
        });
      }
      
      // Route non trouvée
      return createResponse({
        status: "error",
        message: "Route non trouvée",
        path: url.pathname
      }, 404);
      
    } catch (error) {
      console.error(`Erreur API: ${error.message}`);
      
      return createResponse({
        status: "error",
        message: "Erreur interne du serveur",
        details: env.ENVIRONMENT === 'production' ? undefined : error.message
      }, 500);
    }
  }
};
