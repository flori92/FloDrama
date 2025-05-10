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
            success,
            items_count,
            errors_count,
            duration,
            details,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          scrapingId,
          source,
          result.success ? 1 : 0,
          result.items_count || 0,
          result.errors_count || 0,
          result.duration || 0,
          JSON.stringify(result),
          new Date().toISOString()
        ).run();
        
        this.debugLog(`Résultat pour la source ${source} enregistré dans la base de données (ID: ${scrapingId})`);
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement du résultat pour la source ${source}: ${error.message}`);
      }
    }
  }

  /**
   * Enregistre le début d'une opération de scraping
   * @param {string} source - La source à scraper
   * @param {string} action - L'action à effectuer
   * @returns {Object} - Informations sur l'opération
   */
  async recordOperationStart(source, action) {
    const startTime = Date.now();
    const operationId = `${source}_${action}_${startTime}`;
    
    this.debugLog(`Début de l'opération ${action} pour la source ${source} (ID: ${operationId})`);
    
    // Stocker les informations de l'opération dans KV si disponible
    if (this.env.METADATA) {
      try {
        const operationInfo = {
          id: operationId,
          source,
          action,
          start_time: startTime,
          status: 'running'
        };
        
        await this.env.METADATA.put(`operation_${operationId}`, JSON.stringify(operationInfo), {
          expirationTtl: 86400 // 24 heures
        });
        
        this.debugLog(`Informations de l'opération enregistrées dans KV (ID: ${operationId})`, operationInfo);
        
        return operationInfo;
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement du début de l'opération: ${error.message}`);
      }
    }
    
    return {
      id: operationId,
      source,
      action,
      start_time: startTime,
      status: 'running'
    };
  }

  /**
   * Enregistre la fin d'une opération de scraping
   * @param {string} source - La source scrapée
   * @param {string} action - L'action effectuée
   * @param {boolean} success - Si l'opération a réussi
   * @param {number} itemsCount - Nombre d'éléments récupérés
   * @param {number} errorsCount - Nombre d'erreurs rencontrées
   * @returns {Object} - Informations sur l'opération
   */
  async recordOperationEnd(source, action, success, itemsCount = 0, errorsCount = 0) {
    const endTime = Date.now();
    const operationId = `${source}_${action}_${endTime}`;
    
    this.debugLog(`Fin de l'opération ${action} pour la source ${source} (ID: ${operationId})`);
    
    // Récupérer les informations de l'opération depuis KV si disponible
    let operationInfo = {
      id: operationId,
      source,
      action,
      end_time: endTime,
      status: success ? 'completed' : 'failed',
      success,
      items_count: itemsCount,
      errors_count: errorsCount
    };
    
    if (this.env.METADATA) {
      try {
        // Chercher l'opération correspondante
        const keys = await this.env.METADATA.list({ prefix: `operation_${source}_${action}_` });
        
        if (keys.keys.length > 0) {
          // Trier par date de création (la plus récente en premier)
          keys.keys.sort((a, b) => b.name.localeCompare(a.name));
          
          // Récupérer l'opération la plus récente
          const latestOperation = await this.env.METADATA.get(keys.keys[0].name, 'json');
          
          if (latestOperation && latestOperation.status === 'running') {
            operationInfo = {
              ...latestOperation,
              end_time: endTime,
              duration: endTime - latestOperation.start_time,
              status: success ? 'completed' : 'failed',
              success,
              items_count: itemsCount,
              errors_count: errorsCount
            };
            
            // Mettre à jour l'opération dans KV
            await this.env.METADATA.put(keys.keys[0].name, JSON.stringify(operationInfo), {
              expirationTtl: 86400 // 24 heures
            });
            
            this.debugLog(`Informations de l'opération mises à jour dans KV (ID: ${operationInfo.id})`, operationInfo);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement de la fin de l'opération: ${error.message}`);
      }
    }
    
    return operationInfo;
  }

  /**
   * Enregistre une erreur de scraping
   * @param {string} source - La source concernée
   * @param {string} message - Le message d'erreur
   * @param {Object} details - Détails supplémentaires
   */
  async logError(source, message, details = {}) {
    console.error(`[SCRAPING_ERROR] [${source}] ${message}`);
    
    if (this.debug && details) {
      console.error(JSON.stringify(details, null, 2));
    }
    
    // Enregistrer l'erreur dans la base de données
    if (this.env.DB) {
      try {
        await this.env.DB.prepare(`
          INSERT INTO scraping_errors (
            source,
            message,
            details,
            created_at
          ) VALUES (?, ?, ?, ?)
        `).bind(
          source,
          message,
          JSON.stringify(details),
          new Date().toISOString()
        ).run();
        
        this.debugLog(`Erreur pour la source ${source} enregistrée dans la base de données`);
      } catch (error) {
        console.error(`Erreur lors de l'enregistrement de l'erreur pour la source ${source}: ${error.message}`);
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
