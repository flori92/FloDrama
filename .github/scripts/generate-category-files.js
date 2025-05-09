const fs = require('fs-extra');
const path = require('path');

// Configuration
const DATA_DIR = process.env.DATA_DIR || './Frontend/src/data/content';
const CATEGORIES = (process.env.CATEGORIES || 'dramas,animes,films,bollywood,trending,featured').split(',');
const MIN_ITEMS_PER_CATEGORY = parseInt(process.env.MIN_ITEMS_PER_CATEGORY || '100');

// Fonction pour générer un fichier par catégorie
function generateCategoryFile(category) {
  console.log(`Génération du fichier pour la catégorie: ${category}`);
  
  // Créer le répertoire de la catégorie s'il n'existe pas
  const categoryDir = path.join(DATA_DIR, category);
  fs.ensureDirSync(categoryDir);
  
  // Fichiers sources selon la catégorie
  let sourceFiles = [];
  
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
  
  // Collecter les éléments de toutes les sources pour cette catégorie
  let allItems = [];
  
  sourceFiles.forEach(source => {
    const sourceFile = path.join(DATA_DIR, `${source}.json`);
    
    if (fs.existsSync(sourceFile)) {
      try {
        const sourceData = fs.readJsonSync(sourceFile);
        
        if (sourceData && Array.isArray(sourceData.results)) {
          // Ajouter la source comme propriété
          const itemsWithSource = sourceData.results.map(item => ({
            ...item,
            source: source
          }));
          
          allItems = [...allItems, ...itemsWithSource];
        }
      } catch (error) {
        console.warn(`Erreur lors de la lecture de ${sourceFile}:`, error.message);
      }
    } else {
      console.warn(`Fichier source ${sourceFile} introuvable.`);
    }
  });
  
  // S'assurer d'avoir au moins le minimum d'éléments requis
  if (allItems.length < MIN_ITEMS_PER_CATEGORY) {
    console.warn(`Attention: seulement ${allItems.length} éléments trouvés pour ${category}, minimum requis: ${MIN_ITEMS_PER_CATEGORY}`);
    
    // Générer des éléments supplémentaires si nécessaire
    const missingCount = MIN_ITEMS_PER_CATEGORY - allItems.length;
    
    if (missingCount > 0) {
      console.log(`Génération de ${missingCount} éléments supplémentaires pour ${category}...`);
      
      for (let i = 1; i <= missingCount; i++) {
        allItems.push({
          id: `generated-${category}-${i}`,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${i}`,
          description: `Contenu ${category} généré automatiquement pour atteindre le minimum requis.`,
          poster: `/placeholders/${category}-poster.jpg`,
          backdrop: `/placeholders/${category}-backdrop.jpg`,
          rating: (Math.random() * 5 + 5).toFixed(1),
          year: 2025 - Math.floor(Math.random() * 5),
          source: 'generated'
        });
      }
    }
  }
  
  // Limiter le nombre d'éléments si nécessaire (pour featured par exemple)
  if (category === 'featured' && allItems.length > 10) {
    // Pour featured, prendre seulement les 10 meilleurs éléments
    allItems = allItems
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 10);
  }
  
  // Écrire le fichier index.json
  const indexFile = path.join(categoryDir, 'index.json');
  fs.writeJsonSync(indexFile, { results: allItems }, { spaces: 2 });
  
  // Écrire aussi un fichier au niveau supérieur pour la compatibilité
  const categoryFile = path.join(DATA_DIR, `${category}.json`);
  fs.writeJsonSync(categoryFile, { results: allItems }, { spaces: 2 });
  
  console.log(`${allItems.length} éléments sauvegardés pour ${category}`);
  return allItems.length;
}

// Générer les fichiers pour toutes les catégories
CATEGORIES.forEach(generateCategoryFile);

console.log('Génération des fichiers par catégorie terminée.');
