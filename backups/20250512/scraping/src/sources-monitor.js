/**
 * Système de monitoring des sources de streaming
 * Vérifie régulièrement la disponibilité des sources et envoie des alertes en cas de problème
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sourcesConfig = require('./sources-config');
const CloudflareBypasser = require('./cloudflare-bypasser');

// Configuration
const CONFIG = {
  checkIntervalMinutes: 30,
  logDirectory: path.join(__dirname, '../source-health'),
  alertThreshold: 3, // Nombre d'échecs consécutifs avant d'envoyer une alerte
  timeoutSeconds: 30
};

// Ensure log directory exists
if (!fs.existsSync(CONFIG.logDirectory)) {
  fs.mkdirSync(CONFIG.logDirectory, { recursive: true });
}

/**
 * Teste la disponibilité d'une source
 * @param {string} sourceName - Nom de la source
 * @param {object} config - Configuration de la source
 * @returns {Promise<object>} - Résultat du test
 */
async function testSourceAvailability(sourceName, config) {
  console.log(`🔍 Test de disponibilité pour la source: ${sourceName}`);
  
  const startTime = Date.now();
  const result = {
    source: sourceName,
    timestamp: new Date().toISOString(),
    status: 'down',
    responseTime: 0,
    error: null
  };
  
  try {
    if (!config || !config.testUrl) {
      throw new Error('Configuration ou URL de test manquante');
    }
    
    let response;
    
    // Utiliser le contournement Cloudflare si nécessaire
    if (config.requireCloudflareBypass) {
      const bypasser = new CloudflareBypasser();
      const content = await bypasser.request(config.testUrl);
      response = { status: 200, data: content };
    } else {
      // Utiliser axios avec timeout
      response = await axios.get(config.testUrl, {
        headers: config.headers || {},
        timeout: CONFIG.timeoutSeconds * 1000
      });
    }
    
    // Vérifier la réponse
    if (response.status === 200 && response.data) {
      result.status = 'up';
      
      // Vérifier la présence des sélecteurs clés dans la réponse
      if (config.selectors) {
        let contentValid = true;
        const selectors = Object.values(config.selectors);
        
        if (typeof response.data === 'string') {
          for (const selector of selectors) {
            if (!response.data.includes(selector.replace('.', ''))) {
              contentValid = false;
              break;
            }
          }
        }
        
        if (!contentValid) {
          result.status = 'degraded';
          result.error = 'La page ne contient pas tous les sélecteurs attendus';
        }
      }
    }
  } catch (error) {
    result.error = `${error.message || 'Erreur inconnue'}`;
    
    // Détails supplémentaires en cas d'erreur axios
    if (error.response) {
      result.errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText
      };
    } else if (error.request) {
      result.errorDetails = {
        message: 'Pas de réponse reçue'
      };
    }
  } finally {
    result.responseTime = Date.now() - startTime;
  }
  
  return result;
}

/**
 * Sauvegarde les résultats de test dans un fichier
 * @param {object} result - Résultat du test
 */
