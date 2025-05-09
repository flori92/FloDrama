const fs = require('fs-extra');
const path = require('path');

// Configuration
const DATA_DIR = process.env.DATA_DIR || './Frontend/src/data/content';
const CATEGORIES = (process.env.CATEGORIES || 'dramas,animes,films,bollywood,trending,featured').split(',');
const MIN_ITEMS_PER_CATEGORY = parseInt(process.env.MIN_ITEMS_PER_CATEGORY || '100');
const MAX_ITEMS_PER_CATEGORY = parseInt(process.env.MAX_ITEMS_PER_CATEGORY || '200');
const PREFER_REAL_DATA = process.env.PREFER_REAL_DATA !== 'false'; // Par défaut, préférer les données réelles
const LOGS_ENABLED = process.env.LOGS_ENABLED !== 'false'; // Activer les logs détaillés par défaut

// Créer le répertoire de logs s'il n'existe pas
const logsDir = path.join(DATA_DIR, 'logs');
fs.ensureDirSync(logsDir);

// Statistiques globales
const stats = {
  total_items: 0,
  real_items: 0,
  mock_items: 0,
  fallback_items: 0,
  categories_processed: 0,
  sources_used: new Set(),
  start_time: new Date(),
  end_time: null,
  duration_ms: 0
};

/**
 * Génère un fichier de contenu pour une catégorie spécifique
 * @param {string} category - Catégorie à générer
 * @returns {number} - Nombre d'éléments générés
 */
