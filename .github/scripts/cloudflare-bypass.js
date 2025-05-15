/**
 * Script de contournement des protections Cloudflare pour FloDrama
 * 
 * Ce script utilise puppeteer avec le plugin stealth pour contourner
 * les protections Cloudflare et récupérer des milliers de contenus
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { extractData } = require('./stealth/extractors');
const { randomDelay, getRandomUserAgent } = require('./stealth/utils');

// Activer le plugin stealth
puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
  OUTPUT_DIR: './Frontend/src/data/content',
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  BROWSER_ARGS: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-site-isolation-trials'
  ],
  // Sources prioritaires avec des URLs alternatives
  SOURCES: [
    // Dramas
    {
      name: 'dramacool',
      urls: [
        'https://dramacool.hr/drama-list',
        'https://dramacool.hr/most-popular-drama'
      ],
      type: 'drama',
      selector: '.block',
      waitForSelector: '.block',
      minItems: 50,
      cloudflareProtection: true
    },
    {
      name: 'mydramalist',
      urls: [
        'https://mydramalist.com/shows/top',
        'https://mydramalist.com/shows/top_korean_dramas'
      ],
      type: 'drama',
      selector: '.box-body.light-b',
      waitForSelector: '.box-body',
      minItems: 50,
      cloudflareProtection: true
    },
    // Animes
    {
      name: 'gogoanime',
      urls: [
        'https://gogoanime.tel/anime-list.html',
        'https://gogoanime.tel/popular.html'
      ],
      type: 'anime',
      selector: '.items .item',
      waitForSelector: '.items',
      minItems: 50,
      cloudflareProtection: true
    },
    // Films
    {
      name: 'vostfree',
      urls: [
        'https://vostfree.cx/films-vostfr',
        'https://vostfree.cx/films-vf'
      ],
      type: 'film',
      selector: '.movies-list .ml-item',
      waitForSelector: '.movies-list',
      minItems: 50,
      cloudflareProtection: true
    },
    // Bollywood
    {
      name: 'bollywood',
      urls: [
        'https://www.bollywoodhungama.com/movies/'
      ],
      type: 'bollywood',
      selector: '.movie-box',
      waitForSelector: '.movie-box',
      minItems: 50,
      cloudflareProtection: false
    }
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
  console.log(`FloDrama - Contournement Cloudflare`);
  console.log('='.repeat(80));
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  for (const category of CONFIG.CATEGORIES) {
    await fs.ensureDir(path.join(CONFIG.OUTPUT_DIR, category));
  }
  
  console.log(`\n🔍 Démarrage du scraping pour ${CONFIG.SOURCES.length} sources prioritaires...`);
  
  // Lancer un navigateur unique pour toutes les sources
  const browser = await puppeteer.launch({
    headless: false, // Mode visible pour éviter la détection
    args: CONFIG.BROWSER_ARGS,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    ignoreHTTPSErrors: true
  });
  
  try {
    // Traiter chaque source séquentiellement
    for (const source of CONFIG.SOURCES) {
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
  console.log(`✅ Sources traitées: ${stats.sources_processed}/${CONFIG.SOURCES.length}`);
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
    const page = await browser.newPage();
    
    // Configurer le user agent
    await page.setUserAgent(getRandomUserAgent());
    
    // Configurer les en-têtes supplémentaires
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'max-age=0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/'
    });
    
    // Ajouter des scripts pour masquer l'automatisation
    await page.evaluateOnNewDocument(() => {
      // Simuler des mouvements de souris aléatoires
      const originalQuerySelector = document.querySelector;
      document.querySelector = function(...args) {
        // Simuler un délai aléatoire
        const delay = Math.floor(Math.random() * 20);
        if (delay > 0) {
          for (let i = 0; i < delay * 1000000; i++) {
            // Boucle vide pour créer un délai
          }
        }
        return originalQuerySelector.apply(document, args);
      };
      
      // Simuler un historique de navigation
      history.length = Math.floor(Math.random() * 5) + 2;
      
      // Simuler une batterie
      if (!navigator.getBattery) {
        navigator.getBattery = () => Promise.resolve({
          charging: Math.random() > 0.5,
          chargingTime: Math.floor(Math.random() * 3000),
          dischargingTime: Math.floor(Math.random() * 10000),
          level: Math.random()
        });
      }
    });
    
    // Parcourir toutes les URLs de la source
    for (const url of source.urls) {
      try {
        console.log(`[${source.name}] Scraping de ${url}`);
        
        // Naviguer vers l'URL avec des options avancées
        await page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 60000
        });
        
        // Si le site a une protection Cloudflare, attendre qu'elle soit contournée
        if (source.cloudflareProtection) {
          console.log(`[${source.name}] Détection de protection Cloudflare, attente du contournement...`);
          
          // Attendre que la page Cloudflare soit contournée (généralement 5-10 secondes)
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          // Vérifier si nous sommes toujours sur la page de challenge Cloudflare
          const cloudflareDetected = await page.evaluate(() => {
            return document.querySelector('#cf-error-details') !== null || 
                   document.querySelector('.cf-error-code') !== null ||
                   document.querySelector('#challenge-running') !== null ||
                   document.querySelector('title')?.textContent.includes('Cloudflare') ||
                   document.querySelector('title')?.textContent.includes('Attention Required');
          });
          
          if (cloudflareDetected) {
            console.log(`[${source.name}] Protection Cloudflare toujours active, attente supplémentaire...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            // Essayer de cliquer sur le bouton "Je suis humain" ou similaire
            try {
              await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, input[type="button"], a.button'));
                for (const button of buttons) {
                  if (button.innerText && (
                      button.innerText.toLowerCase().includes('continue') ||
                      button.innerText.toLowerCase().includes('verify') ||
                      button.innerText.toLowerCase().includes('human') ||
                      button.innerText.toLowerCase().includes('proceed')
                    )) {
                    button.click();
                    return true;
                  }
                }
                return false;
              });
              
              // Attendre après avoir cliqué sur le bouton
              await new Promise(resolve => setTimeout(resolve, 10000));
            } catch (e) {
              console.log(`[${source.name}] Erreur lors de la tentative de clic sur le bouton Cloudflare: ${e.message}`);
            }
          }
        }
        
        // Simuler un comportement humain très réaliste
        await randomDelay(2000, 4000);
        
        // Simuler des mouvements de souris aléatoires et réalistes
        for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
          const x1 = Math.random() * 500;
          const y1 = Math.random() * 500;
          const x2 = x1 + (Math.random() * 200 - 100);
          const y2 = y1 + (Math.random() * 200 - 100);
          
          await page.mouse.move(x1, y1);
          await randomDelay(100, 500);
          await page.mouse.move(x2, y2, { steps: 5 });
          
          // Parfois, cliquer sur un élément aléatoire non-interactif
          if (Math.random() < 0.3) {
            await page.mouse.click(x2, y2);
            await randomDelay(300, 800);
          }
        }
        
        // Faire défiler la page lentement pour charger tout le contenu
        await autoScrollSlow(page);
        
        // Attendre un sélecteur spécifique si nécessaire
        if (source.waitForSelector) {
          await page.waitForSelector(source.waitForSelector, { timeout: 15000 })
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
        
        // Attendre entre chaque URL avec un délai variable
        await randomDelay(5000, 12000);
      } catch (error) {
        console.error(`[${source.name}] Erreur lors du scraping de ${url}: ${error.message}`);
      }
    }
    
    // Fermer la page
    await page.close();
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
 * Fait défiler automatiquement une page lentement pour simuler un comportement humain
 * @param {Page} page - Instance de la page Puppeteer
 */
async function autoScrollSlow(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 50; // Scroll plus petit
      const timer = setInterval(() => {
        // Ajouter des variations aléatoires dans le défilement
        const scrollDistance = distance + Math.floor(Math.random() * 30) - 15;
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, scrollDistance);
        totalHeight += scrollDistance;
        
        // Parfois, faire une pause plus longue pour simuler la lecture
        if (Math.random() < 0.1) {
          clearInterval(timer);
          setTimeout(() => {
            // Reprendre le défilement après une pause
            if (totalHeight < scrollHeight) {
              const resumeTimer = setInterval(() => {
                const resumeDistance = distance + Math.floor(Math.random() * 30) - 15;
                window.scrollBy(0, resumeDistance);
                totalHeight += resumeDistance;
                
                if (totalHeight >= scrollHeight) {
                  clearInterval(resumeTimer);
                  resolve();
                }
              }, 200 + Math.floor(Math.random() * 100));
            } else {
              resolve();
            }
          }, 1000 + Math.floor(Math.random() * 2000));
        }
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200 + Math.floor(Math.random() * 100)); // Vitesse variable
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
