/**
 * Proxy CORS simplifié pour FloDrama API
 * Ce worker intercepte toutes les requêtes et renvoie une réponse valide avec les bons en-têtes CORS
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Configuration des en-têtes CORS pour toutes les origines
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin, Cache-Control, X-Auth-Token',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
}

/**
 * Fonction principale de gestion des requêtes
 * @param {Request} request - Requête entrante
 * @returns {Response} - Réponse formatée avec en-têtes CORS
 */
async function handleRequest(request) {
  // Gestion des requêtes OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Analyser l'URL pour déterminer le type de requête
  const url = new URL(request.url)
  const path = url.pathname
  
  // Enregistrer les détails de la requête pour le débogage
  console.log(`Traitement de la requête: ${path}`)

  try {
    // Réponse simulée pour les API de contenu
    if (path.startsWith('/api/')) {
      const parts = path.split('/').filter(part => part)
      
      // Si c'est une route de contenu (animes, dramas, films, bollywood)
      if (parts.length >= 2) {
        const contentType = parts[1] // animes, dramas, films, etc.
        const filter = parts.length > 2 ? parts[2] : null
        
        // Simuler des données
        const data = []
        
        // Pour les requêtes tests, ajouter quelques éléments simulés
        for (let i = 1; i <= 5; i++) {
          data.push({
            id: `${contentType}_${i}`,
            title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} de test ${i}`,
            poster: 'https://via.placeholder.com/300x450',
            backdrop: 'https://via.placeholder.com/1280x720',
            content_type: contentType.endsWith('s') ? contentType.slice(0, -1) : contentType,
            description: `Ceci est un contenu de test pour le type ${contentType}`,
          })
        }
        
        // Réponse formatée avec en-têtes CORS
        return new Response(JSON.stringify({
          source: "flodrama-api-proxy",
          api_version: "1.0",
          timestamp: new Date().toISOString(),
          count: data.length,
          content_type: contentType,
          filter: filter,
          data: data
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }
      
      // Pour les historiques utilisateur
      if (parts[1] === 'users' && parts.length >= 4 && parts[3] === 'history') {
        return new Response(JSON.stringify({
          user_id: parts[2],
          timestamp: new Date().toISOString(),
          count: 0,
          data: []
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }
    }
    
    // Pour toute autre requête, renvoyer une réponse par défaut
    return new Response(JSON.stringify({
      message: "API FloDrama - Proxy CORS",
      path: path,
      timestamp: new Date().toISOString(),
      data: []
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // En cas d'erreur, renvoyer une réponse d'erreur formatée
    return new Response(JSON.stringify({
      error: error.message,
      path: path,
      timestamp: new Date().toISOString()
    }), {
      status: 200, // On garde 200 pour éviter les problèmes CORS
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}
