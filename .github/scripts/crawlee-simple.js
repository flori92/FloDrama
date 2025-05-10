/**
 * Script de scraping simplifié pour FloDrama
 * 
 * Ce script utilise des méthodes simples pour extraire des données
 * de sites populaires et les formater pour l'application FloDrama.
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Configuration
const CONFIG = {
  OUTPUT_DIR: './Frontend/src/data/content',
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  MIN_ITEMS_PER_CATEGORY: 20,
  TIMEOUT: 30000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Sources à scraper
const SOURCES = [
  {
    name: 'mydramalist',
    url: 'https://mydramalist.com/shows/top_korean_dramas',
    selector: '.box:not(.ad-box)',
    type: 'drama',
    language: 'ko'
  },
  {
    name: 'dramacool',
    url: 'https://dramacool.hr/most-popular-drama',
    selector: '.block-wrapper .block',
    type: 'drama',
    language: 'multi'
  },
  {
    name: 'voiranime',
    url: 'https://voiranime.com/animes/',
    selector: '.film-poster',
    type: 'anime',
    language: 'fr'
  },
  {
    name: 'filmapik',
    url: 'https://filmapik.bio/populer',
    selector: '.movies-list .ml-item',
    type: 'film',
    language: 'multi'
  },
  {
    name: 'bollywoodmdb',
    url: 'https://www.bollywoodmdb.com/movies',
    selector: '.card',
    type: 'bollywood',
    language: 'hi'
  }
];

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
  console.log(`FloDrama - Script de scraping simplifié`);
  console.log('='.repeat(80));
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  
  for (const category of CONFIG.CATEGORIES) {
    await fs.ensureDir(path.join(CONFIG.OUTPUT_DIR, category));
  }
  
  console.log(`\n🔍 Démarrage du scraping pour ${SOURCES.length} sources...`);
  
  // Scraper chaque source
  for (const source of SOURCES) {
    try {
      console.log(`\n🔍 Scraping de ${source.name}...`);
      
      // Récupérer le HTML
      const html = await fetchHtml(source.url);
      
      if (!html) {
        throw new Error(`Impossible de récupérer le HTML de ${source.url}`);
      }
      
      // Parser le HTML
      const $ = cheerio.load(html);
      const items = [];
      
      $(source.selector).each((index, element) => {
        try {
          const item = extractItem($, element, source);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          console.error(`Erreur lors du parsing d'un élément: ${error.message}`);
        }
      });
      
      console.log(`[${source.name}] ${items.length} éléments récupérés`);
      
      if (items.length === 0) {
        throw new Error(`Aucun élément récupéré depuis ${source.name}`);
      }
      
      // Sauvegarder les données
      await saveData(source.name, items);
      
      // Mettre à jour les statistiques
      stats.total_items += items.length;
      stats.sources_processed++;
      
      // Mettre à jour les statistiques par catégorie
      const category = source.type || 'unknown';
      stats.categories[category] = (stats.categories[category] || 0) + items.length;
      
    } catch (error) {
      console.error(`[${source.name}] Erreur: ${error.message}`);
      stats.sources_failed++;
    }
  }
  
  // Générer les fichiers par catégorie
  await generateCategoryFiles();
  
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
 * Récupère le HTML d'une URL
 * @param {string} url - URL à scraper
 * @returns {Promise<string|null>} - HTML récupéré ou null
 */
async function fetchHtml(url) {
  try {
    console.log(`Récupération de ${url}...`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: CONFIG.TIMEOUT
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Extrait les données d'un élément HTML
 * @param {Object} $ - Instance Cheerio
 * @param {Element} element - Élément HTML à parser
 * @param {Object} source - Configuration de la source
 * @returns {Object|null} - Données extraites ou null
 */
function extractItem($, element, source) {
  try {
    const $item = $(element);
    
    // Extraire les données de base
    let title, url, poster, year, rating;
    
    // Extraction adaptée selon la source
    if (source.name === 'mydramalist') {
      const $link = $item.find('.box-header a');
      const $image = $item.find('img.img-responsive');
      
      title = $link.text().trim();
      url = $link.attr('href');
      poster = $image.attr('src') || $image.data('src') || '';
      
      const infoText = $item.find('.text-muted').text();
      const yearMatch = infoText.match(/\b(20\d{2}|19\d{2})\b/);
      year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      const ratingText = $item.find('.score').text().trim();
      rating = parseFloat(ratingText) || 0;
      
    } else if (source.name === 'filmapik') {
      const $link = $item.find('.ml-mask');
      const $title = $item.find('.mli-info h2');
      
      title = $title.text().trim();
      url = $link.attr('href');
      
      const posterStyle = $link.attr('style') || '';
      const posterMatch = posterStyle.match(/url\(['"]?(.*?)['"]?\)/);
      poster = $link.data('original') || (posterMatch ? posterMatch[1] : '');
      
      const yearMatch = $item.find('.mli-info').text().match(/\b(20\d{2}|19\d{2})\b/);
      year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      const ratingText = $item.find('.rating').text().trim();
      const ratingMatch = ratingText.match(/([0-9.]+)/);
      rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
      
    } else {
      // Extraction générique
      const $link = $item.find('a').first();
      const $image = $item.find('img').first();
      const $title = $item.find('h2, h3, .title, .name').first();
      
      title = $title.text().trim() || $link.attr('title') || '';
      url = $link.attr('href');
      poster = $image.attr('src') || $image.data('src') || $image.data('original') || '';
      
      const fullText = $item.text();
      const yearMatch = fullText.match(/\b(20\d{2}|19\d{2})\b/);
      year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      const ratingMatch = fullText.match(/([0-9](\.[0-9])?|10(\.0)?)\s*\/\s*10/) || 
                          fullText.match(/([0-9](\.[0-9])?|10(\.0)?)/);
      rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    }
    
    // Vérifier les données minimales
    if (!title || !url) {
      return null;
    }
    
    // Générer un ID unique
    const id = url ? url.split('/').pop() : `${source.name}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Créer l'objet item
    return {
      id: `${source.name}_${id}`,
      title: title,
      original_title: title,
      url: url,
      poster: poster,
      backdrop: poster,
      year: year,
      rating: rating,
      source: source.name,
      type: source.type || 'unknown',
      language: source.language || 'multi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${source.name}] Erreur lors de l'extraction: ${error.message}`);
    return null;
  }
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
