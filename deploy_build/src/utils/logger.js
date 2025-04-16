/**
 * Utilitaire de journalisation pour FloDrama
 * Permet de centraliser les logs et de les formater de manière cohérente
 */

// Niveaux de log
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Configuration par défaut
let config = {
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: 'https://logs.flodrama.com/api/log',
  appVersion: process.env.REACT_APP_VERSION || '1.0.0'
};

/**
 * Configure le système de journalisation
 * @param {Object} options - Options de configuration
 */
export const configureLogger = (options = {}) => {
  config = { ...config, ...options };
};

/**
 * Formate un message de log
 * @param {string} level - Niveau de log
 * @param {string} message - Message à logger
 * @param {Object} data - Données supplémentaires
 * @returns {Object} - Objet de log formaté
 */
const formatLogMessage = (level, message, data = {}) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    appVersion: config.appVersion,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
};

/**
 * Envoie un log au serveur distant
 * @param {Object} logData - Données de log
 */
const sendRemoteLog = async (logData) => {
  if (!config.enableRemote) return;
  
  try {
    const response = await fetch(config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData),
      // Ne pas attendre la réponse pour ne pas bloquer l'application
      keepalive: true
    });
    
    if (!response.ok) {
      console.error('Erreur lors de l\'envoi du log distant:', response.status);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du log distant:', error);
  }
};

/**
 * Fonction de log générique
 * @param {string} level - Niveau de log
 * @param {string} message - Message à logger
 * @param {Object} data - Données supplémentaires
 */
const log = (level, message, data = {}) => {
  // Vérifier si le niveau de log est suffisant
  if (LOG_LEVELS[level] < config.level) return;
  
  const logData = formatLogMessage(level, message, data);
  
  // Afficher dans la console si activé
  if (config.enableConsole) {
    switch (level) {
      case 'DEBUG':
        console.debug(`[${level}] ${message}`, data);
        break;
      case 'INFO':
        console.info(`[${level}] ${message}`, data);
        break;
      case 'WARN':
        console.warn(`[${level}] ${message}`, data);
        break;
      case 'ERROR':
        console.error(`[${level}] ${message}`, data);
        break;
      default:
        console.log(`[${level}] ${message}`, data);
    }
  }
  
  // Envoyer au serveur distant si c'est une erreur ou un avertissement
  if (LOG_LEVELS[level] >= LOG_LEVELS.WARN) {
    sendRemoteLog(logData);
  }
};

/**
 * Log de niveau DEBUG
 * @param {string} message - Message à logger
 * @param {Object} data - Données supplémentaires
 */
export const logDebug = (message, data = {}) => {
  log('DEBUG', message, data);
};

/**
 * Log de niveau INFO
 * @param {string} message - Message à logger
 * @param {Object} data - Données supplémentaires
 */
export const logInfo = (message, data = {}) => {
  log('INFO', message, data);
};

/**
 * Log de niveau WARN
 * @param {string} message - Message à logger
 * @param {Object} data - Données supplémentaires
 */
export const logWarn = (message, data = {}) => {
  log('WARN', message, data);
};

/**
 * Log de niveau ERROR
 * @param {string} message - Message à logger
 * @param {Object} data - Données supplémentaires
 */
export const logError = (message, error = {}) => {
  const errorData = error instanceof Error 
    ? { 
        message: error.message, 
        stack: error.stack,
        name: error.name 
      }
    : error;
  
  log('ERROR', message, errorData);
};

/**
 * Capture les erreurs non gérées
 */
export const setupErrorCapture = () => {
  window.addEventListener('error', (event) => {
    logError('Erreur non gérée', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logError('Promesse rejetée non gérée', {
      reason: event.reason?.message || event.reason,
      stack: event.reason?.stack
    });
  });
};

// Créer l'objet logger avant de l'exporter
const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  configure: configureLogger,
  setupErrorCapture
};

// Exporter l'interface
export default logger;
