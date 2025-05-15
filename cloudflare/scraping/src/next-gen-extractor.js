/**
 * Extracteur de streaming nouvelle génération pour FloDrama
 * Contourne les protections anti-bot avancées et utilise une rotation de domaines
 * Développé le 2025-05-12
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const { setTimeout } = require('timers/promises');
const sourcesConfig = require('./sources-config');

// Configuration avancée de puppeteer avec plugins anti-détection
puppeteer.use(StealthPlugin());
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: '2captcha', token: process.env.CAPTCHA_TOKEN || '' },
    visualFeedback: true
  })
);

// Délais aléatoires pour simuler un comportement humain
const DELAYS = {
  MIN_NAVIGATION: 2000,  // 2 secondes minimum
  MAX_NAVIGATION: 7000,  // 7 secondes maximum
  MIN_INTERACTION: 500,  // 0.5 seconde minimum
  MAX_INTERACTION: 1500, // 1.5 seconde maximum
  CAPTCHA_WAIT: 10000    // 10 secondes pour résoudre captcha
};

// Cache des domaines fonctionnels
const domainCache = {
  successDomains: {},
  lastSuccessTime: {}
};

/**
 * Extrait l'URL de streaming d'une page avec rotation de domaines
 * @param {string} pageUrl - URL de la page contenant la vidéo
 * @param {string} contentId - Identifiant du contenu
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractStreamingWithDomainRotation(pageUrl, contentId = null) {
  console.log(`🚀 Lancement de l'extraction nouvelle génération pour: ${pageUrl}`);
  
  // Détecter la source
  const sourceName = detectSource(pageUrl);
  console.log(`📋 Source détectée: ${sourceName}`);
  
  // Vérifier si la source est configurée
  if (!sourcesConfig[sourceName]) {
    throw new Error(`Source non configurée: ${sourceName}`);
  }
  
  // Récupérer la configuration avec domaines alternatifs
  const sourceConfig = sourcesConfig[sourceName];
  
  // Générer un contentId si non fourni
  if (!contentId) {
    contentId = `${sourceName}_${uuidv4().substring(0, 8)}`;
    console.log(`🆔 Génération d'ID de contenu: ${contentId}`);
  }
  
  // Liste des domaines à essayer (principal + alternatifs)
  let domains = [sourceConfig.baseUrl, ...(sourceConfig.alternativeDomains || [])].map(domain => {
    try {
      return new URL(domain).hostname;
    } catch (e) {
      return domain;
    }
  });
  
  // Prioriser les domaines qui ont réussi précédemment
  if (domainCache.successDomains[sourceName]) {
    const cachedDomain = domainCache.successDomains[sourceName];
    // Vérifier si le cache est encore frais (moins de 6 heures)
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    if (domainCache.lastSuccessTime[sourceName] > sixHoursAgo) {
      // Mettre le domaine qui a fonctionné en premier
      domains = [cachedDomain, ...domains.filter(d => d !== cachedDomain)];
      console.log(`📌 Priorisation du domaine précédemment fonctionnel: ${cachedDomain}`);
    }
  }
  
  console.log(`🔄 Rotation sur ${domains.length} domaines: ${domains.join(', ')}`);
  
  // Essayer chaque domaine jusqu'à ce qu'un fonctionne
  let lastError = null;
  for (const domain of domains) {
    try {
      // Remplacer le domaine dans l'URL d'origine
      const originalUrlObj = new URL(pageUrl);
      const newUrl = pageUrl.replace(originalUrlObj.hostname, domain);
      console.log(`🌐 Essai avec le domaine: ${domain}`);
      
      // Extraire avec le nouveau domaine
      const streamingInfo = await extractStreamingAdvanced(newUrl, sourceConfig);
      
      if (streamingInfo && streamingInfo.streaming_url) {
        // Ajouter des métadonnées
        streamingInfo.content_id = contentId;
        streamingInfo.source = sourceName;
        streamingInfo.page_url = pageUrl; // Garder l'URL originale comme référence
        streamingInfo.actual_url = newUrl; // Stocker l'URL réellement utilisée
        streamingInfo.extracted_at = new Date().toISOString();
        
        // Calculer l'expiration
        const expiryHours = sourceConfig.expiryHours || 24;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + expiryHours);
        streamingInfo.expires_at = expiryDate.toISOString();
        
        // Sauvegarder dans le système de stockage local
        saveStreamingInfo(contentId, streamingInfo);
        
        // Enregistrer le domaine qui a fonctionné pour référence future
        recordSuccessfulDomain(sourceName, domain);
        
        console.log(`✅ URL de streaming extraite avec succès via: ${domain}`);
        return streamingInfo;
      }
    } catch (error) {
      console.warn(`⚠️ Échec avec le domaine ${domain}: ${error.message}`);
      lastError = error;
      // Attendre avant d'essayer le domaine suivant (entre 3 et 7 secondes)
      await setTimeout(3000 + Math.random() * 4000);
    }
  }
  
  // Si tous les domaines ont échoué
  console.error(`❌ Tous les domaines ont échoué pour ${pageUrl}`);
  throw lastError || new Error('Échec de l\'extraction sur tous les domaines');
}

/**
 * Extrait l'URL de streaming avec méthodes avancées anti-détection
 * @param {string} pageUrl - URL de la page
 * @param {object} sourceConfig - Configuration de la source
 * @returns {Promise<object>} - Informations de streaming
 */
