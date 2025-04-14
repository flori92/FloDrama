/**
 * Script de test de performance pour le service de paiement unifié
 * 
 * Ce script teste les performances du service de paiement unifié
 * en simulant une charge importante et en mesurant les temps de réponse.
 */

const unifiedPaymentService = require('../src/services/UnifiedPaymentService').default;
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } = require('../src/services/UnifiedPaymentService');

// Configuration des couleurs pour la console
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Fonction pour afficher les messages de test
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`${COLORS.fg.green}✓ ${timestamp} - ${message}${COLORS.reset}`);
      break;
    case 'error':
      console.error(`${COLORS.fg.red}✗ ${timestamp} - ${message}${COLORS.reset}`);
      break;
    case 'warning':
      console.warn(`${COLORS.fg.yellow}⚠ ${timestamp} - ${message}${COLORS.reset}`);
      break;
    case 'info':
    default:
      console.log(`${COLORS.fg.blue}ℹ ${timestamp} - ${message}${COLORS.reset}`);
      break;
  }
}

// Fonction pour afficher le titre d'une section de test
function logSection(title) {
  console.log(`\n${COLORS.fg.magenta}${COLORS.bright}=== ${title} ===${COLORS.reset}\n`);
}

// Fonction pour mesurer le temps d'exécution d'une fonction
async function measureExecutionTime(fn, name, iterations = 1) {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await fn();
      const end = performance.now();
      const duration = end - start;
      results.push(duration);
      
      if (iterations > 1) {
        log(`Itération ${i + 1}/${iterations}: ${duration.toFixed(2)} ms`, 'info');
      }
    } catch (error) {
      log(`Erreur lors de l'exécution de ${name}: ${error.message}`, 'error');
      results.push(null);
    }
  }
  
  // Calculer les statistiques
  const validResults = results.filter(r => r !== null);
  if (validResults.length === 0) {
    return {
      name,
      min: null,
      max: null,
      avg: null,
      median: null,
      p95: null,
      success: false
    };
  }
  
  validResults.sort((a, b) => a - b);
  const min = validResults[0];
  const max = validResults[validResults.length - 1];
  const avg = validResults.reduce((sum, val) => sum + val, 0) / validResults.length;
  const median = validResults[Math.floor(validResults.length / 2)];
  const p95 = validResults[Math.floor(validResults.length * 0.95)];
  
  return {
    name,
    min,
    max,
    avg,
    median,
    p95,
    success: true
  };
}

// Fonction pour simuler un délai
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour simuler un utilisateur
function mockUser(id) {
  return {
    id: `USER-${id}`,
    email: `test${id}@flodrama.com`,
    name: `Test User ${id}`,
    isAuthenticated: true
  };
}

// Fonction pour simuler un paiement PayPal
function mockPayPalPayment(userId, planId, billingPeriod) {
  return {
    id: `PAY-${Date.now()}-${userId}`,
    type: 'paypal',
    email: `test${userId}@flodrama.com`,
    isDefault: true,
    details: {
      payerId: `PAYER-${userId}`,
      paymentId: `PAYMENT-${Date.now()}-${userId}`,
      billingPeriod: billingPeriod,
      timestamp: new Date().toISOString()
    }
  };
}

// Fonction pour nettoyer les données de test
function cleanup() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('flodrama_subscription');
  }
  
  // Réinitialiser le cache
  unifiedPaymentService.subscriptionCache = new Map();
  unifiedPaymentService.userBehaviorData = {
    pageViews: {},
    interactions: [],
    timeOnPage: {}
  };
}