function generateCategoryFile(category) {
  console.log(`Génération du fichier pour la catégorie: ${category}`);
  
  // Créer le répertoire de la catégorie s'il n'existe pas
  const categoryDir = path.join(DATA_DIR, category);
  fs.ensureDirSync(categoryDir);
  
  // Fichiers sources selon la catégorie
  let sourceFiles = [];
  let categoryStats = {
    category,
    total_items: 0,
    real_items: 0,
    mock_items: 0,
    fallback_items: 0,
    sources_processed: 0,
    sources_failed: 0,
    sources: []
  };
  
  // Définir les sources pour chaque catégorie
  switch (category) {
    case 'dramas':
      sourceFiles = ['vostfree', 'dramacool', 'myasiantv', 'voirdrama', 'viki', 'wetv', 'iqiyi', 'kocowa'];
      break;
    case 'animes':
      sourceFiles = ['gogoanime', 'voiranime', 'nekosama'];
      break;
    case 'films':
      // Pour l'instant, utiliser des dramas comme films
      sourceFiles = ['vostfree', 'dramacool'];
      break;
    case 'bollywood':
      sourceFiles = ['bollywoodmdb', 'zee5', 'hotstar'];
      break;
    case 'trending':
      // Utiliser un mix de toutes les sources
      sourceFiles = ['vostfree', 'gogoanime', 'bollywoodmdb'];
      break;
    case 'featured':
      // Sélectionner les meilleurs éléments pour la bannière
      sourceFiles = ['mydramalist', 'viki'];
      break;
  }
  
  if (LOGS_ENABLED) {
    console.log(`[${category}] Utilisation de ${sourceFiles.length} sources: ${sourceFiles.join(', ')}`);
  }
  
  // Collecter les éléments de toutes les sources pour cette catégorie
  let allItems = [];
  let realItems = [];
  let mockItems = [];
  let fallbackItems = [];
  
  // Ajouter les sources utilisées aux statistiques globales
  sourceFiles.forEach(source => stats.sources_used.add(source));
  
  // Traiter chaque source
  sourceFiles.forEach(source => {
    const sourceFile = path.join(DATA_DIR, `${source}.json`);
    let sourceStats = {
      source,
      found: false,
      valid: false,
      item_count: 0,
      real_count: 0,
      mock_count: 0,
      fallback_count: 0,
      error: null
    };
    
    if (fs.existsSync(sourceFile)) {
      try {
        const sourceData = fs.readJsonSync(sourceFile);
        sourceStats.found = true;
        
        if (sourceData && Array.isArray(sourceData.results)) {
          sourceStats.valid = true;
          
          // Ajouter la source comme propriété si elle n'existe pas déjà
          const itemsWithSource = sourceData.results.map(item => ({
            ...item,
            source: item.source || source
          }));
          
          // Compter les types d'éléments
          const realSourceItems = itemsWithSource.filter(item => !item.is_mock && !item.is_fallback);
          const mockSourceItems = itemsWithSource.filter(item => item.is_mock && !item.is_fallback);
          const fallbackSourceItems = itemsWithSource.filter(item => item.is_fallback);
          
          // Mettre à jour les statistiques de la source
          sourceStats.item_count = itemsWithSource.length;
          sourceStats.real_count = realSourceItems.length;
          sourceStats.mock_count = mockSourceItems.length;
          sourceStats.fallback_count = fallbackSourceItems.length;
          
          // Ajouter les éléments aux listes appropriées
          realItems = [...realItems, ...realSourceItems];
          mockItems = [...mockItems, ...mockSourceItems];
          fallbackItems = [...fallbackItems, ...fallbackSourceItems];
          
          if (LOGS_ENABLED) {
            console.log(`[${category}][${source}] ${itemsWithSource.length} éléments trouvés (réels: ${realSourceItems.length}, mockés: ${mockSourceItems.length}, fallback: ${fallbackSourceItems.length})`);
          }
        } else {
          sourceStats.error = 'Format de données invalide';
          console.warn(`[${category}][${source}] Format de données invalide dans ${sourceFile}`);
        }
      } catch (error) {
        sourceStats.error = error.message;
        console.warn(`[${category}][${source}] Erreur lors de la lecture de ${sourceFile}: ${error.message}`);
      }
    } else {
      sourceStats.error = 'Fichier introuvable';
      console.warn(`[${category}][${source}] Fichier source ${sourceFile} introuvable`);
    }
    
    // Ajouter les statistiques de cette source
    categoryStats.sources.push(sourceStats);
    if (sourceStats.valid) {
      categoryStats.sources_processed++;
    } else {
      categoryStats.sources_failed++;
    }
  });
  
  // Prioritiser les données réelles si demandé
  if (PREFER_REAL_DATA) {
    // Utiliser d'abord les données réelles
    allItems = [...realItems];
    
    // Compléter avec des données mockées si nécessaire
    if (allItems.length < MIN_ITEMS_PER_CATEGORY) {
      const remainingNeeded = MIN_ITEMS_PER_CATEGORY - allItems.length;
      const availableMock = mockItems.length;
      
      if (availableMock > 0) {
        const mockToAdd = Math.min(remainingNeeded, availableMock);
        console.log(`[${category}] Ajout de ${mockToAdd} éléments mockés pour compléter`);
        allItems = [...allItems, ...mockItems.slice(0, mockToAdd)];
      }
    }
    
    // Compléter avec des données de fallback en dernier recours
    if (allItems.length < MIN_ITEMS_PER_CATEGORY) {
      const remainingNeeded = MIN_ITEMS_PER_CATEGORY - allItems.length;
      const availableFallback = fallbackItems.length;
      
      if (availableFallback > 0) {
        const fallbackToAdd = Math.min(remainingNeeded, availableFallback);
        console.log(`[${category}] Ajout de ${fallbackToAdd} éléments de fallback pour compléter`);
        allItems = [...allItems, ...fallbackItems.slice(0, fallbackToAdd)];
      }
    }
  } else {
    // Utiliser toutes les données disponibles sans priorité
    allItems = [...realItems, ...mockItems, ...fallbackItems];
  }
  
  // S'assurer d'avoir au moins le minimum d'éléments requis
  if (allItems.length < MIN_ITEMS_PER_CATEGORY) {
    console.warn(`[${category}] Attention: seulement ${allItems.length} éléments disponibles, minimum requis: ${MIN_ITEMS_PER_CATEGORY}`);
    
    // Générer des éléments supplémentaires si nécessaire
    const missingCount = MIN_ITEMS_PER_CATEGORY - allItems.length;
    
    if (missingCount > 0) {
      console.log(`[${category}] Génération de ${missingCount} éléments supplémentaires...`);
      
      // Générer des titres plus réalistes en fonction de la catégorie
      const titlePrefixes = {
        'dramas': ['Korean', 'Chinese', 'Japanese', 'Thai', 'Taiwanese'],
        'animes': ['Shonen', 'Shojo', 'Seinen', 'Isekai', 'Mecha'],
        'bollywood': ['Bollywood', 'Indian', 'Mumbai', 'Delhi', 'Chennai'],
        'films': ['Asian', 'Korean', 'Chinese', 'Japanese', 'Thai'],
        'trending': ['Popular', 'Trending', 'Hot', 'New', 'Viral'],
        'featured': ['Featured', 'Recommended', 'Top', 'Best', 'Premium']
      };
      
      const titleSuffixes = {
        'dramas': ['Love', 'Story', 'Secret', 'Romance', 'Family', 'Doctor', 'Lawyer', 'Business'],
        'animes': ['Adventure', 'Quest', 'Ninja', 'Academy', 'Hero', 'Titan', 'Dragon', 'Slayer'],
        'bollywood': ['Dance', 'Song', 'Wedding', 'Family', 'Love', 'Action', 'Hero', 'Romance'],
        'films': ['Movie', 'Action', 'Thriller', 'Romance', 'Comedy', 'Drama', 'Horror', 'Mystery'],
        'trending': ['Sensation', 'Phenomenon', 'Craze', 'Obsession', 'Favorite', 'Choice', 'Pick'],
        'featured': ['Selection', 'Choice', 'Pick', 'Highlight', 'Showcase', 'Spotlight', 'Gem']
      };
      
      const categoryPrefix = titlePrefixes[category] || titlePrefixes['dramas'];
      const categorySuffix = titleSuffixes[category] || titleSuffixes['dramas'];
      
      for (let i = 1; i <= missingCount; i++) {
        // Générer un titre plus réaliste
        const prefix = categoryPrefix[Math.floor(Math.random() * categoryPrefix.length)];
        const suffix = categorySuffix[Math.floor(Math.random() * categorySuffix.length)];
        const title = `${prefix} ${suffix} ${i}`;
        
        // Générer une description plus réaliste
        const descriptions = [
          `Une histoire captivante qui vous tiendra en haleine du début à la fin.`,
          `Découvrez l'histoire extraordinaire de personnages attachants dans ce ${category}.`,
          `Une production originale avec des scènes mémorables et des personnages charismatiques.`,
          `Une aventure épique remplie d'émotions et de rebondissements inattendus.`,
          `Un chef-d'œuvre du genre qui a conquis des millions de spectateurs à travers le monde.`
        ];
        
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        // Ajouter l'élément généré
        const generatedItem = {
          id: `generated-${category}-${i}`,
          title: title,
          original_title: title,
          description: description,
          poster: `/placeholders/${category}-poster.jpg`,
          backdrop: `/placeholders/${category}-backdrop.jpg`,
          rating: (Math.random() * 3 + 7).toFixed(1), // Entre 7.0 et 10.0
          year: 2024 - Math.floor(Math.random() * 5), // Entre 2019 et 2024
          source: 'generated',
          is_mock: true,
          is_generated: true,
          genres: [category.charAt(0).toUpperCase() + category.slice(1)],
          episodes_count: category === 'dramas' ? Math.floor(Math.random() * 16) + 8 : null // Entre 8 et 24 épisodes pour les dramas
        };
        
        allItems.push(generatedItem);
        mockItems.push(generatedItem);
      }
    }
  }
  
  // Limiter le nombre d'éléments si nécessaire
  if (allItems.length > MAX_ITEMS_PER_CATEGORY) {
    console.log(`[${category}] Limitation à ${MAX_ITEMS_PER_CATEGORY} éléments (${allItems.length} disponibles)`);
    
    // Trier par rating décroissant
    allItems = allItems.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
    
    // Pour featured, prendre un nombre limité d'éléments
    if (category === 'featured') {
      allItems = allItems.slice(0, 10); // Limiter à 10 pour featured
    } else {
      allItems = allItems.slice(0, MAX_ITEMS_PER_CATEGORY);
    }
  }
  
  // Mettre à jour les statistiques de la catégorie
  categoryStats.total_items = allItems.length;
  categoryStats.real_items = realItems.length;
  categoryStats.mock_items = mockItems.length;
  categoryStats.fallback_items = fallbackItems.length;
  
  // Mettre à jour les statistiques globales
  stats.total_items += allItems.length;
  stats.real_items += realItems.length;
  stats.mock_items += mockItems.length;
  stats.fallback_items += fallbackItems.length;
  stats.categories_processed++;
  
  // Écrire le fichier index.json
  const indexFile = path.join(categoryDir, 'index.json');
  fs.writeJsonSync(indexFile, { results: allItems }, { spaces: 2 });
  
  // Écrire aussi un fichier au niveau supérieur pour la compatibilité
  const categoryFile = path.join(DATA_DIR, `${category}.json`);
  fs.writeJsonSync(categoryFile, { results: allItems }, { spaces: 2 });
  
  // Sauvegarder les statistiques de la catégorie
  const statsFile = path.join(logsDir, `${category}-stats.json`);
  fs.writeJsonSync(statsFile, categoryStats, { spaces: 2 });
  
  console.log(`[${category}] ${allItems.length} éléments sauvegardés (réels: ${realItems.length}, mockés: ${mockItems.length}, fallback: ${fallbackItems.length})`);
  return allItems.length;
}

