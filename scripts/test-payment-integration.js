/**
 * Script de test d'intégration pour le service de paiement unifié
 * 
 * Ce script teste l'intégration entre le service de paiement unifié et le backend API
 * en simulant un flux complet d'abonnement avec PayPal.
 */

const axios = require('axios');
const unifiedPaymentService = require('../src/services/UnifiedPaymentService').default;
const paymentApiService = require('../src/services/api/PaymentApiService').default;
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

// Fonction pour simuler une réponse PayPal
function mockPayPalResponse() {
  return {
    id: `PAY-${Date.now()}`,
    status: 'COMPLETED',
    payer: {
      payer_id: `PAYER-${Date.now()}`,
      email_address: 'test@flodrama.com',
      name: {
        given_name: 'Test',
        surname: 'User'
      }
    },
    purchase_units: [{
      amount: {
        value: '35.00',
        currency_code: 'EUR'
      }
    }],
    create_time: new Date().toISOString(),
    update_time: new Date().toISOString()
  };
}

// Fonction pour simuler un utilisateur
function mockUser() {
  return {
    id: `USER-${Date.now()}`,
    email: 'test@flodrama.com',
    name: 'Test User',
    isAuthenticated: true
  };
}

// Fonction pour simuler un serveur API
class MockApiServer {
  constructor() {
    this.subscriptions = new Map();
    this.conversions = [];
    this.behaviors = [];
    this.paymentHistory = [];
  }
  
  getSubscription(userId) {
    return this.subscriptions.get(userId) || null;
  }
  
  createSubscription(userId, data) {
    this.subscriptions.set(userId, data);
    this.paymentHistory.push({
      userId,
      type: 'subscription_created',
      amount: data.plan.billingPeriod === 'yearly' ? data.plan.yearlyPrice : data.plan.monthlyPrice,
      currency: 'EUR',
      timestamp: new Date().toISOString(),
      details: data
    });
    return data;
  }
  
  updateSubscription(userId, data) {
    const existing = this.subscriptions.get(userId) || {};
    const updated = { ...existing, ...data };
    this.subscriptions.set(userId, updated);
    return updated;
  }
  
  cancelSubscription(userId) {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      subscription.autoRenew = false;
      this.subscriptions.set(userId, subscription);
      this.paymentHistory.push({
        userId,
        type: 'subscription_cancelled',
        timestamp: new Date().toISOString(),
        details: subscription
      });
    }
    return subscription;
  }
  
  trackConversion(data) {
    this.conversions.push(data);
    return { success: true, id: `CONV-${Date.now()}` };
  }
  
  trackBehavior(data) {
    this.behaviors.push(data);
    return { success: true, id: `BEH-${Date.now()}` };
  }
  
  getConversionMetrics() {
    // Simuler des métriques de conversion
    return {
      conversionRate: 3.5,
      revenue: 1250.75,
      averageOrderValue: 35.8,
      abandonmentRate: 65.2,
      visits: 1000,
      planSelections: 150,
      paymentInitiations: 80,
      subscriptions: 35,
      planDistribution: {
        essential: 10,
        premium: 20,
        ultimate: 5
      },
      previousPeriod: {
        conversionRate: 3.2,
        revenue: 1100.50,
        averageOrderValue: 34.5,
        abandonmentRate: 68.7
      },
      dailyTrends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visits: Math.floor(Math.random() * 50) + 20,
        conversions: Math.floor(Math.random() * 5) + 1
      })),
      recentEvents: this.conversions.slice(-10).map(conv => ({
        ...conv,
        userId: conv.userId || 'anonymous'
      })),
      recommendations: [
        {
          title: 'Optimiser le formulaire de paiement',
          description: 'Réduire le nombre de champs requis pour améliorer le taux de conversion.',
          priority: 'high',
          estimatedImpact: '+15% de conversions'
        },
        {
          title: 'Ajouter des témoignages clients',
          description: 'Intégrer des témoignages de clients satisfaits sur la page d\'abonnement.',
          priority: 'medium',
          estimatedImpact: '+8% de conversions'
        },
        {
          title: 'Tester différentes couleurs de bouton',
          description: 'Expérimenter avec différentes couleurs pour le bouton d\'abonnement.',
          priority: 'low',
          estimatedImpact: '+3% de conversions'
        }
      ]
    };
  }
  
  getBehaviorMetrics() {
    // Simuler des métriques de comportement
    return {
      averageTimeOnPage: 120, // secondes
      averageScrollDepth: 65, // pourcentage
      exitRate: 45, // pourcentage
      faqViews: 30, // pourcentage
      planHovers: 70, // pourcentage
    };
  }
  
  getPaymentHistory(userId) {
    return this.paymentHistory.filter(p => p.userId === userId);
  }
}

