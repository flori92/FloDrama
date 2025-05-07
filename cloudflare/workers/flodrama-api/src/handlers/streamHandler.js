/**
 * @file streamHandler.js
 * @description Gestionnaire des requêtes de streaming pour FloDrama API
 * 
 * Ce module centralise les opérations liées au streaming vidéo:
 * - Récupération et validation des informations de stream
 * - Génération des tokens de visionnage sécurisés
 * - Gestion des limites de bande passante et des restrictions d'accès
 */

import { createResponse, errorResponse } from '../utils/responseHelper.js';
import { logInfo, logError, logDebug } from '../utils/logger.js';
import { isValidMediaId, generateSecureMediaUrl } from '../utils/mediaHelper.js';

/**
 * Récupération des informations d'un stream Cloudflare
 * @param {string} streamId - Identifiant du stream Cloudflare
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Promise<Object>} - Informations détaillées du stream
 */
async function getStreamInfo(streamId, env) {
  try {
    // Vérifier d'abord dans le cache KV
    const cachedInfo = await env.METADATA_STORE.get(`stream_info:${streamId}`, 'json');
    if (cachedInfo) {
      return cachedInfo;
    }
    
    // Sinon, récupérer depuis l'API Cloudflare Stream
    const streamAccountId = env.STREAM_ACCOUNT_ID;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${streamAccountId}/stream/${streamId}`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Analyser la réponse
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des informations du stream: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extraire les informations pertinentes
    const streamInfo = {
      id: data.result.uid,
      duration: data.result.duration,
      size: data.result.size,
      status: data.result.status.state,
      thumbnailUrl: data.result.thumbnail,
      createdAt: data.result.created,
      lastModified: data.result.modified,
      readyToStream: data.result.readyToStream,
      formats: data.result.meta.formats || []
    };
    
    // Mettre en cache pour les prochaines requêtes (30 minutes)
    await env.METADATA_STORE.put(`stream_info:${streamId}`, JSON.stringify(streamInfo), {
      expirationTtl: 1800
    });
    
    return streamInfo;
  } catch (error) {
    logError(`Erreur lors de la récupération des informations du stream ${streamId}: ${error.message}`, env);
    throw error;
  }
}

/**
 * Génération d'un token de lecture pour un stream (si nécessaire)
 * @param {string} streamId - Identifiant du stream
 * @param {Object} options - Options du token (durée, restrictions IP, etc.)
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {string} - Token de lecture (JWT)
 */
async function generateStreamToken(streamId, options, env) {
  // Note: Cette fonctionnalité serait à implémenter si vous utilisez les tokens Cloudflare Stream
  // Pour cette version initiale, nous retournons simplement une URL non signée
  return null;
}

/**
 * Traitement principal des requêtes de streaming
 * @param {Request} request - Requête HTTP
 * @param {Object} env - Variables d'environnement
 * @param {Object} ctx - Contexte d'exécution du Worker
 * @param {Object} reqContext - Contexte de la requête pour journalisation
 * @returns {Promise<Response>} - Réponse HTTP
 */
export async function handleStreamRequest(request, env, ctx, reqContext) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Gestion des infos d'un stream spécifique
  if (path.match(/^\/api\/stream\/([^\/]+)$/)) {
    const streamId = path.split('/').pop();
    
    // Validation de l'ID du stream
    if (!isValidMediaId(streamId)) {
      return errorResponse({
        status: 400,
        error: 'Identifiant de stream invalide',
        details: 'Format d\'identifiant non reconnu'
      });
    }
    
    try {
      // Récupérer les informations du stream
      const streamInfo = await getStreamInfo(streamId, env);
      
      // Si le stream n'est pas prêt à être diffusé
      if (!streamInfo.readyToStream) {
        return createResponse({
          ...streamInfo,
          error: 'Stream non disponible',
          fallbackUrl: '/images/placeholder-video.jpg'
        }, 200);
      }
      
      // Construction de l'URL de visionnage
      const watchUrl = generateSecureMediaUrl(streamId, env);
      
      // Générer un token si nécessaire (fonctionnalité avancée)
      const requireToken = url.searchParams.get('token') === 'true';
      let token = null;
      
      if (requireToken) {
        token = await generateStreamToken(streamId, {
          expiresIn: '1h',
          clientIp: request.headers.get('CF-Connecting-IP')
        }, env);
      }
      
      // Retourner les informations complètes du stream
      return createResponse({
        ...streamInfo,
        watchUrl,
        token
      });
    } catch (error) {
      logError(`Erreur stream ${streamId}: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: 'Erreur lors de la récupération du stream',
        details: env.ENVIRONMENT === 'production' ? undefined : error.message,
        fallbackUrl: '/images/placeholder-video.jpg'
      });
    }
  }
  
  // Route pour lister tous les streams disponibles
  if (path === '/api/stream' || path === '/api/stream/list') {
    try {
      // Cette fonctionnalité nécessiterait un appel à l'API Cloudflare Stream
      // Pour lister tous les streams disponibles
      // À implémenter dans une version ultérieure
      
      return createResponse({
        message: 'Fonctionnalité de liste des streams en cours d\'implémentation',
        availableSoon: true
      });
    } catch (error) {
      logError(`Erreur liste des streams: ${error.message}`, env);
      return errorResponse({
        status: 500,
        error: 'Erreur lors de la récupération de la liste des streams',
        details: env.ENVIRONMENT === 'production' ? undefined : error.message
      });
    }
  }
  
  // Route non supportée
  return errorResponse({
    status: 404,
    error: 'Route de streaming non trouvée',
    path
  });
}
