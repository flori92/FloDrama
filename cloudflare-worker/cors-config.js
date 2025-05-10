// Configuration CORS pour le Worker Cloudflare FloDrama API
// À déployer sur le Worker flodrama-api-worker.florifavi.workers.dev

export default {
  async fetch(request, env) {
    // Récupérer l'URL de la requête
    const url = new URL(request.url);
    
    // Gérer les requêtes OPTIONS (pre-flight CORS)
    if (request.method === "OPTIONS") {
      return handleCors(request);
    }
    
    // Appeler la fonction existante du Worker
    let response;
    try {
      // Ici, vous devez appeler la fonction existante du Worker
      // Ceci est un exemple, à adapter selon votre implémentation actuelle
      response = await handleRequest(request, env);
    } catch (e) {
      response = new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Ajouter les headers CORS à la réponse
    return addCorsHeaders(response, request);
  }
};

// Fonction pour gérer les requêtes OPTIONS (pre-flight CORS)
function handleCors(request) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get("Origin");
  
  // Créer une réponse vide avec les headers CORS appropriés
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400" // 24 heures
    }
  });
}

// Fonction pour ajouter les headers CORS à une réponse existante
function addCorsHeaders(response, request) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get("Origin");
  
  // Cloner la réponse pour pouvoir modifier ses headers
  const newResponse = new Response(response.body, response);
  
  // Ajouter les headers CORS
  newResponse.headers.set("Access-Control-Allow-Origin", origin || "*");
  newResponse.headers.set("Access-Control-Allow-Credentials", "true");
  
  return newResponse;
}

// Fonction existante du Worker (à adapter selon votre implémentation)
async function handleRequest(request, env) {
  // Implémentation existante du Worker
  // À remplacer par votre code actuel
  return new Response(JSON.stringify({ success: true, message: "API FloDrama" }), {
    headers: { "Content-Type": "application/json" }
  });
}
