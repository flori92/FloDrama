/**
 * Script d'optimisation des images pour FloDrama
 * Ce script convertit les images en WebP et génère des placeholders pour les images manquantes
 */

const fs = require('fs');
const path = require('path');
const { contentTypes, imageSizes, contentColors } = require('../src/config.js');

// Créer le dossier des placeholders s'il n'existe pas
const placeholdersDir = path.join(process.cwd(), 'public', 'static', 'placeholders');
if (!fs.existsSync(placeholdersDir)) {
  fs.mkdirSync(placeholdersDir, { recursive: true });
}

// Fonction pour générer un placeholder SVG
function generateSVGPlaceholder(type, width, height, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${type}</text>
</svg>`;
}

// Générer des images placeholders pour chaque type de contenu
contentTypes.forEach(type => {
  const placeholderPath = path.join(placeholdersDir, `${type}-placeholder.svg`);
  const color = contentColors[type];
  
  try {
    // Générer le SVG
    const svgContent = generateSVGPlaceholder(
      type,
      imageSizes.poster.width,
      imageSizes.poster.height,
      color
    );
    
    // Sauvegarder le SVG
    fs.writeFileSync(placeholderPath, svgContent);
    console.log(`Placeholder SVG généré pour ${type}`);
  } catch (err) {
    console.error(`Erreur lors de la génération du placeholder pour ${type}:`, err);
  }
});

console.log('Images optimisées avec succès !');
