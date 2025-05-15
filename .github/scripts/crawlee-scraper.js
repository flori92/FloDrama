/**
 * Système de scraping avancé pour FloDrama basé sur Crawlee
 * 
 * Ce script utilise la bibliothèque Crawlee pour extraire des milliers de contenus
 * depuis diverses sources populaires et les rendre disponibles pour FloDrama.
 * 
 * Caractéristiques:
 * - Scraping parallèle de multiples sources
 * - Gestion intelligente du cache
 * - Contournement des protections anti-bot
 * - Extraction basée sur l'IA pour s'adapter aux changements de structure
 * - Support pour les sites nécessitant JavaScript
 */

const fs = require('fs-extra');
const path = require('path');
const { PlaywrightCrawler, CheerioCrawler, Dataset } = require('crawlee');
const cheerio = require('cheerio');

// Importer les modules personnalisés
const { CONFIG, SOURCE_CONFIG } = require('./crawlee/config');
const { checkCache, saveData, chunkArray, formatDuration } = require('./crawlee/utils');
const { getExtractor } = require('./crawlee/extractors');

// Statistiques globales
const stats = {
  total_items: 0,
  sources_processed: 0,
  sources_failed: 0,
  start_time: new Date(),
  end_time: null,
  duration_ms: 0,
  duration_formatted: '',
  categories: {},
  sources: {}
};

/**
 * Fonction principale
 */
async function main() {
  console.log('='.repeat(80));
  console.log(`FloDrama - Système de scraping avancé basé sur Crawlee`);
  console.log('='.repeat(80));
  
  console.log(`\nConfiguration:`);
  console.log(`- Sources à scraper: ${CONFIG.SOURCES.length} (${CONFIG.SOURCES.join(', ')})`);
  console.log(`- Minimum d'éléments par source: ${CONFIG.MIN_ITEMS_PER_SOURCE}`);
  console.log(`- Scraping parallèle: ${CONFIG.PARALLEL_SCRAPING ? 'Oui' : 'Non'}`);
  console.log(`- Nombre maximum de sources en parallèle: ${CONFIG.MAX_CONCURRENT_SOURCES}`);
  console.log(`- Tentatives de retry: ${CONFIG.MAX_RETRIES}`);
  console.log(`- TTL du cache: ${Math.round(CONFIG.CACHE_TTL / 60000)} minutes`);
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  await fs.ensureDir(CONFIG.CACHE_DIR);
  await fs.ensureDir(path.join(CONFIG.OUTPUT_DIR, 'logs'));
  
  // Filtrer les sources configurées
  const sourcesToScrape = CONFIG.SOURCES.filter(source => SOURCE_CONFIG[source]);
  
  if (sourcesToScrape.length === 0) {
    console.error('Aucune source configurée à scraper!');
    return;
  }
  
  console.log(`\n🔍 Démarrage du scraping pour ${sourcesToScrape.length} sources...`);
  
  // Scraper les sources (en parallèle ou séquentiellement)
  if (CONFIG.PARALLEL_SCRAPING) {
    const sourceChunks = chunkArray(sourcesToScrape, CONFIG.MAX_CONCURRENT_SOURCES);
    
    for (const [chunkIndex, chunk] of sourceChunks.entries()) {
      console.log(`\n📦 Traitement du lot ${chunkIndex + 1}/${sourceChunks.length} (${chunk.length} sources)`);
      
      await Promise.all(chunk.map(source => scrapeSource(source)));
    }
  } else {
    for (const source of sourcesToScrape) {
      await scrapeSource(source);
    }
  }
  
  // Calculer la durée totale
  stats.end_time = new Date();
  stats.duration_ms = stats.end_time - stats.start_time;
  stats.duration_formatted = formatDuration(stats.duration_ms);
  
  // Afficher les statistiques détaillées
  console.log('\n📊 Statistiques du scraping:');
  console.log(`⏱️ Durée totale: ${stats.duration_formatted}`);
  console.log(`📦 Total d'éléments: ${stats.total_items}`);
  console.log(`✅ Sources traitées: ${stats.sources_processed}/${sourcesToScrape.length}`);
  console.log(`❌ Sources en échec: ${stats.sources_failed}`);
  
  // Afficher les statistiques par catégorie
  console.log('\n📂 Statistiques par catégorie:');
  for (const [category, count] of Object.entries(stats.categories)) {
    console.log(`- ${category}: ${count} éléments`);
  }
  
  // Sauvegarder les statistiques
  await fs.writeJson(
    path.join(CONFIG.OUTPUT_DIR, 'logs', 'crawlee-stats.json'),
    stats,
    { spaces: 2 }
  );
  
  console.log('\n✨ Scraping terminé avec succès!');
}

/**
 * Scrape une source spécifique
 * @param {string} sourceName - Nom de la source à scraper
 */
