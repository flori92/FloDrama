/**
 * Script de surveillance complet pour FloDrama
 * Vérifie l'état de l'application sur tous les environnements
 * (Amplify, CloudFront, Production)
 */

// Configuration des environnements
const ENVIRONMENTS = {
  production: {
    name: 'Production',
    baseUrl: 'https://flodrama.com',
    apiUrl: 'https://api.flodrama.com',
    cdnUrl: 'https://videos.flodrama.com',
    fallbackUrl: 'https://d2ra390ol17u3n.cloudfront.net'
  },
  cloudfront: {
    name: 'CloudFront',
    baseUrl: 'https://d2ra390ol17u3n.cloudfront.net',
    apiUrl: null,
    cdnUrl: 'https://d2ra390ol17u3n.cloudfront.net',
    fallbackUrl: null
  },
  amplify: {
    name: 'Amplify',
    baseUrl: 'https://main.d3f4g5h6j7k8.amplifyapp.com',
    apiUrl: null,
    cdnUrl: 'https://videos.flodrama.com',
    fallbackUrl: 'https://d2ra390ol17u3n.cloudfront.net'
  },
  local: {
    name: 'Local',
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3001',
    cdnUrl: 'https://videos.flodrama.com',
    fallbackUrl: 'https://d2ra390ol17u3n.cloudfront.net'
  }
};

// Fichiers critiques à vérifier
const CRITICAL_FILES = [
  '/static/js/main.js',
  '/static/css/main.css',
  '/fallback/metadata.json',
  '/manifest.json',
  '/favicon.ico'
];

// Seuils de performance (en ms)
const PERFORMANCE_THRESHOLDS = {
  excellent: 500,
  good: 1000,
  acceptable: 2000,
  poor: 3000
};

// Options de configuration
let CONFIG = {
  notify: false,
  verbose: false,
  logToConsole: true,
  logToFile: false,
  logFilePath: './flodrama-monitor.log',
  checkInterval: 300000, // 5 minutes
  environments: ['production', 'cloudfront', 'amplify'],
  alertThreshold: 'poor'
};

/**
 * Vérifie l'accessibilité d'un fichier
 * @param {string} url - URL du fichier à vérifier
 * @param {number} timeout - Délai maximum d'attente en ms
 * @returns {Promise<Object>} Résultat de la vérification
 */
const checkFileAccessibility = async (url, timeout = 5000) => {
  const startTime = performance.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    return {
      url,
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      loadTime,
      performanceRating: getPerformanceRating(loadTime)
    };
  } catch (error) {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    return {
      url,
      accessible: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
      loadTime,
      performanceRating: 'critical'
    };
  }
};

/**
 * Vérifie le type MIME d'un fichier JavaScript
 * @param {string} url - URL du fichier à vérifier
 * @returns {Promise<Object>} Résultat de la vérification
 */
const checkJavaScriptMimeType = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store'
    });
    
    const contentType = response.headers.get('content-type');
    const isCorrectMimeType = contentType && (
      contentType.includes('application/javascript') || 
      contentType.includes('text/javascript')
    );
    
    return {
      url,
      mimeTypeCorrect: isCorrectMimeType,
      actualMimeType: contentType
    };
  } catch (error) {
    return {
      url,
      mimeTypeCorrect: false,
      error: error.message
    };
  }
};

/**
 * Vérifie un endpoint API
 * @param {string} url - URL de l'endpoint API
 * @returns {Promise<Object>} Résultat de la vérification
 */
const checkApiEndpoint = async (url) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    let isValidJson = false;
    
    try {
      await response.json();
      isValidJson = true;
    } catch (jsonError) {
      isValidJson = false;
    }
    
    return {
      url,
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      isValidJson,
      loadTime,
      performanceRating: getPerformanceRating(loadTime)
    };
  } catch (error) {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    return {
      url,
      accessible: false,
      error: error.message,
      loadTime,
      performanceRating: 'critical'
    };
  }
};

/**
 * Évalue la performance en fonction du temps de chargement
 * @param {number} loadTime - Temps de chargement en ms
 * @returns {string} Évaluation de la performance
 */
const getPerformanceRating = (loadTime) => {
  if (loadTime <= PERFORMANCE_THRESHOLDS.excellent) {
    return 'excellent';
  } else if (loadTime <= PERFORMANCE_THRESHOLDS.good) {
    return 'good';
  } else if (loadTime <= PERFORMANCE_THRESHOLDS.acceptable) {
    return 'acceptable';
  } else if (loadTime <= PERFORMANCE_THRESHOLDS.poor) {
    return 'poor';
  } else {
    return 'critical';
  }
};

