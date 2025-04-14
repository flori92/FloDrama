/**
 * Script de migration du service de scraping
 * 
 * Ce script permet de migrer progressivement de l'ancien ScrapingService
 * vers le nouveau SmartScrapingService en vérifiant la compatibilité
 * et en testant les performances.
 */

// Import des services
const OldScrapingService = require('../services/ScrapingService.cjs');
const SmartScrapingService = require('../services/SmartScrapingService.cjs');

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
    return { status: 'both_failed', message: 'Les deux services ont échoué' };
  }
  
  if (smartResult.success && !oldResult.success) {
    return { status: 'smart_only', message: 'SmartScrapingService a réussi, ScrapingService a échoué' };
  }
  
  if (!smartResult.success && oldResult.success) {
    return { status: 'old_only', message: 'SmartScrapingService a échoué, ScrapingService a réussi' };
  }
  
  // Les deux ont réussi, comparer les résultats
  const smartCount = smartResult.result.length;
  const oldCount = oldResult.result.length;
  
  if (smartCount >= oldCount) {
    return { 
      status: 'compatible', 
      message: `SmartScrapingService a trouvé ${smartCount} résultats vs ${oldCount} pour l'ancien service`,
      difference: smartCount - oldCount
    };
  } else {
    return { 
      status: 'less_results', 
      message: `SmartScrapingService a trouvé moins de résultats (${smartCount} vs ${oldCount})`,
      difference: smartCount - oldCount
    };
  }
};

// Fonction pour vérifier la compatibilité des méthodes
const checkMethodCompatibility = () => {
  const oldServiceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(OldScrapingService))
    .filter(method => typeof OldScrapingService[method] === 'function' && !method.startsWith('_'));
  
  const smartServiceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(SmartScrapingService))
    .filter(method => typeof SmartScrapingService[method] === 'function' && !method.startsWith('_'));
  
  console.log('\n📋 Vérification de la compatibilité des méthodes:');
  
  const missingMethods = oldServiceMethods.filter(method => !smartServiceMethods.includes(method));
  const newMethods = smartServiceMethods.filter(method => !oldServiceMethods.includes(method));
  const commonMethods = oldServiceMethods.filter(method => smartServiceMethods.includes(method));
  
  console.log(`  ✅ Méthodes communes: ${commonMethods.length}`);
  commonMethods.forEach(method => console.log(`    - ${method}`));
  
  console.log(`  ⚠️ Méthodes manquantes dans SmartScrapingService: ${missingMethods.length}`);
  missingMethods.forEach(method => console.log(`    - ${method}`));
  
  console.log(`  🆕 Nouvelles méthodes dans SmartScrapingService: ${newMethods.length}`);
  newMethods.forEach(method => console.log(`    - ${method}`));
  
  return {
    compatible: missingMethods.length === 0,
    missingMethods,
    newMethods,
    commonMethods
  };
};

// Fonction pour tester les méthodes communes
const testCommonMethods = async (methods) => {
  console.log('\n📋 Test des méthodes communes:');
  
  const results = {};
  
  for (const method of methods) {
    console.log(`\n  🔍 Test de la méthode: ${method}`);
    
    try {
      // Vérifier si la méthode prend des paramètres
      let params = [];
      
      if (method === 'searchDramas' || method === 'searchAnime' || method === 'searchAll') {
        params = ['squid game'];
      }
      
      const smartResult = await measureTime(() => SmartScrapingService[method](...params));
      const oldResult = await measureTime(() => OldScrapingService[method](...params));
      
      console.log(`    - SmartScrapingService: ${smartResult.success ? '✅ Réussi' : '❌ Échoué'} en ${smartResult.duration}ms`);
      if (smartResult.success) {
        console.log(`      Nombre d'éléments: ${Array.isArray(smartResult.result) ? smartResult.result.length : 'N/A'}`);
      } else {
        console.log(`      Erreur: ${smartResult.error}`);
      }
      
      console.log(`    - ScrapingService: ${oldResult.success ? '✅ Réussi' : '❌ Échoué'} en ${oldResult.duration}ms`);
      if (oldResult.success) {
        console.log(`      Nombre d'éléments: ${Array.isArray(oldResult.result) ? oldResult.result.length : 'N/A'}`);
      } else {
        console.log(`      Erreur: ${oldResult.error}`);
      }
      
      const comparison = compareResults(smartResult, oldResult);
      console.log(`    - Comparaison: ${comparison.message}`);
      console.log(`    - Différence de temps: ${smartResult.duration - oldResult.duration}ms (${smartResult.duration > oldResult.duration ? 'plus lent' : 'plus rapide'})`);
      
      results[method] = {
        smartResult: {
          success: smartResult.success,
          duration: smartResult.duration,
          count: Array.isArray(smartResult.result) ? smartResult.result.length : null
        },
        oldResult: {
          success: oldResult.success,
          duration: oldResult.duration,
          count: Array.isArray(oldResult.result) ? oldResult.result.length : null
        },
        comparison
      };
    } catch (error) {
      console.error(`    ❌ Erreur lors du test de la méthode ${method}:`, error);
      results[method] = { error: error.message };
    }
  }
  
  return results;
};

