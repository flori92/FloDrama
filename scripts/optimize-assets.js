/**
 * Script d'optimisation des ressources statiques pour FloDrama
 * Ce script optimise les images et autres ressources pour améliorer les performances
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');
const glob = require('glob');

// Configuration
const ASSETS_DIR = path.resolve(__dirname, '../public/assets');
const DIST_DIR = path.resolve(__dirname, '../dist/assets');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const POSTER_MAX_WIDTH = 500;
const BACKDROP_MAX_WIDTH = 1280;
const THUMBNAIL_MAX_WIDTH = 320;
const QUALITY = 80;

// Création des répertoires nécessaires
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Répertoire créé: ${dir}`);
  }
}

// Optimisation d'une image
async function optimizeImage(inputPath, outputPath, maxWidth) {
  try {
    const ext = path.extname(outputPath).toLowerCase();
    let sharpInstance = sharp(inputPath).resize({ width: maxWidth, withoutEnlargement: true });
    
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharpInstance.jpeg({ quality: QUALITY }).toFile(outputPath);
    } else if (ext === '.png') {
      await sharpInstance.png({ quality: QUALITY }).toFile(outputPath);
    } else if (ext === '.webp') {
      await sharpInstance.webp({ quality: QUALITY }).toFile(outputPath);
    }
    
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);
    
    console.log(`Optimisé: ${path.basename(outputPath)} (${savings}% de réduction)`);
  } catch (error) {
    console.error(`Erreur lors de l'optimisation de ${inputPath}:`, error);
  }
}

// Optimisation des images dans un répertoire
async function optimizeImagesInDirectory(sourceDir, targetDir, maxWidth) {
  ensureDirectoryExists(targetDir);
  
  const files = glob.sync(`${sourceDir}/**/*.*`);
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const relativePath = path.relative(sourceDir, file);
      const outputPath = path.join(targetDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      ensureDirectoryExists(outputDir);
      await optimizeImage(file, outputPath, maxWidth);
    }
  }
}

// Optimisation des fichiers JSON
function optimizeJsonFiles(sourceDir, targetDir) {
  ensureDirectoryExists(targetDir);
  
  const files = glob.sync(`${sourceDir}/**/*.json`);
  
  for (const file of files) {
    try {
      const relativePath = path.relative(sourceDir, file);
      const outputPath = path.join(targetDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      ensureDirectoryExists(outputDir);
      
      const content = JSON.parse(fs.readFileSync(file, 'utf8'));
      fs.writeFileSync(outputPath, JSON.stringify(content), 'utf8');
      
      console.log(`JSON optimisé: ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`Erreur lors de l'optimisation de ${file}:`, error);
    }
  }
}

// Fonction principale
async function main() {
  try {
    console.log('Démarrage de l\'optimisation des ressources...');
    
    // Installation des dépendances si nécessaire
    if (!fs.existsSync(path.resolve(__dirname, '../node_modules/sharp'))) {
      console.log('Installation des dépendances...');
      execSync('npm install sharp glob --save-dev', { stdio: 'inherit' });
    }
    
    // Optimisation des posters
    const postersDir = path.join(ASSETS_DIR, 'posters');
    const optimizedPostersDir = path.join(DIST_DIR, 'posters');
    if (fs.existsSync(postersDir)) {
      console.log('Optimisation des posters...');
      await optimizeImagesInDirectory(postersDir, optimizedPostersDir, POSTER_MAX_WIDTH);
    }
    
    // Optimisation des backdrops
    const backdropsDir = path.join(ASSETS_DIR, 'backdrops');
    const optimizedBackdropsDir = path.join(DIST_DIR, 'backdrops');
    if (fs.existsSync(backdropsDir)) {
      console.log('Optimisation des backdrops...');
      await optimizeImagesInDirectory(backdropsDir, optimizedBackdropsDir, BACKDROP_MAX_WIDTH);
    }
    
    // Optimisation des thumbnails
    const thumbnailsDir = path.join(ASSETS_DIR, 'thumbnails');
    const optimizedThumbnailsDir = path.join(DIST_DIR, 'thumbnails');
    if (fs.existsSync(thumbnailsDir)) {
      console.log('Optimisation des thumbnails...');
      await optimizeImagesInDirectory(thumbnailsDir, optimizedThumbnailsDir, THUMBNAIL_MAX_WIDTH);
    }
    
    // Optimisation des fichiers JSON
    const dataDir = path.resolve(__dirname, '../public/data');
    const optimizedDataDir = path.resolve(__dirname, '../dist/data');
    if (fs.existsSync(dataDir)) {
      console.log('Optimisation des fichiers JSON...');
      optimizeJsonFiles(dataDir, optimizedDataDir);
    }
    
    console.log('Optimisation des ressources terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'optimisation des ressources:', error);
    process.exit(1);
  }
}

// Exécution du script
main();
