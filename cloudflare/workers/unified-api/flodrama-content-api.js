/**
 * FloDrama Content API Gateway
 * Point d'entrée unifié pour toutes les requêtes liées au contenu
 * Gère le routage vers les contrôleurs appropriés
 */

const AnimeController = require('./anime/controllers/AnimeController');
const DramaController = require('./drama/controllers/DramaController');
const BollywoodController = require('./bollywood/controllers/BollywoodController');
const FilmController = require('./film/controllers/FilmController');
const StreamingProxyService = require('./anime/services/StreamingProxyService');

// Initialisation des contrôleurs et services
const animeController = new AnimeController();
const dramaController = new DramaController();
const bollywoodController = new BollywoodController();
const filmController = new FilmController();
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
    'https://1c38a83e.flodrama-frontend.pages.dev',
    'https://4b7508c3.flodrama-frontend.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  // Vérification si l'origine est autorisée
  let corsHeaders = {};
  
  if (allowedOrigins.includes(origin)) {
    // Si l'origine est dans la liste des origines autorisées, on l'utilise spécifiquement
    corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-google-client-id',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };
  } else {
    // Sinon, on utilise le wildcard mais sans credentials
    corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Gérer les en-têtes CORS pour les requêtes OPTIONS
  if (request.method === 'OPTIONS') {
    // Vérifier si la requête a des credentials
    const hasCredentials = request.headers.get('Access-Control-Request-Headers')?.includes('credentials');
    
    // Si la requête a des credentials, on ne peut pas utiliser le wildcard '*'
    if (hasCredentials && corsHeaders['Access-Control-Allow-Origin'] === '*') {
      // Utiliser l'origine spécifique au lieu du wildcard
      corsHeaders['Access-Control-Allow-Origin'] = origin || 'https://4b7508c3.flodrama-frontend.pages.dev';
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return new Response(null, {
      status: 204,
      headers: corsHeaders
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
      
      // Route: /api/anime (liste)
      else if (path === '/api/anime') {
        try {
          const results = await animeController.getTrendingAnime(15);
          return jsonResponse({ data: Array.isArray(results) ? results : [] });
        } catch (e) {
          return jsonResponse({ data: [] });
        }
      }
      
      // Route: /api/anime/random
      else if (path === '/api/anime/random') {
        const result = await animeController.getRandomAnime();
        return jsonResponse({ data: result });
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
        const results = await animeController.getAnimeEpisodes(id);
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
        const results = await animeController.getAnimeRecommendations(id);
        return jsonResponse(results);
      }
      
      // Route: /api/anime/:id/streaming/:episode
      else if (segments.length === 5 && segments[3] === 'streaming') {
        const id = segments[2];
        const episode = parseInt(segments[4]);
        const results = await animeController.getAnimeStreaming(id, episode);
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
      // Route: /api/drama (liste)
      else if (path === '/api/drama') {
        try {
          const results = await dramaController.getPopularDramas(15);
          return jsonResponse({ data: Array.isArray(results) ? results : [] });
        } catch (e) {
          return jsonResponse({ data: [] });
        }
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
    
    // Route: /api/film (liste)
    else if (path === '/api/film') {
      try {
        const results = await filmController.getPopularFilms(15);
        return jsonResponse({ data: Array.isArray(results) ? results : [] });
      } catch (e) {
        return jsonResponse({ data: [] });
      }
    }
    // Routes pour les films Bollywood
    else if (path.startsWith('/api/bollywood')) {
      try {
        const segments = path.split('/').filter(Boolean);
        
        // Route: /api/bollywood/search
        if (segments[2] === 'search') {
          console.log(`[API Gateway] /api/bollywood/search - Début avec paramètres:`, params);
          const result = await bollywoodController.searchMovies(params);
          console.log(`[API Gateway] /api/bollywood/search - Résultat obtenu:`, result);
          return jsonResponse(result);
        }
        
        // Route: /api/bollywood/trending
        else if (segments[2] === 'trending') {
          console.log(`[API Gateway] /api/bollywood/trending - Début`);
          const limit = parseInt(params.limit) || 15;
          const result = await bollywoodController.getTrendingMovies({ query: { limit } });
          console.log(`[API Gateway] /api/bollywood/trending - Résultat obtenu:`, result);
          return jsonResponse(result);
        }
        
        // Route: /api/bollywood/recent
        else if (segments[2] === 'recent') {
          console.log(`[API Gateway] /api/bollywood/recent - Début`);
          const limit = parseInt(params.limit) || 15;
          const result = await bollywoodController.getRecentMovies(limit);
          return jsonResponse({ data: result });
        }
        
        // Route: /api/bollywood/popular
        else if (segments[2] === 'popular') {
          console.log(`[API Gateway] /api/bollywood/popular - Début`);
          const limit = parseInt(params.limit) || 15;
          const result = await bollywoodController.getPopularMovies(limit);
          return jsonResponse({ data: result });
        }
        
        // Route: /api/bollywood/genre/:genre
        else if (segments.length === 4 && segments[2] === 'genre') {
          const genre = segments[3];
          const page = parseInt(params.page) || 1;
          const limit = parseInt(params.limit) || 20;
          const result = await bollywoodController.getMoviesByGenre(genre, page, limit);
          return jsonResponse(result);
        }
        
        // Route: /api/bollywood/actor/:actor
        else if (segments.length === 4 && segments[2] === 'actor') {
          const actor = segments[3];
          const page = parseInt(params.page) || 1;
          const limit = parseInt(params.limit) || 20;
          const result = await bollywoodController.getMoviesByActor(actor, page, limit);
          return jsonResponse(result);
        }
        
        // Route: /api/bollywood/director/:director
        else if (segments.length === 4 && segments[2] === 'director') {
          const director = segments[3];
          const page = parseInt(params.page) || 1;
          const limit = parseInt(params.limit) || 20;
          const result = await bollywoodController.getMoviesByDirector(director, page, limit);
          return jsonResponse(result);
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
          const result = await bollywoodController.getMovieStreaming(id);
          return jsonResponse(result);
        }
        
        // Route non trouvée
        else {
          return errorResponse('Endpoint Bollywood non trouvé', 404);
        }
      } catch (error) {
        console.error(`Erreur Bollywood: ${error.message}`);
        console.error(error.stack);
        return errorResponse(error.message, 500);
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
            poster_path: item.poster_path || item.image || '',
            backdrop_path: item.backdrop_path || item.image || '',
            overview: item.overview || item.description || '',
            vote_average: item.vote_average || (Math.random() * 5 + 5).toFixed(1),
            content_type: determineContentType(item)
          }))
          .filter(item => item.poster_path) // S'assurer qu'il y a une image
          .sort(() => Math.random() - 0.5) // Mélanger
          .slice(0, limit);
          
        return jsonResponse({ data: allTrending });
      } catch (error) {
        console.error(`Erreur récupération trending: ${error.message}`);
        return jsonResponse({ data: [] });
      }
    }
    
    // Route: /banners (pour le carousel de la page d'accueil)
    else if (path === '/banners') {
      const limit = parseInt(params.limit) || 5;
      try {
        // Récupérer les contenus populaires de chaque catégorie
        const [animes, dramas, bollywood] = await Promise.all([
          animeController.getPopularAnime(limit),
          dramaController.getPopularDramas(limit),
          bollywoodController.getPopularMovies(limit)
        ]);
        
        // S'assurer que chaque élément a les propriétés requises
        const banners = [...animes, ...dramas, ...bollywood]
          .map(item => ({
            id: item.id || Math.floor(Math.random() * 10000),
            title: item.title || item.name || 'Sans titre',
            poster_path: item.poster_path || item.image || '',
            backdrop_path: item.backdrop_path || item.image || '',
            overview: item.overview || item.description || '',
            vote_average: item.vote_average || (Math.random() * 5 + 5).toFixed(1),
            content_type: determineContentType(item)
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
        data: {
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
            ],
            film: [
              '/api/film/search',
              '/api/film/trending',
              '/api/film/recent',
              '/api/film/popular',
              '/api/film/genre/:genre',
              '/api/film/:id',
              '/api/film/:id/streaming'
            ]
          }
        }
      });
    }
    
    // Routes pour les films
    else if (path.startsWith('/api/film')) {
      try {
        const segments = path.split('/').filter(Boolean);
        
        // Route: /api/film/search
        if (segments[2] === 'search') {
          console.log(`[API Gateway] /api/film/search - Début avec paramètres:`, params);
          const result = await filmController.searchMovies(params);
          console.log(`[API Gateway] /api/film/search - Résultat obtenu:`, result);
          return jsonResponse(result);
        }
        
        // Route: /api/film/trending
        else if (segments[2] === 'trending') {
          console.log(`[API Gateway] /api/film/trending - Début`);
          const limit = parseInt(params.limit) || 15;
          const result = await filmController.getTrendingMovies({ query: { limit } });
          console.log(`[API Gateway] /api/film/trending - Résultat obtenu:`, result);
          return jsonResponse(result);
        }
        
        // Route: /api/film/recent
        else if (segments[2] === 'recent') {
          console.log(`[API Gateway] /api/film/recent - Début`);
          const limit = parseInt(params.limit) || 15;
          const result = await filmController.getRecentMovies(limit);
          return jsonResponse({ data: result });
        }
        
        // Route: /api/film/popular
        else if (segments[2] === 'popular') {
          console.log(`[API Gateway] /api/film/popular - Début`);
          const limit = parseInt(params.limit) || 15;
          const result = await filmController.getPopularMovies(limit);
          return jsonResponse({ data: result });
        }
        
        // Route: /api/film/genre/:genre
        else if (segments.length === 4 && segments[2] === 'genre') {
          const genre = segments[3];
          const page = parseInt(params.page) || 1;
          const limit = parseInt(params.limit) || 20;
          const result = await filmController.getMoviesByGenre(genre, page, limit);
          return jsonResponse(result);
        }
        
        // Route: /api/film/:id
        else if (segments.length === 3) {
          const id = segments[2];
          const result = await filmController.getMovieById(id);
          return jsonResponse(result);
        }
        
        // Route: /api/film/:id/streaming
        else if (segments.length === 4 && segments[3] === 'streaming') {
          const id = segments[2];
          const result = await filmController.getMovieStreaming(id);
          return jsonResponse(result);
        }
        
        // Route non trouvée
        else {
          return errorResponse('Endpoint Film non trouvé', 404);
        }
      } catch (error) {
        console.error(`Erreur Film: ${error.message}`);
        console.error(error.stack);
        return errorResponse(error.message, 500);
      }
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
      // Utilisation de la destructuration d'objet comme recommandé
      const { url: streamUrl, referer } = params;
      
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
}

/**
 * Helper pour déterminer le type de contenu
 * @param {Object} content - L'objet de contenu à analyser
 * @returns {string} - Le type de contenu déterminé
 */
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
