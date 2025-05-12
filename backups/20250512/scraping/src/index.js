/**
 * FloDrama Scraper Worker - Version avec ScrapingOwl
 */

// Importation des modules nécessaires
const { RelayClient } = require('./relay-client');
const { ScrapingOwlClient } = require('./scrapeowl-client');
const { MyDramaListScraper } = require('./html-scraper');
const { VoirAnimeScraper } = require('./html-scraper');
const { VoirDramaScraper, AsianWikiScraper } = require('./drama-scrapers');
const { NekoSamaScraper, AnimeSamaScraper } = require('./anime-scrapers');
const { CoflixScraper, VostFreeScraper, TopStreamScraper } = require('./film-scrapers');
const { Zee5Scraper } = require('./bollywood-scrapers');
const ScrapingQueueManager = require('./queue-manager');
const ScrapingMonitor = require('./scraping-monitor');

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

// Initialiser les clients de scraping
let relayClient = null;
let scrapeowlClient = null;

/**
 * Initialise les clients de scraping
 * @param {Object} env - Variables d'environnement
 */
function initScrapingClients(env) {
  // Initialiser le client de relais si nécessaire
  if (!relayClient) {
    relayClient = new RelayClient();
  }
  
  // Initialiser le client ScrapingOwl si nécessaire
  if (!scrapeowlClient && env && env.SCRAPEOWL_API_KEY) {
    scrapeowlClient = new ScrapingOwlClient(env.SCRAPEOWL_API_KEY, true);
  }
}

// Endpoint de santé pour vérifier l'état du Worker
async function handleHealthCheck(env) {
  try {
    // Initialiser les clients de scraping
    initScrapingClients(env);
    
    // Vérifier si le Worker est opérationnel
    const timestamp = new Date().toISOString();
    
    return {
      success: true,
      status: 'ok',
      timestamp,
      version: '2.0.0',
      message: 'Worker opérationnel avec support ScrapingOwl',
      relay_client: !!relayClient,
      scrapeowl_client: !!scrapeowlClient
    };
  } catch (error) {
    return {
      success: false,
      error: `Erreur générale: ${error.message}`,
      stack: error.stack
    };
  }
}

/**
 * Gestionnaire pour les requêtes de scraping
 */
async function handleScraping(request, env) {
  try {
    // Initialiser les clients de scraping
    initScrapingClients(env);
    
    // Extraire les paramètres de la requête
    const url = new URL(request.url);
    const source = url.searchParams.get('source') || 'mydramalist';
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    const debug = url.searchParams.get('debug') === 'true';
    const useScrapingOwl = url.searchParams.get('use_scrapeowl') === 'true';
    
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
    
    // Initialiser le scraper approprié
    const ScraperClass = SOURCES[source].scraper;
    
    if (!ScraperClass) {
      throw new Error(`Scraper non disponible pour ${source}`);
    }
    
    const scraper = new ScraperClass(debug);
    
    // Injecter les clients de scraping dans le scraper
    if (scraper.setRelayClient && relayClient) {
      scraper.setRelayClient(relayClient);
    }
    
    if (scraper.setScrapingOwlClient && scrapeowlClient && useScrapingOwl) {
      scraper.setScrapingOwlClient(scrapeowlClient);
    }
    
    // Scraper la source
    const result = await scraper.scrape(limit, env);
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error(`Erreur lors du scraping: ${error.message}`);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Erreur lors du scraping: ${error.message}`,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Exportation du Worker
export default {
  async fetch(request, env, ctx) {
    // Gérer les requêtes CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    // Vérifier si c'est une requête de santé
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      const healthStatus = await handleHealthCheck(env);
      return new Response(JSON.stringify(healthStatus), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Gérer les requêtes de scraping
    return handleScraping(request, env);
  }
};
