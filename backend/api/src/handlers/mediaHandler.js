/**
 * @file mediaHandler.js
 * @description Gestionnaire des requêtes media pour FloDrama API Gateway
 * 
 * Ce module centralise la gestion des ressources médias (videos, images) avec:
 * - Vérification proactive de l'existence des ressources
 * - Validation des URLs et redirections sécurisées
 * - Gestion des erreurs avec fallbacks intelligents
 * - Mise en cache et optimisation des performances
 */

import { createResponse, errorResponse, streamResponse } from '../utils/responseHelper.js';
import { logInfo, logError, logDebug } from '../utils/logger.js';
import { isValidMediaId, getMediaType } from '../utils/mediaHelper.js';

/**
 * Vérification de l'existence d'une ressource média sur Cloudflare Stream
 * @param {string} mediaId - Identifiant de la ressource média
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Promise<boolean>} - True si la ressource existe
 */
export async function checkMediaExists(mediaId, env) {
  try {
    // Vérifier d'abord dans le cache KV pour éviter des appels API inutiles
    const cachedStatus = await env.METADATA_STORE.get(`media_status:${mediaId}`);
    if (cachedStatus) {
      return cachedStatus === 'exists';
    }

    // Vérification via l'API Cloudflare Stream
    const streamAccountId = env.STREAM_ACCOUNT_ID;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${streamAccountId}/stream/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Analyser la réponse
    const exists = response.status === 200;
    
    // Mettre en cache le résultat pendant 1 heure
    await env.METADATA_STORE.put(
      `media_status:${mediaId}`, 
      exists ? 'exists' : 'not_found',
      { expirationTtl: 3600 }
    );
    
    return exists;
  } catch (error) {
    logError(`Erreur de vérification du média ${mediaId}: ${error.message}`, env);
    // En cas d'erreur, supposons que le média existe pour éviter les faux négatifs
    return true;
  }
}

/**
 * Obtenir l'URL de fallback appropriée selon le type de média
 * @param {string} mediaType - Type de média (trailer, episode, movie, etc.)
 * @returns {string} - URL du placeholder approprié
 */
function getFallbackUrl(mediaType) {
  const fallbacks = {
    'trailer': '/images/placeholder-trailer.jpg',
    'episode': '/images/placeholder-episode.jpg',
    'movie': '/images/placeholder-movie.jpg',
    'backdrop': '/images/placeholder-backdrop.jpg',
    'poster': '/images/placeholder.jpg',
    // Fallback par défaut
    'default': '/images/placeholder.jpg'
  };
  
  return fallbacks[mediaType] || fallbacks.default;
}

/**
 * Traitement principal des requêtes média
 */
export async function handleMediaRequest(request, env, ctx, reqContext) {
  const url = new URL(request.url);
  const path = url.pathname;
  const mediaId = path.split('/').pop();
  
  // Validation de l'identifiant média
  if (!isValidMediaId(mediaId)) {
    return errorResponse({
      status: 400,
      error: 'Identifiant média invalide',
      details: 'Format d\'identifiant non reconnu'
    });
  }
  
  // Déterminer le type de média à partir de l'URL ou des paramètres
  const mediaType = getMediaType(path, url.searchParams);
  
  try {
    // Vérification préalable de l'existence de la ressource
    logDebug(`Vérification du média ${mediaId} de type ${mediaType}`, env);
    const exists = await checkMediaExists(mediaId, env);
    
    if (!exists) {
      logInfo(`Média non trouvé: ${mediaId}, redirection vers fallback`, env);
      // Retourner une réponse JSON avec l'URL de fallback
      return createResponse({
        error: 'Média non disponible',
        mediaId,
        mediaType,
        fallbackUrl: getFallbackUrl(mediaType)
      }, 404);
    }
    
    // Construction de l'URL Cloudflare Stream pour le média
    const streamUrl = `https://customer-${env.STREAM_ACCOUNT_ID}.cloudflarestream.com/${mediaId}/watch`;
    
    // Mode de redirection ou de proxy selon la configuration
    const directStreamMode = url.searchParams.get('direct') === 'true';
    
    if (directStreamMode) {
      // Redirection vers Cloudflare Stream
      return Response.redirect(streamUrl, 302);
    } else {
      // Mode proxy par défaut - récupérer et transmettre le contenu
      logDebug(`Proxying média ${mediaId} depuis Cloudflare Stream`, env);
      const streamResponse = await fetch(streamUrl);
      
      // Si la réponse de Stream est une erreur
      if (!streamResponse.ok) {
        logError(`Erreur Stream pour ${mediaId}: ${streamResponse.status}`, env);
        return createResponse({
          error: `Erreur lors du chargement du média`,
          mediaId,
          mediaType,
          statusCode: streamResponse.status,
          fallbackUrl: getFallbackUrl(mediaType)
        }, streamResponse.status);
      }
      
      // Transmission de la réponse de Stream avec conservation des en-têtes
      return new Response(streamResponse.body, {
        status: streamResponse.status,
        headers: {
          'Content-Type': streamResponse.headers.get('Content-Type'),
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    // Gestion des erreurs avec logging détaillé
    logError(`Erreur lors du traitement média ${mediaId}: ${error.message}`, env);
    
    // Retourner une réponse d'erreur avec fallback
    return createResponse({
      error: 'Erreur technique',
      details: env.ENVIRONMENT === 'production' ? undefined : error.message,
      mediaId,
      mediaType,
      fallbackUrl: getFallbackUrl(mediaType),
      requestId: reqContext.id
    }, 500);
  }
}
