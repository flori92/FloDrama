/**
 * Script de test de performance pour le service de paiement FloDrama
 * 
 * Ce script teste les performances du service de paiement sous charge
 * en simulant plusieurs utilisateurs simultanés et en mesurant les temps de réponse.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

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
  concurrentUsers: 50,
  requestsPerUser: 20,
  delayBetweenRequests: 100, // en ms
  endpoints: [
    { method: 'GET', path: '/health', weight: 10 },
    { method: 'GET', path: '/subscription', weight: 20 },
    { method: 'POST', path: '/subscription', weight: 5, data: () => ({
      planId: ['essential', 'premium', 'ultimate'][Math.floor(Math.random() * 3)],
      paymentMethod: {
        type: 'paypal',
        email: `test-${Math.floor(Math.random() * 1000)}@example.com`,
        isDefault: true,
        details: {
          payerId: `PAYER-${uuidv4().substring(0, 8)}`,
          paymentId: `PAYMENT-${uuidv4().substring(0, 8)}`,
          billingPeriod: Math.random() > 0.5 ? 'monthly' : 'yearly',
          timestamp: new Date().toISOString()
        }
      }
    })},
    { method: 'POST', path: '/verify-paypal', weight: 5, data: () => ({
      orderId: `ORDER-${uuidv4().substring(0, 8)}`,
      payerId: `PAYER-${uuidv4().substring(0, 8)}`,
      amount: [1.99, 2.99, 4.99][Math.floor(Math.random() * 3)],
      currency: 'EUR',
      planId: ['essential', 'premium', 'ultimate'][Math.floor(Math.random() * 3)],
      billingPeriod: Math.random() > 0.5 ? 'monthly' : 'yearly'
    })},
    { method: 'GET', path: '/payment-history', weight: 15 },
    { method: 'POST', path: '/analytics/conversion', weight: 20, data: () => ({
      event: ['view_page', 'click_subscribe', 'complete_payment'][Math.floor(Math.random() * 3)],
      sessionId: uuidv4(),
      timestamp: new Date().toISOString(),
      data: {
        referrer: ['google', 'facebook', 'direct', 'email'][Math.floor(Math.random() * 4)],
        page: ['home', 'subscription', 'payment'][Math.floor(Math.random() * 3)]
      }
    })},
    { method: 'GET', path: '/analytics/conversion-metrics', weight: 10 },
    { method: 'GET', path: '/analytics/behavior-metrics', weight: 15 }
  ]
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

// Fonction pour sélectionner un endpoint aléatoire en fonction de son poids
function selectRandomEndpoint() {
  const totalWeight = config.endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of config.endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return config.endpoints[0]; // Fallback
}

// Fonction pour créer un client API
function createApiClient() {
  return axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test-token-${uuidv4().substring(0, 8)}`
    }
  });
}

// Fonction pour exécuter un test de performance pour un utilisateur
async function runUserTest(userId) {
  const apiClient = createApiClient();
  const results = {
    userId,
    requests: [],
    totalTime: 0,
    successCount: 0,
    errorCount: 0
  };
  
  for (let i = 0; i < config.requestsPerUser; i++) {
    const endpoint = selectRandomEndpoint();
    const startTime = Date.now();
    
    try {
      let response;
      if (endpoint.method === 'GET') {
        response = await apiClient.get(endpoint.path);
      } else if (endpoint.method === 'POST') {
        const data = endpoint.data ? endpoint.data() : {};
        response = await apiClient.post(endpoint.path, data);
      }
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.requests.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        responseTime,
        status: response.status,
        success: true
      });
      
      results.totalTime += responseTime;
      results.successCount++;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.requests.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        responseTime,
        status: error.response ? error.response.status : 0,
        success: false,
        error: error.message
      });
      
      results.totalTime += responseTime;
      results.errorCount++;
    }
    
    // Attendre un peu entre les requêtes
    await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests));
  }
  
  results.averageResponseTime = results.totalTime / config.requestsPerUser;
  return results;
}

// Fonction pour agréger les résultats
function aggregateResults(allResults) {
  const totalRequests = allResults.reduce((sum, result) => sum + result.requests.length, 0);
  const totalSuccessCount = allResults.reduce((sum, result) => sum + result.successCount, 0);
  const totalErrorCount = allResults.reduce((sum, result) => sum + result.errorCount, 0);
  const totalTime = allResults.reduce((sum, result) => sum + result.totalTime, 0);
  
  // Calculer le temps de réponse moyen global
  const averageResponseTime = totalTime / totalRequests;
  
  // Calculer les temps de réponse par endpoint
  const endpointStats = {};
  
  allResults.forEach(result => {
    result.requests.forEach(request => {
      const key = `${request.method} ${request.endpoint}`;
      
      if (!endpointStats[key]) {
        endpointStats[key] = {
          count: 0,
          totalTime: 0,
          successCount: 0,
          errorCount: 0,
          minTime: Infinity,
          maxTime: 0
        };
      }
      
      endpointStats[key].count++;
      endpointStats[key].totalTime += request.responseTime;
      
      if (request.success) {
        endpointStats[key].successCount++;
      } else {
        endpointStats[key].errorCount++;
      }
      
      endpointStats[key].minTime = Math.min(endpointStats[key].minTime, request.responseTime);
      endpointStats[key].maxTime = Math.max(endpointStats[key].maxTime, request.responseTime);
    });
  });
  
  // Calculer les moyennes pour chaque endpoint
  Object.keys(endpointStats).forEach(key => {
    const stats = endpointStats[key];
    stats.averageTime = stats.totalTime / stats.count;
    stats.successRate = (stats.successCount / stats.count) * 100;
  });
  
  return {
    totalUsers: allResults.length,
    totalRequests,
    totalSuccessCount,
    totalErrorCount,
    successRate: (totalSuccessCount / totalRequests) * 100,
    averageResponseTime,
    endpointStats
  };
}

// Fonction pour afficher les résultats
function displayResults(aggregatedResults) {
  logSection('RÉSULTATS DU TEST DE PERFORMANCE');
  
  console.log(`${COLORS.fg.blue}📊 Statistiques Globales:${COLORS.reset}`);
  console.log(`${COLORS.bright}Utilisateurs simulés:${COLORS.reset} ${aggregatedResults.totalUsers}`);
  console.log(`${COLORS.bright}Requêtes totales:${COLORS.reset} ${aggregatedResults.totalRequests}`);
  console.log(`${COLORS.bright}Requêtes réussies:${COLORS.reset} ${aggregatedResults.totalSuccessCount} (${aggregatedResults.successRate.toFixed(2)}%)`);
  console.log(`${COLORS.bright}Requêtes échouées:${COLORS.reset} ${aggregatedResults.totalErrorCount}`);
  console.log(`${COLORS.bright}Temps de réponse moyen:${COLORS.reset} ${aggregatedResults.averageResponseTime.toFixed(2)} ms`);
  
  console.log(`\n${COLORS.fg.blue}📊 Statistiques par Endpoint:${COLORS.reset}`);
  
  // Trier les endpoints par temps de réponse moyen (du plus lent au plus rapide)
  const sortedEndpoints = Object.entries(aggregatedResults.endpointStats)
    .sort((a, b) => b[1].averageTime - a[1].averageTime);
  
  sortedEndpoints.forEach(([endpoint, stats]) => {
    const color = stats.successRate < 90 ? COLORS.fg.red : 
                 stats.successRate < 95 ? COLORS.fg.yellow : 
                 COLORS.fg.green;
    
    console.log(`${COLORS.bright}${endpoint}:${COLORS.reset}`);
    console.log(`  Requêtes: ${stats.count}`);
    console.log(`  Taux de succès: ${color}${stats.successRate.toFixed(2)}%${COLORS.reset}`);
    console.log(`  Temps moyen: ${stats.averageTime.toFixed(2)} ms`);
    console.log(`  Temps min/max: ${stats.minTime.toFixed(2)} ms / ${stats.maxTime.toFixed(2)} ms`);
  });
  
  // Afficher les recommandations basées sur les résultats
  console.log(`\n${COLORS.fg.blue}📝 Recommandations:${COLORS.reset}`);
  
  // Identifier les endpoints lents (> 200ms)
  const slowEndpoints = sortedEndpoints.filter(([_, stats]) => stats.averageTime > 200);
  if (slowEndpoints.length > 0) {
    console.log(`${COLORS.fg.yellow}⚠ Endpoints lents à optimiser:${COLORS.reset}`);
    slowEndpoints.forEach(([endpoint, stats]) => {
      console.log(`  - ${endpoint}: ${stats.averageTime.toFixed(2)} ms`);
    });
  } else {
    console.log(`${COLORS.fg.green}✓ Tous les endpoints répondent rapidement (< 200ms)${COLORS.reset}`);
  }
  
  // Identifier les endpoints avec un faible taux de succès (< 95%)
  const unreliableEndpoints = sortedEndpoints.filter(([_, stats]) => stats.successRate < 95);
  if (unreliableEndpoints.length > 0) {
    console.log(`${COLORS.fg.yellow}⚠ Endpoints peu fiables à améliorer:${COLORS.reset}`);
    unreliableEndpoints.forEach(([endpoint, stats]) => {
      console.log(`  - ${endpoint}: ${stats.successRate.toFixed(2)}% de succès`);
    });
  } else {
    console.log(`${COLORS.fg.green}✓ Tous les endpoints sont fiables (> 95% de succès)${COLORS.reset}`);
  }
  
  // Évaluation globale
  const averageResponseTimeRating = 
    aggregatedResults.averageResponseTime < 100 ? 'Excellent' :
    aggregatedResults.averageResponseTime < 200 ? 'Bon' :
    aggregatedResults.averageResponseTime < 500 ? 'Acceptable' :
    'Médiocre';
  
  const successRateRating = 
    aggregatedResults.successRate > 99 ? 'Excellent' :
    aggregatedResults.successRate > 95 ? 'Bon' :
    aggregatedResults.successRate > 90 ? 'Acceptable' :
    'Médiocre';
  
  console.log(`\n${COLORS.fg.blue}📋 Évaluation Globale:${COLORS.reset}`);
  console.log(`${COLORS.bright}Performance:${COLORS.reset} ${
    averageResponseTimeRating === 'Excellent' ? COLORS.fg.green :
    averageResponseTimeRating === 'Bon' ? COLORS.fg.green :
    averageResponseTimeRating === 'Acceptable' ? COLORS.fg.yellow :
    COLORS.fg.red
  }${averageResponseTimeRating}${COLORS.reset}`);
  
  console.log(`${COLORS.bright}Fiabilité:${COLORS.reset} ${
    successRateRating === 'Excellent' ? COLORS.fg.green :
    successRateRating === 'Bon' ? COLORS.fg.green :
    successRateRating === 'Acceptable' ? COLORS.fg.yellow :
    COLORS.fg.red
  }${successRateRating}${COLORS.reset}`);
  
  // Verdict final
  if (averageResponseTimeRating === 'Excellent' && successRateRating === 'Excellent') {
    console.log(`\n${COLORS.fg.green}${COLORS.bright}✅ VERDICT: Le service est prêt pour la production!${COLORS.reset}`);
  } else if (
    (averageResponseTimeRating === 'Excellent' || averageResponseTimeRating === 'Bon') && 
    (successRateRating === 'Excellent' || successRateRating === 'Bon')
  ) {
    console.log(`\n${COLORS.fg.green}${COLORS.bright}✅ VERDICT: Le service est prêt pour la production avec quelques optimisations mineures.${COLORS.reset}`);
  } else if (
    averageResponseTimeRating === 'Médiocre' || 
    successRateRating === 'Médiocre'
  ) {
    console.log(`\n${COLORS.fg.red}${COLORS.bright}❌ VERDICT: Le service n'est PAS prêt pour la production. Des améliorations significatives sont nécessaires.${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.fg.yellow}${COLORS.bright}⚠ VERDICT: Le service nécessite des optimisations avant d'être mis en production.${COLORS.reset}`);
  }
}

// Fonction principale pour exécuter le test de performance
async function runPerformanceTest() {
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
  console.log(`${COLORS.fg.blue}                 Test de Performance                             ${COLORS.reset}`);
  console.log('');
  
  logSection('TEST DE PERFORMANCE DU SERVICE DE PAIEMENT');
  log(`Démarrage du test avec ${config.concurrentUsers} utilisateurs simultanés...`, 'info');
  
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
  
  // Si nous sommes dans le processus principal
  if (cluster.isPrimary) {
    log(`Processus principal ${process.pid} démarré`, 'info');
    
    // Déterminer le nombre de workers à utiliser (max: nombre de CPUs, min: 1)
    const numWorkers = Math.min(numCPUs, config.concurrentUsers);
    const usersPerWorker = Math.ceil(config.concurrentUsers / numWorkers);
    
    log(`Utilisation de ${numWorkers} workers pour simuler ${config.concurrentUsers} utilisateurs`, 'info');
    
    // Stocker les résultats de chaque worker
    const results = [];
    
    // Créer les workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork();
      
      // Calculer le nombre d'utilisateurs pour ce worker
      const startUser = i * usersPerWorker;
      const endUser = Math.min(startUser + usersPerWorker, config.concurrentUsers);
      const numUsers = endUser - startUser;
      
      // Envoyer les paramètres au worker
      worker.send({ startUser, numUsers });
      
      // Recevoir les résultats du worker
      worker.on('message', (message) => {
        if (message.type === 'results') {
          results.push(...message.data);
          log(`Résultats reçus du worker ${worker.id} (${message.data.length} utilisateurs)`, 'success');
          
          // Si tous les workers ont terminé, agréger et afficher les résultats
          if (results.length === config.concurrentUsers) {
            const aggregatedResults = aggregateResults(results);
            displayResults(aggregatedResults);
            
            // Terminer tous les workers
            Object.values(cluster.workers).forEach(worker => worker.kill());
          }
        }
      });
    }
    
    // Gérer la terminaison des workers
    cluster.on('exit', (worker, code, signal) => {
      log(`Worker ${worker.process.pid} terminé (code: ${code}, signal: ${signal})`, 'info');
    });
  } else {
    // Code exécuté par les workers
    log(`Worker ${process.pid} démarré`, 'info');
    
    // Recevoir les paramètres du processus principal
    process.on('message', async (message) => {
      const { startUser, numUsers } = message;
      
      log(`Worker ${process.pid} simule les utilisateurs ${startUser} à ${startUser + numUsers - 1}`, 'info');
      
      // Exécuter les tests pour chaque utilisateur
      const userResults = [];
      
      for (let i = 0; i < numUsers; i++) {
        const userId = startUser + i;
        const result = await runUserTest(userId);
        userResults.push(result);
        log(`Test terminé pour l'utilisateur ${userId}`, 'success');
      }
      
      // Envoyer les résultats au processus principal
      process.send({ type: 'results', data: userResults });
    });
  }
}

// Exécuter le test de performance
runPerformanceTest()
  .then(() => {
    if (!cluster.isPrimary) {
      log('Script de test de performance terminé', 'success');
    }
  })
  .catch(error => {
    log(`Erreur fatale: ${error.message}`, 'error');
    process.exit(1);
  });
