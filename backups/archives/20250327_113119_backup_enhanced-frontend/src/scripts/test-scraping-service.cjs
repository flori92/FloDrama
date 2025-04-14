/**
 * Script de test pour le ScrapingService
 * 
 * Ce script permet de tester les fonctionnalités du ScrapingService
 * et d'identifier les problèmes potentiels.
 */

// Import du service à tester
const ScrapingService = require('../services/ScrapingService.cjs');

// Création d'une instance du service si nécessaire
const scrapingService = typeof ScrapingService === 'function' ? new ScrapingService() : ScrapingService;

// Fonction pour tester les méthodes du service
async function testScrapingService() {
  console.log('🔍 Démarrage des tests du ScrapingService...');
  
  try {
    // Test 1: Vérification de l'existence des méthodes
    console.log('\n📋 Test 1: Vérification des méthodes');
    const methods = [
      'getPopular',
      'getPopularMovies',
      'getPopularKshows',
      'getPopularDramas',
      'getPopularAnimes',
      'searchDramas',
      'searchAnime',
      'searchAll'
    ];
    
    methods.forEach(method => {
      const exists = typeof scrapingService[method] === 'function';
      console.log(`  - Méthode ${method}: ${exists ? '✅ Existe' : '❌ N\'existe pas'}`);
    });
    
    // Test 2: Test de la méthode getPopular
    console.log('\n📋 Test 2: Test de getPopular()');
    try {
      const popular = await scrapingService.getPopular();
      console.log(`  - Résultat: ${popular && popular.length > 0 ? '✅ OK' : '❌ Aucun résultat'}`);
      console.log(`  - Nombre d'éléments: ${popular ? popular.length : 0}`);
      if (popular && popular.length > 0) {
        console.log(`  - Premier élément: ${JSON.stringify(popular[0], null, 2)}`);
      }
    } catch (error) {
      console.error(`  - ❌ Erreur: ${error.message}`);
      console.error(error.stack);
    }
    
    // Test 3: Test de la méthode getPopularMovies
    console.log('\n📋 Test 3: Test de getPopularMovies()');
    try {
      const movies = await scrapingService.getPopularMovies();
      console.log(`  - Résultat: ${movies && movies.length > 0 ? '✅ OK' : '❌ Aucun résultat'}`);
      console.log(`  - Nombre d'éléments: ${movies ? movies.length : 0}`);
      if (movies && movies.length > 0) {
        console.log(`  - Premier élément: ${JSON.stringify(movies[0], null, 2)}`);
      }
    } catch (error) {
      console.error(`  - ❌ Erreur: ${error.message}`);
      console.error(error.stack);
    }
    
    // Test 4: Test de la méthode getPopularKshows
    console.log('\n📋 Test 4: Test de getPopularKshows()');
    try {
      const kshows = await scrapingService.getPopularKshows();
      console.log(`  - Résultat: ${kshows && kshows.length > 0 ? '✅ OK' : '❌ Aucun résultat'}`);
      console.log(`  - Nombre d'éléments: ${kshows ? kshows.length : 0}`);
      if (kshows && kshows.length > 0) {
        console.log(`  - Premier élément: ${JSON.stringify(kshows[0], null, 2)}`);
      }
    } catch (error) {
      console.error(`  - ❌ Erreur: ${error.message}`);
      console.error(error.stack);
    }
    
    // Test 5: Vérification de l'exportation du service
    console.log('\n📋 Test 5: Vérification de l\'exportation du service');
    const ScrapingServiceModule = require('../services/ScrapingService.cjs');
    console.log(`  - Module exporté: ${ScrapingServiceModule ? '✅ OK' : '❌ Non exporté'}`);
    console.log(`  - Type d'exportation: ${typeof ScrapingServiceModule}`);
    
  } catch (error) {
    console.error('❌ Erreur globale lors des tests:', error);
  }
  
  console.log('\n🏁 Fin des tests du ScrapingService');
}

// Exécution des tests
testScrapingService();
