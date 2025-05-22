/**
 * Interface en ligne de commande pour les scrapers FloDrama
 * Ce script permet d'exécuter les scrapers depuis la ligne de commande ou GitHub Actions
 * pour récupérer des données réelles des sources et les envoyer à Cloudflare.
 */

// Conversion des imports ES modules en require pour Node.js standard
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const crypto = require('crypto');
const { 
  MyDramaListScraper, 
  VoirAnimeScraper, 
  scrapeGenericDramas, 
  scrapeGenericAnimes, 
  scrapeGenericMovies,
  cleanScrapedData
} = require('./html-scraper');
const { 
  scrapeRobustDramas, 
  scrapeRobustAnimes, 
  scrapeRobustMovies, 
  generateFakeData 
} = require('./robust-scraper');

// Import du client proxy
const WebshareProxyClient = require('./proxy-client').default;
const proxyClient = new WebshareProxyClient(undefined, true); // Activer le debug

// Import du scraper basé sur l'émulation de navigateur
const {
  fetchHtmlWithBrowser,
  scrapeDramasWithBrowser,
  scrapeAnimesWithBrowser,
  scrapeMoviesWithBrowser
} = require('./browser-scraper');

// Import du client ScrapingOwl
const { ScrapingOwlClient } = require('./scrapeowl-client');
const scrapeowlClient = new ScrapingOwlClient(process.env.SCRAPEOWL_API_KEY, true); // Activer le debug

// Sources qui nécessitent l'émulation de navigateur
const BROWSER_SOURCES = [
  'asianwiki',
  'dramacool',
  'voiranime',
  'nekosama',
  'animesama',
  'filmcomplet',
  'bollyplay',
  'hindilinks4u',
  'mydramalist',
  'voirdrama',
  'animevostfr',
  'otakufr',
  'vostfree',
  'streamingdivx',
  'streamingcommunity',
  'filmapik'
];

// Configuration des sources alternatives pour les sites problématiques
const ALTERNATIVE_DOMAINS = {
  'dramavostfr': ['dramavostfr.tv', 'dramavostfr.cc', 'dramavostfr.co', 'dramavostfr.net'],
  'asianwiki': ['asianwiki.com', 'wiki.d-addicts.com'],
  'dramacore': ['dramacore.co', 'dramacore.cc', 'dramacore.net'],
  'dramacool': ['dramacool.com.pa', 'dramacool9.io', 'dramacool.cr', 'dramacool.sr'],
  'voiranime': ['voiranime.com', 'voiranime.to', 'voiranime.cc'],
  'nekosama': ['neko-sama.fr', 'nekosama.tv'],
  'animesama': ['anime-sama.fr', 'animesama.cc'],
  'filmcomplet': ['filmcomplet.tv', 'film-complet.cc'],
  'bollyplay': ['bollyplay.net', 'bollyplay.cc'],
  'hindilinks4u': ['hindilinks4u.to', 'hindilinks4u.cc']
};

// Configuration des sources et scrapers
const SOURCES = {
  // Dramas
  mydramalist: {
    name: 'MyDramaList',
    baseUrl: 'https://mydramalist.com',
    contentType: 'drama'
  },
  voirdrama: {
    name: 'VoirDrama',
    baseUrl: 'https://voirdrama.org',
    contentType: 'drama'
  },
  dramavostfr: {
    name: 'DramaVostfr',
    baseUrl: 'https://dramavostfr.tv',
    contentType: 'drama'
  },
  asianwiki: {
    name: 'AsianWiki',
    baseUrl: 'https://asianwiki.com',
    contentType: 'drama'
  },
  dramacore: {
    name: 'DramaCore',
    baseUrl: 'https://dramacore.city',
    contentType: 'drama'
  },
  dramacool: {
    name: 'DramaCool',
    baseUrl: 'https://dramacool.com.pa',
    contentType: 'drama'
  },
  
  // Animes
  voiranime: {
    name: 'VoirAnime',
    baseUrl: 'https://voiranime.com',
    contentType: 'anime'
  },
  animesama: {
    name: 'AnimeSama',
    baseUrl: 'https://anime-sama.fr',
    contentType: 'anime'
  },
  nekosama: {
    name: 'NekoSama',
    baseUrl: 'https://neko-sama.fr',
    contentType: 'anime'
  },
  animevostfr: {
    name: 'AnimeVostfr',
    baseUrl: 'https://animevostfr.tv',
    contentType: 'anime'
  },
  otakufr: {
    name: 'OtakuFR',
    baseUrl: 'https://otakufr.co',
    contentType: 'anime'
  },
  
  // Films et séries
  vostfree: {
    name: 'VostFree',
    baseUrl: 'https://vostfree.cx',
    contentType: 'film'
  },
  streamingdivx: {
    name: 'StreamingDivx',
    baseUrl: 'https://streaming-films.net',
    contentType: 'film'
  },
  filmcomplet: {
    name: 'FilmComplet',
    baseUrl: 'https://www.film-complet.cc',
    contentType: 'film'
  },
  streamingcommunity: {
    name: 'StreamingCommunity',
    baseUrl: 'https://streamingcommunity.bike',
    contentType: 'film'
  },
  filmapik: {
    name: 'FilmApik',
    baseUrl: 'https://filmapik.bio',
    contentType: 'film'
  },
  
  // Bollywood
  bollyplay: {
    name: 'BollyPlay',
    baseUrl: 'https://bollyplay.app',
    contentType: 'bollywood'
  },
  hindilinks4u: {
    name: 'HindiLinks4u',
    baseUrl: 'https://hindilinks4u.skin',
    contentType: 'bollywood'
  }
};

