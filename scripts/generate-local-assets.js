// Script pour générer des assets visuels locaux pour FloDrama
// Ce script crée des images SVG colorées pour les différentes sections de contenu

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const baseDir = path.join(__dirname, '../public/assets/images');
const categories = [
  { name: 'hero', count: 3, width: 1920, height: 1080 },
  { name: 'content/trending', count: 8, width: 400, height: 600 },
  { name: 'content/recommended', count: 8, width: 400, height: 600 },
  { name: 'content/korean', count: 8, width: 400, height: 600 },
  { name: 'content/movies', count: 8, width: 400, height: 600 },
  { name: 'content/anime', count: 8, width: 400, height: 600 },
  { name: 'content/bollywood', count: 8, width: 400, height: 600 },
  { name: 'content/continue', count: 4, width: 400, height: 600 },
  { name: 'content/mylist', count: 4, width: 400, height: 600 }
];

// Fonction pour générer une couleur aléatoire au format hex
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Fonction pour générer une image SVG
function generateSvgImage(category, index, width, height) {
  const bgColor = getRandomColor();
  let textColor = '#FFFFFF';
  
  // Déterminer le texte à afficher selon la catégorie
  let text = '';
  if (category.includes('hero')) {
    text = `Hero ${index}`;
  } else if (category.includes('trending')) {
    text = `Trending ${index}`;
  } else if (category.includes('recommended')) {
    text = `Recommended ${index}`;
  } else if (category.includes('korean')) {
    text = `K-Drama ${index}`;
  } else if (category.includes('movies')) {
    text = `Movie ${index}`;
  } else if (category.includes('anime')) {
    text = `Anime ${index}`;
  } else if (category.includes('bollywood')) {
    text = `Bollywood ${index}`;
  } else if (category.includes('continue')) {
    text = `Continue ${index}`;
  } else if (category.includes('mylist')) {
    text = `My List ${index}`;
  }
  
  // Générer le SVG
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}" />
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
    <rect x="0" y="${height - 150}" width="100%" height="150" fill="rgba(0,0,0,0.7)" />
    <text x="50%" y="50%" font-family="Arial" font-size="${width > 1000 ? 60 : 30}" 
      fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
    <text x="50%" y="${height - 75}" font-family="Arial" font-size="${width > 1000 ? 40 : 20}" 
      fill="url(#grad)" text-anchor="middle" dominant-baseline="middle">FloDrama</text>
  </svg>`;
}

// Fonction principale pour générer les assets
function generateAssets() {
  console.log('Génération des assets visuels locaux pour FloDrama...');
  
  // Parcourir chaque catégorie
  for (const category of categories) {
    const categoryDir = path.join(baseDir, category.name);
    
    // S'assurer que le répertoire existe
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`Répertoire créé: ${categoryDir}`);
    }
    
    // Générer les images pour cette catégorie
    for (let i = 1; i <= category.count; i++) {
      const imagePath = path.join(categoryDir, `${i}.svg`);
      
      // Générer l'image SVG
      const svgContent = generateSvgImage(category.name, i, category.width, category.height);
      
      // Écrire le fichier SVG
      fs.writeFileSync(imagePath, svgContent);
      console.log(`Image générée: ${imagePath}`);
    }
  }
  
  console.log('Génération des assets terminée avec succès!');
}

// Exécuter la fonction principale
generateAssets();
