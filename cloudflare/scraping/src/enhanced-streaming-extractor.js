/**
 * Extracteur de streaming amélioré pour FloDrama
 * Utilise la configuration des sources pour extraire efficacement les URLs de streaming
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const CloudflareBypasser = require('./cloudflare-bypasser');
const sourcesConfig = require('./sources-config');

// Configuration de puppeteer avec le plugin de camouflage
puppeteer.use(StealthPlugin());

/**
 * Extrait l'URL de streaming d'une page et la stocke
 * @param {string} pageUrl - URL de la page contenant la vidéo
 * @param {string} contentId - Identifiant du contenu
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractAndStoreStreamingUrl(pageUrl, contentId = null) {
  console.log(`🔍 Extraction de streaming depuis: ${pageUrl}`);
  
  // Détecter la source
  const sourceName = detectSource(pageUrl);
  const sourceConfig = sourcesConfig[sourceName] || {};
  console.log(`📋 Source détectée: ${sourceName}`);
  
  // Générer un contentId si non fourni
  if (!contentId) {
    contentId = `${sourceName}_${uuidv4().substring(0, 8)}`;
    console.log(`🆔 Génération d'ID de contenu: ${contentId}`);
  }
  
  try {
    // Extraire l'URL de streaming
    const streamingInfo = await extractStreamingFromSource(pageUrl, sourceName, sourceConfig);
    
    if (!streamingInfo || !streamingInfo.streaming_url) {
      throw new Error('Impossible d\'extraire l\'URL de streaming');
    }
    
    // Ajouter des métadonnées
    streamingInfo.content_id = contentId;
    streamingInfo.source = sourceName;
    streamingInfo.page_url = pageUrl;
    streamingInfo.extracted_at = new Date().toISOString();
    
    // Calculer l'expiration
    const expiryHours = sourceConfig.expiryHours || 24;
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);
    streamingInfo.expires_at = expiryDate.toISOString();
    
    // Sauvegarder dans le système de stockage local (pour les tests)
    saveStreamingInfo(contentId, streamingInfo);
    
    console.log(`✅ URL de streaming extraite avec succès: ${hideUrlPart(streamingInfo.streaming_url)}`);
    return streamingInfo;
  } catch (error) {
    console.error(`❌ Erreur d'extraction depuis ${pageUrl}:`, error);
    throw new Error(`Échec de l'extraction: ${error.message}`);
  }
}

/**
 * Extrait l'URL de streaming en fonction de la source
 * @param {string} pageUrl - URL de la page
 * @param {string} sourceName - Nom de la source
 * @param {object} sourceConfig - Configuration de la source
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractStreamingFromSource(pageUrl, sourceName, sourceConfig = {}) {
  console.log(`🔍 Extraction depuis la source ${sourceName}`);
  
  // Stratégie par défaut : iframe
  if (sourceConfig.requireCloudflareBypass) {
    return extractStreamingWithCloudflareBypass(pageUrl, sourceConfig);
  } else {
    return extractStreamingFromIframe(pageUrl, sourceConfig);
  }
}

/**
 * Extrait l'URL de streaming en contournant la protection Cloudflare
 * @param {string} pageUrl - URL de la page
 * @param {object} sourceConfig - Configuration de la source
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractStreamingWithCloudflareBypass(pageUrl, sourceConfig) {
  console.log(`🛡️ Utilisation du contournement Cloudflare pour: ${pageUrl}`);
  
  const bypasser = new CloudflareBypasser();
  const content = await bypasser.request(pageUrl);
  
  // Parser le contenu HTML
  const $ = cheerio.load(content);
  
  // Rechercher les iframes
  const iframes = $('iframe');
  const iframeUrls = [];
  
  iframes.each((i, el) => {
    const src = $(el).attr('src');
    if (src && (src.includes('embed') || src.includes('player') || src.includes('video'))) {
      iframeUrls.push(src);
    }
  });
  
  if (iframeUrls.length === 0) {
    throw new Error('Aucune iframe de lecture trouvée');
  }
  
  console.log(`🔗 Iframes trouvées: ${iframeUrls.length}`);
  
  // Explorer chaque iframe pour trouver l'URL de streaming
  for (const iframeUrl of iframeUrls) {
    try {
      // Résoudre l'URL complète si relative
      const fullUrl = iframeUrl.startsWith('http') ? iframeUrl : new URL(iframeUrl, pageUrl).href;
      
      // Extraire l'URL de streaming depuis l'iframe
      const streamingInfo = await extractStreamingFromEmbedUrl(fullUrl, sourceConfig);
      
      if (streamingInfo && streamingInfo.streaming_url) {
        return streamingInfo;
      }
    } catch (error) {
      console.warn(`⚠️ Échec de l'extraction depuis l'iframe ${iframeUrl}:`, error.message);
    }
  }
  
  throw new Error('Aucune URL de streaming trouvée dans les iframes');
}

/**
 * Extrait l'URL de streaming depuis une URL d'intégration (embed)
 * @param {string} embedUrl - URL de l'iframe
 * @param {object} sourceConfig - Configuration de la source
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractStreamingFromEmbedUrl(embedUrl, sourceConfig) {
  console.log(`🔍 Extraction depuis l'URL d'intégration: ${embedUrl}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Définir un user agent réaliste
    await page.setUserAgent(sourceConfig.headers?.['User-Agent'] || 
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    // Intercepter les requêtes pour détecter les sources vidéo
    const videoUrls = [];
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('.mp4') || url.includes('.m3u8') || url.includes('/hls/')) {
        videoUrls.push(url);
      }
      request.continue();
    });
    
    // Visiter l'URL de l'iframe
    await page.goto(embedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Attendre que les vidéos se chargent
    await page.waitForTimeout(5000);
    
    // Si des URLs vidéo ont été trouvées dans les requêtes
    if (videoUrls.length > 0) {
      const qualities = videoUrls.map(detectQuality);
      const { url, quality } = findBestQuality(videoUrls, qualities);
      
      return {
        streaming_url: url,
        quality: quality,
        player_type: 'html5',
        referer: embedUrl
      };
    }
    
    // Sinon, chercher dans la page
    const sources = await page.evaluate(() => {
      const results = [];
      
      // Rechercher les balises source et video
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        if (video.src) {
          results.push({
            url: video.src,
            type: video.getAttribute('type') || ''
          });
        }
        
        const sources = video.querySelectorAll('source');
        sources.forEach(source => {
          results.push({
            url: source.src,
            type: source.getAttribute('type') || ''
          });
        });
      });
      
      // Rechercher dans les scripts pour des URLs
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent;
        if (content) {
          // Recherche de modèles courants d'URLs de streaming
          const m3u8Match = content.match(/["']((https?:)?\/\/[^"']+\.m3u8[^"']*)['"]/i);
          if (m3u8Match && m3u8Match[1]) {
            results.push({
              url: m3u8Match[1],
              type: 'application/x-mpegURL'
            });
          }
          
          const mp4Match = content.match(/["']((https?:)?\/\/[^"']+\.mp4[^"']*)['"]/i);
          if (mp4Match && mp4Match[1]) {
            results.push({
              url: mp4Match[1],
              type: 'video/mp4'
            });
          }
        }
      });
      
      return results;
    });
    
    if (sources.length > 0) {
      // Privilégier les flux HLS (m3u8) pour leur adaptabilité
      const hlsSources = sources.filter(s => 
        s.url.includes('.m3u8') || 
        s.type.includes('mpegURL') || 
        s.type.includes('hls')
      );
      
      if (hlsSources.length > 0) {
        const qualities = hlsSources.map(s => detectQuality(s.url));
        const { url, quality } = findBestQuality(hlsSources.map(s => s.url), qualities);
        
        return {
          streaming_url: url,
          quality: quality,
          player_type: 'hls',
          referer: embedUrl
        };
      }
      
      // Utiliser les sources MP4 si pas de HLS
      const mp4Sources = sources.filter(s => 
        s.url.includes('.mp4') || 
        s.type.includes('mp4')
      );
      
      if (mp4Sources.length > 0) {
        const qualities = mp4Sources.map(s => detectQuality(s.url));
        const { url, quality } = findBestQuality(mp4Sources.map(s => s.url), qualities);
        
        return {
          streaming_url: url,
          quality: quality,
          player_type: 'html5',
          referer: embedUrl
        };
      }
    }
    
    throw new Error('Aucune source vidéo trouvée dans l\'iframe');
  } finally {
    await browser.close();
  }
}

/**
 * Extrait l'URL de streaming d'une iframe
 * @param {string} pageUrl - URL de la page contenant l'iframe
 * @param {object} sourceConfig - Configuration de la source
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractStreamingFromIframe(pageUrl, sourceConfig = {}) {
  console.log(`🔍 Extraction depuis l'iframe pour: ${pageUrl}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Définir un user agent réaliste
    await page.setUserAgent(sourceConfig.headers?.['User-Agent'] || 
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    // Aller à la page
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Rechercher les iframes dans la page
    const iframeUrls = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      return Array.from(iframes)
        .map(iframe => iframe.src)
        .filter(src => src && (src.includes('embed') || src.includes('player') || src.includes('video')));
    });
    
    if (iframeUrls.length === 0) {
      throw new Error('Aucune iframe de lecture trouvée');
    }
    
    console.log(`🔗 Iframes trouvées: ${iframeUrls.length}`);
    
    // Explorer chaque iframe pour trouver l'URL de streaming
    for (const iframeUrl of iframeUrls) {
      try {
        // Extraire l'URL de streaming depuis l'iframe
        const streamingInfo = await extractStreamingFromEmbedUrl(iframeUrl, sourceConfig);
        
        if (streamingInfo && streamingInfo.streaming_url) {
          return streamingInfo;
        }
      } catch (error) {
        console.warn(`⚠️ Échec de l'extraction depuis l'iframe ${iframeUrl}:`, error.message);
      }
    }
    
    throw new Error('Aucune URL de streaming trouvée dans les iframes');
  } finally {
    await browser.close();
  }
}

/**
 * Détecte la qualité vidéo à partir d'une URL
 * @param {string} url - URL de la vidéo
 * @returns {string} - Qualité détectée
 */
