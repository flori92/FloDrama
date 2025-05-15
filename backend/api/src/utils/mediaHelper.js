/**
 * @file mediaHelper.js
 * @description Utilitaires pour la validation et le traitement des médias
 */

/**
 * Vérifie si un identifiant média est valide
 * @param {string} mediaId - Identifiant du média à vérifier
 * @returns {boolean} - True si l'identifiant est valide
 */
export function isValidMediaId(mediaId) {
  // Format typique d'un ID Cloudflare Stream : 31c1578a623bce2f5e2c2d8eda420c2e
  const streamIdRegex = /^[a-f0-9]{32}$/i;
  
  // Format de type custom pour les médias internes
  const customIdRegex = /^[a-zA-Z0-9_-]{6,64}$/;
  
  return streamIdRegex.test(mediaId) || customIdRegex.test(mediaId);
}

/**
 * Détermine le type de média à partir du chemin et des paramètres
 * @param {string} path - Chemin de l'URL
 * @param {URLSearchParams} searchParams - Paramètres de requête
 * @returns {string} - Type de média identifié
 */
export function getMediaType(path, searchParams) {
  // Vérifier d'abord si le type est explicitement spécifié en paramètre
  const explicitType = searchParams.get('type');
  if (explicitType) {
    return explicitType.toLowerCase();
  }
  
  // Sinon, essayer de déterminer à partir du chemin
  if (path.includes('/trailer/')) {
    return 'trailer';
  }
  
  if (path.includes('/movie/')) {
    return 'movie';
  }
  
  if (path.includes('/episode/')) {
    return 'episode';
  }
  
  if (path.includes('/poster/')) {
    return 'poster';
  }
  
  if (path.includes('/backdrop/')) {
    return 'backdrop';
  }
  
  // Type par défaut
  return 'video';
}

/**
 * Génère une URL sécurisée pour accéder à un média sur Cloudflare Stream
 * @param {string} mediaId - Identifiant du média
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {string} - URL sécurisée
 */
export function generateSecureMediaUrl(mediaId, env) {
  const streamAccountId = env.STREAM_ACCOUNT_ID;
  return `https://customer-${streamAccountId}.cloudflarestream.com/${mediaId}/watch`;
}

/**
 * Récupère les métadonnées d'un média depuis le stockage KV
 * @param {string} mediaId - Identifiant du média
 * @param {Object} env - Variables d'environnement du Worker
 * @returns {Promise<Object|null>} - Métadonnées du média ou null si non trouvé
 */
export async function getMediaMetadata(mediaId, env) {
  try {
    const metadata = await env.METADATA_STORE.get(`media:${mediaId}`, 'json');
    return metadata;
  } catch (error) {
    console.error(`Erreur lors de la récupération des métadonnées pour ${mediaId}:`, error);
    return null;
  }
}
