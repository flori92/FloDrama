/**
 * FloDrama Media Gateway - Version 2.0
 * Adaptation pour une meilleure extraction des sources de streaming
 * Développé le 2025-05-12
 * 
 * Ce worker sert de proxy intelligent entre le client FloDrama et
 * les diverses sources de streaming.
 */

// Types de médias supportés
const MEDIA_TYPES = {
  POSTER: 'poster',
  BACKDROP: 'backdrop',
  THUMBNAIL: 'thumbnail'
};

// Sources de streaming supportées
const STREAMING_SOURCES = {
  DRAMACOOL: 'dramacool',
  VIEWASIAN: 'viewasian',
  VOIRDRAMA: 'voirdrama',
  VOIRANIME: 'voiranime',
  VOSTFREE: 'vostfree',
  KISSASIAN: 'kissasian',
  MYASIANTV: 'myasiantv',
  STREAMINGDIVX: 'streamingdivx',
  FILMAPIK: 'filmapik',
  BOLLYSTREAM: 'bollystream',
  FILMCOMPLET: 'filmcomplet',
  BOLLYPLAY: 'bollyplay',
  HINDILINKS4U: 'hindilinks4u',
  GOGOPLAY: 'gogoplay',
  NEKOSAMA: 'nekosama'
};

// Images par défaut pour les fallbacks
const DEFAULT_IMAGES = {
  [MEDIA_TYPES.POSTER]: 'https://via.placeholder.com/300x450?text=FloDrama',
  [MEDIA_TYPES.BACKDROP]: 'https://via.placeholder.com/1280x720?text=FloDrama',
  [MEDIA_TYPES.THUMBNAIL]: 'https://via.placeholder.com/200x120?text=FloDrama'
};