function detectQuality(url) {
  if (!url) return 'unknown';
  
  const urlLower = url.toLowerCase();
  
  // Recherche de marqueurs de qualité
  if (urlLower.includes('1080p') || urlLower.includes('1080')) return '1080p';
  if (urlLower.includes('720p') || urlLower.includes('720')) return '720p';
  if (urlLower.includes('480p') || urlLower.includes('480')) return '480p';
  if (urlLower.includes('360p') || urlLower.includes('360')) return '360p';
  if (urlLower.includes('240p') || urlLower.includes('240')) return '240p';
  
  // Qualité par défaut
  return 'auto';
}

/**
 * Trouve la meilleure qualité parmi les URL disponibles
 * @param {Array<string>} urls - Liste d'URLs
 * @param {Array<string>} qualities - Liste de qualités
 * @returns {Object} - URL et qualité
 */
function findBestQuality(urls, qualities) {
  // Priorité des qualités (de la meilleure à la pire)
  const priorityOrder = ['1080p', '720p', '480p', '360p', '240p', 'auto', 'unknown'];
  
  // Créer un tableau d'objets {url, quality}
  const combined = urls.map((url, i) => ({
    url,
    quality: qualities[i] || 'unknown'
  }));
  
  // Trier par priorité
  combined.sort((a, b) => {
    const indexA = priorityOrder.indexOf(a.quality);
    const indexB = priorityOrder.indexOf(b.quality);
    return indexA - indexB;
  });
  
  // Retourner la meilleure option
  return combined[0] || { url: '', quality: 'unknown' };
}

