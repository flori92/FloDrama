// Proxy CORS pour FloDrama - Version Cloudflare Workers
// Ce script permet de contourner les restrictions CORS en faisant office d'intermédiaire
// entre le frontend et l'API AWS

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Configuration
const API_HOST = '7la2pq33ej.execute-api.us-east-1.amazonaws.com'
const API_STAGE = 'production'
const ALLOWED_ORIGINS = ['https://flori92.github.io', 'https://flodrama.com', 'http://localhost:3000', 'http://localhost:5173']

/**
 * Gère les requêtes entrantes
 * @param {Request} request
 */
async function handleRequest(request) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get('Origin') || ALLOWED_ORIGINS[0]
  
  // Vérifier si l'origine est autorisée
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin)
  const corsOrigin = isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]
  
  // Gestion des requêtes OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    })
  }
  
  try {
    // Extraire le chemin de l'API à partir de l'URL
    const url = new URL(request.url)
    let path = url.pathname
    
    // Supprimer le préfixe /api si présent
    if (path.startsWith('/api')) {
      path = path.replace(/^\/api/, '')
    }
    
    // Construire l'URL de l'API cible
    const targetUrl = `https://${API_HOST}/${API_STAGE}${path}${url.search}`
    
    // Créer une nouvelle requête pour l'API cible
    const apiRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    })
    
    // Supprimer les en-têtes problématiques
    apiRequest.headers.delete('Host')
    
    // Effectuer la requête à l'API cible
    const response = await fetch(apiRequest)
    
    // Créer une nouvelle réponse avec les en-têtes CORS
    const corsResponse = new Response(response.body, response)
    
    // Ajouter les en-têtes CORS
    corsResponse.headers.set('Access-Control-Allow-Origin', corsOrigin)
    corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    corsResponse.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return corsResponse
  } catch (error) {
    // Gérer les erreurs
    return new Response(JSON.stringify({
      error: 'Erreur de proxy',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    })
  }
}
