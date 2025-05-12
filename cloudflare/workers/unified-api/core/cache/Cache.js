/**
 * Système de cache pour stocker les réponses des APIs
 * Utilise Cloudflare KV ou le cache du navigateur selon l'environnement
 */
class Cache {
  constructor(namespace = 'FLODRAMA_CACHE') {
    this.namespace = namespace;
    this.defaultTTL = 86400; // 24 heures en secondes
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - La clé de la valeur à récupérer
   * @returns {Promise<string|null>} - La valeur récupérée ou null si elle n'existe pas
   */
  async get(key) {
    // Si nous sommes dans un environnement Cloudflare Workers
    if (typeof caches !== 'undefined') {
      try {
        const cache = caches.default;
        const response = await cache.match(`https://flodrama-cache/${key}`);
        if (response) {
          const data = await response.text();
          return data;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du cache:', error);
      }
    }
    
    // Si nous sommes dans un environnement avec KV
    if (typeof FLODRAMA_CACHE !== 'undefined') {
      try {
        return await FLODRAMA_CACHE.get(key);
      } catch (error) {
        console.error('Erreur lors de la récupération du cache KV:', error);
      }
    }
    
    return null;
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - La clé sous laquelle stocker la valeur
   * @param {string} value - La valeur à stocker
   * @param {number} ttl - Durée de vie en secondes (par défaut 24h)
   * @returns {Promise<boolean>} - true si le stockage a réussi, false sinon
   */
  async set(key, value, ttl = this.defaultTTL) {
    // Si nous sommes dans un environnement Cloudflare Workers
    if (typeof caches !== 'undefined') {
      try {
        const cache = caches.default;
        const response = new Response(value, {
          headers: {
            'Cache-Control': `max-age=${ttl}`,
            'Content-Type': 'text/plain'
          }
        });
        await cache.put(`https://flodrama-cache/${key}`, response);
        return true;
      } catch (error) {
        console.error('Erreur lors du stockage dans le cache:', error);
      }
    }
    
    // Si nous sommes dans un environnement avec KV
    if (typeof FLODRAMA_CACHE !== 'undefined') {
      try {
        await FLODRAMA_CACHE.put(key, value, { expirationTtl: ttl });
        return true;
      } catch (error) {
        console.error('Erreur lors du stockage dans le cache KV:', error);
      }
    }
    
    return false;
  }

  /**
   * Supprime une valeur du cache
   * @param {string} key - La clé de la valeur à supprimer
   * @returns {Promise<boolean>} - true si la suppression a réussi, false sinon
   */
  async delete(key) {
    // Si nous sommes dans un environnement avec KV
    if (typeof FLODRAMA_CACHE !== 'undefined') {
      try {
        await FLODRAMA_CACHE.delete(key);
        return true;
      } catch (error) {
        console.error('Erreur lors de la suppression du cache KV:', error);
      }
    }
    
    return false;
  }
}

module.exports = Cache;
