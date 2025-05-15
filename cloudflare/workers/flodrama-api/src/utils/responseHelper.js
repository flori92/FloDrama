/**
 * @file responseHelper.js
 * @description Utilitaires pour générer des réponses standardisées pour l'API
 */

import { addCorsHeaders } from './corsHelper.js';

/**
 * Création d'une réponse JSON standardisée
 * @param {Object} data - Données à inclure dans la réponse
 * @param {number} status - Code de statut HTTP (défaut: 200)
 * @param {Request} request - Requête entrante pour CORS
 * @returns {Response} - Objet Response formaté
 */
export function createResponse(data, status = 200, request) {
  // Préparer les en-têtes de base
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-cache'
  };
  
  // Si une requête est fournie, ajouter des en-têtes de sécurité supplémentaires
  if (request) {
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
  }
  
  const baseResponse = new Response(
    JSON.stringify(data),
    { status, headers }
  );
  
  // Ajouter les en-têtes CORS si une requête est fournie
  return request ? addCorsHeaders(baseResponse, request) : baseResponse;
}

/**
 * Création d'une réponse d'erreur standardisée
 * @param {Object} options - Options de l'erreur
 * @param {number} options.status - Code de statut HTTP (défaut: 400)
 * @param {string} options.error - Message d'erreur principal
 * @param {Request} options.request - Requête entrante pour CORS
 * @param {Object} options.details - Détails supplémentaires (optionnel)
 * @returns {Response} - Objet Response pour l'erreur
 */
export function errorResponse({ status = 400, error, request, ...details }) {
  // Détecter si l'erreur est liée à CORS
  const isCorsError = error && (
    typeof error === 'string' && (
      error.includes('CORS') || 
      error.includes('cross-origin') || 
      error.includes('Access-Control')
    )
  );
  
  // Si c'est une erreur CORS, forcer le statut 403 pour une meilleure compatibilité
  const finalStatus = isCorsError ? 403 : status;
  
  return createResponse({ 
    success: false, 
    error, 
    ...details 
  }, finalStatus, request);
}

/**
 * Création d'une réponse de flux pour les médias
 * @param {ReadableStream} stream - Stream de données binaires
 * @param {string} contentType - Type de contenu MIME
 * @param {number} status - Code de statut HTTP (défaut: 200)
 * @param {Request} request - Requête entrante pour CORS
 * @returns {Response} - Objet Response pour le stream
 */
export function streamResponse(stream, contentType, status = 200, request) {
  // Préparer les en-têtes de base pour les médias
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=3600'
  };
  
  // Ajouter des en-têtes spécifiques pour les médias
  if (contentType.startsWith('video/') || contentType.startsWith('audio/')) {
    headers['Accept-Ranges'] = 'bytes';
  }
  
  // Si une requête est fournie, ajouter des en-têtes de sécurité supplémentaires
  if (request) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }
  
  const baseResponse = new Response(stream, {
    status,
    headers
  });
  
  // Ajouter les en-têtes CORS si une requête est fournie
  return request ? addCorsHeaders(baseResponse, request) : baseResponse;
}
