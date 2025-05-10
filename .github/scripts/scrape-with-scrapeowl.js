/**
 * Script de scraping utilisant directement l'API ScrapingOwl
 * 
 * Ce script permet de récupérer des données réelles depuis diverses sources
 * en utilisant l'API ScrapingOwl, puis de générer les fichiers JSON nécessaires
 * pour l'application FloDrama.
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Configuration
const SCRAPEOWL_API_KEY = 'cwbiu84xyxvudbkzi39f8kk6';
const SCRAPEOWL_API_URL = 'https://api.scrapeowl.com/v1/scrape';
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'data');

// Sources à scraper
const SOURCES = {
  drama: [
    {
      name: 'mydramalist',
      url: 'https://mydramalist.com',
      selector: '.list-item',
      parser: parseMDLItem
    },
    {
      name: 'voirdrama',
      url: 'https://voirdrama.org',
      selector: '.movie-list .ml-item',
      parser: parseVoirDramaItem
    }
  ],
  anime: [
    {
      name: 'voiranime',
      url: 'https://voiranime.com',
      selector: '.items .item',
      parser: parseVoirAnimeItem
    },
    {
      name: 'nekosama',
      url: 'https://neko-sama.fr',
      selector: '.anime-card',
      parser: parseNekoSamaItem
    }
  ],
  film: [
    {
      name: 'coflix',
      url: 'https://coflix.nu/films',
      selector: '.movies-list .ml-item',
      parser: parseCoflixItem
    },
    {
      name: 'vostfree',
      url: 'https://vostfree.cx',
      selector: '.movies-list .ml-item',
      parser: parseVostFreeItem
    }
  ],
  bollywood: [
    {
      name: 'zee5',
      url: 'https://www.zee5.com/movies/bollywood',
      selector: '.movieTrayWrapper',
      parser: parseZee5Item
    }
  ]
};

/**
 * Fonction principale
 */
async function main() {
  console.log('Démarrage du scraping avec ScrapingOwl...');
  
  // Créer le répertoire de sortie s'il n'existe pas
  await fs.ensureDir(OUTPUT_DIR);
  
  // Statistiques globales
  const stats = {
    total_items: 0,
    real_items: 0,
    mock_items: 0,
    errors: 0,
    sources: {}
  };
  
  // Scraper chaque catégorie
  for (const [category, sources] of Object.entries(SOURCES)) {
    console.log(`\nScraping de la catégorie: ${category}`);
    
    const categoryItems = [];
    
    // Scraper chaque source dans la catégorie
    for (const source of sources) {
      console.log(`  Scraping de ${source.name}...`);
      
      try {
        // Récupérer les données
        const items = await scrapeSource(source);
        
        // Ajouter les items à la liste de la catégorie
        categoryItems.push(...items);
        
        // Mettre à jour les statistiques
        stats.total_items += items.length;
        stats.real_items += items.length;
        stats.sources[source.name] = {
          items: items.length,
          success: true
        };
        
        console.log(`  ✅ ${items.length} items récupérés depuis ${source.name}`);
      } catch (error) {
        console.error(`  ❌ Erreur lors du scraping de ${source.name}: ${error.message}`);
        
        // Mettre à jour les statistiques
        stats.errors++;
        stats.sources[source.name] = {
          items: 0,
          success: false,
          error: error.message
        };
      }
    }
    
    // Si aucun item n'a été récupéré, générer des données mockées
    if (categoryItems.length === 0) {
      console.log(`  ⚠️ Aucun item réel récupéré pour ${category}, génération de données mockées...`);
      
      const mockItems = generateMockItems(category, 20);
      categoryItems.push(...mockItems);
      
      // Mettre à jour les statistiques
      stats.total_items += mockItems.length;
      stats.mock_items += mockItems.length;
    }
    
    // Enregistrer les données dans un fichier JSON
    const outputFile = path.join(OUTPUT_DIR, `${category}.json`);
    await fs.writeJson(outputFile, categoryItems, { spaces: 2 });
    
    console.log(`  📝 ${categoryItems.length} items enregistrés dans ${outputFile}`);
  }
  
  // Enregistrer les statistiques
  const statsFile = path.join(OUTPUT_DIR, 'scraping-stats.json');
  await fs.writeJson(statsFile, {
    timestamp: new Date().toISOString(),
    ...stats
  }, { spaces: 2 });
  
  console.log(`\n📊 Statistiques de scraping enregistrées dans ${statsFile}`);
  console.log(`   Total: ${stats.total_items} items (${stats.real_items} réels, ${stats.mock_items} mockés)`);
  console.log(`   Erreurs: ${stats.errors}`);
}

/**
 * Scrape une source spécifique
 * @param {Object} source - Configuration de la source
 * @returns {Promise<Array>} - Liste d'items scrapés
 */
