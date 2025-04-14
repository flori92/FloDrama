/**
 * Script d'initialisation et de test du système d'indexation
 * 
 * Ce script permet de :
 * 1. Vérifier la connexion à Elasticsearch/OpenSearch et Redis
 * 2. Créer les index nécessaires s'ils n'existent pas
 * 3. Indexer un ensemble initial de données
 * 4. Tester les performances de recherche
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import SearchIndexService from '../services/SearchIndexService.js';

// Obtenir le chemin du répertoire actuel (équivalent à __dirname en CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

/**
 * Fonction principale d'initialisation
 */
async function initialize() {
  console.log('🔍 Initialisation du système d\'indexation...');
  
  try {
    // Afficher les informations de configuration
    console.log('\n=== Configuration ===');
    console.log('AWS_REGION:', process.env.AWS_REGION || 'Non défini');
    console.log('AWS_OPENSEARCH_ENDPOINT:', process.env.AWS_OPENSEARCH_ENDPOINT ? 'Configuré' : 'Non configuré');
    console.log('ELASTICSEARCH_URL:', process.env.ELASTICSEARCH_URL || 'Non défini');
    console.log('REDIS_HOST:', process.env.REDIS_HOST || 'Non défini');
    console.log('Mode dégradé activé si aucun service n\'est disponible');
    
    // Créer une instance du service
    const searchService = new SearchIndexService();
    
    // Vérifier l'état du service
    console.log('\n=== Vérification de l\'état du service ===');
    const status = await searchService.healthCheck();
    
    console.log('État d\'Elasticsearch:', status.elasticsearch ? 'Disponible' : 'Non disponible');
    console.log('État de Redis:', status.redis ? 'Disponible' : 'Non disponible');
    console.log('Taille de l\'index:', status.indexSize, 'documents');
    console.log('Dernière mise à jour:', status.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : 'Jamais');
    
    if (!status.elasticsearch) {
      console.log('\n⚠️ Elasticsearch n\'est pas disponible, utilisation du mode dégradé');
    }
    
    // Charger les données de test si l'index est vide
    if (status.indexSize === 0) {
      console.log('\n=== Chargement des données de test ===');
      
      // Charger les données de test depuis un fichier JSON
      const testDataPath = path.resolve(__dirname, '../data/sample_dramas.json');
      
      if (fs.existsSync(testDataPath)) {
        const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
        console.log(`Chargement de ${testData.length} éléments depuis ${testDataPath}`);
        
        // Indexer les données
        const result = await searchService.indexItems(testData);
        console.log(`Indexation terminée: ${result.successful} éléments indexés, ${result.failed} échecs`);
      } else {
        console.error(`Fichier de données de test non trouvé: ${testDataPath}`);
      }
    }
    
    // Effectuer une recherche de test
    console.log('\n=== Test de recherche ===');
    const testQuery = 'love';
    console.log(`Recherche de "${testQuery}"...`);
    
    const searchResults = await searchService.search(testQuery);
    console.log(`${searchResults.length} résultats trouvés`);
    
    if (searchResults.length > 0) {
      console.log('Premier résultat:', {
        title: searchResults[0].title,
        type: searchResults[0].type,
        source: searchResults[0].source
      });
    }
    
    // Test des suggestions
    console.log('\n=== Test des suggestions ===');
    const testPrefix = 'lo';
    console.log(`Suggestions pour "${testPrefix}"...`);
    
    const suggestions = await searchService.getSuggestions(testPrefix);
    console.log(`${suggestions.length} suggestions trouvées:`, suggestions.slice(0, 5));
    
    console.log('\n=== Initialisation terminée ===');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter la fonction d'initialisation
initialize().catch(console.error);
