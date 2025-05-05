/**
 * FloDrama Scraper Worker
 * 
 * Ce worker permet de scraper les données de MyDramaList et VoirAnime
 * en utilisant un serveur relais Python hébergé sur Render.
 */

import { MyDramaListScraper, VoirAnimeScraper } from './html-scraper';
import ScrapingQueueManager from './queue-manager';
import ScrapingMonitor from './monitoring';

// Configuration des sources
const SOURCES = {
  mydramalist: {
    name: 'MyDramaList',
    scraper: MyDramaListScraper,
    contentType: 'drama'
  },
  voiranime: {
    name: 'VoirAnime',
    scraper: VoirAnimeScraper,
    contentType: 'anime'
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
  
  // Récupérer l'URL de la requête
  const url = new URL(request.url);
  
  // Vérifier si c'est une requête de debug
  const debug = url.searchParams.get('debug') === 'true';
  
  // Récupérer la source à scraper
  const source = url.searchParams.get('source') || 'mydramalist';
  
  // Récupérer l'action à effectuer
  const action = url.searchParams.get('action') || 'scrape';
  
  // Récupérer la limite de résultats
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  
  // Récupérer le terme de recherche (pour l'action search)
  const query = url.searchParams.get('query') || '';
  
  // Récupérer l'ID du contenu (pour l'action details)
  const id = url.searchParams.get('id') || '';
  
  // Vérifier si c'est une requête de statut de tâche
  const taskId = url.searchParams.get('task_id');
  
  // Vérifier si c'est une requête de statistiques
  const statsRequested = url.searchParams.get('stats') === 'true';
  
  // Vérifier si c'est une requête asynchrone
  const async = url.searchParams.get('async') === 'true';
  
  // Paramètres pour la génération de la clé de cache
  const cacheParams = { source, action, query, id, limit };
  
  // Mesurer le temps d'exécution
  const startTime = Date.now();
  
  // Vérifier si c'est une requête de statistiques
  if (statsRequested) {
    const stats = await monitor.getScrapingStats();
    
    return new Response(JSON.stringify({
      success: true,
      stats
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  // Vérifier si c'est une requête de statut de tâche
  if (taskId) {
    const task = await queueManager.getTask(taskId);
    
    if (!task) {
      return new Response(JSON.stringify({
        success: false,
        error: `Tâche non trouvée: ${taskId}`
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      task
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  // Vérifier si la source est valide
  if (!SOURCES[source]) {
    return new Response(JSON.stringify({
      success: false,
      error: `Source invalide: ${source}. Sources disponibles: ${Object.keys(SOURCES).join(', ')}`
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  try {
    // Si c'est une requête asynchrone, ajouter la tâche à la file d'attente
    if (async) {
      const task = {
        source,
        action,
        query,
        id,
        limit,
        debug
      };
      
      const taskId = await queueManager.enqueue(task);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Tâche ajoutée à la file d\'attente',
        task_id: taskId
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Générer la clé de cache
    const cacheKey = generateCacheKey(cacheParams);
    
    // Vérifier si les données sont en cache
    if (env.SCRAPING_RESULTS && !debug) {
      const cachedData = await env.SCRAPING_RESULTS.get(cacheKey);
      
      if (cachedData) {
        console.log(`Données récupérées depuis le cache pour la clé: ${cacheKey}`);
        
        // Mettre à jour les statistiques de cache
        await monitor.updateCacheStats(true);
        
        // Enregistrer la requête dans le moniteur
        const duration = Date.now() - startTime;
        await monitor.recordScrapingRequest(source, action, true, duration, true);
        
        return new Response(cachedData, {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        });
      }
    }
    
    // Initialiser le scraper
    const scraperClass = SOURCES[source].scraper;
    const scraper = new scraperClass(debug);
    
    // Exécuter l'action demandée
    let result;
    
    if (action === 'search') {
      // Action de recherche
      if (!query) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Paramètre query requis pour l\'action search'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      result = await scraper.search(query, limit);
    } else if (action === 'details') {
      // Action de récupération des détails
      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Paramètre id requis pour l\'action details'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (source === 'mydramalist') {
        result = await scraper.getDramaDetails(id);
      } else if (source === 'voiranime') {
        result = await scraper.getAnimeDetails(id);
      }
    } else {
      // Action de scraping par défaut
      result = await scraper.scrape(limit);
    }
    
    // Convertir le résultat en JSON
    const resultJson = JSON.stringify(result);
    
    // Stocker les données dans le cache
    if (env.SCRAPING_RESULTS && result.success !== false) {
      const ttl = CACHE_TTL[action] || CACHE_TTL.scrape;
      await env.SCRAPING_RESULTS.put(cacheKey, resultJson, { expirationTtl: ttl });
      console.log(`Données mises en cache pour la clé: ${cacheKey} (TTL: ${ttl} secondes)`);
    }
    
    // Calculer la durée d'exécution
    const duration = Date.now() - startTime;
    
    // Mettre à jour la durée moyenne
    await monitor.updateAverageDuration(duration);
    
    // Enregistrer la requête dans le moniteur
    await monitor.recordScrapingRequest(source, action, true, duration, false);
    
    // Retourner le résultat
    return new Response(resultJson, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Duration': duration.toString()
      }
    });
  } catch (error) {
    // En cas d'erreur, retourner une réponse d'erreur
    console.error(`Erreur lors du scraping: ${error.message}`);
    
    // Calculer la durée d'exécution
    const duration = Date.now() - startTime;
    
    // Enregistrer l'erreur dans le moniteur
    await monitor.recordError(source, error.message, { action, query, id, limit });
    
    // Enregistrer la requête dans le moniteur
    await monitor.recordScrapingRequest(source, action, false, duration, false);
    
    return new Response(JSON.stringify({
      success: false,
      source,
      error: error.message,
      stack: debug ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Duration': duration.toString()
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
    const scraperClass = SOURCES[source].scraper;
    const scraper = new scraperClass(debug);
    
    // Exécuter l'action demandée
    let result;
    
    if (action === 'search') {
      result = await scraper.search(query, limit);
    } else if (action === 'details') {
      if (source === 'mydramalist') {
        result = await scraper.getDramaDetails(id);
      } else if (source === 'voiranime') {
        result = await scraper.getAnimeDetails(id);
      }
    } else {
      result = await scraper.scrape(limit);
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
  console.log('Exécution de la tâche planifiée de scraping');
  
  // Initialiser le moniteur de scraping
  const monitor = new ScrapingMonitor(env);
  
  // Ping le serveur relais pour le maintenir actif
  await keepRelayAlive(RELAY_URL, monitor);
  
  try {
    // Traiter les tâches en file d'attente
    const queueResults = await processQueuedTasks(env);
    console.log(`Traitement des tâches en file d'attente: ${JSON.stringify(queueResults)}`);
    
    // Scraper MyDramaList
    const mdlScraper = new MyDramaListScraper(true);
    const mdlResult = await mdlScraper.scrape(20);
    
    console.log(`Scraping MyDramaList terminé: ${mdlResult.items_count} dramas récupérés`);
    
    // Scraper VoirAnime
    const vaScraper = new VoirAnimeScraper(true);
    const vaResult = await vaScraper.scrape(20);
    
    console.log(`Scraping VoirAnime terminé: ${vaResult.items_count} animes récupérés`);
    
    // Stocker les résultats dans KV (si disponible)
    if (env.SCRAPING_RESULTS) {
      await env.SCRAPING_RESULTS.put('mydramalist_latest', JSON.stringify(mdlResult), { expirationTtl: CACHE_TTL.scrape });
      await env.SCRAPING_RESULTS.put('voiranime_latest', JSON.stringify(vaResult), { expirationTtl: CACHE_TTL.scrape });
      await env.SCRAPING_RESULTS.put('last_scraping', new Date().toISOString(), { expirationTtl: 60 * 60 * 24 * 7 });
    }
    
    // Enregistrer les métriques de scraping
    await monitor.recordMetric('scheduled_scraping', mdlResult.items_count + vaResult.items_count, {
      mydramalist_count: mdlResult.items_count,
      voiranime_count: vaResult.items_count
    });
    
    return {
      success: true,
      queue_results: queueResults,
      mydramalist: {
        items_count: mdlResult.items_count,
        errors_count: mdlResult.errors_count
      },
      voiranime: {
        items_count: vaResult.items_count,
        errors_count: vaResult.errors_count
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la tâche planifiée: ${error.message}`);
    
    // Enregistrer l'erreur dans le moniteur
    await monitor.recordError('scheduled_task', error.message);
    
    return {
      success: false,
      error: error.message
    };
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
