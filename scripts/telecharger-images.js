/**
 * Script pour télécharger des images pour les cartes de l'interface FloDrama
 * 
 * Ce script utilise l'API TMDB pour récupérer des images de haute qualité
 * et les enregistre dans le dossier public/assets/images/posters
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');

// Configuration
const TMDB_API_KEY = '3e17763f180e6a67e5c7a0aca97a9eb0'; // Clé API TMDB (à remplacer par votre propre clé)
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const OUTPUT_DIR = path.join(__dirname, '../public/assets/images/posters');
const METADATA_FILE = path.join(__dirname, '../public/assets/data/metadata.json');

// Liste des contenus populaires à récupérer
const POPULAR_CONTENT = [
  { title: 'Solo Leveling', type: 'anime', tmdb_id: 114410 },
  { title: 'Jujutsu Kaisen', type: 'anime', tmdb_id: 85937 },
  { title: 'Demon Slayer', type: 'anime', tmdb_id: 85937 },
  { title: 'My Hero Academia', type: 'anime', tmdb_id: 65930 },
  { title: 'Attack on Titan', type: 'anime', tmdb_id: 1429 },
  { title: 'Queen of Tears', type: 'drama', tmdb_id: 230108 },
  { title: 'Lovely Runner', type: 'drama', tmdb_id: 228413 },
  { title: 'Crash Landing on You', type: 'drama', tmdb_id: 94796 },
  { title: 'Goblin', type: 'drama', tmdb_id: 67915 },
  { title: 'Parasite', type: 'movie', tmdb_id: 496243 },
  { title: 'Your Name', type: 'movie', tmdb_id: 372058 },
  { title: 'The Glory', type: 'drama', tmdb_id: 136420 },
  { title: 'Moving', type: 'drama', tmdb_id: 209219 },
  { title: 'Hospital Playlist', type: 'drama', tmdb_id: 92071 },
  { title: 'Reply 1988', type: 'drama', tmdb_id: 63910 },
  { title: 'Vincenzo', type: 'drama', tmdb_id: 117376 },
  { title: 'Squid Game', type: 'drama', tmdb_id: 93405 },
  { title: 'Chainsaw Man', type: 'anime', tmdb_id: 114410 },
  { title: 'Frieren', type: 'anime', tmdb_id: 154494 },
  { title: 'Daily Dose of Sunshine', type: 'drama', tmdb_id: 209097 }
];

// Assurez-vous que le dossier de sortie existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Dossier créé: ${OUTPUT_DIR}`);
}

/**
 * Télécharge une image depuis une URL
 * @param {string} url - URL de l'image
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise} - Promesse résolue lorsque l'image est téléchargée
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Erreur lors du téléchargement de l'image: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Image téléchargée: ${outputPath}`);
        resolve(outputPath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Supprime le fichier en cas d'erreur
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Récupère les informations d'un film/série depuis TMDB
 * @param {number} id - ID TMDB
 * @param {string} type - Type de contenu (movie, tv)
 * @returns {Promise} - Promesse résolue avec les informations du contenu
 */
async function fetchTMDBInfo(id, type = 'tv') {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/${type}/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'fr-FR'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des informations TMDB pour ${id}:`, error.message);
    return null;
  }
}

/**
 * Génère un nom de fichier sécurisé à partir d'un titre
 * @param {string} title - Titre du contenu
 * @returns {string} - Nom de fichier sécurisé
 */
function getSafeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Fonction principale pour télécharger toutes les images
 */
async function downloadAllImages() {
  console.log('Début du téléchargement des images...');
  
  // Charger les métadonnées existantes si elles existent
  let metadata = {};
  if (fs.existsSync(METADATA_FILE)) {
    try {
      const metadataContent = fs.readFileSync(METADATA_FILE, 'utf8');
      metadata = JSON.parse(metadataContent);
      console.log('Métadonnées existantes chargées');
    } catch (error) {
      console.error('Erreur lors du chargement des métadonnées:', error);
    }
  }

  // Créer ou mettre à jour les métadonnées
  if (!metadata.content) {
    metadata.content = {};
  }

  // Télécharger les images pour chaque contenu
  for (const content of POPULAR_CONTENT) {
    try {
      const contentType = content.type === 'movie' ? 'movie' : 'tv';
      const info = await fetchTMDBInfo(content.tmdb_id, contentType);
      
      if (!info || !info.poster_path) {
        console.log(`Pas d'image disponible pour ${content.title}`);
        continue;
      }

      const imageUrl = `${IMAGE_BASE_URL}${info.poster_path}`;
      const safeFilename = getSafeFilename(content.title);
      const outputPath = path.join(OUTPUT_DIR, `${safeFilename}.jpg`);
      
      await downloadImage(imageUrl, outputPath);
      
      // Mettre à jour les métadonnées
      const contentId = `${content.type}-${safeFilename}`;
      metadata.content[contentId] = {
        id: contentId,
        title: content.title,
        original_title: info.original_name || info.original_title || content.title,
        type: content.type,
        poster_path: `/assets/images/posters/${safeFilename}.jpg`,
        backdrop_path: info.backdrop_path ? `/assets/images/backdrops/${safeFilename}-backdrop.jpg` : null,
        overview: info.overview || 'Pas de description disponible',
        vote_average: info.vote_average || 0,
        popularity: info.popularity || 0,
        release_date: info.first_air_date || info.release_date || '2023-01-01',
        genres: info.genres ? info.genres.map(g => g.name) : [],
        tmdb_id: content.tmdb_id
      };
      
      // Télécharger également l'image de fond si disponible
      if (info.backdrop_path) {
        const backdropUrl = `${IMAGE_BASE_URL}${info.backdrop_path}`;
        const backdropDir = path.join(__dirname, '../public/assets/images/backdrops');
        
        if (!fs.existsSync(backdropDir)) {
          fs.mkdirSync(backdropDir, { recursive: true });
        }
        
        const backdropPath = path.join(backdropDir, `${safeFilename}-backdrop.jpg`);
        await downloadImage(backdropUrl, backdropPath);
      }
    } catch (error) {
      console.error(`Erreur lors du traitement de ${content.title}:`, error);
    }
  }

  // Enregistrer les métadonnées mises à jour
  try {
    // Créer le répertoire des données s'il n'existe pas
    const dataDir = path.dirname(METADATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
    console.log('Métadonnées mises à jour avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des métadonnées:', error);
  }

  console.log('Téléchargement des images terminé');
}

// Exécuter la fonction principale
downloadAllImages().catch(console.error);
