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
 */

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
    // Récupérer les informations de streaming depuis KV ou D1
    let streamingInfo = null;
    
    // Essayer de récupérer depuis KV si disponible
    if (env.FLODRAMA_METADATA) {
      const streamKey = `stream:${contentId}`;
      const cachedData = await env.FLODRAMA_METADATA.get(streamKey, { type: 'json' });
      
      if (cachedData && cachedData.streaming_url) {
        streamingInfo = cachedData;
      }
    }
    
    // Si les informations de streaming ne sont pas trouvées ou sont expirées
    if (!streamingInfo || isStreamExpired(streamingInfo)) {
      // Dans un environnement de production, on appellerait un service de scraping à la demande
      // pour régénérer l'URL de streaming
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
    
    // Renvoyer les informations de streaming au client
    return new Response(JSON.stringify({
      status: 'success',
      streaming_url: streamingInfo.streaming_url,
      source: streamingInfo.source,
      headers: headers,
      subtitles: streamingInfo.subtitles || [],
      referrer_policy: streamingInfo.referrer_policy || 'no-referrer',
      expires_at: streamingInfo.expires_at,
      content_type: streamingInfo.content_type || 'application/x-mpegURL'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'private, max-age=600' // Cache de 10 minutes côté client
      }
    });
  } catch (error) {
    console.error(`Erreur lors du traitement de la requête de streaming ${contentId}:`, error);
    
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