async function extractStreamingAdvanced(pageUrl, sourceConfig) {
  console.log(`🔍 Extraction avancée depuis: ${pageUrl}`);
  
  // Générer un agent utilisateur aléatoire mais réaliste
  const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();
  console.log(`💻 Agent utilisateur: ${userAgent}`);
  
  // Configurer le navigateur avec camouflage avancé
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      `--user-agent=${userAgent}`,
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });
  
  let page = null;
  try {
    page = await browser.newPage();
    
    // Configurer le navigateur pour ressembler à un vrai utilisateur
    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': sourceConfig.headers?.['Referer'] || 'https://www.google.com/',
    });
    
    // Émuler WebRTC pour paraître plus authentique
    await page.evaluateOnNewDocument(() => {
      const webRtcMock = {
        localDescription: { sdp: 'v=0\r\no=- 7859371731 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\n' },
        currentLocalDescription: { sdp: 'v=0\r\no=- 7859371731 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\n' },
        remoteDescription: { sdp: 'v=0\r\no=- 7859371731 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\n' },
        currentRemoteDescription: { sdp: 'v=0\r\no=- 7859371731 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\n' },
        signalingState: 'stable',
        iceGatheringState: 'complete',
        iceConnectionState: 'connected',
        connectionState: 'connected'
      };
      
      // Remplacer l'original par notre mock
      window.RTCPeerConnection = class extends EventTarget {
        constructor() {
          super();
          Object.assign(this, webRtcMock);
        }
      };
    });
    
    // Intercepter les requêtes pour détecter les sources vidéo et esquiver la détection
    const videoUrls = [];
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      // Bloquer les analytics et trackers courants pour éviter la détection
      const blockedResources = ['google-analytics', 'googlesyndication', 'doubleclick', 'adservice'];
      const url = request.url();
      
      if (blockedResources.some(resource => url.includes(resource))) {
        request.abort();
        return;
      }
      
      // Capturer les URLs vidéo pour l'extraction
      if (url.includes('.mp4') || url.includes('.m3u8') || url.includes('/hls/')) {
        videoUrls.push(url);
      }
      
      // Modifier les en-têtes pour se faire passer pour un navigateur réel
      const headers = request.headers();
      headers['Accept-Language'] = 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7';
      
      request.continue({ headers });
    });
    
    // Simuler un comportement humain aléatoire avant de naviguer
    await randomDelay(DELAYS.MIN_NAVIGATION, DELAYS.MAX_NAVIGATION);
    
    // Visiter l'URL avec attente spécifique selon la configuration
    console.log(`🚪 Navigation vers ${pageUrl}...`);
    await page.goto(pageUrl, { timeout: 60000 });
    
    // Utiliser les sélecteurs d'attente pour s'assurer que la page est complètement chargée
    if (sourceConfig.selectors?.waitSelector) {
      console.log(`⏳ Attente du sélecteur spécifique: ${sourceConfig.selectors.waitSelector}`);
      try {
        await page.waitForSelector(sourceConfig.selectors.waitSelector, { timeout: 30000 });
      } catch (error) {
        console.warn(`⚠️ Sélecteur d'attente non trouvé: ${sourceConfig.selectors.waitSelector}`);
      }
    } else {
      // Attente générique si pas de sélecteur spécifique
      await page.waitForSelector('body', { timeout: 30000 });
      await randomDelay(3000, 5000);
    }
    
    // Vérifier si un CAPTCHA est présent et essayer de le résoudre
    await handleCaptchaIfPresent(page);
    
    // Simuler des mouvements de souris humains aléatoires pour éviter la détection
    await simulateHumanBehavior(page);
    
    // Chercher l'iframe de vidéo en utilisant les sélecteurs configurés
    console.log(`🔍 Recherche de conteneurs vidéo...`);
    let iframeUrls = [];
    
    if (sourceConfig.selectors?.iframeContainer) {
      try {
        // Attendre que le conteneur d'iframe soit chargé
        await page.waitForSelector(sourceConfig.selectors.iframeContainer, { timeout: 15000 });
        
        // Extraire les URLs d'iframe
        iframeUrls = await page.evaluate((selector) => {
          const container = document.querySelector(selector);
          if (!container) return [];
          
          const iframes = container.querySelectorAll('iframe');
          return Array.from(iframes).map(iframe => iframe.src).filter(src => src);
        }, sourceConfig.selectors.iframeContainer);
      } catch (error) {
        console.warn(`⚠️ Erreur lors de la recherche des iframes: ${error.message}`);
      }
    }
    
    // Si aucune iframe n'est trouvée avec le sélecteur spécifique, chercher dans toute la page
    if (iframeUrls.length === 0) {
      iframeUrls = await page.evaluate(() => {
        const iframes = document.querySelectorAll('iframe');
        return Array.from(iframes)
          .map(iframe => iframe.src)
          .filter(src => src && (src.includes('embed') || src.includes('player') || src.includes('video')));
      });
    }
    
    // Si des URLs vidéo ont été trouvées directement dans les requêtes
    if (videoUrls.length > 0) {
      const qualities = videoUrls.map(detectQuality);
      const { url, quality } = findBestQuality(videoUrls, qualities);
      
      return {
        streaming_url: url,
        quality: quality,
        player_type: url.includes('.m3u8') ? 'hls' : 'mp4',
        referer: pageUrl
      };
    }
    
    // Explorer chaque iframe pour trouver l'URL de streaming
    console.log(`🔗 Iframes trouvées: ${iframeUrls.length}`);
    for (const iframeUrl of iframeUrls) {
      try {
        // Résoudre l'URL complète si relative
        const fullUrl = iframeUrl.startsWith('http') ? iframeUrl : new URL(iframeUrl, pageUrl).href;
        
        // Créer un nouvel onglet pour l'iframe
        const iframePage = await browser.newPage();
        await iframePage.setUserAgent(userAgent);
        
        // Configurer l'interception pour cette page aussi
        const embedVideoUrls = [];
        await iframePage.setRequestInterception(true);
        
        iframePage.on('request', request => {
          const url = request.url();
          if (url.includes('.mp4') || url.includes('.m3u8') || url.includes('/hls/')) {
            embedVideoUrls.push(url);
          }
          request.continue();
        });
        
        // Visiter l'URL de l'iframe
        await iframePage.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Attendre et simuler des interactions humaines
        await randomDelay(2000, 4000);
        await simulateHumanBehavior(iframePage);
        
        // Si des URLs vidéo ont été trouvées dans les requêtes
        if (embedVideoUrls.length > 0) {
          const qualities = embedVideoUrls.map(detectQuality);
          const { url, quality } = findBestQuality(embedVideoUrls, qualities);
          
          await iframePage.close();
          
          return {
            streaming_url: url,
            quality: quality,
            player_type: url.includes('.m3u8') ? 'hls' : 'mp4',
            referer: fullUrl
          };
        }
        
        // Chercher dans le contenu de la page
        const sources = await iframePage.evaluate(() => {
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
        
        // Fermer la page de l'iframe
        await iframePage.close();
        
        if (sources.length > 0) {
          // Privilégier les flux HLS (m3u8) pour leur adaptabilité
          const hlsSources = sources.filter(s => 
            s.url.includes('.m3u8') || 
            s.type.includes('mpegURL') || 
            s.type.includes('hls')
          );
          
          if (hlsSources.length > 0) {
            const bestSource = hlsSources[0]; // Prendre le premier pour simplifier
            return {
              streaming_url: bestSource.url,
              quality: 'auto', // HLS s'adapte à la bande passante
              player_type: 'hls',
              referer: fullUrl
            };
          }
          
          // Sinon, utiliser les sources MP4
          const mp4Sources = sources.filter(s => 
            s.url.includes('.mp4') || 
            s.type.includes('mp4')
          );
          
          if (mp4Sources.length > 0) {
            const bestSource = mp4Sources[0]; // Prendre le premier pour simplifier
            return {
              streaming_url: bestSource.url,
              quality: detectQuality(bestSource.url),
              player_type: 'mp4',
              referer: fullUrl
            };
          }
        }
      } catch (error) {
        console.warn(`⚠️ Échec de l'extraction depuis l'iframe ${iframeUrl}:`, error.message);
      }
    }
    
    throw new Error('Aucune URL de streaming trouvée dans les iframes');
  } catch (error) {
    console.error(`❌ Erreur d'extraction:`, error);
    throw error;
  } finally {
    // Fermeture du navigateur
    if (page) {
      try { await page.close(); } catch (e) { /* Ignorer */ }
    }
    if (browser) {
      try { await browser.close(); } catch (e) { /* Ignorer */ }
    }
  }
}

