/**
 * @file index.js
 * @description Point d'entrée principal du Worker FloDrama API Gateway
 * 
 * Cette API centralisée gère toutes les interactions avec les ressources médias
 * et sert d'interface unifiée entre le frontend et les services Cloudflare (Stream, R2, KV).
 * 
 * Architecture:
 * - Validation des requêtes et authentification
 * - Routage vers les handlers spécialisés
 * - Gestion centralisée des erreurs et fallbacks
 * - Journalisation structurée
 */

import { handleContentRequest } from './handlers/contentHandler.js';
import { handleStreamRequest } from './handlers/streamHandler.js';
import { handleMediaRequest } from './handlers/mediaHandler.js';
import { createResponse, errorResponse } from './utils/responseHelper.js';
import { setupCORS } from './utils/corsHelper.js';
import { logRequest, logError } from './utils/logger.js';

/**
 * Gestionnaire principal des requêtes entrantes vers l'API
 */
export default {
  /**
   * Gestionnaire principal des requêtes entrantes vers l'API
   * Amélioré pour une meilleure gestion des CORS
   */
  async fetch(request, env, ctx) {
    // Initialisation du contexte et journalisation
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const startTime = Date.now();

    // Structure pour journalisation enrichie
    const reqContext = {
      id: requestId,
      method: request.method,
      url: url.pathname,
      timestamp: new Date().toISOString()
    };

    // Journalisation de la requête entrante
    logRequest(reqContext, env);

    try {
      // Gestion des requêtes OPTIONS (preflight) pour CORS
      if (request.method === 'OPTIONS') {
        // Log des requêtes OPTIONS pour débogage
        const origin = request.headers.get('Origin');
        logRequest({
          ...reqContext,
          type: 'cors-preflight',
          origin
        }, env);
        
        return setupCORS(request);
      }

      // Routage basé sur le chemin d'accès
      if (url.pathname.startsWith('/api/content')) {
        return await handleContentRequest(request, env, ctx, reqContext);
      }

      // Ajout du routage explicite pour les contenus principaux
      if (
        url.pathname.startsWith('/api/animes') ||
        url.pathname.startsWith('/api/dramas') ||
        url.pathname.startsWith('/api/films') ||
        url.pathname.startsWith('/api/bollywood')
      ) {
        return await handleContentRequest(request, env, ctx, reqContext);
      }
      
      if (url.pathname.startsWith('/api/stream')) {
        return await handleStreamRequest(request, env, ctx, reqContext);
      }
      
      if (url.pathname.startsWith('/media/')) {
        return await handleMediaRequest(request, env, ctx, reqContext);
      }

      // Route par défaut
      if (url.pathname === '/' || url.pathname === '/api') {
        // Ajouter des informations CORS pour faciliter le débogage
        const origin = request.headers.get('Origin');
        const corsInfo = origin ? { corsOrigin: origin } : {};
        
        return createResponse({ 
          status: 'ok',
          version: '1.0.0',
          environment: env.ENVIRONMENT,
          endpoints: ['/api/content', '/api/stream', '/media/'],
          ...corsInfo
        }, 200, request); // Transmettre la requête pour les en-têtes CORS
      }
      
      // Route non trouvée
      return errorResponse({
        status: 404,
        error: 'Route non trouvée',
        path: url.pathname,
        request // Transmettre la requête pour les en-têtes CORS
      });
    } catch (error) {
      // Détection spécifique des erreurs CORS
      const isCorsError = error.message && (
        error.message.includes('CORS') || 
        error.message.includes('cross-origin') ||
        error.message.includes('Access-Control')
      );
      
      // Journalisation et traitement des erreurs non gérées
      logError({
        ...reqContext,
        error: error.message,
        stack: error.stack,
        isCorsError,
        origin: request.headers.get('Origin')
      }, env);
      
      // Si c'est une erreur CORS, ajouter des informations spécifiques
      const corsInfo = isCorsError ? {
        corsError: true,
        corsOrigin: request.headers.get('Origin'),
        corsHelp: "Vérifiez que l'origine est autorisée dans corsHelper.js"
      } : {};
      
      return errorResponse({
        status: 500,
        error: isCorsError ? 'Erreur CORS' : 'Erreur interne du serveur',
        reference: requestId,
        request, // Transmettre la requête pour les en-têtes CORS
        message: env.ENVIRONMENT === 'production' ? 
          'Une erreur est survenue lors du traitement de votre requête.' : 
          error.message,
        ...corsInfo
      });
    } finally {
      // Journalisation du temps de traitement total
      const processingTime = Date.now() - startTime;
      ctx.waitUntil(
        logRequest({
          ...reqContext,
          processingTime,
          completed: true
        }, env)
      );
    }
  }
};
