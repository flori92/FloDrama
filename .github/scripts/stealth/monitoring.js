/**
 * Système de monitoring pour le scraping FloDrama
 * 
 * Ce module permet de suivre les performances et les erreurs du système de scraping.
 */

/**
 * Classe pour gérer le monitoring du scraping
 */
class ScrapingMonitor {
  /**
   * Initialise le moniteur de scraping
   * @param {Object} env - Environnement Cloudflare Workers
   */
  constructor(env) {
    this.env = env;
    this.metricsNamespace = 'SCRAPING_METRICS';
  }

  /**
   * Enregistre une métrique
   * @param {string} name - Nom de la métrique
   * @param {number} value - Valeur de la métrique
   * @param {Object} tags - Tags associés à la métrique
   * @returns {Promise<boolean>} - Succès de l'enregistrement
   */
  async recordMetric(name, value, tags = {}) {
    if (!this.env.SCRAPING_RESULTS) {
      return false;
    }
    
    // Générer un ID unique pour la métrique
    const metricId = crypto.randomUUID();
    
    // Créer l'objet métrique
    const metric = {
      id: metricId,
      name,
      value,
      tags,
      timestamp: new Date().toISOString()
    };
    
    // Stocker la métrique dans KV
    await this.env.SCRAPING_RESULTS.put(
      `${this.metricsNamespace}:${metricId}`,
      JSON.stringify(metric),
      { expirationTtl: 60 * 60 * 24 * 7 } // 7 jours
    );
    
    // Mettre à jour le compteur de métriques
    await this.incrementMetricCounter(name);
    
    return true;
  }

  /**
   * Incrémente le compteur de métriques
   * @param {string} name - Nom de la métrique
   * @returns {Promise<number>} - Nouvelle valeur du compteur
   */
  async incrementMetricCounter(name) {
    if (!this.env.SCRAPING_RESULTS) {
      return 0;
    }
    
    // Récupérer le compteur actuel
    const counterKey = `${this.metricsNamespace}:counter:${name}`;
    const counterJson = await this.env.SCRAPING_RESULTS.get(counterKey);
    
    let counter = 1;
    
    if (counterJson) {
      counter = parseInt(counterJson) + 1;
    }
    
    // Stocker le nouveau compteur
    await this.env.SCRAPING_RESULTS.put(
      counterKey,
      counter.toString(),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30 jours
    );
    
    return counter;
  }

  /**
   * Enregistre une erreur
   * @param {string} source - Source de l'erreur
   * @param {string} message - Message d'erreur
   * @param {Object} context - Contexte de l'erreur
   * @returns {Promise<string>} - ID de l'erreur
   */
  async recordError(source, message, context = {}) {
    if (!this.env.SCRAPING_RESULTS) {
      return null;
    }
    
    // Générer un ID unique pour l'erreur
    const errorId = crypto.randomUUID();
    
    // Créer l'objet erreur
    const error = {
      id: errorId,
      source,
      message,
      context,
      timestamp: new Date().toISOString()
    };
    
    // Stocker l'erreur dans KV
    await this.env.SCRAPING_RESULTS.put(
      `${this.metricsNamespace}:error:${errorId}`,
      JSON.stringify(error),
      { expirationTtl: 60 * 60 * 24 * 7 } // 7 jours
    );
    
    // Mettre à jour le compteur d'erreurs
    await this.incrementErrorCounter(source);
    
    return errorId;
  }

  /**
   * Incrémente le compteur d'erreurs
   * @param {string} source - Source de l'erreur
   * @returns {Promise<number>} - Nouvelle valeur du compteur
   */
  async incrementErrorCounter(source) {
    if (!this.env.SCRAPING_RESULTS) {
      return 0;
    }
    
    // Récupérer le compteur actuel
    const counterKey = `${this.metricsNamespace}:error_counter:${source}`;
    const counterJson = await this.env.SCRAPING_RESULTS.get(counterKey);
    
    let counter = 1;
    
    if (counterJson) {
      counter = parseInt(counterJson) + 1;
    }
    
    // Stocker le nouveau compteur
    await this.env.SCRAPING_RESULTS.put(
      counterKey,
      counter.toString(),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30 jours
    );
    
    return counter;
  }

  /**
   * Enregistre un ping du serveur relais
   * @param {string} relayUrl - URL du serveur relais
   * @param {boolean} success - Succès du ping
   * @param {number} responseTime - Temps de réponse en ms
   * @returns {Promise<boolean>} - Succès de l'enregistrement
   */
  async recordRelayPing(relayUrl, success, responseTime) {
    return this.recordMetric('relay_ping', responseTime, {
      relay_url: relayUrl,
      success: success ? 'true' : 'false'
    });
  }

