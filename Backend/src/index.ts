/**
 * Point d'entrée principal de l'API FloDrama sur Cloudflare Workers
 */

import { logger } from './utils/logger';

// Types pour l'environnement Cloudflare Workers
export interface Env {
  // Bindings Cloudflare
  DB: D1Database;
  STORAGE: R2Bucket;
  CACHE: KVNamespace;
  
  // Variables d'environnement
  ENVIRONMENT: string;
  API_VERSION: string;
}

// Gestionnaire de requêtes
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Configuration CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Gestion des requêtes OPTIONS (pre-flight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Journalisation de la requête
      logger.info(`Requête reçue: ${request.method} ${path}`);

      // Point de terminaison de santé
      if (path === '/health' || path === '/api/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          version: env.API_VERSION,
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Routage API
      if (path.startsWith('/api/')) {
        // TODO: Implémenter le routage complet ici
        
        // Exemple de réponse par défaut
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Endpoint non implémenté'
        }), {
          status: 501,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Réponse 404 pour les routes non gérées
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Route non trouvée'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      // Journalisation de l'erreur
      logger.error('Erreur non gérée:', error);
      
      // Réponse d'erreur générique
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Erreur serveur interne'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },

  // Gestionnaire d'événements planifiés
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    logger.info(`Exécution planifiée déclenchée: ${event.cron}`);
    
    // TODO: Implémenter la logique des tâches planifiées
  }
};