// Fonction principale pour exécuter la migration
async function runMigration() {
  console.log('🚀 Démarrage de la migration du service de scraping...\n');
  
  // Étape 1: Vérifier la compatibilité des méthodes
  const compatibility = checkMethodCompatibility();
  
  if (!compatibility.compatible) {
    console.warn('\n⚠️ Attention: Le SmartScrapingService ne dispose pas de toutes les méthodes de l\'ancien service.');
    console.warn('   Veuillez implémenter les méthodes manquantes avant de procéder à la migration complète.');
  } else {
    console.log('\n✅ Le SmartScrapingService est compatible avec l\'ancien service!');
  }
  
  // Étape 2: Tester les méthodes communes
  const testResults = await testCommonMethods(compatibility.commonMethods);
  
  // Étape 3: Analyser les résultats
  console.log('\n📊 Analyse des résultats:');
  
  let compatibleCount = 0;
  let incompatibleCount = 0;
  let smartOnlyCount = 0;
  let oldOnlyCount = 0;
  
  for (const [, result] of Object.entries(testResults)) {
    if (result.error) continue;
    
    const status = result.comparison.status;
    
    if (status === 'compatible') {
      compatibleCount++;
    } else if (status === 'less_results') {
      incompatibleCount++;
    } else if (status === 'smart_only') {
      smartOnlyCount++;
    } else if (status === 'old_only') {
      oldOnlyCount++;
    }
  }
  
  console.log(`  ✅ Méthodes compatibles: ${compatibleCount}`);
  console.log(`  ⚠️ Méthodes avec moins de résultats: ${incompatibleCount}`);
  console.log(`  🔄 Méthodes fonctionnant uniquement avec SmartScrapingService: ${smartOnlyCount}`);
  console.log(`  ⛔ Méthodes fonctionnant uniquement avec l'ancien service: ${oldOnlyCount}`);
  
  // Étape 4: Recommandation
  console.log('\n🧠 Recommandation:');
  
  if (compatibleCount >= compatibility.commonMethods.length * 0.8) {
    console.log('  ✅ Le SmartScrapingService est prêt pour la migration!');
    console.log('  Étapes recommandées:');
    console.log('  1. Remplacer progressivement les appels à l\'ancien service par le nouveau');
    console.log('  2. Surveiller les performances et les résultats');
    console.log('  3. Une fois la migration terminée, supprimer l\'ancien service');
  } else if (compatibleCount >= compatibility.commonMethods.length * 0.5) {
    console.log('  ⚠️ Le SmartScrapingService est partiellement prêt pour la migration.');
    console.log('  Étapes recommandées:');
    console.log('  1. Améliorer les méthodes problématiques');
    console.log('  2. Refaire les tests');
    console.log('  3. Procéder à une migration progressive');
  } else {
    console.log('  ❌ Le SmartScrapingService n\'est pas prêt pour la migration.');
    console.log('  Étapes recommandées:');
    console.log('  1. Corriger les problèmes de compatibilité');
    console.log('  2. Implémenter les méthodes manquantes');
    console.log('  3. Refaire les tests');
  }
  
  console.log('\n🏁 Fin de la migration du service de scraping');
}

// Exécution de la migration
runMigration().catch(error => {
  console.error('❌ Erreur lors de la migration:', error);
});
