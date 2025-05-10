/**
 * Module de distribution des données pour FloDrama
 * 
 * Ce module organise les données enrichies pour l'application FloDrama,
 * en créant les fichiers nécessaires pour les grilles et les bannières
 */

const fs = require('fs-extra');
const path = require('path');
const CONFIG = require('./config');

/**
 * Génère les fichiers pour une catégorie
 */
async function generateCategoryFiles(category, debug = false) {
  try {
    console.log(`[DISTRIBUTION] Génération des fichiers pour la catégorie ${category}...`);
    
    // Créer le répertoire de la catégorie
    const categoryDir = path.join(CONFIG.OUTPUT_DIR, category);
    await fs.ensureDir(categoryDir);
    
    // Récupérer tous les fichiers enrichis
    const sourceFiles = await fs.readdir(CONFIG.OUTPUT_DIR);
    const enrichedFiles = sourceFiles.filter(file => 
      file.endsWith('_enriched.json') && 
      !file.includes('index')
    );
    
    // Collecter tous les éléments de la catégorie
    const items = [];
    
    for (const file of enrichedFiles) {
      try {
        const filePath = path.join(CONFIG.OUTPUT_DIR, file);
        const data = await fs.readJson(filePath);
        
        // Vérifier si les données sont un tableau
        if (Array.isArray(data)) {
          // Filtrer les éléments par catégorie
          const categoryItems = data.filter(item => {
            const itemCategory = item.content_type || item.type || '';
            
            // Mapper les types spécifiques aux catégories générales
            if (category === 'drama' && ['kdrama', 'cdrama', 'jdrama', 'drama', 'series'].includes(itemCategory)) {
              return true;
            } else if (category === 'anime' && ['anime', 'animation'].includes(itemCategory)) {
              return true;
            } else if (category === 'film' && ['film', 'movie', 'movies'].includes(itemCategory)) {
              return true;
            } else if (category === 'bollywood' && ['bollywood', 'indian'].includes(itemCategory)) {
              return true;
            } else if (itemCategory === category) {
              return true;
            }
            
            return false;
          });
          
          if (debug) {
            console.log(`[DISTRIBUTION] ${categoryItems.length} éléments trouvés dans ${file} pour la catégorie ${category}`);
          }
          
          items.push(...categoryItems);
        }
      } catch (error) {
        console.error(`[DISTRIBUTION] Erreur lors du traitement de ${file}: ${error.message}`);
      }
    }
    
    if (items.length === 0) {
      console.warn(`[DISTRIBUTION] Aucun élément trouvé pour la catégorie ${category}`);
      return false;
    }
    
    // Dédupliquer les éléments par titre
    const uniqueItems = [];
    const titles = new Set();
    
    for (const item of items) {
      if (!titles.has(item.title)) {
        titles.add(item.title);
        uniqueItems.push(item);
      }
    }
    
    console.log(`[DISTRIBUTION] ${uniqueItems.length} éléments uniques pour la catégorie ${category}`);
    
    // Trier les éléments par année (décroissant) puis par note (décroissant)
    uniqueItems.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.rating - a.rating;
    });
    
    // Générer le fichier index.json
    const indexFile = path.join(categoryDir, 'index.json');
    await fs.writeJson(indexFile, {
      count: uniqueItems.length,
      results: uniqueItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`[DISTRIBUTION] Fichier index généré: ${indexFile} (${uniqueItems.length} éléments)`);
    
    // Générer le fichier trending.json (éléments récents avec les meilleures notes)
    const trendingItems = [...uniqueItems]
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
    
    console.log(`[DISTRIBUTION] Fichier trending généré: ${trendingFile} (${trendingItems.length} éléments)`);
    
    // Générer le fichier popular.json (éléments avec les meilleures notes)
    const popularItems = [...uniqueItems]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 20);
    
    const popularFile = path.join(categoryDir, 'popular.json');
    await fs.writeJson(popularFile, {
      count: popularItems.length,
      results: popularItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`[DISTRIBUTION] Fichier popular généré: ${popularFile} (${popularItems.length} éléments)`);
    
    // Générer le fichier recent.json (éléments les plus récents)
    const recentItems = [...uniqueItems]
      .sort((a, b) => b.year - a.year)
      .slice(0, 20);
    
    const recentFile = path.join(categoryDir, 'recent.json');
    await fs.writeJson(recentFile, {
      count: recentItems.length,
      results: recentItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`[DISTRIBUTION] Fichier recent généré: ${recentFile} (${recentItems.length} éléments)`);
    
    // Générer le fichier hero_banner.json (éléments récents avec backdrop, poster et trailer)
    const heroBannerItems = [...uniqueItems]
      .filter(item => item.backdrop && item.poster && item.trailer)
      .sort((a, b) => {
        const currentYear = new Date().getFullYear();
        const aIsVeryRecent = a.year >= currentYear - 1;
        const bIsVeryRecent = b.year >= currentYear - 1;
        
        if (aIsVeryRecent !== bIsVeryRecent) return aIsVeryRecent ? -1 : 1;
        return b.rating - a.rating;
      })
      .slice(0, CONFIG.UI_CONFIG.HERO_BANNER.count);
    
    const heroBannerFile = path.join(categoryDir, 'hero_banner.json');
    await fs.writeJson(heroBannerFile, {
      count: heroBannerItems.length,
      results: heroBannerItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`[DISTRIBUTION] Fichier hero_banner généré: ${heroBannerFile} (${heroBannerItems.length} éléments)`);
    
    // Générer des fichiers pour chaque genre populaire
    const genres = new Map();
    
    for (const item of uniqueItems) {
      if (item.genres && Array.isArray(item.genres)) {
        for (const genre of item.genres) {
          if (!genres.has(genre)) {
            genres.set(genre, []);
          }
          genres.get(genre).push(item);
        }
      }
    }
    
    // Trier les genres par nombre d'éléments et prendre les 10 premiers
    const topGenres = [...genres.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    
    for (const [genre, genreItems] of topGenres) {
      if (genreItems.length >= 5) {
        const genreSlug = genre.toLowerCase().replace(/\s+/g, '_');
        const genreFile = path.join(categoryDir, `genre_${genreSlug}.json`);
        
        await fs.writeJson(genreFile, {
          genre,
          count: genreItems.length,
          results: genreItems.sort((a, b) => b.rating - a.rating),
          updated_at: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`[DISTRIBUTION] Fichier genre généré: ${genreFile} (${genreItems.length} éléments)`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[DISTRIBUTION] Erreur lors de la génération des fichiers pour la catégorie ${category}: ${error.message}`);
    return false;
  }
}

/**
 * Génère le fichier global.json
 */
async function generateGlobalFile(debug = false) {
  try {
    console.log(`[DISTRIBUTION] Génération du fichier global.json...`);
    
    // Collecter les statistiques par catégorie
    const stats = {};
    let totalItems = 0;
    
    for (const category of CONFIG.CATEGORIES) {
      const categoryDir = path.join(CONFIG.OUTPUT_DIR, category);
      const indexFile = path.join(categoryDir, 'index.json');
      
      if (await fs.pathExists(indexFile)) {
        const data = await fs.readJson(indexFile);
        stats[category] = data.count;
        totalItems += data.count;
      } else {
        stats[category] = 0;
      }
    }
    
    // Générer le fichier global.json
    const globalFile = path.join(CONFIG.OUTPUT_DIR, 'global.json');
    await fs.writeJson(globalFile, {
      total_items: totalItems,
      categories: stats,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`[DISTRIBUTION] Fichier global généré: ${globalFile}`);
    
    return true;
  } catch (error) {
    console.error(`[DISTRIBUTION] Erreur lors de la génération du fichier global: ${error.message}`);
    return false;
  }
}

/**
 * Génère le fichier search_index.json
 */
async function generateSearchIndex(debug = false) {
  try {
    console.log(`[DISTRIBUTION] Génération du fichier search_index.json...`);
    
    // Collecter tous les éléments
    const allItems = [];
    
    for (const category of CONFIG.CATEGORIES) {
      const categoryDir = path.join(CONFIG.OUTPUT_DIR, category);
      const indexFile = path.join(categoryDir, 'index.json');
      
      if (await fs.pathExists(indexFile)) {
        const data = await fs.readJson(indexFile);
        
        if (data.results && Array.isArray(data.results)) {
          // Créer des entrées simplifiées pour l'index de recherche
          const searchItems = data.results.map(item => ({
            id: item.id,
            title: item.title,
            original_title: item.original_title,
            poster: item.poster,
            year: item.year,
            rating: item.rating,
            content_type: category,
            genres: item.genres || []
          }));
          
          allItems.push(...searchItems);
        }
      }
    }
    
    // Générer le fichier search_index.json
    const searchIndexFile = path.join(CONFIG.OUTPUT_DIR, 'search_index.json');
    await fs.writeJson(searchIndexFile, {
      count: allItems.length,
      results: allItems,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`[DISTRIBUTION] Fichier search_index généré: ${searchIndexFile} (${allItems.length} éléments)`);
    
    return true;
  } catch (error) {
    console.error(`[DISTRIBUTION] Erreur lors de la génération de l'index de recherche: ${error.message}`);
    return false;
  }
}

/**
 * Génère tous les fichiers nécessaires pour l'application
 */
async function generateAllFiles(debug = false) {
  try {
    console.log(`[DISTRIBUTION] Génération de tous les fichiers...`);
    
    // Créer le répertoire de sortie
    await fs.ensureDir(CONFIG.OUTPUT_DIR);
    
    // Générer les fichiers pour chaque catégorie
    let successCount = 0;
    
    for (const category of CONFIG.CATEGORIES) {
      const success = await generateCategoryFiles(category, debug);
      
      if (success) {
        successCount++;
      }
    }
    
    // Générer le fichier global
    await generateGlobalFile(debug);
    
    // Générer l'index de recherche
    await generateSearchIndex(debug);
    
    console.log(`[DISTRIBUTION] ${successCount}/${CONFIG.CATEGORIES.length} catégories traitées`);
    
    return successCount > 0;
  } catch (error) {
    console.error(`[DISTRIBUTION] Erreur lors de la génération des fichiers: ${error.message}`);
    return false;
  }
}

module.exports = {
  generateCategoryFiles,
  generateGlobalFile,
  generateSearchIndex,
  generateAllFiles
};
