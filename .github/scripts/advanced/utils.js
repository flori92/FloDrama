/**
 * Utilitaires avancés pour le scraping de FloDrama
 * 
 * Ce module contient des fonctions pour contourner les protections anti-scraping
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { chromium } = require('playwright');
const https = require('https');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  CACHE_DIR: './.cache',
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 heures
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,
  TIMEOUT: 60000,
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
  ],
  PROXY_URLS: [
    // Ajoutez vos proxies ici si nécessaire
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
 * Récupère le HTML d'une URL avec Axios (méthode simple)
 * @param {string} url - URL à scraper
 * @returns {Promise<string|null>} - HTML récupéré ou null
 */
async function fetchHtmlWithAxios(url) {
  // Vérifier le cache
  const { useCache, data } = await checkCache(url);
  if (useCache && data) {
    return data;
  }
  
  // Créer un agent HTTPS personnalisé
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Ignorer les erreurs SSL
    keepAlive: true
  });
  
  try {
    // Effectuer la requête avec des en-têtes aléatoires
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'sec-ch-ua': '"Google Chrome";v="91", " Not;A Brand";v="99", "Chromium";v="91"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      timeout: CONFIG.TIMEOUT,
      httpsAgent,
      maxRedirects: 5
    });
    
    // Sauvegarder dans le cache
    await saveToCache(url, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`[Axios] Erreur lors de la récupération de ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Récupère le HTML d'une URL avec Playwright (méthode avancée)
 * @param {string} url - URL à scraper
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<string|null>} - HTML récupéré ou null
 */
async function fetchHtmlWithPlaywright(url, options = {}) {
  // Vérifier le cache
  const { useCache, data } = await checkCache(url);
  if (useCache && data) {
    return data;
  }
  
  let browser = null;
  
  try {
    // Lancer le navigateur
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    // Créer un contexte avec des en-têtes aléatoires
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });
    
    // Créer une page
    const page = await context.newPage();
    
    // Intercepter les requêtes pour bloquer les ressources inutiles
    if (options.blockResources) {
      await page.route('**/*.{png,jpg,jpeg,gif,webp,css,svg,woff,woff2,ttf,otf,eot}', route => route.abort());
    }
    
    // Définir un timeout
    page.setDefaultTimeout(CONFIG.TIMEOUT);
    
    // Naviguer vers l'URL
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Simuler un comportement humain
    await randomDelay();
    await page.mouse.move(Math.random() * 500, Math.random() * 500);
    await page.mouse.wheel(0, Math.random() * 300);
    
    // Attendre un sélecteur spécifique si nécessaire
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector);
    }
    
    // Récupérer le HTML
    const html = await page.content();
    
    // Sauvegarder dans le cache
    await saveToCache(url, html);
    
    return html;
  } catch (error) {
    console.error(`[Playwright] Erreur lors de la récupération de ${url}: ${error.message}`);
    return null;
  } finally {
    // Fermer le navigateur
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Récupère le HTML d'une URL avec retry et fallback
 * @param {string} url - URL à scraper
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<string|null>} - HTML récupéré ou null
 */
async function fetchHtml(url, options = {}) {
  // Essayer d'abord avec Axios (plus rapide)
  let html = await fetchHtmlWithAxios(url);
  
  // Si ça échoue, essayer avec Playwright (plus robuste)
  if (!html) {
    console.log(`[Fetch] Échec avec Axios, tentative avec Playwright pour ${url}`);
    html = await fetchHtmlWithPlaywright(url, options);
  }
  
  return html;
}

module.exports = {
  getRandomUserAgent,
  randomDelay,
  checkCache,
  saveToCache,
  fetchHtml,
  fetchHtmlWithAxios,
  fetchHtmlWithPlaywright,
  CONFIG
};
