/**
 * Client pour ParseHub
 * 
 * Ce client permet d'exécuter des projets ParseHub et de récupérer les résultats.
 * ParseHub est un service de web scraping qui permet de créer des projets de scraping
 * via une interface graphique et de les exécuter via une API.
 */

/**
 * Client pour ParseHub
 */
class ParseHubClient {
  /**
   * Constructeur
   * 
   * @param {string} apiKey - Clé API ParseHub
   * @param {boolean} debug - Activer le mode debug
   */
  constructor(apiKey, debug = false) {
    this.apiKey = apiKey;
    this.debug = debug;
    this.baseUrl = 'https://www.parsehub.com/api/v2';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 seconde
  }
  
  /**
   * Active le mode debug
   * 
   * @param {boolean} debug - Activer le mode debug
   * @returns {ParseHubClient} - Instance du client
   */
  enableDebug(debug = true) {
    this.debug = debug;
    return this;
  }
  
  /**
   * Log de debug
   * 
   * @param {string} message - Message à logger
   * @param {any} data - Données à logger
   */
  debugLog(message, data = null) {
    if (this.debug) {
      console.log(`[PARSEHUB_DEBUG] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
  
  /**
   * Construit l'URL de l'API ParseHub
   * 
   * @param {string} endpoint - Endpoint de l'API
   * @param {object} params - Paramètres de la requête
   * @returns {string} - URL de l'API ParseHub
   */
  buildApiUrl(endpoint, params = {}) {
    // Construire l'URL
    const apiUrl = new URL(`${this.baseUrl}${endpoint}`);
    
    // Ajouter la clé API
    apiUrl.searchParams.append('api_key', this.apiKey);
    
    // Ajouter les paramètres
    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });
    
    return apiUrl.toString();
  }
  
  /**
   * Exécute un projet ParseHub
   * 
   * @param {string} projectToken - Token du projet
   * @param {object} options - Options d'exécution
   * @returns {Promise<object>} - Résultat de l'exécution
   */
  async runProject(projectToken, options = {}) {
    this.debugLog(`Exécution du projet ${projectToken}`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl(`/projects/${projectToken}/run`);
    
    // Tentatives d'exécution
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Préparer les données de la requête
        const formData = new FormData();
        
        // Ajouter les options
        Object.entries(options).forEach(([key, value]) => {
          formData.append(key, value);
        });
        
        // Exécuter le projet
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          continue;
        }
        
        // Récupérer le résultat
        const result = await response.json();
        
        this.debugLog(`Projet exécuté avec succès`, result);
        
        return result;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Récupère le résultat d'une exécution
   * 
   * @param {string} runToken - Token de l'exécution
   * @returns {Promise<object>} - Résultat de l'exécution
   */
  async getRunResult(runToken) {
    this.debugLog(`Récupération du résultat de l'exécution ${runToken}`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl(`/runs/${runToken}/data`);
    
    // Tentatives de récupération
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Récupérer le résultat
        const response = await fetch(apiUrl);
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          continue;
        }
        
        // Récupérer le résultat
        const result = await response.json();
        
        this.debugLog(`Résultat récupéré avec succès`, result);
        
        return result;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Récupère le statut d'une exécution
   * 
   * @param {string} runToken - Token de l'exécution
   * @returns {Promise<object>} - Statut de l'exécution
   */
  async getRunStatus(runToken) {
    this.debugLog(`Récupération du statut de l'exécution ${runToken}`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl(`/runs/${runToken}`);
    
    // Tentatives de récupération
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Récupérer le statut
        const response = await fetch(apiUrl);
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          continue;
        }
        
        // Récupérer le statut
        const status = await response.json();
        
        this.debugLog(`Statut récupéré avec succès`, status);
        
        return status;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Arrête une exécution
   * 
   * @param {string} runToken - Token de l'exécution
   * @returns {Promise<object>} - Résultat de l'arrêt
   */
  async cancelRun(runToken) {
    this.debugLog(`Arrêt de l'exécution ${runToken}`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl(`/runs/${runToken}/cancel`);
    
    // Tentatives d'arrêt
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Arrêter l'exécution
        const response = await fetch(apiUrl, {
          method: 'POST'
        });
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          continue;
        }
        
        // Récupérer le résultat
        const result = await response.json();
        
        this.debugLog(`Exécution arrêtée avec succès`, result);
        
        return result;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Liste les projets
   * 
   * @returns {Promise<object>} - Liste des projets
   */
  async listProjects() {
    this.debugLog(`Récupération de la liste des projets`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl('/projects');
    
    // Tentatives de récupération
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Récupérer la liste des projets
        const response = await fetch(apiUrl);
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          continue;
        }
        
        // Récupérer la liste des projets
        const projects = await response.json();
        
        this.debugLog(`Liste des projets récupérée avec succès`, projects);
        
        return projects;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Récupère les informations d'un projet
   * 
   * @param {string} projectToken - Token du projet
   * @returns {Promise<object>} - Informations du projet
   */
  async getProject(projectToken) {
    this.debugLog(`Récupération des informations du projet ${projectToken}`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl(`/projects/${projectToken}`);
    
    // Tentatives de récupération
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Récupérer les informations du projet
        const response = await fetch(apiUrl);
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          continue;
        }
        
        // Récupérer les informations du projet
        const project = await response.json();
        
        this.debugLog(`Informations du projet récupérées avec succès`, project);
        
        return project;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Liste les exécutions d'un projet
   * 
   * @param {string} projectToken - Token du projet
   * @returns {Promise<object>} - Liste des exécutions
   */
  async listRuns(projectToken) {
    this.debugLog(`Récupération de la liste des exécutions du projet ${projectToken}`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Construire l'URL de l'API
    const apiUrl = this.buildApiUrl(`/projects/${projectToken}/runs`);
    
    // Tentatives de récupération
    let attempt = 0;
    let lastError = null;
    
    while (attempt < this.maxRetries) {
      attempt++;
      
      try {
        this.debugLog(`Tentative ${attempt}/${this.maxRetries}...`);
        
        // Récupérer la liste des exécutions
        const response = await fetch(apiUrl);
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
          this.debugLog(errorMessage);
          lastError = new Error(errorMessage);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          continue;
        }
        
        // Récupérer la liste des exécutions
        const runs = await response.json();
        
        this.debugLog(`Liste des exécutions récupérée avec succès`, runs);
        
        return runs;
      } catch (error) {
        this.debugLog(`Erreur: ${error.message}`);
        lastError = error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    // Si toutes les tentatives ont échoué, lancer une erreur
    throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError?.message || 'Erreur inconnue'}`);
  }
  
  /**
   * Attend la fin d'une exécution
   * 
   * @param {string} runToken - Token de l'exécution
   * @param {number} timeout - Timeout en millisecondes
   * @param {number} interval - Intervalle de vérification en millisecondes
   * @returns {Promise<object>} - Résultat de l'exécution
   */
  async waitForRun(runToken, timeout = 60000, interval = 5000) {
    this.debugLog(`Attente de la fin de l'exécution ${runToken}`);
    
    // Vérifier que la clé API est définie
    if (!this.apiKey) {
      throw new Error('Clé API ParseHub non définie');
    }
    
    // Temps de début
    const startTime = Date.now();
    
    // Boucle d'attente
    while (Date.now() - startTime < timeout) {
      try {
        // Récupérer le statut de l'exécution
        const status = await this.getRunStatus(runToken);
        
        // Vérifier si l'exécution est terminée
        if (status.status === 'complete') {
          this.debugLog(`Exécution terminée avec succès`);
          
          // Récupérer le résultat
          return await this.getRunResult(runToken);
        }
        
        // Vérifier si l'exécution a échoué
        if (status.status === 'error') {
          throw new Error(`L'exécution a échoué: ${status.error}`);
        }
        
        // Attendre avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        this.debugLog(`Erreur lors de la vérification du statut: ${error.message}`);
        
        // Attendre avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // Si le timeout est atteint, lancer une erreur
    throw new Error(`Timeout atteint après ${timeout / 1000} secondes`);
  }
}

export { ParseHubClient };
