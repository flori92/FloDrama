/**
 * Script de test pour les endpoints de paiement
 * 
 * Ce script teste la communication avec les endpoints backend du service de paiement
 * en simulant des requêtes API et en vérifiant les réponses.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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

// Configuration du test
const config = {
  baseUrl: 'http://localhost:4000', // URL du serveur local
  endpoints: {
    subscription: '/subscription',
    verifyPaypal: '/verify-paypal',
    paymentHistory: '/payment-history',
    conversion: '/analytics/conversion',
    behavior: '/analytics/behavior',
    conversionMetrics: '/analytics/conversion-metrics',
    behaviorMetrics: '/analytics/behavior-metrics'
  },
  // Token de test (à remplacer par un vrai token pour les tests)
  authToken: 'test-token-123456',
  // Données de test
  testData: {
    subscription: {
      planId: 'premium',
      paymentMethod: {
        type: 'paypal',
        email: 'test@example.com',
        isDefault: true,
        details: {
          payerId: 'PAYER-123',
          paymentId: 'PAYMENT-456',
          billingPeriod: 'monthly',
          timestamp: new Date().toISOString()
        }
      }
    },
    verifyPaypal: {
      orderId: 'ORDER-789',
      payerId: 'PAYER-123',
      amount: 2.99,
      currency: 'EUR',
      planId: 'premium',
      billingPeriod: 'monthly'
    },
    conversion: {
      event: 'view_subscription_page',
      sessionId: uuidv4(),
      timestamp: new Date().toISOString(),
      data: {
        referrer: 'homepage',
        planViewed: 'premium'
      },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      referrer: 'https://flodrama.com/home',
      page: '/subscription'
    },
    behavior: {
      event: 'hover_plan_card',
      sessionId: uuidv4(),
      timestamp: new Date().toISOString(),
      data: {
        planId: 'premium',
        duration: 1.5 // secondes
      },
      page: '/subscription'
    }
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

// Fonction pour afficher les détails d'une requête
function logRequest(method, url, data = null) {
  console.log(`${COLORS.fg.cyan}→ ${method.toUpperCase()} ${url}${COLORS.reset}`);
  if (data) {
    console.log(`${COLORS.dim}Données: ${JSON.stringify(data, null, 2)}${COLORS.reset}`);
  }
}

// Fonction pour afficher les détails d'une réponse
function logResponse(status, data) {
  const statusColor = status >= 200 && status < 300 ? COLORS.fg.green : COLORS.fg.red;
  console.log(`${statusColor}← Status: ${status}${COLORS.reset}`);
  console.log(`${COLORS.dim}Réponse: ${JSON.stringify(data, null, 2)}${COLORS.reset}`);
}

// Fonction pour créer un client axios avec les en-têtes d'authentification
function createClient() {
  return axios.create({
    baseURL: config.baseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.authToken}`
    }
  });
}

// Fonction pour tester un endpoint
async function testEndpoint(method, endpoint, data = null, auth = true) {
  const client = createClient();
  const url = endpoint;
  
  try {
    logRequest(method, url, data);
    
    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await client.get(url);
        break;
      case 'post':
        response = await client.post(url, data);
        break;
      case 'put':
        response = await client.put(url, data);
        break;
      case 'delete':
        response = await client.delete(url);
        break;
      default:
        throw new Error(`Méthode HTTP non supportée: ${method}`);
    }
    
    logResponse(response.status, response.data);
    log(`Test réussi pour ${method.toUpperCase()} ${url}`, 'success');
    return response.data;
  } catch (error) {
    if (error.response) {
      logResponse(error.response.status, error.response.data);
      log(`Erreur ${error.response.status} pour ${method.toUpperCase()} ${url}: ${error.response.data.message || 'Erreur inconnue'}`, 'error');
    } else if (error.request) {
      log(`Aucune réponse reçue pour ${method.toUpperCase()} ${url}. Le serveur est-il démarré?`, 'error');
    } else {
      log(`Erreur lors de la configuration de la requête: ${error.message}`, 'error');
    }
    return null;
  }
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
  logSection('TESTS DES ENDPOINTS DE PAIEMENT');
  log('Démarrage des tests...', 'info');
  
  try {
    // Test de création d'abonnement
    logSection('1. CRÉATION D\'ABONNEMENT');
    await testEndpoint('post', config.endpoints.subscription, config.testData.subscription);
    
    // Test de récupération d'abonnement
    logSection('2. RÉCUPÉRATION D\'ABONNEMENT');
    await testEndpoint('get', config.endpoints.subscription);
    
    // Test de vérification de paiement PayPal
    logSection('3. VÉRIFICATION DE PAIEMENT PAYPAL');
    await testEndpoint('post', config.endpoints.verifyPaypal, config.testData.verifyPaypal);
    
    // Test de récupération de l'historique des paiements
    logSection('4. HISTORIQUE DES PAIEMENTS');
    await testEndpoint('get', config.endpoints.paymentHistory);
    
    // Test de suivi de conversion
    logSection('5. SUIVI DE CONVERSION');
    await testEndpoint('post', config.endpoints.conversion, config.testData.conversion, false);
    
    // Test de suivi de comportement utilisateur
    logSection('6. SUIVI DE COMPORTEMENT');
    await testEndpoint('post', config.endpoints.behavior, config.testData.behavior, false);
    
    // Test de récupération des métriques de conversion
    logSection('7. MÉTRIQUES DE CONVERSION');
    await testEndpoint('get', config.endpoints.conversionMetrics);
    
    // Test de récupération des métriques de comportement
    logSection('8. MÉTRIQUES DE COMPORTEMENT');
    await testEndpoint('get', config.endpoints.behaviorMetrics);
    
    // Test d'annulation d'abonnement
    logSection('9. ANNULATION D\'ABONNEMENT');
    await testEndpoint('post', `${config.endpoints.subscription}/1/cancel`);
    
  } catch (error) {
    log(`Erreur globale lors des tests: ${error.message}`, 'error');
  }
  
  logSection('RÉSUMÉ DES TESTS');
  log('Tests terminés. Vérifiez les résultats ci-dessus pour plus de détails.', 'info');
}

// Exécuter les tests
runAllTests()
  .then(() => {
    log('Script de test terminé', 'success');
  })
  .catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
  });
