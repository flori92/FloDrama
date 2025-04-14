/**
 * Utilitaires de journalisation (logging)
 * 
 * Ce fichier fournit des fonctions pour la journalisation standardisée
 * dans l'application FloDrama, avec différents niveaux de log et formatage.
 */

// Configuration des niveaux de log
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Configuration par défaut
const DEFAULT_CONFIG = {
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: '/api/logs',
  batchSize: 10,
  flushInterval: 30000, // 30 secondes
  includeTimestamp: true,
  includeContext: true
};

// Configuration globale
let globalConfig = { ...DEFAULT_CONFIG };

// File d'attente pour les logs distants
let remoteQueue = [];
let flushTimeout = null;

/**
 * Configure les options de journalisation
 * @param {Object} options - Options de configuration
 */
export const configureLogging = (options = {}) => {
  globalConfig = {
    ...globalConfig,
    ...options
  };
  
  // Réinitialiser le timeout si l'intervalle a changé
  if (options.flushInterval && flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
    
    if (globalConfig.enableRemote) {
      scheduleFlush();
    }
  }
};

/**
 * Planifie l'envoi des logs en file d'attente
 */
const scheduleFlush = () => {
  if (!flushTimeout && globalConfig.enableRemote) {
    flushTimeout = setTimeout(() => {
      flushLogs();
      flushTimeout = null;
      scheduleFlush();
    }, globalConfig.flushInterval);
  }
};

/**
 * Envoie les logs en file d'attente au serveur
 */
const flushLogs = async () => {
  if (remoteQueue.length === 0) return;
  
  const logsToSend = [...remoteQueue];
  remoteQueue = [];
  
  if (globalConfig.enableRemote) {
    try {
      await fetch(globalConfig.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      // En cas d'échec, remettre les logs dans la file d'attente
      console.error('Erreur lors de l\'envoi des logs au serveur:', error);
      remoteQueue = [...logsToSend, ...remoteQueue].slice(0, 1000); // Limiter à 1000 entrées
    }
  }
};

/**
 * Formate un message de log
 * @param {string} level - Niveau de log
 * @param {string} context - Contexte du log
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 * @returns {Object} Log formaté
 */
const formatLog = (level, context, message, data) => {
  const log = {
    level,
    message
  };
  
  if (globalConfig.includeTimestamp) {
    log.timestamp = new Date().toISOString();
  }
  
  if (globalConfig.includeContext && context) {
    log.context = context;
  }
  
  if (data) {
    log.data = data;
  }
  
  return log;
};

/**
 * Ajoute un log à la console et/ou à la file d'attente distante
 * @param {string} level - Niveau de log
 * @param {string} context - Contexte du log
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 */
const addLog = (level, context, message, data) => {
  // Vérifier si le niveau de log est suffisant
  if (LOG_LEVELS[level] < globalConfig.level) {
    return;
  }
  
  const formattedLog = formatLog(level, context, message, data);
  
  // Logger dans la console
  if (globalConfig.enableConsole) {
    const consoleMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : level === 'INFO' ? 'info' : 'debug';
    
    const prefix = [
      globalConfig.includeTimestamp ? `[${new Date().toISOString()}]` : '',
      globalConfig.includeContext && context ? `[${context}]` : '',
      `[${level}]`
    ].filter(Boolean).join(' ');
    
    if (data) {
      console[consoleMethod](`${prefix} ${message}`, data);
    } else {
      console[consoleMethod](`${prefix} ${message}`);
    }
  }
  
  // Ajouter à la file d'attente distante
  if (globalConfig.enableRemote) {
    remoteQueue.push(formattedLog);
    
    // Envoyer immédiatement si la taille de la file d'attente atteint la taille du lot
    if (remoteQueue.length >= globalConfig.batchSize) {
      flushLogs();
    }
    
    // Planifier l'envoi si ce n'est pas déjà fait
    if (!flushTimeout) {
      scheduleFlush();
    }
  }
};

/**
 * Crée un logger pour un contexte spécifique
 * @param {string} context - Contexte du logger
 * @returns {Object} Logger
 */
export const createLogger = (context) => {
  return {
    debug: (message, data) => addLog('DEBUG', context, message, data),
    info: (message, data) => addLog('INFO', context, message, data),
    warn: (message, data) => addLog('WARN', context, message, data),
    error: (message, data) => addLog('ERROR', context, message, data),
    
    // Méthodes utilitaires
    time: (label) => {
      if (LOG_LEVELS.DEBUG >= globalConfig.level) {
        console.time(`[${context}] ${label}`);
      }
    },
    timeEnd: (label) => {
      if (LOG_LEVELS.DEBUG >= globalConfig.level) {
        console.timeEnd(`[${context}] ${label}`);
      }
    },
    
    // Forcer l'envoi des logs en file d'attente
    flush: () => flushLogs()
  };
};

/**
 * Logger global pour l'application
 */
export const logger = createLogger('App');

// Exporter les constantes et fonctions
export default {
  LOG_LEVELS,
  configureLogging,
  createLogger,
  logger,
  flush: flushLogs
};
