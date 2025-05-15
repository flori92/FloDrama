const Cache = require('../../core/cache/Cache');

/**
 * Service pour proxifier et optimiser les flux de streaming
 * Utilise Cloudflare comme CDN pour améliorer les performances
 */
class StreamingProxyService {
  constructor() {
    this.cache = new Cache();
    this.allowedOrigins = [
      'https://flodrama.com',
      'https://www.flodrama.com',
      'http://localhost:3000'
    ];
  }

  /**
   * Vérifie si l'origine est autorisée
   * @param {string} origin - L'origine de la requête
   * @returns {boolean} - True si l'origine est autorisée
   */
  isOriginAllowed(origin) {
    return this.allowedOrigins.includes(origin) || this.allowedOrigins.includes('*');
  }

  /**
   * Proxifie un flux vidéo en utilisant Cloudflare comme intermédiaire
   * @param {string} streamUrl - L'URL du flux vidéo original
   * @param {string} referer - Le referer à utiliser pour la requête
   * @param {Object} request - La requête originale
   * @returns {Response} - La réponse avec le flux vidéo
   */
  async proxyStream(streamUrl, referer, request) {
    // Vérifier si l'URL est valide
    if (!streamUrl || !streamUrl.startsWith('http')) {
      return new Response(JSON.stringify({ error: 'URL de streaming invalide' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Vérifier l'origine pour la sécurité
    const origin = request.headers.get('Origin');
    if (origin && !this.isOriginAllowed(origin)) {
      return new Response(JSON.stringify({ error: 'Origine non autorisée' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Créer les en-têtes pour la requête proxifiée
      const headers = new Headers();
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      if (referer) {
        headers.set('Referer', referer);
      }
      
      // Récupérer le contenu
      const response = await fetch(streamUrl, {
        headers,
        cf: {
          // Optimisations Cloudflare pour la vidéo
          cacheTtl: 3600,
          cacheEverything: true,
          mirage: true,
          polish: "off", // Ne pas compresser la vidéo
        }
      });

      // Vérifier si la réponse est valide
      if (!response.ok) {
        return new Response(JSON.stringify({ 
          error: 'Erreur lors de la récupération du flux',
          status: response.status,
          statusText: response.statusText
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Créer les en-têtes pour la réponse
      const responseHeaders = new Headers();
      
      // Copier les en-têtes pertinents de la réponse originale
      const headersToKeep = [
        'Content-Type',
        'Content-Length',
        'Accept-Ranges',
        'Content-Range',
        'Content-Disposition'
      ];
      
      for (const header of headersToKeep) {
        if (response.headers.has(header)) {
          responseHeaders.set(header, response.headers.get(header));
        }
      }
      
      // Ajouter les en-têtes CORS
      responseHeaders.set('Access-Control-Allow-Origin', origin || '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Range');
      responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
      
      // Ajouter les en-têtes de cache
      responseHeaders.set('Cache-Control', 'public, max-age=3600');
      
      // Retourner la réponse proxifiée
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders
      });
    } catch (error) {
      console.error(`Erreur de proxy streaming: ${error.message}`);
      return new Response(JSON.stringify({ error: 'Erreur de serveur lors du proxy streaming' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Optimise les sources de streaming pour un épisode
   * @param {Object} sources - Les sources de streaming disponibles
   * @param {string} baseUrl - L'URL de base pour les chemins relatifs
   * @returns {Object} - Les sources optimisées
   */
  optimizeSources(sources, baseUrl) {
    if (!sources || !Array.isArray(sources)) {
      return [];
    }

    return sources.map(source => {
      // S'assurer que l'URL est absolue
      let url = source.url;
      if (url && !url.startsWith('http') && baseUrl) {
        url = new URL(url, baseUrl).toString();
      }

      // Créer l'URL proxifiée
      const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(source.referer || baseUrl)}`;

      return {
        ...source,
        url: proxyUrl,
        original_url: url,
        is_proxied: true
      };
    });
  }
}

module.exports = StreamingProxyService;
