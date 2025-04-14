/**
 * Script de test pour le SmartScrapingService
 * 
 * Ce script permet de tester les fonctionnalités avancées du service de scraping intelligent
 * et de comparer ses performances avec l'ancien service.
 */

// Import des services à tester
const SmartScrapingService = require('../services/SmartScrapingService.cjs');
const ScrapingService = require('../services/ScrapingService.cjs');

// Fonction utilitaire pour mesurer le temps d'exécution
const measureTime = async (fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    return { success: true, result, duration };
  } catch (error) {
    const duration = Date.now() - start;
    return { success: false, error: error.message, duration };
  }
};

// Fonction pour comparer les résultats des deux services
const compareResults = (smartResult, oldResult) => {
  if (!smartResult.success && !oldResult.success) {
    return '❌ Les deux services ont échoué';
  }
  
  if (smartResult.success && !oldResult.success) {
    return '✅ SmartScrapingService a réussi, ScrapingService a échoué';
  }
  
  if (!smartResult.success && oldResult.success) {
    return '❌ SmartScrapingService a échoué, ScrapingService a réussi';
  }
  
  // Les deux ont réussi, comparer les résultats
  const smartCount = smartResult.result.length;
  const oldCount = oldResult.result.length;
  
  if (smartCount > oldCount) {
    return `✅ SmartScrapingService a trouvé plus de résultats (${smartCount} vs ${oldCount})`;
  } else if (smartCount < oldCount) {
    return `⚠️ SmartScrapingService a trouvé moins de résultats (${smartCount} vs ${oldCount})`;
  } else {
    return `✅ Les deux services ont trouvé le même nombre de résultats (${smartCount})`;
  }
};

