/**
 * Script temporaire pour récupérer des données réelles
 * et mettre à jour le fichier sample_dramas.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import SmartScrapingService from '../services/SmartScrapingService.js';

// Charger les variables d'environnement
dotenv.config();

// Forcer l'utilisation du proxy local
process.env.USE_LOCAL_PROXY = 'true';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Données d'exemple de fallback
const FALLBACK_DATA = [
  {
    id: "drama-1",
    title: "My Love From The Star",
    alternativeTitles: ["별에서 온 그대", "You Who Came From the Stars", "Man From the Stars"],
    link: "https://voirdrama.org/drama/my-love-from-the-star/",
    image: "https://voirdrama.org/assets/images/dramas/my-love-from-the-star.jpg",
    source: "VoirDrama",
    type: "drama",
    year: 2013,
    country: "Corée du Sud"
  },
  {
    id: "drama-2",
    title: "Crash Landing on You",
    alternativeTitles: ["사랑의 불시착", "Love's Emergency Landing", "Emergency Love Landing"],
    link: "https://voirdrama.org/drama/crash-landing-on-you/",
    image: "https://voirdrama.org/assets/images/dramas/crash-landing-on-you.jpg",
    source: "VoirDrama",
    type: "drama",
    year: 2019,
    country: "Corée du Sud"
  },
  {
    id: "drama-3",
    title: "Goblin",
    alternativeTitles: ["도깨비", "Guardian: The Lonely and Great God", "The Lonely and Great God"],
    link: "https://voirdrama.org/drama/goblin/",
    image: "https://voirdrama.org/assets/images/dramas/goblin.jpg",
    source: "VoirDrama",
    type: "drama",
    year: 2016,
    country: "Corée du Sud"
  }
];

/**
 * Fonction pour récupérer des données avec gestion des erreurs
 * @param {Function} fetchFunction - Fonction de récupération à exécuter
 * @param {String} type - Type de contenu (pour les logs)
 * @returns {Promise<Array>} Données récupérées ou tableau vide en cas d'erreur
 */
async function fetchWithErrorHandling(fetchFunction, type) {
  try {
    const data = await fetchFunction();
    console.log(`✅ ${data.length} ${type} récupérés`);
    return data;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des ${type}:`, error.message);
    console.log(`⚠️ Utilisation des données de fallback pour les ${type}`);
    return [];
  }
}

/**
 * Fonction principale pour récupérer les données et mettre à jour le fichier
 */
async function fetchRealData() {
  console.log('🔍 Récupération des données réelles pour FloDrama PROD...');
  
  try {
    // Récupérer les données populaires avec gestion des erreurs
    console.log('📊 Récupération des dramas populaires...');
    const popularDramas = await fetchWithErrorHandling(
      () => SmartScrapingService.getPopular(),
      'dramas populaires'
    );
    
    console.log('🎬 Récupération des films populaires...');
    const popularMovies = await fetchWithErrorHandling(
      () => SmartScrapingService.getPopularMovies(),
      'films populaires'
    );
    
    console.log('📺 Récupération des K-shows populaires...');
    const popularKshows = await fetchWithErrorHandling(
      () => SmartScrapingService.getPopularKshows(),
      'K-shows populaires'
    );
    
    // Combiner les données
    let allData = [
      ...popularDramas,
      ...popularMovies,
      ...popularKshows
    ];
    
    // Si aucune donnée n'a été récupérée, utiliser les données de fallback
    if (allData.length === 0) {
      console.warn('⚠️ Aucune donnée réelle récupérée, utilisation des données de fallback');
      allData = FALLBACK_DATA;
    }
    
    // Limiter à 50 éléments maximum pour éviter un fichier trop volumineux
    const limitedData = allData.slice(0, 50);
    
    // Chemin du fichier sample_dramas.json
    const sampleDataPath = path.resolve(__dirname, '../data/sample_dramas.json');
    
    // Sauvegarder les données dans le fichier
    await fs.writeFile(sampleDataPath, JSON.stringify(limitedData, null, 2), 'utf8');
    
    console.log(`✅ Fichier sample_dramas.json mis à jour avec ${limitedData.length} éléments${allData === FALLBACK_DATA ? ' (données de fallback)' : ' réels'}`);
    console.log(`📁 Chemin du fichier: ${sampleDataPath}`);
    
    return limitedData;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error);
    
    // En cas d'erreur critique, utiliser quand même les données de fallback
    try {
      const sampleDataPath = path.resolve(__dirname, '../data/sample_dramas.json');
      await fs.writeFile(sampleDataPath, JSON.stringify(FALLBACK_DATA, null, 2), 'utf8');
      console.log(`⚠️ Fichier sample_dramas.json mis à jour avec des données de fallback`);
      return FALLBACK_DATA;
    } catch (fallbackError) {
      console.error('❌ Erreur critique lors de la sauvegarde des données de fallback:', fallbackError);
      throw error;
    }
  }
}

// Exécuter le script si appelé directement
if (process.argv[1].includes('fetchRealData.js')) {
  fetchRealData()
    .then(data => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur lors de l\'exécution du script:', error);
      process.exit(1);
    });
}

export default fetchRealData;