/**
 * Vérifie l'état d'un environnement
 * @param {string} envKey - Clé de l'environnement
 * @returns {Promise<Object>} Rapport de l'environnement
 */
const checkEnvironment = async (envKey) => {
  const env = ENVIRONMENTS[envKey];
  
  if (!env) {
    return {
      name: envKey,
      error: 'Environnement non configuré'
    };
  }
  
  const results = {
    name: env.name,
    baseUrl: env.baseUrl,
    timestamp: new Date().toISOString(),
    files: [],
    api: null,
    cdn: null,
    overall: 'unknown'
  };
  
  // Vérifier les fichiers critiques
  for (const file of CRITICAL_FILES) {
    const fileUrl = `${env.baseUrl}${file}`;
    const fileCheck = await checkFileAccessibility(fileUrl);
    
    // Vérifier le type MIME pour les fichiers JavaScript
    if (file.endsWith('.js') && fileCheck.accessible) {
      const mimeCheck = await checkJavaScriptMimeType(fileUrl);
      fileCheck.mimeTypeCorrect = mimeCheck.mimeTypeCorrect;
      fileCheck.actualMimeType = mimeCheck.actualMimeType;
    }
    
    results.files.push({
      path: file,
      ...fileCheck
    });
  }
  
  // Vérifier l'API (uniquement en production)
  if (env.apiUrl) {
    const apiCheck = await checkApiEndpoint(`${env.apiUrl}/status`);
    results.api = apiCheck;
  }
  
  // Vérifier le CDN
  if (env.cdnUrl) {
    const cdnCheck = await checkFileAccessibility(`${env.cdnUrl}/health-check.txt`);
    results.cdn = cdnCheck;
  }
  
  // Évaluer l'état global
  results.overall = evaluateOverallStatus(results);
  
  return results;
};

/**
 * Évalue l'état global d'un environnement
 * @param {Object} envResults - Résultats des vérifications
 * @returns {string} État global
 */
const evaluateOverallStatus = (envResults) => {
  // Vérifier si des fichiers critiques sont inaccessibles
  const criticalFilesMissing = envResults.files.some(file => 
    !file.accessible && file.path.includes('main.js')
  );
  
  if (criticalFilesMissing) {
    return 'critical';
  }
  
  // Vérifier l'API (si applicable)
  if (envResults.api && !envResults.api.accessible) {
    return 'critical';
  }
  
  // Vérifier le CDN (si applicable)
  if (envResults.cdn && !envResults.cdn.accessible) {
    return 'warning';
  }
  
  // Compter les problèmes de performance
  const performanceIssues = envResults.files.filter(file => 
    file.performanceRating === 'poor' || file.performanceRating === 'critical'
  ).length;
  
  if (performanceIssues > 2) {
    return 'warning';
  }
  
  // Vérifier les types MIME
  const mimeTypeIssues = envResults.files.some(file => 
    file.path.endsWith('.js') && file.accessible && !file.mimeTypeCorrect
  );
  
  if (mimeTypeIssues) {
    return 'warning';
  }
  
  return 'healthy';
};

/**
 * Génère un rapport détaillé
 * @param {Array<Object>} results - Résultats des vérifications
 * @returns {Object} Rapport détaillé
 */
const generateReport = (results) => {
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    environments: results,
    summary: {
      healthy: results.filter(env => env.overall === 'healthy').length,
      warning: results.filter(env => env.overall === 'warning').length,
      critical: results.filter(env => env.overall === 'critical').length,
      unknown: results.filter(env => env.overall === 'unknown').length
    },
    alerts: []
  };
  
  // Générer les alertes
  results.forEach(env => {
    if (env.overall === 'critical') {
      report.alerts.push({
        severity: 'critical',
        environment: env.name,
        message: `L'environnement ${env.name} est dans un état critique.`
      });
    } else if (env.overall === 'warning') {
      report.alerts.push({
        severity: 'warning',
        environment: env.name,
        message: `L'environnement ${env.name} présente des avertissements.`
      });
    }
    
    // Alertes spécifiques pour les fichiers
    env.files.forEach(file => {
      if (!file.accessible) {
        report.alerts.push({
          severity: 'critical',
          environment: env.name,
          message: `Le fichier ${file.path} est inaccessible dans l'environnement ${env.name}.`
        });
      } else if (file.path.endsWith('.js') && !file.mimeTypeCorrect) {
        report.alerts.push({
          severity: 'warning',
          environment: env.name,
          message: `Le fichier ${file.path} a un type MIME incorrect: ${file.actualMimeType}.`
        });
      }
    });
    
    // Alertes pour l'API
    if (env.api && !env.api.accessible) {
      report.alerts.push({
        severity: 'critical',
        environment: env.name,
        message: `L'API est inaccessible dans l'environnement ${env.name}.`
      });
    }
    
    // Alertes pour le CDN
    if (env.cdn && !env.cdn.accessible) {
      report.alerts.push({
        severity: 'warning',
        environment: env.name,
        message: `Le CDN est inaccessible dans l'environnement ${env.name}.`
      });
    }
  });
  
  return report;
};

