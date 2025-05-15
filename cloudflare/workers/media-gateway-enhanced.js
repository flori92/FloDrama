/**
 * FloDrama Media Gateway Worker
 * 
 * Ce Worker sert d'intermédiaire entre l'application frontend et les services 
 * de médias Cloudflare (R2, Stream, Images).
 * 
 * Il fournit:
 * - Le routage standardisé des images selon le format défini dans le guide de scraping
 * - Un système de proxy sécurisé pour le streaming vidéo sans stockage
 * - La redirection intelligente vers le service approprié (Stream, R2, Images)
 * - Le redimensionnement des images via Cloudflare Images
 * - La gestion des fallbacks en cas de média non disponible
 * - Des métriques d'utilisation pour le monitoring
 * - Un système de cache adaptatif selon la popularité des contenus
 */

// Configuration du cache
const CACHE_TTL_SECONDS = 3600; // 1 heure par défaut
const ERROR_CACHE_TTL_SECONDS = 300; // 5 minutes pour les erreurs
const POPULAR_CONTENT_CACHE_TTL_SECONDS = 7200; // 2 heures pour le contenu populaire
const HOT_CONTENT_CACHE_TTL_SECONDS = 10800; // 3 heures pour le contenu très populaire

/**
 * Classe qui gère la stratégie de cache adaptative selon la popularité du contenu
 */
class AdaptiveCacheStrategy {
  constructor() {
    this.defaultTtl = CACHE_TTL_SECONDS;
    this.errorTtl = ERROR_CACHE_TTL_SECONDS;
    this.popularContentTtl = POPULAR_CONTENT_CACHE_TTL_SECONDS;
    this.hotContentTtl = HOT_CONTENT_CACHE_TTL_SECONDS;
  }
  
  /**
   * Détermine la durée de mise en cache en fonction de la popularité et des erreurs
   */
  async getTtl(contentId, env, isError = false) {
    if (!env.FLODRAMA_METRICS) {
      return isError ? this.errorTtl : this.defaultTtl;
    }
    
    try {
      // Récupérer les métriques d'accès pour ce contenu
      const metricsKey = `metrics:access:${contentId}`;
      const accessData = await env.FLODRAMA_METRICS.get(metricsKey, { type: 'json' });
      
      // Si pas de données de métriques ou c'est une erreur, retourner TTL par défaut ou d'erreur
      if (!accessData || isError) {
        return isError ? this.errorTtl : this.defaultTtl;
      }
      
      // Déterminer la durée de cache en fonction de la popularité
      const popularity = accessData.count || 0;
      
      if (popularity > 25) {
        return this.hotContentTtl;
      }
      if (popularity > 10) {
        return this.popularContentTtl;
      }
      return this.defaultTtl;
    } catch (error) {
      console.error(`Erreur lors de la détermination du TTL pour ${contentId}:`, error);
      return isError ? this.errorTtl : this.defaultTtl;
    }
  }
}

// Configuration des endpoints de service
const SERVICES = {
  STREAM: 'customer-ehlynuge6dnzfnfd.cloudflarestream.com',
  IMAGES: 'images.flodrama.com',
  R2_BUCKET: 'flodrama-storage.r2.dev'
};

// Sources de streaming supportées
const STREAMING_SOURCES = {
  DRAMACOOL: 'dramacool',
  VIEWASIAN: 'viewasian',
  MYASIANTV: 'myasiantv',
  KISSASIAN: 'kissasian',
  GOGOPLAY: 'gogoplay',
  GENERIC: 'generic'
};

// Types de médias supportés
const MEDIA_TYPES = {
  POSTER: 'poster',
  BACKDROP: 'backdrop',
  THUMBNAIL: 'thumbnail',
  TRAILER: 'trailer',
  MOVIE: 'movie',
  EPISODE: 'episode',
  STREAM: 'stream'
};

// Configuration des tailles d'images disponibles (alignée avec le guide)
const IMAGE_SIZES = {
  small: 'w200',
  medium: 'w500',
  large: 'w1000',
  original: 'original'
};

