/**
 * FloDrama Content API Gateway
 * Point d'entrée unifié pour toutes les requêtes liées au contenu
 * Gère le routage vers les contrôleurs appropriés
 */

const AnimeController = require('./anime/controllers/AnimeController');
const DramaController = require('./drama/controllers/DramaController');
const BollywoodController = require('./bollywood/controllers/BollywoodController');
const StreamingProxyService = require('./anime/services/StreamingProxyService');

// Initialisation des contrôleurs et services
const animeController = new AnimeController();
const dramaController = new DramaController();
const bollywoodController = new BollywoodController();
const streamingProxyService = new StreamingProxyService();

/**
 * Gestionnaire de requêtes pour l'API Gateway
 * @param {Request} request - La requête entrante
 * @param {Object} env - Variables d'environnement Cloudflare
 * @param {Object} ctx - Contexte d'exécution
 * @returns {Response} - La réponse formatée
 */
async function handleRequest(request, env, ctx) {
  // Configuration CORS
  // Récupération de l'origine de la requête
  const origin = request.headers.get('Origin') || '*';
  
  // Liste des domaines autorisés
  const allowedOrigins = [
    'https://cddb57ab.flodrama-frontend.pages.dev',
    'https://identite-visuelle-flodrama.flodrama-frontend.pages.dev',
    'https://flodrama-frontend.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  // Vérification si l'origine est autorisée
  let corsHeaders = {};
  
  if (allowedOrigins.includes(origin)) {
    // Si l'origine est dans la liste des origines autorisées, on l'utilise spécifiquement
    corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };
  } else {
    // Sinon, on utilise le wildcard mais sans credentials
    corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Gestion des requêtes OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Récupération de l'URL et du chemin
  const url = new URL(request.url);
  const path = url.pathname;
  const params = {};
  
  // Conversion des paramètres de requête en objet
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }

  // Fonction pour créer une réponse JSON
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  };

  // Fonction pour gérer les erreurs
  const errorResponse = (message, status = 400) => {
    return jsonResponse({ error: message }, status);
  };

  try {
    // Routes pour les animes
    if (path.startsWith('/api/anime')) {
      const segments = path.split('/').filter(Boolean);
      
      // Route: /api/anime/search
      if (path === '/api/anime/search') {
        const results = await animeController.searchAnime(params);
        return jsonResponse(results);
      }
      
      // Route: /api/anime/trending
      else if (path === '/api/anime/trending') {
        const limit = parseInt(params.limit) || 15;
        const results = await animeController.getTrendingAnime(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/anime/recent
      else if (path === '/api/anime/recent') {
        const limit = parseInt(params.limit) || 15;
        const results = await animeController.getRecentAnime(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/anime/random
      else if (path === '/api/anime/random') {
        const result = await animeController.getRandomAnime();
        return jsonResponse(result);
      }
      
      // Route: /api/anime/:id
      else if (segments.length === 3) {
        const id = segments[2];
        const full = params.full === 'true';
        const result = await animeController.getAnimeById(id, full);
        return jsonResponse(result);
      }
      
      // Route: /api/anime/:id/episodes
      else if (segments.length === 4 && segments[3] === 'episodes') {
        const id = segments[2];
        const page = parseInt(params.page) || 1;
        const results = await animeController.getAnimeEpisodes(id, page);
        return jsonResponse(results);
      }
      
      // Route: /api/anime/:id/characters
      else if (segments.length === 4 && segments[3] === 'characters') {
        const id = segments[2];
        const results = await animeController.getAnimeCharacters(id);
        return jsonResponse(results);
      }
      
      // Route: /api/anime/:id/recommendations
      else if (segments.length === 4 && segments[3] === 'recommendations') {
        const id = segments[2];
        const limit = parseInt(params.limit) || 10;
        const results = await animeController.getAnimeRecommendations(id, limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/anime/:id/streaming/:episode
      else if (segments.length === 5 && segments[3] === 'streaming') {
        const id = segments[2];
        const episode = parseInt(segments[4]);
        const results = await animeController.getAnimeStreaming(id, episode);
        
        // Optimiser les sources de streaming avec le proxy
        if (results && results.sources) {
          const baseUrl = results.referer || `https://api.flodrama.com/api/anime/${id}`;
          results.sources = streamingProxyService.optimizeSources(results.sources, baseUrl);
        }
        
        return jsonResponse(results);
      }
    }
    
    // Routes pour les dramas
    else if (path.startsWith('/api/drama')) {
      const segments = path.split('/').filter(Boolean);
      
      // Route: /api/drama/search
      if (path === '/api/drama/search') {
        const results = await dramaController.searchDramas(params);
        return jsonResponse(results);
      }
      
      // Route: /api/drama/trending
      else if (path === '/api/drama/trending') {
        const limit = parseInt(params.limit) || 15;
        const results = await dramaController.getTrendingDramas(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/drama/recent
      else if (path === '/api/drama/recent') {
        const limit = parseInt(params.limit) || 15;
        const results = await dramaController.getRecentDramas(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/drama/popular
      else if (path === '/api/drama/popular') {
        const limit = parseInt(params.limit) || 15;
        const results = await dramaController.getPopularDramas(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/drama/genre/:genre
      else if (segments.length === 4 && segments[2] === 'genre') {
        const genre = segments[3];
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const results = await dramaController.getDramasByGenre(genre, page, limit);
        return jsonResponse(results);
      }
      
      // Route: /api/drama/country/:country
      else if (segments.length === 4 && segments[2] === 'country') {
        const country = segments[3];
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const results = await dramaController.getDramasByCountry(country, page, limit);
        return jsonResponse(results);
      }
      
      // Route: /api/drama/:id
      else if (segments.length === 3) {
        const id = segments[2];
        const result = await dramaController.getDramaById(id);
        return jsonResponse(result);
      }
      
      // Route: /api/drama/:id/episodes
      else if (segments.length === 4 && segments[3] === 'episodes') {
        const id = segments[2];
        const results = await dramaController.getDramaEpisodes(id);
        return jsonResponse(results);
      }
      
      // Route: /api/drama/:id/cast
      else if (segments.length === 4 && segments[3] === 'cast') {
        const id = segments[2];
        const results = await dramaController.getDramaCast(id);
        return jsonResponse(results);
      }
      
      // Route: /api/drama/:id/streaming/:episode
      else if (segments.length === 5 && segments[3] === 'streaming') {
        const id = segments[2];
        const episode = parseInt(segments[4]);
        const results = await dramaController.getDramaStreaming(id, episode);
        return jsonResponse(results);
      }
    }
    
    // Routes pour les films Bollywood
    else if (path.startsWith('/api/bollywood')) {
      const segments = path.split('/').filter(Boolean);
      
      // Route: /api/bollywood/search
      if (path === '/api/bollywood/search') {
        const results = await bollywoodController.searchMovies(params);
        return jsonResponse(results);
      }
      
      // Route: /api/bollywood/trending
      else if (path === '/api/bollywood/trending') {
        const limit = parseInt(params.limit) || 15;
        const results = await bollywoodController.getTrendingMovies(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/bollywood/recent
      else if (path === '/api/bollywood/recent') {
        const limit = parseInt(params.limit) || 15;
        const results = await bollywoodController.getRecentMovies(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/bollywood/popular
      else if (path === '/api/bollywood/popular') {
        const limit = parseInt(params.limit) || 15;
        const results = await bollywoodController.getPopularMovies(limit);
        return jsonResponse({ data: results });
      }
      
      // Route: /api/bollywood/genre/:genre
      else if (segments.length === 4 && segments[2] === 'genre') {
        const genre = segments[3];
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const results = await bollywoodController.getMoviesByGenre(genre, page, limit);
        return jsonResponse(results);
      }
      
      // Route: /api/bollywood/actor/:actor
      else if (segments.length === 4 && segments[2] === 'actor') {
        const actor = segments[3];
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const results = await bollywoodController.getMoviesByActor(actor, page, limit);
        return jsonResponse(results);
      }
      
      // Route: /api/bollywood/director/:director
      else if (segments.length === 4 && segments[2] === 'director') {
        const director = segments[3];
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const results = await bollywoodController.getMoviesByDirector(director, page, limit);
        return jsonResponse(results);
      }
      
      // Route: /api/bollywood/:id
      else if (segments.length === 3) {
        const id = segments[2];
        const result = await bollywoodController.getMovieById(id);
        return jsonResponse(result);
      }
      
      // Route: /api/bollywood/:id/streaming
      else if (segments.length === 4 && segments[3] === 'streaming') {
        const id = segments[2];
        const results = await bollywoodController.getMovieStreaming(id);
        return jsonResponse(results);
      }
    }
    
    // Route: /trending (agrégation de contenu en tendance)
    else if (path === '/trending') {
      const limit = parseInt(params.limit) || 15;
      try {
        // Récupérer les contenus en tendance de chaque catégorie
        const [animes, dramas, bollywood] = await Promise.all([
          animeController.getTrendingAnime(limit),
          dramaController.getTrendingDramas(limit),
          bollywoodController.getTrendingMovies(limit)
        ]);
        
        // S'assurer que chaque élément a les propriétés requises
        const allTrending = [...animes, ...dramas, ...bollywood]
          .map(item => ({
            id: item.id || Math.floor(Math.random() * 10000),
            title: item.title || item.name || 'Sans titre',
            poster_path: item.poster_path || '/placeholder.jpg',
            backdrop_path: item.backdrop_path || '/placeholder-backdrop.jpg',
            overview: item.overview || 'Aucune description disponible',
            vote_average: item.vote_average || 0,
            release_date: item.release_date || item.first_air_date || new Date().toISOString().split('T')[0],
            content_type: item.content_type || determineContentType(item),
            ...item // Garder les autres propriétés originales
          }))
          .sort(() => Math.random() - 0.5)
          .slice(0, limit);
          
        return jsonResponse({ data: allTrending });
      } catch (error) {
        console.error(`Erreur récupération trending: ${error.message}`);
        return jsonResponse({ data: [] });
      }
    }
    
    // Route: /recent (agrégation de contenu récent)
    else if (path === '/recent') {
      const limit = parseInt(params.limit) || 15;
      try {
        // Récupérer les contenus récents de chaque catégorie
        const [animes, dramas, bollywood] = await Promise.all([
          animeController.getRecentAnime(limit),
          dramaController.getRecentDramas(limit),
          bollywoodController.getRecentMovies(limit)
        ]);
        
        // Fusionner et trier par date (plus récent d'abord)
        const allRecent = [...animes, ...dramas, ...bollywood]
          .map(item => ({
            id: item.id || Math.floor(Math.random() * 10000),
            title: item.title || item.name || 'Sans titre',
            poster_path: item.poster_path || '/placeholder.jpg',
            backdrop_path: item.backdrop_path || '/placeholder-backdrop.jpg',
            overview: item.overview || 'Aucune description disponible',
            vote_average: item.vote_average || 0,
            release_date: item.release_date || item.first_air_date || new Date().toISOString().split('T')[0],
            content_type: item.content_type || determineContentType(item),
            ...item // Garder les autres propriétés originales
          }))
          .sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date || 0);
            const dateB = new Date(b.release_date || b.first_air_date || 0);
            return dateB - dateA;
          })
          .slice(0, limit);
          
        return jsonResponse({ data: allRecent });
      } catch (error) {
        console.error(`Erreur récupération recent: ${error.message}`);
        return jsonResponse({ data: [] });
      }
    }
    
    // Route: /banners (pour les featured content)
    else if (path === '/banners') {
      const limit = parseInt(params.limit) || 5;
      try {
        // Récupérer du contenu populaire pour les bannières
        const [animes, dramas, bollywood] = await Promise.all([
          animeController.getPopularAnime(limit),
          dramaController.getPopularDramas(limit),
          bollywoodController.getPopularMovies(limit)
        ]);
        
        // Sélectionner quelques éléments pour les bannières
        const banners = [...animes, ...dramas, ...bollywood]
          .map(item => ({
            id: item.id || Math.floor(Math.random() * 10000),
            title: item.title || item.name || 'Sans titre',
            poster_path: item.poster_path || '/placeholder.jpg',
            backdrop_path: item.backdrop_path || '/placeholder-backdrop.jpg',
            overview: item.overview || 'Aucune description disponible',
            vote_average: item.vote_average || 0,
            release_date: item.release_date || item.first_air_date || new Date().toISOString().split('T')[0],
            content_type: item.content_type || determineContentType(item),
            ...item // Garder les autres propriétés originales
          }))
          .filter(item => item.backdrop_path) // S'assurer qu'il y a une image de fond
          .sort(() => Math.random() - 0.5) // Mélanger
          .slice(0, limit);
          
        return jsonResponse({ data: banners });
      } catch (error) {
        console.error(`Erreur récupération banners: ${error.message}`);
        return jsonResponse({ data: [] });
      }
    }
    
    // Route d'accueil de l'API
    else if (path === '/api' || path === '/api/') {
      return jsonResponse({
        name: 'FloDrama Content API',
        version: '1.0.0',
        description: 'API unifiée pour accéder aux contenus Anime, Drama et Bollywood',
        endpoints: {
          anime: [
            '/api/anime/search',
            '/api/anime/trending',
            '/api/anime/recent',
            '/api/anime/random',
            '/api/anime/:id',
            '/api/anime/:id/episodes',
            '/api/anime/:id/characters',
            '/api/anime/:id/recommendations',
            '/api/anime/:id/streaming/:episode'
          ],
          streaming: [
            '/api/stream/proxy?url={url}&referer={referer}'
          ],
          drama: [
            '/api/drama/search',
            '/api/drama/trending',
            '/api/drama/recent',
            '/api/drama/popular',
            '/api/drama/genre/:genre',
            '/api/drama/country/:country',
            '/api/drama/:id',
            '/api/drama/:id/episodes',
            '/api/drama/:id/cast',
            '/api/drama/:id/streaming/:episode'
          ],
          bollywood: [
            '/api/bollywood/search',
            '/api/bollywood/trending',
            '/api/bollywood/recent',
            '/api/bollywood/popular',
            '/api/bollywood/genre/:genre',
            '/api/bollywood/actor/:actor',
            '/api/bollywood/director/:director',
            '/api/bollywood/:id',
            '/api/bollywood/:id/streaming'
          ]
        }
      });
    }
    
    // Route: /api/users/:userId/history
    else if (path.match(/\/api\/users\/[^\/]+\/history/)) {
      // Extraire l'ID utilisateur du chemin
      const userId = path.split('/')[3];
      
      // Pour le moment, nous retournons un historique fictif
      // Dans une implémentation réelle, on récupérerait l'historique depuis une base de données
      return jsonResponse({
        data: [],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_results: 0
        }
      });
    }
    
    // Route: /api/stream/proxy
    else if (path.startsWith('/api/stream/proxy')) {
      // Récupérer les paramètres de requête
      const streamUrl = params.url;
      const referer = params.referer;
      
      if (!streamUrl) {
        return errorResponse('URL de streaming manquante', 400);
      }
      
      // Proxifier le flux
      return await streamingProxyService.proxyStream(streamUrl, referer, request);
    }
    // Route non trouvée
    else {
      return errorResponse('Endpoint non trouvé', 404);
    }
  } catch (error) {
    console.error(`Erreur API: ${error.message}`);
    return errorResponse(error.message, 500);
  }
  
  // Si aucune route ne correspond
  return errorResponse('Endpoint non trouvé', 404);
}

// Helper pour déterminer le type de contenu
function determineContentType(content) {
  if (!content) {
    return 'film';
  }
  
  if (content.first_air_date) { 
    return 'drama'; 
  }
  if (content.episodes || content.episode_count) { 
    return 'anime'; 
  }
  if (content.release_date) { 
    return 'film'; 
  }
  if (content.original_title && content.original_title.includes('anime')) { 
    return 'anime'; 
  }
  if (content.original_language === 'hi' || content.country === 'India') { 
    return 'bollywood'; 
  }
  
  // Par défaut
  return 'film';
}

// Configuration du Worker Cloudflare
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env, event.ctx));
});

module.exports = { handleRequest };