/**
 * Génère un rapport de statistiques global
 */
function generateStatsReport() {
  // Calculer la durée d'exécution
  stats.end_time = new Date();
  stats.duration_ms = stats.end_time - stats.start_time;
  stats.duration_formatted = `${Math.floor(stats.duration_ms / 1000)}s ${stats.duration_ms % 1000}ms`;
  
  // Convertir le Set en tableau pour la sérialisation JSON
  stats.sources_used = Array.from(stats.sources_used);
  
  // Sauvegarder les statistiques globales
  const globalStatsFile = path.join(logsDir, 'global-stats.json');
  fs.writeJsonSync(globalStatsFile, stats, { spaces: 2 });
  
  // Générer un rapport texte
  console.log('\n=== RAPPORT DE GÉNÉRATION DE CONTENU ===');
  console.log(`Date: ${stats.end_time.toISOString()}`);
  console.log(`Durée: ${stats.duration_formatted}`);
  console.log(`Catégories traitées: ${stats.categories_processed}/${CATEGORIES.length}`);
  console.log(`Sources utilisées: ${stats.sources_used.length}`);
  console.log(`Total d'éléments: ${stats.total_items}`);
  console.log(`Éléments réels: ${stats.real_items} (${Math.round(stats.real_items / stats.total_items * 100)}%)`);
  console.log(`Éléments mockés: ${stats.mock_items} (${Math.round(stats.mock_items / stats.total_items * 100)}%)`);
  console.log(`Éléments fallback: ${stats.fallback_items} (${Math.round(stats.fallback_items / stats.total_items * 100)}%)`);
  console.log('======================================');
  
  // Retourner un message de succès ou d'échec
  if (stats.real_items === 0) {
    console.warn('\n⚠️ ATTENTION: Aucune donnée réelle n\'a été récupérée! Vérifiez la configuration de l\'API de scraping.');
    return false;
  } else if (stats.real_items < stats.total_items * 0.5) {
    console.warn(`\n⚠️ ATTENTION: Seulement ${Math.round(stats.real_items / stats.total_items * 100)}% des données sont réelles. Vérifiez la configuration de l\'API de scraping.`);
    return true;
  } else {
    console.log('\n✅ Génération des fichiers par catégorie terminée avec succès!');
    return true;
  }
}

// Générer les fichiers pour toutes les catégories
CATEGORIES.forEach(generateCategoryFile);

// Générer le rapport de statistiques
const success = generateStatsReport();

// Sortir avec un code d'erreur si aucune donnée réelle n'a été récupérée
if (!success) {
  process.exit(1);
}