/**
 * Détecte la source de streaming à partir de l'URL
 * @param {string} url - URL à analyser
 * @returns {string} - Nom de la source
 */
function detectSource(url) {
  if (!url) {
    return 'unknown';
  }
  
  const urlLower = url.toLowerCase();
  
  // Parcourir les configurations de sources
  for (const [sourceName, config] of Object.entries(sourcesConfig)) {
    if (urlLower.includes(sourceName) || (config.baseUrl && urlLower.includes(config.baseUrl))) {
      return sourceName;
    }
  }
  
  // Détection basée sur des patterns courants
  if (urlLower.includes('dramacool')) return 'dramacool';
  if (urlLower.includes('viewasian')) return 'viewasian';
  if (urlLower.includes('kissasian')) return 'kissasian';
  if (urlLower.includes('viki')) return 'viki';
  if (urlLower.includes('gogoanime')) return 'gogoanime';
  
  return 'unknown';
}

/**
 * Sauvegarde les informations de streaming dans un fichier local
 * @param {string} contentId - Identifiant du contenu
 * @param {object} streamingInfo - Informations de streaming
 */
function saveStreamingInfo(contentId, streamingInfo) {
  const storageDir = path.join(__dirname, '../scraping-results/streaming');
  
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  const filename = path.join(storageDir, `${contentId}.json`);
  
  try {
    fs.writeFileSync(filename, JSON.stringify(streamingInfo, null, 2), 'utf8');
    console.log(`✅ Informations de streaming sauvegardées dans: ${filename}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde: ${error.message}`);
  }
}

/**
 * Masque une partie de l'URL pour la journalisation
 * @param {string} url - URL à masquer
 * @returns {string} - URL partiellement masquée
 */
function hideUrlPart(url) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return `${urlObj.protocol}//${domain}/***`;
  } catch (error) {
    return `${url.substring(0, 20)}***`;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'extracteur de streaming amélioré');
  
  // Analyser les arguments de ligne de commande
  const args = process.argv.slice(2);
  let sourceToTest = null;
  let limit = 1;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i+1]) {
      sourceToTest = args[i+1];
      i++;
    } else if (args[i] === '--limit' && args[i+1]) {
      limit = parseInt(args[i+1], 10);
      i++;
    }
  }
  
  // Tester une source spécifique
  if (sourceToTest) {
    const config = sourcesConfig[sourceToTest];
    
    if (!config) {
      console.error(`❌ Source inconnue: ${sourceToTest}`);
      return;
    }
    
    console.log(`🧪 Test de la source: ${sourceToTest}`);
    console.log(`🔗 URL de test: ${config.testUrl}`);
    
    try {
      const streamingInfo = await extractAndStoreStreamingUrl(config.testUrl);
      console.log('✅ Résultat du test:');
      console.log(JSON.stringify(streamingInfo, null, 2));
    } catch (error) {
      console.error(`❌ Échec du test:`, error);
    }
    
    return;
  }
  
  console.log('⚠️ Aucune source spécifiée. Utilisez --source pour tester une source spécifique.');
}

// Exporter les fonctions publiques
module.exports = {
  extractAndStoreStreamingUrl,
  extractStreamingFromIframe,
  extractStreamingFromSource,
  detectSource,
  detectQuality
};

// Exécuter si appelé directement
if (require.main === module) {
  main().then(() => {
    console.log('✅ Programme terminé');
  }).catch(error => {
    console.error('❌ Erreur principale:', error);
    process.exit(1);
  });
}