/**
 * Attente pendant une durée aléatoire entre min et max ms
 * @param {number} min - Durée minimale en ms
 * @param {number} max - Durée maximale en ms
 * @returns {Promise<void>}
 */
async function randomDelay(min, max) {
  const delay = Math.floor(min + Math.random() * (max - min));
  await setTimeout(delay);
  return delay;
}

/**
 * Simule des interactions humaines comme le défilement et les mouvements de souris
 * @param {Page} page - Instance de la page Puppeteer
 */
async function simulateHumanBehavior(page) {
  try {
    // Simuler des mouvements de souris aléatoires
    const viewportSize = await page.viewport();
    const { width, height } = viewportSize;
    
    // Générer 5 à 8 points de passage aléatoires
    const numMoves = 5 + Math.floor(Math.random() * 4);
    let lastX = width / 2;
    let lastY = height / 2;
    
    for (let i = 0; i < numMoves; i++) {
      // Générer un nouveau point dans les limites de la fenêtre
      const newX = 50 + Math.floor(Math.random() * (width - 100));
      const newY = 50 + Math.floor(Math.random() * (height - 100));
      
      // Déplacer la souris avec une courbe naturelle (simuler un humain)
      await page.mouse.move(newX, newY, { steps: 10 + Math.floor(Math.random() * 15) });
      
      // Attendre un peu
      await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
      
      // Parfois, faire un clic
      if (Math.random() < 0.3) {
        await page.mouse.click(newX, newY);
        await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
      }
      
      lastX = newX;
      lastY = newY;
    }
    
    // Simuler défilement aléatoire avec pauses
    const scrollSteps = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < scrollSteps; i++) {
      const scrollAmount = 100 + Math.floor(Math.random() * 400);
      await page.evaluate((amount) => { window.scrollBy(0, amount); }, scrollAmount);
      await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
    }
    
    // Remonter un peu parfois
    if (Math.random() < 0.5) {
      await page.evaluate(() => { window.scrollBy(0, -200); });
      await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la simulation de comportement humain: ${error.message}`);
    // Continuer malgré l'erreur
  }
}

/**
 * Vérifie la présence de CAPTCHA et tente de le résoudre
 * @param {Page} page - Instance de la page Puppeteer
 */
async function handleCaptchaIfPresent(page) {
  try {
    // Détecter les marqueurs de CAPTCHA courants
    const hasCaptcha = await page.evaluate(() => {
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        '.g-recaptcha',
        '#captcha',
        '.captcha',
        '.cf-captcha-container'
      ];
      
      for (const selector of captchaSelectors) {
        if (document.querySelector(selector)) {
          return true;
        }
      }
      
      // Vérifier également les textes qui pourraient indiquer un captcha
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('captcha') || 
             bodyText.includes('robot') || 
             bodyText.includes('vérification') ||
             bodyText.includes('security check') ||
             bodyText.includes('cloudflare');
    });
    
    if (hasCaptcha) {
      console.log(`🤖 CAPTCHA détecté! Tentative de résolution...`);
      
      // Attendre un délai pour permettre au captcha de se charger complètement
      await randomDelay(3000, 5000);
      
      // Utiliser le plugin Recaptcha si disponible
      try {
        await page.solveRecaptchas();
        console.log(`✅ CAPTCHA résolu avec succès!`);
        
        // Attendre que la page se recharge après la résolution du captcha
        await randomDelay(2000, 4000);
        
        // Attendre la navigation complète
        try {
          await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle2' });
        } catch (e) {
          // Ignorer les timeout de navigation
        }
        
        return true;
      } catch (error) {
        console.warn(`⚠️ Échec de la résolution automatique du CAPTCHA: ${error.message}`);
        // Continuer malgré l'échec
      }
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la vérification du CAPTCHA: ${error.message}`);
  }
  
  return false;
}

