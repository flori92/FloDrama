/**
 * Module d'extraction des URLs de streaming pour FloDrama
 * 
 * Ce module permet d'extraire les URLs de streaming à partir des sources
 * sans télécharger le contenu vidéo, conformément à l'approche de proxy.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const axios = require('axios');
const crypto = require('crypto');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { v4: uuidv4 } = require('uuid');
const cloudflareBypasser = require('./cloudflare-bypasser');

// Configuration des plugins pour puppeteer
puppeteer.use(StealthPlugin());

// Sources de streaming supportées
const STREAMING_SOURCES = {
  DRAMACOOL: 'dramacool',
  VIEWASIAN: 'viewasian',
  MYASIANTV: 'myasiantv',
  KISSASIAN: 'kissasian',
  GOGOPLAY: 'gogoplay',
  GENERIC: 'generic'
};

/**
 * Détecte la source à partir de l'URL
 * @param {string} url - URL à analyser
 * @returns {string} - Identifiant de la source
 */
function detectSource(url) {
  if (!url) {
    return STREAMING_SOURCES.GENERIC;
  }
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('dramacool')) {
    return STREAMING_SOURCES.DRAMACOOL;
  }
  if (urlLower.includes('viewasian')) {
    return STREAMING_SOURCES.VIEWASIAN;
  }
  if (urlLower.includes('myasiantv')) {
    return STREAMING_SOURCES.MYASIANTV;
  }
  if (urlLower.includes('kissasian')) {
    return STREAMING_SOURCES.KISSASIAN;
  }
  if (urlLower.includes('gogo-play') || urlLower.includes('gogoplay')) {
    return STREAMING_SOURCES.GOGOPLAY;
  }
  
  return STREAMING_SOURCES.GENERIC;
}

/**
 * Extrait l'URL de streaming depuis une page avec iframe
 * @param {string} pageUrl - URL de la page contenant l'iframe
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractStreamingFromIframe(pageUrl) {
  console.log(`Extraction de l'URL de streaming depuis: ${pageUrl}`);
  
  // Déterminer la source
  const source = detectSource(pageUrl);
  
  // Initialiser le navigateur en mode furtif
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  try {
    // Ouvrir une nouvelle page
    const page = await browser.newPage();
    
    // Configurer l'interception des requêtes pour les médias
    let streamingUrls = [];
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      // Laisser passer toutes les requêtes
      request.continue();
    });
    
    page.on('response', async response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      // Détecter les réponses contenant des flux vidéo (m3u8, mp4, etc.)
      if (
        contentType.includes('mpegurl') || 
        contentType.includes('mp4') || 
        url.includes('.m3u8') || 
        url.includes('.mp4')
      ) {
        streamingUrls.push({
          url: url,
          contentType: contentType,
          quality: detectQuality(url)
        });
      }
    });
    
    // Naviguer vers la page
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Attendre un peu pour capturer toutes les requêtes médias
    await page.waitForTimeout(5000);
    
    // Si aucune URL n'a été capturée, essayer d'extraire les URL depuis les iframes
    if (streamingUrls.length === 0) {
      console.log('Aucune URL de streaming détectée automatiquement, analyse des iframes...');
      
      // Extraire les iframes
      const iframeUrls = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.map(iframe => iframe.src).filter(src => src && src !== 'about:blank');
      });
      
      // Analyser chaque iframe
      for (const iframeUrl of iframeUrls) {
        console.log(`Analyse de l'iframe: ${iframeUrl}`);
        
        try {
          // Naviguer vers l'iframe
          await page.goto(iframeUrl, { waitUntil: 'networkidle2', timeout: 20000 });
          await page.waitForTimeout(3000);
          
          // Si toujours aucune URL, essayer d'extraire des éléments vidéo directement
          if (streamingUrls.length === 0) {
            const videoSources = await page.evaluate(() => {
              const sources = Array.from(document.querySelectorAll('video source, video'));
              return sources.map(source => source.src || source.getAttribute('src')).filter(Boolean);
            });
            
            for (const src of videoSources) {
              streamingUrls.push({
                url: src,
                contentType: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
                quality: detectQuality(src)
              });
            }
          }
        } catch (iframeError) {
          console.warn(`Erreur lors de l'analyse de l'iframe ${iframeUrl}:`, iframeError.message);
        }
      }
    }
    
    // Fermer le navigateur
    await browser.close();
    
    // Trier les URLs par qualité et prendre la meilleure
    streamingUrls.sort((a, b) => {
      // Prioriser les m3u8 car ils s'adaptent automatiquement
      if (a.url.includes('.m3u8') && !b.url.includes('.m3u8')) return -1;
      if (!a.url.includes('.m3u8') && b.url.includes('.m3u8')) return 1;
      
      // Ensuite, trier par qualité détectée
      const qualityA = a.quality ? parseInt(a.quality) : 0;
      const qualityB = b.quality ? parseInt(b.quality) : 0;
      return qualityB - qualityA;
    });
    
    // Si aucune URL n'a été trouvée
    if (streamingUrls.length === 0) {
      throw new Error(`Aucune URL de streaming trouvée pour: ${pageUrl}`);
    }
    
    // Prendre la meilleure URL
    const bestStream = streamingUrls[0];
    
    // Générer un ID unique pour cette référence de streaming
    const streamId = crypto.createHash('md5').update(bestStream.url).digest('hex');
    
    // Déterminer la date d'expiration (par défaut 24h, mais varie selon la source)
    const expiryHours = getExpiryHours(source);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);
    
    // Créer l'objet d'informations de streaming
    return {
      id: `stream_${streamId}`,
      streaming_url: bestStream.url,
      source: source,
      content_type: bestStream.contentType,
      quality: bestStream.quality,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      referrer_policy: getReferrerPolicy(source)
    };
  } catch (error) {
    // Fermer le navigateur en cas d'erreur
    await browser.close();
    throw error;
  }
}

/**
 * Détecte la qualité vidéo à partir de l'URL
 * @param {string} url - URL à analyser
 * @returns {string|null} - Qualité détectée (720p, 1080p, etc.) ou null
 */