async function scrapeSource(source) {
  // Récupérer le HTML de la page avec ScrapingOwl
  const html = await fetchWithScrapingOwl(source.url);
  
  // Parser le HTML avec Cheerio
  const $ = cheerio.load(html);
  
  // Extraire les items
  const items = [];
  
  $(source.selector).each((index, element) => {
    if (index >= 20) return; // Limiter à 20 items par source
    
    try {
      const item = source.parser($, element, source);
      if (item) {
        items.push(item);
      }
    } catch (error) {
      console.error(`    Erreur lors du parsing d'un item: ${error.message}`);
    }
  });
  
  return items;
}

/**
 * Récupère le HTML d'une page avec ScrapingOwl
 * @param {string} url - URL à scraper
 * @returns {Promise<string>} - HTML de la page
 */
async function fetchWithScrapingOwl(url) {
  try {
    // Construire l'URL de l'API ScrapingOwl
    const params = new URLSearchParams({
      api_key: SCRAPEOWL_API_KEY,
      url,
      render_js: 'true',
      premium_proxy: 'true',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      timeout: '60'
    });
    
    // Faire la requête à l'API
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
    throw new Error(`Erreur lors de la récupération du HTML avec ScrapingOwl: ${error.message}`);
  }
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
      source: 'mock',
      mock: true
    });
  }
  
  return items;
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
  
  // Extraire l'ID
  const id = $element.attr('class').split(' ')[1]?.replace('mdl-', '') || '';
  
  // Extraire le titre
  const title = $element.find('.title').text().trim();
  
  // Extraire l'image
  const image = $element.find('img').data('src') || $element.find('img').attr('src') || '';
  
  // Extraire la note
  const rating = $element.find('.score').text().trim();
  
  // Extraire les informations supplémentaires
  const info = $element.find('.text-sm').map((i, el) => $(el).text().trim()).get();
  
  // Extraire l'année (si disponible)
  const yearMatch = info.join(' ').match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Extraire les catégories
  const categories = [];
  if (info[0] && info[0].includes('Drama')) categories.push('Drama');
  if (info[0] && info[0].includes('Movie')) categories.push('Movie');
  
  return {
    id,
    title,
    image,
    rating,
    year,
    description: info.join(' '),
    categories,
    source: source.name,
    url: `${source.url}/${id}`,
    mock: false
  };
}

/**
 * Parse un item de VoirDrama
 * @param {Object} $ - Instance Cheerio
 * @param {Object} element - Élément HTML
 * @param {Object} source - Configuration de la source
 * @returns {Object} - Item parsé
 */
function parseVoirDramaItem($, element, source) {
  const $element = $(element);
  
  // Extraire l'ID et l'URL
  const link = $element.find('a').attr('href') || '';
  const id = link.split('/').pop() || '';
  
  // Extraire le titre
  const title = $element.find('.mli-info h2').text().trim();
  
  // Extraire l'image
  const image = $element.find('.mli-thumb img').attr('data-original') || $element.find('.mli-thumb img').attr('src') || '';
  
  // Extraire la note
  const ratingEl = $element.find('.rating');
  const rating = ratingEl.length ? ratingEl.text().trim() : '';
  
  // Extraire l'année
  const yearEl = $element.find('.mli-year');
  const year = yearEl.length ? parseInt(yearEl.text().trim()) : null;
  
  // Extraire les catégories
  const categories = $element.find('.mli-genres').text().trim().split(',').map(c => c.trim()).filter(Boolean);
  
  return {
    id,
    title,
    image,
    rating,
    year,
    description: '',
    categories,
    source: source.name,
    url: link,
    mock: false
  };
}

/**
 * Parse un item de VoirAnime
 * @param {Object} $ - Instance Cheerio
 * @param {Object} element - Élément HTML
 * @param {Object} source - Configuration de la source
 * @returns {Object} - Item parsé
 */
function parseVoirAnimeItem($, element, source) {
  const $element = $(element);
  
  // Extraire l'ID et l'URL
  const link = $element.find('a').attr('href') || '';
  const id = link.split('/').pop() || '';
  
  // Extraire le titre
  const title = $element.find('.data h3').text().trim();
  
  // Extraire l'image
  const image = $element.find('.poster img').attr('data-src') || $element.find('.poster img').attr('src') || '';
  
  // Extraire la note
  const ratingEl = $element.find('.rating');
  const rating = ratingEl.length ? ratingEl.text().trim() : '';
  
  // Extraire l'année
  const yearEl = $element.find('.meta .year');
  const year = yearEl.length ? parseInt(yearEl.text().trim()) : null;
  
  // Extraire les catégories
  const categories = $element.find('.meta .genres a').map((i, el) => $(el).text().trim()).get();
  
  return {
    id,
    title,
    image,
    rating,
    year,
    description: '',
    categories,
    source: source.name,
    url: link,
    mock: false
  };
}

/**
 * Parse un item de NekoSama
 * @param {Object} $ - Instance Cheerio
 * @param {Object} element - Élément HTML
 * @param {Object} source - Configuration de la source
 * @returns {Object} - Item parsé
 */
