/**
 * Classe pour surveiller et enregistrer les résultats du scraping
 * 
 * Cette classe permet de suivre l'exécution des tâches de scraping,
 * d'enregistrer les résultats et les erreurs, et de générer des rapports.
 */

class ScrapingMonitor {
  /**
   * Constructeur
   * @param {Object} env - L'environnement Cloudflare Workers
   */
  constructor(env) {
    this.env = env;
    this.debug = false;
  }

  /**
   * Active le mode debug
   * @param {boolean} debug - Activer ou désactiver le mode debug
   * @returns {ScrapingMonitor} - L'instance courante pour le chaînage
   */
  enableDebug(debug = true) {
    this.debug = debug;
    return this;
  }

  /**
   * Log de debug
   * @param {string} message - Le message à logger
   * @param {Object} data - Les données à logger (optionnel)
   */
  debugLog(message, data = null) {
    if (this.debug) {
      console.log(`[SCRAPING_MONITOR_DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Génère un identifiant unique pour une session de scraping
   * @returns {string} - L'identifiant unique
   */
  generateScrapingId() {
    return `scraping_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Démarre une nouvelle session de scraping
   * @returns {string} - L'identifiant de la session
   */
  async startScraping() {
    const scrapingId = this.generateScrapingId();
    
    this.debugLog(`Démarrage du scraping (ID: ${scrapingId})`);
    
    // Enregistrer le début du scraping dans la base de données
    if (this.env.DB) {
      try {
        await this.env.DB.prepare(`
          INSERT INTO scraping_logs (
            id, 
            status, 
            items_count, 
            errors_count, 
            duration, 
            success, 
            details, 
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          scrapingId,
          'started',
          0,
          0,
          0,
          false,
          JSON.stringify({ started_at: new Date().toISOString() }),
          new Date().toISOString()
        ).run();
        
        this.debugLog(`Session de scraping enregistrée dans la base de données (ID: ${scrapingId})`);
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement du début du scraping: ${error.message}`);
      }
    }
    
    return scrapingId;
  }

  /**
   * Enregistre le résultat du scraping d'une source
   * @param {string} scrapingId - L'identifiant de la session
   * @param {string} source - La source scrapée
   * @param {Object} result - Le résultat du scraping
   */
  async logSourceResult(scrapingId, source, result) {
    this.debugLog(`Enregistrement du résultat pour la source ${source} (ID: ${scrapingId})`, result);
    
    // Enregistrer le résultat dans la base de données
    if (this.env.DB) {
      try {
        await this.env.DB.prepare(`
          INSERT INTO scraping_source_logs (
            scraping_id, 
            source, 
            content_type, 
            items_count, 
            errors_count, 
            duration, 
            success, 
            details, 
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          scrapingId,
          source,
          result.content_type || 'unknown',
          result.items_count || 0,
          result.errors_count || 0,
          result.duration_seconds || 0,
          result.success ? 1 : 0,
          JSON.stringify(result),
          new Date().toISOString()
        ).run();
        
        this.debugLog(`Résultat de la source ${source} enregistré dans la base de données (ID: ${scrapingId})`);
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement du résultat de la source ${source}: ${error.message}`);
      }
    }
    
    // Stocker les résultats dans KV (si disponible)
    if (this.env.SCRAPING_RESULTS && result.success) {
      try {
        await this.env.SCRAPING_RESULTS.put(`${source}_latest`, JSON.stringify(result), { 
          expirationTtl: 60 * 60 * 24 * 7 // 7 jours
        });
        
        this.debugLog(`Résultat de la source ${source} enregistré dans KV`);
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement du résultat de la source ${source} dans KV: ${error.message}`);
      }
    }
  }

  /**
   * Enregistre une erreur
   * @param {string} scrapingId - L'identifiant de la session
   * @param {string} errorMessage - Le message d'erreur
   */
  async logError(scrapingId, errorMessage) {
    this.debugLog(`Enregistrement d'une erreur (ID: ${scrapingId}): ${errorMessage}`);
    
    // Enregistrer l'erreur dans la base de données
    if (this.env.DB) {
      try {
        await this.env.DB.prepare(`
          INSERT INTO scraping_errors (
            scraping_id, 
            error_message, 
            created_at
          ) VALUES (?, ?, ?)
        `).bind(
          scrapingId,
          errorMessage,
          new Date().toISOString()
        ).run();
        
        this.debugLog(`Erreur enregistrée dans la base de données (ID: ${scrapingId})`);
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement de l'erreur: ${error.message}`);
      }
    }
  }

  /**
   * Termine une session de scraping avec succès
   * @param {string} scrapingId - L'identifiant de la session
   */
  async completeScraping(scrapingId) {
    this.debugLog(`Fin du scraping (ID: ${scrapingId})`);
    
    // Récupérer les résultats des sources
    let totalItems = 0;
    let totalErrors = 0;
    let duration = 0;
    
    if (this.env.DB) {
      try {
        // Récupérer les résultats des sources
        const sourcesResults = await this.env.DB.prepare(`
          SELECT 
            SUM(items_count) as total_items, 
            SUM(errors_count) as total_errors,
            SUM(duration) as total_duration
          FROM scraping_source_logs 
          WHERE scraping_id = ?
        `).bind(scrapingId).first();
        
        if (sourcesResults) {
          totalItems = sourcesResults.total_items || 0;
          totalErrors = sourcesResults.total_errors || 0;
          duration = sourcesResults.total_duration || 0;
        }
        
        // Mettre à jour la session de scraping
        await this.env.DB.prepare(`
          UPDATE scraping_logs 
          SET 
            status = ?, 
            items_count = ?, 
            errors_count = ?, 
            duration = ?, 
            success = ?, 
            details = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(
          'completed',
          totalItems,
          totalErrors,
          duration,
          true,
          JSON.stringify({ 
            completed_at: new Date().toISOString(),
            total_items: totalItems,
            total_errors: totalErrors,
            duration: duration
          }),
          new Date().toISOString(),
          scrapingId
        ).run();
        
        this.debugLog(`Session de scraping terminée dans la base de données (ID: ${scrapingId})`);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la session de scraping: ${error.message}`);
      }
    }
    
    // Enregistrer la date du dernier scraping dans KV
    if (this.env.SCRAPING_RESULTS) {
      try {
        await this.env.SCRAPING_RESULTS.put('last_scraping', new Date().toISOString(), { 
          expirationTtl: 60 * 60 * 24 * 7 // 7 jours
        });
        
        this.debugLog(`Date du dernier scraping enregistrée dans KV`);
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement de la date du dernier scraping dans KV: ${error.message}`);
      }
    }
  }

  /**
   * Termine une session de scraping avec échec
   * @param {string} scrapingId - L'identifiant de la session
   * @param {string} errorMessage - Le message d'erreur
   */
  async failScraping(scrapingId, errorMessage) {
    this.debugLog(`Échec du scraping (ID: ${scrapingId}): ${errorMessage}`);
    
    // Enregistrer l'erreur
    await this.logError(scrapingId, errorMessage);
    
    // Mettre à jour la session de scraping
    if (this.env.DB) {
      try {
        await this.env.DB.prepare(`
          UPDATE scraping_logs 
          SET 
            status = ?, 
            success = ?, 
            details = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(
          'failed',
          false,
          JSON.stringify({ 
            failed_at: new Date().toISOString(),
            error: errorMessage
          }),
          new Date().toISOString(),
          scrapingId
        ).run();
        
        this.debugLog(`Session de scraping marquée comme échouée dans la base de données (ID: ${scrapingId})`);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la session de scraping: ${error.message}`);
      }
    }
  }

  /**
   * Récupère les résultats d'une session de scraping
   * @param {string} scrapingId - L'identifiant de la session
   * @returns {Object} - Les résultats de la session
   */
  async getScrapingResults(scrapingId) {
    this.debugLog(`Récupération des résultats du scraping (ID: ${scrapingId})`);
    
    if (!this.env.DB) {
      return null;
    }
    
    try {
      // Récupérer la session de scraping
      const session = await this.env.DB.prepare(`
        SELECT * FROM scraping_logs WHERE id = ?
      `).bind(scrapingId).first();
      
      if (!session) {
        return null;
      }
      
      // Récupérer les résultats des sources
      const sources = await this.env.DB.prepare(`
        SELECT * FROM scraping_source_logs WHERE scraping_id = ?
      `).bind(scrapingId).all();
      
      // Récupérer les erreurs
      const errors = await this.env.DB.prepare(`
        SELECT * FROM scraping_errors WHERE scraping_id = ?
      `).bind(scrapingId).all();
      
      return {
        session,
        sources: sources ? sources.results : [],
        errors: errors ? errors.results : []
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des résultats du scraping: ${error.message}`);
      return null;
    }
  }
}

export default ScrapingMonitor;
