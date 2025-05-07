/**
 * @file responseHelper.js
 * @description Utilitaires pour générer des réponses standardisées pour l'API
 */

/**
 * Création d'une réponse JSON standardisée
 * @param {Object} data - Données à inclure dans la réponse
 * @param {number} status - Code de statut HTTP (défaut: 200)
 * @returns {Response} - Objet Response formaté
 */
export function createResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-cache'
      }
    }
  );
}

/**
 * Création d'une réponse d'erreur standardisée
 * @param {Object} options - Options de l'erreur
 * @param {number} options.status - Code de statut HTTP (défaut: 400)
 * @param {string} options.error - Message d'erreur principal
 * @param {Object} options.details - Détails supplémentaires (optionnel)
 * @returns {Response} - Objet Response pour l'erreur
 */
export function errorResponse({ status = 400, error, ...details }) {
  return createResponse({ 
    success: false, 
    error, 
    ...details 
  }, status);
}

/**
 * Création d'une réponse de flux pour les médias
 * @param {ReadableStream} stream - Stream de données binaires
 * @param {string} contentType - Type de contenu MIME
 * @param {number} status - Code de statut HTTP (défaut: 200)
 * @returns {Response} - Objet Response pour le stream
 */
export function streamResponse(stream, contentType, status = 200) {
  return new Response(stream, {
    status,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
