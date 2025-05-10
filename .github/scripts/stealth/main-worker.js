/**
 * Scraper FloDrama pour Cloudflare Workers
 * 
 * Ce Worker effectue le scraping de différentes sources de contenu pour FloDrama
 * et expose les résultats via une API REST.
 * 
 * Supporte 15 sources différentes réparties en 4 catégories :
 * - Dramas : vostfree, dramacool, myasiantv, voirdrama, viki, wetv, iqiyi, kocowa
 * - Animes : gogoanime, voiranime, nekosama
 * - Bollywood : bollywoodmdb, zee5, hotstar
 * - Métadonnées : mydramalist
 */

// Import des différents scrapers
import { MyDramaListScraper } from './metadata-scrapers.js';
import { VostfreeScraper, DramacoolScraper, MyAsianTVScraper, VoirdramaScraper, VikiScraper, WetvScraper, IqiyiScraper, KocowaScraper } from './drama-scrapers.js';
import { GogoanimeScaper, VoirAnimeScraper, NekosamaScraper } from './anime-scrapers.js';
import { BollywoodMDBScraper, Zee5Scraper, HotstarScraper } from './bollywood-scrapers.js';

// Liste des scrapers supportés
const AVAILABLE_SOURCES = [
  // Dramas
  'vostfree', 'dramacool', 'myasiantv', 'voirdrama', 'viki', 'wetv', 'iqiyi', 'kocowa',
  // Animes
  'gogoanime', 'voiranime', 'nekosama',
  // Bollywood
  'bollywoodmdb', 'zee5', 'hotstar',
  // Métadonnées
  'mydramalist'
];

/**
 * Obtient la catégorie d'une source
 * @param {string} source - Nom de la source
 * @returns {string} - Catégorie (dramas, animes, bollywood, films, metadata)
 */
function getCategoryForSource(source) {
  // Mapping des sources aux catégories
  const sourceCategories = {
    // Dramas
    'vostfree': 'dramas',
    'dramacool': 'dramas',
    'myasiantv': 'dramas',
    'voirdrama': 'dramas',
    'viki': 'dramas',
    'wetv': 'dramas',
    'iqiyi': 'dramas',
    'kocowa': 'dramas',
    
    // Animes
    'gogoanime': 'animes',
    'voiranime': 'animes',
    'nekosama': 'animes',
    
    // Bollywood
    'bollywoodmdb': 'bollywood',
    'zee5': 'bollywood',
    'hotstar': 'bollywood',
    
    // Métadonnées
    'mydramalist': 'metadata'
  };
  
  return sourceCategories[source] || 'unknown';
}

/**
 * Gestionnaire de requêtes pour le Worker
 */
