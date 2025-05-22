/**
 * Script de scraping optimisé pour MyDramaList
 * 
 * Ce script utilise l'API ScrapingOwl pour récupérer des données réelles
 * depuis MyDramaList et les formater pour l'application FloDrama.
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Configuration
const SCRAPEOWL_API_KEY = 'cwbiu84xyxvudbkzi39f8kk6';
const SCRAPEOWL_API_URL = 'https://api.scrapeowl.com/v1/scrape';
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'data');
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

// Sources à scraper
const SOURCES = {
  mydramalist: {
    name: 'MyDramaList',
    url: 'https://mydramalist.com',
    topUrl: 'https://mydramalist.com/shows/top_korean_dramas',
    selector: '.box:not(.ad-box)',
    parser: parseMDLItem
  }
};

/**
 * Fonction principale
 */
async function main() {
  console.log('Démarrage du scraping optimisé pour MyDramaList...');
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(CACHE_DIR);
  
  // Statistiques
  const stats = {
    total_items: 0,
    real_items: 0,
    mock_items: 0,
    errors: 0,
    sources: {}
  };
  
  // Scraper MyDramaList
  console.log(`\nScraping de MyDramaList...`);
  
  try {
    // Récupérer les données
    const items = await scrapeMyDramaList();
    
    // Ajouter des données mockées si nécessaire
    const finalItems = combineRealAndMockData(items, 'drama', 20);
    
    // Mettre à jour les statistiques
    stats.total_items = finalItems.length;
    stats.real_items = items.length;
    stats.mock_items = finalItems.length - items.length;
    stats.sources.mydramalist = {
      items: items.length,
      success: true
    };
    
    // Enregistrer les données dans un fichier JSON
    const outputFile = path.join(OUTPUT_DIR, 'drama.json');
    await fs.writeJson(outputFile, finalItems, { spaces: 2 });
    
    console.log(`\n✅ ${finalItems.length} items enregistrés dans ${outputFile} (${items.length} réels, ${finalItems.length - items.length} mockés)`);
    
    // Enregistrer les statistiques
    const statsFile = path.join(OUTPUT_DIR, 'scraping-stats.json');
    await fs.writeJson(statsFile, {
      timestamp: new Date().toISOString(),
      ...stats
    }, { spaces: 2 });
    
    console.log(`\n📊 Statistiques de scraping enregistrées dans ${statsFile}`);
  } catch (error) {
    console.error(`\n❌ Erreur lors du scraping de MyDramaList: ${error.message}`);
    
    // Générer des données mockées en cas d'erreur
    const mockItems = generateMockItems('drama', 20);
    
    // Enregistrer les données mockées
    const outputFile = path.join(OUTPUT_DIR, 'drama.json');
    await fs.writeJson(outputFile, mockItems, { spaces: 2 });
    
    console.log(`\n⚠️ 20 items mockés enregistrés dans ${outputFile}`);
    
    // Mettre à jour les statistiques
    stats.total_items = mockItems.length;
    stats.real_items = 0;
    stats.mock_items = mockItems.length;
    stats.errors = 1;
    stats.sources.mydramalist = {
      items: 0,
      success: false,
      error: error.message
    };
    
    // Enregistrer les statistiques
    const statsFile = path.join(OUTPUT_DIR, 'scraping-stats.json');
    await fs.writeJson(statsFile, {
      timestamp: new Date().toISOString(),
      ...stats
    }, { spaces: 2 });
    
    console.log(`\n📊 Statistiques de scraping enregistrées dans ${statsFile}`);
  }
}

/**
 * Scrape MyDramaList
 * @returns {Promise<Array>} - Liste d'items scrapés
 */
async function scrapeMyDramaList() {
  const source = SOURCES.mydramalist;
  
  // Récupérer le HTML de la page avec ScrapingOwl
  console.log(`  Récupération du HTML de ${source.topUrl}...`);
  const html = await getCachedOrFetch(source.topUrl, 'mydramalist');
  
  // Parser le HTML avec Cheerio
  const $ = cheerio.load(html);
  
  // Extraire les items
  const items = [];
  
  console.log(`  Extraction des données...`);
  $(source.selector).each((index, element) => {
    if (index >= 30) return; // Extraire plus d'items pour compenser les filtres
    
    try {
      const item = source.parser($, element, source);
      if (item && item.title && item.title.trim() !== '') {
        items.push(item);
        console.log(`    ✅ Item extrait: ${item.title}`);
      }
    } catch (error) {
      console.error(`    ❌ Erreur lors du parsing d'un item: ${error.message}`);
    }
  });
  
  // Filtrer les items vides ou incomplets
  const validItems = items.filter(item => 
    item && item.title && item.title.trim() !== ''
  ).slice(0, 20); // Limiter à 20 items valides
  
  console.log(`  ${validItems.length} items valides extraits avec succès.`);
  
  return validItems;
}