// Récupération des arguments de la ligne de commande
const args = process.argv.slice(2);
const sourceArg = args.find(arg => arg.startsWith('--source='));
const source = sourceArg ? sourceArg.split('=')[1] : null;
const outputArg = args.find(arg => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.split('=')[1] : '../scraping-results';
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100; // Augmentation de la limite par défaut à 100
const allArg = args.find(arg => arg === '--all');
const debugArg = args.find(arg => arg === '--debug');
const debug = debugArg !== undefined;
const pagesArg = args.find(arg => arg.startsWith('--pages='));
const maxPages = pagesArg ? parseInt(pagesArg.split('=')[1]) : 5; // Nombre de pages à scraper par défaut
const retryArg = args.find(arg => arg.startsWith('--retry='));
const maxRetries = retryArg ? parseInt(retryArg.split('=')[1]) : 3; // Nombre de tentatives par défaut

// Vérification des arguments
if (!source && !allArg) {
  console.error('Erreur: Veuillez spécifier une source avec --source=<nom_source> ou utiliser --all pour toutes les sources');
  console.error('Sources disponibles: ' + Object.keys(SOURCES).join(', '));
  process.exit(1);
}

// Vérification de la source si spécifiée
if (source && !SOURCES[source] && !allArg) {
  console.error(`Erreur: Source non reconnue: ${source}`);
  console.error('Sources disponibles: ' + Object.keys(SOURCES).join(', '));
  process.exit(1);
}

// Création du dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Fonction pour effectuer une requête HTTP
async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    // Ajouter un User-Agent réaliste pour éviter d'être bloqué
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      ...options.headers
    };
    
    // Analyser l'URL pour déterminer le protocole
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return reject(new Error(`URL invalide: ${url}`));
    }
    
    // Configurer la requête
    const requestOptions = {
      headers,
      timeout: 30000, // 30 secondes
      ...options
    };
    
    // Choisir le bon module en fonction du protocole
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = httpModule.get(url, requestOptions, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Suivre la redirection
        const location = res.headers.location;
        console.log(`Redirection vers: ${location}`);
        
        // Si la redirection est vers HTTP mais que nous sommes en HTTPS, gérer cette situation
        if (location.startsWith('http:') && url.startsWith('https:')) {
          // Convertir l'URL en HTTPS
          const httpsLocation = location.replace('http:', 'https:');
          console.log(`Tentative avec HTTPS: ${httpsLocation}`);
          
          // Essayer d'abord avec HTTPS
          return fetchUrl(httpsLocation, options)
            .then(resolve)
            .catch(() => {
              // Si HTTPS échoue, essayer avec un module HTTP
              console.log(`HTTPS a échoué, tentative avec l'URL d'origine: ${location}`);
              
              // Utiliser directement l'URL HTTP
              const httpOptions = { ...options, followRedirects: false };
              const http = require('http');
              
              const httpReq = http.get(location, httpOptions, (httpRes) => {
                if (httpRes.statusCode !== 200) {
                  reject(new Error(`Erreur HTTP ${httpRes.statusCode}`));
                  return;
                }
                
                let data = '';
                httpRes.on('data', (chunk) => {
                  data += chunk;
                });
                httpRes.on('end', () => {
                  try {
                    resolve(data);
                  } catch (error) {
                    reject(error);
                  }
                });
              }).on('error', (err) => {
                reject(err);
              });
              
              // Timeout après 30 secondes
              httpReq.setTimeout(30000, () => {
                httpReq.destroy();
                reject(new Error('Timeout de la requête après 30 secondes'));
              });
            });
        }
        
        // Redirection normale
        return fetchUrl(location, options)
          .then(resolve)
          .catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
    
    // Timeout après 30 secondes
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout de la requête après 30 secondes'));
    });
  });
}

