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
const STATIC_DIR = path.join(PUBLIC_DIR, 'static');
const PLACEHOLDERS_DIR = path.join(STATIC_DIR, 'placeholders');
const HERO_DIR = path.join(STATIC_DIR, 'hero');
const BACKEND_DIR = path.join(ROOT_DIR, '..', 'Backend');
const EXPORT_SCRIPT = path.join(ROOT_DIR, '..', 'scripts', 'export_content_for_frontend.py');

// Création des répertoires s'ils n'existent pas
console.log('🔍 Vérification des répertoires de données...');
if (!fs.existsSync(PUBLIC_DIR)) {
  console.log(`📁 Création du répertoire ${PUBLIC_DIR}`);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
  console.log(`📁 Création du répertoire ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SEARCH_DIR)) {
  console.log(`📁 Création du répertoire ${SEARCH_DIR}`);
  fs.mkdirSync(SEARCH_DIR, { recursive: true });
}

if (!fs.existsSync(STATIC_DIR)) {
  console.log(`📁 Création du répertoire ${STATIC_DIR}`);
  fs.mkdirSync(STATIC_DIR, { recursive: true });
}

if (!fs.existsSync(PLACEHOLDERS_DIR)) {
  console.log(`📁 Création du répertoire ${PLACEHOLDERS_DIR}`);
  fs.mkdirSync(PLACEHOLDERS_DIR, { recursive: true });
}

if (!fs.existsSync(HERO_DIR)) {
  console.log(`📁 Création du répertoire ${HERO_DIR}`);
  fs.mkdirSync(HERO_DIR, { recursive: true });
}

// Vérification si les données existent déjà
const contentFile = path.join(DATA_DIR, 'content.json');
const categoriesFile = path.join(DATA_DIR, 'categories.json');
const searchIndexFile = path.join(SEARCH_DIR, 'index.txt');

// Force la génération des données si l'un des fichiers est manquant
const needsDataGeneration = !fs.existsSync(contentFile) || 
                           !fs.existsSync(categoriesFile) || 
                           !fs.existsSync(searchIndexFile);

// Création des fichiers de données
console.log('⚠️ Vérification des données...');
createFallbackFiles();

// Création des images de secours
createFallbackImages();

console.log('✅ Données générées avec succès !');

/**
 * Crée des fichiers de données de secours en cas d'échec de la génération
 */
function createFallbackFiles() {
  // Création d'un fichier content.json minimal
  const minimalContent = [
    {
      "id": "drama-1",
      "title": "La Voie du Dragon",
      "type": "drama",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Un jeune artiste martial part à la recherche de son maître disparu dans les montagnes de Corée.",
      "metadata": {
        "country": "Corée du Sud",
        "year": "2024",
        "genre": ["Action", "Aventure", "Arts Martiaux"]
      },
      "images": {
        "poster": "/static/placeholders/drama1.svg",
        "backdrop": "/static/placeholders/drama1-backdrop.svg",
        "thumbnail": "/static/placeholders/drama1-thumb.svg"
      },
      "ratings": {
        "average": 4.8,
        "count": 120
      }
    },
    {
      "id": "drama-2",
      "title": "Cerisiers en Fleurs",
      "type": "drama",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Une histoire d'amour qui traverse les saisons dans un petit village japonais, entre tradition et modernité.",
      "metadata": {
        "country": "Japon",
        "year": "2023",
        "genre": ["Romance", "Drame", "Slice of Life"]
      },
      "images": {
        "poster": "/static/placeholders/drama2.svg",
        "backdrop": "/static/placeholders/drama2-backdrop.svg",
        "thumbnail": "/static/placeholders/drama2-thumb.svg"
      },
      "ratings": {
        "average": 4.6,
        "count": 95
      }
    },
    {
      "id": "drama-3",
      "title": "Le Dernier Samouraï",
      "type": "drama",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Dans le Japon du 19ème siècle, un guerrier samouraï lutte pour préserver les traditions face à la modernisation du pays.",
      "metadata": {
        "country": "Japon",
        "year": "2023",
        "genre": ["Historique", "Action", "Drame"]
      },
      "images": {
        "poster": "/static/placeholders/drama3.svg",
        "backdrop": "/static/placeholders/drama3-backdrop.svg",
        "thumbnail": "/static/placeholders/drama3-thumb.svg"
      },
      "ratings": {
        "average": 4.9,
        "count": 210
      }
    },
    {
      "id": "anime-1",
      "title": "Esprit Sauvage",
      "type": "anime",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Un jeune garçon découvre qu'il peut communiquer avec les esprits de la forêt et doit protéger la nature contre des forces maléfiques.",
      "metadata": {
        "country": "Japon",
        "year": "2023",
        "genre": ["Fantastique", "Aventure", "Surnaturel"]
      },
      "images": {
        "poster": "/static/placeholders/anime1.svg",
        "backdrop": "/static/placeholders/anime1-backdrop.svg",
        "thumbnail": "/static/placeholders/anime1-thumb.svg"
      },
      "ratings": {
        "average": 4.7,
        "count": 180
      }
    },
    {
      "id": "anime-2",
      "title": "Cyber Samurai",
      "type": "anime",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Dans un futur cyberpunk, un samouraï augmenté technologiquement combat la corruption dans une mégalopole japonaise.",
      "metadata": {
        "country": "Japon",
        "year": "2024",
        "genre": ["Science-Fiction", "Action", "Cyberpunk"]
      },
      "images": {
        "poster": "/static/placeholders/anime2.svg",
        "backdrop": "/static/placeholders/anime2-backdrop.svg",
        "thumbnail": "/static/placeholders/anime2-thumb.svg"
      },
      "ratings": {
        "average": 4.5,
        "count": 150
      }
    },
    {
      "id": "bollywood-1",
      "title": "Amour Éternel",
      "type": "bollywood",
      "source": "fallback",
      "url": "#",
      "timestamp": new Date().toISOString(),
      "synopsis": "Une histoire d'amour épique qui traverse les générations, entre deux familles rivales dans l'Inde moderne.",
      "metadata": {
        "country": "Inde",
        "year": "2023",
        "genre": ["Romance", "Drame", "Musical"]
      },
      "images": {
        "poster": "/static/placeholders/bollywood1.svg",
        "backdrop": "/static/placeholders/bollywood1-backdrop.svg",
        "thumbnail": "/static/placeholders/bollywood1-thumb.svg"
      },
      "ratings": {
        "average": 4.4,
        "count": 130
      }
    }
  ];
  
  // Création des catégories
  const minimalCategories = {
    "trending": ["drama-1", "anime-1", "bollywood-1", "drama-3", "anime-2"],
    "latest": ["drama-3", "anime-2", "bollywood-1", "drama-2", "anime-1"],
    "drama_korean": ["drama-1"],
    "drama_japanese": ["drama-2", "drama-3"],
    "anime": ["anime-1", "anime-2"],
    "bollywood": ["bollywood-1"]
  };
  
  // Création de l'index de recherche
  const minimalSearchIndex = minimalContent.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    metadata: item.metadata,
    synopsis: item.synopsis
  }));
  
  // Écriture des fichiers
  console.log(`📝 Écriture du fichier ${contentFile}`);
  fs.writeFileSync(contentFile, JSON.stringify(minimalContent, null, 2));
  
  console.log(`📝 Écriture du fichier ${path.join(DATA_DIR, 'categories.json')}`);
  fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(minimalCategories, null, 2));
  
  console.log(`📝 Écriture du fichier ${path.join(DATA_DIR, 'metadata.json')}`);
  fs.writeFileSync(path.join(DATA_DIR, 'metadata.json'), JSON.stringify({
    "timestamp": new Date().toISOString(),
    "content_count": minimalContent.length,
    "categories_count": Object.keys(minimalCategories).length,
    "search_index_count": minimalSearchIndex.length,
    "fallback": true
  }, null, 2));
  
  // Création du fichier d'index de recherche
  console.log(`📝 Écriture du fichier ${searchIndexFile}`);
  fs.writeFileSync(searchIndexFile, `FloDrama Search Index - Fallback Generated on ${new Date().toISOString()}\n\n${
    minimalSearchIndex.map(item => `${item.id}|${item.title}|${item.type}|${item.metadata.country}|${item.metadata.year}|${item.metadata.genre.join(',')}|${item.synopsis}`).join('\n')
  }`);
  
  console.log('✅ Fichiers de données créés avec succès !');
}

/**
 * Crée des images de secours pour les placeholders
 */
function createFallbackImages() {
  // Liste des images à créer
  const placeholderImages = [
    'drama1.svg', 'drama1-backdrop.svg', 'drama1-thumb.svg',
    'drama2.svg', 'drama2-backdrop.svg', 'drama2-thumb.svg',
    'drama3.svg', 'drama3-backdrop.svg', 'drama3-thumb.svg',
    'movie1.svg', 'movie1-backdrop.svg', 'movie1-thumb.svg',
    'anime1.svg', 'anime1-backdrop.svg', 'anime1-thumb.svg',
    'anime2.svg', 'anime2-backdrop.svg', 'anime2-thumb.svg',
    'bollywood1.svg', 'bollywood1-backdrop.svg', 'bollywood1-thumb.svg'
  ];
  
  // Création d'une image SVG de base pour chaque placeholder
  placeholderImages.forEach(imageName => {
    const type = imageName.split('-')[0].replace(/[0-9]/g, '');
    const isBackdrop = imageName.includes('backdrop');
    const isThumb = imageName.includes('thumb');
    
    let color = '#9D4EDD'; // Couleur par défaut (violet)
    
    // Couleur selon le type de contenu
    if (type === 'drama') color = '#9D4EDD'; // Violet
    if (type === 'movie') color = '#5F5FFF'; // Bleu
    if (type === 'anime') color = '#4361EE'; // Bleu anime
    if (type === 'bollywood') color = '#FB5607'; // Orange
    
    // Dimensions selon le type d'image
    const width = isBackdrop ? 1280 : 500;
    const height = isBackdrop ? 720 : (isThumb ? 281 : 750);
    
    // Création du SVG
    const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <rect width="100%" height="100%" fill="url(#gradient)" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#181824" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#F72585" stop-opacity="0.1" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" font-family="Arial" font-size="${isThumb ? 24 : 36}" 
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${imageName.replace('.svg', '')}
      </text>
    </svg>`;
    
    // Écriture du fichier SVG
    const svgPath = path.join(PLACEHOLDERS_DIR, imageName);
    console.log(`📝 Création de l'image ${svgPath}`);
    fs.writeFileSync(svgPath, svgContent);
  });
  
  // Création d'une image pour la bannière héro
  const heroBannerSvg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#181824" />
    <rect width="100%" height="100%" fill="url(#gradient)" />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#9D4EDD" stop-opacity="0.5" />
        <stop offset="50%" stop-color="#F72585" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#5F5FFF" stop-opacity="0.5" />
      </linearGradient>
    </defs>
    <text x="50%" y="50%" font-family="Arial" font-size="72" 
          font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
      FloDrama - Bannière Héro
    </text>
  </svg>`;
  
  console.log(`📝 Création de l'image ${path.join(HERO_DIR, 'hero-banner.svg')}`);
  fs.writeFileSync(path.join(HERO_DIR, 'hero-banner.svg'), heroBannerSvg);
  
  console.log('✅ Images de secours créées avec succès !');
}

console.log('🚀 Préparation des données terminée !');
