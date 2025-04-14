/**
 * Script de scraping général pour FloDrama PROD
 * 
 * Ce script lance un scraping complet des contenus populaires
 * et les indexe dans le service de recherche
 */

import dotenv from 'dotenv';
import smartScrapingService from '../services/SmartScrapingService.js';
import SearchIndexService from '../services/SearchIndexService.js';

// Charger les variables d'environnement
dotenv.config();

/**
 * Fonction principale qui lance le scraping général
 */
async function runFullIndexation() {
  console.log('🔍 Démarrage du scraping général pour FloDrama PROD...');
  console.log('⚙️ Configuration de l\'environnement...');

  // Afficher les informations de configuration
  console.log(`- AWS_REGION: ${process.env.AWS_REGION || 'Non défini'}`);
  console.log(`- AWS_OPENSEARCH_ENDPOINT: ${process.env.AWS_OPENSEARCH_ENDPOINT ? '✅ Défini' : '❌ Non défini'}`);
  console.log(`- ELASTICSEARCH_URL: ${process.env.ELASTICSEARCH_URL ? '✅ Défini' : '❌ Non défini'}`);
  console.log(`- REDIS_HOST: ${process.env.REDIS_HOST ? '✅ Défini' : '❌ Non défini'}`);

  try {
    // Lancer le scraping général
    console.log('🚀 Lancement du scraping général...');
    const result = await smartScrapingService.forceFullIndexation();

    // Afficher les résultats
    console.log('✅ Scraping général terminé avec succès !');
    console.log('📊 Résultats :');
    console.log(`- Total d'éléments indexés : ${result.itemCounts.total}`);
    console.log(`- Dramas populaires : ${result.itemCounts.popular}`);
    console.log(`- Films populaires : ${result.itemCounts.movies}`);
    console.log(`- K-shows populaires : ${result.itemCounts.kshows}`);
    console.log(`- Animes populaires : ${result.itemCounts.animes}`);
    console.log(`- Dramas : ${result.itemCounts.dramas}`);

    // Vérifier l'état de l'index
    console.log('🔍 Vérification de l\'état de l\'index...');
    const searchService = new SearchIndexService();
    const indexStats = await searchService.getIndexStats();
    console.log(`- Nombre total d'éléments dans l'index : ${indexStats.totalItems || 'Non disponible'}`);
    console.log(`- Type d'index utilisé : ${indexStats.indexType || 'Non disponible'}`);

    return result;
  } catch (error) {
    console.error('❌ Erreur lors du scraping général :', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (process.argv[1].includes('forceFullIndexation.js')) {
  runFullIndexation()
    .then(result => {
      console.log('✨ Script terminé avec succès !');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur lors de l\'exécution du script :', error);
      process.exit(1);
    });
}

export default runFullIndexation;