function parseNekoSamaItem($, element, source) {
  const $element = $(element);
  
  // Extraire l'ID et l'URL
  const link = $element.find('a').attr('href') || '';
  const id = link.split('/').pop() || '';
  
  // Extraire le titre
  const title = $element.find('.title').text().trim();
  
  // Extraire l'image
  const image = $element.find('.cover img').attr('data-src') || $element.find('.cover img').attr('src') || '';
  
  // Extraire la note
  const ratingEl = $element.find('.rating');
  const rating = ratingEl.length ? ratingEl.text().trim() : '';
  
  // Extraire l'année
  const yearEl = $element.find('.year');
  const year = yearEl.length ? parseInt(yearEl.text().trim()) : null;
  
  // Extraire les catégories
  const categories = $element.find('.categories span').map((i, el) => $(el).text().trim()).get();
  
  return {
    id,
    title,
    image,
    rating,
    year,
    description: '',
    categories,
    source: source.name,
    url: link.startsWith('http') ? link : `${source.url}${link}`,
    mock: false
  };
}

/**
 * Parse un item de Coflix
 * @param {Object} $ - Instance Cheerio
 * @param {Object} element - Élément HTML
 * @param {Object} source - Configuration de la source
 * @returns {Object} - Item parsé
 */
function parseCoflixItem($, element, source) {
  const $element = $(element);
  
  // Extraire l'ID et l'URL
  const link = $element.find('a').attr('href') || '';
  const id = link.split('/').pop() || '';
  
  // Extraire le titre
  const title = $element.find('.mli-info h2').text().trim();
  
  // Extraire l'image
  const image = $element.find('.mli-thumb img').attr('data-original') || $element.find('.mli-thumb img').attr('src') || '';
  
  // Extraire la note
  const ratingEl = $element.find('.rating');
  const rating = ratingEl.length ? ratingEl.text().trim() : '';
  
  // Extraire l'année
  const yearEl = $element.find('.mli-year');
  const year = yearEl.length ? parseInt(yearEl.text().trim()) : null;
  
  // Extraire les catégories
  const categories = $element.find('.mli-genres').text().trim().split(',').map(c => c.trim()).filter(Boolean);
  
  return {
    id,
    title,
    image,
    rating,
    year,
    description: '',
    categories,
    source: source.name,
    url: link.startsWith('http') ? link : `${source.url}${link}`,
    mock: false
  };
}

/**
 * Parse un item de VostFree
 * @param {Object} $ - Instance Cheerio
 * @param {Object} element - Élément HTML
 * @param {Object} source - Configuration de la source
 * @returns {Object} - Item parsé
 */
function parseVostFreeItem($, element, source) {
  const $element = $(element);
  
  // Extraire l'ID et l'URL
  const link = $element.find('a').attr('href') || '';
  const id = link.split('/').pop() || '';
  
  // Extraire le titre
  const title = $element.find('.mli-info h2').text().trim();
  
  // Extraire l'image
  const image = $element.find('.mli-thumb img').attr('data-original') || $element.find('.mli-thumb img').attr('src') || '';
  
  // Extraire la note
  const ratingEl = $element.find('.rating');
  const rating = ratingEl.length ? ratingEl.text().trim() : '';
  
  // Extraire l'année
  const yearEl = $element.find('.mli-year');
  const year = yearEl.length ? parseInt(yearEl.text().trim()) : null;
  
  // Extraire les catégories
  const categories = $element.find('.mli-genres').text().trim().split(',').map(c => c.trim()).filter(Boolean);
  
  return {
    id,
    title,
    image,
    rating,
    year,
    description: '',
    categories,
    source: source.name,
    url: link.startsWith('http') ? link : `${source.url}${link}`,
    mock: false
  };
}

/**
 * Parse un item de Zee5
 * @param {Object} $ - Instance Cheerio
 * @param {Object} element - Élément HTML
 * @param {Object} source - Configuration de la source
 * @returns {Object} - Item parsé
 */
function parseZee5Item($, element, source) {
  const $element = $(element);
  
  // Extraire l'ID et l'URL
  const link = $element.find('a').attr('href') || '';
  const id = link.split('/').pop() || '';
  
  // Extraire le titre
  const title = $element.find('.movieTitle').text().trim();
  
  // Extraire l'image
  const image = $element.find('.moviePoster img').attr('src') || '';
  
  // Extraire la note
  const ratingEl = $element.find('.movieRating');
  const rating = ratingEl.length ? ratingEl.text().trim() : '';
  
  // Extraire l'année
  const yearEl = $element.find('.movieYear');
  const year = yearEl.length ? parseInt(yearEl.text().trim()) : null;
  
  // Extraire les catégories
  const categories = $element.find('.movieGenre').text().trim().split(',').map(c => c.trim()).filter(Boolean);
  
  return {
    id,
    title,
    image,
    rating,
    year,
    description: '',
    categories,
    source: source.name,
    url: link.startsWith('http') ? link : `https://www.zee5.com${link}`,
    mock: false
  };
}

// Exécuter le script
main().catch(error => {
  console.error(`Erreur lors de l'exécution du script: ${error.message}`);
  process.exit(1);
});
