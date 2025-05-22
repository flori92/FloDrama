/**
 * Utilitaires pour le système de scraping Crawlee de FloDrama
 * Ce fichier contient des fonctions d'aide pour le scraping
 */

const fs = require('fs-extra');
const path = require('path');
const { CONFIG } = require('./config');

/**
 * Vérifie si le cache est disponible et valide pour une source
 * @param {string} sourceName - Nom de la source
 * @returns {Promise<{useCache: boolean, cachedData: Array|null}>}
 */
async function checkCache(sourceName) {
  const cacheFile = path.join(CONFIG.CACHE_DIR, `${sourceName}.json`);
  let useCache = false;
  let cachedData = null;

  try {
    // Créer le répertoire de cache s'il n'existe pas
    await fs.ensureDir(CONFIG.CACHE_DIR);
    
    if (await fs.pathExists(cacheFile)) {
      const stats = await fs.stat(cacheFile);
      const age = Date.now() - stats.mtimeMs;
      
      if (age < CONFIG.CACHE_TTL) {
        console.log(`[${sourceName}] Cache valide (${Math.round(age / 60000)} minutes)`);
        cachedData = await fs.readJson(cacheFile);
        
        if (Array.isArray(cachedData) && cachedData.length >= CONFIG.MIN_ITEMS_PER_SOURCE) {
          console.log(`[${sourceName}] ${cachedData.length} éléments chargés depuis le cache`);
          useCache = true;
        } else {
          console.log(`[${sourceName}] Cache insuffisant (${cachedData?.length || 0} éléments), scraping nécessaire`);
          // Garder les données en cache comme fallback même si insuffisantes
        }
      } else {
        console.log(`[${sourceName}] Cache expiré (${Math.round(age / 60000)} minutes > ${Math.round(CONFIG.CACHE_TTL / 60000)} minutes)`);
      }
    }
  } catch (error) {
    console.warn(`[${sourceName}] Erreur lors de la vérification du cache: ${error.message}`);
  }
  
  return { useCache, cachedData };
}

/**
 * Sauvegarde les données dans le cache et le fichier de sortie
 * @param {string} sourceName - Nom de la source
 * @param {Array} data - Données à sauvegarder
 * @returns {Promise<boolean>}
 */
async function saveData(sourceName, data) {
  try {
    // Créer les répertoires nécessaires
    await fs.ensureDir(CONFIG.CACHE_DIR);
    await fs.ensureDir(CONFIG.OUTPUT_DIR);
    
    // Sauvegarder dans le cache
    const cacheFile = path.join(CONFIG.CACHE_DIR, `${sourceName}.json`);
    await fs.writeJson(cacheFile, data, { spaces: 2 });
    console.log(`[${sourceName}] Données mises en cache avec succès`);
    
    // Sauvegarder dans le répertoire de sortie
    const outputFile = path.join(CONFIG.OUTPUT_DIR, `${sourceName}.json`);
    await fs.writeJson(outputFile, data, { spaces: 2 });
    console.log(`[${sourceName}] Données sauvegardées dans ${outputFile}`);
    
    return true;
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de la sauvegarde des données: ${error.message}`);
    return false;
  }
}

/**
 * Divise un tableau en sous-tableaux de taille spécifiée
 * @param {Array} array - Tableau à diviser
 * @param {number} chunkSize - Taille des sous-tableaux
 * @returns {Array} - Tableau de sous-tableaux
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
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

/**
 * Génère un identifiant unique pour un élément
 * @param {string} sourceName - Nom de la source
 * @param {string} id - Identifiant brut
 * @returns {string} - Identifiant unique
 */
function generateUniqueId(sourceName, id) {
  if (!id) {
    return `${sourceName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  return `${sourceName}_${id.toString().replace(/[^a-zA-Z0-9]/g, '_')}`;
}

/**
 * Nettoie une URL pour la rendre absolue
 * @param {string} url - URL à nettoyer
 * @param {string} baseUrl - URL de base
 * @returns {string} - URL absolue
 */
function cleanUrl(url, baseUrl) {
  if (!url) return '';
  
  // Si l'URL est déjà absolue
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Si l'URL est relative au domaine
  if (url.startsWith('/')) {
    const domain = baseUrl.match(/^(https?:\/\/[^\/]+)/)?.[1] || baseUrl;
    return `${domain}${url}`;
  }
  
  // Si l'URL est relative au chemin
  return `${baseUrl.replace(/\/[^\/]*$/, '/')}${url}`;
}

/**
 * Extrait l'année d'un texte
 * @param {string} text - Texte à analyser
 * @returns {number|null} - Année extraite ou null
 */
function extractYear(text) {
  if (!text) return null;
  
  const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

/**
 * Extrait la note d'un texte
 * @param {string} text - Texte à analyser
 * @returns {number|null} - Note extraite ou null
 */
function extractRating(text) {
  if (!text) return null;
  
  const ratingMatch = text.match(/([0-9](\.[0-9])?|10(\.0)?)\s*\/\s*10/) || 
                      text.match(/([0-9](\.[0-9])?|10(\.0)?)/);
  
  return ratingMatch ? parseFloat(ratingMatch[1]) : null;
}

/**
 * Normalise un titre en supprimant les caractères spéciaux
 * @param {string} title - Titre à normaliser
 * @returns {string} - Titre normalisé
 */
function normalizeTitle(title) {
  if (!title) return '';
  
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-àáâãäåçèéêëìíîïñòóôõöùúûüýÿ]/gi, ' ')
    .trim();
}

module.exports = {
  checkCache,
  saveData,
  chunkArray,
  formatDuration,
  generateUniqueId,
  cleanUrl,
  extractYear,
  extractRating,
  normalizeTitle
};