/**
 * Récupère le HTML d'une page avec ScrapingOwl ou depuis le cache
 * @param {string} url - URL à scraper
 * @param {string} sourceName - Nom de la source
 * @returns {Promise<string>} - HTML de la page
 */
async function getCachedOrFetch(url, sourceName) {
  // Générer un nom de fichier de cache basé sur l'URL
  const hash = require('crypto').createHash('md5').update(url).digest('hex');
  const cacheFile = path.join(CACHE_DIR, `${sourceName}_${hash}.html`);
  
  try {
    // Vérifier si le fichier de cache existe et n'est pas expiré
    const stats = await fs.stat(cacheFile);
    const age = Date.now() - stats.mtime.getTime();
    
    if (age < CACHE_TTL) {
      console.log(`  Utilisation du cache pour ${sourceName} (${url})`);
      return await fs.readFile(cacheFile, 'utf8');
    }
  } catch (error) {
    // Le fichier n'existe pas ou une autre erreur s'est produite
  }
  
  // Récupérer le HTML avec ScrapingOwl
  console.log(`  Récupération du HTML avec ScrapingOwl...`);
  const html = await fetchWithScrapingOwl(url, sourceName);
  
  // Enregistrer dans le cache
  await fs.writeFile(cacheFile, html);
  
  return html;
}

/**
 * Récupère le HTML d'une page avec ScrapingOwl
 * @param {string} url - URL à scraper
 * @param {string} sourceName - Nom de la source
 * @returns {Promise<string>} - HTML de la page
 */
