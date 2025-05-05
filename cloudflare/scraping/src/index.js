/**
 * FloDrama Scraper Worker
 * 
 * Ce worker permet de scraper les données de différentes sources
 * en utilisant un serveur relais Python hébergé sur Render.
 */

import { MyDramaListScraper, MyDramaListParseHubScraper } from './html-scraper';
import { VoirAnimeScraper, VoirAnimeParseHubScraper } from './html-scraper';
import { VoirDramaScraper, AsianWikiScraper } from './drama-scrapers';
import { NekoSamaScraper, AnimeSamaScraper } from './anime-scrapers';
import { CoflixScraper, VostFreeScraper, TopStreamScraper } from './film-scrapers';
import { Zee5Scraper } from './bollywood-scrapers';
import { RelayClient } from './relay-client';
import { ParseHubClient } from './parsehub-client';
import ScrapingQueueManager from './queue-manager';
import ScrapingMonitor from './scraping-monitor';

// Configuration des sources
const SOURCES = {
  mydramalist: {
    name: 'MyDramaList',
    scraper: MyDramaListScraper,
    parsehubScraper: MyDramaListParseHubScraper,
    contentType: 'drama'
  },
  voiranime: {
    name: 'VoirAnime',
    scraper: VoirAnimeScraper,
    parsehubScraper: VoirAnimeParseHubScraper,
    contentType: 'anime'
  },
  voirdrama: {
    name: 'VoirDrama',
    scraper: VoirDramaScraper,
    contentType: 'drama'
  },
  asianwiki: {
    name: 'AsianWiki',
    scraper: AsianWikiScraper,
    contentType: 'drama'
  },
  nekosama: {
    name: 'NekoSama',
    scraper: NekoSamaScraper,
    contentType: 'anime'
  },
  animesama: {
    name: 'AnimeSama',
    scraper: AnimeSamaScraper,
    contentType: 'anime'
  },
  coflix: {
    name: 'Coflix',
    scraper: CoflixScraper,
    contentType: 'film'
  },
  vostfree: {
    name: 'VostFree',
    scraper: VostFreeScraper,
    contentType: 'film'
  },
  topstream: {
    name: 'TopStream',
    scraper: TopStreamScraper,
    contentType: 'film'
  },
  zee5: {
    name: 'Zee5',
    scraper: Zee5Scraper,
    contentType: 'bollywood'
  }
};

// Configuration du cache
const CACHE_TTL = {
  search: 60 * 60, // 1 heure pour les recherches
  details: 60 * 60 * 24, // 24 heures pour les détails
  scrape: 60 * 60 * 3 // 3 heures pour le scraping général
};

// URL du serveur relais
const RELAY_URL = 'https://flodrama-scraper.onrender.com';

// Intervalle de ping en millisecondes (10 minutes)
const PING_INTERVAL = 10 * 60 * 1000;

// Configuration des projets ParseHub
const PARSEHUB_PROJECTS = {
  mydramalist: {
    scrape: 'YOUR_PROJECT_TOKEN_HERE'
  },
  voiranime: {
    scrape: 'YOUR_PROJECT_TOKEN_HERE'
  }
};

/**
 * Maintient le serveur relais actif en envoyant des pings périodiques
 * @param {string} relayUrl - URL du serveur relais
 * @param {ScrapingMonitor} monitor - Moniteur de scraping
 */
async function keepRelayAlive(relayUrl, monitor = null) {
  try {
    const startTime = Date.now();
    const response = await fetch(relayUrl);
    const responseTime = Date.now() - startTime;
    
    console.log(`Ping du serveur relais: ${response.status} (${responseTime}ms)`);
    
    // Enregistrer le ping dans le moniteur si disponible
    if (monitor) {
      await monitor.recordRelayPing(relayUrl, response.ok, responseTime);
    }
    
    return response.ok;
  } catch (error) {
    console.error(`Erreur lors du ping du serveur relais: ${error.message}`);
    
    // Enregistrer l'erreur dans le moniteur si disponible
    if (monitor) {
      await monitor.recordError('relay_ping', error.message, { relayUrl });
    }
    
    return false;
  }
}

