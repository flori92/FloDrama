/**
 * Pipeline complet de scraping, enrichissement et distribution pour FloDrama
 * 
 * Ce script orchestre tout le processus de récupération, d'enrichissement
 * et de distribution des données pour FloDrama
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const CONFIG = require('./config');
const { enrichAllData } = require('./enrichissement');
const { generateAllFiles } = require('./distribution');

// Statistiques
const stats = {
  start_time: new Date(),
  end_time: null,
  duration_ms: 0,
  duration_formatted: '',
  scraping: {
    sources_processed: 0,
    sources_failed: 0,
    total_items: 0
  },
  enrichment: {
    items_processed: 0,
    items_enriched: 0,
    items_failed: 0
  },
  distribution: {
    categories_processed: 0,
    files_generated: 0
  }
};

/**
 * Exécute une commande shell
 * @param {string} command - Commande à exécuter
 * @param {string} cwd - Répertoire de travail
 * @returns {Promise<{stdout: string, stderr: string}>} - Résultat de la commande
 */
function executeCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Formate une durée en millisecondes en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Durée formatée
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Envoie une notification Discord
 * @param {string} message - Message à envoyer
 * @param {string} title - Titre du message
 * @param {string} color - Couleur de l'embed (en hexadécimal)
 * @returns {Promise<boolean>} - Succès de l'envoi
 */
