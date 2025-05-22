/**
 * Script de scraping optimisé pour Filmapik.bio
 * 
 * Ce script utilise l'API ScrapingOwl pour récupérer des données réelles
 * depuis Filmapik.bio et les formater pour l'application FloDrama.
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
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 secondes

// Sources à scraper
const SOURCES = {
  filmapik: {
    name: 'Filmapik',
    url: 'https://filmapik.bio',
    topUrl: 'https://filmapik.bio/populer',
    selector: '.movies-list .ml-item',
    parser: parseFilmapikItem
  }
};

/**
 * Fonction principale
 */
async function main() {
  console.log('Démarrage du scraping optimisé pour Filmapik.bio...');
  
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
  
  // Scraper Filmapik
  console.log(`\nScraping de Filmapik.bio...`);
  
  try {
    // Vérifier si le cache est disponible et valide
    const cacheFile = path.join(CACHE_DIR, 'filmapik.json');
    const useCache = await checkCache(cacheFile);
    
    if (useCache) {
      console.log('Utilisation des données en cache pour Filmapik');
      const cachedData = await fs.readJson(cacheFile);
      stats.total_items += cachedData.length;
      stats.real_items += cachedData.length;
      stats.sources.filmapik = {
        items: cachedData.length,
        success: true,
        cached: true
      };
      
      // Écrire les données dans le fichier de sortie
      await saveResults(cachedData, 'filmapik');
      
      return {
        success: true,
        message: 'Données récupérées depuis le cache',
        data: cachedData,
        stats
      };
    }
    
    // Scraper les données en direct
    console.log('Récupération des données en direct depuis Filmapik.bio...');
    const source = SOURCES.filmapik;
    const html = await scrapeWithRetry(source.topUrl);
    
    if (!html) {
      throw new Error('Impossible de récupérer le HTML de Filmapik.bio');
    }
    
    // Parser le HTML
    const $ = cheerio.load(html);
    const items = [];
    
    $(source.selector).each((index, element) => {
      try {
        const item = source.parser($, element);
        if (item) {
          items.push(item);
        }
      } catch (error) {
        console.error(`Erreur lors du parsing d'un élément: ${error.message}`);
        stats.errors++;
      }
    });
    
    console.log(`${items.length} films récupérés depuis Filmapik.bio`);
    
    if (items.length === 0) {
      throw new Error('Aucun film récupéré depuis Filmapik.bio');
    }
    
    // Mettre à jour les statistiques
    stats.total_items += items.length;
    stats.real_items += items.length;
    stats.sources.filmapik = {
      items: items.length,
      success: true,
      cached: false
    };
    
    // Sauvegarder dans le cache
    await fs.writeJson(cacheFile, items, { spaces: 2 });
    console.log('Données sauvegardées dans le cache');
    
    // Écrire les données dans le fichier de sortie
    await saveResults(items, 'filmapik');
    
    return {
      success: true,
      message: `${items.length} films récupérés depuis Filmapik.bio`,
      data: items,
      stats
    };
  } catch (error) {
    console.error(`Erreur lors du scraping de Filmapik.bio: ${error.message}`);
    stats.errors++;
    stats.sources.filmapik = {
      items: 0,
      success: false,
      error: error.message
    };
    
    return {
      success: false,
      message: `Erreur: ${error.message}`,
      stats
    };
  }
}

/**
 * Vérifie si le cache est disponible et valide
 */
async function checkCache(cacheFile) {
  try {
    if (await fs.pathExists(cacheFile)) {
      const stats = await fs.stat(cacheFile);
      const age = Date.now() - stats.mtimeMs;
      
      if (age < CACHE_TTL) {
        return true;
      }
      
      console.log(`Cache expiré (${Math.round(age / 60000)} minutes > ${Math.round(CACHE_TTL / 60000)} minutes)`);
    }
  } catch (error) {
    console.warn(`Erreur lors de la vérification du cache: ${error.message}`);
  }
  
  return false;
}

/**
 * Scrape une URL avec retry en cas d'échec
 */
async function scrapeWithRetry(url) {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`Tentative ${attempt}/${RETRY_ATTEMPTS} pour ${url}`);
      
      const response = await axios.post(SCRAPEOWL_API_URL, {
        api_key: SCRAPEOWL_API_KEY,
        url: url,
        render_js: true,
        premium_proxy: true,
        country: 'fr'
      });
      
      if (response.data && response.data.success && response.data.html) {
        return response.data.html;
      }
      
      throw new Error(response.data.message || 'Réponse invalide de ScrapingOwl');
    } catch (error) {
      console.warn(`Échec de la tentative ${attempt}: ${error.message}`);
      
      if (attempt < RETRY_ATTEMPTS) {
        console.log(`Attente de ${RETRY_DELAY / 1000} secondes avant la prochaine tentative...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        throw error;
      }
    }
  }
  
  return null;
}

/**
 * Parse un élément de film depuis Filmapik.bio
 */
function parseFilmapikItem($, element) {
  try {
    const $item = $(element);
    const $link = $item.find('.ml-mask');
    const $title = $item.find('.mli-info h2');
    
    // Extraire l'URL et l'ID
    const url = $link.attr('href');
    const id = url ? url.split('/').pop() : null;
    
    if (!id) {
      return null;
    }
    
    // Extraire le titre
    const title = $title.text().trim();
    
    // Extraire l'image
    const poster = $link.data('original') || $link.attr('style')?.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
    
    // Extraire l'année
    const yearMatch = $item.find('.mli-info').text().match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    // Extraire la note
    const ratingText = $item.find('.rating').text().trim();
    const ratingMatch = ratingText.match(/([0-9.]+)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    
    // Créer l'objet film
    return {
      id: `filmapik_${id}`,
      title,
      original_title: title,
      url: url,
      poster: poster,
      backdrop: poster,
      year: year,
      rating: rating,
      source: 'filmapik',
      type: 'film',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Erreur lors du parsing d'un film: ${error.message}`);
    return null;
  }
}

/**
 * Sauvegarde les résultats dans un fichier JSON
 */
async function saveResults(items, source) {
  try {
    // Créer le répertoire de sortie s'il n'existe pas
    const outputFile = path.join(OUTPUT_DIR, `${source}.json`);
    await fs.writeJson(outputFile, items, { spaces: 2 });
    console.log(`Données sauvegardées dans ${outputFile}`);
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des résultats: ${error.message}`);
    return false;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main()
    .then(result => {
      console.log('\nRésultat du scraping:');
      console.log(JSON.stringify(result.stats, null, 2));
      
      if (result.success) {
        console.log('Scraping terminé avec succès');
        process.exit(0);
      } else {
        console.error('Échec du scraping');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

// Exporter les fonctions pour utilisation dans d'autres scripts
module.exports = {
  scrapeFilmapik: main,
  parseFilmapikItem
};