// Fonction principale de test de performance
async function runPerformanceTests() {
  const startTime = Date.now();
  const results = [];
  
  try {
    logSection('INITIALISATION DU SERVICE');
    
    // Mesurer le temps d'initialisation
    const initResult = await measureExecutionTime(
      async () => {
        cleanup();
        await unifiedPaymentService.initialize();
      },
      'Initialisation du service',
      5
    );
    results.push(initResult);
    
    logSection('TEST DE PERFORMANCE DES OPÉRATIONS DE BASE');
    
    // Mesurer le temps de démarrage d'une période d'essai
    const trialResult = await measureExecutionTime(
      async () => {
        cleanup();
        await unifiedPaymentService.startInitialTrial();
      },
      'Démarrage période d\'essai',
      10
    );
    results.push(trialResult);
    
    // Mesurer le temps de souscription à un abonnement
    const subscribeResult = await measureExecutionTime(
      async () => {
        cleanup();
        const user = mockUser(Date.now());
        unifiedPaymentService.currentUser = user;
        const payment = mockPayPalPayment(user.id, 'premium', 'monthly');
        await unifiedPaymentService.subscribe('premium', payment);
      },
      'Souscription à un abonnement',
      10
    );
    results.push(subscribeResult);
    
    // Mesurer le temps de changement de plan
    const changePlanResult = await measureExecutionTime(
      async () => {
        // Utiliser l'abonnement existant
        await unifiedPaymentService.changePlan('ultimate');
      },
      'Changement de plan',
      10
    );
    results.push(changePlanResult);
    
    // Mesurer le temps d'annulation d'abonnement
    const cancelResult = await measureExecutionTime(
      async () => {
        await unifiedPaymentService.cancelSubscription();
      },
      'Annulation d\'abonnement',
      10
    );
    results.push(cancelResult);
    
    // Mesurer le temps de vérification d'expiration
    const expirationResult = await measureExecutionTime(
      async () => {
        await unifiedPaymentService.checkSubscriptionExpiration();
      },
      'Vérification d\'expiration',
      10
    );
    results.push(expirationResult);
    
    // Mesurer le temps de suivi des conversions
    const conversionResult = await measureExecutionTime(
      async () => {
        await unifiedPaymentService.trackConversion({
          event: 'view_subscription_page',
          timestamp: new Date().toISOString(),
          data: {
            referrer: 'homepage'
          }
        });
      },
      'Suivi des conversions',
      10
    );
    results.push(conversionResult);
    
    logSection('TEST DE PERFORMANCE SOUS CHARGE');
    
    // Simuler une charge importante (opérations parallèles)
    const parallelOperations = [];
    const numParallelOps = 20;
    
    for (let i = 0; i < numParallelOps; i++) {
      const user = mockUser(i);
      const operation = async () => {
        unifiedPaymentService.currentUser = user;
        await unifiedPaymentService.startInitialTrial();
        await delay(10); // Petit délai pour éviter les conflits
        
        const payment = mockPayPalPayment(user.id, 'premium', 'monthly');
        await unifiedPaymentService.subscribe('premium', payment);
        await delay(10);
        
        if (i % 2 === 0) {
          await unifiedPaymentService.changePlan('ultimate');
        }
        await delay(10);
        
        if (i % 3 === 0) {
          await unifiedPaymentService.cancelSubscription();
        }
        
        await unifiedPaymentService.trackConversion({
          event: 'complete_payment',
          timestamp: new Date().toISOString(),
          data: {
            planId: i % 2 === 0 ? 'ultimate' : 'premium'
          }
        });
      };
      
      parallelOperations.push(operation());
    }
    
    const parallelResult = await measureExecutionTime(
      async () => {
        await Promise.all(parallelOperations);
      },
      `${numParallelOps} opérations parallèles`,
      1
    );
    results.push(parallelResult);
    
    // Simuler des opérations en série rapide
    const seriesResult = await measureExecutionTime(
      async () => {
        for (let i = 0; i < 10; i++) {
          const user = mockUser(i + 100);
          unifiedPaymentService.currentUser = user;
          await unifiedPaymentService.startInitialTrial();
          const payment = mockPayPalPayment(user.id, 'essential', 'yearly');
          await unifiedPaymentService.subscribe('essential', payment);
          await unifiedPaymentService.changePlan('premium');
          await unifiedPaymentService.cancelSubscription();
        }
      },
      '10 utilisateurs en série',
      1
    );
    results.push(seriesResult);
    
  } catch (error) {
    log(`Erreur globale lors des tests de performance: ${error.message}`, 'error');
  } finally {
    cleanup();
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  logSection('RÉSUMÉ DES TESTS DE PERFORMANCE');
  log(`Tests terminés en ${duration.toFixed(2)} secondes`, 'info');
  
  // Afficher les résultats sous forme de tableau
  console.log('\n');
  console.log('┌─────────────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐');
  console.log('│ Opération                       │ Min (ms) │ Max (ms) │ Avg (ms) │ Med (ms) │ P95 (ms) │');
  console.log('├─────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤');
  
  results.forEach(result => {
    if (!result.success) {
      console.log(`│ ${result.name.padEnd(31)} │ ${'ÉCHEC'.padEnd(8)} │ ${'ÉCHEC'.padEnd(8)} │ ${'ÉCHEC'.padEnd(8)} │ ${'ÉCHEC'.padEnd(8)} │ ${'ÉCHEC'.padEnd(8)} │`);
    } else {
      console.log(`│ ${result.name.padEnd(31)} │ ${result.min.toFixed(2).padEnd(8)} │ ${result.max.toFixed(2).padEnd(8)} │ ${result.avg.toFixed(2).padEnd(8)} │ ${result.median.toFixed(2).padEnd(8)} │ ${result.p95.toFixed(2).padEnd(8)} │`);
    }
  });
  
  console.log('└─────────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘');
  
  // Identifier les opérations les plus lentes
  const slowestOperations = [...results]
    .filter(r => r.success)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);
  
  if (slowestOperations.length > 0) {
    logSection('OPÉRATIONS LES PLUS LENTES');
    slowestOperations.forEach((op, index) => {
      log(`${index + 1}. ${op.name}: ${op.avg.toFixed(2)} ms en moyenne`, 'warning');
    });
    
    log('\nRecommandations d\'optimisation:', 'info');
    log('1. Implémenter un système de mise en cache pour les opérations fréquentes', 'info');
    log('2. Optimiser les appels API en réduisant la fréquence de synchronisation', 'info');
    log('3. Utiliser des files d\'attente pour les opérations non critiques comme le suivi des conversions', 'info');
  }
  
  return {
    results,
    duration
  };
}

// Exécuter les tests de performance
runPerformanceTests()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
  });
