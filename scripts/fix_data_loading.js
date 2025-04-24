/**
 * Script de diagnostic et correction des problèmes de chargement de données FloDrama
 * Ce script vérifie et corrige les problèmes de chargement des données dans l'application
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel en utilisant ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins importants
const FRONTEND_DIR = path.join(__dirname, '..', 'Frontend');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
const DATA_DIR = path.join(DIST_DIR, 'data');
const MOCK_DATA_DIR = path.join(FRONTEND_DIR, 'src', 'data');

// Fonction pour créer un répertoire s'il n'existe pas
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Création du répertoire ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

// Fonction pour générer des données de démonstration
function generateDemoContent(count = 20, category) {
  const content = [];
  const categories = ["drama", "anime", "film", "bollywood"];
  const countries = ["Korea", "Japan", "China", "Thailand", "India"];
  
  for (let i = 1; i <= count; i++) {
    const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const year = 2010 + Math.floor(Math.random() * 15);
    const rating = (3.5 + Math.random() * 6.3).toFixed(1);
    
    content.push({
      id: `demo-${selectedCategory}-${i}`,
      title: `${country} ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} ${i}`,
      original_title: `Original Title ${i}`,
      description: `This is a ${selectedCategory} from ${country} released in ${year}.`,
      poster: `https://via.placeholder.com/300x450?text=${encodeURIComponent(selectedCategory + ' ' + i)}`,
      year: year,
      rating: parseFloat(rating),
      language: selectedCategory === "bollywood" ? "hi" : selectedCategory === "anime" ? "ja" : "ko",
      type: selectedCategory,
      genres: ["Action", "Drama", "Romance"],
      source: "generated"
    });
  }
  
  return content;
}

// Fonction pour exporter les données en JSON
function exportToJson(filename, data) {
  const dir = path.dirname(filename);
  ensureDirectoryExists(dir);
  
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Fichier généré : ${filename}`);
}

// Fonction principale
async function main() {
  console.log("🔍 Diagnostic et correction des problèmes de chargement de données FloDrama");
  
  // 1. Vérifier si le build existe
  if (!fs.existsSync(DIST_DIR)) {
    console.log("❌ Le dossier dist n'existe pas. Exécution du build...");
    try {
      process.chdir(FRONTEND_DIR);
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error("❌ Échec du build:", error);
      return;
    }
  }
  
  // 2. Créer le dossier data dans dist s'il n'existe pas
  ensureDirectoryExists(DATA_DIR);
  
  // 3. Générer les données mockées
  console.log("📊 Génération des données de démonstration...");
  
  // Générer les contenus par catégorie
  const dramas = generateDemoContent(12, "drama");
  const animes = generateDemoContent(12, "anime");
  const films = generateDemoContent(12, "film");
  const bollywood = generateDemoContent(12, "bollywood");
  
  // Générer les carrousels
  const carousels = {
    featured: {
      title: "À la une",
      type: "featured",
      items: [...dramas.slice(0, 3), ...animes.slice(0, 3)]
    },
    trending: {
      title: "Tendances",
      type: "trending",
      items: [...films.slice(0, 6)]
    },
    new_releases: {
      title: "Nouveautés",
      type: "new_releases",
      items: [...animes.slice(3, 9)]
    },
    popular: {
      title: "Populaires",
      type: "popular",
      items: [...bollywood.slice(0, 6)]
    }
  };
  
  // Générer les bannières
  const heroBanners = {
    banners: [
      dramas[0],
      animes[0],
      films[0],
      bollywood[0]
    ]
  };
  
  // 4. Exporter les données
  console.log("💾 Exportation des données...");
  
  // Exporter les données par catégorie
  ensureDirectoryExists(path.join(DATA_DIR, 'content', 'drama'));
  ensureDirectoryExists(path.join(DATA_DIR, 'content', 'anime'));
  ensureDirectoryExists(path.join(DATA_DIR, 'content', 'film'));
  ensureDirectoryExists(path.join(DATA_DIR, 'content', 'bollywood'));
  
  exportToJson(path.join(DATA_DIR, 'content', 'drama', 'index.json'), { items: dramas });
  exportToJson(path.join(DATA_DIR, 'content', 'anime', 'index.json'), { items: animes });
  exportToJson(path.join(DATA_DIR, 'content', 'film', 'index.json'), { items: films });
  exportToJson(path.join(DATA_DIR, 'content', 'bollywood', 'index.json'), { items: bollywood });
  
  // Exporter les carrousels et bannières
  exportToJson(path.join(DATA_DIR, 'carousels.json'), carousels);
  exportToJson(path.join(DATA_DIR, 'hero_banners.json'), heroBanners);
  exportToJson(path.join(DATA_DIR, 'featured.json'), dramas.slice(0, 5));
  exportToJson(path.join(DATA_DIR, 'popular.json'), films.slice(0, 10));
  exportToJson(path.join(DATA_DIR, 'recently.json'), animes.slice(0, 8));
  exportToJson(path.join(DATA_DIR, 'topRated.json'), bollywood.slice(0, 8));
  
  // 5. Copier les données dans le dossier src/data pour les builds futurs
  console.log("📋 Copie des données pour les builds futurs...");
  ensureDirectoryExists(path.join(MOCK_DATA_DIR, 'content', 'drama'));
  ensureDirectoryExists(path.join(MOCK_DATA_DIR, 'content', 'anime'));
  ensureDirectoryExists(path.join(MOCK_DATA_DIR, 'content', 'film'));
  ensureDirectoryExists(path.join(MOCK_DATA_DIR, 'content', 'bollywood'));
  
  // Copier les mêmes fichiers dans le dossier src/data
  exportToJson(path.join(MOCK_DATA_DIR, 'content', 'drama', 'index.json'), { items: dramas });
  exportToJson(path.join(MOCK_DATA_DIR, 'content', 'anime', 'index.json'), { items: animes });
  exportToJson(path.join(MOCK_DATA_DIR, 'content', 'film', 'index.json'), { items: films });
  exportToJson(path.join(MOCK_DATA_DIR, 'content', 'bollywood', 'index.json'), { items: bollywood });
  exportToJson(path.join(MOCK_DATA_DIR, 'carousels.json'), carousels);
  exportToJson(path.join(MOCK_DATA_DIR, 'hero_banners.json'), heroBanners);
  
  console.log("✅ Correction des données terminée avec succès!");
  console.log("🚀 Redéployez l'application pour voir les changements.");
}

// Exécuter le script
main().catch(error => {
  console.error("❌ Erreur lors de l'exécution du script:", error);
});