function detectQuality(url) {
  if (!url) return null;
  
  const urlLower = url.toLowerCase();
  const qualityPatterns = [
    { pattern: /1080p/i, quality: '1080' },
    { pattern: /720p/i, quality: '720' },
    { pattern: /480p/i, quality: '480' },
    { pattern: /360p/i, quality: '360' },
    { pattern: /240p/i, quality: '240' },
    { pattern: /hd/i, quality: '720' },
    { pattern: /high/i, quality: '720' },
    { pattern: /medium/i, quality: '480' },
    { pattern: /low/i, quality: '360' }
  ];
  
  for (const { pattern, quality } of qualityPatterns) {
    if (pattern.test(urlLower)) {
      return quality;
    }
  }
  
  return null;
}

/**
 * Détermine le nombre d'heures avant expiration selon la source
 * @param {string} source - Source du streaming
 * @returns {number} - Nombre d'heures avant expiration
 */
function getExpiryHours(source) {
  const expiryMap = {
    [STREAMING_SOURCES.DRAMACOOL]: 6,
    [STREAMING_SOURCES.VIEWASIAN]: 12,
    [STREAMING_SOURCES.MYASIANTV]: 8,
    [STREAMING_SOURCES.KISSASIAN]: 4,
    [STREAMING_SOURCES.GOGOPLAY]: 24,
    [STREAMING_SOURCES.GENERIC]: 24
  };
  
  return expiryMap[source] || 24;
}

/**
 * Détermine la politique de référence selon la source
 * @param {string} source - Source du streaming
 * @returns {string} - Politique de référence
 */
function getReferrerPolicy(source) {
  const policyMap = {
    [STREAMING_SOURCES.DRAMACOOL]: 'origin',
    [STREAMING_SOURCES.VIEWASIAN]: 'no-referrer-when-downgrade',
    [STREAMING_SOURCES.MYASIANTV]: 'origin',
    [STREAMING_SOURCES.KISSASIAN]: 'origin',
    [STREAMING_SOURCES.GOGOPLAY]: 'no-referrer',
    [STREAMING_SOURCES.GENERIC]: 'no-referrer'
  };
  
  return policyMap[source] || 'no-referrer';
}

/**
 * Stocke les informations de streaming dans Cloudflare D1 et KV
 * @param {object} streamingInfo - Informations de streaming
 * @param {string} contentId - ID du contenu associé
 * @param {object} options - Options supplémentaires (type, épisode, etc.)
 * @param {object} env - Environnement Cloudflare
 * @returns {Promise<object>} - Informations de streaming stockées
 */
