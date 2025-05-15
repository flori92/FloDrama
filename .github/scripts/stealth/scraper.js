/**
 * Scraper furtif pour FloDrama
 * 
 * Ce script utilise des techniques avancées pour contourner les protections anti-scraping
 * et récupérer des milliers de contenus pour l'application FloDrama
 */

const fs = require('fs-extra');
const path = require('path');
const { chromium } = require('playwright');
const cheerio = require('cheerio');
const { randomDelay, getRandomUserAgent } = require('./utils');
const { extractData } = require('./extractors');
const { SOURCES } = require('./sources');

// Configuration
const CONFIG = {
  OUTPUT_DIR: './Frontend/src/data/content',
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  STEALTH_MODE: true,
  PROXY_ROTATION: false,
  MAX_RETRIES: 3,
  BROWSER_ARGS: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-sandbox',
    '--disable-web-security'
  ]
};

// Statistiques
const stats = {
  total_items: 0,
  sources_processed: 0,
  sources_failed: 0,
  categories: {},
  start_time: new Date()
};

/**
 * Fonction principale
 */
async function main() {
  console.log('='.repeat(80));
  console.log(`FloDrama - Scraper Furtif`);
  console.log('='.repeat(80));
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  for (const category of CONFIG.CATEGORIES) {
    await fs.ensureDir(path.join(CONFIG.OUTPUT_DIR, category));
  }
  
  console.log(`\n🔍 Démarrage du scraping pour ${SOURCES.length} sources...`);
  
  // Lancer un navigateur unique pour toutes les sources
  const browser = await chromium.launch({
    headless: true,
    args: CONFIG.BROWSER_ARGS
  });
  
  try {
    // Traiter chaque source séquentiellement
    for (const source of SOURCES) {
      await scrapeSource(browser, source);
    }
    
    // Générer les fichiers par catégorie
    await generateCategoryFiles();
    
  } finally {
    // Fermer le navigateur
    await browser.close();
  }
  
  // Calculer la durée totale
  stats.end_time = new Date();
  stats.duration_ms = stats.end_time - stats.start_time;
  stats.duration_formatted = formatDuration(stats.duration_ms);
  
  // Afficher les statistiques
  console.log('\n📊 Statistiques du scraping:');
  console.log(`⏱️ Durée totale: ${stats.duration_formatted}`);
  console.log(`📦 Total d'éléments: ${stats.total_items}`);
  console.log(`✅ Sources traitées: ${stats.sources_processed}/${SOURCES.length}`);
  console.log(`❌ Sources en échec: ${stats.sources_failed}`);
  
  // Afficher les statistiques par catégorie
  console.log('\n📂 Statistiques par catégorie:');
  for (const [category, count] of Object.entries(stats.categories)) {
    console.log(`- ${category}: ${count} éléments`);
  }
  
  console.log('\n✨ Scraping terminé avec succès!');
}

/**
 * Scrape une source spécifique
 * @param {Browser} browser - Instance du navigateur
 * @param {Object} source - Configuration de la source
 * @returns {Promise<boolean>} - Succès ou échec
 */