// Fonction de test principale
async function testScrapingServices() {
  console.log('🔍 Démarrage des tests de comparaison des services de scraping...\n');
  
  // Test 1: getPopular
  console.log('📋 Test 1: getPopular()');
  const smartPopular = await measureTime(() => SmartScrapingService.getPopular());
  const oldPopular = await measureTime(() => ScrapingService.getPopular());
  
  console.log(`  - SmartScrapingService: ${smartPopular.success ? '✅ Réussi' : '❌ Échoué'} en ${smartPopular.duration}ms`);
  if (smartPopular.success) {
    console.log(`    Nombre d'éléments: ${smartPopular.result.length}`);
  } else {
    console.log(`    Erreur: ${smartPopular.error}`);
  }
  
  console.log(`  - ScrapingService: ${oldPopular.success ? '✅ Réussi' : '❌ Échoué'} en ${oldPopular.duration}ms`);
  if (oldPopular.success) {
    console.log(`    Nombre d'éléments: ${oldPopular.result.length}`);
  } else {
    console.log(`    Erreur: ${oldPopular.error}`);
  }
  
  console.log(`  - Comparaison: ${compareResults(smartPopular, oldPopular)}`);
  console.log(`  - Différence de temps: ${smartPopular.duration - oldPopular.duration}ms (${smartPopular.duration > oldPopular.duration ? 'plus lent' : 'plus rapide'})`);
  
  // Test 2: getPopularMovies
  console.log('\n📋 Test 2: getPopularMovies()');
  const smartMovies = await measureTime(() => SmartScrapingService.getPopularMovies());
  const oldMovies = await measureTime(() => ScrapingService.getPopularMovies());
  
  console.log(`  - SmartScrapingService: ${smartMovies.success ? '✅ Réussi' : '❌ Échoué'} en ${smartMovies.duration}ms`);
  if (smartMovies.success) {
    console.log(`    Nombre d'éléments: ${smartMovies.result.length}`);
  } else {
    console.log(`    Erreur: ${smartMovies.error}`);
  }
  
  console.log(`  - ScrapingService: ${oldMovies.success ? '✅ Réussi' : '❌ Échoué'} en ${oldMovies.duration}ms`);
  if (oldMovies.success) {
    console.log(`    Nombre d'éléments: ${oldMovies.result.length}`);
  } else {
    console.log(`    Erreur: ${oldMovies.error}`);
  }
  
  console.log(`  - Comparaison: ${compareResults(smartMovies, oldMovies)}`);
  console.log(`  - Différence de temps: ${smartMovies.duration - oldMovies.duration}ms (${smartMovies.duration > oldMovies.duration ? 'plus lent' : 'plus rapide'})`);
  
  // Test 3: getPopularKshows
  console.log('\n📋 Test 3: getPopularKshows()');
  const smartKshows = await measureTime(() => SmartScrapingService.getPopularKshows());
  const oldKshows = await measureTime(() => ScrapingService.getPopularKshows());
  
  console.log(`  - SmartScrapingService: ${smartKshows.success ? '✅ Réussi' : '❌ Échoué'} en ${smartKshows.duration}ms`);
  if (smartKshows.success) {
    console.log(`    Nombre d'éléments: ${smartKshows.result.length}`);
  } else {
    console.log(`    Erreur: ${smartKshows.error}`);
  }
  
  console.log(`  - ScrapingService: ${oldKshows.success ? '✅ Réussi' : '❌ Échoué'} en ${oldKshows.duration}ms`);
  if (oldKshows.success) {
    console.log(`    Nombre d'éléments: ${oldKshows.result.length}`);
  } else {
    console.log(`    Erreur: ${oldKshows.error}`);
  }
  
  console.log(`  - Comparaison: ${compareResults(smartKshows, oldKshows)}`);
  console.log(`  - Différence de temps: ${smartKshows.duration - oldKshows.duration}ms (${smartKshows.duration > oldKshows.duration ? 'plus lent' : 'plus rapide'})`);
  
  // Test 4: searchDramas
  console.log('\n📋 Test 4: searchDramas("squid game")');
  const searchTerm = 'squid game';
  const smartSearch = await measureTime(() => SmartScrapingService.searchDramas(searchTerm));
  const oldSearch = await measureTime(() => ScrapingService.searchDramas ? ScrapingService.searchDramas(searchTerm) : Promise.reject(new Error('Méthode non implémentée')));
  
  console.log(`  - SmartScrapingService: ${smartSearch.success ? '✅ Réussi' : '❌ Échoué'} en ${smartSearch.duration}ms`);
  if (smartSearch.success) {
    console.log(`    Nombre d'éléments: ${smartSearch.result.length}`);
  } else {
    console.log(`    Erreur: ${smartSearch.error}`);
  }
  
  console.log(`  - ScrapingService: ${oldSearch.success ? '✅ Réussi' : '❌ Échoué'} en ${oldSearch.duration}ms`);
  if (oldSearch.success) {
    console.log(`    Nombre d'éléments: ${oldSearch.result.length}`);
  } else {
    console.log(`    Erreur: ${oldSearch.error}`);
  }
  
  if (oldSearch.success) {
    console.log(`  - Comparaison: ${compareResults(smartSearch, oldSearch)}`);
    console.log(`  - Différence de temps: ${smartSearch.duration - oldSearch.duration}ms (${smartSearch.duration > oldSearch.duration ? 'plus lent' : 'plus rapide'})`);
  } else {
    console.log(`  - Comparaison: N/A (ScrapingService ne supporte pas cette méthode)`);
  }
  
  // Test 5: Test de résilience (tentative avec une URL invalide)
  console.log('\n📋 Test 5: Test de résilience (URL invalide)');
  
  // Sauvegarde temporaire des URLs
  const originalUrl = SmartScrapingService.sources.voirdrama.popularUrl;
  
  // Modifier l'URL pour la rendre invalide
  SmartScrapingService.sources.voirdrama.popularUrl = 'https://voirdrama.org/invalid-url';
  
  const resilience = await measureTime(() => SmartScrapingService.getPopular());
  
  console.log(`  - Résilience: ${resilience.success ? '✅ A réussi malgré l\'URL invalide' : '❌ A échoué avec l\'URL invalide'} en ${resilience.duration}ms`);
  if (resilience.success) {
    console.log(`    Nombre d'éléments: ${resilience.result.length}`);
    console.log('    ✅ Le service a automatiquement basculé vers une source alternative');
  } else {
    console.log(`    Erreur: ${resilience.error}`);
    console.log('    ❌ Le service n\'a pas pu récupérer de données alternatives');
  }
  
  // Restaurer l'URL originale
  SmartScrapingService.sources.voirdrama.popularUrl = originalUrl;
  
  // Test 6: Statistiques des sources
  console.log('\n📋 Test 6: Statistiques des sources');
  const stats = SmartScrapingService.getSourceStats();
  
  console.log('  Statistiques par source:');
  for (const [source, sourceStats] of Object.entries(stats)) {
    console.log(`  - ${source}:`);
    console.log(`    Succès: ${sourceStats.success}`);
    console.log(`    Échecs: ${sourceStats.failure}`);
    console.log(`    Taux de réussite: ${sourceStats.successRate.toFixed(2)}%`);
    console.log(`    Dernier succès: ${sourceStats.lastSuccess ? new Date(sourceStats.lastSuccess).toLocaleString() : 'Jamais'}`);
  }
  
  console.log('\n🏁 Fin des tests des services de scraping');
}

// Exécution des tests
testScrapingServices().catch(error => {
  console.error('❌ Erreur lors des tests:', error);
});