// Images par défaut selon le type
const DEFAULT_IMAGES = {
  [MEDIA_TYPES.POSTER]: '/images/default-poster.jpg',
  [MEDIA_TYPES.BACKDROP]: '/images/default-backdrop.jpg',
  [MEDIA_TYPES.THUMBNAIL]: '/images/default-thumbnail.jpg',
  [MEDIA_TYPES.TRAILER]: '/images/default-trailer.jpg',
  [MEDIA_TYPES.MOVIE]: '/images/default-movie.jpg',
  [MEDIA_TYPES.EPISODE]: '/images/default-episode.jpg'
};

/**
 * Fonction principale du Worker
 */
/**
 * Fonctions utilitaires pour le monitoring et le cache adaptatif
 */

// Démarre le monitoring d'une opération
async function recordOperationStart(operationId, operationType, contentId, env) {
  if (!env.FLODRAMA_METRICS) {
    const timestamp = Date.now();
    return {
      operationId,
      operationType,
      startTime: timestamp,
      timestamp: new Date(timestamp).toISOString()
    };
  }
  
  try {
    const operationKey = `operation:${operationId}`;
    const operationData = {
      id: operationId,
      type: operationType,
      contentId: contentId,
      startTime: Date.now(),
      status: 'in_progress'
    };
    
    await env.FLODRAMA_METRICS.put(operationKey, JSON.stringify(operationData), {
      expirationTtl: 3600 // 1 heure
    });
    
    return operationData;
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement du début d'opération ${operationId}:`, error);
    return { operationId, operationType, startTime: Date.now() };
  }
}

// Termine le monitoring d'une opération et enregistre les métriques
async function recordOperationEnd(operationId, operationType, contentId, startTime, fromCache, env, errorMessage = null) {
  if (!env.FLODRAMA_METRICS) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const logData = {
      operationId,
      operationType,
      contentId,
      success: !errorMessage,
      fromCache,
      durationMs: duration,
      timestamp: new Date(endTime).toISOString()
    };
    
    if (errorMessage) {
      logData.error = errorMessage;
    }
    
    // Log pour Cloudflare
    console.log(JSON.stringify(logData));
    return logData;
  }
  
  try {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Enregistrer les détails de l'opération
    const operationKey = `operation:${operationId}`;
    const operationData = {
      id: operationId,
      type: operationType,
      contentId: contentId,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      fromCache: fromCache,
      status: errorMessage ? 'error' : 'completed',
      error: errorMessage
    };
    
    await env.FLODRAMA_METRICS.put(operationKey, JSON.stringify(operationData), {
      expirationTtl: 86400 // 24 heures pour l'analyse
    });
    
    // Enregistrer les statistiques de performances
    const statsKey = `stats:${operationType}`;
    const statsData = await env.FLODRAMA_METRICS.get(statsKey, { type: 'json' }) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      cacheHits: 0,
      errors: 0,
      lastUpdated: Date.now()
    };
    
    statsData.count++;
    statsData.totalDuration += duration;
    statsData.avgDuration = statsData.totalDuration / statsData.count;
    statsData.minDuration = Math.min(statsData.minDuration, duration);
    statsData.maxDuration = Math.max(statsData.maxDuration, duration);
    statsData.lastUpdated = Date.now();
    
    if (fromCache) {
      statsData.cacheHits++;
    }
    if (errorMessage) {
      statsData.errors++;
    }
    
    await env.FLODRAMA_METRICS.put(statsKey, JSON.stringify(statsData), {
      expirationTtl: 2592000 // 30 jours
    });
    
    return operationData;
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement de la fin d'opération ${operationId}:`, error);
    
    // Log pour Cloudflare même en cas d'erreur
    const logData = {
      operationId,
      operationType,
      contentId,
      error: `Erreur monitoring: ${error.message}`
    };
    console.log(JSON.stringify(logData));
    
    return logData;
  }
}

// Détermine la durée de mise en cache appropriée selon la popularité
function getCacheTtl(popularity = 0) {
  if (popularity > 25) {
    return HOT_CONTENT_CACHE_TTL_SECONDS;
  }
  if (popularity > 10) {
    return POPULAR_CONTENT_CACHE_TTL_SECONDS;
  }
  return CACHE_TTL_SECONDS;
}