function saveTestResult(result) {
  const filename = path.join(
    CONFIG.logDirectory,
    `${result.source}-${new Date().toISOString().split('T')[0]}.json`
  );
  
  let existingData = [];
  
  // Lire le fichier existant s'il existe
  if (fs.existsSync(filename)) {
    try {
      const fileContent = fs.readFileSync(filename, 'utf8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Erreur lors de la lecture du fichier ${filename}:`, error);
    }
  }
  
  // Ajouter le nouveau résultat
  existingData.push(result);
  
  // Sauvegarder dans le fichier
  try {
    fs.writeFileSync(filename, JSON.stringify(existingData, null, 2), 'utf8');
    console.log(`✅ Résultat sauvegardé pour ${result.source}`);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde dans ${filename}:`, error);
  }
}

/**
 * Vérifie si une alerte doit être envoyée
 * @param {string} sourceName - Nom de la source
 * @returns {boolean} - True si une alerte doit être envoyée
 */
function shouldSendAlert(sourceName) {
  const today = new Date().toISOString().split('T')[0];
  const filename = path.join(CONFIG.logDirectory, `${sourceName}-${today}.json`);
  
  if (!fs.existsSync(filename)) return false;
  
  try {
    const fileContent = fs.readFileSync(filename, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Vérifier les N derniers résultats
    const recentResults = data.slice(-CONFIG.alertThreshold);
    
    if (recentResults.length < CONFIG.alertThreshold) return false;
    
    // Vérifier si tous les résultats récents sont "down"
    return recentResults.every(r => r.status === 'down');
  } catch (error) {
    console.error(`Erreur lors de la vérification des alertes pour ${sourceName}:`, error);
    return false;
  }
}

/**
 * Envoie une alerte pour une source en panne
 * @param {string} sourceName - Nom de la source
 * @param {object} lastResult - Dernier résultat de test
 */
function sendAlert(sourceName, lastResult) {
  const alertId = uuidv4();
  const alertMessage = {
    id: alertId,
    timestamp: new Date().toISOString(),
    level: 'critical',
    source: sourceName,
    message: `La source ${sourceName} est indisponible depuis ${CONFIG.alertThreshold} vérifications consécutives`,
    lastError: lastResult.error,
    responseTime: lastResult.responseTime
  };
  
  console.error('⚠️ ALERTE:', alertMessage);
  
  // Dans un système réel, on enverrait cette alerte via email, SMS, webhook, etc.
  const alertsFile = path.join(CONFIG.logDirectory, 'alerts.json');
  let existingAlerts = [];
  
  if (fs.existsSync(alertsFile)) {
    try {
      const fileContent = fs.readFileSync(alertsFile, 'utf8');
      existingAlerts = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Erreur lors de la lecture des alertes:`, error);
    }
  }
  
  existingAlerts.push(alertMessage);
  
  try {
    fs.writeFileSync(alertsFile, JSON.stringify(existingAlerts, null, 2), 'utf8');
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de l'alerte:`, error);
  }
}

/**
 * Vérifie toutes les sources
 */
async function checkAllSources() {
  console.log(`🚀 Démarrage de la vérification des sources: ${new Date().toISOString()}`);
  
  // Résultats généraux
  const results = {
    timestamp: new Date().toISOString(),
    sourcesUp: 0,
    sourcesDown: 0,
    sourcesDegraded: 0,
    details: {}
  };
  
  // Tester chaque source
  for (const [sourceName, config] of Object.entries(sourcesConfig)) {
    try {
      const result = await testSourceAvailability(sourceName, config);
      
      // Enregistrer le résultat
      saveTestResult(result);
      
      // Mettre à jour les statistiques
      if (result.status === 'up') {
        results.sourcesUp++;
      } else if (result.status === 'degraded') {
        results.sourcesDegraded++;
      } else {
        results.sourcesDown++;
        
        // Vérifier si une alerte doit être envoyée
        if (shouldSendAlert(sourceName)) {
          sendAlert(sourceName, result);
        }
      }
      
      // Ajouter aux détails
      results.details[sourceName] = {
        status: result.status,
        responseTime: result.responseTime,
        error: result.error
      };
    } catch (error) {
      console.error(`Erreur lors du test de ${sourceName}:`, error);
      results.sourcesDown++;
      results.details[sourceName] = {
        status: 'error',
        error: error.message
      };
    }
  }
  
  // Afficher un résumé
  console.log(`📊 Résumé de la vérification:`);
  console.log(`  Sources opérationnelles: ${results.sourcesUp}`);
  console.log(`  Sources dégradées: ${results.sourcesDegraded}`);
  console.log(`  Sources inactives: ${results.sourcesDown}`);
  
  // Sauvegarder le résumé
  const summaryFile = path.join(CONFIG.logDirectory, 'summary.json');
  try {
    fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2), 'utf8');
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du résumé:`, error);
  }
  
  return results;
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`🔍 Démarrage du système de monitoring des sources`);
  
  // Exécuter immédiatement
  await checkAllSources();
  
  // Puis programmer des vérifications régulières
  setInterval(async () => {
    await checkAllSources();
  }, CONFIG.checkIntervalMinutes * 60 * 1000);
}

// Exporter les fonctions pour utilisation externe
module.exports = {
  testSourceAvailability,
  checkAllSources,
  main
};

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur du système de monitoring:', error);
    process.exit(1);
  });
}
