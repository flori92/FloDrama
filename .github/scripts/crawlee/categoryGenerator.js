/**
 * Générateur de fichiers par catégorie pour FloDrama
 * 
 * Ce script organise les données scrapées en fichiers JSON par catégorie
 * et génère des index optimisés pour une distribution efficace.
 */

const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
  INPUT_DIR: process.env.INPUT_DIR || './Frontend/src/data/content',
  OUTPUT_DIR: process.env.OUTPUT_DIR || './Frontend/src/data/content',
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  MIN_ITEMS_PER_CATEGORY: parseInt(process.env.MIN_ITEMS_PER_CATEGORY || '100'),
  MAX_ITEMS_PER_FILE: parseInt(process.env.MAX_ITEMS_PER_FILE || '1000'),
  GENERATE_CHUNKS: process.env.GENERATE_CHUNKS === 'true',
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '200'),
  INCLUDE_TRENDING: process.env.INCLUDE_TRENDING !== 'false',
  TRENDING_ITEMS_COUNT: parseInt(process.env.TRENDING_ITEMS_COUNT || '20'),
  INCLUDE_HERO_BANNER: process.env.INCLUDE_HERO_BANNER !== 'false',
  HERO_BANNER_ITEMS_COUNT: parseInt(process.env.HERO_BANNER_ITEMS_COUNT || '5')
};

/**
 * Fonction principale
 */