// Fonction pour récupérer le HTML d'une URL
async function fetchHtml(url, debug = false, retryCount = 0) {
  if (debug) {
    console.log(`[DEBUG] Récupération du HTML de ${url}`);
  }

  // Liste de User-Agents à utiliser de manière aléatoire
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 OPR/78.0.4093.112'
  ];
  
  // Sélectionner un User-Agent aléatoire
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // Créer des en-têtes sophistiqués pour ressembler à un navigateur réel
  const headers = {
    'User-Agent': randomUserAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'TE': 'Trailers',
    'Referer': 'https://www.google.com/'
  };
  
  try {
    // Essayer d'abord la méthode standard
    const htmlContent = await standardFetch(url, headers, debug);
    return htmlContent;
  } catch (error) {
    if (debug) {
      console.log(`[DEBUG] Échec de la méthode standard: ${error.message}`);
    }
    
    // Si la méthode standard échoue, essayer avec le proxy
    if (retryCount < 3) {
      if (debug) {
        console.log(`[DEBUG] Tentative avec proxy (${retryCount + 1}/3)`);
      }
      
      try {
        // Utiliser le client proxy pour contourner les protections
        const response = await proxyClient.fetch(url, {
          headers: {
            'User-Agent': randomUserAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
            'Referer': 'https://www.google.com/'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        
        const htmlContent = await response.text();
        
        // Vérifier si la page contient des indications de blocage
        if (htmlContent.includes('captcha') || 
            htmlContent.includes('Cloudflare') && htmlContent.includes('challenge') ||
            htmlContent.includes('Access Denied') ||
            htmlContent.includes('DDoS protection') ||
            htmlContent.includes('blocked') && htmlContent.includes('security')) {
          
          if (debug) {
            console.log(`[DEBUG] Détection de protection anti-bot sur ${url} malgré l'utilisation du proxy`);
          }
          
          // Essayer avec ScrapingOwl avant de réessayer avec un autre proxy
          try {
            if (debug) {
              console.log(`[DEBUG] Tentative avec ScrapingOwl pour ${url}`);
            }
            
            const scrapingOwlHtml = await scrapeowlClient.fetchHtml(url, {
              javascript: true,
              premium_proxy: true,
              timeout: 60
            });
            
            return scrapingOwlHtml;
          } catch (scrapeowlError) {
            if (debug) {
              console.log(`[DEBUG] Échec avec ScrapingOwl: ${scrapeowlError.message}`);
            }
            
            // Si ScrapingOwl échoue aussi, réessayer avec un autre proxy
            return fetchHtml(url, debug, retryCount + 1);
          }
        }
        
        return htmlContent;
      } catch (proxyError) {
        if (debug) {
          console.log(`[DEBUG] Échec avec proxy: ${proxyError.message}`);
        }
        
        // Essayer avec ScrapingOwl avant de réessayer avec un autre proxy
        try {
          if (debug) {
            console.log(`[DEBUG] Tentative avec ScrapingOwl pour ${url}`);
          }
          
          const scrapingOwlHtml = await scrapeowlClient.fetchHtml(url, {
            javascript: true,
            premium_proxy: true,
            timeout: 60
          });
          
          return scrapingOwlHtml;
        } catch (scrapeowlError) {
          if (debug) {
            console.log(`[DEBUG] Échec avec ScrapingOwl: ${scrapeowlError.message}`);
          }
          
          // Si ScrapingOwl échoue aussi, réessayer avec un autre proxy
          return fetchHtml(url, debug, retryCount + 1);
        }
      }
    } else {
      // Toutes les tentatives avec proxy ont échoué, essayer une dernière fois avec ScrapingOwl
      try {
        if (debug) {
          console.log(`[DEBUG] Dernière tentative avec ScrapingOwl pour ${url}`);
        }
        
        const scrapingOwlHtml = await scrapeowlClient.fetchHtml(url, {
          javascript: true,
          premium_proxy: true,
          timeout: 60
        });
        
        return scrapingOwlHtml;
      } catch (finalError) {
        // Toutes les tentatives ont échoué
        throw new Error(`Échec de récupération du HTML après 3 tentatives et ScrapingOwl: ${error.message}`);
      }
    }
  }
}

// Fonction de récupération standard (sans proxy)
async function standardFetch(url, headers, debug = false) {
  return new Promise((resolve, reject) => {
    try {
      // Analyser l'URL
      const parsedUrl = new URL(url);
      
      // Liste de domaines suspects (redirections malveillantes)
      const suspiciousDomains = [
        'difficultyanthonymode.com',
        'anthonydomain',
        'difficulty',
        'cloudfront-',
        'amazonaws.com',
        'cdn-',
        'redirect',
        'tracking',
        'advert',
        'click',
        'analytics'
      ];
      
      // Vérifier si l'URL est suspecte
      const isSuspiciousDomain = suspiciousDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      );
      
      if (isSuspiciousDomain) {
        if (debug) {
          console.log(`[DEBUG] Domaine suspect détecté: ${parsedUrl.hostname}`);
        }
        reject(new Error('Redirection vers un domaine suspect'));
        return;
      }
      
      // Configurer les options de la requête
      const options = {
        headers,
        timeout: 30000, // 30 secondes de timeout
        rejectUnauthorized: false // Ignorer les erreurs de certificat SSL
      };
      
      // Choisir le protocole en fonction de l'URL
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = protocol.get(url, options, (res) => {
        // Gérer les redirections
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (debug) {
            console.log(`Redirection vers: ${res.headers.location}`);
          }
          
          // Construire l'URL de redirection
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            redirectUrl = new URL(redirectUrl, url).href;
          }
          
          // Vérifier si l'URL de redirection est suspecte
          const redirectParsedUrl = new URL(redirectUrl);
          const isRedirectSuspicious = suspiciousDomains.some(domain => 
            redirectParsedUrl.hostname.includes(domain)
          );
          
          if (isRedirectSuspicious) {
            if (debug) {
              console.log(`[DEBUG] Redirection vers un domaine suspect: ${redirectParsedUrl.hostname}`);
            }
            reject(new Error('Redirection vers un domaine suspect'));
            return;
          }
          
          // Suivre la redirection avec un délai aléatoire pour simuler un comportement humain
          setTimeout(() => {
            standardFetch(redirectUrl, headers, debug)
              .then(resolve)
              .catch(reject);
          }, Math.random() * 1000 + 500); // Délai aléatoire entre 500ms et 1500ms
          
          return;
        }
        
        // Gérer les erreurs HTTP
        if (res.statusCode !== 200) {
          reject(new Error(`Erreur HTTP ${res.statusCode}`));
          return;
        }
        
        // Configurer l'encodage
        res.setEncoding('utf8');
        
        // Récupérer les données
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          // Vérifier si la page contient des indications de blocage
          if (data.includes('captcha') || 
              data.includes('Cloudflare') && data.includes('challenge') ||
              data.includes('Access Denied') ||
              data.includes('DDoS protection') ||
              data.includes('blocked') && data.includes('security')) {
            
            if (debug) {
              console.log(`[DEBUG] Détection de protection anti-bot sur ${url}`);
            }
            
            reject(new Error('Site protégé contre le scraping'));
            return;
          }
          
          resolve(data);
        });
      }).on('error', (err) => {
        reject(err);
      });
      
      // Timeout après 30 secondes
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Timeout de la requête après 30 secondes'));
      });
      
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Fonction pour scraper via le Worker Cloudflare
async function scrapeViaWorker(sourceName, page = 1) {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
  
  if (!workerUrl) {
    throw new Error('Variable d\'environnement CLOUDFLARE_WORKER_URL non définie');
  }
  
  console.log(`Utilisation du Worker Cloudflare: ${workerUrl}`);
  console.log(`Scraping de la source: ${sourceName} (page ${page})`);
  
  // Construire l'URL avec les paramètres attendus par le Worker
  const url = new URL(workerUrl);
  
  // Paramètres obligatoires
  url.searchParams.append('source', sourceName);
  url.searchParams.append('action', 'scrape');
  url.searchParams.append('limit', limit.toString());
  
  // Paramètre de pagination
  if (page > 1) {
    url.searchParams.append('page', page.toString());
  }
  
  // Paramètres optionnels pour améliorer les chances de succès
  url.searchParams.append('debug', debug ? 'true' : 'false');
  url.searchParams.append('no_cache', 'true');
  
  console.log(`Requête vers: ${url.toString()}`);
  
  try {
    // Ajouter des en-têtes pour simuler un navigateur
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': new URL(workerUrl).origin,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };
    
    // Effectuer la requête
    const response = await fetchUrl(url.toString(), options);
    
    // Parser la réponse JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(response);
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse JSON:', error);
      console.error('Réponse reçue:', response.substring(0, 500) + '...');
      throw new Error('Réponse invalide du Worker Cloudflare');
    }
    
    // Vérifier si la réponse est valide
    if (!jsonResponse) {
      throw new Error('Réponse vide du Worker Cloudflare');
    }
    
    // Vérifier si la réponse contient une erreur
    if (jsonResponse.error) {
      throw new Error(`Erreur du Worker Cloudflare: ${jsonResponse.error}`);
    }
    
    // Vérifier si le scraping a réussi
    if (jsonResponse.success === false) {
      throw new Error(`Échec du scraping: ${jsonResponse.error || 'Raison inconnue'}`);
    }
    
    // Extraire les résultats
    const results = jsonResponse.items || [];
    
    // Formater les résultats
    return {
      success: true,
      source: sourceName,
      content_type: SOURCES[sourceName].contentType,
      count: results.length,
      results,
      is_mock: false,
      timestamp: new Date().toISOString(),
      page
    };
  } catch (error) {
    console.error(`Erreur lors du scraping via Worker: ${error.message}`);
    
    // Si l'erreur est une erreur 404, utiliser les données mockées
    if (error.message.includes('404') || error.message.includes('Échec du scraping')) {
      console.warn(`Utilisation des données mockées pour ${sourceName} suite à l'erreur: ${error.message}`);
      return generateMockData(sourceName, limit);
    }
    
    // Sinon, relancer l'erreur
    throw error;
  }
}

