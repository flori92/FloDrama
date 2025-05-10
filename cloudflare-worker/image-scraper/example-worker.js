/**
 * Exemple d'intégration du scraper d'images dans un Worker Cloudflare
 * Ce fichier montre comment utiliser le scraper d'images dans un Worker Cloudflare
 */

// Importer les modules
const { enrichContentWithImages, enrichContentsWithImages } = require('./scraper-integration');

// Exemple de Worker Cloudflare
export default {
  async fetch(request, env, ctx) {
    // Récupérer l'URL de la requête
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Gérer les requêtes OPTIONS (CORS)
    if (request.method === 'OPTIONS') {
      return handleCorsRequest(request);
    }
    
    // Définir les variables d'environnement pour le scraper d'images
    process.env.CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
    process.env.CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
    
    // Exemple de route pour récupérer un film avec images optimisées
    if (path.startsWith('/films/') && request.method === 'GET') {
      const filmId = path.split('/')[2];
      return await handleGetFilm(filmId, env);
    }
    
    // Exemple de route pour récupérer une liste de films avec images optimisées
    if (path === '/films' && request.method === 'GET') {
      return await handleGetFilms(env);
    }
    
    // Réponse par défaut
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Route non trouvée' 
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request)
      }
    });
  }
};

/**
 * Gère la récupération d'un film avec images optimisées
 * @param {string} filmId - ID du film à récupérer
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Response} - Réponse HTTP
 */
async function handleGetFilm(filmId, env) {
  try {
    // Exemple de récupération d'un film depuis une source de données
    const film = await getFilmFromDatabase(filmId, env);
    
    if (!film) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Film non trouvé' 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request)
        }
      });
    }
    
    // Enrichir le film avec des images optimisées
    const enrichedFilm = await enrichContentWithImages(film);
    
    // Retourner la réponse
    return new Response(JSON.stringify({ 
      success: true, 
      data: enrichedFilm 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du film:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erreur lors de la récupération du film',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request)
      }
    });
  }
}

/**
 * Gère la récupération d'une liste de films avec images optimisées
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Response} - Réponse HTTP
 */
async function handleGetFilms(env) {
  try {
    // Exemple de récupération d'une liste de films depuis une source de données
    const films = await getFilmsFromDatabase(env);
    
    // Enrichir les films avec des images optimisées
    const enrichedFilms = await enrichContentsWithImages(films);
    
    // Retourner la réponse
    return new Response(JSON.stringify({ 
      success: true, 
      data: enrichedFilms 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erreur lors de la récupération des films',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request)
      }
    });
  }
}

/**
 * Récupère un film depuis la base de données
 * @param {string} filmId - ID du film à récupérer
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Promise<Object>} - Objet film
 */
async function getFilmFromDatabase(filmId, env) {
  // Exemple de récupération d'un film depuis D1
  const { results } = await env.DB.prepare(
    `SELECT * FROM films WHERE id = ?`
  ).bind(filmId).all();
  
  if (results.length === 0) {
    return null;
  }
  
  return results[0];
}

/**
 * Récupère une liste de films depuis la base de données
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Promise<Array<Object>>} - Liste d'objets films
 */
async function getFilmsFromDatabase(env) {
  // Exemple de récupération d'une liste de films depuis D1
  const { results } = await env.DB.prepare(
    `SELECT * FROM films LIMIT 20`
  ).all();
  
  return results;
}

/**
 * Gère les requêtes CORS (pre-flight)
 * @param {Request} request - Requête HTTP
 * @returns {Response} - Réponse HTTP
 */
function handleCorsRequest(request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
}

/**
 * Récupère les en-têtes CORS
 * @param {Request} request - Requête HTTP
 * @returns {Object} - En-têtes CORS
 */
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}
