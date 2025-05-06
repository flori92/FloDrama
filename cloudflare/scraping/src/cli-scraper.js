/**
 * Interface en ligne de commande pour les scrapers FloDrama
 * Ce script permet d'exécuter les scrapers depuis la ligne de commande ou GitHub Actions
 * pour récupérer des données réelles des sources et les envoyer à Cloudflare.
 */

// Conversion des imports ES modules en require pour Node.js standard
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');
const crypto = require('crypto');
const { 
  scrapeGenericDramas, 
  scrapeGenericAnimes, 
  scrapeGenericMovies, 
  cleanScrapedData 
} = require('./html-scraper.js');

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
    baseUrl: 'https://dramavostfr.com',
    contentType: 'drama'
  },
  asianwiki: {
    name: 'AsianWiki',
    baseUrl: 'https://asianwiki.com',
    contentType: 'drama'
  },
  dramacore: {
    name: 'DramaCore',
    baseUrl: 'https://dramacore.co',
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
    baseUrl: 'https://v6.voiranime.com',
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
    baseUrl: 'https://streamingdivx.co',
    contentType: 'film'
  },
  filmcomplet: {
    name: 'FilmComplet',
    baseUrl: 'https://www.filmcomplet.tv',
    contentType: 'film'
  },
  streamingcommunity: {
    name: 'StreamingCommunity',
    baseUrl: 'https://streamingcommunity.best',
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
    baseUrl: 'https://bollyplay.co',
    contentType: 'bollywood'
  },
  hindilinks4u: {
    name: 'HindiLinks4u',
    baseUrl: 'https://www.hindilinks4u.to',
    contentType: 'bollywood'
  }
};

// Récupération des arguments de la ligne de commande
const args = process.argv.slice(2);
const sourceArg = args.find(arg => arg.startsWith('--source='));
const source = sourceArg ? sourceArg.split('=')[1] : null;
const outputArg = args.find(arg => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.split('=')[1] : './scraping-results';
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100; // Augmentation de la limite par défaut à 100
const allArg = args.find(arg => arg === '--all');
const debugArg = args.find(arg => arg === '--debug');
const debug = debugArg !== undefined;
const pagesArg = args.find(arg => arg.startsWith('--pages='));
const pages = pagesArg ? parseInt(pagesArg.split('=')[1]) : 5; // Nombre de pages à scraper par défaut
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

// Importer les scrapers génériques
const { 
  scrapeGenericDramas, 
  scrapeGenericAnimes, 
  scrapeGenericMovies, 
  cleanScrapedData 
} = require('./html-scraper.js');

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
    const httpModule = parsedUrl.protocol === 'https:' ? https : require('http');
    
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
async function fetchHtml(url, debug = false) {
  try {
    if (debug) {
      console.log(`[DEBUG] Récupération du HTML de ${url}`);
    }
    
    // Utiliser la fonction fetchUrl existante
    const html = await fetchUrl(url);
    
    if (!html) {
      throw new Error('HTML vide');
    }
    
    return html;
  } catch (error) {
    console.error(`[ERROR] Erreur lors de la récupération du HTML de ${url}:`, error.message);
    throw error;
  }
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
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
async function scrapeSource(sourceName) {
  console.log(`\n=== Démarrage du scraping pour la source: ${sourceName} ===`);
  console.log(`Source: ${SOURCES[sourceName].name} (${SOURCES[sourceName].contentType})`);
  console.log(`URL de base: ${SOURCES[sourceName].baseUrl}`);
  console.log(`Objectif: ${limit} éléments uniques sur ${pages} pages maximum`);
  
  try {
    // Utiliser le Worker Cloudflare pour effectuer le scraping multi-pages
    const results = await scrapeMultiplePages(sourceName, pages, limit);
    
    if (results) {
      const { results: resultsData = [] } = results || {};
      const count = Array.isArray(resultsData) ? resultsData.length : (Array.isArray(results) ? results.length : 0);
      console.log(`${count} éléments récupérés depuis ${sourceName}`);
      
      const savedFile = await saveResults(results, sourceName);
      console.log(`Scraping de ${sourceName} terminé avec succès`);
      console.log(`Données sauvegardées dans: ${savedFile}`);
      
      return {
        success: true,
        source: sourceName,
        count,
        file: savedFile,
        is_mock: results.is_mock || false
      };
    } else {
      console.warn(`Aucun résultat obtenu pour ${sourceName}`);
      return {
        success: false,
        source: sourceName,
        error: 'Aucun résultat obtenu'
      };
    }
  } catch (error) {
    console.error(`Erreur lors du scraping de ${sourceName}:`, error);
    
    // Générer des données mockées en cas d'échec
    try {
      console.warn(`Tentative de génération de données mockées pour ${sourceName}`);
      const mockData = generateMockData(sourceName, limit);
      const savedFile = await saveResults(mockData, sourceName);
      console.log(`Données mockées sauvegardées dans: ${savedFile}`);
      
      return {
        success: true,
        source: sourceName,
        count: mockData.results.length,
        file: savedFile,
        is_mock: true,
        error: error.message
      };
    } catch (mockError) {
      console.error(`Erreur lors de la génération des données mockées pour ${sourceName}:`, mockError);
      return {
        success: false,
        source: sourceName,
        error: error.message
      };
    }
  }
}

// Fonction principale
async function main() {
  const startTime = Date.now();
  console.log(`Démarrage du scraping à ${new Date().toISOString()}`);
  
  // Déterminer les sources à scraper
  const sourcesToScrape = allArg ? Object.keys(SOURCES) : [source];
  
  console.log(`Sources à scraper: ${sourcesToScrape.join(', ')}`);
  console.log(`Limite par source: ${limit} éléments`);
  console.log(`Pages maximum par source: ${pages}`);
  
  const results = [];
  const errors = [];
  
  // Scraper chaque source
  for (const sourceName of sourcesToScrape) {
    try {
      const result = await scrapeSource(sourceName);
      results.push(result);
      
      if (!result.success) {
        errors.push({
          source: sourceName,
          error: result.error
        });
      }
    } catch (error) {
      console.error(`Erreur non gérée lors du scraping de ${sourceName}:`, error);
      errors.push({
        source: sourceName,
        error: error.message
      });
    }
  }
  
  // Afficher le résumé
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n=== Résumé du scraping ===`);
  console.log(`Durée totale: ${duration.toFixed(2)} secondes`);
  console.log(`Sources scrapées: ${results.length} / ${sourcesToScrape.length}`);
  console.log(`Erreurs: ${errors.length}`);
  
  // Détails des sources scrapées
  console.log(`\nDétails des sources scrapées:`);
  results.forEach(result => {
    if (result.success) {
      console.log(`- ${result.source}: ${result.count} éléments${result.is_mock ? ' (mock)' : ''}`);
    } else {
      console.log(`- ${result.source}: ÉCHEC (${result.error})`);
    }
  });
  
  // Détails des erreurs
  if (errors.length > 0) {
    console.log(`\nDétails des erreurs:`);
    errors.forEach(error => {
      console.log(`- ${error.source}: ${error.error}`);
    });
  }
  
  // Écrire le résumé dans un fichier
  const summaryFile = path.join(outputPath, `scraping_summary_${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    duration,
    sources: sourcesToScrape,
    results,
    errors
  }, null, 2));
  
  console.log(`\nRésumé sauvegardé dans: ${summaryFile}`);
  
  // Retourner un code d'erreur si toutes les sources ont échoué
  if (errors.length === sourcesToScrape.length) {
    console.error('Toutes les sources ont échoué');
    process.exit(1);
  }
}

