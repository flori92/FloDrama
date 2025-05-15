/**
 * Script de monitoring pour le scraping FloDrama
 * Ce script analyse les résultats du scraping et génère des métriques et des alertes
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const MIN_ELEMENTS_PER_SOURCE = 100;
const MAX_MOCK_RATIO = 0.3; // 30% maximum de données mockées

// Récupération des arguments
const args = process.argv.slice(2);
const inputArg = args.find(arg => arg.startsWith('--input='));
const inputPath = inputArg ? inputArg.split('=')[1] : '../scraping-results';
const silentArg = args.find(arg => arg === '--silent');
const isSilent = silentArg !== undefined;

// Vérification du dossier d'entrée
if (!fs.existsSync(inputPath)) {
  console.error(`Erreur: Le dossier ${inputPath} n'existe pas`);
  process.exit(1);
}

// Fonction pour envoyer une requête HTTP
async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Fonction pour envoyer une alerte via Discord
async function sendDiscordAlert(message, level = 'info') {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('Variable d\'environnement DISCORD_WEBHOOK_URL non définie, impossible d\'envoyer l\'alerte Discord');
    return false;
  }
  
  try {
    // Déterminer la couleur en fonction du niveau d'alerte
    let color;
    switch (level) {
      case 'error':
        color = 0xFF0000; // Rouge
        break;
      case 'warning':
        color = 0xFFAA00; // Orange
        break;
      case 'success':
        color = 0x00FF00; // Vert
        break;
      default:
        color = 0x0099FF; // Bleu
    }
    
    // Construire le payload
    const payload = {
      embeds: [{
        title: `FloDrama Scraping ${level.charAt(0).toUpperCase() + level.slice(1)}`,
        description: message,
        color,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'FloDrama Scraping Monitor'
        }
      }]
    };
    
    // Envoyer la requête
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };
    
    await fetchUrl(DISCORD_WEBHOOK_URL, options);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'alerte Discord: ${error.message}`);
    return false;
  }
}

// Fonction pour envoyer une alerte via Slack
async function sendSlackAlert(message, level = 'info') {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Variable d\'environnement SLACK_WEBHOOK_URL non définie, impossible d\'envoyer l\'alerte Slack');
    return false;
  }
  
  try {
    // Déterminer l'emoji en fonction du niveau d'alerte
    let emoji;
    switch (level) {
      case 'error':
        emoji = ':red_circle:';
        break;
      case 'warning':
        emoji = ':warning:';
        break;
      case 'success':
        emoji = ':white_check_mark:';
        break;
      default:
        emoji = ':information_source:';
    }
    
    // Construire le payload
    const payload = {
      text: `${emoji} *FloDrama Scraping ${level.charAt(0).toUpperCase() + level.slice(1)}*\n${message}`
    };
    
    // Envoyer la requête
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };
    
    await fetchUrl(SLACK_WEBHOOK_URL, options);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'alerte Slack: ${error.message}`);
    return false;
  }
}

// Fonction pour envoyer une alerte
async function sendAlert(message, level = 'info') {
  if (isSilent) {
    return;
  }
  
  console.log(`[${level.toUpperCase()}] ${message}`);
  
  // Envoyer l'alerte via Discord et Slack
  const discordResult = await sendDiscordAlert(message, level);
  const slackResult = await sendSlackAlert(message, level);
  
  return discordResult || slackResult;
}

// Fonction pour analyser les résultats du scraping
async function analyzeScrapingResults() {
  console.log(`Analyse des résultats du scraping dans ${inputPath}`);
  
  // Récupérer le fichier de résumé du scraping
  const summaryFiles = fs.readdirSync(inputPath)
    .filter(file => file.startsWith('scraping_summary_'))
    .map(file => path.join(inputPath, file))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
  
  if (summaryFiles.length === 0) {
    console.error('Aucun fichier de résumé du scraping trouvé');
    await sendAlert('Aucun fichier de résumé du scraping trouvé', 'error');
    return false;
  }
  
  const summaryFile = summaryFiles[0];
  console.log(`Analyse du fichier de résumé: ${summaryFile}`);
  
  // Lire le fichier de résumé
  const summaryContent = fs.readFileSync(summaryFile, 'utf8');
  const summary = JSON.parse(summaryContent);
  
  // Récupérer les fichiers de résultats
  const resultFiles = fs.readdirSync(inputPath)
    .filter(file => file.endsWith('.json') && !file.includes('summary'))
    .map(file => path.join(inputPath, file));
  
  console.log(`${resultFiles.length} fichiers de résultats trouvés`);
  
  // Analyser chaque fichier de résultats
  const results = [];
  let totalElements = 0;
  let totalMockElements = 0;
  
  for (const file of resultFiles) {
    const fileContent = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(fileContent);
    
    const sourceName = data.source || path.basename(file).split('_')[0];
    const count = data.count || (data.data && data.data.length) || 0;
    const isMock = data.is_mock || false;
    
    totalElements += count;
    if (isMock) {
      totalMockElements += count;
    }
    
    results.push({
      source: sourceName,
      count,
      is_mock: isMock,
      file
    });
    
    // Vérifier si le nombre d'éléments est suffisant
    if (count < MIN_ELEMENTS_PER_SOURCE) {
      await sendAlert(`La source ${sourceName} n'a que ${count} éléments (minimum requis: ${MIN_ELEMENTS_PER_SOURCE})`, 'warning');
    }
  }
  
  // Calculer le ratio de données mockées
  const mockRatio = totalElements > 0 ? totalMockElements / totalElements : 0;
  console.log(`Ratio de données mockées: ${(mockRatio * 100).toFixed(2)}%`);
  
  // Vérifier si le ratio de données mockées est acceptable
  if (mockRatio > MAX_MOCK_RATIO) {
    await sendAlert(`Le ratio de données mockées est trop élevé: ${(mockRatio * 100).toFixed(2)}% (maximum autorisé: ${(MAX_MOCK_RATIO * 100).toFixed(2)}%)`, 'warning');
  }
  
  // Vérifier si toutes les sources ont été scrapées
  const sourceErrors = summary.errors || [];
  if (sourceErrors.length > 0) {
    const errorMessage = `${sourceErrors.length} sources ont échoué: ${sourceErrors.map(e => e.source).join(', ')}`;
    await sendAlert(errorMessage, 'error');
  }
  
  // Générer un rapport
  const report = {
    timestamp: new Date().toISOString(),
    total_sources: results.length,
    total_elements: totalElements,
    mock_elements: totalMockElements,
    mock_ratio: mockRatio,
    sources_below_minimum: results.filter(r => r.count < MIN_ELEMENTS_PER_SOURCE).length,
    errors: sourceErrors.length,
    results
  };
  
  // Déterminer le niveau global
  let globalLevel = 'success';
  if (sourceErrors.length > 0 || mockRatio > MAX_MOCK_RATIO) {
    globalLevel = 'warning';
  }
  if (sourceErrors.length > results.length / 2) {
    globalLevel = 'error';
  }
  
  // Envoyer une alerte globale
  const globalMessage = `Rapport de scraping:
- Sources: ${results.length}
- Éléments: ${totalElements}
- Données mockées: ${totalMockElements} (${(mockRatio * 100).toFixed(2)}%)
- Sources avec trop peu d'éléments: ${results.filter(r => r.count < MIN_ELEMENTS_PER_SOURCE).length}
- Erreurs: ${sourceErrors.length}`;
  
  await sendAlert(globalMessage, globalLevel);
  
  // Enregistrer le rapport
  const reportFile = path.join(inputPath, `monitoring_report_${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`Rapport enregistré dans ${reportFile}`);
  
  return report;
}

// Fonction principale
async function main() {
  console.log(`Démarrage du monitoring à ${new Date().toISOString()}`);
  
  try {
    const report = await analyzeScrapingResults();
    console.log('Monitoring terminé avec succès');
    return report;
  } catch (error) {
    console.error(`Erreur lors du monitoring: ${error.message}`);
    await sendAlert(`Erreur lors du monitoring: ${error.message}`, 'error');
    return false;
  }
}

// Exécution du script
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