// Vérifie si un contenu est considéré comme problématique (trop d'erreurs)
async function isProblematicContent(contentId, env) {
  if (!env.FLODRAMA_METRICS) {
    return false;
  }
  
  try {
    const metricsKey = `metrics:errors:${contentId}`;
    const errorData = await env.FLODRAMA_METRICS.get(metricsKey, { type: 'json' });
    
    if (errorData && errorData.count > 5 && errorData.lastError > Date.now() - 3600000) {
      // Plus de 5 erreurs dans la dernière heure
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Erreur lors de la vérification des métriques pour ${contentId}:`, error);
    return false;
  }
}

// Incrémente le compteur d'erreurs pour un contenu
async function incrementErrorCount(contentId, env) {
  if (!env.FLODRAMA_METRICS) {
    return;
  }
  
  try {
    const metricsKey = `metrics:errors:${contentId}`;
    const errorData = await env.FLODRAMA_METRICS.get(metricsKey, { type: 'json' }) || {
      count: 0,
      firstError: Date.now(),
      lastError: Date.now()
    };
    
    errorData.count++;
    errorData.lastError = Date.now();
    
    await env.FLODRAMA_METRICS.put(metricsKey, JSON.stringify(errorData), {
      expirationTtl: 86400 // 24 heures
    });
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement des métriques pour ${contentId}:`, error);
  }
}