// Configuration des sources avec leurs domaines valides et les sélecteurs
// Ces valeurs sont basées sur l'analyse automatique des sites
const SOURCE_CONFIG = {
  [STREAMING_SOURCES.DRAMACOOL]: {
    domains: ['dramacool.sr', 'dramacool.com.tr', 'dramacool9.io', 'dramacool.cr', 'dramacool.sk'],
    playerSelectors: ['.video-light', '#chapter-video-frame', '#player', '.watch-drama', '.video-content'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 12, // en heures
    referer: 'https://dramacool.com.tr/'
  },
  [STREAMING_SOURCES.VOIRDRAMA]: {
    domains: ['voirdrama.org', 'voirdrama.cc', 'voirdrama.tv', 'voirdrama.info'],
    playerSelectors: ['.c-selectpicker', '.selectpicker', '.entry-header', '.video-light', '#chapter-video-frame'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 8,
    referer: 'https://voirdrama.org/'
  },
  [STREAMING_SOURCES.VOIRANIME]: {
    domains: ['v6.voiranime.com', 'voiranime.com', 'voiranime.tv', 'voiranime.cc', '5.voiranime.com'],
    playerSelectors: ['.c-selectpicker', '.selectpicker', '.select-view', '.video-light', '#chapter-video-frame'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 8,
    referer: 'https://v6.voiranime.com/'
  },
  [STREAMING_SOURCES.VOSTFREE]: {
    domains: ['vostfree.cx', 'vostfree.tv', 'vostfree.ws', 'vostfree.io', 'vostfree.in'],
    playerSelectors: ['#target', '#sales-banner', '.video-light', '#chapter-video-frame'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 8,
    referer: 'https://vostfree.cx/'
  },
  [STREAMING_SOURCES.STREAMINGDIVX]: {
    domains: ['streaming-films.net', 'streamingdivx.co', 'streaming-films.cc', 'streaming-divx.com'],
    playerSelectors: ['.film-list', '.film-item', '.player-area', '.video-player', '#player'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 12,
    referer: 'https://streaming-films.net/'
  },
  [STREAMING_SOURCES.FILMCOMPLET]: {
    domains: ['www.film-complet.cc', 'film-complet.tv', 'films-complet.com', 'film-complet.co'],
    playerSelectors: ['.movies-list', '.ml-item', '.player-area', '.video-player', '#player'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 12,
    referer: 'https://www.film-complet.cc/'
  },
  [STREAMING_SOURCES.FILMAPIK]: {
    domains: ['filmapik.bio', 'filmapik.tv', 'filmapik.cc', 'filmapik.cloud'],
    playerSelectors: ['.videoplay', '.player-area', '#player', '.video-content'], 
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 8,
    referer: 'https://filmapik.bio/'
  },
  [STREAMING_SOURCES.BOLLYSTREAM]: {
    domains: ['bollystream.eu', 'bollystream.cc', 'bollystream.tv', 'bollystream.to'],
    playerSelectors: ['.player-embed', '.bollywood-player', '#player-frame', '.video-container'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 10,
    referer: 'https://bollystream.eu/'
  },
  [STREAMING_SOURCES.BOLLYPLAY]: {
    domains: ['bollyplay.app', 'bollyplay.tv', 'bollyplay.cc', 'bollyplay.film'],
    playerSelectors: ['.movies-list', '.ml-item', '.player-area', '.video-player', '#player'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 12,
    referer: 'https://bollyplay.app/'
  },
  [STREAMING_SOURCES.HINDILINKS4U]: {
    domains: ['hindilinks4u.skin', 'hindilinks4u.to', 'hindilinks4u.co', 'hindilinks4u.app'],
    playerSelectors: ['.film-list', '.film-item', '.film-player', '.video-player', '#player'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 12,
    referer: 'https://hindilinks4u.skin/'
  },
  [STREAMING_SOURCES.KISSASIAN]: {
    domains: ['kissasian.com.lv', 'kissasian.sh', 'kissasian.io', 'kissasian.cx'],
    playerSelectors: ['#centerDivVideo', '#divContentVideo', '.video-content'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 8,
    referer: 'https://kissasian.com.lv/'
  },
  [STREAMING_SOURCES.VIEWASIAN]: {
    domains: ['viewasian.lol', 'viewasian.tv', 'viewasian.cc'],
    playerSelectors: ['.video-content', '.play-video'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 6,
    referer: 'https://viewasian.lol/'
  },
  [STREAMING_SOURCES.GOGOPLAY]: {
    domains: ['gogoplay.io', 'gogoplay1.com', 'gogoplay4.com'],
    playerSelectors: ['.anime_video_body', '.anime_muti_link'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 12,
    referer: 'https://gogoplay.io/'
  },
  [STREAMING_SOURCES.NEKOSAMA]: {
    domains: ['neko-sama.fr', 'neko-sama.io', 'neko-sama.org'],
    playerSelectors: ['#blocEntier', '#list_catalog', '.video-player'],
    videoSelectors: ['video', 'iframe', '.jwplayer', '.plyr', '.video-js'],
    redirectHandling: true,
    needsCloudflareBypass: true,
    expiryTime: 12,
    referer: 'https://neko-sama.fr/'
  }
};

// Configuration des nouveaux extracteurs de streaming par type de source
const STREAMING_EXTRACTORS = {
  // Utilise les patterns et sélecteurs trouvés dans notre analyse
  default: async function(pageUrl, page) {
    // Extraction par méthode standard
    return await extractStreamingByNetworkInterception(pageUrl, page);
  },
  
  [STREAMING_SOURCES.DRAMACOOL]: async function(pageUrl, page) {
    // Dramacool a besoin de quelques actions spécifiques
    await page.waitForSelector('.video-light, .watch-drama, #player', { timeout: 10000 });
    
    // Cliquer pour activer le lecteur
    try {
      await page.click('.video-light, .watch-drama, #player');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log("Impossible de cliquer sur le lecteur:", e);
    }
    
    // Attendre l'apparition des iframes
    await page.waitForTimeout(3000);
    
    // Vérifier les iframes
    return await extractStreamingByNetworkInterception(pageUrl, page);
  },
  
  [STREAMING_SOURCES.VOIRDRAMA]: async function(pageUrl, page) {
    // VoirDrama utilise souvent des dropdowns pour sélectionner la source
    try {
      // Attendre et cliquer sur les sélecteurs de source
      for (const selector of ['.c-selectpicker', '.selectpicker', '.select-view']) {
        try {
          const hasSelector = await page.evaluate((sel) => !!document.querySelector(sel), selector);
          if (hasSelector) {
            await page.click(selector);
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          console.log(`Impossible de cliquer sur le sélecteur ${selector}:`, e);
        }
      }
    } catch (e) {
      console.log("Erreur lors de la sélection de source:", e);
    }
    
    return await extractStreamingByNetworkInterception(pageUrl, page);
  },
  
  [STREAMING_SOURCES.FILMAPIK]: async function(pageUrl, page) {
    // FilmApik nécessite une approche spécifique pour l'extraction
    await page.waitForSelector('.videoplay, .player-area, #player', { timeout: 10000 });
    
    // Attendre le chargement complet du player
    await page.waitForTimeout(2000);
    
    // Recherche dans les scripts pour les URLs de streaming
    const scriptData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        if (script.textContent && script.textContent.includes('sources:')) {
          return script.textContent;
        }
      }
      return null;
    });
    
    if (scriptData) {
      // Extraction des URLs de streaming depuis le script
      const urlMatches = scriptData.match(/sources:\s*\[\s*{\s*file:\s*['"]([^'"]+)['"]/i);
      if (urlMatches && urlMatches[1]) {
        return { streamingUrl: urlMatches[1], headers: {} };
      }
    }
    
    // Méthode par défaut si l'extraction spécifique échoue
    return await extractStreamingByNetworkInterception(pageUrl, page);
  },
  
  [STREAMING_SOURCES.BOLLYSTREAM]: async function(pageUrl, page) {
    // BollyStream requiert une analyse spécifique
    await page.waitForSelector('.player-embed, .bollywood-player, #player-frame', { timeout: 10000 });
    
    // Observer le trafic réseau pour capturer les requêtes m3u8/mp4
    const streamingUrl = await extractStreamingByNetworkInterception(pageUrl, page);
    if (streamingUrl) return streamingUrl;
    
    // Méthode alternative: extraction depuis les iframes
    const iframeSources = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      return iframes.map(iframe => iframe.src).filter(src => src && (
        src.includes('.mp4') || 
        src.includes('.m3u8') || 
        src.includes('embed') || 
        src.includes('player')
      ));
    });
    
    // Traitement des URLs d'iframe pour extraction
    if (iframeSources && iframeSources.length > 0) {
      // Analyser la première iframe
      await page.goto(iframeSources[0], { waitUntil: 'networkidle2' });
      return await extractStreamingByNetworkInterception(iframeSources[0], page);
    }
    
    return null;
  },
  
  [STREAMING_SOURCES.STREAMINGDIVX]: async function(pageUrl, page) {
    // StreamingDivx utilise souvent des lecteurs intégrés
    await page.waitForSelector('.film-list, .film-item, .player-area, .video-player, #player', { timeout: 10000 });
    
    // Attente du chargement du lecteur
    await page.waitForTimeout(3000);
    
    // Vérifier les sources vidéo directes
    const videoSources = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video source'));
      if (videos.length > 0) {
        return videos.map(v => v.src).filter(s => s);
      }
      return null;
    });
    
    if (videoSources && videoSources.length > 0) {
      return { streamingUrl: videoSources[0], headers: {} };
    }
    
    // Analyse des iframes pour trouver les lecteurs
    const iframeSources = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe'))
        .map(iframe => iframe.src)
        .filter(src => src);
    });
    
    if (iframeSources && iframeSources.length > 0) {
      await page.goto(iframeSources[0], { waitUntil: 'networkidle2' });
      return await extractStreamingByNetworkInterception(iframeSources[0], page);
    }
    
    return await extractStreamingByNetworkInterception(pageUrl, page);
  },
  
  [STREAMING_SOURCES.FILMCOMPLET]: async function(pageUrl, page) {
    // FilmComplet a une structure similaire à VostFree
    await page.waitForSelector('.movies-list, .ml-item, .player-area, .video-player, #player', { timeout: 10000 });
    
    // Recherche de lecteurs spécifiques
    const playerButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.player-button, .btn-play, .play-btn'));
      return buttons.map(btn => {
        return { id: btn.id, class: btn.className, text: btn.textContent };
      });
    });
    
    // Cliquer sur les boutons du lecteur si présents
    if (playerButtons && playerButtons.length > 0) {
      for (const btn of playerButtons) {
        try {
          if (btn.id) {
            await page.click(`#${btn.id}`);
          } else if (btn.class) {
            await page.click(`.${btn.class.split(' ')[0]}`);
          }
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log(`Erreur lors du clic sur le bouton: ${e.message}`);
        }
      }
    }
    
    // Capturer les URLs via le trafic réseau
    return await extractStreamingByNetworkInterception(pageUrl, page);
  }
};

/**
 * Extrait une URL de streaming en interceptant le trafic réseau
 * Méthode générique utilisée par défaut
 */
async function extractStreamingByNetworkInterception(pageUrl, page) {
  // Garder une trace des URLs de streaming détectées
  const streamingUrls = [];
  
  // Intercepter le trafic réseau pour capturer les URLs de streaming
  await Promise.race([
    page.waitForRequest(request => {
      const url = request.url();
      
      // Vérifier si l'URL correspond à un format de streaming
      const isStreamingUrl = url.includes('.m3u8') || 
                             url.includes('.mp4') || 
                             url.includes('/master.') ||
                             url.includes('/hls/') ||
                             url.includes('/manifest') ||
                             url.includes('/playlist');
      
      if (isStreamingUrl) {
        streamingUrls.push(url);
        return true;
      }
      return false;
    }, { timeout: 10000 }).catch(() => {}),
    
    // Si aucune requête n'est détectée, attendre un peu
    page.waitForTimeout(10000)
  ]);
  
  // Si aucune URL n'est détectée via les requêtes, chercher dans le HTML/JS
  if (streamingUrls.length === 0) {
    // Chercher des URLs de streaming dans la page
    const pageUrls = await page.evaluate(() => {
      // Chercher dans les éléments vidéo
      const videoSources = Array.from(document.querySelectorAll('video source'))
        .map(source => source.src)
        .filter(src => src && (src.includes('.mp4') || src.includes('.m3u8')));
      
      if (videoSources.length > 0) return videoSources;
      
      // Chercher dans les iframes
      const iframes = Array.from(document.querySelectorAll('iframe'))
        .map(iframe => iframe.src)
        .filter(src => src);
      
      // Chercher dans les scripts
      const scripts = Array.from(document.querySelectorAll('script'));
      const scriptUrls = [];
      
      for (const script of scripts) {
        if (!script.textContent) continue;
        
        // Expressions régulières pour trouver des URLs de streaming
        const patterns = [
          /file["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4))["']/i,
          /source["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4))["']/i,
          /src["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4))["']/i,
          /url["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4))["']/i
        ];
        
        for (const pattern of patterns) {
          const match = script.textContent.match(pattern);
          if (match && match[1]) {
            scriptUrls.push(match[1]);
          }
        }
      }
      
      return [...videoSources, ...iframes, ...scriptUrls];
    });
    
    if (pageUrls && pageUrls.length > 0) {
      streamingUrls.push(...pageUrls);
    }
  }
  
  // Explorer les iframes si aucune URL n'est trouvée
  if (streamingUrls.length === 0) {
    const iframeSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe'))
        .map(iframe => iframe.src)
        .filter(src => src);
    });
    
    for (const iframeSrc of iframeSrcs) {
      try {
        // Ouvrir l'iframe dans un nouvel onglet
        const iframePage = await page.context().newPage();
        await iframePage.goto(iframeSrc, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        // Extraire les URLs de streaming de l'iframe
        const streamingUrl = await extractStreamingByNetworkInterception(iframeSrc, iframePage);
        
        await iframePage.close();
        
        if (streamingUrl) {
          return streamingUrl;
        }
      } catch (e) {
        console.log(`Erreur lors de l'extraction depuis l'iframe ${iframeSrc}:`, e);
      }
    }
  }
  
  // Retourner la première URL de streaming trouvée
  if (streamingUrls.length > 0) {
    return { streamingUrl: streamingUrls[0], headers: {} };
  }
  
  return null;
}

// Gestionnaire principal pour les requêtes
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Gérer les requêtes OPTIONS pour CORS
  if (request.method === 'OPTIONS') {
    return handleCorsOptions();
  }
  
  // Endpoint pour vérifier le statut du service
  if (path === '/status') {
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'FloDrama Media Gateway is running',
      version: '2.0',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Endpoint pour l'extraction à la demande depuis une URL de lecteur
  if (path.startsWith('/extract/')) {
    const encodedUrl = path.replace('/extract/', '');
    if (!encodedUrl) {
      return errorResponse('URL de lecture manquante', 400);
    }
    
    try {
      const sourceUrl = decodeURIComponent(encodedUrl);
      return await handleDirectExtraction(sourceUrl, env);
    } catch (error) {
      return errorResponse(`Erreur de décodage d'URL: ${error.message}`, 400);
    }
  }
  
  // Endpoint pour servir des flux de streaming via notre passerelle
  if (path.startsWith('/stream/')) {
    const contentId = path.replace('/stream/', '');
    if (!contentId) {
      return errorResponse('ID de contenu manquant', 400);
    }
    
    return await handleStreamingRequest(contentId, env);
  }
  
  // Endpoint pour servir des images
  if (path.startsWith('/image/')) {
    const imageId = path.replace('/image/', '');
    if (!imageId) {
      return errorResponse('ID d\'image manquant', 400);
    }
    
    return await handleImageRequest(imageId, request, env);
  }
  
  // Requête non reconnue
  return errorResponse('Endpoint non reconnu', 404);
}

/**
 * Gère les requêtes de streaming et procède à l'extraction si nécessaire
 */
async function handleStreamingRequest(contentId, env) {
  try {
    // Décomposer l'ID du contenu pour obtenir la source et l'identifiant
    const [source, id] = contentId.split('_');
    
    if (!source || !id || !Object.values(STREAMING_SOURCES).includes(source)) {
      return errorResponse('ID de contenu invalide', 400);
    }
    
    // Vérifier si nous avons déjà l'URL de streaming en cache
    let streamingInfo = null;
    if (env.FLODRAMA_METADATA) {
      const cachedInfo = await env.FLODRAMA_METADATA.get(`stream:${contentId}`, { type: 'json' });
      if (cachedInfo && !isStreamExpired(cachedInfo)) {
        streamingInfo = cachedInfo;
      }
    }
    
    // Si nous n'avons pas l'URL en cache ou si elle est expirée, 
    // nous devrions la régénérer via scraping
    if (!streamingInfo) {
      // Récupérer l'URL source
      let sourceUrl = null;
      if (env.FLODRAMA_METADATA) {
        const sourceInfo = await env.FLODRAMA_METADATA.get(`source:${contentId}`, { type: 'json' });
        if (sourceInfo && sourceInfo.page_url) {
          sourceUrl = sourceInfo.page_url;
        }
      }
      
      if (!sourceUrl) {
        return errorResponse('Source introuvable pour cet ID de contenu', 404);
      }
      
      // Dans un environnement réel, ici on déclencherait l'extraction
      // via un service de scraping (Puppeteer/Playwright)
      
      // Simulation d'une réponse d'extraction réussie
      streamingInfo = {
        streaming_url: "https://example.com/simulation/stream.m3u8", // Simulation
        source: source,
        page_url: sourceUrl,
        content_id: contentId,
        extracted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString() // 6 heures
      };
      
      // Sauvegarder les nouvelles informations en cache
      if (env.FLODRAMA_METADATA) {
        await env.FLODRAMA_METADATA.put(
          `stream:${contentId}`,
          JSON.stringify(streamingInfo),
          { expirationTtl: 21600 } // 6 heures
        );
      }
    }
    
    // Générer les en-têtes pour la requête de streaming
    const streamingHeaders = generateStreamingHeaders(source);
    
    // Renvoyer l'URL de streaming et les en-têtes nécessaires
    return new Response(JSON.stringify({
      status: 'success',
      streaming_url: streamingInfo.streaming_url,
      source: source,
      headers: streamingHeaders,
      content_id: contentId,
      expires_at: streamingInfo.expires_at
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'private, max-age=3600' // Cache client d'1 heure
      }
    });
  } catch (error) {
    console.error(`Erreur lors de la gestion du streaming pour ${contentId}:`, error);
    return errorResponse(`Erreur de streaming: ${error.message}`, 500);
  }
}

/**
 * Extrait une URL de streaming directement à partir d'une URL de page
 */
async function handleDirectExtraction(sourceUrl, env) {
  try {
    // Déterminer la source à partir de l'URL
    const source = detectSourceFromUrl(sourceUrl);
    
    if (!source) {
      return errorResponse('Source non reconnue ou non supportée', 400);
    }
    
    // Dans un environnement réel, ici on déclencherait l'extraction à la demande
    // via un service de scraping (avec Puppeteer/Playwright)
    
    // Simulation d'une réponse d'extraction réussie
    const contentId = `${source}_${Date.now().toString(16).slice(-8)}`;
    const streamingInfo = {
      streaming_url: "https://example.com/simulation/direct_extract.m3u8", // Simulation
      source: source,
      page_url: sourceUrl,
      content_id: contentId,
      extracted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString() // 6 heures
    };
    
    // Dans un environnement réel, sauvegarder en cache
    if (env.FLODRAMA_METADATA) {
      // Sauvegarder les informations de streaming
      await env.FLODRAMA_METADATA.put(
        `stream:${contentId}`,
        JSON.stringify(streamingInfo),
        { expirationTtl: 21600 } // 6 heures
      );
      
      // Sauvegarder l'URL source pour référence future
      await env.FLODRAMA_METADATA.put(
        `source:${contentId}`,
        JSON.stringify({
          page_url: sourceUrl,
          source: source
        }),
        { expirationTtl: 2592000 } // 30 jours
      );
    }
    
    // Générer les en-têtes pour la requête de streaming
    const streamingHeaders = generateStreamingHeaders(source);
    
    // Renvoyer l'URL de streaming et les en-têtes nécessaires
    return new Response(JSON.stringify({
      status: 'success',
      streaming_url: streamingInfo.streaming_url,
      source: source,
      headers: streamingHeaders,
      content_id: contentId,
      expires_at: streamingInfo.expires_at
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache' // Ne pas mettre en cache l'extraction directe
      }
    });
  } catch (error) {
    console.error(`Erreur lors de l'extraction directe pour ${sourceUrl}:`, error);
    return errorResponse(`Erreur d'extraction: ${error.message}`, 500);
  }
}

/**
 * Détecte la source de streaming à partir d'une URL
 */
function detectSourceFromUrl(url) {
  const hostname = new URL(url).hostname;
  
  for (const [source, config] of Object.entries(SOURCE_CONFIG)) {
    if (config.domains.some(domain => hostname.includes(domain))) {
      return source;
    }
  }
  
  return null;
}

/**
 * Vérifie si une URL de streaming est expirée
 */
function isStreamExpired(streamingInfo) {
  if (!streamingInfo.expires_at) {
    return false;
  }
  
  const expiryTime = new Date(streamingInfo.expires_at).getTime();
  const currentTime = new Date().getTime();
  
  return currentTime > expiryTime;
}

/**
 * Génère les en-têtes nécessaires pour accéder à une source de streaming spécifique
 */
function generateStreamingHeaders(source) {
  // Configuration des en-têtes selon la source
  const sourceConfig = SOURCE_CONFIG[source];
  
  if (!sourceConfig) {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };
  }
  
  return {
    'Referer': sourceConfig.referer || `https://${sourceConfig.domains[0]}/`,
    'Origin': sourceConfig.referer ? sourceConfig.referer.replace(/\/$/, '') : `https://${sourceConfig.domains[0]}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  };
}

/**
 * Gère les requêtes CORS OPTIONS
 */
function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Renvoie une réponse d'erreur formatée
 */
function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    status: 'error',
    message: message
  }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Exporter le gestionnaire de requêtes pour Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env);
  }
};
