/**
 * Utilitaires pour le scraper furtif de FloDrama
 * 
 * Ce module contient des fonctions utilitaires pour le scraping
 */

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
  CACHE_DIR: './.cache',
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 heures
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 OPR/82.0.4227.50',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Android 12; Mobile; rv:68.0) Gecko/68.0 Firefox/90.0'
  ]
};

/**
 * Génère un agent utilisateur aléatoire
 * @returns {string} - Agent utilisateur
 */
function getRandomUserAgent() {
  return CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
}

/**
 * Génère un délai aléatoire pour simuler un comportement humain
 * @param {number} min - Délai minimum en ms
 * @param {number} max - Délai maximum en ms
 * @returns {Promise<void>}
 */
function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Vérifie si le cache est disponible et valide
 * @param {string} url - URL à vérifier
 * @returns {Promise<{useCache: boolean, data: any}>}
 */
async function checkCache(url) {
  // Créer un hash de l'URL pour le nom du fichier
  const urlHash = crypto.createHash('md5').update(url).digest('hex');
  const cacheFile = path.join(CONFIG.CACHE_DIR, `${urlHash}.json`);
  
  try {
    // Créer le répertoire de cache s'il n'existe pas
    await fs.ensureDir(CONFIG.CACHE_DIR);
    
    if (await fs.pathExists(cacheFile)) {
      const stats = await fs.stat(cacheFile);
      const age = Date.now() - stats.mtimeMs;
      
      if (age < CONFIG.CACHE_TTL) {
        console.log(`[Cache] Utilisation du cache pour ${url} (${Math.round(age / 60000)} minutes)`);
        const data = await fs.readJson(cacheFile);
        return { useCache: true, data };
      } else {
        console.log(`[Cache] Cache expiré pour ${url} (${Math.round(age / 60000)} minutes)`);
      }
    }
  } catch (error) {
    console.warn(`[Cache] Erreur lors de la vérification du cache: ${error.message}`);
  }
  
  return { useCache: false, data: null };
}

/**
 * Sauvegarde des données dans le cache
 * @param {string} url - URL associée aux données
 * @param {any} data - Données à sauvegarder
 */
async function saveToCache(url, data) {
  try {
    // Créer un hash de l'URL pour le nom du fichier
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const cacheFile = path.join(CONFIG.CACHE_DIR, `${urlHash}.json`);
    
    // Créer le répertoire de cache s'il n'existe pas
    await fs.ensureDir(CONFIG.CACHE_DIR);
    
    // Sauvegarder les données
    await fs.writeJson(cacheFile, data);
    console.log(`[Cache] Données mises en cache pour ${url}`);
  } catch (error) {
    console.warn(`[Cache] Erreur lors de la mise en cache: ${error.message}`);
  }
}

/**
 * Génère un identifiant unique
 * @param {string} prefix - Préfixe pour l'ID
 * @returns {string} - ID unique
 */
function generateUniqueId(prefix = '') {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Nettoie une chaîne de caractères (supprime les espaces multiples, etc.)
 * @param {string} text - Texte à nettoyer
 * @returns {string} - Texte nettoyé
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Extrait l'année d'un texte
 * @param {string} text - Texte contenant potentiellement une année
 * @returns {number} - Année extraite ou année courante
 */
function extractYear(text) {
  if (!text) return new Date().getFullYear();
  
  const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
}

/**
 * Extrait la note d'un texte
 * @param {string} text - Texte contenant potentiellement une note
 * @returns {number} - Note extraite ou 0
 */
function extractRating(text) {
  if (!text) return 0;
  
  // Formats courants: 8.5/10, 8.5 sur 10, 8.5 étoiles, etc.
  const ratingMatch = text.match(/([0-9](\.[0-9])?|10(\.0)?)\s*\/\s*10/) || 
                      text.match(/([0-9](\.[0-9])?|10(\.0)?)\s*sur\s*10/) ||
                      text.match(/([0-9](\.[0-9])?|10(\.0)?)\s*étoiles?/);
  
  if (ratingMatch) {
    return parseFloat(ratingMatch[1]);
  }
  
  // Format simple: juste un nombre entre 0 et 10
  const simpleMatch = text.match(/\b([0-9](\.[0-9])?|10(\.0)?)\b/);
  if (simpleMatch) {
    const value = parseFloat(simpleMatch[1]);
    if (value >= 0 && value <= 10) {
      return value;
    }
  }
  
  return 0;
}

/**
 * Formate une durée en millisecondes en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Durée formatée
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = {
  getRandomUserAgent,
  randomDelay,
  checkCache,
  saveToCache,
  generateUniqueId,
  cleanText,
  extractYear,
  extractRating,
  formatDuration,
  CONFIG
};
