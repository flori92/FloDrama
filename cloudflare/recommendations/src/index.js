/**
 * Point d'entrée principal de l'API de recommandation FloDrama
 * Gère les requêtes HTTP et les routes de l'API
 */

import { RecommendationService } from './services/recommendation-service.js';
import { ScraperService } from './services/scraper-service.js';
import { getDatabase, checkDatabaseConnection } from './services/database.js';

/**
 * Gestionnaire principal des requêtes HTTP
 */
export default {
  /**
   * Traite les requêtes HTTP entrantes
   * @param {Request} request - Requête HTTP
   * @param {Object} env - Variables d'environnement
   * @param {Object} ctx - Contexte d'exécution
   * @returns {Promise<Response>} Réponse HTTP
   */
  async fetch(request, env, ctx) {
    // Initialiser les services
    const db = getDatabase(env);
    const kv = env.FLODRAMA_METADATA;
    
    // Vérifier la méthode HTTP
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;
    
    // Journaliser la requête
    console.log(`${method} ${path}`);
    
    // Gérer les routes CORS
    if (method === 'OPTIONS') {
      return this.handleCors();
    }
    
    // Gérer les différentes routes
    try {
      // Route de santé
      if (path === '/health' || path === '/api/health') {
        return this.handleHealthCheck(db);
      }
      
      // Routes de l'API
      if (path.startsWith('/api/')) {
        // Route de recommandations
        if (path === '/api/recommendations' || path.startsWith('/api/recommendations/')) {
          return this.handleRecommendations(request, db, kv, env);
        }
        
        // Route de scraping (protégée par API key)
        if (path === '/api/scrape' || path.startsWith('/api/scrape/')) {
          return this.handleScraping(request, db, kv, env);
        }
        
        // Route de sources
        if (path === '/api/sources' || path.startsWith('/api/sources/')) {
          return this.handleSources(request, db);
        }
        
        // Route inconnue
        return new Response('Endpoint non trouvé', {
          status: 404,
          headers: this.getCorsHeaders()
        });
      }
      
      // Route par défaut
      return new Response('API de recommandation FloDrama', {
        status: 200,
        headers: this.getCorsHeaders()
      });
    } catch (error) {
      console.error('Erreur lors du traitement de la requête:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erreur interne du serveur',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    }
  },

  /**
   * Gère les requêtes de vérification de santé
   * @param {Object} supabase - Client Supabase
   * @returns {Promise<Response>} Réponse HTTP
   */
  async handleHealthCheck(db) {
    try {
      // Vérifier la connexion à D1
      const dbConnected = await checkDatabaseConnection(db);
      
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        cloudflare: true
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    }
  },

  /**
   * Gère les requêtes de recommandations
   * @param {Request} request - Requête HTTP
   * @param {Object} supabase - Client Supabase
   * @param {Object} env - Variables d'environnement
   * @returns {Promise<Response>} Réponse HTTP
   */
  async handleRecommendations(request, db, kv, env) {
    try {
      // Vérifier la méthode
      if (request.method !== 'GET' && request.method !== 'POST') {
        return new Response('Méthode non autorisée', {
          status: 405,
          headers: this.getCorsHeaders()
        });
      }
      
      // Récupérer l'ID utilisateur
      const url = new URL(request.url);
      let userId = url.pathname.split('/').pop();
      
      if (userId === 'recommendations') {
        // Récupérer l'ID utilisateur du corps de la requête ou des en-têtes
        if (request.method === 'POST') {
          const body = await request.json();
          userId = body.userId || body.user_id;
        } else {
          userId = request.headers.get('x-user-id');
        }
      }
      
      // Vérifier que l'ID utilisateur est valide
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'ID utilisateur requis'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...this.getCorsHeaders()
          }
        });
      }
      
      // Récupérer les options de recommandation
      let options = {};
      
      if (request.method === 'POST') {
        const body = await request.json();
        options = {
          limit: body.limit || 20,
          types: body.types || [],
          genres: body.genres || []
        };
      } else {
        options = {
          limit: parseInt(url.searchParams.get('limit') || '20'),
          types: url.searchParams.get('types') ? url.searchParams.get('types').split(',') : [],
          genres: url.searchParams.get('genres') ? url.searchParams.get('genres').split(',') : []
        };
      }
      
      // Générer les recommandations
      const recommender = new RecommendationService({ db, kv });
      const recommendations = await recommender.getPersonalizedRecommendations(userId, options);
      
      // Retourner les recommandations
      return new Response(JSON.stringify({
        success: true,
        data: recommendations,
        meta: {
          count: recommendations.length,
          user_id: userId,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erreur lors de la génération des recommandations',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    }
  },

  /**
   * Gère les requêtes de scraping
   * @param {Request} request - Requête HTTP
   * @param {Object} supabase - Client Supabase
   * @param {Object} env - Variables d'environnement
   * @returns {Promise<Response>} Réponse HTTP
   */
  async handleScraping(request, db, kv, env) {
    try {
      // Vérifier la méthode
      if (request.method !== 'POST') {
        return new Response('Méthode non autorisée', {
          status: 405,
          headers: this.getCorsHeaders()
        });
      }
      
      // Vérifier l'API key
      const apiKey = request.headers.get('x-api-key');
      
      if (!apiKey || apiKey !== env.API_KEY) {
        return new Response(JSON.stringify({
          success: false,
          error: 'API key invalide'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...this.getCorsHeaders()
          }
        });
      }
      
      // Récupérer les options de scraping
      const body = await request.json();
      const options = {
        sourceId: body.sourceId || body.source_id,
        concurrency: body.concurrency || 2,
        maxRetries: body.maxRetries || body.max_retries || 3
      };
      
      // Initialiser le service de scraping
      const scraper = new ScraperService({
        db,
        kv,
        concurrency: options.concurrency,
        maxRetries: options.maxRetries
      });
      
      // Exécuter le scraping
      let results;
      
      // Vérifier si un paramètre max_sources est spécifié
      const maxSources = body.max_sources || body.maxSources || 0;
      
      // Vérifier si des sources à ignorer sont spécifiées
      const skipSourceIds = body.skip_sources || body.skipSources || [];
      
      if (options.sourceId) {
        // Scraper une source spécifique
        console.log(`Scraping de la source spécifique: ${options.sourceId}`);
        const source = { id: options.sourceId };
        const data = await scraper.scrapeSourceWithRetry(source);
        
        results = {
          [options.sourceId]: {
            success: true,
            count: data.length,
            data: data.slice(0, 5) // Limiter les données retournées
          }
        };
      } else {
        // Scraper toutes les sources ou un nombre limité de sources
        console.log(`Scraping de sources avec limite: ${maxSources || 'aucune'}, sources à ignorer: ${skipSourceIds.length || 0}`);
        results = await scraper.scrapeAllSources(maxSources, skipSourceIds);
      }
      
      // Retourner les résultats
      return new Response(JSON.stringify({
        success: true,
        data: results,
        meta: {
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    } catch (error) {
      console.error('Erreur lors du scraping:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erreur lors du scraping',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    }
  },

  /**
   * Gère les requêtes de sources
   * @param {Request} request - Requête HTTP
   * @param {Object} supabase - Client Supabase
   * @returns {Promise<Response>} Réponse HTTP
   */
  async handleSources(request, db) {
    try {
      // Vérifier la méthode
      if (request.method !== 'GET') {
        return new Response('Méthode non autorisée', {
          status: 405,
          headers: this.getCorsHeaders()
        });
      }
      
      // Récupérer les sources
      const { results } = await db
        .prepare('SELECT * FROM sources ORDER BY name')
        .all();
      
      if (!results) {
        throw new Error('Erreur lors de la récupération des sources');
      }
      
      // Retourner les sources
      return new Response(JSON.stringify({
        success: true,
        data: results || [],
        meta: {
          count: results ? results.length : 0,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des sources:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erreur lors de la récupération des sources',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders()
        }
      });
    }
  },

  /**
   * Gère les requêtes CORS
   * @returns {Response} Réponse HTTP
   */
  handleCors() {
    return new Response(null, {
      status: 204,
      headers: this.getCorsHeaders()
    });
  },

  /**
   * Retourne les en-têtes CORS
   * @returns {Object} En-têtes CORS
   */
  getCorsHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID'
    };
  }
};
