/**
 * Scraper FloDrama pour Cloudflare Workers
 * 
 * Ce Worker effectue le scraping de différentes sources de contenu (MyDramaList, VoirAnime, etc.)
 * et enregistre les résultats dans Cloudflare D1.
 * Il télécharge également les images et les stocke dans R2.
 */

import { MyDramaListScraper, VoirAnimeScraper } from './advanced-scraper.js';

// Liste des scrapers supportés
const AVAILABLE_SOURCES = ['mydramalist', 'voiranime'];

/**
 * Gestionnaire de requêtes pour le Worker
 */
export default {
  /**
   * Fonction principale du Worker
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const source = url.searchParams.get('source') || 'mydramalist';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const debug = url.searchParams.get('debug') === 'true';
    
    // Vérification de la source
    if (!AVAILABLE_SOURCES.includes(source)) {
      return new Response(
        JSON.stringify({ 
          error: `Source "${source}" non supportée`,
          available_sources: AVAILABLE_SOURCES 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      );
    }
    
    try {
      // Création du scraper approprié
      let scraper;
      
      if (source === 'mydramalist') {
        scraper = new MyDramaListScraper(env);
      } else if (source === 'voiranime') {
        scraper = new VoirAnimeScraper(env);
      }
      
      // Activation du mode debug si demandé
      if (debug) {
        scraper.enableDebug();
      }
      
      // Lancement du scraping
      const result = await scraper.scrape(limit);
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' }}
      );
    } catch (error) {
      console.error(`Erreur lors du scraping: ${error.message}`);
      
      return new Response(
        JSON.stringify({ 
          error: error.message,
          stack: debug ? error.stack : undefined
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
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