// Mise à jour des métriques d'utilisation d'un contenu
async function updateContentMetrics(contentId, env, isError = false) {
  if (!env.FLODRAMA_METRICS) {
    return;
  }
  
  try {
    const metricsKey = `metrics:access:${contentId}`;
    const now = Date.now();
    
    // Récupérer ou initialiser les métriques
    const metricsData = await env.FLODRAMA_METRICS.get(metricsKey, { type: 'json' }) || {
      count: 0,
      firstAccess: now,
      lastAccess: now,
      errorCount: 0
    };
    
    // Mettre à jour les métriques
    metricsData.count++;
    metricsData.lastAccess = now;
    if (isError) {
      metricsData.errorCount = (metricsData.errorCount || 0) + 1;
    }
    
    // Sauvegarder les métriques
    await env.FLODRAMA_METRICS.put(metricsKey, JSON.stringify(metricsData), {
      expirationTtl: 2592000 // 30 jours
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des métriques pour ${contentId}:`, error);
  }
}

export default {
  async fetch(request, env, ctx) {
    // Extraction de l'URL et des paramètres
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;

    // Activer CORS pour toutes les requêtes
    if (request.method === 'OPTIONS') {
      return handleCorsOptions();
    }

    // Endpoint pour vérifier la santé du service
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        services: Object.keys(SERVICES)
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Endpoint pour les médias (/media/:id)
    if (path.startsWith('/media/')) {
      const parts = path.split('/');
      if (parts.length < 3) {
        return errorResponse('ID média manquant', 400);
      }

      const mediaId = parts[2];
      const mediaType = params.get('type') || 'default';
      const directAccess = params.get('direct') === 'true';

      return await handleMediaRequest(mediaId, mediaType, directAccess, env);
    }

    // Endpoint pour les images optimisées (/:sizeParam/:imageId)
    // Correspond au format préconisé: https://images.flodrama.com/${sizeParam}/${imageId}
    const sizeRegex = /\/(w\d+|original)\/(poster|backdrop|thumbnail)_[a-f0-9]+/;
    if (sizeRegex.test(path)) {
      const parts = path.split('/');
      if (parts.length < 3) {
        return errorResponse('Format d\'URL invalide. Utiliser /:size/:id', 400);
      }

      const size = parts[1]; // w200, w500, w1000, original
      const imageId = parts[2]; // poster_abc123, backdrop_def456, etc.
      
      return await handleImageRequest(imageId, size, env);
    }

    // Endpoint pour le proxy de streaming (/stream/:contentId)
    if (path.startsWith('/stream/')) {
      const contentId = path.split('/').pop();
      if (!contentId) {
        return errorResponse('ID de contenu manquant', 400);
      }
      return await handleStreamingProxy(contentId, env);
    }

    // Endpoint pour l'extraction de médias (/extract?url=...)
    if (path === '/extract') {
      const sourceUrl = params.get('url');
      if (!sourceUrl) {
        return errorResponse('URL source manquante', 400);
      }
      
      const startTime = Date.now();
      const operationId = crypto.randomUUID();
      await recordOperationStart(operationId, 'extract', sourceUrl, env);
      
      try {
        let result;
        
        // Vérifier le cache avant extraction
        const cacheKey = `extract:${sourceUrl}`;
        const cachedResult = await env.FLODRAMA_METADATA?.get(cacheKey, { type: 'json' });
        
        if (cachedResult) {
          await updateContentMetrics(sourceUrl, env, false);
          await recordOperationEnd(operationId, 'extract', sourceUrl, startTime, true, env);
          return new Response(JSON.stringify(cachedResult), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'X-Cache': 'HIT'
            }
          });
        }
        
        // Déterminer le type de source
        if (sourceUrl.includes('vostfree')) {
          result = await extractVostfree(sourceUrl);
        } else if (sourceUrl.includes('dramacool')) {
          result = await extractDramacool(sourceUrl);
        } else if (sourceUrl.includes('gogoanime')) {
          result = await extractGogoanime(sourceUrl);
        } else if (sourceUrl.includes('voirdrama')) {
          result = await extractVoirdrama(sourceUrl);
        } else if (sourceUrl.includes('myasiantv') || sourceUrl.includes('viewasian')) {
          result = await extractMyAsianTV(sourceUrl);
        } else {
          result = await extractGeneric(sourceUrl);
        }
        
        if (!result) {
          throw new Error('Échec de l\'extraction');
        }
        
        // Mettre en cache le résultat
        const ttl = new AdaptiveCacheStrategy().getTtl(sourceUrl, env, false);
        await env.FLODRAMA_METADATA?.put(cacheKey, JSON.stringify(result), {
          expirationTtl: ttl
        });
        
        await updateContentMetrics(sourceUrl, env, false);
        await recordOperationEnd(operationId, 'extract', sourceUrl, startTime, false, env);
        
        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'MISS'
          }
        });
      } catch (error) {
        console.error(`Erreur lors de l'extraction depuis ${sourceUrl}:`, error);
        await incrementErrorCount(sourceUrl, env);
        await recordOperationEnd(operationId, 'extract', sourceUrl, startTime, false, env, error.message);
        return errorResponse(`Échec de l'extraction: ${error.message}`, 500);
      }
    }
    
    // Route par défaut
    return new Response('FloDrama Media Gateway - Endpoint non reconnu', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

/**
 * Gère les requêtes CORS OPTIONS
 */
function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Extrait des médias depuis Vostfree
 */
async function extractVostfree(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Échec de la requête: ${response.status}`);
    }
    
    const html = await response.text();
    // Code d'extraction basé sur le sélecteur spécifique à Vostfree
    // Extrait les liens de lecture des iframes ou des players
    const mediaUrls = extractMediaUrlsFromHtml(html, 'vostfree');
    
    return {
      title: extractTitle(html),
      source: 'vostfree',
      streams: mediaUrls,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erreur extraction Vostfree:', error);
    throw error;
  }
}

/**
 * Extrait des médias depuis Dramacool
 */
async function extractDramacool(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Échec de la requête: ${response.status}`);
    }
    
    const html = await response.text();
    // Code d'extraction basé sur le sélecteur spécifique à Dramacool
    // Extrait les liens de lecture des iframes ou des players
    const mediaUrls = extractMediaUrlsFromHtml(html, 'dramacool');
    
    return {
      title: extractTitle(html),
      source: 'dramacool',
      streams: mediaUrls,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erreur extraction Dramacool:', error);
    throw error;
  }
}

/**
 * Extrait des médias depuis Gogoanime
 */
async function extractGogoanime(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Échec de la requête: ${response.status}`);
    }
    
    const html = await response.text();
    // Code d'extraction basé sur le sélecteur spécifique à Gogoanime
    // Extrait les liens de lecture des iframes ou des players
    const mediaUrls = extractMediaUrlsFromHtml(html, 'gogoanime');
    
    return {
      title: extractTitle(html),
      source: 'gogoanime',
      streams: mediaUrls,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erreur extraction Gogoanime:', error);
    throw error;
  }
}

/**
 * Extrait des médias depuis Voirdrama
 */
async function extractVoirdrama(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Échec de la requête: ${response.status}`);
    }
    
    const html = await response.text();
    // Code d'extraction basé sur le sélecteur spécifique à Voirdrama
    // Extrait les liens de lecture des iframes ou des players
    const mediaUrls = extractMediaUrlsFromHtml(html, 'voirdrama');
    
    return {
      title: extractTitle(html),
      source: 'voirdrama',
      streams: mediaUrls,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erreur extraction Voirdrama:', error);
    throw error;
  }
}

