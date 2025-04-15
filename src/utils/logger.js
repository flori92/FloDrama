/**
 * Service de logging pour FloDrama
 * Centralise la gestion des logs et erreurs
 */

// Fonctions de log simplifiées pour débloquer le build
function logDebug(message, data = {}) {
  console.debug(`[FloDrama DEBUG]: ${message}`, data);
}

function logInfo(message, data = {}) {
  console.info(`[FloDrama INFO]: ${message}`, data);
}

function logWarn(message, data = {}) {
  console.warn(`[FloDrama WARN]: ${message}`, data);
}

function logError(message, error = {}) {
  console.error(`[FloDrama ERROR]: ${message}`, error);
}

function setupErrorCapture() {
  window.addEventListener('error', (event) => {
    logError('Erreur non gérée', event);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logError('Promesse rejetée non gérée', event);
  });
}

// Exporter l'interface
const logger = {
  logDebug,
  logInfo,
  logWarn,
  logError,
  setupErrorCapture
};

// Exports pour compatibilité
export default logger;
export { logDebug, logInfo, logWarn as logWarning, logError };