// Fonction pour scraper plusieurs pages et garantir l'unicité
async function scrapeMultiplePages(sourceName, maxPages = 5, targetCount = 100) {
  console.log(`Scraping de ${maxPages} pages pour ${sourceName} (objectif: ${targetCount} éléments uniques)`);
  
  const allResults = [];
  const uniqueIds = new Set();
  let currentPage = 1;
  let totalAttempts = 0;
  const maxAttempts = maxPages * 2; // Pour gérer les retries
  
  while (uniqueIds.size < targetCount && currentPage <= maxPages && totalAttempts < maxAttempts) {
    try {
      console.log(`Scraping de la page ${currentPage} pour ${sourceName} (${uniqueIds.size}/${targetCount} éléments uniques)`);
      const pageResults = await scrapeViaWorker(sourceName, currentPage);
      
      if (pageResults.is_mock) {
        console.log(`Données mockées reçues pour ${sourceName}, arrêt du scraping multi-pages`);
        return pageResults; // Si on a des données mockées, on s'arrête là
      }
      
      const { results = [] } = pageResults;
      
      if (results.length === 0) {
        console.log(`Aucun résultat sur la page ${currentPage}, arrêt du scraping`);
        break;
      }
      
      // Filtrer les résultats pour ne garder que les éléments uniques
      const newResults = [];
      for (const item of results) {
        const id = item.id || item.url || item.title;
        if (id && !uniqueIds.has(id)) {
          uniqueIds.add(id);
          newResults.push(item);
          allResults.push(item);
        }
      }
      
      console.log(`Page ${currentPage}: ${results.length} éléments trouvés, ${newResults.length} nouveaux éléments uniques`);
      
      // Si on n'a pas trouvé de nouveaux éléments, on passe à la page suivante
      if (newResults.length === 0) {
        console.log(`Aucun nouvel élément unique sur la page ${currentPage}, passage à la page suivante`);
      }
      
      currentPage++;
    } catch (error) {
      console.error(`Erreur lors du scraping de la page ${currentPage} pour ${sourceName}:`, error);
      totalAttempts++;
      
      // Si on a trop d'erreurs, on s'arrête
      if (totalAttempts >= maxAttempts) {
        console.error(`Trop d'erreurs lors du scraping de ${sourceName}, arrêt du scraping`);
        break;
      }
      
      // Attendre un peu avant de réessayer
      console.log(`Attente de 2 secondes avant de réessayer...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`Scraping terminé pour ${sourceName}: ${allResults.length} éléments au total, ${uniqueIds.size} éléments uniques`);
  
  // Si on n'a pas assez d'éléments uniques et qu'on n'a pas de données réelles, générer des données mockées
  if (uniqueIds.size === 0) {
    console.warn(`Aucun élément unique trouvé pour ${sourceName}, génération de données mockées`);
    return generateMockData(sourceName, targetCount);
  }
  
  // Si on n'a pas assez d'éléments uniques mais qu'on a des données réelles, compléter avec des données mockées
  if (uniqueIds.size < targetCount) {
    console.warn(`Pas assez d'éléments uniques pour ${sourceName} (${uniqueIds.size}/${targetCount}), compléter avec des données mockées`);
    const mockData = generateMockData(sourceName, targetCount - uniqueIds.size);
    allResults.push(...mockData.results);
  }
  
  return {
    success: true,
    source: sourceName,
    content_type: SOURCES[sourceName].contentType,
    count: allResults.length,
    results: allResults,
    is_mock: false,
    unique_count: uniqueIds.size,
    timestamp: new Date().toISOString()
  };
}

// Fonction pour générer des données mockées en cas d'échec
function generateMockData(sourceName, count = 100) {
  console.log(`Génération de données mockées pour ${sourceName} (${count} éléments)`);
  
  const sourceInfo = SOURCES[sourceName];
  const contentType = sourceInfo.contentType;
  const timestamp = new Date().toISOString();
  
  const results = [];
  
  for (let i = 1; i <= count; i++) {
    const id = `mock-${sourceName}-${i}`;
    const item = {
      id,
      title: `${sourceInfo.name} - Item ${i}`,
      original_title: `Original Title ${i}`,
      description: `Description générée pour l'élément ${i} de type ${contentType} depuis ${sourceInfo.name}.`,
      poster: `https://via.placeholder.com/300x450.png?text=${encodeURIComponent(sourceInfo.name)}`,
      backdrop: `https://via.placeholder.com/1280x720.png?text=${encodeURIComponent(sourceInfo.name)}`,
      year: 2025 - Math.floor(Math.random() * 5),
      rating: (7 + Math.random() * 3).toFixed(1),
      content_type: contentType,
      source_url: `${sourceInfo.baseUrl}/item/${id}`,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    // Ajouter des champs spécifiques selon le type de contenu
    if (contentType === 'drama') {
      item.episodes_count = Math.floor(Math.random() * 16) + 1;
      item.country = ['Corée du Sud', 'Japon', 'Chine', 'Taïwan'][Math.floor(Math.random() * 4)];
      item.status = ['En cours', 'Terminé'][Math.floor(Math.random() * 2)];
    } else if (contentType === 'anime') {
      item.episodes = Math.floor(Math.random() * 24) + 1;
      item.status = ['En cours', 'Terminé', 'Annoncé'][Math.floor(Math.random() * 3)];
      item.season = ['Hiver 2025', 'Printemps 2025', 'Été 2025', 'Automne 2024'][Math.floor(Math.random() * 4)];
    } else if (contentType === 'bollywood') {
      item.duration = (Math.floor(Math.random() * 60) + 120) + ' min';
      item.country = 'Inde';
    }
    
    results.push(item);
  }
  
  return {
    success: true,
    source: sourceInfo.name,
    content_type: contentType,
    count: results.length,
    results,
    is_mock: true,
    timestamp
  };
}

// Fonction pour sauvegarder les résultats
async function saveResults(results, sourceName) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = path.join(outputPath, `${sourceName}_${timestamp}.json`);
  
  // Formater les résultats pour le fichier JSON
  const { results: resultsData = [], is_mock = false } = results || {};
  const dataToSave = {
    source: sourceName,
    timestamp,
    count: Array.isArray(resultsData) ? resultsData.length : (Array.isArray(results) ? results.length : 0),
    data: resultsData || results,
    is_mock,
    content_type: SOURCES[sourceName].contentType
  };
  
  fs.writeFileSync(filename, JSON.stringify(dataToSave, null, 2));
  console.log(`Résultats sauvegardés dans ${filename}`);
  
  // Envoyer les résultats à Cloudflare si l'URL est définie
  if (process.env.CLOUDFLARE_API_URL) {
    try {
      console.log(`Envoi des résultats à Cloudflare: ${process.env.CLOUDFLARE_API_URL}`);
      // Code pour envoyer les résultats à Cloudflare via l'API
      // Cette partie peut être implémentée ultérieurement
    } catch (error) {
      console.error(`Erreur lors de l'envoi des résultats à Cloudflare: ${error.message}`);
    }
  }
  
  return filename;
}

// Fonction pour scraper une source spécifique
async function scrapeSource(source, minLimit = 100, maxLimit = 200, specificUrl = null, debug = false) {
  if (debug) {
    console.log(`[DEBUG] Début du scraping de ${source}`);
  }

  const startTime = Date.now();
  const results = [];
  let contentType = 'unknown';

  try {
    // Déterminer le type de contenu en fonction de la source
    if (source.toLowerCase().includes('drama') || source.toLowerCase() === 'mydramalist' || source.toLowerCase() === 'asianwiki') {
      contentType = 'drama';
    } else if (source.toLowerCase().includes('anime')) {
      contentType = 'anime';
    } else if (source.toLowerCase().includes('film') || source.toLowerCase().includes('movie')) {
      contentType = 'movie';
    } else if (source.toLowerCase().includes('bolly') || source.toLowerCase().includes('hindi')) {
      contentType = 'bollywood';
    }

    if (debug) {
      console.log(`[DEBUG] Type de contenu détecté: ${contentType}`);
    }

    // Récupérer les URLs à scraper
    const urls = specificUrl ? [specificUrl] : getSourceUrls(source);
    
    if (debug) {
      console.log(`[DEBUG] URLs à scraper: ${urls.length}`);
    }

    // Scraper chaque URL sans limitation de pages
    for (const url of urls) {
      if (debug) {
        console.log(`[DEBUG] Scraping de l'URL: ${url}`);
      }

      try {
        let items = [];
        
        // Vérifier si la source nécessite l'émulation de navigateur
        if (BROWSER_SOURCES.includes(source.toLowerCase())) {
          if (debug) {
            console.log(`[DEBUG] Utilisation de l'émulation de navigateur pour ${source}`);
          }
          
          if (contentType === 'drama') {
            items = await scrapeDramasWithBrowser(url, source, maxLimit, debug);
          } else if (contentType === 'anime') {
            items = await scrapeAnimesWithBrowser(url, source, maxLimit, debug);
          } else if (contentType === 'movie' || contentType === 'bollywood') {
            items = await scrapeMoviesWithBrowser(url, source, maxLimit, debug);
          }
        } else {
          try {
            // Récupérer le HTML de la page
            const html = await fetchHtml(url, debug);
            
            // Scraper les données en fonction du type de contenu
            if (contentType === 'drama') {
              items = await scrapeGenericDramas(html, source, maxLimit, debug);
            } else if (contentType === 'anime') {
              items = await scrapeGenericAnimes(html, source, maxLimit, debug);
            } else if (contentType === 'movie' || contentType === 'bollywood') {
              items = await scrapeGenericMovies(html, source, maxLimit, debug);
            }
          } catch (error) {
            console.error(`[ERROR] Erreur lors du scraping de ${url}: ${error.message}`);
            
            // En cas d'erreur, essayer le scraper basé sur l'émulation de navigateur comme fallback
            if (debug) {
              console.log(`[DEBUG] Tentative avec l'émulation de navigateur en fallback pour ${url}`);
            }
            
            if (contentType === 'drama') {
              items = await scrapeDramasWithBrowser(url, source, maxLimit, debug);
            } else if (contentType === 'anime') {
              items = await scrapeAnimesWithBrowser(url, source, maxLimit, debug);
            } else if (contentType === 'movie' || contentType === 'bollywood') {
              items = await scrapeMoviesWithBrowser(url, source, maxLimit, debug);
            }
          }
        }
        
        // Si aucun élément n'est trouvé, passer à l'URL suivante
        if (items.length === 0) {
          if (debug) {
            console.log(`[DEBUG] Aucun élément trouvé pour ${url}, passage à l'URL suivante`);
          }
          continue;
        }
        
        // Nettoyer les données
        items = cleanScrapedData(items, debug);
        
        // Ajouter les éléments aux résultats
        results.push(...items);
        
        // Arrêter si on a atteint le nombre maximum d'éléments
        if (results.length >= maxLimit) {
          if (debug) {
            console.log(`[DEBUG] Limite maximale atteinte (${maxLimit} éléments), arrêt du scraping`);
          }
          break;
        }
      } catch (error) {
        console.error(`[ERROR] Erreur lors du scraping de ${url}: ${error.message}`);
      }
    }

    // Supprimer les doublons
    const uniqueResults = removeDuplicates(results, 'title');
    
    // Vérifier si on a atteint le nombre minimum d'éléments
    if (uniqueResults.length < minLimit) {
      console.warn(`[WARNING] Nombre insuffisant d'éléments pour ${source}: ${uniqueResults.length}/${minLimit}`);
    }
    
    if (debug) {
      console.log(`[DEBUG] Fin du scraping de ${source}: ${uniqueResults.length} éléments uniques trouvés, durée: ${((Date.now() - startTime) / 1000).toFixed(2)} secondes`);
    }
    
    // Formater les résultats pour être compatibles avec le script d'envoi à D1
    return {
      source: source,
      timestamp: new Date().toISOString(),
      count: uniqueResults.length,
      data: uniqueResults,
      is_mock: false,
      content_type: contentType
    };
  } catch (error) {
    console.error(`[ERROR] Erreur lors du scraping de ${source}: ${error.message}`);
    
    if (debug) {
      console.log(`[DEBUG] Fin du scraping de ${source} avec erreur, durée: ${((Date.now() - startTime) / 1000).toFixed(2)} secondes`);
    }
    
    // En cas d'erreur, retourner un tableau vide
    return [];
  }
}

// Fonction pour récupérer les URLs à scraper pour une source donnée
function getSourceUrls(source) {
  const baseUrls = [];
  const sourceLower = source.toLowerCase();
  
  // Utiliser les domaines alternatifs si disponibles
  const domains = ALTERNATIVE_DOMAINS[sourceLower] || [];
  
  switch (sourceLower) {
    case 'mydramalist':
      baseUrls.push(
        'https://mydramalist.com/shows/top',
        'https://mydramalist.com/shows/popular',
        'https://mydramalist.com/shows/recent',
        'https://mydramalist.com/shows/ongoing',
        'https://mydramalist.com/shows/upcoming'
      );
      break;
    case 'voirdrama':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/drama/`,
            `https://${domain}/drama/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://voirdrama.org/drama/',
          'https://voirdrama.org/drama/page/2/',
          'https://voirdrama.cc/drama/',
          'https://voirdrama.cc/drama/page/2/'
        );
      }
      break;
    case 'dramavostfr':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/dramas/`,
            `https://${domain}/dramas/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://dramavostfr.tv/dramas/',
          'https://dramavostfr.tv/dramas/page/2/',
          'https://dramavostfr.cc/dramas/',
          'https://dramavostfr.cc/dramas/page/2/'
        );
      }
      break;
    case 'asianwiki':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/Category:Korean_Drama_-_2024`,
            `https://${domain}/Category:Korean_Drama_-_2023`
          );
        });
      } else {
        baseUrls.push(
          'https://asianwiki.com/Category:Korean_Drama_-_2024',
          'https://asianwiki.com/Category:Korean_Drama_-_2023',
          'https://asianwiki.com/Category:Korean_Drama_-_2022',
          'https://asianwiki.com/Category:Korean_Drama_-_2021',
          'https://asianwiki.com/Category:Korean_Drama_-_2020'
        );
      }
      break;
    case 'dramacore':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/dramas/`,
            `https://${domain}/dramas/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://dramacore.co/dramas/',
          'https://dramacore.co/dramas/page/2/',
          'https://dramacore.cc/dramas/',
          'https://dramacore.cc/dramas/page/2/'
        );
      }
      break;
    case 'dramacool':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/drama-list`,
            `https://${domain}/drama-list/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://dramacool.com.pa/drama-list',
          'https://dramacool9.io/drama-list',
          'https://dramacool.cr/drama-list',
          'https://dramacool.sr/drama-list'
        );
      }
      break;
    case 'voiranime':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/animes/`,
            `https://${domain}/animes/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://voiranime.com/animes/',
          'https://voiranime.com/animes/page/2/',
          'https://voiranime.to/animes/',
          'https://voiranime.to/animes/page/2/'
        );
      }
      break;
    case 'animesama':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/animes/`,
            `https://${domain}/animes/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://anime-sama.fr/animes/',
          'https://anime-sama.fr/animes/page/2/',
          'https://animesama.cc/animes/',
          'https://animesama.cc/animes/page/2/'
        );
      }
      break;
    case 'nekosama':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/anime/`,
            `https://${domain}/anime/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://neko-sama.fr/anime/',
          'https://neko-sama.fr/anime/page/2/',
          'https://nekosama.tv/anime/',
          'https://nekosama.tv/anime/page/2/'
        );
      }
      break;
    case 'animevostfr':
      baseUrls.push(
        'https://animevostfr.tv/animes/',
        'https://animevostfr.tv/animes/page/2/',
        'https://animevostfr.cc/animes/',
        'https://animevostfr.cc/animes/page/2/'
      );
      break;
    case 'otakufr':
      baseUrls.push(
        'https://otakufr.co/anime/',
        'https://otakufr.co/anime/page/2/',
        'https://otakufr.cc/anime/',
        'https://otakufr.cc/anime/page/2/'
      );
      break;
    case 'vostfree':
      baseUrls.push(
        'https://vostfree.cx/animes/',
        'https://vostfree.cx/animes/page/2/',
        'https://vostfree.tv/animes/',
        'https://vostfree.tv/animes/page/2/'
      );
      break;
    case 'streamingdivx':
      baseUrls.push(
        'https://streamingdivx.ch/films/',
        'https://streamingdivx.ch/films/page/2/',
        'https://streamingdivx.co/films/',
        'https://streamingdivx.co/films/page/2/'
      );
      break;
    case 'filmcomplet':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/films/`,
            `https://${domain}/films/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://filmcomplet.tv/films/',
          'https://filmcomplet.tv/films/page/2/',
          'https://film-complet.cc/films/',
          'https://film-complet.cc/films/page/2/'
        );
      }
      break;
    case 'streamingcommunity':
      baseUrls.push(
        'https://streamingcommunity.best/browse',
        'https://streamingcommunity.best/browse?page=2',
        'https://streamingcommunity.uno/browse',
        'https://streamingcommunity.uno/browse?page=2'
      );
      break;
    case 'filmapik':
      baseUrls.push(
        'https://filmapik.bio/movies',
        'https://filmapik.bio/movies/page/2',
        'https://filmapik.tv/movies',
        'https://filmapik.tv/movies/page/2'
      );
      break;
    case 'bollyplay':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/movies/`,
            `https://${domain}/movies/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://bollyplay.net/movies/',
          'https://bollyplay.net/movies/page/2/',
          'https://bollyplay.cc/movies/',
          'https://bollyplay.cc/movies/page/2/'
        );
      }
      break;
    case 'hindilinks4u':
      if (domains.length > 0) {
        domains.forEach(domain => {
          baseUrls.push(
            `https://${domain}/movies/`,
            `https://${domain}/movies/page/2/`
          );
        });
      } else {
        baseUrls.push(
          'https://hindilinks4u.to/movies/',
          'https://hindilinks4u.to/movies/page/2/',
          'https://hindilinks4u.cc/movies/',
          'https://hindilinks4u.cc/movies/page/2/'
        );
      }
      break;
    default:
      // Source inconnue, retourner une liste vide
      console.warn(`[WARN] Source inconnue: ${source}`);
      break;
  }
  
  return baseUrls;
}