async function scrapeSource(sourceName) {
  console.log(`\n🔍 Scraping de ${sourceName}...`);
  
  try {
    const config = SOURCE_CONFIG[sourceName];
    
    if (!config) {
      throw new Error(`Configuration manquante pour la source: ${sourceName}`);
    }
    
    // Vérifier le cache
    const { useCache, cachedData } = await checkCache(sourceName);
    
    if (useCache) {
      console.log(`[${sourceName}] Utilisation des données en cache (${cachedData.length} éléments)`);
      
      // Mettre à jour les statistiques
      stats.total_items += cachedData.length;
      stats.sources_processed++;
      
      // Mettre à jour les statistiques par catégorie
      const category = config.type || 'unknown';
      stats.categories[category] = (stats.categories[category] || 0) + cachedData.length;
      
      // Mettre à jour les statistiques par source
      stats.sources[sourceName] = {
        items: cachedData.length,
        success: true,
        cached: true
      };
      
      return cachedData;
    }
    
    // Scraper les données en direct
    console.log(`[${sourceName}] Scraping en direct...`);
    
    // Sélectionner le type de crawler approprié
    const items = await (config.extractorType === 'playwright' 
      ? scrapeWithPlaywright(sourceName, config)
      : scrapeWithCheerio(sourceName, config));
    
    if (!items || items.length === 0) {
      throw new Error(`Aucun élément récupéré depuis ${sourceName}`);
    }
    
    console.log(`[${sourceName}] ${items.length} éléments récupérés`);
    
    // Vérifier si le nombre d'éléments est suffisant
    if (items.length < CONFIG.MIN_ITEMS_PER_SOURCE) {
      console.warn(`[${sourceName}] Attention: Nombre d'éléments insuffisant (${items.length}/${CONFIG.MIN_ITEMS_PER_SOURCE})`);
      
      // Si nous avons des données en cache, les utiliser comme fallback
      if (cachedData && cachedData.length > items.length) {
        console.log(`[${sourceName}] Utilisation des données en cache comme fallback (${cachedData.length} éléments)`);
        
        // Mettre à jour les statistiques
        stats.total_items += cachedData.length;
        stats.sources_processed++;
        
        // Mettre à jour les statistiques par catégorie
        const category = config.type || 'unknown';
        stats.categories[category] = (stats.categories[category] || 0) + cachedData.length;
        
        // Mettre à jour les statistiques par source
        stats.sources[sourceName] = {
          items: cachedData.length,
          success: true,
          cached: true,
          fallback: true
        };
        
        // Sauvegarder les données
        await saveData(sourceName, cachedData);
        
        return cachedData;
      }
    }
    
    // Sauvegarder les données
    await saveData(sourceName, items);
    
    // Mettre à jour les statistiques
    stats.total_items += items.length;
    stats.sources_processed++;
    
    // Mettre à jour les statistiques par catégorie
    const category = config.type || 'unknown';
    stats.categories[category] = (stats.categories[category] || 0) + items.length;
    
    // Mettre à jour les statistiques par source
    stats.sources[sourceName] = {
      items: items.length,
      success: true,
      cached: false
    };
    
    return items;
  } catch (error) {
    console.error(`[${sourceName}] Erreur: ${error.message}`);
    stats.sources_failed++;
    
    // Mettre à jour les statistiques par source
    stats.sources[sourceName] = {
      items: 0,
      success: false,
      error: error.message
    };
    
    return [];
  }
}

/**
 * Scrape une source avec Playwright (pour les sites nécessitant JavaScript)
 * @param {string} sourceName - Nom de la source
 * @param {Object} config - Configuration de la source
 * @returns {Promise<Array>} - Éléments récupérés
 */