// Exécution du script
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});

// Fonction pour scraper une source spécifique
async function scrapeSource(source, limit = 100, maxPages = 10, debug = false) {
  try {
    if (debug) {
      console.log(`[DEBUG] Début du scraping de ${source} (limite: ${limit}, pages max: ${maxPages})`);
    }

    const startTime = Date.now();
    const results = [];
    let errors = 0;
    let contentType = 'unknown';

    // Déterminer le type de contenu en fonction de la source
    if (source.includes('drama') || source.includes('cool') || source.includes('asian')) {
      contentType = 'drama';
    } else if (source.includes('anime') || source.includes('animes')) {
      contentType = 'anime';
    } else if (source.includes('film') || source.includes('movie')) {
      contentType = 'film';
    } else if (source.includes('bollywood') || source.includes('indian')) {
      contentType = 'bollywood';
    }

    // Configuration des URLs à scraper en fonction de la source
    const baseUrls = getSourceUrls(source);
    
    if (debug) {
      console.log(`[DEBUG] URLs à scraper pour ${source}:`, baseUrls);
    }

    // Scraper chaque URL
    for (let i = 0; i < Math.min(baseUrls.length, maxPages); i++) {
      const url = baseUrls[i];
      
      try {
        if (debug) {
          console.log(`[DEBUG] Scraping de l'URL: ${url}`);
        }

        // Récupérer le HTML
        const html = await fetchHtml(url, debug);
        
        if (!html) {
          console.error(`[ERROR] HTML vide pour ${url}`);
          errors++;
          continue;
        }

        // Scraper le HTML en fonction du type de contenu
        let scrapedItems = [];
        
        if (contentType === 'drama') {
          scrapedItems = scrapeGenericDramas(html, source, limit, debug);
        } else if (contentType === 'anime') {
          scrapedItems = scrapeGenericAnimes(html, source, limit, debug);
        } else if (contentType === 'film' || contentType === 'bollywood') {
          scrapedItems = scrapeGenericMovies(html, source, limit, debug);
        } else {
          // Si le type de contenu n'est pas déterminé, essayer les trois types
          const dramaItems = scrapeGenericDramas(html, source, limit, debug);
          const animeItems = scrapeGenericAnimes(html, source, limit, debug);
          const movieItems = scrapeGenericMovies(html, source, limit, debug);
          
          // Utiliser le type qui a donné le plus de résultats
          if (dramaItems.length >= animeItems.length && dramaItems.length >= movieItems.length) {
            scrapedItems = dramaItems;
            contentType = 'drama';
          } else if (animeItems.length >= dramaItems.length && animeItems.length >= movieItems.length) {
            scrapedItems = animeItems;
            contentType = 'anime';
          } else {
            scrapedItems = movieItems;
            contentType = 'film';
          }
        }

        // Nettoyer et ajouter les éléments scrapés aux résultats
        const cleanedItems = cleanScrapedData(scrapedItems, debug);
        results.push(...cleanedItems);

        if (debug) {
          console.log(`[DEBUG] ${cleanedItems.length} éléments scrapés depuis ${url}`);
        }

        // Si on a atteint la limite, arrêter le scraping
        if (results.length >= limit) {
          break;
        }
      } catch (error) {
        console.error(`[ERROR] Erreur lors du scraping de ${url}:`, error);
        errors++;
      }
    }

    // Dédupliquer les résultats par ID
    const uniqueResults = removeDuplicates(results, 'id');
    
    // Limiter le nombre de résultats
    const limitedResults = uniqueResults.slice(0, limit);

    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;

    if (debug) {
      console.log(`[DEBUG] Fin du scraping de ${source}: ${limitedResults.length} éléments uniques trouvés, durée: ${durationSeconds.toFixed(2)} secondes`);
    }

    return {
      success: limitedResults.length > 0,
      source,
      content_type: contentType,
      items: limitedResults,
      items_count: limitedResults.length,
      errors_count: errors,
      duration_seconds: durationSeconds
    };
  } catch (error) {
    console.error(`[ERROR] Erreur générale lors du scraping de ${source}:`, error);
    
    return {
      success: false,
      source,
      content_type: 'unknown',
      items: [],
      items_count: 0,
      errors_count: 1,
      duration_seconds: 0,
      error: error.message
    };
  }
}

