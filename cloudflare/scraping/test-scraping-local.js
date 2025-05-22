/**
 * Script de test de scraping local pour FloDrama
 * 
 * Ce script permet de tester le scraping en local et de comparer les performances
 * entre le scraping local et le service relais Render.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

// Configuration
const RENDER_SERVICE_URL = process.env.RENDER_SERVICE_URL || 'https://flodrama-scraper.onrender.com';
const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_DJfpQC9gEu4KgTRvX8iQzMXxrteP';
const SCRAPER_SCRIPT_PATH = path.join(__dirname, '../../.github/scripts/stealth/scraper-optimise.js');
const OUTPUT_DIR = path.join(__dirname, 'test-results');
const LOG_FILE = path.join(OUTPUT_DIR, 'test-log.txt');

// Sources à tester (sous-ensemble des sources complètes pour le test)
const TEST_SOURCES = [
  'tmdb-films',  // Source TMDB qui devrait toujours fonctionner
  'allocine-films',
  'allocine-series',
  'senscritique-films'
];

// Fonction pour logger dans le fichier et la console
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // S'assurer que le dossier de logs existe
  fs.ensureDirSync(path.dirname(LOG_FILE));
  
  // Ajouter au fichier de log
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Fonction pour exécuter le scraping local
async function runLocalScraping(source) {
  log(`🔍 Démarrage du scraping local pour la source: ${source}`);
  
  try {
    // Créer un dossier temporaire pour les résultats
    const tempOutputDir = path.join(OUTPUT_DIR, 'local', source);
    fs.ensureDirSync(tempOutputDir);
    
    // Définir les variables d'environnement pour le test
    process.env.USE_RELAY_SERVICE = 'false';
    process.env.DEBUG_MODE = 'true';
    process.env.OUTPUT_DIR = tempOutputDir;
    
    // Exécuter le script de scraping
    const startTime = Date.now();
    const output = execSync(`node ${SCRAPER_SCRIPT_PATH} --sources=${source}`, { 
      encoding: 'utf8',
      env: process.env
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Vérifier les résultats
    const resultFiles = fs.readdirSync(tempOutputDir).filter(file => file.endsWith('.json'));
    const itemCount = resultFiles.length > 0 
      ? fs.readJsonSync(path.join(tempOutputDir, resultFiles[0])).length 
      : 0;
    
    log(`✅ Scraping local terminé en ${duration.toFixed(2)}s - ${itemCount} éléments récupérés`);
    
    return {
      success: itemCount > 0,
      duration,
      itemCount,
      output
    };
  } catch (error) {
    log(`❌ Erreur lors du scraping local: ${error.message}`);
    return {
      success: false,
      duration: 0,
      itemCount: 0,
      error: error.message,
      output: error.stdout || ''
    };
  }
}

// Fonction pour exécuter le scraping via le service relais Render
async function runRelayServiceScraping(source) {
  log(`🔄 Démarrage du scraping via le service relais pour la source: ${source}`);
  
  try {
    // Configuration par défaut si on ne trouve pas la source
    let sourceConfig = {
      urls: ['https://www.themoviedb.org/movie/popular'],
      selector: '.card',
      waitForSelector: '.page_wrapper',
      type: 'film'
    };
    
    // Essayer de récupérer la configuration de la source depuis le script de scraping
    try {
      const scraperScript = fs.readFileSync(SCRAPER_SCRIPT_PATH, 'utf8');
      
      // Chercher la définition complète de la source
      const sourceBlockRegex = new RegExp(`{\\s*name:\\s*['"']${source}['"'][^}]*}`, 'gs');
      const sourceBlock = scraperScript.match(sourceBlockRegex);
      
      if (sourceBlock && sourceBlock.length > 0) {
        // Extraire les URLs
        const urlsMatch = sourceBlock[0].match(/urls:\s*\[([^\]]+)\]/s);
        if (urlsMatch && urlsMatch[1]) {
          sourceConfig.urls = urlsMatch[1]
            .split(',')
            .map(url => url.trim().replace(/['"`]/g, ''))
            .filter(url => url.length > 0);
        }
        
        // Extraire le sélecteur principal
        const selectorMatch = sourceBlock[0].match(/selector:\s*['"](.*?)['"]/);
        if (selectorMatch && selectorMatch[1]) {
          sourceConfig.selector = selectorMatch[1];
        }
        
        // Extraire le sélecteur d'attente
        const waitForSelectorMatch = sourceBlock[0].match(/waitForSelector:\s*['"](.*?)['"]/);
        if (waitForSelectorMatch && waitForSelectorMatch[1]) {
          sourceConfig.waitForSelector = waitForSelectorMatch[1];
        }
        
        // Extraire le type
        const typeMatch = sourceBlock[0].match(/type:\s*['"](.*?)['"]/);
        if (typeMatch && typeMatch[1]) {
          sourceConfig.type = typeMatch[1];
        }
      } else if (source === 'tmdb-films') {
        // Configuration spéciale pour TMDB
        sourceConfig = {
          urls: ['https://api.themoviedb.org/3/movie/popular'],
          selector: '.movie-card',
          waitForSelector: '.movie-list',
          type: 'film'
        };
      } else {
        log(`⚠️ Configuration de la source ${source} non trouvée, utilisation des valeurs par défaut`);
      }
    } catch (error) {
      log(`⚠️ Erreur lors de l'extraction de la configuration: ${error.message}`);
    }
    
    // Utiliser la configuration extraite ou par défaut
    
    // Préparer la requête pour le service relais
    const payload = {
      source,
      type: sourceConfig.type,
      urls: sourceConfig.urls,
      selectors: {
        main: sourceConfig.selector,
        wait: sourceConfig.waitForSelector
      },
      minItems: 5
    };
    
    log(`📡 Configuration utilisée pour ${source}:`);
    log(`   URLs: ${payload.urls.join(', ')}`);
    log(`   Sélecteur principal: ${payload.selectors.main}`);
    log(`   Sélecteur d'attente: ${payload.selectors.wait}`);
    log(`   Type: ${payload.type}`);
    
    // Envoyer la requête au service relais
    const startTime = Date.now();
    const response = await axios.post(`${RENDER_SERVICE_URL}/scrape`, payload, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Vérifier les résultats
    const items = response.data && response.data.items ? response.data.items : [];
    log(`✅ Scraping via service relais terminé en ${duration.toFixed(2)}s - ${items.length} éléments récupérés`);
    
    // Sauvegarder les résultats
    const tempOutputDir = path.join(OUTPUT_DIR, 'relay', source);
    fs.ensureDirSync(tempOutputDir);
    fs.writeJsonSync(path.join(tempOutputDir, `${source}.json`), items, { spaces: 2 });
    
    return {
      success: items.length > 0,
      duration,
      itemCount: items.length,
      output: JSON.stringify(response.data, null, 2)
    };
  } catch (error) {
    log(`❌ Erreur lors du scraping via service relais: ${error.message}`);
    return {
      success: false,
      duration: 0,
      itemCount: 0,
      error: error.message,
      output: error.response ? JSON.stringify(error.response.data, null, 2) : ''
    };
  }
}

// Fonction principale
async function runScrapingTests() {
  log('🧪 Démarrage des tests de scraping');
  log('================================================================================');
  
  // Créer les dossiers de sortie
  fs.ensureDirSync(OUTPUT_DIR);
  fs.ensureDirSync(path.join(OUTPUT_DIR, 'local'));
  fs.ensureDirSync(path.join(OUTPUT_DIR, 'relay'));
  
  // Tableau pour stocker les résultats
  const results = [];
  
  // Tester chaque source
  for (const source of TEST_SOURCES) {
    log(`\n🔍 Test de la source: ${source}`);
    log('--------------------------------------------------------------------------------');
    
    // Test local
    const localResult = await runLocalScraping(source);
    
    // Test service relais
    const relayResult = await runRelayServiceScraping(source);
    
    // Comparer les résultats
    const comparison = {
      source,
      local: {
        success: localResult.success,
        duration: localResult.duration,
        itemCount: localResult.itemCount
      },
      relay: {
        success: relayResult.success,
        duration: relayResult.duration,
        itemCount: relayResult.itemCount
      },
      comparison: {
        fasterMethod: localResult.duration < relayResult.duration ? 'local' : 'relay',
        speedDifference: Math.abs(localResult.duration - relayResult.duration).toFixed(2),
        moreItems: localResult.itemCount > relayResult.itemCount ? 'local' : 'relay',
        itemDifference: Math.abs(localResult.itemCount - relayResult.itemCount)
      }
    };
    
    results.push(comparison);
    
    log(`📊 Comparaison pour ${source}:`);
    log(`   Local: ${localResult.success ? '✅' : '❌'} - ${localResult.duration.toFixed(2)}s - ${localResult.itemCount} éléments`);
    log(`   Relay: ${relayResult.success ? '✅' : '❌'} - ${relayResult.duration.toFixed(2)}s - ${relayResult.itemCount} éléments`);
    log(`   Le plus rapide: ${comparison.comparison.fasterMethod} (différence: ${comparison.comparison.speedDifference}s)`);
    log(`   Le plus d'éléments: ${comparison.comparison.moreItems} (différence: ${comparison.comparison.itemDifference} éléments)`);
    
    log('--------------------------------------------------------------------------------');
  }
  
  // Générer un rapport de synthèse
  const successfulLocal = results.filter(r => r.local.success).length;
  const successfulRelay = results.filter(r => r.relay.success).length;
  const fasterLocal = results.filter(r => r.comparison.fasterMethod === 'local').length;
  const moreItemsLocal = results.filter(r => r.comparison.moreItems === 'local').length;
  
  log('\n📋 Rapport de synthèse:');
  log('================================================================================');
  log(`Sources testées: ${TEST_SOURCES.length}`);
  log(`Succès en local: ${successfulLocal}/${TEST_SOURCES.length} (${(successfulLocal/TEST_SOURCES.length*100).toFixed(0)}%)`);
  log(`Succès via relais: ${successfulRelay}/${TEST_SOURCES.length} (${(successfulRelay/TEST_SOURCES.length*100).toFixed(0)}%)`);
  log(`Plus rapide en local: ${fasterLocal}/${TEST_SOURCES.length} (${(fasterLocal/TEST_SOURCES.length*100).toFixed(0)}%)`);
  log(`Plus d'éléments en local: ${moreItemsLocal}/${TEST_SOURCES.length} (${(moreItemsLocal/TEST_SOURCES.length*100).toFixed(0)}%)`);
  
  // Sauvegarder les résultats complets
  fs.writeJsonSync(path.join(OUTPUT_DIR, 'test-results.json'), results, { spaces: 2 });
  log(`\n✅ Résultats sauvegardés dans ${path.join(OUTPUT_DIR, 'test-results.json')}`);
  
  log('\n================================================================================');
  log('✅ Tests de scraping terminés');
  log('================================================================================');
  
  return results;
}

// Exécution de la fonction principale
runScrapingTests().catch(error => {
  log(`❌ Erreur fatale: ${error.message}`);
  process.exit(1);
});
