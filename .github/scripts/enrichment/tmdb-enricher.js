/**
 * Script d'enrichissement des données via l'API TMDB
 * 
 * Ce script prend les données scrapées et les enrichit avec des informations
 * supplémentaires provenant de l'API TMDB (The Movie Database).
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

// Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const SCRAPING_OUTPUT_DIR = path.join(__dirname, '../../../cloudflare/scraping/output');
const ENRICHED_OUTPUT_DIR = path.join(__dirname, '../../../cloudflare/scraping/enriched');
const DELAY_BETWEEN_REQUESTS = 250; // ms entre chaque requête pour respecter les limites de l'API

// Vérification de la configuration
if (!TMDB_API_KEY) {
  console.error('❌ Erreur: La clé API TMDB est manquante. Définissez la variable d\'environnement TMDB_API_KEY.');
  process.exit(1);
}

// Création des dossiers de sortie s'ils n'existent pas
fs.ensureDirSync(ENRICHED_OUTPUT_DIR);

/**
 * Fonction principale d'enrichissement
 */
async function enrichData() {
  console.log('🔍 Démarrage de l\'enrichissement des données via TMDB...');
  
  try {
    // Récupération des fichiers de données scrapées
    const files = await fs.readdir(SCRAPING_OUTPUT_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📂 ${jsonFiles.length} fichiers trouvés pour l'enrichissement.`);
    
    // Statistiques d'enrichissement
    let stats = {
      total: 0,
      enriched: 0,
      failed: 0,
      skipped: 0
    };
    
    // Traitement de chaque fichier
    for (const file of jsonFiles) {
      console.log(`📄 Traitement du fichier: ${file}`);
      
      // Lecture du fichier
      const filePath = path.join(SCRAPING_OUTPUT_DIR, file);
      const data = await fs.readJson(filePath);
      
      // Vérification de la structure des données
      if (!Array.isArray(data.items)) {
        console.warn(`⚠️ Structure invalide dans ${file}, passage au fichier suivant.`);
        stats.skipped++;
        continue;
      }
      
      // Enrichissement de chaque élément
      const enrichedItems = [];
      for (const item of data.items) {
        stats.total++;
        
        try {
          // Pause pour respecter les limites de l'API
          await delay(DELAY_BETWEEN_REQUESTS);
          
          // Enrichissement de l'élément
          const enrichedItem = await enrichItem(item);
          enrichedItems.push(enrichedItem);
          stats.enriched++;
          
          // Affichage du progrès
          if (stats.total % 10 === 0) {
            console.log(`⏳ Progression: ${stats.enriched}/${stats.total} éléments enrichis`);
          }
        } catch (error) {
          console.error(`❌ Erreur lors de l'enrichissement de l'élément: ${item.title || 'Sans titre'}`, error.message);
          enrichedItems.push(item); // Conserver l'élément original en cas d'échec
          stats.failed++;
        }
      }
      
      // Mise à jour des données avec les éléments enrichis
      data.items = enrichedItems;
      data.enriched = true;
      data.enriched_at = new Date().toISOString();
      
      // Écriture du fichier enrichi
      const outputPath = path.join(ENRICHED_OUTPUT_DIR, file);
      await fs.writeJson(outputPath, data, { spaces: 2 });
      
      console.log(`✅ Fichier enrichi sauvegardé: ${outputPath}`);
    }
    
    // Rapport final
    console.log('\n📊 Rapport d\'enrichissement:');
    console.log(`- Total d'éléments traités: ${stats.total}`);
    console.log(`- Éléments enrichis avec succès: ${stats.enriched}`);
    console.log(`- Échecs d'enrichissement: ${stats.failed}`);
    console.log(`- Fichiers ignorés: ${stats.skipped}`);
    
    console.log('\n✅ Enrichissement terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement des données:', error);
    process.exit(1);
  }
}

/**
 * Enrichit un élément avec des données TMDB
 * @param {Object} item - L'élément à enrichir
 * @returns {Object} - L'élément enrichi
 */
async function enrichItem(item) {
  // Copie de l'élément pour éviter de modifier l'original
  const enrichedItem = { ...item };
  
  // Déterminer le type de recherche (film, série, anime)
  let searchType = 'multi';
  if (item.type === 'movie' || item.type === 'film') {
    searchType = 'movie';
  } else if (item.type === 'series' || item.type === 'drama' || item.type === 'show') {
    searchType = 'tv';
  }
  
  // Recherche dans TMDB
  const query = encodeURIComponent(item.title);
  const searchUrl = `${TMDB_API_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${query}&language=fr-FR`;
  
  const response = await axios.get(searchUrl);
  const results = response.data.results;
  
  // Si aucun résultat, retourner l'élément original
  if (!results || results.length === 0) {
    return enrichedItem;
  }
  
  // Utiliser le premier résultat (le plus pertinent)
  const tmdbItem = results[0];
  
  // Enrichir avec les données TMDB
  enrichedItem.tmdb_id = tmdbItem.id;
  enrichedItem.tmdb_type = tmdbItem.media_type || searchType;
  
  // Récupérer les détails complets
  const detailsUrl = `${TMDB_API_BASE_URL}/${enrichedItem.tmdb_type}/${tmdbItem.id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=credits,videos,images`;
  const detailsResponse = await axios.get(detailsUrl);
  const details = detailsResponse.data;
  
  // Enrichir avec les détails
  enrichedItem.overview = details.overview || item.description || '';
  enrichedItem.vote_average = details.vote_average || 0;
  enrichedItem.vote_count = details.vote_count || 0;
  enrichedItem.popularity = details.popularity || 0;
  
  // Images
  if (details.poster_path) {
    enrichedItem.poster_path = `${TMDB_IMAGE_BASE_URL}${details.poster_path}`;
  }
  if (details.backdrop_path) {
    enrichedItem.backdrop_path = `${TMDB_IMAGE_BASE_URL}${details.backdrop_path}`;
  }
  
  // Genres
  if (details.genres && Array.isArray(details.genres)) {
    enrichedItem.genres = details.genres.map(genre => genre.name);
  }
  
  // Casting
  if (details.credits && details.credits.cast) {
    enrichedItem.cast = details.credits.cast.slice(0, 5).map(person => ({
      name: person.name,
      character: person.character,
      profile_path: person.profile_path ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}` : null
    }));
  }
  
  // Vidéos (trailers)
  if (details.videos && details.videos.results) {
    const trailers = details.videos.results.filter(video => 
      video.type === 'Trailer' && (video.site === 'YouTube' || video.site === 'Vimeo')
    );
    
    if (trailers.length > 0) {
      enrichedItem.trailer = {
        key: trailers[0].key,
        site: trailers[0].site,
        name: trailers[0].name
      };
    }
  }
  
  // Marquer comme enrichi
  enrichedItem.is_enriched = true;
  
  return enrichedItem;
}

/**
 * Fonction utilitaire pour créer un délai
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise} - Promise résolue après le délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exécution du script
enrichData().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