async function generateCategoryFiles() {
  console.log('='.repeat(80));
  console.log(`FloDrama - Générateur de fichiers par catégorie`);
  console.log('='.repeat(80));
  
  // Statistiques
  const stats = {
    total_items: 0,
    categories: {},
    start_time: new Date()
  };
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  
  // Récupérer tous les fichiers JSON sources
  const sourceFiles = await fs.readdir(CONFIG.INPUT_DIR);
  const jsonFiles = sourceFiles.filter(file => 
    file.endsWith('.json') && 
    !file.includes('index') && 
    !file.startsWith('.')
  );
  
  console.log(`\n📂 ${jsonFiles.length} fichiers sources trouvés`);
  
  // Collecter tous les éléments par catégorie
  const categorizedItems = {};
  CONFIG.CATEGORIES.forEach(category => {
    categorizedItems[category] = [];
  });
  
  // Parcourir tous les fichiers sources
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(CONFIG.INPUT_DIR, file);
      const data = await fs.readJson(filePath);
      
      // Vérifier si les données sont un tableau ou un objet avec une propriété results
      const items = Array.isArray(data) ? data : (data.results || []);
      
      if (items.length === 0) {
        console.warn(`⚠️ Aucun élément trouvé dans ${file}`);
        continue;
      }
      
      console.log(`📄 Traitement de ${file}: ${items.length} éléments`);
      
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
          // Ajouter des propriétés utiles si elles n'existent pas
          const enhancedItem = {
            ...item,
            id: item.id || `${item.source}_${Math.random().toString(36).substring(2, 9)}`,
            type: category,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          categorizedItems[category].push(enhancedItem);
        }
      });
      
      stats.total_items += items.length;
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${file}: ${error.message}`);
    }
  }
  
  // Générer les fichiers par catégorie
  for (const category of CONFIG.CATEGORIES) {
    const items = categorizedItems[category];
    stats.categories[category] = items.length;
    
    if (items.length === 0) {
      console.warn(`⚠️ Aucun élément pour la catégorie ${category}`);
      continue;
    }
    
    console.log(`\n📦 Génération des fichiers pour ${category}: ${items.length} éléments`);
    
    // Trier les éléments par année (décroissant) puis par note (décroissant)
    items.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.rating - a.rating;
    });
    
    // Générer le fichier principal pour la catégorie
    const categoryDir = path.join(CONFIG.OUTPUT_DIR, category);
    await fs.ensureDir(categoryDir);
    
    // Générer le fichier index.json
    const indexFile = path.join(categoryDir, 'index.json');
    await fs.writeJson(indexFile, {
      count: items.length,
      results: items.slice(0, CONFIG.MAX_ITEMS_PER_FILE),
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Fichier index généré: ${indexFile} (${Math.min(items.length, CONFIG.MAX_ITEMS_PER_FILE)} éléments)`);
    
    // Générer des fichiers par chunks si nécessaire
    if (CONFIG.GENERATE_CHUNKS && items.length > CONFIG.CHUNK_SIZE) {
      const chunks = Math.ceil(items.length / CONFIG.CHUNK_SIZE);
      
      for (let i = 0; i < chunks; i++) {
        const start = i * CONFIG.CHUNK_SIZE;
        const end = Math.min(start + CONFIG.CHUNK_SIZE, items.length);
        const chunkItems = items.slice(start, end);
        
        const chunkFile = path.join(categoryDir, `chunk_${i + 1}.json`);
        await fs.writeJson(chunkFile, {
          count: chunkItems.length,
          results: chunkItems,
          chunk: i + 1,
          total_chunks: chunks,
          updated_at: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`✅ Chunk ${i + 1}/${chunks} généré: ${chunkFile} (${chunkItems.length} éléments)`);
      }
    }
    
    // Générer le fichier trending.json
    if (CONFIG.INCLUDE_TRENDING) {
      // Sélectionner les éléments les plus récents avec les meilleures notes
      const trendingItems = [...items]
        .sort((a, b) => {
          // Favoriser les éléments récents (des 2 dernières années)
          const currentYear = new Date().getFullYear();
          const aIsRecent = a.year >= currentYear - 2;
          const bIsRecent = b.year >= currentYear - 2;
          
          if (aIsRecent !== bIsRecent) return aIsRecent ? -1 : 1;
          
          // Ensuite trier par note
          return b.rating - a.rating;
        })
        .slice(0, CONFIG.TRENDING_ITEMS_COUNT);
      
      const trendingFile = path.join(categoryDir, 'trending.json');
      await fs.writeJson(trendingFile, {
        count: trendingItems.length,
        results: trendingItems,
        updated_at: new Date().toISOString()
      }, { spaces: 2 });
      
      console.log(`✅ Fichier trending généré: ${trendingFile} (${trendingItems.length} éléments)`);
    }
    
    // Générer le fichier hero_banner.json
    if (CONFIG.INCLUDE_HERO_BANNER) {
      // Sélectionner les éléments récents avec les meilleures notes et de bonnes images
      const heroBannerItems = [...items]
        .filter(item => item.backdrop && item.poster) // Uniquement les éléments avec images
        .sort((a, b) => {
          // Favoriser les éléments très récents (de l'année en cours)
          const currentYear = new Date().getFullYear();
          const aIsVeryRecent = a.year >= currentYear;
          const bIsVeryRecent = b.year >= currentYear;
          
          if (aIsVeryRecent !== bIsVeryRecent) return aIsVeryRecent ? -1 : 1;
          
          // Ensuite trier par note
          return b.rating - a.rating;
        })
        .slice(0, CONFIG.HERO_BANNER_ITEMS_COUNT);
      
      const heroBannerFile = path.join(categoryDir, 'hero_banner.json');
      await fs.writeJson(heroBannerFile, {
        count: heroBannerItems.length,
        results: heroBannerItems,
        updated_at: new Date().toISOString()
      }, { spaces: 2 });
      
      console.log(`✅ Fichier hero_banner généré: ${heroBannerFile} (${heroBannerItems.length} éléments)`);
    }
  }
  
  // Générer un fichier global pour toutes les catégories
  const globalFile = path.join(CONFIG.OUTPUT_DIR, 'global.json');
  await fs.writeJson(globalFile, {
    total_items: stats.total_items,
    categories: stats.categories,
    updated_at: new Date().toISOString()
  }, { spaces: 2 });
  
  console.log(`\n✅ Fichier global généré: ${globalFile}`);
  
  // Calculer la durée
  const duration = new Date() - stats.start_time;
  const durationFormatted = formatDuration(duration);
  
  // Afficher les statistiques
  console.log('\n📊 Statistiques:');
  console.log(`⏱️ Durée: ${durationFormatted}`);
  console.log(`📦 Total d'éléments: ${stats.total_items}`);
  
  for (const [category, count] of Object.entries(stats.categories)) {
    console.log(`- ${category}: ${count} éléments`);
  }
  
  return stats;
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

// Exporter la fonction pour utilisation dans d'autres scripts
module.exports = { generateCategoryFiles };

// Exécuter la fonction principale si appelé directement
if (require.main === module) {
  generateCategoryFiles()
    .then(() => {
      console.log('\n✨ Génération des fichiers terminée avec succès!');
      process.exit(0);
    })
    .catch(error => {
      console.error(`\n❌ Erreur lors de la génération des fichiers: ${error.message}`);
      process.exit(1);
    });
}
