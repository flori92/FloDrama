/**
 * Génère les fichiers par catégorie en agrégeant les données des différentes sources
 * Ce script est utilisé par scrape-content.js pour créer les fichiers index.json par catégorie
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Génère les fichiers par catégorie en agrégeant les données des différentes sources
 * @param {string} outputDir - Répertoire de sortie
 * @param {number} minItemsPerSource - Nombre minimum d'éléments par source
 * @returns {Promise<Object>} - Statistiques des catégories générées
 */
async function generateCategoryFiles(outputDir, minItemsPerSource) {
  console.log('\nGénération des fichiers par catégorie...');
  
  // Définir les catégories à générer
  const categories = ['dramas', 'animes', 'bollywood', 'films'];
  
  // Créer le répertoire de sortie par catégorie
  fs.ensureDirSync(outputDir);
  
  // Statistiques des catégories
  const categoryStats = {};
  
  // Pour chaque catégorie
  for (const category of categories) {
    console.log(`Génération du fichier pour la catégorie: ${category}`);
    
    // Collecter tous les éléments de cette catégorie
    const allItems = [];
    let realItemsCount = 0;
    let fallbackItemsCount = 0;
    let mockItemsCount = 0;
    
    // Parcourir tous les fichiers JSON des sources
    const sourceFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.json'));
    
    for (const sourceFile of sourceFiles) {
      try {
        const sourceData = fs.readJsonSync(path.join(outputDir, sourceFile));
        
        // Vérifier si cette source appartient à la catégorie actuelle
        if (sourceData.category === category) {
          console.log(`  - Ajout de ${sourceData.items.length} éléments depuis ${sourceData.source}`);
          
          // Ajouter les éléments de cette source
          for (const item of sourceData.items) {
            // Ajouter des informations sur la source
            item.source = sourceData.source;
            item.category = category;
            
            // Compter les types d'éléments
            if (item.is_fallback) {
              fallbackItemsCount++;
            } else if (item.is_mock) {
              mockItemsCount++;
            } else {
              realItemsCount++;
            }
            
            // Ajouter l'élément à la liste
            allItems.push(item);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture de ${sourceFile}:`, error.message);
      }
    }
    
    // Vérifier si nous avons suffisamment d'éléments
    const minItemsRequired = minItemsPerSource * 2; // Au moins 2 sources par catégorie
    
    if (allItems.length < minItemsRequired) {
      console.warn(`Attention: Nombre d'éléments insuffisant pour ${category} (${allItems.length}/${minItemsRequired})`);
      
      // Générer des données supplémentaires si nécessaire
      const missingItems = minItemsRequired - allItems.length;
      if (missingItems > 0) {
        console.log(`Génération de ${missingItems} éléments supplémentaires pour ${category}`);
        
        // Générer des éléments mockés supplémentaires
        for (let i = 1; i <= missingItems; i++) {
          allItems.push({
            id: `${category}-extra-${i}`,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Extra ${i}`,
            description: `Élément supplémentaire généré pour compléter la catégorie ${category}`,
            poster: `/placeholders/${category}-poster.jpg`,
            backdrop: `/placeholders/${category}-backdrop.jpg`,
            rating: (Math.random() * 3 + 7).toFixed(1),
            year: 2024 - Math.floor(Math.random() * 5),
            source: `${category}-extra`,
            category: category,
            is_mock: true,
            is_fallback: true
          });
        }
        
        mockItemsCount += missingItems;
      }
    }
    
    // Mélanger les éléments pour éviter de regrouper ceux d'une même source
    const shuffledItems = shuffleArray(allItems);
    
    // Sauvegarder le fichier de catégorie
    const categoryFile = path.join(outputDir, category, 'index.json');
    fs.ensureDirSync(path.dirname(categoryFile));
    
    // Ajouter des métadonnées
    const categoryData = {
      category,
      items: shuffledItems,
      timestamp: new Date().toISOString(),
      count: shuffledItems.length,
      stats: {
        total: shuffledItems.length,
        real: realItemsCount,
        fallback: fallbackItemsCount,
        mock: mockItemsCount,
        real_percentage: Math.round(realItemsCount / shuffledItems.length * 100)
      }
    };
    
    fs.writeFileSync(categoryFile, JSON.stringify(categoryData, null, 2));
    console.log(`Fichier ${category}/index.json généré avec ${shuffledItems.length} éléments`);
    console.log(`  - Éléments réels: ${realItemsCount} (${Math.round(realItemsCount/shuffledItems.length*100)}%)`);
    console.log(`  - Éléments de secours: ${fallbackItemsCount} (${Math.round(fallbackItemsCount/shuffledItems.length*100)}%)`);
    console.log(`  - Éléments mockés: ${mockItemsCount} (${Math.round(mockItemsCount/shuffledItems.length*100)}%)`);
    
    // Mettre à jour les statistiques
    categoryStats[category] = {
      total: shuffledItems.length,
      real: realItemsCount,
      fallback: fallbackItemsCount,
      mock: mockItemsCount
    };
  }
  
  // Sauvegarder les statistiques des catégories
  fs.writeFileSync(
    path.join(outputDir, 'logs', 'category-stats.json'),
    JSON.stringify(categoryStats, null, 2)
  );
  
  console.log('Génération des fichiers par catégorie terminée!');
  return categoryStats;
}

/**
 * Mélange un tableau de manière aléatoire (algorithme de Fisher-Yates)
 * @param {Array} array - Tableau à mélanger
 * @returns {Array} - Tableau mélangé
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

module.exports = { generateCategoryFiles };