// Fonction principale de test d'intégration
async function runIntegrationTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  const startTime = Date.now();
  
  // Créer un serveur API simulé
  const mockServer = new MockApiServer();
  
  // Simuler un utilisateur
  const mockCurrentUser = mockUser();
  
  try {
    logSection('CONFIGURATION DU TEST D\'INTÉGRATION');
    
    // Remplacer les appels API réels par des mocks
    const originalAxiosPost = axios.post;
    const originalAxiosGet = axios.get;
    const originalAxiosPut = axios.put;
    
    axios.post = jest.fn((url, data) => {
      log(`Mock API POST: ${url}`, 'info');
      
      if (url.includes('/subscription')) {
        return Promise.resolve({ 
          data: mockServer.createSubscription(mockCurrentUser.id, data),
          status: 200
        });
      } else if (url.includes('/verify-paypal')) {
        return Promise.resolve({ 
          data: { verified: true, orderId: data.orderId },
          status: 200
        });
      } else if (url.includes('/analytics/conversion')) {
        return Promise.resolve({ 
          data: mockServer.trackConversion(data),
          status: 200
        });
      } else if (url.includes('/analytics/behavior')) {
        return Promise.resolve({ 
          data: mockServer.trackBehavior(data),
          status: 200
        });
      } else if (url.includes('/subscription/') && url.includes('/cancel')) {
        const subscriptionId = url.split('/').slice(-2)[0];
        return Promise.resolve({ 
          data: mockServer.cancelSubscription(mockCurrentUser.id),
          status: 200
        });
      }
      
      return Promise.reject(new Error(`URL non gérée: ${url}`));
    });
    
    axios.get = jest.fn((url, config) => {
      log(`Mock API GET: ${url}`, 'info');
      
      if (url.includes('/subscription')) {
        return Promise.resolve({ 
          data: mockServer.getSubscription(mockCurrentUser.id),
          status: 200
        });
      } else if (url.includes('/analytics/conversion-metrics')) {
        return Promise.resolve({ 
          data: mockServer.getConversionMetrics(),
          status: 200
        });
      } else if (url.includes('/analytics/behavior-metrics')) {
        return Promise.resolve({ 
          data: mockServer.getBehaviorMetrics(),
          status: 200
        });
      } else if (url.includes('/payment-history')) {
        return Promise.resolve({ 
          data: mockServer.getPaymentHistory(mockCurrentUser.id),
          status: 200
        });
      }
      
      return Promise.reject(new Error(`URL non gérée: ${url}`));
    });
    
    axios.put = jest.fn((url, data) => {
      log(`Mock API PUT: ${url}`, 'info');
      
      if (url.includes('/subscription')) {
        return Promise.resolve({ 
          data: mockServer.updateSubscription(mockCurrentUser.id, data),
          status: 200
        });
      }
      
      return Promise.reject(new Error(`URL non gérée: ${url}`));
    });
    
    // Configurer le service de paiement avec l'utilisateur simulé
    unifiedPaymentService.currentUser = mockCurrentUser;
    
    logSection('TEST D\'INITIALISATION ET SYNCHRONISATION');
    
    // Test d'initialisation et synchronisation
    try {
      await unifiedPaymentService.initialize();
      assert(unifiedPaymentService.isInitialized, "Le service devrait être initialisé");
      
      // Créer un abonnement sur le "serveur"
      mockServer.createSubscription(mockCurrentUser.id, {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        plan: SUBSCRIPTION_PLANS.PREMIUM,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true
      });
      
      // Synchroniser avec le "serveur"
      await unifiedPaymentService.syncSubscriptionData();
      
      const subscriptionData = unifiedPaymentService.getSubscriptionData();
      assert(
        subscriptionData && subscriptionData.status === SUBSCRIPTION_STATUS.ACTIVE,
        "Les données d'abonnement devraient être synchronisées depuis le serveur"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test d'initialisation et synchronisation: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DE FLUX COMPLET D\'ABONNEMENT');
    
    // Test de flux complet d'abonnement
    try {
      // Simuler un paiement PayPal réussi
      const paypalResponse = mockPayPalResponse();
      
      // Créer un objet de méthode de paiement à partir de la réponse PayPal
      const paymentMethod = {
        id: paypalResponse.id,
        type: 'paypal',
        email: paypalResponse.payer.email_address,
        isDefault: true,
        details: {
          payerId: paypalResponse.payer.payer_id,
          paymentId: paypalResponse.id,
          billingPeriod: 'yearly',
          timestamp: new Date().toISOString()
        }
      };
      
      // Souscrire à un abonnement
      const subscriptionData = await unifiedPaymentService.subscribe('ultimate', paymentMethod);
      
      assert(
        subscriptionData.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL,
        "Le statut devrait être SUBSCRIBED_TRIAL après la souscription"
      );
      assert(
        subscriptionData.plan.id === 'ultimate',
        "Le plan devrait être 'ultimate'"
      );
      
      // Vérifier que l'abonnement a été créé sur le "serveur"
      const serverSubscription = mockServer.getSubscription(mockCurrentUser.id);
      assert(
        serverSubscription && serverSubscription.plan.id === 'ultimate',
        "L'abonnement devrait être créé sur le serveur"
      );
      
      // Vérifier que l'événement de conversion a été enregistré
      assert(
        mockServer.conversions.some(c => c.event === CONVERSION_EVENTS.COMPLETE_PAYMENT),
        "L'événement de conversion COMPLETE_PAYMENT devrait être enregistré"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test de flux complet d'abonnement: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DE RÉCUPÉRATION DES MÉTRIQUES');
    
    // Test de récupération des métriques
    try {
      // Récupérer les métriques de conversion
      const conversionMetrics = await unifiedPaymentService.getConversionMetrics();
      
      assert(
        conversionMetrics && typeof conversionMetrics.conversionRate === 'number',
        "Les métriques de conversion devraient être récupérées"
      );
      
      // Récupérer les métriques de comportement
      const behaviorMetrics = await unifiedPaymentService.getUserBehaviorMetrics();
      
      assert(
        behaviorMetrics && typeof behaviorMetrics.averageTimeOnPage === 'number',
        "Les métriques de comportement devraient être récupérées"
      );
      
      // Récupérer l'historique des paiements
      const paymentHistory = await unifiedPaymentService.getPaymentHistory();
      
      assert(
        Array.isArray(paymentHistory),
        "L'historique des paiements devrait être récupéré"
      );
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test de récupération des métriques: ${error.message}`);
      testsFailed++;
    }
    
    logSection('TEST DE GESTION DES ERREURS');
    
    // Test de gestion des erreurs
    try {
      // Simuler une erreur d'API
      axios.post = jest.fn((url) => {
        if (url.includes('/verify-paypal')) {
          return Promise.reject(new Error('Erreur de serveur simulée'));
        }
        return Promise.reject(new Error(`URL non gérée: ${url}`));
      });
      
      // Tenter de vérifier un paiement PayPal
      try {
        await paymentApiService.verifyPayPalPayment({
          orderId: 'test-order',
          payerId: 'test-payer',
          amount: 35,
          currency: 'EUR'
        });
        assert(false, "La vérification devrait échouer");
      } catch (error) {
        assert(
          error.message.includes('Erreur de serveur simulée'),
          "L'erreur devrait être propagée correctement"
        );
      }
      testsPassed++;
    } catch (error) {
      assert(false, `Erreur lors du test de gestion des erreurs: ${error.message}`);
      testsFailed++;
    }
    
    // Restaurer les fonctions axios originales
    axios.post = originalAxiosPost;
    axios.get = originalAxiosGet;
    axios.put = originalAxiosPut;
    
  } catch (error) {
    log(`Erreur globale lors des tests d'intégration: ${error.message}`, 'error');
    testsFailed++;
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  logSection('RÉSUMÉ DES TESTS D\'INTÉGRATION');
  log(`Tests terminés en ${duration.toFixed(2)} secondes`, 'info');
  log(`Tests réussis: ${testsPassed}`, 'success');
  log(`Tests échoués: ${testsFailed}`, 'error');
  
  return {
    passed: testsPassed,
    failed: testsFailed,
    duration
  };
}

// Exécuter les tests d'intégration
runIntegrationTests()
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