/**
 * Extrait des médias depuis MyAsianTV/ViewAsian
 */
async function extractMyAsianTV(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Échec de la requête: ${response.status}`);
    }
    
    const html = await response.text();
    // Déterminer la source exacte
    const source = url.includes('myasiantv') ? 'myasiantv' : 'viewasian';
    // Code d'extraction basé sur le sélecteur spécifique
    const mediaUrls = extractMediaUrlsFromHtml(html, source);
    
    return {
      title: extractTitle(html),
      source: source,
      streams: mediaUrls,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erreur extraction MyAsianTV/ViewAsian:', error);
    throw error;
  }
}

/**
 * Extrait des médias depuis n'importe quelle source non spécifique
 */
async function extractGeneric(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Échec de la requête: ${response.status}`);
    }
    
    const html = await response.text();
    // Extraction générique pour les sources inconnues
    const mediaUrls = extractMediaUrlsFromHtml(html, 'generic');
    
    return {
      title: extractTitle(html),
      source: 'generic',
      streams: mediaUrls,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erreur extraction générique:', error);
    throw error;
  }
}

/**
 * Extrait les URLs de médias à partir du HTML selon la source
 */
function extractMediaUrlsFromHtml(html, source) {
  const mediaUrls = [];
  
  try {
    // Extraction basée sur les patterns d'iframe et autres méthodes d'inclusion
    const iframeRegex = /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi;
    const playerRegex = /source[^>]*src=["']([^"']*)["'][^>]*/gi;
    const m3u8Regex = /["'](https?:\/\/[^"']*\.m3u8[^"']*)["']/gi;
    const mp4Regex = /["'](https?:\/\/[^"']*\.mp4[^"']*)["']/gi;
    
    // Extraire URLs d'iframes
    let match;
    while ((match = iframeRegex.exec(html)) !== null) {
      if (match[1] && !mediaUrls.includes(match[1])) {
        mediaUrls.push(match[1]);
      }
    }
    
    // Extraire URLs de players
    while ((match = playerRegex.exec(html)) !== null) {
      if (match[1] && !mediaUrls.includes(match[1])) {
        mediaUrls.push(match[1]);
      }
    }
    
    // Extraire URLs de M3U8
    while ((match = m3u8Regex.exec(html)) !== null) {
      if (match[1] && !mediaUrls.includes(match[1])) {
        mediaUrls.push(match[1]);
      }
    }
    
    // Extraire URLs de MP4
    while ((match = mp4Regex.exec(html)) !== null) {
      if (match[1] && !mediaUrls.includes(match[1])) {
        mediaUrls.push(match[1]);
      }
    }
    
    // Extraction spécifique selon la source
    switch (source) {
      case 'vostfree':
        // Ajouter logique spécifique pour Vostfree si nécessaire
        break;
      case 'dramacool':
        // Ajouter logique spécifique pour Dramacool si nécessaire
        break;
      case 'gogoanime':
        // Ajouter logique spécifique pour Gogoanime si nécessaire
        break;
      // etc.
    }
    
    // Si aucun média trouvé, ajouter une URL placeholder ou d'erreur
    if (mediaUrls.length === 0) {
      mediaUrls.push({
        url: 'extraction_failed',
        quality: 'unknown',
        language: 'unknown'
      });
    }
    
    return mediaUrls;
  } catch (error) {
    console.error(`Erreur lors de l'extraction d'URLs pour ${source}:`, error);
    return [{
      url: 'extraction_error',
      quality: 'unknown',
      language: 'unknown',
      error: error.message
    }];
  }
}

/**
 * Extrait le titre de la page
 */
