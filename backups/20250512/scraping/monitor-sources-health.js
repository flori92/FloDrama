/**
 * Moniteur de santé des sources de scraping FloDrama
 * 
 * Ce script analyse régulièrement l'état des sources de scraping et génère un rapport
 * pour identifier les sources qui ne fonctionnent plus ou qui renvoient peu d'éléments.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Ajouter le plugin stealth à puppeteer
puppeteer.use(StealthPlugin());

// Configuration
const OUTPUT_DIR = path.join(__dirname, 'source-health');
const RELAY_OUTPUT_DIR = path.join(__dirname, 'relay-output');
const ANALYSIS_DIR = path.join(__dirname, 'source-analysis');
const MIN_ITEMS_THRESHOLD = 200; // Seuil minimal d'éléments attendus par source
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Créer le dossier de sortie s'il n'existe pas
fs.ensureDirSync(OUTPUT_DIR);

// Importer la configuration des sources depuis le serveur relay
const { SOURCE_CONFIG } = require('./serveur-relay-local-v2');

/**
 * Vérifie la santé d'une source en analysant sa page web
 * @param {string} sourceName - Nom de la source
 * @param {object} config - Configuration de la source
 * @returns {Promise<object>} - Rapport de santé
 */
async function checkSourceHealth(sourceName, config) {
  console.log(`🔍 Vérification de la santé de ${sourceName}...`);
  
  const report = {
    source: sourceName,
    type: config.type,
    priority: config.priority,
    timestamp: new Date().toISOString(),
    status: 'unknown',
    itemCount: 0,
    responseTime: 0,
    errors: [],
    warnings: []
  };
  
  try {
    // Lancer le navigateur
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    
    // Mesurer le temps de réponse
    const startTime = Date.now();
    
    // Traiter les URLs multiples (séparées par des virgules)
    const urls = config.baseUrl.split(',').map(url => url.trim());
    let totalItems = 0;
    
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Attendre le sélecteur principal
        await page.waitForSelector(config.selectors.main, { timeout: 10000 });
        
        // Compter les éléments
        const items = await page.$$eval(config.selectors.main, elements => elements.length);
        totalItems += items;
        
        console.log(`  - URL: ${url} - ${items} éléments trouvés`);
      } catch (urlError) {
        report.errors.push(`Erreur pour l'URL ${url}: ${urlError.message}`);
      }
    }
    
    const endTime = Date.now();
    report.responseTime = endTime - startTime;
    report.itemCount = totalItems;
    
    // Fermer le navigateur
    await browser.close();
    
    // Déterminer le statut
    if (totalItems === 0) {
      report.status = 'down';
      report.errors.push('Aucun élément trouvé');
    } else if (totalItems < MIN_ITEMS_THRESHOLD) {
      report.status = 'warning';
      report.warnings.push(`Seulement ${totalItems} éléments trouvés (minimum attendu: ${MIN_ITEMS_THRESHOLD})`);
    } else {
      report.status = 'healthy';
    }
    
  } catch (error) {
    report.status = 'error';
    report.errors.push(error.message);
  }
  
  return report;
}

/**
 * Génère un rapport de santé pour toutes les sources
 */
async function generateHealthReport() {
  console.log('🏥 Génération du rapport de santé des sources...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reports = [];
  
  // Vérifier chaque source
  for (const [sourceName, config] of Object.entries(SOURCE_CONFIG)) {
    try {
      const report = await checkSourceHealth(sourceName, config);
      reports.push(report);
    } catch (error) {
      console.error(`❌ Erreur lors de la vérification de ${sourceName}: ${error.message}`);
      reports.push({
        source: sourceName,
        status: 'error',
        errors: [error.message]
      });
    }
  }
  
  // Générer les statistiques
  const stats = {
    totalSources: reports.length,
    healthySources: reports.filter(r => r.status === 'healthy').length,
    warningSources: reports.filter(r => r.status === 'warning').length,
    downSources: reports.filter(r => r.status === 'down').length,
    errorSources: reports.filter(r => r.status === 'error').length,
    averageItems: Math.round(reports.reduce((sum, r) => sum + r.itemCount, 0) / reports.length),
    timestamp
  };
  
  // Sauvegarder le rapport
  const reportPath = path.join(OUTPUT_DIR, `health-report-${timestamp}.json`);
  fs.writeJsonSync(reportPath, { stats, reports }, { spaces: 2 });
  
  // Créer un rapport de synthèse
  const summaryPath = path.join(OUTPUT_DIR, 'latest-health-summary.json');
  fs.writeJsonSync(summaryPath, stats, { spaces: 2 });
  
  // Afficher un résumé
  console.log('\n📊 Résumé du rapport de santé:');
  console.log(`  - Sources totales: ${stats.totalSources}`);
  console.log(`  - Sources en bonne santé: ${stats.healthySources} (${Math.round(stats.healthySources/stats.totalSources*100)}%)`);
  console.log(`  - Sources avec avertissements: ${stats.warningSources} (${Math.round(stats.warningSources/stats.totalSources*100)}%)`);
  console.log(`  - Sources hors service: ${stats.downSources} (${Math.round(stats.downSources/stats.totalSources*100)}%)`);
  console.log(`  - Sources en erreur: ${stats.errorSources} (${Math.round(stats.errorSources/stats.totalSources*100)}%)`);
  console.log(`  - Nombre moyen d'éléments: ${stats.averageItems}`);
  console.log(`\n✅ Rapport sauvegardé dans ${reportPath}`);
  
  return { stats, reports };
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Démarrage du moniteur de santé des sources FloDrama...');
    
    // Créer le dossier de sortie s'il n'existe pas
    fs.ensureDirSync(OUTPUT_DIR);
    
    // Générer le rapport
    const { stats, reports } = await generateHealthReport();
    
    // Identifier les sources problématiques
    const problematicSources = reports.filter(r => r.status === 'down' || r.status === 'error');
    
    if (problematicSources.length > 0) {
      console.log('\n⚠️ Sources problématiques détectées:');
      problematicSources.forEach(source => {
        console.log(`  - ${source.source}: ${source.status}`);
        if (source.errors && source.errors.length > 0) {
          console.log(`    Erreurs: ${source.errors.join(', ')}`);
        }
      });
    }
    
    // Recommandations pour améliorer le scraping
    console.log('\n💡 Recommandations:');
    
    // Sources avec peu d'éléments
    const lowItemSources = reports.filter(r => r.status === 'warning');
    if (lowItemSources.length > 0) {
      console.log('  Sources avec peu d\'éléments:');
      lowItemSources.forEach(source => {
        console.log(`  - ${source.source}: ${source.itemCount} éléments (objectif: ${MIN_ITEMS_THRESHOLD})`);
        console.log(`    Suggestion: Ajouter plus d'URLs ou améliorer les sélecteurs CSS`);
      });
    }
    
    console.log('\n✅ Analyse terminée');
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
  }
}

// Exécuter le script
main().catch(console.error);