/**
 * Journalise un message
 * @param {string} message - Message à journaliser
 * @param {string} level - Niveau de journalisation
 */
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (CONFIG.logToConsole) {
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warning':
        console.warn(formattedMessage);
        break;
      case 'info':
      default:
        console.log(formattedMessage);
        break;
    }
  }
  
  // En production, implémenter la journalisation dans un fichier
  if (CONFIG.logToFile) {
    // Code pour écrire dans un fichier de log
  }
};

/**
 * Exécute la surveillance complète
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Rapport de surveillance
 */
export const runMonitoring = async (options = {}) => {
  // Fusionner les options avec la configuration par défaut
  CONFIG = { ...CONFIG, ...options };
  
  log('Démarrage de la surveillance FloDrama');
  
  const results = [];
  
  // Vérifier chaque environnement configuré
  for (const envKey of CONFIG.environments) {
    log(`Vérification de l'environnement: ${envKey}`);
    
    try {
      const envResults = await checkEnvironment(envKey);
      results.push(envResults);
      
      log(`État de l'environnement ${envKey}: ${envResults.overall}`);
      
      if (CONFIG.verbose) {
        log(`Détails pour ${envKey}: ${JSON.stringify(envResults, null, 2)}`);
      }
    } catch (error) {
      log(`Erreur lors de la vérification de l'environnement ${envKey}: ${error.message}`, 'error');
      
      results.push({
        name: ENVIRONMENTS[envKey]?.name || envKey,
        error: error.message,
        overall: 'unknown'
      });
    }
  }
  
  // Générer le rapport
  const report = generateReport(results);
  
  // Afficher les alertes
  if (report.alerts.length > 0) {
    log(`${report.alerts.length} alertes détectées:`, 'warning');
    
    report.alerts.forEach(alert => {
      log(`[${alert.severity.toUpperCase()}] ${alert.message}`, alert.severity === 'critical' ? 'error' : 'warning');
    });
  } else {
    log('Aucune alerte détectée.');
  }
  
  // Enregistrer le rapport si demandé
  if (CONFIG.notify) {
    log('Enregistrement du rapport...');
    // Code pour enregistrer le rapport (par exemple, dans un fichier JSON)
  }
  
  log('Surveillance terminée.');
  
  return report;
};

/**
 * Initialise la surveillance périodique
 * @param {Object} options - Options de configuration
 * @returns {Object} Contrôleur de surveillance
 */
export const initMonitoring = (options = {}) => {
  // Fusionner les options avec la configuration par défaut
  CONFIG = { ...CONFIG, ...options };
  
  let intervalId = null;
  
  const start = () => {
    log('Démarrage de la surveillance périodique');
    
    // Exécuter immédiatement
    runMonitoring(CONFIG);
    
    // Configurer l'intervalle
    intervalId = setInterval(() => {
      runMonitoring(CONFIG);
    }, CONFIG.checkInterval);
    
    return true;
  };
  
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      log('Surveillance périodique arrêtée');
      return true;
    }
    
    return false;
  };
  
  return {
    start,
    stop,
    runNow: () => runMonitoring(CONFIG),
    isRunning: () => intervalId !== null,
    updateConfig: (newOptions) => {
      const wasRunning = intervalId !== null;
      
      // Arrêter si en cours d'exécution
      if (wasRunning) {
        stop();
      }
      
      // Mettre à jour la configuration
      CONFIG = { ...CONFIG, ...newOptions };
      
      // Redémarrer si nécessaire
      if (wasRunning) {
        start();
      }
      
      return CONFIG;
    }
  };
};

// Définir l'objet à exporter par défaut
const monitorFlodrama = {
  runMonitoring,
  initMonitoring,
  ENVIRONMENTS,
  PERFORMANCE_THRESHOLDS
};

export default monitorFlodrama;