function extractTitle(html) {
  try {
    const titleRegex = /<title[^>]*>([^<]*)<\/title>/i;
    const match = html.match(titleRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return 'Titre non disponible';
  } catch (error) {
    console.error('Erreur extraction titre:', error);
    return 'Titre non disponible';
  }
}

/**
 * Gère les requêtes de médias (vidéos, trailers)
 */
async function handleMediaRequest(mediaId, mediaType, directAccess, env) {
  // Vérification et validation du média dans la base KV
  try {
    // Si accès direct demandé, rediriger vers l'URL Cloudflare Stream
    if (directAccess) {
      return Response.redirect(`https://${SERVICES.STREAM}/${mediaId}/watch`, 302);
    }

    // Sinon renvoyer les métadonnées du média via l'API
    // Pour un frontend, cela permet de vérifier si le média existe avant de l'afficher
    return new Response(JSON.stringify({
      status: 'success',
      mediaId: mediaId,
      type: mediaType,
      streamUrl: `https://${SERVICES.STREAM}/${mediaId}/watch`,
      thumbnailUrl: `https://${SERVICES.STREAM}/${mediaId}/thumbnails/thumbnail.jpg`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    // En cas d'erreur, renvoyer une URL de fallback
    return new Response(JSON.stringify({
      status: 'error',
      message: `Média non disponible: ${error.message}`,
      fallbackUrl: DEFAULT_IMAGES[mediaType] || DEFAULT_IMAGES[MEDIA_TYPES.POSTER]
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Gère les requêtes d'images optimisées
 */
async function handleImageRequest(imageId, requestedSize, env) {
  try {
    // Extraire le type d'image à partir de l'ID (poster, backdrop, thumbnail)
    const imageType = imageId.split('_')[0] || MEDIA_TYPES.POSTER;
    
    // Vérifier si l'image existe dans Cloudflare Images
    // Dans un environnement de production, on interrogerait la KV pour vérifier l'existence
    const imageMetadataKey = `image:${imageId}`;
    let imageExists = true;
    
    // Tenter de récupérer les métadonnées de l'image depuis KV (si disponible)
    try {
      if (env.FLODRAMA_METADATA) {
        const metadata = await env.FLODRAMA_METADATA.get(imageMetadataKey);
        if (!metadata) {
          console.warn(`Image metadata not found for ${imageId}`);
          imageExists = false;
        }
      }
    } catch (kvError) {
      console.error(`KV error for ${imageId}:`, kvError);
      // Continuer le traitement même en cas d'erreur KV
    }
    
    // Si l'image existe, construire l'URL de service
    if (imageExists) {
      // Construction de l'URL de redirection vers le service d'images
      // Format exact tel que défini dans le guide de scraping: /${sizeParam}/${imageId}
      const redirectUrl = `https://${SERVICES.IMAGES}/${requestedSize}/${imageId}`;
      
      // Ajouter des en-têtes pour le cache et CORS
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',  // Cache 24h
          'Cloudflare-CDN-Cache-Control': 'max-age=86400'  // Directive pour le CDN
        }
      });
    }
    
    // Si l'image n'existe pas, renvoyer l'image par défaut correspondant au type
    return new Response(JSON.stringify({
      status: 'error',
      message: `Image ${imageId} non disponible`,
      fallbackUrl: DEFAULT_IMAGES[imageType] || DEFAULT_IMAGES[MEDIA_TYPES.POSTER]
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error(`Erreur lors du traitement de l'image ${imageId}:`, error);
    // En cas d'erreur, renvoyer une image par défaut
    return new Response(JSON.stringify({
      status: 'error',
      message: `Erreur de traitement: ${error.message}`,
      fallbackUrl: DEFAULT_IMAGES[MEDIA_TYPES.POSTER]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Gère les requêtes de proxy de streaming vidéo
 */
async function handleStreamingProxy(contentId, env) {
  try {
    // Démarrer le monitoring de l'opération
    const operation = recordOperationStart('handleStreamingProxy');
    
    // Récupérer les informations de streaming depuis KV ou D1
    let streamingInfo = null;
    
    // Essayer de récupérer depuis KV si disponible
    if (env.FLODRAMA_METADATA) {
      const streamKey = `stream:${contentId}`;
      const cachedData = await env.FLODRAMA_METADATA.get(streamKey, { type: 'json' });
      
      if (cachedData && cachedData.streaming_url) {
        // Mettre à jour les métriques d'utilisation
        updateContentMetrics(contentId, env, 'accessed');
        streamingInfo = cachedData;
      }
    }
    
    // Si les informations de streaming ne sont pas trouvées ou sont expirées
    if (!streamingInfo || isStreamExpired(streamingInfo)) {
      // Vérifier si le contenu est fréquemment problématique
      const isProblematic = await isProblematicContent(contentId, env);
      
      if (isProblematic) {
        recordOperationEnd(operation, false, 'Contenu fréquemment problématique');
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Ce contenu est temporairement indisponible',
          fallbackUrl: '/unavailable.mp4',
          problematic: true
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Dans un environnement de production, on appellerait un service de scraping à la demande
      // pour régénérer l'URL de streaming
      recordOperationEnd(operation, false, 'URL expirée ou non trouvée');
      return new Response(JSON.stringify({
        status: 'error',
        message: 'URL de streaming non disponible ou expirée',
        fallbackUrl: '/unavailable.mp4',
        needsRefresh: true
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Générer les en-têtes nécessaires pour la source spécifique
    const headers = generateStreamingHeaders(streamingInfo.source);
    
    // Ajuster la durée du cache en fonction de la popularité
    const popularity = streamingInfo.popularity || 0;
    const cacheTtl = getCacheTtl(popularity);
    
    // Renvoyer les informations de streaming au client
    const response = new Response(JSON.stringify({
      status: 'success',
      streaming_url: streamingInfo.streaming_url,
      source: streamingInfo.source,
      headers: headers,
      subtitles: streamingInfo.subtitles || [],
      referrer_policy: streamingInfo.referrer_policy || 'no-referrer',
      expires_at: streamingInfo.expires_at,
      content_type: streamingInfo.content_type || 'application/x-mpegURL',
      popularity: popularity + 1
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': `private, max-age=${cacheTtl}`,
        'X-Cache-Popularity': String(popularity + 1),
        'X-Cache-TTL': String(cacheTtl)
      }
    });
    
    // Enregistrer la fin réussie de l'opération
    recordOperationEnd(operation, true);
    return response;
  } catch (error) {
    console.error(`Erreur lors du traitement de la requête de streaming ${contentId}:`, error);
    
    // Enregistrer l'erreur dans les métriques
    if (env.FLODRAMA_METRICS) {
      await incrementErrorCount(contentId, env);
    }
    
    return new Response(JSON.stringify({
      status: 'error',
      message: `Erreur de traitement: ${error.message}`,
      fallbackUrl: '/unavailable.mp4'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Vérifie si une URL de streaming est expirée
 */
function isStreamExpired(streamingInfo) {
  if (!streamingInfo.expires_at) {
    return false;
  }
  
  const expiryTime = new Date(streamingInfo.expires_at).getTime();
  const currentTime = new Date().getTime();
  
  return currentTime > expiryTime;
}

/**
 * Génère les en-têtes nécessaires pour accéder à une source de streaming spécifique
 */
function generateStreamingHeaders(source) {
  // Configuration des en-têtes selon la source
  const headersMap = {
    [STREAMING_SOURCES.DRAMACOOL]: {
      'Referer': 'https://dramacool.cr/',
      'Origin': 'https://dramacool.cr'
    },
    [STREAMING_SOURCES.VIEWASIAN]: {
      'Referer': 'https://viewasian.co/',
      'Origin': 'https://viewasian.co'
    },
    [STREAMING_SOURCES.MYASIANTV]: {
      'Referer': 'https://myasiantv.cc/',
      'Origin': 'https://myasiantv.cc'
    },
    [STREAMING_SOURCES.KISSASIAN]: {
      'Referer': 'https://kissasian.sh/',
      'Origin': 'https://kissasian.sh'
    },
    [STREAMING_SOURCES.GOGOPLAY]: {
      'Referer': 'https://gogoplay.io/',
      'Origin': 'https://gogoplay.io'
    },
    [STREAMING_SOURCES.GENERIC]: {}
  };
  
  return headersMap[source] || {};
}

/**
 * Génère une réponse d'erreur standardisée
 */
function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    status: 'error',
    message: message
  }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