  /**
   * Enregistre une requête de scraping
   * @param {string} source - Source de données
   * @param {string} action - Action effectuée
   * @param {boolean} success - Succès de la requête
   * @param {number} duration - Durée de la requête en ms
   * @param {boolean} fromCache - Si la réponse vient du cache
   * @returns {Promise<boolean>} - Succès de l'enregistrement
   */
  async recordScrapingRequest(source, action, success, duration, fromCache = false) {
    return this.recordMetric('scraping_request', duration, {
      source,
      action,
      success: success ? 'true' : 'false',
      from_cache: fromCache ? 'true' : 'false'
    });
  }

  /**
   * Récupère les statistiques de scraping
   * @returns {Promise<Object>} - Statistiques de scraping
   */
  async getScrapingStats() {
    if (!this.env.SCRAPING_RESULTS) {
      return {
        requests: 0,
        errors: 0,
        cache_hits: 0,
        average_duration: 0
      };
    }
    
    // Récupérer les compteurs
    const requestsJson = await this.env.SCRAPING_RESULTS.get(`${this.metricsNamespace}:counter:scraping_request`);
    const errorsJson = await this.env.SCRAPING_RESULTS.get(`${this.metricsNamespace}:counter:error`);
    
    // Calculer les statistiques
    const requests = requestsJson ? parseInt(requestsJson) : 0;
    const errors = errorsJson ? parseInt(errorsJson) : 0;
    
    // Récupérer les statistiques de cache
    const cacheHitsKey = `${this.metricsNamespace}:cache_hits`;
    const cacheHitsJson = await this.env.SCRAPING_RESULTS.get(cacheHitsKey);
    const cacheHits = cacheHitsJson ? parseInt(cacheHitsJson) : 0;
    
    // Récupérer la durée moyenne
    const avgDurationKey = `${this.metricsNamespace}:avg_duration`;
    const avgDurationJson = await this.env.SCRAPING_RESULTS.get(avgDurationKey);
    const avgDuration = avgDurationJson ? parseFloat(avgDurationJson) : 0;
    
    return {
      requests,
      errors,
      cache_hits: cacheHits,
      average_duration: avgDuration
    };
  }

  /**
   * Met à jour les statistiques de cache
   * @param {boolean} isHit - Si c'est un hit de cache
   * @returns {Promise<void>}
   */
  async updateCacheStats(isHit) {
    if (!this.env.SCRAPING_RESULTS) {
      return;
    }
    
    // Mettre à jour le compteur de hits de cache
    if (isHit) {
      const cacheHitsKey = `${this.metricsNamespace}:cache_hits`;
      const cacheHitsJson = await this.env.SCRAPING_RESULTS.get(cacheHitsKey);
      
      let cacheHits = 1;
      
      if (cacheHitsJson) {
        cacheHits = parseInt(cacheHitsJson) + 1;
      }
      
      await this.env.SCRAPING_RESULTS.put(
        cacheHitsKey,
        cacheHits.toString(),
        { expirationTtl: 60 * 60 * 24 * 30 } // 30 jours
      );
    }
  }

  /**
   * Met à jour la durée moyenne des requêtes
   * @param {number} duration - Durée de la requête en ms
   * @returns {Promise<void>}
   */
  async updateAverageDuration(duration) {
    if (!this.env.SCRAPING_RESULTS) {
      return;
    }
    
    // Récupérer la durée moyenne actuelle
    const avgDurationKey = `${this.metricsNamespace}:avg_duration`;
    const avgDurationJson = await this.env.SCRAPING_RESULTS.get(avgDurationKey);
    
    // Récupérer le nombre de requêtes
    const requestsJson = await this.env.SCRAPING_RESULTS.get(`${this.metricsNamespace}:counter:scraping_request`);
    const requests = requestsJson ? parseInt(requestsJson) : 0;
    
    let avgDuration = duration;
    
    if (avgDurationJson && requests > 1) {
      const currentAvg = parseFloat(avgDurationJson);
      // Calculer la nouvelle moyenne
      avgDuration = ((currentAvg * (requests - 1)) + duration) / requests;
    }
    
    // Stocker la nouvelle moyenne
    await this.env.SCRAPING_RESULTS.put(
      avgDurationKey,
      avgDuration.toString(),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30 jours
    );
  }
}

export default ScrapingMonitor;
