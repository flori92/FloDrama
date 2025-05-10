/**
 * Générateur d'index de recherche pour FloDrama
 * 
 * Ce script crée un index de recherche optimisé pour permettre
 * des recherches rapides dans les milliers de contenus de FloDrama.
 */

const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
  INPUT_DIR: process.env.INPUT_DIR || './Frontend/src/data/content',
  OUTPUT_DIR: process.env.OUTPUT_DIR || './Frontend/src/data/search',
  CATEGORIES: ['drama', 'anime', 'film', 'bollywood'],
  MAX_ITEMS_PER_INDEX: parseInt(process.env.MAX_ITEMS_PER_INDEX || '5000'),
  GENERATE_CATEGORY_INDEXES: process.env.GENERATE_CATEGORY_INDEXES !== 'false',
  INCLUDE_FULL_TEXT: process.env.INCLUDE_FULL_TEXT !== 'false',
  INCLUDE_METADATA: process.env.INCLUDE_METADATA !== 'false'
};

/**
 * Fonction principale
 */
async function generateSearchIndex() {
  console.log('='.repeat(80));
  console.log(`FloDrama - Générateur d'index de recherche`);
  console.log('='.repeat(80));
  
  // Statistiques
  const stats = {
    total_items: 0,
    categories: {},
    start_time: new Date()
  };
  
  // Créer les répertoires nécessaires
  await fs.ensureDir(CONFIG.OUTPUT_DIR);
  
  // Récupérer tous les éléments par catégorie
  const allItems = [];
  const categoryItems = {};
  
  for (const category of CONFIG.CATEGORIES) {
    categoryItems[category] = [];
    
    try {
      const categoryDir = path.join(CONFIG.INPUT_DIR, category);
      const indexFile = path.join(categoryDir, 'index.json');
      
      if (await fs.pathExists(indexFile)) {
        const data = await fs.readJson(indexFile);
        const items = data.results || [];
        
        console.log(`📄 Traitement de ${category}: ${items.length} éléments`);
        
        // Ajouter les éléments à la collection globale et par catégorie
        items.forEach(item => {
          // Créer une version allégée pour l'index de recherche
          const searchItem = createSearchItem(item, category);
          allItems.push(searchItem);
          categoryItems[category].push(searchItem);
        });
        
        stats.total_items += items.length;
        stats.categories[category] = items.length;
      } else {
        console.warn(`⚠️ Fichier index non trouvé pour ${category}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${category}: ${error.message}`);
    }
  }
  
  // Générer l'index de recherche global
  if (allItems.length > 0) {
    // Trier les éléments par pertinence (année récente + note élevée)
    allItems.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.rating - a.rating;
    });
    
    // Diviser en chunks si nécessaire
    if (allItems.length > CONFIG.MAX_ITEMS_PER_INDEX) {
      const chunks = Math.ceil(allItems.length / CONFIG.MAX_ITEMS_PER_INDEX);
      
      for (let i = 0; i < chunks; i++) {
        const start = i * CONFIG.MAX_ITEMS_PER_INDEX;
        const end = Math.min(start + CONFIG.MAX_ITEMS_PER_INDEX, allItems.length);
        const chunkItems = allItems.slice(start, end);
        
        const chunkFile = path.join(CONFIG.OUTPUT_DIR, `search_index_${i + 1}.json`);
        await fs.writeJson(chunkFile, {
          count: chunkItems.length,
          items: chunkItems,
          chunk: i + 1,
          total_chunks: chunks,
          updated_at: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`✅ Index de recherche ${i + 1}/${chunks} généré: ${chunkFile} (${chunkItems.length} éléments)`);
      }
    } else {
      // Générer un seul fichier d'index
      const indexFile = path.join(CONFIG.OUTPUT_DIR, 'search_index.json');
      await fs.writeJson(indexFile, {
        count: allItems.length,
        items: allItems,
        updated_at: new Date().toISOString()
      }, { spaces: 2 });
      
      console.log(`✅ Index de recherche global généré: ${indexFile} (${allItems.length} éléments)`);
    }
    
    // Générer un fichier de métadonnées pour l'index
    const metaFile = path.join(CONFIG.OUTPUT_DIR, 'search_meta.json');
    await fs.writeJson(metaFile, {
      total_items: allItems.length,
      categories: stats.categories,
      updated_at: new Date().toISOString()
    }, { spaces: 2 });
    
    console.log(`✅ Métadonnées de recherche générées: ${metaFile}`);
  }
  
  // Générer des index par catégorie si demandé
  if (CONFIG.GENERATE_CATEGORY_INDEXES) {
    for (const category of CONFIG.CATEGORIES) {
      const items = categoryItems[category];
      
      if (items.length > 0) {
        const categoryFile = path.join(CONFIG.OUTPUT_DIR, `search_${category}.json`);
        await fs.writeJson(categoryFile, {
          count: items.length,
          items: items,
          category: category,
          updated_at: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`✅ Index de recherche pour ${category} généré: ${categoryFile} (${items.length} éléments)`);
      }
    }
  }
  
  // Calculer la durée
  const duration = new Date() - stats.start_time;
  const durationFormatted = formatDuration(duration);
  
  // Afficher les statistiques
  console.log('\n📊 Statistiques:');
  console.log(`⏱️ Durée: ${durationFormatted}`);
  console.log(`📦 Total d'éléments indexés: ${stats.total_items}`);
  
  for (const [category, count] of Object.entries(stats.categories)) {
    console.log(`- ${category}: ${count} éléments`);
  }
  
  return stats;
}

/**
 * Crée un élément optimisé pour l'index de recherche
 * @param {Object} item - Élément original
 * @param {string} category - Catégorie de l'élément
 * @returns {Object} - Élément optimisé pour la recherche
 */
function createSearchItem(item, category) {
  // Version de base (minimale)
  const searchItem = {
    id: item.id,
    title: item.title,
    type: category
  };
  
  // Ajouter des métadonnées si demandé
  if (CONFIG.INCLUDE_METADATA) {
    Object.assign(searchItem, {
      original_title: item.original_title,
      year: item.year,
      rating: item.rating,
      source: item.source,
      language: item.language || 'unknown'
    });
  }
  
  // Ajouter le texte complet si demandé
  if (CONFIG.INCLUDE_FULL_TEXT) {
    // Créer un champ de recherche qui combine tous les textes pertinents
    searchItem.search_text = [
      item.title,
      item.original_title,
      item.description,
      item.genres?.join(' '),
      item.actors?.join(' '),
      item.directors?.join(' '),
      item.tags?.join(' '),
      item.year?.toString(),
      category
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
  
  return searchItem;
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
module.exports = { generateSearchIndex };

// Exécuter la fonction principale si appelé directement
if (require.main === module) {
  generateSearchIndex()
    .then(() => {
      console.log('\n✨ Génération de l\'index de recherche terminée avec succès!');
      process.exit(0);
    })
    .catch(error => {
      console.error(`\n❌ Erreur lors de la génération de l'index de recherche: ${error.message}`);
      process.exit(1);
    });
}