async function sendDiscordNotification(message, title = 'FloDrama Scraping', color = '#00ff00') {
  try {
    if (!CONFIG.MONITORING.discordWebhook) {
      console.log('[NOTIFICATION] Webhook Discord non configuré');
      return false;
    }
    
    const payload = {
      embeds: [
        {
          title,
          description: message,
          color: parseInt(color.replace('#', ''), 16),
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    await axios.post(CONFIG.MONITORING.discordWebhook, payload);
    console.log('[NOTIFICATION] Notification Discord envoyée');
    return true;
  } catch (error) {
    console.error(`[NOTIFICATION] Erreur lors de l'envoi de la notification Discord: ${error.message}`);
    return false;
  }
}

/**
 * Étape 1: Scraping des données
 */
async function runScraping() {
  console.log('='.repeat(80));
  console.log('ÉTAPE 1: SCRAPING DES DONNÉES');
  console.log('='.repeat(80));
  
  try {
    // Créer les répertoires nécessaires
    await fs.ensureDir(CONFIG.TEMP_DIR);
    
    // Exécuter le script de scraping pour chaque catégorie
    for (const category of CONFIG.CATEGORIES) {
      console.log(`\n🔍 Scraping des sources de ${category.toUpperCase()}...`);
      
      // Récupérer les sources de la catégorie
      const sources = CONFIG.SOURCES[category] || [];
      
      if (sources.length === 0) {
        console.warn(`⚠️ Aucune source définie pour la catégorie ${category}`);
        continue;
      }
      
      // Trier les sources par priorité
      sources.sort((a, b) => a.priority - b.priority);
      
      // Scraper chaque source
      for (const source of sources) {
        console.log(`\n🔍 Scraping de ${source.name} (catégorie: ${category})...`);
        
        try {
          // Exécuter le script de scraping
          const { stdout, stderr } = await executeCommand(
            `node ./cloudflare/scraping/src/cli-scraper.js --source=${source.name} --limit=${source.minItems} --output=${CONFIG.TEMP_DIR} --debug --save`,
            process.cwd()
          );
          
          // Vérifier si le scraping a réussi
          if (stderr && stderr.includes('Erreur')) {
            console.error(`❌ Échec du scraping de ${source.name}: ${stderr}`);
            stats.scraping.sources_failed++;
          } else {
            console.log(`✅ Scraping de ${source.name} terminé avec succès`);
            stats.scraping.sources_processed++;
            
            // Extraire le nombre d'éléments récupérés
            const match = stdout.match(/(\d+) éléments trouvés/);
            if (match) {
              const itemCount = parseInt(match[1]);
              stats.scraping.total_items += itemCount;
              console.log(`📦 ${itemCount} éléments récupérés pour ${source.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur lors du scraping de ${source.name}: ${error.message}`);
          stats.scraping.sources_failed++;
        }
      }
    }
    
    console.log('\n✅ Scraping terminé');
    console.log(`📊 ${stats.scraping.sources_processed} sources traitées, ${stats.scraping.sources_failed} échecs, ${stats.scraping.total_items} éléments récupérés`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du scraping: ${error.message}`);
    return false;
  }
}

/**
 * Étape 2: Enrichissement des données
 */
async function runEnrichment() {
  console.log('\n' + '='.repeat(80));
  console.log('ÉTAPE 2: ENRICHISSEMENT DES DONNÉES');
  console.log('='.repeat(80));
  
  try {
    // Créer les répertoires nécessaires
    await fs.ensureDir(CONFIG.OUTPUT_DIR);
    
    // Enrichir les données
    const success = await enrichAllData(true);
    
    if (success) {
      console.log('\n✅ Enrichissement terminé avec succès');
      
      // Compter les éléments enrichis
      let totalItems = 0;
      let enrichedItems = 0;
      
      // Parcourir les fichiers enrichis
      const files = await fs.readdir(CONFIG.OUTPUT_DIR);
      const enrichedFiles = files.filter(file => file.endsWith('_enriched.json'));
      
      for (const file of enrichedFiles) {
        try {
          const filePath = path.join(CONFIG.OUTPUT_DIR, file);
          const data = await fs.readJson(filePath);
          
          if (Array.isArray(data)) {
            totalItems += data.length;
            
            // Compter les éléments avec des données enrichies (poster, backdrop, trailer)
            const enriched = data.filter(item => item.poster && item.backdrop && item.trailer);
            enrichedItems += enriched.length;
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la lecture de ${file}: ${error.message}`);
        }
      }
      
      stats.enrichment.items_processed = totalItems;
      stats.enrichment.items_enriched = enrichedItems;
      stats.enrichment.items_failed = totalItems - enrichedItems;
      
      console.log(`📊 ${enrichedItems}/${totalItems} éléments enrichis (${Math.round(enrichedItems / totalItems * 100)}%)`);
    } else {
      console.error('❌ Échec de l\'enrichissement des données');
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Erreur lors de l'enrichissement: ${error.message}`);
    return false;
  }
}

/**
 * Étape 3: Distribution des données
 */
async function runDistribution() {
  console.log('\n' + '='.repeat(80));
  console.log('ÉTAPE 3: DISTRIBUTION DES DONNÉES');
  console.log('='.repeat(80));
  
  try {
    // Créer les répertoires nécessaires
    await fs.ensureDir(CONFIG.OUTPUT_DIR);
    
    // Générer les fichiers
    const success = await generateAllFiles(true);
    
    if (success) {
      console.log('\n✅ Distribution terminée avec succès');
      
      // Compter les fichiers générés
      let fileCount = 0;
      
      // Compter les fichiers dans chaque catégorie
      for (const category of CONFIG.CATEGORIES) {
        const categoryDir = path.join(CONFIG.OUTPUT_DIR, category);
        
        if (await fs.pathExists(categoryDir)) {
          const files = await fs.readdir(categoryDir);
          fileCount += files.length;
          stats.distribution.categories_processed++;
        }
      }
      
      // Ajouter les fichiers à la racine
      const rootFiles = await fs.readdir(CONFIG.OUTPUT_DIR);
      const jsonRootFiles = rootFiles.filter(file => file.endsWith('.json') && !file.includes('_enriched'));
      fileCount += jsonRootFiles.length;
      
      stats.distribution.files_generated = fileCount;
      
      console.log(`📊 ${fileCount} fichiers générés pour ${stats.distribution.categories_processed} catégories`);
    } else {
      console.error('❌ Échec de la distribution des données');
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Erreur lors de la distribution: ${error.message}`);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('='.repeat(80));
  console.log(`FloDrama - Pipeline Complet de Scraping`);
  console.log('='.repeat(80));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Répertoire de sortie: ${CONFIG.OUTPUT_DIR}`);
  console.log(`Catégories: ${CONFIG.CATEGORIES.join(', ')}`);
  console.log('='.repeat(80));
  
  try {
    // Étape 1: Scraping
    const scrapingSuccess = await runScraping();
    
    // Étape 2: Enrichissement
    const enrichmentSuccess = await runEnrichment();
    
    // Étape 3: Distribution
    const distributionSuccess = await runDistribution();
    
    // Calculer la durée totale
    stats.end_time = new Date();
    stats.duration_ms = stats.end_time - stats.start_time;
    stats.duration_formatted = formatDuration(stats.duration_ms);
    
    // Afficher le résumé
    console.log('\n' + '='.repeat(80));
    console.log('RÉSUMÉ DU PIPELINE');
    console.log('='.repeat(80));
    console.log(`⏱️ Durée totale: ${stats.duration_formatted}`);
    console.log('\n📊 Scraping:');
    console.log(`- Sources traitées: ${stats.scraping.sources_processed}`);
    console.log(`- Sources en échec: ${stats.scraping.sources_failed}`);
    console.log(`- Éléments récupérés: ${stats.scraping.total_items}`);
    console.log('\n📊 Enrichissement:');
    console.log(`- Éléments traités: ${stats.enrichment.items_processed}`);
    console.log(`- Éléments enrichis: ${stats.enrichment.items_enriched}`);
    console.log(`- Éléments en échec: ${stats.enrichment.items_failed}`);
    console.log('\n📊 Distribution:');
    console.log(`- Catégories traitées: ${stats.distribution.categories_processed}`);
    console.log(`- Fichiers générés: ${stats.distribution.files_generated}`);
    
    // Déterminer le statut global
    const globalSuccess = scrapingSuccess && enrichmentSuccess && distributionSuccess;
    
    if (globalSuccess) {
      console.log('\n✅ Pipeline terminé avec succès');
      
      // Envoyer une notification de succès
      await sendDiscordNotification(
        `✅ Pipeline de scraping terminé avec succès en ${stats.duration_formatted}\n` +
        `📊 ${stats.scraping.total_items} éléments récupérés, ${stats.enrichment.items_enriched} enrichis, ${stats.distribution.files_generated} fichiers générés`,
        '✅ FloDrama Scraping - Succès',
        '#00ff00'
      );
    } else {
      console.error('\n❌ Pipeline terminé avec des erreurs');
      
      // Envoyer une notification d'erreur
      await sendDiscordNotification(
        `❌ Pipeline de scraping terminé avec des erreurs en ${stats.duration_formatted}\n` +
        `📊 ${stats.scraping.sources_failed} sources en échec, ${stats.enrichment.items_failed} éléments non enrichis`,
        '❌ FloDrama Scraping - Erreur',
        '#ff0000'
      );
    }
    
    return globalSuccess;
  } catch (error) {
    console.error(`❌ Erreur fatale: ${error.message}`);
    
    // Envoyer une notification d'erreur fatale
    await sendDiscordNotification(
      `❌ Erreur fatale lors du pipeline de scraping: ${error.message}`,
      '❌ FloDrama Scraping - Erreur Fatale',
      '#ff0000'
    );
    
    return false;
  }
}

// Exécuter la fonction principale
main()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
