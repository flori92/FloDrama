/**
 * @file logger.js
 * @description Système de journalisation structurée pour l'API FloDrama
 * 
 * Fournit des fonctions de journalisation avec différents niveaux de gravité
 * et un formatage standardisé.
 */

// Niveaux de journalisation
const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40
};

/**
 * Détermine si un message doit être journalisé en fonction du niveau configuré
 * @param {number} messageLevel - Niveau du message à journaliser
 * @param {Object} env - Variables d'environnement pour accéder au LOG_LEVEL
 * @returns {boolean} - True si le message doit être journalisé
 */
function shouldLog(messageLevel, env) {
  const configuredLevel = getConfiguredLogLevel(env);
  return messageLevel >= configuredLevel;
}

/**
 * Obtient le niveau de journalisation configuré dans l'environnement
 * @param {Object} env - Variables d'environnement
 * @returns {number} - Niveau de journalisation numérique
 */
function getConfiguredLogLevel(env) {
  const levelName = (env.LOG_LEVEL || 'info').toUpperCase();
  return LOG_LEVELS[levelName] || LOG_LEVELS.INFO;
}

/**
 * Journalisation générique avec niveau personnalisé
 * @param {Object|string} message - Message ou objet à journaliser
 * @param {number} level - Niveau de journalisation
 * @param {Object} env - Variables d'environnement
 */
function log(message, level, env) {
  if (!shouldLog(level, env)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logObject = typeof message === 'string' 
    ? { message, timestamp, level: getLevelName(level) }
    : { ...message, timestamp, level: getLevelName(level) };

  console.log(JSON.stringify(logObject));
  
  // Si configuré, on pourrait envoyer les logs à un service externe
  // comme Logflare ou dans un bucket R2 pour archivage
}

/**
 * Obtient le nom textuel d'un niveau de journalisation
 * @param {number} level - Niveau numérique
 * @returns {string} - Nom du niveau
 */
function getLevelName(level) {
  for (const [name, value] of Object.entries(LOG_LEVELS)) {
    if (value === level) {
      return name.toLowerCase();
    }
  }
  return 'unknown';
}

/**
 * Journalisation des requêtes entrantes
 * @param {Object} reqContext - Contexte de la requête
 * @param {Object} env - Variables d'environnement
 */
export function logRequest(reqContext, env) {
  log(reqContext, LOG_LEVELS.INFO, env);
}

/**
 * Journalisation d'informations générales
 * @param {string|Object} message - Message à journaliser
 * @param {Object} env - Variables d'environnement
 */
export function logInfo(message, env) {
  log(message, LOG_LEVELS.INFO, env);
}

/**
 * Journalisation de messages de débogage
 * @param {string|Object} message - Message à journaliser
 * @param {Object} env - Variables d'environnement
 */
export function logDebug(message, env) {
  log(message, LOG_LEVELS.DEBUG, env);
}

/**
 * Journalisation d'avertissements
 * @param {string|Object} message - Message à journaliser
 * @param {Object} env - Variables d'environnement
 */
export function logWarn(message, env) {
  log(message, LOG_LEVELS.WARN, env);
}

/**
 * Journalisation d'erreurs
 * @param {string|Object} error - Erreur à journaliser
 * @param {Object} env - Variables d'environnement
 */
export function logError(error, env) {
  log(error, LOG_LEVELS.ERROR, env);
}
