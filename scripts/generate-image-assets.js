// Script pour générer des assets visuels optimisés pour FloDrama
// Ce script crée des images placeholder pour les différentes sections de contenu

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

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

// Fonction pour télécharger une image depuis une URL
function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Image téléchargée avec succès: ${destination}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, (err) => {
        if (err) console.error(`Erreur lors de la suppression du fichier: ${err.message}`);
      }); // Supprimer le fichier en cas d'erreur
      console.error(`Erreur lors du téléchargement de l'image: ${err.message}`);
      reject(err);
    });
  });
}

// Fonction pour générer une URL d'image placeholder
function generatePlaceholderUrl(category, index, width, height) {
  // Utiliser des thèmes différents selon la catégorie
  let theme = 'movie';
  
  if (category.includes('anime')) {
    theme = 'anime';
  } else if (category.includes('korean')) {
    theme = 'drama';
  } else if (category.includes('bollywood')) {
    theme = 'bollywood';
  } else if (category.includes('hero')) {
    theme = 'entertainment';
  }
  
  // Utiliser un service de placeholder d'images
  return `https://via.placeholder.com/${width}x${height}.png?text=${theme}+${index}`;
}

// Fonction principale pour générer les assets
async function generateAssets() {
  console.log('Génération des assets visuels pour FloDrama...');
  
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
      const imagePath = path.join(categoryDir, `${i}.jpg`);
      
      // Vérifier si l'image existe déjà
      if (!fs.existsSync(imagePath)) {
        const imageUrl = generatePlaceholderUrl(category.name, i, category.width, category.height);
        
        try {
          await downloadImage(imageUrl, imagePath);
        } catch (error) {
          console.error(`Erreur lors de la génération de l'image ${imagePath}: ${error}`);
        }
      } else {
        console.log(`L'image existe déjà: ${imagePath}`);
      }
    }
  }
  
  console.log('Génération des assets terminée avec succès!');
}

// Exécuter la fonction principale
generateAssets().catch(error => {
  console.error('Erreur lors de la génération des assets:', error);
});