async function storeStreamingReference(streamingInfo, contentId, options = {}, env = null) {
  // Si l'environnement Cloudflare est fourni, stocker dans D1 et KV
  if (env) {
    try {
      // Préparer les données pour la base D1
      const contentType = options.type || 'episode';
      const episodeNumber = options.episodeNumber || null;
      const seasonNumber = options.seasonNumber || 1;
      
      // Construire la requête SQL
      if (env.STREAMING_DB) {
        await env.STREAMING_DB.prepare(`
          INSERT OR REPLACE INTO streaming_references 
          (id, content_id, content_type, streaming_url, source, created_at, updated_at, expires_at, 
           referrer_policy, content_type_header, subtitles_url, subtitles_language, 
           episode_number, season_number, quality, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          streamingInfo.id,
          contentId,
          contentType,
          streamingInfo.streaming_url,
          streamingInfo.source,
          streamingInfo.created_at,
          streamingInfo.updated_at,
          streamingInfo.expires_at,
          streamingInfo.referrer_policy,
          streamingInfo.content_type,
          options.subtitlesUrl || null,
          options.subtitlesLanguage || null,
          episodeNumber,
          seasonNumber,
          streamingInfo.quality || 'HD',
          1
        ).run();
        
        console.log(`Informations de streaming stockées dans D1 pour: ${contentId}`);
      }
      
      // Stocker dans KV pour un accès plus rapide
      if (env.FLODRAMA_METADATA) {
        const kvKey = `stream:${contentId}${episodeNumber ? `:${episodeNumber}` : ''}`;
        await env.FLODRAMA_METADATA.put(kvKey, JSON.stringify(streamingInfo), {
          expirationTtl: calculateExpirySeconds(streamingInfo.expires_at)
        });
        
        console.log(`Informations de streaming stockées dans KV pour: ${kvKey}`);
      }
    } catch (dbError) {
      console.error('Erreur lors du stockage des informations de streaming:', dbError);
      throw dbError;
    }
  } else {
    // En mode local, simplement logger les informations
    console.log(`[LOCAL] Stockage simulé des informations de streaming pour: ${contentId}`);
    console.log(JSON.stringify(streamingInfo, null, 2));
  }
  
  return streamingInfo;
}

/**
 * Calcule le nombre de secondes jusqu'à l'expiration
 * @param {string} expiresAt - Date d'expiration au format ISO
 * @returns {number} - Nombre de secondes jusqu'à l'expiration
 */
function calculateExpirySeconds(expiresAt) {
  if (!expiresAt) return 86400; // 24h par défaut
  
  const expiryTime = new Date(expiresAt).getTime();
  const currentTime = new Date().getTime();
  const secondsUntilExpiry = Math.floor((expiryTime - currentTime) / 1000);
  
  // Minimum 1h, maximum 7j
  return Math.max(3600, Math.min(secondsUntilExpiry, 604800));
}

/**
 * API principale pour extraire et stocker les informations de streaming
 * @param {string} pageUrl - URL de la page contenant la vidéo
 * @param {string} contentId - ID du contenu associé
 * @param {object} options - Options supplémentaires
 * @param {object} env - Environnement Cloudflare
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractAndStoreStreamingUrl(pageUrl, contentId, options = {}, env = null) {
  try {
    console.log(`Extraction des informations de streaming pour: ${contentId} depuis ${pageUrl}`);
    
    // Extraire les informations de streaming
    const streamingInfo = await extractStreamingFromIframe(pageUrl);
    
    // Stocker les informations
    return await storeStreamingReference(streamingInfo, contentId, options, env);
  } catch (error) {
    console.error(`Erreur lors de l'extraction du streaming pour ${contentId}:`, error);
    throw error;
  }
}

// Exporter les fonctions publiques
// Exécuter main si le script est exécuté directement
if (require.main === module) {
  main().then(() => {
    console.log('✅ Extraction terminée avec succès');
  }).catch(error => {
    console.error('❌ Erreur lors de l\'extraction:', error);
    process.exit(1);
  });
}

module.exports = {
  extractAndStoreStreamingUrl,
  extractStreamingFromIframe,
  storeStreamingReference,
  detectSource,
  STREAMING_SOURCES
};