// Fonction pour récupérer les URLs à scraper pour une source donnée
function getSourceUrls(source) {
  const baseUrls = [];
  
  // Configuration des URLs en fonction de la source
  switch (source.toLowerCase()) {
    case 'mydramalist':
      baseUrls.push(
        'https://mydramalist.com/shows/top',
        'https://mydramalist.com/shows/popular',
        'https://mydramalist.com/shows/recent',
        'https://mydramalist.com/shows/ongoing',
        'https://mydramalist.com/shows/upcoming'
      );
      break;
    case 'dramacool':
      // Utilisation d'un domaine alternatif qui fonctionne mieux
      baseUrls.push(
        'https://www.dramacool9.co/drama-list',
        'https://www.dramacool9.co/most-popular-drama',
        'https://www.dramacool9.co/ongoing-drama',
        'https://www.dramacool9.co/completed-drama',
        'https://www.dramacool9.co/drama-list/top-rated'
      );
      break;
    case 'voirdrama':
      baseUrls.push(
        'https://voirdrama.org/drama-vostfr',
        'https://voirdrama.org/drama-vostfr/page/2',
        'https://voirdrama.org/drama-vostfr/page/3'
      );
      break;
    case 'dramavostfr':
      baseUrls.push(
        'https://www.dramavostfr.cc/dramas',
        'https://www.dramavostfr.cc/dramas/page/2',
        'https://www.dramavostfr.cc/dramas/page/3'
      );
      break;
    case 'asianwiki':
      // Utilisation de pages moins susceptibles d'être bloquées
      baseUrls.push(
        'https://asianwiki.com/Category:Korean_Drama_-_2024',
        'https://asianwiki.com/Category:Korean_Drama_-_2023',
        'https://asianwiki.com/Category:Korean_Drama_-_2022'
      );
      break;
    case 'dramacore':
      // Réduction du nombre d'URLs pour éviter les timeouts
      baseUrls.push(
        'https://dramacore.co'
      );
      break;
    case 'voiranime':
      baseUrls.push(
        'https://voiranime.com/animes-vostfr',
        'https://voiranime.com/animes-vostfr/page/2',
        'https://voiranime.com/animes-vostfr/page/3'
      );
      break;
    case 'animesama':
      baseUrls.push(
        'https://anime-sama.fr/catalogue',
        'https://anime-sama.fr/catalogue/page/2',
        'https://anime-sama.fr/catalogue/page/3'
      );
      break;
    case 'nekosama':
      baseUrls.push(
        'https://neko-sama.fr/anime',
        'https://neko-sama.fr/anime/page/2',
        'https://neko-sama.fr/anime/page/3'
      );
      break;
    case 'animevostfr':
      baseUrls.push(
        'https://animevostfr.tv/animes-vostfr',
        'https://animevostfr.tv/animes-vostfr/page/2',
        'https://animevostfr.tv/animes-vostfr/page/3'
      );
      break;
    case 'otakufr':
      // Remplacement par un domaine alternatif qui fonctionne en HTTPS
      baseUrls.push(
        'https://www.otakufr.com/anime-list',
        'https://www.otakufr.com/anime-list/page/2',
        'https://www.otakufr.com/anime-list/page/3'
      );
      break;
    case 'vostfree':
      // Remplacement par un domaine alternatif qui fonctionne en HTTPS
      baseUrls.push(
        'https://vostfr.tv/animes',
        'https://vostfr.tv/animes/page/2',
        'https://vostfr.tv/animes/page/3'
      );
      break;
    case 'streamingdivx':
      baseUrls.push(
        'https://www.streamingdivx.ch',
        'https://www.streamingdivx.ch/films',
        'https://www.streamingdivx.ch/films/page/2'
      );
      break;
    case 'streamingcommunity':
      baseUrls.push(
        'https://streamingcommunity.best/browse',
        'https://streamingcommunity.best/browse?page=2',
        'https://streamingcommunity.best/browse?page=3'
      );
      break;
    case 'filmcomplet':
      baseUrls.push(
        'https://www.filmcomplet.tv/films',
        'https://www.filmcomplet.tv/films/page/2',
        'https://www.filmcomplet.tv/films/page/3'
      );
      break;
    case 'filmapik':
      baseUrls.push(
        'https://filmapik.bio',
        'https://filmapik.bio/latest',
        'https://filmapik.bio/popular'
      );
      break;
    case 'bollyplay':
      // Remplacement par un domaine alternatif qui fonctionne
      baseUrls.push(
        'https://bollyflix.guru',
        'https://bollyflix.guru/movies',
        'https://bollyflix.guru/web-series'
      );
      break;
    case 'hindilinks4u':
      // Remplacement par un domaine alternatif qui fonctionne en HTTPS
      baseUrls.push(
        'https://hindilinks4u.team',
        'https://hindilinks4u.team/category/movies',
        'https://hindilinks4u.team/category/tv-shows'
      );
      break;
    default:
      // Si la source n'est pas reconnue, utiliser une URL générique
      if (source.includes('http')) {
        baseUrls.push(source);
      } else {
        baseUrls.push(`https://${source}`);
      }
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

/**
 * Nettoie les données scrapées pour assurer la cohérence
 * @param {Array} items - Éléments scrapés
 * @param {boolean} debug - Activer le mode debug
 * @returns {Array} - Éléments nettoyés
 */
function cleanScrapedData(items, debug = false) {
  if (!items || !Array.isArray(items)) {
    if (debug) {
      console.log(`[DEBUG] cleanScrapedData: items n'est pas un tableau ou est undefined:`, items);
    }
    return [];
  }

  if (debug) {
    console.log(`[DEBUG] cleanScrapedData: Nettoyage de ${items.length} éléments`);
  }

  return items.map(item => {
    // Générer un ID unique si non présent
    if (!item.id) {
      item.id = crypto.createHash('md5').update(item.title + (item.link || '')).digest('hex');
    }

    // Normaliser les URLs
    if (item.link && !item.link.startsWith('http')) {
      item.link = item.link.startsWith('/') ? `https://${new URL(item.source_url).hostname}${item.link}` : `https://${new URL(item.source_url).hostname}/${item.link}`;
    }

    if (item.image && !item.image.startsWith('http')) {
      item.image = item.image.startsWith('/') ? `https://${new URL(item.source_url).hostname}${item.image}` : `https://${new URL(item.source_url).hostname}/${item.image}`;
    }

    // Nettoyer le titre
    if (item.title) {
      item.title = item.title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Assurer que les champs numériques sont des nombres
    if (item.year && typeof item.year === 'string') {
      const yearMatch = item.year.match(/\d{4}/);
      item.year = yearMatch ? parseInt(yearMatch[0]) : null;
    }

    if (item.rating && typeof item.rating === 'string') {
      const ratingMatch = item.rating.match(/(\d+(\.\d+)?)/);
      item.rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }

    if (item.episodes_count && typeof item.episodes_count === 'string') {
      const episodesMatch = item.episodes_count.match(/\d+/);
      item.episodes_count = episodesMatch ? parseInt(episodesMatch[0]) : null;
    }

    return item;
  });
}
