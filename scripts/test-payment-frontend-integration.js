/**
 * Script de test d'intégration frontend-backend pour le service de paiement FloDrama
 * 
 * Ce script teste l'intégration entre le frontend React et le service de paiement
 * en simulant les interactions utilisateur et en vérifiant les réponses du serveur.
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
  apiUrl: 'http://localhost:54112',
  frontendUrl: 'http://localhost:3000',
  authToken: 'test-token-123456',
  testUser: {
    id: 'test-user-' + Math.floor(Math.random() * 1000),
    email: 'test@flodrama.com',
    name: 'Utilisateur Test'
  },
  subscriptionPlans: {
    essential: {
      id: 'essential',
      name: 'Essentiel',
      monthlyPrice: 1.99,
      yearlyPrice: 23
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 2.99,
      yearlyPrice: 35
    },
    ultimate: {
      id: 'ultimate',
      name: 'Ultimate',
      monthlyPrice: 4.99,
      yearlyPrice: 55
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

// Fonction pour créer un client API
function createApiClient() {
  return axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.authToken}`
    }
  });
}

// Fonction pour simuler l'interaction frontend
async function simulateFrontendInteraction(scenario) {
  const apiClient = createApiClient();
  
  logSection(`SCÉNARIO: ${scenario.name}`);
  log(`Simulation de l'interaction frontend pour: ${scenario.name}`, 'info');
  
  try {
    // Étape 1: Vérifier la santé du service
    log('1. Vérification de la santé du service', 'info');
    const healthResponse = await apiClient.get('/health');
    
    if (healthResponse.status === 200 && healthResponse.data.status === 'ok') {
      log('Service de paiement opérationnel', 'success');
    } else {
      log('Service de paiement non opérationnel', 'error');
      return false;
    }
    
    // Étape 2: Simuler les actions utilisateur
    for (const action of scenario.actions) {
      log(`2. Action: ${action.name}`, 'info');
      
      switch (action.type) {
        case 'view_page':
          // Simuler la vue d'une page
          const conversionData = {
            event: 'view_' + action.page,
            sessionId: uuidv4(),
            timestamp: new Date().toISOString(),
            data: {
              referrer: action.referrer || 'direct',
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            },
            page: '/' + action.page
          };
          
          const conversionResponse = await apiClient.post('/analytics/conversion', conversionData);
          
          if (conversionResponse.status === 201) {
            log(`Vue de page ${action.page} enregistrée`, 'success');
          } else {
            log(`Erreur lors de l'enregistrement de la vue de page ${action.page}`, 'error');
          }
          break;
          
        case 'start_trial':
          // Simuler le démarrage d'un essai
          const trialData = {
            userId: config.testUser.id,
            status: 'trial',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
          };
          
          try {
            const trialResponse = await apiClient.post('/subscription', trialData);
            log('Période d\'essai démarrée avec succès', 'success');
          } catch (error) {
            if (error.response && error.response.status === 404) {
              log('Utilisateur non trouvé, création d\'un nouvel abonnement', 'warning');
            } else {
              log('Erreur lors du démarrage de la période d\'essai', 'error');
            }
          }
          break;
          
        case 'select_plan':
          // Simuler la sélection d'un plan
          const plan = config.subscriptionPlans[action.planId];
          
          if (!plan) {
            log(`Plan ${action.planId} non trouvé`, 'error');
            break;
          }
          
          const behaviorData = {
            event: 'select_plan',
            sessionId: uuidv4(),
            timestamp: new Date().toISOString(),
            data: {
              planId: action.planId,
              planName: plan.name,
              planPrice: action.billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
              billingPeriod: action.billingPeriod
            },
            page: '/subscription'
          };
          
          const behaviorResponse = await apiClient.post('/analytics/behavior', behaviorData);
          
          if (behaviorResponse.status === 201) {
            log(`Sélection du plan ${plan.name} enregistrée`, 'success');
          } else {
            log(`Erreur lors de l'enregistrement de la sélection du plan ${plan.name}`, 'error');
          }
          break;
          
        case 'complete_payment':
          // Simuler un paiement
          const paymentData = {
            planId: action.planId,
            paymentMethod: {
              type: action.paymentMethod,
              email: config.testUser.email,
              isDefault: true,
              details: {
                payerId: 'PAYER-' + uuidv4().substring(0, 8),
                paymentId: 'PAYMENT-' + uuidv4().substring(0, 8),
                billingPeriod: action.billingPeriod,
                timestamp: new Date().toISOString()
              }
            }
          };
          
          try {
            const subscriptionResponse = await apiClient.post('/subscription', paymentData);
            
            if (subscriptionResponse.status === 201) {
              log(`Abonnement ${action.planId} créé avec succès`, 'success');
              
              // Vérifier le paiement PayPal
              if (action.paymentMethod === 'paypal') {
                const verifyData = {
                  orderId: 'ORDER-' + uuidv4().substring(0, 8),
                  payerId: paymentData.paymentMethod.details.payerId,
                  amount: config.subscriptionPlans[action.planId][action.billingPeriod + 'Price'],
                  currency: 'EUR',
                  planId: action.planId,
                  billingPeriod: action.billingPeriod
                };
                
                const verifyResponse = await apiClient.post('/verify-paypal', verifyData);
                
                if (verifyResponse.status === 200 && verifyResponse.data.verified) {
                  log('Paiement PayPal vérifié avec succès', 'success');
                } else {
                  log('Erreur lors de la vérification du paiement PayPal', 'error');
                }
              }
            } else {
              log(`Erreur lors de la création de l'abonnement ${action.planId}`, 'error');
            }
          } catch (error) {
            log(`Erreur lors de la création de l'abonnement: ${error.message}`, 'error');
          }
          break;
          
        case 'cancel_subscription':
          // Simuler l'annulation d'un abonnement
          try {
            // Utiliser l'ID utilisateur pour l'annulation
            const cancelResponse = await apiClient.post(`/subscription/${config.testUser.id}/cancel`);
            
            if (cancelResponse.status === 200) {
              log('Abonnement annulé avec succès', 'success');
            } else {
              log('Erreur lors de l\'annulation de l\'abonnement', 'error');
            }
          } catch (error) {
            log(`Erreur lors de l'annulation de l'abonnement: ${error.message}`, 'error');
          }
          break;
          
        default:
          log(`Type d'action non pris en charge: ${action.type}`, 'warning');
      }
    }
    
    // Étape 3: Vérifier les métriques
    log('3. Vérification des métriques', 'info');
    
    try {
      const metricsResponse = await apiClient.get('/analytics/conversion-metrics');
      
      if (metricsResponse.status === 200) {
        log('Métriques de conversion récupérées avec succès', 'success');
        log(`Taux de conversion: ${metricsResponse.data.conversionRate}%`, 'info');
        log(`Revenus: ${metricsResponse.data.revenue} EUR`, 'info');
      } else {
        log('Erreur lors de la récupération des métriques de conversion', 'error');
      }
    } catch (error) {
      log(`Erreur lors de la récupération des métriques: ${error.message}`, 'error');
    }
    
    return true;
  } catch (error) {
    log(`Erreur lors de la simulation: ${error.message}`, 'error');
    return false;
  }
}

// Scénarios de test
const scenarios = [
  {
    name: 'Parcours d\'abonnement complet',
    description: 'Utilisateur qui visite la page d\'abonnement, démarre un essai, sélectionne un plan et effectue un paiement',
    actions: [
      { type: 'view_page', name: 'Visite de la page d\'accueil', page: 'home', referrer: 'google.com' },
      { type: 'view_page', name: 'Visite de la page d\'abonnement', page: 'subscription', referrer: 'home' },
      { type: 'start_trial', name: 'Démarrage de la période d\'essai' },
      { type: 'select_plan', name: 'Sélection du plan Premium', planId: 'premium', billingPeriod: 'monthly' },
      { type: 'complete_payment', name: 'Paiement avec PayPal', planId: 'premium', paymentMethod: 'paypal', billingPeriod: 'monthly' }
    ]
  },
  {
    name: 'Annulation d\'abonnement',
    description: 'Utilisateur qui annule son abonnement',
    actions: [
      { type: 'view_page', name: 'Visite de la page de compte', page: 'account', referrer: 'home' },
      { type: 'cancel_subscription', name: 'Annulation de l\'abonnement' }
    ]
  },
  {
    name: 'Changement de plan',
    description: 'Utilisateur qui change de plan d\'abonnement',
    actions: [
      { type: 'view_page', name: 'Visite de la page d\'abonnement', page: 'subscription', referrer: 'account' },
      { type: 'select_plan', name: 'Sélection du plan Ultimate', planId: 'ultimate', billingPeriod: 'yearly' },
      { type: 'complete_payment', name: 'Paiement avec PayPal', planId: 'ultimate', paymentMethod: 'paypal', billingPeriod: 'yearly' }
    ]
  }
];

// Fonction principale pour exécuter les tests d'intégration
async function runIntegrationTests() {
  // Afficher le logo FloDrama avec les couleurs de l'identité visuelle
  console.log(`${COLORS.fg.blue}╔═══════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║                                                               ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║  ${COLORS.fg.magenta}███████╗██╗      ██████╗     ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗${COLORS.fg.blue}  ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║  ${COLORS.fg.magenta}██╔════╝██║     ██╔═══██╗    ██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗${COLORS.fg.blue} ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║  ${COLORS.fg.magenta}█████╗  ██║     ██║   ██║    ██║  ██║██████╔╝███████║██╔████╔██║███████║${COLORS.fg.blue} ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║  ${COLORS.fg.magenta}██╔══╝  ██║     ██║   ██║    ██║  ██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║${COLORS.fg.blue} ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║  ${COLORS.fg.magenta}██║     ███████╗╚██████╔╝    ██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║${COLORS.fg.blue} ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║  ${COLORS.fg.magenta}╚═╝     ╚══════╝ ╚═════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝${COLORS.fg.blue} ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}║                                                               ║${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);
  console.log(`${COLORS.fg.blue}             Tests d'Intégration Frontend-Backend               ${COLORS.reset}`);
  console.log('');
  
  logSection('TESTS D\'INTÉGRATION FRONTEND-BACKEND');
  log('Démarrage des tests d\'intégration...', 'info');
  
  let successCount = 0;
  let failureCount = 0;
  
  // Vérifier si le serveur est accessible
  try {
    const apiClient = createApiClient();
    const healthResponse = await apiClient.get('/health');
    
    if (healthResponse.status === 200 && healthResponse.data.status === 'ok') {
      log('Service de paiement accessible', 'success');
    } else {
      log('Service de paiement non accessible', 'error');
      return;
    }
  } catch (error) {
    log(`Erreur lors de la vérification du service: ${error.message}`, 'error');
    log('Assurez-vous que le serveur mock est démarré sur le port 54112', 'warning');
    return;
  }
  
  // Exécuter les scénarios
  for (const scenario of scenarios) {
    const success = await simulateFrontendInteraction(scenario);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  logSection('RÉSUMÉ DES TESTS');
  log(`Tests terminés: ${successCount + failureCount}`, 'info');
  log(`Réussis: ${successCount}`, 'success');
  log(`Échoués: ${failureCount}`, 'error');
  
  if (failureCount === 0) {
    log('Tous les tests d\'intégration ont réussi!', 'success');
  } else {
    log('Certains tests d\'intégration ont échoué. Vérifiez les détails ci-dessus.', 'warning');
  }
}

// Exécuter les tests d'intégration
runIntegrationTests()
  .then(() => {
    log('Script de test d\'intégration terminé', 'success');
  })
  .catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
  });