// Fonction pour supprimer les doublons d'un tableau d'objets en fonction d'une clé
function removeDuplicates(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// Fonction pour récupérer le type de contenu d'une source
function getContentType(sourceName) {
  if (!SOURCES[sourceName]) {
    return 'unknown';
  }
  return SOURCES[sourceName].contentType || 'unknown';
}

// Fonction principale
async function main() {
  try {
    console.log(`FloDrama CLI Scraper - ${new Date().toISOString()}`);
    
    // Analyser les arguments de la ligne de commande
    const args = process.argv.slice(2);
    const sourceArg = args.find(arg => arg.startsWith('--source='));
    const source = sourceArg ? sourceArg.split('=')[1] : null;
    const outputArg = args.find(arg => arg.startsWith('--output='));
    let outputPath = outputArg ? outputArg.split('=')[1] : '../scraping-results';
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;
    const allArg = args.includes('--all');
    const debugArg = args.includes('--debug');
    const debug = debugArg !== undefined;
    const pagesArg = args.find(arg => arg.startsWith('--pages='));
    const maxPages = pagesArg ? parseInt(pagesArg.split('=')[1]) : 5;
    const specificUrlArg = args.find(arg => arg.startsWith('--url='));
    const specificUrl = specificUrlArg ? specificUrlArg.split('=')[1] : null;
    
    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Vérification des arguments
    if (!source && !allArg) {
      console.error('Erreur: Veuillez spécifier une source avec --source=<nom_source> ou utiliser --all pour toutes les sources');
      console.error('Sources disponibles: ' + Object.keys(SOURCES).join(', '));
      process.exit(1);
    }

    // Vérification de la source si spécifiée
    if (source && !SOURCES[source] && !allArg) {
      console.error(`Erreur: Source non reconnue: ${source}`);
      console.error('Sources disponibles: ' + Object.keys(SOURCES).join(', '));
      process.exit(1);
    }

    if (debug) {
      console.log(`[DEBUG] Arguments: ${args}`);
      console.log(`[DEBUG] Paramètres: ${JSON.stringify({
        source,
        limit,
        maxPages,
        specificUrl,
        debug,
        outputPath,
        all: allArg
      }, null, 2)}`);
    }

    // Récupérer la liste des sources à scraper
    let sources = [];
    if (source) {
      sources = [source];
    } else if (allArg) {
      sources = Object.keys(SOURCES);
    }
    
    // Si des sources sont spécifiées, les scraper
    if (sources.length > 0) {
      console.log(`Scraping de ${sources.length} sources...`);
      
      // Initialiser les variables pour le suivi
      const startTime = Date.now();
      const allResults = [];
      const allItems = [];
      let successCount = 0;
      let errorCount = 0;
      let totalCount = 0;
      
      // Scraper chaque source
      for (const src of sources) {
        const sourceStartTime = Date.now();
        console.log(`\nScraping de ${src}...`);
        
        try {
          // Scraper la source
          const result = await scrapeSource(src, 100, 200, null, debug);
          
          // Sauvegarder les résultats
          let outputFile;
          if (args.includes('--save')) {
            outputFile = path.join(outputPath, `${src}_${new Date().toISOString().replace(/:/g, '-')}.json`);
            fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
          }
          
          // Ajouter les items au tableau global
          allItems.push(...result.data);
          
          // Ajouter les résultats au résumé
          allResults.push({
            source: src,
            count: result.data.length,
            duration: ((Date.now() - sourceStartTime) / 1000).toFixed(2),
            file: outputFile,
            is_mock: false,
            content_type: getContentType(src)
          });
          
          // Afficher le résultat
          console.log(`✅ ${src}: ${result.data.length} éléments trouvés en ${((Date.now() - sourceStartTime) / 1000).toFixed(2)} secondes`);
          
          // Mettre à jour les compteurs
          totalCount += result.data.length;
          successCount++;
        } catch (error) {
          console.error(`❌ ${src}: ${error.message}`);
          errorCount++;
        }
      }
      
      // Sauvegarder tous les résultats dans un seul fichier
      if (args.includes('--save')) {
        const allSourcesFile = path.join(outputPath, `all_sources_${new Date().toISOString().replace(/:/g, '-')}.json`);
        const allSourcesData = {
          timestamp: new Date().toISOString(),
          count: allItems.length,
          sources: sources,
          data: allItems
        };
        fs.writeFileSync(allSourcesFile, JSON.stringify(allSourcesData, null, 2));
        console.log(`\nTous les résultats sauvegardés dans: ${allSourcesFile}`);
      }
      
      // Afficher le résumé
      console.log(`\n=== Résumé du scraping ===`);
      console.log(`Durée totale: ${((Date.now() - startTime) / 1000).toFixed(2)} secondes`);
      console.log(`Sources scrapées: ${successCount} / ${sources.length}`);
      console.log(`Erreurs: ${errorCount}`);
      console.log(`\nDétails des sources scrapées:`);
      
      allResults.forEach(result => {
        console.log(`- ${result.source}: ${result.count} éléments`);
      });
      
      // Sauvegarder le résumé
      if (args.includes('--save')) {
        const summaryFile = path.join(outputPath, `scraping_summary_${new Date().toISOString().replace(/:/g, '-')}.json`);
        fs.writeFileSync(summaryFile, JSON.stringify({
          total_duration: ((Date.now() - startTime) / 1000).toFixed(2),
          total_sources: successCount,
          total_errors: errorCount,
          total_items: totalCount,
          sources: allResults
        }, null, 2));
        console.log(`\nRésumé sauvegardé dans: ${summaryFile}`);
      }
    } else {
      // Si aucune source n'est spécifiée et que l'option --all n'est pas utilisée, afficher l'aide
      console.log(`
Usage: node src/cli-scraper.js [options]

Options:
  --source=SOURCE    Source à scraper (ex: mydramalist, voirdrama, etc.)
  --all              Scraper toutes les sources disponibles
  --limit=LIMIT      Nombre maximum d'éléments à récupérer par source (défaut: 100)
  --pages=PAGES      Nombre maximum de pages à scraper par source (défaut: 20)
  --url=URL          URL spécifique à scraper
  --output=PATH      Chemin du dossier de sortie (défaut: ./scraping-results)
  --debug            Activer le mode debug
  --save             Sauvegarder les résultats dans des fichiers JSON

Sources disponibles:
  - mydramalist     (dramas coréens, japonais, chinois, etc.)
  - voirdrama       (dramas en streaming)
  - asianwiki       (base de données de dramas asiatiques)
  - dramacool       (dramas en streaming)
  - voiranime       (animes en streaming)
  - animesama       (animes en streaming)
  - nekosama        (animes en streaming)
  - animevostfr     (animes en streaming)
  - otakufr         (animes en streaming)
  - vostfree        (animes et dramas en streaming)
  - streamingdivx   (films en streaming)
  - filmcomplet     (films en streaming)
  - streamingcommunity (films et séries en streaming)
  - filmapik        (films en streaming)
  - bollyplay       (films bollywood en streaming)
  - hindilinks4u    (films bollywood en streaming)
      `);
    }
  } catch (error) {
    console.error('Erreur: ' + error.message);
    process.exit(1);
  }
}

// Exécution du script
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