async function scrapeWithPlaywright(sourceName, config) {
  console.log(`[${sourceName}] Utilisation de Playwright pour le scraping...`);
  
  // Créer un dataset pour stocker les résultats
  const datasetName = sourceName;
  await Dataset.open(datasetName);
  
  // Récupérer l'extracteur approprié
  const extractor = getExtractor(sourceName);
  
  // Initialiser le crawler
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: config.pagination?.maxPages || 1,
    maxRequestRetries: CONFIG.MAX_RETRIES,
    
    // Configuration avancée pour éviter la détection
    launchContext: {
      launchOptions: {
        headless: true,
        args: [
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--disable-gpu'
        ]
      }
    },
    
    // Fonction d'extraction
    async requestHandler({ page, request, enqueueLinks }) {
      console.log(`[${sourceName}] Scraping de ${request.url}`);
      
      // Simuler un comportement humain
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.setExtraHTTPHeaders(CONFIG.BROWSER_HEADERS);
      await page.waitForTimeout(Math.random() * 2000 + 1000);
      
      // Attendre que le contenu soit chargé
      if (config.waitForSelector) {
        await page.waitForSelector(config.selector || config.waitForSelector);
      } else {
        await page.waitForLoadState('networkidle');
      }
      
      // Extraction des données
      const items = await page.evaluate((selector, sourceName, configStr) => {
        const config = JSON.parse(configStr);
        const items = [];
        
        // Sélectionner tous les éléments correspondants
        document.querySelectorAll(selector).forEach((element, index) => {
          try {
            // Extraire les données de base
            const link = element.querySelector('a');
            const img = element.querySelector('img');
            const title = element.querySelector('h2, h3, .title, .name') || link;
            
            if (!link || !title) return;
            
            // Extraire l'URL et l'ID
            const url = link.href;
            const id = url ? url.split('/').pop() : `${sourceName}_${index}`;
            
            // Extraire le titre
            const titleText = title.innerText?.trim() || link.getAttribute('title') || '';
            
            // Extraire l'image
            const poster = img?.src || img?.getAttribute('data-src') || img?.getAttribute('data-original') || '';
            
            // Extraire l'année et la note
            const fullText = element.innerText || '';
            const yearMatch = fullText.match(/\b(20\d{2}|19\d{2})\b/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
            
            const ratingMatch = fullText.match(/([0-9](\.[0-9])?|10(\.0)?)\s*\/\s*10/) || 
                                fullText.match(/([0-9](\.[0-9])?|10(\.0)?)/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
            
            // Créer l'objet item
            items.push({
              id: `${sourceName}_${id}`,
              title: titleText,
              original_title: titleText,
              url: url,
              poster: poster,
              backdrop: poster,
              year: year,
              rating: rating,
              source: sourceName,
              type: config.type || 'unknown',
              language: config.language || 'multi',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } catch (error) {
            console.error(`Erreur lors de l'extraction: ${error.message}`);
          }
        });
        
        return items;
      }, config.selector, sourceName, JSON.stringify(config));
      
      // Sauvegarder les données dans le dataset
      await Dataset.pushData(items);
      
      // Si la pagination est activée, ajouter les pages suivantes à la file d'attente
      if (config.pagination?.enabled && request.userData.page < (config.pagination.maxPages || 1)) {
        const nextPage = (request.userData.page || 1) + 1;
        const nextUrl = `${config.pagination.baseUrl}${nextPage}`;
        
        await crawler.addRequests([{
          url: nextUrl,
          userData: { page: nextPage }
        }]);
      }
    },
    
    // Gestion des erreurs
    failedRequestHandler({ request, error }) {
      console.error(`[${sourceName}] Erreur lors du scraping de ${request.url}: ${error.message}`);
    }
  });
  
  // Démarrer le crawling
  await crawler.run([{
    url: config.url,
    userData: { page: 1 }
  }]);
  
  // Récupérer les données
  const dataset = await Dataset.open(datasetName);
  const results = await dataset.getData();
  
  return results.items.flat();
}

/**
 * Scrape une source avec Cheerio (pour les sites statiques)
 * @param {string} sourceName - Nom de la source
 * @param {Object} config - Configuration de la source
 * @returns {Promise<Array>} - Éléments récupérés
 */
async function scrapeWithCheerio(sourceName, config) {
  console.log(`[${sourceName}] Utilisation de Cheerio pour le scraping...`);
  
  // Créer un dataset pour stocker les résultats
  const datasetName = sourceName;
  await Dataset.open(datasetName);
  
  // Récupérer l'extracteur approprié
  const extractor = getExtractor(sourceName);
  
  // Initialiser le crawler
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: config.pagination?.maxPages || 1,
    maxRequestRetries: CONFIG.MAX_RETRIES,
    
    // Configuration pour éviter la détection
    headerGeneratorOptions: {
      browsers: [
        { name: 'chrome', minVersion: 87, maxVersion: 89 },
        { name: 'firefox', minVersion: 84 }
      ],
      devices: ['desktop'],
      locales: ['fr-FR', 'en-US']
    },
    
    // Fonction d'extraction
    async requestHandler({ $, request, enqueueLinks }) {
      console.log(`[${sourceName}] Scraping de ${request.url}`);
      
      // Sélectionner tous les éléments correspondants
      const elements = $(config.selector);
      console.log(`[${sourceName}] ${elements.length} éléments trouvés sur la page`);
      
      const items = [];
      
      // Extraire les données de chaque élément
      elements.each((index, element) => {
        try {
          const item = extractor($, element, sourceName, config);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          console.error(`[${sourceName}] Erreur lors de l'extraction: ${error.message}`);
        }
      });
      
      // Sauvegarder les données dans le dataset
      await Dataset.pushData(items);
      
      // Si la pagination est activée, ajouter les pages suivantes à la file d'attente
      if (config.pagination?.enabled && request.userData.page < (config.pagination.maxPages || 1)) {
        const nextPage = (request.userData.page || 1) + 1;
        const nextUrl = `${config.pagination.baseUrl}${nextPage}`;
        
        await crawler.addRequests([{
          url: nextUrl,
          userData: { page: nextPage }
        }]);
      }
    },
    
    // Gestion des erreurs
    failedRequestHandler({ request, error }) {
      console.error(`[${sourceName}] Erreur lors du scraping de ${request.url}: ${error.message}`);
    }
  });
  
  // Démarrer le crawling
  await crawler.run([{
    url: config.url,
    userData: { page: 1 }
  }]);
  
  // Récupérer les données
  const dataset = await Dataset.open(datasetName);
  const results = await dataset.getData();
  
  return results.items.flat();
}

// Exécuter la fonction principale
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