/**
 * Génère une clé de cache basée sur les paramètres de la requête
 * @param {Object} params - Paramètres de la requête
 * @returns {string} - Clé de cache
 */
function generateCacheKey(params) {
  const { source, action, query, id, limit } = params;
  
  if (action === 'search') {
    return `${source}:search:${query}:${limit || 20}`;
  } else if (action === 'details') {
    return `${source}:details:${id}`;
  } else {
    return `${source}:scrape:${limit || 20}`;
  }
}

/**
 * Configure un ping périodique pour maintenir le serveur relais actif
 * @param {Object} env - Environnement Cloudflare Workers
 * @param {Object} ctx - Contexte d'exécution
 */
function setupPeriodicPing(env, ctx) {
  // Créer le moniteur de scraping
  const monitor = new ScrapingMonitor(env);
  
  // Ping immédiat
  ctx.waitUntil(keepRelayAlive(RELAY_URL, monitor));
  
  // Ping périodique (toutes les 10 minutes)
  // Note: Cette approche est limitée par la durée d'exécution du Worker
  // Pour un ping vraiment périodique, il faut utiliser Cron Triggers
  const pingInterval = setInterval(() => {
    ctx.waitUntil(keepRelayAlive(RELAY_URL, monitor));
  }, PING_INTERVAL);
  
  // Nettoyer l'intervalle après 50 minutes (limite de durée d'exécution des Workers)
  setTimeout(() => {
    clearInterval(pingInterval);
  }, 50 * 60 * 1000);
}

/**
 * Gestionnaire de requêtes HTTP
 */
