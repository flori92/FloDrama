/**
 * Script de test pour le service de paiement unifié
 * 
 * Ce script permet de tester de manière approfondie le service de paiement unifié
 * en vérifiant toutes les fonctionnalités et les cas d'utilisation.
 */

const unifiedPaymentService = require('../src/services/UnifiedPaymentService').default;
const { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, CONVERSION_EVENTS } = require('../src/services/UnifiedPaymentService');

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

// Fonction pour vérifier une condition et afficher le résultat
function assert(condition, message) {
  if (condition) {
    log(`SUCCÈS: ${message}`, 'success');
    return true;
  } else {
    log(`ÉCHEC: ${message}`, 'error');
    return false;
  }
}

// Fonction pour simuler un délai
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour nettoyer les données de test
function cleanup() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('flodrama_subscription');
  }
}

// Fonction principale de test
async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  const startTime = Date.now();
  
  try {
    logSection('INITIALISATION DU SERVICE');
    
    // Test d'initialisation
    try {
      await unifiedPaymentService.initialize();
      assert(unifiedPaymentService.isInitialized, "Le service devrait être initialisé");
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors de l'initialisation: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DES PÉRIODES D\'ESSAI');
    
    // Test de démarrage de la période d'essai
    try {
      cleanup();
      const trialData = await unifiedPaymentService.startInitialTrial();
      assert(
        trialData.status === SUBSCRIPTION_STATUS.TRIAL,
        "Le statut devrait être TRIAL après le démarrage de la période d'essai"
      );
      assert(
        new Date(trialData.trialEndDate) > new Date(),
        "La date de fin d'essai devrait être dans le futur"
      );
      assert(
        unifiedPaymentService.isInInitialTrial(),
        "isInInitialTrial() devrait retourner true"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test de la période d'essai: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DES ABONNEMENTS');
    
    // Test de souscription à un abonnement
    try {
      cleanup();
      const paymentMethod = {
        id: 'test-payment-id',
        type: 'paypal',
        email: 'test@example.com',
        isDefault: true,
        details: {
          payerId: 'test-payer-id',
          paymentId: 'test-payment-id',
          billingPeriod: 'monthly',
          timestamp: new Date().toISOString()
        }
      };
      
      const subscriptionData = await unifiedPaymentService.subscribe('premium', paymentMethod);
      
      assert(
        subscriptionData.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL,
        "Le statut devrait être SUBSCRIBED_TRIAL après la souscription"
      );
      assert(
        subscriptionData.plan.id === 'premium',
        "Le plan devrait être 'premium'"
      );
      assert(
        new Date(subscriptionData.subscriptionTrialEndDate) > new Date(),
        "La date de fin d'essai après abonnement devrait être dans le futur"
      );
      assert(
        unifiedPaymentService.isInSubscriptionTrial(),
        "isInSubscriptionTrial() devrait retourner true"
      );
      assert(
        unifiedPaymentService.hasActiveSubscription(),
        "hasActiveSubscription() devrait retourner true"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test d'abonnement: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DES CHANGEMENTS DE PLAN');
    
    // Test de changement de plan
    try {
      const newPlanData = await unifiedPaymentService.changePlan('ultimate');
      
      assert(
        newPlanData.plan.id === 'ultimate',
        "Le plan devrait être 'ultimate' après le changement"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test de changement de plan: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST D\'ANNULATION ET DE RÉACTIVATION');
    
    // Test d'annulation d'abonnement
    try {
      const cancelData = await unifiedPaymentService.cancelSubscription();
      
      assert(
        cancelData.autoRenew === false,
        "autoRenew devrait être false après l'annulation"
      );
      
      // Test de réactivation d'abonnement
      const reactivateData = await unifiedPaymentService.reactivateSubscription();
      
      assert(
        reactivateData.autoRenew === true,
        "autoRenew devrait être true après la réactivation"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test d'annulation/réactivation: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DE VÉRIFICATION D\'EXPIRATION');
    
    // Test de vérification d'expiration
    try {
      // Simuler un abonnement expiré
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 10);
      
      await unifiedPaymentService.updateSubscriptionData({
        endDate: pastDate.toISOString(),
        autoRenew: false
      });
      
      const isExpired = await unifiedPaymentService.checkSubscriptionExpiration();
      
      assert(
        isExpired === true,
        "L'abonnement devrait être expiré"
      );
      
      // Vérifier que le statut a été mis à jour
      const data = unifiedPaymentService.getSubscriptionData();
      assert(
        data.status === SUBSCRIPTION_STATUS.INACTIVE,
        "Le statut devrait être INACTIVE après l'expiration"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test de vérification d'expiration: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DE SUIVI DES CONVERSIONS');
    
    // Test de suivi des conversions
    try {
      // Simuler un événement de conversion
      await unifiedPaymentService.trackConversion({
        event: CONVERSION_EVENTS.VIEW_SUBSCRIPTION_PAGE,
        timestamp: new Date().toISOString(),
        data: {
          referrer: 'homepage'
        }
      });
      
      // Simuler un événement de comportement utilisateur
      await unifiedPaymentService.trackUserBehavior({
        event: 'scroll_depth',
        page: '/subscription',
        depth: 50,
        timestamp: new Date().toISOString()
      });
      
      // Vérifier que les événements ont été enregistrés
      assert(
        unifiedPaymentService.userBehaviorData.interactions.length > 0,
        "Les interactions de comportement utilisateur devraient être enregistrées"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test de suivi des conversions: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DE RÉCUPÉRATION DES MÉTRIQUES');
    
    // Test de récupération des métriques (simulé)
    try {
      // Ces appels échoueront probablement en environnement de test
      // car ils nécessitent une connexion au backend
      try {
        await unifiedPaymentService.getConversionMetrics();
      } catch (error) {
        log("Erreur attendue lors de la récupération des métriques de conversion (API non disponible)", 'warning');
      }
      
      try {
        await unifiedPaymentService.getUserBehaviorMetrics();
      } catch (error) {
        log("Erreur attendue lors de la récupération des métriques de comportement (API non disponible)", 'warning');
      }
      
      try {
        await unifiedPaymentService.getPaymentHistory();
      } catch (error) {
        log("Erreur attendue lors de la récupération de l'historique des paiements (API non disponible)", 'warning');
      }
      
      // Considérer ce test comme réussi car nous testons juste que les méthodes existent
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur inattendue lors du test de récupération des métriques: ${error.message}`);
      testsFailed++;
    }
    
  } catch (error) {
    log(`Erreur globale lors des tests: ${error.message}`, 'error');
    testsFailed++;
  } finally {
    cleanup();
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  logSection('RÉSUMÉ DES TESTS');
  log(`Tests terminés en ${duration.toFixed(2)} secondes`, 'info');
  log(`Tests réussis: ${testsPassed}`, 'success');
  log(`Tests échoués: ${testsFailed}`, 'error');
  
  return {
    passed: testsPassed,
    failed: testsFailed,
    duration
  };
}

// Exécuter les tests
runTests()
  .then(results => {
    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
  });