async function fetchWithScrapingOwl(url, sourceName) {
  try {
    // Configuration de base
    const baseParams = {
      api_key: SCRAPEOWL_API_KEY,
      url,
      render_js: 'true',
      premium_proxy: 'true',
      timeout: '60'
    };
    
    // Configurations simplifiées
    const sourceConfigs = {
      mydramalist: {
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      }
    };
    
    // Fusionner les configurations
    const config = sourceConfigs[sourceName] || {};
    const params = new URLSearchParams({
      ...baseParams,
      ...config
    });
    
    // Ajouter un délai aléatoire pour éviter d'être détecté comme un bot
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    // Faire la requête à l'API avec retry et backoff exponentiel
    let retries = 0;
    const maxRetries = 3;
    let delay = 2000;
    
    while (retries < maxRetries) {
      try {
        console.log(`  Tentative ${retries + 1}/${maxRetries} pour ${sourceName}...`);
        const response = await axios.get(`${SCRAPEOWL_API_URL}?${params.toString()}`);
        
        // Vérifier si la requête a réussi
        if (response.data && typeof response.data === 'string') {
          return response.data;
        } else if (response.data && response.data.html) {
          return response.data.html;
        } else {
          throw new Error(`Réponse invalide de ScrapingOwl: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        
        console.log(`  Échec de la tentative ${retries}/${maxRetries}, nouvel essai dans ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Backoff exponentiel
      }
    }
  } catch (error) {
    throw new Error(`Erreur lors de la récupération du HTML avec ScrapingOwl: ${error.message}`);
  }
}

/**
 * Parse un item de MyDramaList
 * @param {Object} $ - Instance Cheerio
 * @param {Object} element - Élément HTML
 * @param {Object} source - Configuration de la source
 * @returns {Object} - Item parsé
 */
function parseMDLItem($, element, source) {
  const $element = $(element);
  
  try {
    // Extraire l'ID et l'URL
    const $titleLink = $element.find('h6.title a');
    const link = $titleLink.attr('href') || '';
    const id = link.split('/').pop() || '';
    
    // Extraire le titre
    const title = $titleLink.text().trim();
    
    // Extraire l'image
    let image = $element.find('a.block img').attr('src') || $element.find('a.block img').attr('data-src') || '';
    // Compléter l'URL de l'image si nécessaire
    if (image && !image.startsWith('http')) {
      image = `https:${image}`;
    }
    
    // Si l'image est vide, essayer d'autres sélecteurs
    if (!image) {
      image = $element.find('img').attr('src') || $element.find('img').attr('data-src') || '';
      if (image && !image.startsWith('http')) {
        image = `https:${image}`;
      }
    }
    
    // Si toujours pas d'image, utiliser une image par défaut
    if (!image) {
      image = `https://via.placeholder.com/300x450.png?text=${encodeURIComponent(title)}`;
    }
    
    // Extraire la note
    const rating = $element.find('.score').text().trim();
    
    // Extraire l'année
    const $year = $element.find('.text-muted.text-right');
    const yearText = $year.text().trim();
    const yearMatch = yearText.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;
    
    // Extraire les genres
    let genres = $element.find('.genre').text().trim().split(', ').map(g => g.trim()).filter(Boolean);
    
    // Si aucun genre n'est trouvé, essayer d'autres sélecteurs
    if (!genres.length) {
      const genreText = $element.find('.box-meta').text() || '';
      const genreMatch = genreText.match(/Genres: ([^\n]+)/);
      if (genreMatch && genreMatch[1]) {
        genres = genreMatch[1].split(', ').map(g => g.trim()).filter(Boolean);
      }
    }
    
    // Si toujours aucun genre, ajouter au moins 'Korean Drama'
    if (!genres.length) {
      genres = ['Korean Drama'];
    }
    
    // Extraire le nombre d'épisodes
    const $meta = $element.find('.box-meta');
    const metaText = $meta.text();
    const episodesMatch = metaText.match(/(\d+) eps/);
    const episodes = episodesMatch ? parseInt(episodesMatch[1]) : null;
    
    // Extraire la description
    const description = $element.find('.box-description').text().trim();
    
    return {
      id,
      title,
      image,
      rating,
      year,
      description,
      categories: genres,
      episodes,
      source: source.name,
      url: link.startsWith('http') ? link : `${source.url}${link}`,
      mock: false
    };
  } catch (error) {
    console.error(`    Erreur lors du parsing d'un item MDL: ${error.message}`);
    return null;
  }
}

/**
 * Fonction pour combiner les données réelles et mockées
 * @param {Array} realItems - Items réels
 * @param {string} category - Catégorie
 * @param {number} minItems - Nombre minimum d'items
 * @returns {Array} - Liste d'items combinés
 */
function combineRealAndMockData(realItems, category, minItems = 20) {
  if (realItems.length >= minItems) {
    return realItems;
  }
  
  console.log(`  ⚠️ Seulement ${realItems.length}/${minItems} items réels récupérés pour ${category}, ajout de données mockées...`);
  
  // Générer des données mockées pour compléter
  const mockCount = minItems - realItems.length;
  const mockItems = generateMockItems(category, mockCount);
  
  // Combiner les données réelles et mockées
  return [...realItems, ...mockItems];
}

/**
 * Génère des données mockées pour une catégorie
 * @param {string} category - Catégorie
 * @param {number} count - Nombre d'items à générer
 * @returns {Array} - Liste d'items mockés
 */
function generateMockItems(category, count) {
  const items = [];
  
  for (let i = 0; i < count; i++) {
    items.push({
      id: `mock-${category}-${i}`,
      title: `Mock ${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
      image: `https://via.placeholder.com/300x450.png?text=Mock+${category}+${i + 1}`,
      rating: (Math.random() * 5 + 5).toFixed(1), // Note entre 5 et 10
      year: Math.floor(Math.random() * 10) + 2015, // Année entre 2015 et 2024
      description: `Ceci est une description mockée pour un ${category} généré automatiquement.`,
      categories: ['Comédie', 'Drame', 'Action'].sort(() => Math.random() - 0.5).slice(0, 2),
      episodes: Math.floor(Math.random() * 16) + 8, // Entre 8 et 24 épisodes
      watchers: Math.floor(Math.random() * 100000) + 50000, // Entre 50k et 150k spectateurs
      source: 'mock',
      mock: true
    });
  }
  
  return items;
}

// Exécuter le script
main().catch(error => {
  console.error(`Erreur lors de l'exécution du script: ${error.message}`);
  process.exit(1);
});