async function handleRequest(request, env, ctx) {
  // Initialiser le moniteur de scraping
  const monitor = new ScrapingMonitor(env);
  
  // Initialiser le gestionnaire de file d'attente
  const queueManager = new ScrapingQueueManager(env);
  
  // Configurer le ping périodique
  setupPeriodicPing(env, ctx);
  
  // Vérifier si c'est une requête de ping
  const url = new URL(request.url);
  if (url.pathname === '/ping') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Vérifier si c'est une requête pour les statistiques
  if (url.pathname === '/stats') {
    const stats = await monitor.getStats();
    return new Response(JSON.stringify(stats), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Vérifier si c'est une requête pour vérifier le statut d'une tâche
  const taskId = url.searchParams.get('task_id');
  if (taskId) {
    const task = await queueManager.getTaskStatus(taskId);
    
    if (!task) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tâche non trouvée'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify(task), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Extraire les paramètres de la requête
  const source = url.searchParams.get('source') || 'mydramalist';
  const action = url.searchParams.get('action') || 'scrape';
  const query = url.searchParams.get('query') || '';
  const id = url.searchParams.get('id') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const debug = url.searchParams.get('debug') === 'true';
  const useParseHub = url.searchParams.get('parsehub') === 'true';
  const async = url.searchParams.get('async') === 'true';
  const noCache = url.searchParams.get('no_cache') === 'true';
  
  // Vérifier si la source est valide
  if (!SOURCES[source]) {
    return new Response(JSON.stringify({
      success: false,
      error: `Source inconnue: ${source}`,
      available_sources: Object.keys(SOURCES)
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Vérifier si l'action est valide
  if (!['scrape', 'search', 'details'].includes(action)) {
    return new Response(JSON.stringify({
      success: false,
      error: `Action inconnue: ${action}`,
      available_actions: ['scrape', 'search', 'details']
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Vérifier les paramètres requis
  if (action === 'search' && !query) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Le paramètre "query" est requis pour l\'action "search"'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  if (action === 'details' && !id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Le paramètre "id" est requis pour l\'action "details"'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Vérifier si ParseHub est disponible pour cette source
  const useParseHubClient = useParseHub && PARSEHUB_PROJECTS[source] && PARSEHUB_PROJECTS[source][action];
  
  // Générer la clé de cache
  const cacheKey = generateCacheKey({ source, action, query, id, limit });
  
  // Vérifier si le résultat est en cache
  if (!noCache && env.SCRAPING_CACHE) {
    try {
      const cachedResult = await env.SCRAPING_CACHE.get(cacheKey, { type: 'json' });
      
      if (cachedResult) {
        console.log(`Résultat trouvé en cache pour ${cacheKey}`);
        
        // Ajouter des informations sur le cache
        cachedResult.cached = true;
        cachedResult.cache_key = cacheKey;
        
        return new Response(JSON.stringify(cachedResult), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'max-age=3600'
          }
        });
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du cache: ${error.message}`);
    }
  }
  
  // Si mode asynchrone, ajouter la tâche à la file d'attente
  if (async) {
    try {
      const taskId = await queueManager.addTask({
        source,
        action,
        query,
        id,
        limit,
        debug,
        use_parsehub: useParseHubClient,
        created_at: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({
        success: true,
        task_id: taskId,
        message: 'Tâche ajoutée à la file d\'attente',
        status: 'pending',
        check_url: `${url.origin}${url.pathname}?task_id=${taskId}`
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'ajout de la tâche à la file d'attente: ${error.message}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Erreur lors de l'ajout de la tâche à la file d'attente: ${error.message}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  // Exécution synchrone
  try {
    console.log(`Exécution de l'action ${action} pour la source ${source}`);
    
    // Enregistrer le début de l'opération dans le moniteur
    await monitor.recordOperationStart(source, action);
    
    // Initialiser le scraper approprié
    const ScraperClass = useParseHubClient ? 
      SOURCES[source].parsehubScraper : 
      SOURCES[source].scraper;
    
    if (!ScraperClass) {
      throw new Error(`Scraper non disponible pour ${source}${useParseHubClient ? ' avec ParseHub' : ''}`);
    }
    
    const scraper = new ScraperClass(debug);
    
    // Exécuter l'action demandée
    let result;
    
    if (action === 'search') {
      result = await scraper.search(query, limit, env);
    } else if (action === 'details') {
      if (source === 'mydramalist' || source === 'voirdrama' || source === 'asianwiki') {
        result = await scraper.getDramaDetails(id, env);
      } else if (source === 'voiranime' || source === 'animesama' || source === 'nekosama') {
        result = await scraper.getAnimeDetails(id, env);
      } else if (source === 'coflix' || source === 'vostfree' || source === 'topstream') {
        result = await scraper.getFilmDetails(id, env);
      } else if (source === 'zee5') {
        result = await scraper.getBollywoodDetails(id, env);
      }
    } else {
      result = await scraper.scrape(limit, env);
    }
    
    // Enregistrer la fin de l'opération dans le moniteur
    await monitor.recordOperationEnd(source, action, result.success, result.items_count, result.errors_count);
    
    // Mettre en cache le résultat si disponible
    if (result.success && env.SCRAPING_CACHE) {
      const ttl = CACHE_TTL[action] || 3600;
      
      try {
        await env.SCRAPING_CACHE.put(cacheKey, JSON.stringify(result), {
          expirationTtl: ttl
        });
        
        console.log(`Résultat mis en cache pour ${cacheKey} (TTL: ${ttl}s)`);
      } catch (error) {
        console.error(`Erreur lors de la mise en cache: ${error.message}`);
      }
    }
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=3600'
      }
    });
  } catch (error) {
    console.error(`Erreur lors de l'exécution de l'action ${action} pour la source ${source}: ${error.message}`);
    
    // Enregistrer l'erreur dans le moniteur
    await monitor.recordError(`${source}_${action}`, error.message);
    
    return new Response(JSON.stringify({
      success: false,
      source,
      action,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Traite les tâches en file d'attente
 * @param {Object} env - Environnement Cloudflare Workers
 */
async function processQueuedTasks(env) {
  // Initialiser le gestionnaire de file d'attente
  const queueManager = new ScrapingQueueManager(env);
  
  // Initialiser le moniteur de scraping
  const monitor = new ScrapingMonitor(env);
  
  // Fonction de traitement des tâches
  const processorFn = async (task) => {
    const { source, action, query, id, limit, debug } = task;
    
    // Initialiser le scraper
    const scraperClass = task.use_parsehub ? SOURCES[source].parsehubScraper : SOURCES[source].scraper;
    const scraper = new scraperClass(debug);
    
    // Exécuter l'action demandée
    let result;
    
    if (action === 'search') {
      result = await scraper.search(query, limit, env);
    } else if (action === 'details') {
      if (source === 'mydramalist' || source === 'voirdrama' || source === 'asianwiki') {
        result = await scraper.getDramaDetails(id, env);
      } else if (source === 'voiranime' || source === 'animesama' || source === 'nekosama') {
        result = await scraper.getAnimeDetails(id, env);
      } else if (source === 'coflix' || source === 'vostfree' || source === 'topstream') {
        result = await scraper.getFilmDetails(id, env);
      } else if (source === 'zee5') {
        result = await scraper.getBollywoodDetails(id, env);
      }
    } else {
      result = await scraper.scrape(limit, env);
    }
    
    return result;
  };
  
  // Traiter les tâches en attente
  return await queueManager.processPendingTasks(processorFn, 5);
}

/**
 * Gestionnaire de tâches planifiées
 */
async function handleScheduled(event, env, ctx) {
  console.log('Scheduled event triggered', event);

  // Récupérer les sources à scraper
  const sources = [
    'mydramalist',
    'voiranime',
    'voirdrama',
    'asianwiki',
    'nekosama',
    'animesama',
    'coflix',
    'vostfree',
    'topstream',
    'zee5'
  ];

  // Initialiser le moniteur de scraping
  const monitor = new ScrapingMonitor(env);
  
  // Enregistrer le début du scraping
  const scrapingId = await monitor.startScraping();
  
  try {
    console.log(`Début du scraping planifié (ID: ${scrapingId})`);
    
    // Scraper chaque source
    for (const source of sources) {
      try {
        console.log(`Scraping de la source: ${source}`);
        
        // Récupérer le scraper
        const scraperConfig = SOURCES[source];
        if (!scraperConfig) {
          console.error(`Source inconnue: ${source}`);
          await monitor.logError(scrapingId, `Source inconnue: ${source}`);
          continue;
        }
        
        // Créer une instance du scraper
        const scraperClass = scraperConfig.scraper;
        const scraper = new scraperClass();
        
        // Activer le mode debug
        scraper.enableDebug(true);
        
        // Scraper la source
        const result = await scraper.scrape(50, env);
        
        // Enregistrer les résultats
        await monitor.logSourceResult(scrapingId, source, result);
        
        console.log(`Scraping de ${source} terminé: ${result.items_count} éléments trouvés`);
      } catch (error) {
        console.error(`Erreur lors du scraping de ${source}: ${error.message}`);
        await monitor.logError(scrapingId, `Erreur lors du scraping de ${source}: ${error.message}`);
      }
    }
    
    // Enregistrer la fin du scraping
    await monitor.completeScraping(scrapingId);
    
    console.log(`Scraping planifié terminé (ID: ${scrapingId})`);
  } catch (error) {
    console.error(`Erreur lors du scraping planifié: ${error.message}`);
    await monitor.failScraping(scrapingId, error.message);
  }
}

// Exporter les gestionnaires pour Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
  
  async scheduled(event, env, ctx) {
    return handleScheduled(event, env, ctx);
  }
};