/**
 * Détecte la qualité d'une URL vidéo en fonction de son contenu
 * @param {string} url - URL de la vidéo
 * @returns {string} - Qualité détectée (4K, 1080p, 720p, etc.)
 */
function detectQuality(url) {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('4k') || lowerUrl.includes('2160p') || lowerUrl.includes('uhd')) {
    return '4K';
  } else if (lowerUrl.includes('1080p') || lowerUrl.includes('fullhd') || lowerUrl.includes('fhd')) {
    return '1080p';
  } else if (lowerUrl.includes('720p') || lowerUrl.includes('hd')) {
    return '720p';
  } else if (lowerUrl.includes('480p') || lowerUrl.includes('sd')) {
    return '480p';
  } else if (lowerUrl.includes('360p')) {
    return '360p';
  } else if (lowerUrl.includes('240p')) {
    return '240p';
  } else if (lowerUrl.includes('.m3u8') || lowerUrl.includes('hls')) {
    return 'auto'; // Les flux HLS s'adaptent automatiquement à la bande passante
  }
  
  return 'unknown';
}

/**
 * Trouve l'URL de meilleure qualité parmi une liste d'URLs
 * @param {string[]} urls - Liste d'URLs
 * @param {string[]} qualities - Liste des qualités correspondantes
 * @returns {object} - URL et qualité de la meilleure source
 */
