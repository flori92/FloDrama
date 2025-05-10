/**
 * Script spécial pour MyDramaList
 * 
 * Ce script utilise des techniques spécifiques pour contourner les protections
 * de MyDramaList et extraire un maximum de contenu
 */

const fs = require('fs-extra');
const path = require('path');
const { chromium } = require('playwright');
const cheerio = require('cheerio');

// Configuration
const CONFIG = {
  OUTPUT_DIR: './Frontend/src/data/content',
  CACHE_DIR: './.cache',
  URLS: [
    'https://mydramalist.com/shows/top_korean_dramas',
    'https://mydramalist.com/shows/top_chinese_dramas',
    'https://mydramalist.com/shows/top_japanese_dramas',
    'https://mydramalist.com/shows/top_taiwanese_dramas',
    'https://mydramalist.com/shows/top_thai_dramas',
    'https://mydramalist.com/shows/top?page=1',
    'https://mydramalist.com/shows/top?page=2',
    'https://mydramalist.com/shows/top?page=3',
    'https://mydramalist.com/shows/top?page=4',
    'https://mydramalist.com/shows/top?page=5'
  ],
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
  ]
};

/**
 * Fonction principale
 */
async function main() {
  console.log('='.repeat(80));
  console.log(`FloDrama - Script spécial MyDramaList`);
  console.log('='.repeat(80));
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  await fs.ensureDir(CONFIG.CACHE_DIR);
  
  const allItems = [];
  
  // Lancer le navigateur une seule fois pour toutes les URLs
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-web-security'
    ]
  });
  
  try {
    // Créer un contexte avec des en-têtes aléatoires
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });
    
    // Créer une page
    const page = await context.newPage();
    
    // Intercepter les requêtes pour bloquer les ressources inutiles
    await page.route('**/*.{png,jpg,jpeg,gif,webp,css,svg,woff,woff2,ttf,otf,eot}', route => route.abort());
    
    // Définir un timeout
    page.setDefaultTimeout(60000);
    
    // Parcourir toutes les URLs
    for (const url of CONFIG.URLS) {
      try {
        console.log(`\n🔍 Scraping de ${url}...`);
        
        // Naviguer vers l'URL
        await page.goto(url, { waitUntil: 'networkidle' });
        
        // Attendre que le contenu soit chargé
        await page.waitForSelector('.box-body.light-b');
        
        // Simuler un comportement humain
        await randomDelay();
        await page.mouse.move(Math.random() * 500, Math.random() * 500);
        await page.mouse.wheel(0, Math.random() * 300);
        
        // Récupérer le HTML
        const html = await page.content();
        
        // Extraire les données
        const items = extractMyDramaList(html, { url });
        
        console.log(`✅ ${items.length} éléments récupérés depuis ${url}`);
        
        if (items.length > 0) {
          allItems.push(...items);
        }
        
        // Attendre un peu avant la prochaine requête
        await randomDelay(3000, 5000);
      } catch (error) {
        console.error(`❌ Erreur lors du scraping de ${url}: ${error.message}`);
      }
    }
  } finally {
    // Fermer le navigateur
    await browser.close();
  }
  
  console.log(`\n📊 Total d'éléments récupérés: ${allItems.length}`);
  
  // Dédupliquer les éléments par ID
  const uniqueItems = [];
  const seenIds = new Set();
  
  for (const item of allItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }
  
  console.log(`📊 Total d'éléments uniques: ${uniqueItems.length}`);
  
  // Sauvegarder les données
  if (uniqueItems.length > 0) {
    const outputFile = path.join(CONFIG.OUTPUT_DIR, 'mydramalist.json');
    await fs.writeJson(outputFile, uniqueItems, { spaces: 2 });
    console.log(`✅ Données sauvegardées dans ${outputFile}`);
  }
  
  console.log('\n✨ Scraping terminé avec succès!');
}

/**
 * Génère un agent utilisateur aléatoire
 * @returns {string} - Agent utilisateur
 */
function getRandomUserAgent() {
  return CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
}

/**
 * Génère un délai aléatoire pour simuler un comportement humain
 * @param {number} min - Délai minimum en ms
 * @param {number} max - Délai maximum en ms
 * @returns {Promise<void>}
 */
function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Extrait les données de MyDramaList
 * @param {string} html - HTML à parser
 * @param {Object} options - Options supplémentaires
 * @returns {Array} - Liste d'éléments extraits
 */
function extractMyDramaList(html, options = {}) {
  const $ = cheerio.load(html);
  const items = [];
  
  // Sélecteur pour les dramas
  $('.box-body.light-b').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extraire les informations de base
      const $title = $item.find('h6.text-primary a');
      const title = $title.text().trim();
      const url = 'https://mydramalist.com' + $title.attr('href');
      
      // Extraire l'image
      const $image = $item.find('a.block img');
      const poster = $image.data('src') || $image.attr('src') || '';
      
      // Extraire l'année
      const $year = $item.find('.text-muted');
      const yearMatch = $year.text().match(/\b(20\d{2}|19\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Extraire la note
      const $rating = $item.find('.score');
      const rating = parseFloat($rating.text().trim()) || 0;
      
      // Extraire les genres
      const genres = [];
      $item.find('.text-muted a[href*="/genre/"]').each((i, el) => {
        genres.push($(el).text().trim());
      });
      
      // Extraire les pays
      const countries = [];
      $item.find('.text-muted a[href*="/country/"]').each((i, el) => {
        countries.push($(el).text().trim());
      });
      
      // Déterminer la langue
      let language = 'ko';
      if (countries.includes('China') || countries.includes('Taiwan') || countries.includes('Hong Kong')) {
        language = 'zh';
      } else if (countries.includes('Japan')) {
        language = 'ja';
      } else if (countries.includes('Thailand')) {
        language = 'th';
      }
      
      // Créer l'objet item
      const item = {
        id: `mydramalist_${url.split('/').pop()}`,
        title: title,
        original_title: title,
        url: url,
        poster: poster,
        backdrop: poster,
        year: year,
        rating: rating,
        genres: genres,
        countries: countries,
        source: 'mydramalist',
        type: 'drama',
        language: language,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      items.push(item);
    } catch (error) {
      console.error(`[MyDramaList] Erreur lors de l'extraction: ${error.message}`);
    }
  });
  
  return items;
}

// Exécuter la fonction principale
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