async function scrapeSource(browser, source) {
  console.log(`\n🔍 Scraping de ${source.name}...`);
  
  const allItems = [];
  let success = false;
  
  try {
    // Créer un contexte avec des paramètres furtifs
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      geolocation: { longitude: 2.3488, latitude: 48.8534 },
      permissions: ['geolocation'],
      colorScheme: 'light',
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/'
      }
    });
    
    // Ajouter des scripts pour masquer l'automatisation
    await context.addInitScript(() => {
      // Masquer WebDriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
      // Masquer Chrome
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // Masquer les fonctions d'automatisation
      window.navigator.permissions.query = (parameters) => 
        parameters.name === 'notifications' 
          ? Promise.resolve({ state: Notification.permission }) 
          : Promise.resolve({ state: 'prompt' });
      
      // Ajouter des plugins factices
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5].map(() => ({
          0: { type: 'application/x-google-chrome-pdf' },
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          name: 'Chrome PDF Plugin'
        }))
      });
    });
    
    // Créer une page
    const page = await context.newPage();
    
    // Parcourir toutes les URLs de la source
    for (const url of source.urls) {
      try {
        console.log(`[${source.name}] Scraping de ${url}`);
        
        // Naviguer vers l'URL
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Simuler un comportement humain
        await randomDelay(1000, 3000);
        await page.mouse.move(Math.random() * 500, Math.random() * 500);
        await page.mouse.wheel(0, Math.random() * 300);
        
        // Faire défiler la page pour charger tout le contenu
        await autoScroll(page);
        
        // Attendre un sélecteur spécifique si nécessaire
        if (source.waitForSelector) {
          await page.waitForSelector(source.waitForSelector, { timeout: 10000 })
            .catch(() => console.log(`[${source.name}] Sélecteur ${source.waitForSelector} non trouvé, on continue`));
        }
        
        // Récupérer le HTML
        const html = await page.content();
        
        // Extraire les données
        const items = extractData(source.name, html, { url, selector: source.selector });
        
        console.log(`[${source.name}] ${items.length} éléments récupérés depuis ${url}`);
        
        if (items.length > 0) {
          allItems.push(...items);
          success = true;
        }
        
        // Attendre entre chaque URL
        await randomDelay(3000, 5000);
      } catch (error) {
        console.error(`[${source.name}] Erreur lors du scraping de ${url}: ${error.message}`);
      }
    }
    
    // Fermer le contexte
    await context.close();
  } catch (error) {
    console.error(`[${source.name}] Erreur globale: ${error.message}`);
  }
  
  // Dédupliquer les éléments par ID
  const uniqueItems = [];
  const seenIds = new Set();
  
  for (const item of allItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }
  
  console.log(`[${source.name}] ${uniqueItems.length} éléments uniques après déduplication`);
  
  // Sauvegarder les données
  if (uniqueItems.length > 0) {
    await saveData(source.name, uniqueItems);
    
    // Mettre à jour les statistiques
    stats.total_items += uniqueItems.length;
    stats.sources_processed++;
    
    // Mettre à jour les statistiques par catégorie
    const category = source.type || 'unknown';
    stats.categories[category] = (stats.categories[category] || 0) + uniqueItems.length;
    
    return true;
  } else {
    console.error(`[${source.name}] Échec: aucun élément récupéré`);
    stats.sources_failed++;
    return false;
  }
}

/**
 * Fait défiler automatiquement une page pour charger tout le contenu
 * @param {Page} page - Instance de la page Playwright
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * Sauvegarde les données dans un fichier JSON
 * @param {string} sourceName - Nom de la source
 * @param {Array} items - Éléments à sauvegarder
 */