export default {
  /**
   * Fonction principale du Worker
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Point d'entrée pour la vérification de santé
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), 
        { status: 200, headers: { 'Content-Type': 'application/json' }})
    }
    
    // Gestion des requêtes CORS
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
    
    // Paramètres de la requête
    const source = url.searchParams.get('source') || 'mydramalist';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10); // Augmentation de la limite par défaut à 100
    const timeout = parseInt(url.searchParams.get('timeout') || '30', 10); // Timeout en secondes
    const detailed = url.searchParams.get('detailed') === 'true';
    const debug = url.searchParams.get('debug') === 'true';
    
    // Vérification de la source
    if (!AVAILABLE_SOURCES.includes(source)) {
      return new Response(
        JSON.stringify({ 
          error: `Source "${source}" non supportée`,
          available_sources: AVAILABLE_SOURCES 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    try {
      // Création du scraper approprié
      let scraper;
      
      // Sélection du scraper en fonction de la source
      switch (source) {
        // Dramas
        case 'vostfree':
          scraper = new VostfreeScraper(env);
          break;
        case 'dramacool':
          scraper = new DramacoolScraper(env);
          break;
        case 'myasiantv':
          scraper = new MyAsianTVScraper(env);
          break;
        case 'voirdrama':
          scraper = new VoirdramaScraper(env);
          break;
        case 'viki':
          scraper = new VikiScraper(env);
          break;
        case 'wetv':
          scraper = new WetvScraper(env);
          break;
        case 'iqiyi':
          scraper = new IqiyiScraper(env);
          break;
        case 'kocowa':
          scraper = new KocowaScraper(env);
          break;
          
        // Animes
        case 'gogoanime':
          scraper = new GogoanimeScaper(env);
          break;
        case 'voiranime':
          scraper = new VoirAnimeScraper(env);
          break;
        case 'nekosama':
          scraper = new NekosamaScraper(env);
          break;
          
        // Bollywood
        case 'bollywoodmdb':
          scraper = new BollywoodMDBScraper(env);
          break;
        case 'zee5':
          scraper = new Zee5Scraper(env);
          break;
        case 'hotstar':
          scraper = new HotstarScraper(env);
          break;
          
        // Métadonnées
        case 'mydramalist':
        default:
          scraper = new MyDramaListScraper(env);
          break;
      }
      
      // Configuration du scraper
      if (debug) {
        scraper.enableDebug();
      }
      
      // Définir le timeout si spécifié
      if (timeout > 0) {
        scraper.setTimeout(timeout * 1000);
      }
      
      // Activer le mode détaillé si demandé
      if (detailed) {
        scraper.enableDetailedMode();
      }
      
      // Lancement du scraping avec timeout
      const result = await Promise.race([
        scraper.scrape(limit),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout après ${timeout} secondes`)), timeout * 1000))
      ]);
      
      // Ajouter des métadonnées au résultat
      const enhancedResult = {
        ...result,
        metadata: {
          source,
          timestamp: new Date().toISOString(),
          limit,
          count: result.results ? result.results.length : 0,
          version: '2.0.0',
          api: 'FloDrama Scraper API'
        }
      };
      
      // Réponse avec en-têtes CORS
      return new Response(
        JSON.stringify(enhancedResult),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300',  // Cache de 5 minutes
            'X-FloDrama-Source': source,
            'X-FloDrama-Items-Count': enhancedResult.metadata.count.toString()
          }
        }
      );
    } catch (error) {
      console.error(`Erreur lors du scraping de ${source}: ${error.message}`);
      
      // Générer des données de secours si demandé
      const fallbackParam = url.searchParams.get('fallback');
      if (fallbackParam === 'true' || fallbackParam === '1') {
        try {
          console.log(`Génération de données de secours pour ${source}`);
          
          // Créer des données de secours
          const fallbackResults = [];
          const category = getCategoryForSource(source);
          
          for (let i = 1; i <= limit; i++) {
            fallbackResults.push({
              id: `${source}-fallback-${i}`,
              title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${i} (Fallback)`,
              description: `Contenu de secours généré automatiquement suite à une erreur: ${error.message}`,
              poster: `/placeholders/${category}-poster.jpg`,
              backdrop: `/placeholders/${category}-backdrop.jpg`,
              rating: (Math.random() * 3 + 7).toFixed(1),
              year: 2024 - Math.floor(Math.random() * 5),
              source: source,
              is_fallback: true
            });
          }
          
          const fallbackResponse = {
            results: fallbackResults,
            metadata: {
              source,
              timestamp: new Date().toISOString(),
              limit,
              count: fallbackResults.length,
              version: '2.0.0',
              api: 'FloDrama Scraper API',
              is_fallback: true,
              error: error.message
            }
          };
          
          return new Response(
            JSON.stringify(fallbackResponse),
            { 
              status: 200, 
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60',  // Cache court pour les données de secours
                'X-FloDrama-Source': source,
                'X-FloDrama-Fallback': 'true',
                'X-FloDrama-Items-Count': fallbackResults.length.toString()
              }
            }
          );
        } catch (fallbackError) {
          console.error(`Erreur lors de la génération des données de secours: ${fallbackError.message}`);
        }
      }
      
      // Réponse d'erreur avec en-têtes CORS
      return new Response(
        JSON.stringify({ 
          error: error.message,
          source,
          timestamp: new Date().toISOString(),
          stack: debug ? error.stack : undefined
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
  },
  
  /**
   * Gestionnaire pour le Cron Trigger
   */
  async scheduled(event, env, ctx) {
    // Logging du démarrage de la tâche programmée
    console.log(`Démarrage du scraping programmé: ${new Date().toISOString()}`);
    
    // Création des scrapers pour chaque source
    const scrapers = [
      new MyDramaListScraper(env),
      new VoirAnimeScraper(env)
    ];
    
    // Lancement du scraping pour chaque source en séquentiel pour éviter les blocages
    const results = [];
    
    for (const scraper of scrapers) {
      try {
        console.log(`Lancement du scraping pour la source: ${scraper.source}`);
        const result = await scraper.scrape(30);
        results.push({
          status: 'success',
          source: scraper.source,
          data: result
        });
      } catch (error) {
        console.error(`Erreur lors du scraping de ${scraper.source}: ${error.message}`);
        results.push({
          status: 'error',
          source: scraper.source,
          error: error.message
        });
      }
      
      // Pause entre les sources pour éviter de surcharger les Workers
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Analyse des résultats
    const success = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`Scraping programmé terminé: ${success} succès, ${failed} échecs`);
    console.log(`Détails: ${JSON.stringify(results)}`);
  }
};
