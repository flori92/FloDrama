/**
 * Script d'automatisation pour la mise à jour du mapping d'images FloDrama
 * Interroge l'API TMDB pour obtenir des URLs d'images fiables
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const TMDB_API_KEY = 'VOTRE_CLE_API_TMDB'; // À remplacer par votre clé API TMDB
const OUTPUT_FILE = path.join(__dirname, '../src/utils/posterMapping.js');
const CONTENT_IDS = [
  // Dramas
  { id: 'crash-landing-on-you', tmdbId: 93405, type: 'tv' },
  { id: 'goblin', tmdbId: 67915, type: 'tv' },
  { id: 'itaewon-class', tmdbId: 96162, type: 'tv' },
  { id: 'my-love-from-the-star', tmdbId: 61226, type: 'tv' },
  { id: 'vincenzo', tmdbId: 114860, type: 'tv' },
  
  // Films
  { id: 'parasite', tmdbId: 496243, type: 'movie' },
  { id: 'oldboy', tmdbId: 670, type: 'movie' },
  { id: 'train-to-busan', tmdbId: 396535, type: 'movie' },
  { id: 'the-handmaiden', tmdbId: 290098, type: 'movie' },
  { id: 'minari', tmdbId: 615643, type: 'movie' },
  { id: 'mother', tmdbId: 31261, type: 'movie' },
  { id: 'burning', tmdbId: 491584, type: 'movie' },
  
  // Animes
  { id: 'attack-on-titan', tmdbId: 1429, type: 'tv' },
  { id: 'demon-slayer', tmdbId: 85937, type: 'tv' },
  { id: 'jujutsu-kaisen', tmdbId: 94664, type: 'tv' },
  { id: 'your-name', tmdbId: 372058, type: 'movie' }
];

// Fonction pour récupérer les détails d'un contenu depuis TMDB
function fetchTMDBDetails(tmdbId, type) {
  return new Promise((resolve, reject) => {
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const details = JSON.parse(data);
          resolve(details);
        } catch (error) {
          reject(new Error(`Erreur de parsing : ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Erreur de requête TMDB : ${error.message}`));
    });
  });
}

// Fonction principale
async function updateImageMapping() {
  console.log('Démarrage de la mise à jour du mapping d'images...');
  
  const mapping = {};
  let successCount = 0;
  
  for (const item of CONTENT_IDS) {
    try {
      console.log(`Traitement de ${item.id}...`);
      const details = await fetchTMDBDetails(item.tmdbId, item.type);
      
      if (details.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
        mapping[item.id] = posterUrl;
        console.log(`✅ ${item.id}: ${posterUrl}`);
        successCount++;
      } else {
        console.warn(`⚠️ Pas d'image trouvée pour ${item.id}`);
      }
      
      // Pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Erreur pour ${item.id}: ${error.message}`);
    }
  }
  
  // Génération du fichier JavaScript
  const fileContent = `/**
 * Mapping des posters pour FloDrama
 * Généré automatiquement le ${new Date().toLocaleString('fr-FR')}
 */
export const POSTER_MAPPING = ${JSON.stringify(mapping, null, 2)};

export default POSTER_MAPPING;
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`\nMise à jour terminée: ${successCount}/${CONTENT_IDS.length} posters mis à jour.`);
  console.log(`Fichier généré: ${OUTPUT_FILE}`);
}

// Exécution
updateImageMapping().catch(error => {
  console.error(`\nErreur globale: ${error.message}`);
  process.exit(1);
});