async function saveData(sourceName, items) {
  try {
    const outputFile = path.join(CONFIG.OUTPUT_DIR, `${sourceName}.json`);
    await fs.writeJson(outputFile, items, { spaces: 2 });
    console.log(`[${sourceName}] Données sauvegardées dans ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`[${sourceName}] Erreur lors de la sauvegarde des données: ${error.message}`);
    return false;
  }
}

/**
 * Génère des fichiers par catégorie
 */
async function generateCategoryFiles() {
  console.log('\n📂 Génération des fichiers par catégorie...');
  
  // Récupérer tous les fichiers JSON sources
  const sourceFiles = await fs.readdir(CONFIG.OUTPUT_DIR);
  const jsonFiles = sourceFiles.filter(file => 
    file.endsWith('.json') && 
    !file.includes('index') && 
    !file.startsWith('.')
  );
  
  // Collecter tous les éléments par catégorie
  const categorizedItems = {};
  CONFIG.CATEGORIES.forEach(category => {
    categorizedItems[category] = [];
  });
  
  // Parcourir tous les fichiers sources
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(CONFIG.OUTPUT_DIR, file);
      const data = await fs.readJson(filePath);
      
      // Vérifier si les données sont un tableau ou un objet avec une propriété results
      const items = Array.isArray(data) ? data : (data.results || []);
      
      if (items.length === 0) {
        console.warn(`⚠️ Aucun élément trouvé dans ${file}`);
        continue;
      }
      
      // Catégoriser les éléments
      items.forEach(item => {
        // Déterminer la catégorie de l'élément
        let category = item.type || 'unknown';
        
        // Mapper les types spécifiques aux catégories générales
        if (['kdrama', 'cdrama', 'jdrama', 'drama', 'series'].includes(category)) {
          category = 'drama';
        } else if (['anime', 'animation'].includes(category)) {
          category = 'anime';
        } else if (['film', 'movie', 'movies'].includes(category)) {
          category = 'film';
        } else if (['bollywood', 'indian'].includes(category)) {
          category = 'bollywood';
        }
        
        // Ajouter l'élément à sa catégorie si elle est supportée
        if (CONFIG.CATEGORIES.includes(category)) {
          categorizedItems[category].push(item);
        }
      });
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${file}: ${error.message}`);
    }
  }
  
  // Générer les fichiers par catégorie
  for (const category of CONFIG.CATEGORIES) {
    const items = categorizedItems[category];
    
    if (items.length === 0) {
      console.warn(`⚠️ Aucun élément pour la catégorie ${category}`);
      continue;
    }
    
    console.log(`📦 Génération des fichiers pour ${category}: ${items.length} éléments`);
    
    // Trier les éléments par année (décroissant) puis par note (décroissant)
    items.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.rating - a.rating;
    });
    
    // Générer le fichier index.json
    const categoryDir = path.join(CONFIG.OUTPUT_DIR, category);
    await fs.ensureDir(categoryDir);
    
    const indexFile = path.join(categoryDir, 'index.json');
    await fs.writeJson(indexFile, {
      count: items.length,
      results: items,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier index généré: ${indexFile} (${items.length} éléments)`);
    
    // Générer le fichier trending.json
    const trendingItems = [...items]
      .sort((a, b) => {
        const currentYear = new Date().getFullYear();
        const aIsRecent = a.year >= currentYear - 2;
        const bIsRecent = b.year >= currentYear - 2;
        
        if (aIsRecent !== bIsRecent) return aIsRecent ? -1 : 1;
        return b.rating - a.rating;
      })
      .slice(0, 20);
    
    const trendingFile = path.join(categoryDir, 'trending.json');
    await fs.writeJson(trendingFile, {
      count: trendingItems.length,
      results: trendingItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier trending généré: ${trendingFile} (${trendingItems.length} éléments)`);
    
    // Générer le fichier hero_banner.json
    const heroBannerItems = [...items]
      .filter(item => item.backdrop && item.poster)
      .sort((a, b) => {
        const currentYear = new Date().getFullYear();
        const aIsVeryRecent = a.year >= currentYear;
        const bIsVeryRecent = b.year >= currentYear;
        
        if (aIsVeryRecent !== bIsVeryRecent) return aIsVeryRecent ? -1 : 1;
        return b.rating - a.rating;
      })
      .slice(0, 5);
    
    const heroBannerFile = path.join(categoryDir, 'hero_banner.json');
    await fs.writeJson(heroBannerFile, {
      count: heroBannerItems.length,
      results: heroBannerItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier hero_banner généré: ${heroBannerFile} (${heroBannerItems.length} éléments)`);
  }
  
  // Générer un fichier global pour toutes les catégories
  const globalFile = path.join(CONFIG.OUTPUT_DIR, 'global.json');
  await fs.writeJson(globalFile, {
    total_items: Object.values(categorizedItems).reduce((total, items) => total + items.length, 0),
    categories: Object.fromEntries(
      Object.entries(categorizedItems).map(([category, items]) => [category, items.length])
    ),
    updated_at: new Date().toISOString()
  }, { spaces: 2 });
  
  console.log(`✅ Fichier global généré: ${globalFile}`);
}

/**
 * Formate une durée en millisecondes en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Durée formatée
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Exécuter la fonction principale
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