function findBestQuality(urls, qualities) {
  // Définir l'ordre de préférence des qualités (de la meilleure à la moins bonne)
  const qualityRank = {
    '4K': 6,
    '1080p': 5,
    '720p': 4,
    'auto': 3,  // HLS est considéré comme bon car adaptatif
    '480p': 2,
    '360p': 1,
    '240p': 0,
    'unknown': -1
  };
  
  let bestIndex = 0;
  let bestRank = -1;
  
  // Trouver l'URL avec la meilleure qualité
  for (let i = 0; i < urls.length; i++) {
    const quality = qualities[i];
    const rank = qualityRank[quality] !== undefined ? qualityRank[quality] : -1;
    
    if (rank > bestRank) {
      bestRank = rank;
      bestIndex = i;
    }
  }
  
  return {
    url: urls[bestIndex],
    quality: qualities[bestIndex]
  };
}

/**
 * Détecte la source en fonction de l'URL de la page
 * @param {string} pageUrl - URL de la page
 * @returns {string} - Nom de la source
 */
function detectSource(pageUrl) {
  if (!pageUrl) return null;
  
  try {
    const url = new URL(pageUrl);
    const domain = url.hostname.toLowerCase();
    
    // Parcourir les configurations pour trouver une correspondance
    for (const [sourceName, config] of Object.entries(sourcesConfig)) {
      const baseUrlDomain = new URL(config.baseUrl).hostname.toLowerCase();
      
      // Vérifier le domaine principal
      if (domain.includes(baseUrlDomain) || baseUrlDomain.includes(domain)) {
        return sourceName;
      }
      
      // Vérifier les domaines alternatifs
      if (config.alternativeDomains) {
        for (const altDomain of config.alternativeDomains) {
          if (domain.includes(altDomain) || altDomain.includes(domain)) {
            return sourceName;
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la détection de la source: ${error.message}`);
  }
  
  // Recours à une méthode plus simple si la première échoue
  const lowerUrl = pageUrl.toLowerCase();
  for (const [sourceName, config] of Object.entries(sourcesConfig)) {
    const sourceDomain = config.baseUrl.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    if (lowerUrl.includes(sourceDomain)) {
      return sourceName;
    }
  }
  
  return null;
}

/**
 * Enregistre le domaine qui a fonctionné pour une future utilisation
 * @param {string} sourceName - Nom de la source
 * @param {string} domain - Domaine qui a fonctionné
 */
function recordSuccessfulDomain(sourceName, domain) {
  domainCache.successDomains[sourceName] = domain;
  domainCache.lastSuccessTime[sourceName] = Date.now();
  
  // Sauvegarder le cache dans un fichier pour persistance
  try {
    const cachePath = path.join(__dirname, '../data/domain-cache.json');
    const cacheDir = path.dirname(cachePath);
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    fs.writeFileSync(cachePath, JSON.stringify(domainCache, null, 2));
    console.log(`💾 Cache de domaines enregistré pour ${sourceName}: ${domain}`);
  } catch (error) {
    console.warn(`⚠️ Impossible d'enregistrer le cache de domaines: ${error.message}`);
  }
}

/**
 * Masque partiellement une URL pour la journalisation
 * @param {string} url - URL à masquer
 * @returns {string} - URL masquée
 */
function hideUrlPart(url) {
  if (!url) return 'undefined';
  try {
    const urlObj = new URL(url);
    // Masquer une partie du chemin pour la confidentialité
    const path = urlObj.pathname;
    if (path.length > 15) {
      return `${urlObj.origin}${path.substring(0, 8)}...${path.substring(path.length - 5)}`;
    }
    return `${urlObj.origin}${path}`;
  } catch (e) {
    return url.substring(0, 15) + '...';
  }
}

/**
 * Sauvegarde les informations de streaming dans un fichier JSON
 * @param {string} contentId - Identifiant du contenu
 * @param {object} streamingInfo - Informations de streaming
 */
function saveStreamingInfo(contentId, streamingInfo) {
  try {
    const outputDir = path.join(__dirname, '../extraction-massive');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const sourceName = streamingInfo.source;
    const sourceDir = path.join(outputDir, sourceName);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }
    
    const filePath = path.join(sourceDir, `${contentId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(streamingInfo, null, 2));
    console.log(`💾 Informations de streaming sauvegardées: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde des informations: ${error.message}`);
  }
}

module.exports = {
  extractStreamingWithDomainRotation,
  extractStreamingAdvanced,
  detectSource,
  saveStreamingInfo
};

/**
 * Attente pendant une durée aléatoire entre min et max ms
 * @param {number} min - Durée minimale en ms
 * @param {number} max - Durée maximale en ms
 * @returns {Promise<void>}
 */
async function randomDelay(min, max) {
  const delay = Math.floor(min + Math.random() * (max - min));
  await setTimeout(delay);
  return delay;
}

/**
 * Simule des interactions humaines comme le défilement et les mouvements de souris
 * @param {Page} page - Instance de la page Puppeteer
 */
async function simulateHumanBehavior(page) {
  try {
    // Simuler des mouvements de souris aléatoires
    const viewportSize = await page.viewport();
    const { width, height } = viewportSize;
    
    // Générer 5 à 8 points de passage aléatoires
    const numMoves = 5 + Math.floor(Math.random() * 4);
    let lastX = width / 2;
    let lastY = height / 2;
    
    for (let i = 0; i < numMoves; i++) {
      // Générer un nouveau point dans les limites de la fenêtre
      const newX = 50 + Math.floor(Math.random() * (width - 100));
      const newY = 50 + Math.floor(Math.random() * (height - 100));
      
      // Déplacer la souris avec une courbe naturelle (simuler un humain)
      await page.mouse.move(newX, newY, { steps: 10 + Math.floor(Math.random() * 15) });
      
      // Attendre un peu
      await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
      
      // Parfois, faire un clic
      if (Math.random() < 0.3) {
        await page.mouse.click(newX, newY);
        await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
      }
      
      lastX = newX;
      lastY = newY;
    }
    
    // Simuler défilement aléatoire avec pauses
    const scrollSteps = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < scrollSteps; i++) {
      const scrollAmount = 100 + Math.floor(Math.random() * 400);
      await page.evaluate((amount) => { window.scrollBy(0, amount); }, scrollAmount);
      await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
    }
    
    // Remonter un peu parfois
    if (Math.random() < 0.5) {
      await page.evaluate(() => { window.scrollBy(0, -200); });
      await randomDelay(DELAYS.MIN_INTERACTION, DELAYS.MAX_INTERACTION);
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la simulation de comportement humain: ${error.message}`);
    // Continuer malgré l'erreur
  }
}

/**
 * Vérifie la présence de CAPTCHA et tente de le résoudre
 * @param {Page} page - Instance de la page Puppeteer
 */
async function handleCaptchaIfPresent(page) {
  try {
    // Détecter les marqueurs de CAPTCHA courants
    const hasCaptcha = await page.evaluate(() => {
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        '.g-recaptcha',
        '#captcha',
        '.captcha',
        '.cf-captcha-container'
      ];
      
      for (const selector of captchaSelectors) {
        if (document.querySelector(selector)) {
          return true;
        }
      }
      
      // Vérifier également les textes qui pourraient indiquer un captcha
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('captcha') || 
             bodyText.includes('robot') || 
             bodyText.includes('vérification') ||
             bodyText.includes('security check') ||
             bodyText.includes('cloudflare');
    });
    
    if (hasCaptcha) {
      console.log(`🤖 CAPTCHA détecté! Tentative de résolution...`);
      
      // Attendre un délai pour permettre au captcha de se charger complètement
      await randomDelay(3000, 5000);
      
      // Utiliser le plugin Recaptcha si disponible
      try {
        await page.solveRecaptchas();
        console.log(`✅ CAPTCHA résolu avec succès!`);
        
        // Attendre que la page se recharge après la résolution du captcha
        await randomDelay(2000, 4000);
        
        // Attendre la navigation complète
        try {
          await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle2' });
        } catch (e) {
          // Ignorer les timeout de navigation
        }
        
        return true;
      } catch (error) {
        console.warn(`⚠️ Échec de la résolution automatique du CAPTCHA: ${error.message}`);
        // Continuer malgré l'échec
      }
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la vérification du CAPTCHA: ${error.message}`);
  }
  
  return false;
}

/**
 * Détecte la qualité d'une URL vidéo en fonction de son contenu
 * @param {string} url - URL de la vidéo
 * @returns {string} - Qualité détectée (4K, 1080p, 720p, etc.)
 */
function detectQuality(url) {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('4k') || lowerUrl.includes('2160p') || lowerUrl.includes('uhd')) {
    return '4K';
  } else if (lowerUrl.includes('1080p') || lowerUrl.includes('fullhd') || lowerUrl.includes('fhd')) {
    return '1080p';
  } else if (lowerUrl.includes('720p') || lowerUrl.includes('hd')) {
    return '720p';
  } else if (lowerUrl.includes('480p') || lowerUrl.includes('sd')) {
    return '480p';
  } else if (lowerUrl.includes('360p')) {
    return '360p';
  } else if (lowerUrl.includes('240p')) {
    return '240p';
  } else if (lowerUrl.includes('.m3u8') || lowerUrl.includes('hls')) {
    return 'auto'; // Les flux HLS s'adaptent automatiquement à la bande passante
  }
  
  return 'unknown';
}

/**
 * Trouve l'URL de meilleure qualité parmi une liste d'URLs
 * @param {string[]} urls - Liste d'URLs
 * @param {string[]} qualities - Liste des qualités correspondantes
 * @returns {object} - URL et qualité de la meilleure source
 */
function findBestQuality(urls, qualities) {
  // Définir l'ordre de préférence des qualités (de la meilleure à la moins bonne)
  const qualityRank = {
    '4K': 6,
    '1080p': 5,
    '720p': 4,
    'auto': 3,  // HLS est considéré comme bon car adaptatif
    '480p': 2,
    '360p': 1,
    '240p': 0,
    'unknown': -1
  };
  
  let bestIndex = 0;
  let bestRank = -1;
  
  // Trouver l'URL avec la meilleure qualité
  for (let i = 0; i < urls.length; i++) {
    const quality = qualities[i];
    const rank = qualityRank[quality] !== undefined ? qualityRank[quality] : -1;
    
    if (rank > bestRank) {
      bestRank = rank;
      bestIndex = i;
    }
  }
  
  return {
    url: urls[bestIndex],
    quality: qualities[bestIndex]
  };
}

/**
 * Détecte la source en fonction de l'URL de la page
 * @param {string} pageUrl - URL de la page
 * @returns {string} - Nom de la source
 */
function detectSource(pageUrl) {
  if (!pageUrl) return null;
  
  try {
    const url = new URL(pageUrl);
    const domain = url.hostname.toLowerCase();
    
    // Parcourir les configurations pour trouver une correspondance
    for (const [sourceName, config] of Object.entries(sourcesConfig)) {
      const baseUrlDomain = new URL(config.baseUrl).hostname.toLowerCase();
      
      // Vérifier le domaine principal
      if (domain.includes(baseUrlDomain) || baseUrlDomain.includes(domain)) {
        return sourceName;
      }
      
      // Vérifier les domaines alternatifs
      if (config.alternativeDomains) {
        for (const altDomain of config.alternativeDomains) {
          if (domain.includes(altDomain) || altDomain.includes(domain)) {
            return sourceName;
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la détection de la source: ${error.message}`);
  }
  
  // Recours à une méthode plus simple si la première échoue
  const lowerUrl = pageUrl.toLowerCase();
  for (const [sourceName, config] of Object.entries(sourcesConfig)) {
    const sourceDomain = config.baseUrl.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    if (lowerUrl.includes(sourceDomain)) {
      return sourceName;
    }
  }
  
  return null;
}

/**
 * Enregistre le domaine qui a fonctionné pour une future utilisation
 * @param {string} sourceName - Nom de la source
 * @param {string} domain - Domaine qui a fonctionné
 */
function recordSuccessfulDomain(sourceName, domain) {
  domainCache.successDomains[sourceName] = domain;
  domainCache.lastSuccessTime[sourceName] = Date.now();
  
  // Sauvegarder le cache dans un fichier pour persistance
  try {
    const cachePath = path.join(__dirname, '../data/domain-cache.json');
    const cacheDir = path.dirname(cachePath);
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    fs.writeFileSync(cachePath, JSON.stringify(domainCache, null, 2));
    console.log(`💾 Cache de domaines enregistré pour ${sourceName}: ${domain}`);
  } catch (error) {
    console.warn(`⚠️ Impossible d'enregistrer le cache de domaines: ${error.message}`);
  }
}

/**
 * Masque partiellement une URL pour la journalisation
 * @param {string} url - URL à masquer
 * @returns {string} - URL masquée
 */
function hideUrlPart(url) {
  if (!url) return 'undefined';
  try {
    const urlObj = new URL(url);
    // Masquer une partie du chemin pour la confidentialité
    const path = urlObj.pathname;
    if (path.length > 15) {
      return `${urlObj.origin}${path.substring(0, 8)}...${path.substring(path.length - 5)}`;
    }
    return `${urlObj.origin}${path}`;
  } catch (e) {
    return url.substring(0, 15) + '...';
  }
}

/**
 * Sauvegarde les informations de streaming dans un fichier JSON
 * @param {string} contentId - Identifiant du contenu
 * @param {object} streamingInfo - Informations de streaming
 */
function saveStreamingInfo(contentId, streamingInfo) {
  try {
    const outputDir = path.join(__dirname, '../extraction-massive');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const sourceName = streamingInfo.source;
    const sourceDir = path.join(outputDir, sourceName);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }
    
    const filePath = path.join(sourceDir, `${contentId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(streamingInfo, null, 2));
    console.log(`💾 Informations de streaming sauvegardées: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde des informations: ${error.message}`);
  }
}

module.exports = {
  extractStreamingWithDomainRotation,
  extractStreamingAdvanced,
  detectSource,
  saveStreamingInfo
};
