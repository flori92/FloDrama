/**
 * Gestionnaire de file d'attente pour les tâches de scraping
 * 
 * Ce module permet de gérer les tâches de scraping longues en les mettant en file d'attente
 * et en les exécutant de manière asynchrone.
 */

/**
 * Classe pour gérer une file d'attente de tâches de scraping
 */
class ScrapingQueueManager {
  /**
   * Initialise le gestionnaire de file d'attente
   * @param {Object} env - Environnement Cloudflare Workers
   */
  constructor(env) {
    this.env = env;
    this.queueNamespace = 'SCRAPING_QUEUE';
  }

  /**
   * Ajoute une tâche à la file d'attente
   * @param {Object} task - Tâche à ajouter
   * @returns {Promise<string>} - ID de la tâche
   */
  async enqueue(task) {
    // Générer un ID unique pour la tâche
    const taskId = crypto.randomUUID();
    
    // Ajouter des métadonnées à la tâche
    const taskWithMetadata = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Stocker la tâche dans KV
    if (this.env.SCRAPING_RESULTS) {
      await this.env.SCRAPING_RESULTS.put(
        `${this.queueNamespace}:${taskId}`,
        JSON.stringify(taskWithMetadata),
        { expirationTtl: 60 * 60 * 24 } // 24 heures
      );
      
      // Ajouter l'ID de la tâche à la liste des tâches en attente
      const pendingTasks = await this.getPendingTasks();
      pendingTasks.push(taskId);
      
      await this.env.SCRAPING_RESULTS.put(
        `${this.queueNamespace}:pending`,
        JSON.stringify(pendingTasks),
        { expirationTtl: 60 * 60 * 24 * 7 } // 7 jours
      );
    }
    
    return taskId;
  }

  /**
   * Récupère une tâche par son ID
   * @param {string} taskId - ID de la tâche
   * @returns {Promise<Object>} - Tâche
   */
  async getTask(taskId) {
    if (!this.env.SCRAPING_RESULTS) {
      return null;
    }
    
    const taskJson = await this.env.SCRAPING_RESULTS.get(`${this.queueNamespace}:${taskId}`);
    
    if (!taskJson) {
      return null;
    }
    
    return JSON.parse(taskJson);
  }

  /**
   * Met à jour le statut d'une tâche
   * @param {string} taskId - ID de la tâche
   * @param {string} status - Nouveau statut
   * @param {Object} result - Résultat de la tâche (optionnel)
   * @returns {Promise<boolean>} - Succès de la mise à jour
   */
  async updateTaskStatus(taskId, status, result = null) {
    if (!this.env.SCRAPING_RESULTS) {
      return false;
    }
    
    // Récupérer la tâche
    const task = await this.getTask(taskId);
    
    if (!task) {
      return false;
    }
    
    // Mettre à jour le statut et les métadonnées
    const updatedTask = {
      ...task,
      status,
      updatedAt: new Date().toISOString()
    };
    
    // Ajouter le résultat si disponible
    if (result) {
      updatedTask.result = result;
    }
    
    // Stocker la tâche mise à jour
    await this.env.SCRAPING_RESULTS.put(
      `${this.queueNamespace}:${taskId}`,
      JSON.stringify(updatedTask),
      { expirationTtl: 60 * 60 * 24 } // 24 heures
    );
    
    // Si la tâche est terminée ou a échoué, la retirer de la liste des tâches en attente
    if (status === 'completed' || status === 'failed') {
      const pendingTasks = await this.getPendingTasks();
      const updatedPendingTasks = pendingTasks.filter(id => id !== taskId);
      
      await this.env.SCRAPING_RESULTS.put(
        `${this.queueNamespace}:pending`,
        JSON.stringify(updatedPendingTasks),
        { expirationTtl: 60 * 60 * 24 * 7 } // 7 jours
      );
    }
    
    return true;
  }

  /**
   * Récupère la liste des tâches en attente
   * @returns {Promise<string[]>} - Liste des IDs des tâches en attente
   */
  async getPendingTasks() {
    if (!this.env.SCRAPING_RESULTS) {
      return [];
    }
    
    const pendingTasksJson = await this.env.SCRAPING_RESULTS.get(`${this.queueNamespace}:pending`);
    
    if (!pendingTasksJson) {
      return [];
    }
    
    return JSON.parse(pendingTasksJson);
  }

  /**
   * Traite les tâches en attente
   * @param {Function} processorFn - Fonction de traitement des tâches
   * @param {number} maxTasks - Nombre maximum de tâches à traiter
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async processPendingTasks(processorFn, maxTasks = 5) {
    const pendingTasks = await this.getPendingTasks();
    const tasksToProcess = pendingTasks.slice(0, maxTasks);
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      remaining: pendingTasks.length - tasksToProcess.length
    };
    
    for (const taskId of tasksToProcess) {
      try {
        // Récupérer la tâche
        const task = await this.getTask(taskId);
        
        if (!task) {
          continue;
        }
        
        // Mettre à jour le statut de la tâche
        await this.updateTaskStatus(taskId, 'processing');
        
        // Traiter la tâche
        const result = await processorFn(task);
        
        // Mettre à jour le statut de la tâche
        await this.updateTaskStatus(taskId, 'completed', result);
        
        results.processed++;
        results.successful++;
      } catch (error) {
        // En cas d'erreur, mettre à jour le statut de la tâche
        await this.updateTaskStatus(taskId, 'failed', { error: error.message });
        
        results.processed++;
        results.failed++;
      }
    }
    
    return results;
  }
}

export default ScrapingQueueManager;
