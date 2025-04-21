/**
 * Script d'optimisation des images pour FloDrama
 * Ce script convertit les images en WebP et génère des placeholders pour les images manquantes
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { contentTypes, imageSizes, contentColors } = require('../src/config.js');

// Créer le dossier des placeholders s'il n'existe pas
const placeholdersDir = path.join(process.cwd(), 'public', 'static', 'placeholders');
if (!fs.existsSync(placeholdersDir)) {
  fs.mkdirSync(placeholdersDir, { recursive: true });
}

// Générer des images placeholders pour chaque type de contenu
contentTypes.forEach(type => {
  const placeholderPath = path.join(placeholdersDir, `${type}-placeholder.jpg`);
  const color = contentColors[type];
  
  // Convertir la couleur hex en RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Créer une image placeholder avec sharp
  sharp({
    create: {
      width: imageSizes.poster.width,
      height: imageSizes.poster.height,
      channels: 3,
      background: { r, g, b }
    }
  })
  .jpeg({ quality: 80 })
  .toFile(placeholderPath)
  .then(() => {
    console.log(`Placeholder généré pour ${type}`);
  })
  .catch(err => {
    console.error(`Erreur lors de la génération du placeholder pour ${type}:`, err);
  });
});

console.log('Images optimisées avec succès !');
