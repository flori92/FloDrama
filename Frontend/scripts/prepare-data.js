/**
 * Script de préparation des données pour le frontend FloDrama
 * Ce script est exécuté avant chaque build pour s'assurer que les données sont disponibles
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins des répertoires
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const SEARCH_DIR = path.join(PUBLIC_DIR, 'recherche');
const BACKEND_DIR = path.join(ROOT_DIR, '..', 'Backend');
const EXPORT_SCRIPT = path.join(ROOT_DIR, '..', 'scripts', 'export_content_for_frontend.py');

// Création des répertoires s'ils n'existent pas
console.log('🔍 Vérification des répertoires de données...');
if (!fs.existsSync(DATA_DIR)) {
  console.log(`📁 Création du répertoire ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SEARCH_DIR)) {
  console.log(`📁 Création du répertoire ${SEARCH_DIR}`);
  fs.mkdirSync(SEARCH_DIR, { recursive: true });
}

// Vérification si les données existent déjà
const contentFile = path.join(DATA_DIR, 'content.json');
const searchIndexFile = path.join(SEARCH_DIR, 'index.txt');

const needsDataGeneration = !fs.existsSync(contentFile) || !fs.existsSync(searchIndexFile);

if (needsDataGeneration) {
  console.log('⚠️ Données manquantes, génération en cours...');
  
  // Vérifier si le script d'exportation existe
  if (fs.existsSync(EXPORT_SCRIPT)) {
    try {
      console.log('🔄 Exécution du script d\'exportation...');
      execSync(`python3 "${EXPORT_SCRIPT}"`, { stdio: 'inherit' });
      console.log('✅ Données générées avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la génération des données:', error.message);
      
      // Création de fichiers de secours si la génération échoue
      createFallbackFiles();
    }
  } else {
    console.warn(`⚠️ Script d'exportation non trouvé: ${EXPORT_SCRIPT}`);
    console.log('🔄 Création de fichiers de données de secours...');
    
    // Création de fichiers de secours
    createFallbackFiles();
  }
} else {
  console.log('✅ Les données sont déjà disponibles.');
}

/**
 * Crée des fichiers de données de secours en cas d'échec de la génération
 */
function createFallbackFiles() {
  // Création d'un fichier content.json minimal
  const minimalContent = [
    {
      "id": "fallback-1",
      "title": "La Voie du Dragon",
      "type": "drama",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Un jeune artiste martial part à la recherche de son maître disparu.",
      "metadata": {
        "country": "Corée du Sud",
        "year": "2024",
        "genre": ["Action", "Aventure"]
      },
      "images": {
        "poster": "/images/fallback/poster1.jpg",
        "thumbnail": "/images/fallback/thumb1.jpg"
      },
      "ratings": {
        "average": 4.8,
        "count": 120
      }
    },
    {
      "id": "fallback-2",
      "title": "Cerisiers en Fleurs",
      "type": "drama",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Une histoire d'amour qui traverse les saisons dans un petit village japonais.",
      "metadata": {
        "country": "Japon",
        "year": "2023",
        "genre": ["Romance", "Drame"]
      },
      "images": {
        "poster": "/images/fallback/poster2.jpg",
        "thumbnail": "/images/fallback/thumb2.jpg"
      },
      "ratings": {
        "average": 4.5,
        "count": 85
      }
    },
    {
      "id": "fallback-3",
      "title": "Le Dernier Samouraï",
      "type": "drama",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Un guerrier solitaire défend son honneur dans un monde qui change.",
      "metadata": {
        "country": "Japon",
        "year": "2023",
        "genre": ["Action", "Historique"]
      },
      "images": {
        "poster": "/images/fallback/poster3.jpg",
        "thumbnail": "/images/fallback/thumb3.jpg"
      },
      "ratings": {
        "average": 4.9,
        "count": 150
      }
    }
  ];
  
  // Création d'un fichier categories.json minimal
  const minimalCategories = {
    "drama": ["fallback-1", "fallback-2", "fallback-3"],
    "anime": [],
    "bollywood": [],
    "trending": ["fallback-1", "fallback-3"],
    "latest": ["fallback-1", "fallback-2", "fallback-3"],
    "top_rated": ["fallback-3", "fallback-1", "fallback-2"],
    "drama_korean": ["fallback-1"],
    "drama_japanese": ["fallback-2", "fallback-3"],
    "drama_chinese": [],
    "drama_thai": []
  };
  
  // Création d'un fichier search_index.json minimal
  const minimalSearchIndex = [
    {
      "id": "fallback-1",
      "title": "La Voie du Dragon",
      "type": "drama",
      "source": "fallback",
      "synopsis": "Un jeune artiste martial part à la recherche de son maître disparu.",
      "metadata": {
        "country": "Corée du Sud",
        "year": "2024",
        "genre": ["Action", "Aventure"]
      }
    },
    {
      "id": "fallback-2",
      "title": "Cerisiers en Fleurs",
      "type": "drama",
      "source": "fallback",
      "synopsis": "Une histoire d'amour qui traverse les saisons dans un petit village japonais.",
      "metadata": {
        "country": "Japon",
        "year": "2023",
        "genre": ["Romance", "Drame"]
      }
    },
    {
      "id": "fallback-3",
      "title": "Le Dernier Samouraï",
      "type": "drama",
      "source": "fallback",
      "synopsis": "Un guerrier solitaire défend son honneur dans un monde qui change.",
      "metadata": {
        "country": "Japon",
        "year": "2023",
        "genre": ["Action", "Historique"]
      }
    }
  ];
  
  // Création des fichiers de secours
  fs.writeFileSync(contentFile, JSON.stringify(minimalContent, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(minimalCategories, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'search_index.json'), JSON.stringify(minimalSearchIndex, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'metadata.json'), JSON.stringify({
    "timestamp": new Date().toISOString(),
    "content_count": minimalContent.length,
    "categories_count": Object.keys(minimalCategories).length,
    "search_index_count": minimalSearchIndex.length,
    "fallback": true
  }, null, 2));
  
  // Création du fichier d'index de recherche
  fs.writeFileSync(searchIndexFile, `FloDrama Search Index - Fallback Generated on ${new Date().toISOString()}`);
  
  console.log('✅ Fichiers de secours créés avec succès !');
  
  // Création du répertoire d'images de secours
  const fallbackImagesDir = path.join(PUBLIC_DIR, 'images', 'fallback');
  if (!fs.existsSync(fallbackImagesDir)) {
    fs.mkdirSync(fallbackImagesDir, { recursive: true });
  }
}

console.log('🚀 Préparation des données terminée !');
