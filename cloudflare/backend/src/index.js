/**
 * API Backend FloDrama sur Cloudflare Workers
 * 
 * Ce fichier contient l'implémentation de l'API backend de FloDrama
 * utilisant Cloudflare Workers et itty-router.
 */

// Importation des dépendances
import { Router } from 'itty-router';

// Importation des services
import { mockData } from './mock-data';
import * as d1Service from './d1-service';

// Création du router
const router = Router();

// Middleware CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Route pour vérifier le statut de l'API
router.get('/status', async (request, env) => {
  try {
    // Vérifier la disponibilité de D1
    const d1Status = await d1Service.getD1Status(env.DB);
    
    return new Response(JSON.stringify({
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: d1Status.available ? 'D1' : 'mock',
      d1: d1Status,
      mock_categories: Object.keys(mockData),
      mock_items_count: Object.values(mockData).reduce((acc, items) => acc + items.length, 0)
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    
    return new Response(JSON.stringify({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les dramas (avec alias /drama)
router.get('/dramas', async (request, env) => {
  try {
    const dramas = await d1Service.getAllItems(env.DB, 'dramas', mockData.drama);
    
    return new Response(JSON.stringify(dramas), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Alias pour /drama (redirige vers /dramas)
router.get('/drama', async (request, env) => {
  try {
    const dramas = await d1Service.getAllItems(env.DB, 'dramas', mockData.drama);
    
    return new Response(JSON.stringify(dramas), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour un drama spécifique
router.get('/dramas/:id', async (request, env) => {
  const { id } = request.params;
  
  try {
    const drama = await d1Service.getItemById(env.DB, 'dramas', id, mockData.drama);
    
    if (!drama) {
      return new Response(JSON.stringify({ error: 'Drama non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify(drama), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Alias pour /drama/:id (redirige vers /dramas/:id)
router.get('/drama/:id', async (request, env) => {
  const { id } = request.params;
  
  try {
    const drama = await d1Service.getItemById(env.DB, 'dramas', id, mockData.drama);
    
    if (!drama) {
      return new Response(JSON.stringify({ error: 'Drama non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify(drama), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les films
router.get('/films', async (request, env) => {
  try {
    const films = await d1Service.getAllItems(env.DB, 'films', mockData.film);
    
    return new Response(JSON.stringify(films), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour un film spécifique
router.get('/films/:id', async (request, env) => {
  const { id } = request.params;
  
  try {
    const film = await d1Service.getItemById(env.DB, 'films', id, mockData.film);
    
    if (!film) {
      return new Response(JSON.stringify({ error: 'Film non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify(film), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les animes
router.get('/animes', async (request, env) => {
  try {
    const animes = await d1Service.getAllItems(env.DB, 'animes', mockData.anime);
    
    return new Response(JSON.stringify(animes), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour un anime spécifique
router.get('/animes/:id', async (request, env) => {
  const { id } = request.params;
  
  try {
    const anime = await d1Service.getItemById(env.DB, 'animes', id, mockData.anime);
    
    if (!anime) {
      return new Response(JSON.stringify({ error: 'Anime non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify(anime), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les contenus bollywood
router.get('/bollywood', async (request, env) => {
  try {
    const bollywood = await d1Service.getAllItems(env.DB, 'bollywood', mockData.bollywood);
    
    return new Response(JSON.stringify(bollywood), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour un contenu bollywood spécifique
router.get('/bollywood/:id', async (request, env) => {
  const { id } = request.params;
  
  try {
    const bollywood = await d1Service.getItemById(env.DB, 'bollywood', id, mockData.bollywood);
    
    if (!bollywood) {
      return new Response(JSON.stringify({ error: 'Contenu bollywood non trouvé' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    return new Response(JSON.stringify(bollywood), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les recommandations
router.get('/recommendations', async (request, env) => {
  try {
    const recommendations = await d1Service.getRecommendations(env.DB);
    
    return new Response(JSON.stringify(recommendations), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les contenus mis en avant
router.get('/featured', async (request, env) => {
  try {
    const featured = await d1Service.getFeatured(env.DB);
    
    return new Response(JSON.stringify(featured), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les contenus récents
router.get('/recent', async (request, env) => {
  try {
    const recent = await d1Service.getRecent(env.DB);
    
    return new Response(JSON.stringify(recent), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les contenus en cours de visionnage
router.get('/continue-watching', async (request, env) => {
  try {
    const continueWatching = await d1Service.getContinueWatching(env.DB);
    
    return new Response(JSON.stringify(continueWatching), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour la recherche
router.get('/search', async (request, env) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  if (!query) {
    return new Response(JSON.stringify({ error: 'Paramètre de recherche manquant' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  try {
    const results = await d1Service.searchItems(env.DB, query);
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les contenus similaires
router.get('/similar', async (request, env) => {
  const url = new URL(request.url);
  const contentId = url.searchParams.get('contentId');
  const limit = parseInt(url.searchParams.get('limit') || '6');
  
  if (!contentId) {
    return new Response(JSON.stringify({ error: 'ID de contenu manquant' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  
  try {
    const similarContent = await d1Service.getSimilarContent(env.DB, contentId, limit);
    
    return new Response(JSON.stringify(similarContent), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route pour les tendances
router.get('/trending', async (request, env) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  try {
    // Pour l'instant, nous utilisons les contenus mis en avant comme tendances
    const trending = await d1Service.getFeatured(env.DB);
    
    return new Response(JSON.stringify(trending.slice(0, limit)), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Route de diagnostic
router.get('/diagnostic', async (request, env) => {
  try {
    // Vérifier la disponibilité de D1
    const d1Status = await d1Service.getD1Status(env.DB);
    
    return new Response(JSON.stringify({
      status: 'ok',
      environment: 'cloudflare',
      timestamp: new Date().toISOString(),
      account_id: env.ACCOUNT_ID || '42fc982266a2c31b942593b18097e4b3',
      database: d1Status.available ? 'D1' : 'mock',
      d1: d1Status,
      mock_categories: Object.keys(mockData),
      mock_items_count: Object.values(mockData).reduce((acc, items) => acc + items.length, 0)
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Gestion des requêtes OPTIONS (CORS preflight)
router.options('*', () => {
  return new Response(null, {
    headers: corsHeaders,
  });
});

// Gestion des routes non trouvées
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Route non trouvée' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

// Fonction principale du Worker
export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};
