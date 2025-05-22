/**
 * Script d'automatisation complète pour FloDrama
 * 
 * Ce script orchestre l'ensemble du processus de scraping, validation,
 * correction et déploiement des données vers Cloudflare KV.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { execSync, spawn } = require('child_process');

// Configuration
const CLOUDFLARE_ACCOUNT_ID = '42fc982266a2c31b942593b18097e4b3';
const CLOUDFLARE_NAMESPACE_ID = '7388919bd83241cfab509b44f819bb2f';
const CLOUDFLARE_ZONE_ID = 'f9d0a8f6a9d4f3c7b1e5d2a6f8c3b7a9'; // ID de la zone Cloudflare pour FloDrama
const CLOUDFLARE_API_TOKEN = 'E7aPZRNN-u--0TI0BE237AP9zL79kF7gQinJnh0M';
// Webhook Discord de GitHub pour les alertes d'automatisation
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz'; // Remplacer par l'URL réelle du webhook Discord de GitHub
const SCRAPING_OUTPUT_DIR = path.join(__dirname, 'output');
const FIXED_OUTPUT_DIR = path.join(__dirname, 'fixed-output');
const LOG_DIR = path.join(__dirname, 'logs');

// Créer les dossiers nécessaires s'ils n'existent pas
fs.ensureDirSync(SCRAPING_OUTPUT_DIR);
fs.ensureDirSync(FIXED_OUTPUT_DIR);
fs.ensureDirSync(LOG_DIR);

// Liste des fichiers à surveiller
const FILES_TO_MONITOR = [
  'anime.json',
  'anime-index.json',
  'bollywood.json',
  'bollywood-index.json',
  'drama.json',
  'drama-index.json',
  'film.json',
  'film-index.json',
  'global.json',
  'global-index.json',
  'mydramalist.json',
  'nekosama.json',
  'streamingdivx.json',
  'voiranime.json',
  'voirdrama.json',
  'bollystream.json'
];

/**
 * Fonction pour formater la taille des fichiers
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}

/**
 * Fonction pour obtenir l'horodatage formaté
 */
function getTimestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

/**
 * Fonction pour exécuter une commande et capturer sa sortie
 */
function executeCommand(command, cwd = __dirname) {
  try {
    const output = execSync(command, { cwd, encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

/**
 * Fonction pour exécuter une commande de manière asynchrone
 */
function executeCommandAsync(command, args, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    const logFile = path.join(LOG_DIR, `${command}-${getTimestamp()}.log`);
    const logStream = fs.createWriteStream(logFile);
    
    console.log(`🚀 Exécution de la commande: ${command} ${args.join(' ')}`);
    console.log(`📝 Logs disponibles dans: ${logFile}`);
    
    const process = spawn(command, args, { cwd });
    
    process.stdout.on('data', (data) => {
      const output = data.toString();
      logStream.write(output);
      console.log(output);
    });
    
    process.stderr.on('data', (data) => {
      const output = data.toString();
      logStream.write(output);
      console.error(output);
    });
    
    process.on('close', (code) => {
      logStream.end();
      if (code === 0) {
        resolve({ success: true, logFile });
      } else {
        reject({ success: false, code, logFile });
      }
    });
  });
}

/**
 * Fonction pour valider un fichier JSON
 */
function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Fonction pour corriger un fichier JSON
 */
function fixJsonFile(filePath, outputPath) {
  console.log(`🔧 Tentative de correction du fichier JSON: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Méthode 1: Extraction d'objets JSON valides avec regex
    const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const matches = content.match(objectRegex) || [];
    
    const validObjects = [];
    for (const match of matches) {
      try {
        const obj = JSON.parse(match);
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          validObjects.push(obj);
        }
      } catch (e) {
        // Ignorer les objets non valides
      }
    }
    
    // Méthode 2: Analyse ligne par ligne
    if (validObjects.length === 0) {
      const lines = content.split('\n');
      for (const line of lines) {
        try {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
            const obj = JSON.parse(trimmedLine);
            if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
              validObjects.push(obj);
            }
          }
        } catch (e) {
          // Ignorer les lignes non valides
        }
      }
    }
    
    // Méthode 3: Extraction des propriétés communes
    if (validObjects.length === 0) {
      const titleRegex = /"title"\s*:\s*"([^"]*)"/g;
      const urlRegex = /"url"\s*:\s*"([^"]*)"/g;
      const imageRegex = /"image"\s*:\s*"([^"]*)"/g;
      
      let titleMatch;
      let urlMatch;
      let imageMatch;
      
      const extractedObjects = [];
      
      while ((titleMatch = titleRegex.exec(content)) !== null) {
        const title = titleMatch[1];
        
        // Réinitialiser les regex pour chercher à partir de la position actuelle
        urlRegex.lastIndex = titleRegex.lastIndex;
        urlMatch = urlRegex.exec(content);
        
        imageRegex.lastIndex = urlRegex.lastIndex;
        imageMatch = imageRegex.exec(content);
        
        if (urlMatch && imageMatch) {
          extractedObjects.push({
            title,
            url: urlMatch[1],
            image: imageMatch[1]
          });
        }
      }
      
      if (extractedObjects.length > 0) {
        validObjects.push(...extractedObjects);
      }
    }
    
    // Si nous avons des objets valides, les sauvegarder
    if (validObjects.length > 0) {
      fs.writeJsonSync(outputPath, validObjects, { spaces: 2 });
      console.log(`✅ Fichier corrigé avec succès: ${outputPath} (${validObjects.length} objets récupérés)`);
      return { success: true, objectCount: validObjects.length };
    } else {
      console.error(`❌ Impossible de corriger le fichier: ${filePath}`);
      return { success: false, error: 'Aucun objet JSON valide trouvé' };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la correction du fichier: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction pour déployer un fichier vers Cloudflare KV
 */
async function deployToCloudflareKV(filePath, key) {
  console.log(`🚀 Déploiement du fichier ${filePath} vers Cloudflare KV (clé: ${key})...`);
  
  try {
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Déployer vers Cloudflare KV
    const response = await axios({
      method: 'put',
      url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/values/${key}`,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: content
    });
    
    if (response.data.success) {
      console.log(`✅ Déploiement réussi pour la clé ${key}`);
      return { success: true };
    } else {
      console.error(`❌ Erreur lors du déploiement de la clé ${key}: ${JSON.stringify(response.data.errors)}`);
      return { success: false, errors: response.data.errors };
    }
  } catch (error) {
    console.error(`❌ Erreur lors du déploiement de la clé ${key}: ${error.message}`);
    if (error.response) {
      console.error(`  Détails: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Fonction pour purger le cache Cloudflare
 */
async function purgeCloudflareCache() {
  console.log('🧹 Purge du cache Cloudflare...');
  
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        purge_everything: true
      }
    });
    
    if (response.data.success) {
      console.log('✅ Purge du cache réussie');
      return { success: true };
    } else {
      console.error(`❌ Erreur lors de la purge du cache: ${JSON.stringify(response.data.errors)}`);
      return { success: false, errors: response.data.errors };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la purge du cache: ${error.message}`);
    if (error.response) {
      console.error(`  Détails: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Fonction pour envoyer une notification Discord
 */
async function sendDiscordNotification(title, description, fields = [], color = 0x3b82f6) {
  if (!WEBHOOK_URL) {
    return;
  }
  
  try {
    const embed = {
      title,
      description,
      color,
      timestamp: new Date().toISOString(),
      fields
    };
    
    await axios.post(WEBHOOK_URL, {
      embeds: [embed]
    });
    
    console.log('✅ Notification Discord envoyée avec succès');
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de la notification Discord: ${error.message}`);
  }
}

/**
 * Fonction pour exécuter le scraping complet
 */
async function runFullScraping() {
  console.log('🚀 Démarrage du scraping complet...');
  
  try {
    // Démarrer le serveur relay
    console.log('🌐 Démarrage du serveur relay...');
    const serverProcess = spawn('node', ['serveur-relay-local-v2.js'], { cwd: __dirname, detached: true });
    
    // Attendre que le serveur soit prêt
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Exécuter le scraping
    console.log('🔍 Exécution du scraping...');
    const scrapingResult = await executeCommandAsync('node', ['test-scraping-local.js'], __dirname);
    
    // Analyser les résultats
    console.log('📊 Analyse des résultats du scraping...');
    const analysisResult = await executeCommandAsync('node', ['analyze-scraping-results.js'], __dirname);
    
    // Vérifier la santé des sources
    console.log('🏥 Vérification de la santé des sources...');
    const healthResult = await executeCommandAsync('node', ['monitor-sources-health.js'], __dirname);
    
    // Arrêter le serveur relay
    console.log('🛑 Arrêt du serveur relay...');
    process.kill(-serverProcess.pid, 'SIGINT');
    
    console.log('✅ Scraping complet terminé avec succès');
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur lors du scraping complet: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fonction pour valider et corriger tous les fichiers JSON
 */
async function validateAndFixAllFiles() {
  console.log('🔍 Validation et correction des fichiers JSON...');
  
  const results = {
    valid: [],
    fixed: [],
    failed: []
  };
  
  for (const file of FILES_TO_MONITOR) {
    const filePath = path.join(SCRAPING_OUTPUT_DIR, file);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Fichier non trouvé: ${filePath}`);
      results.failed.push({ file, error: 'Fichier non trouvé' });
      continue;
    }
    
    // Valider le fichier JSON
    const validation = validateJsonFile(filePath);
    
    if (validation.valid) {
      console.log(`✅ Fichier valide: ${file}`);
      results.valid.push(file);
    } else {
      console.warn(`⚠️ Fichier invalide: ${file} (${validation.error})`);
      
      // Tenter de corriger le fichier
      const fixedFilePath = path.join(FIXED_OUTPUT_DIR, file);
      const fixResult = fixJsonFile(filePath, fixedFilePath);
      
      if (fixResult.success) {
        console.log(`✅ Fichier corrigé: ${file} (${fixResult.objectCount} objets récupérés)`);
        results.fixed.push({ file, objectCount: fixResult.objectCount });
      } else {
        console.error(`❌ Échec de la correction: ${file} (${fixResult.error})`);
        results.failed.push({ file, error: fixResult.error });
      }
    }
  }
  
  console.log('\n📊 Résumé de la validation:');
  console.log(`  - Fichiers valides: ${results.valid.length}`);
  console.log(`  - Fichiers corrigés: ${results.fixed.length}`);
  console.log(`  - Fichiers en échec: ${results.failed.length}`);
  
  return results;
}

/**
 * Fonction pour déployer tous les fichiers vers Cloudflare KV
 */
async function deployAllFiles() {
  console.log('🚀 Déploiement de tous les fichiers vers Cloudflare KV...');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const file of FILES_TO_MONITOR) {
    // Déterminer le chemin du fichier à déployer
    const originalPath = path.join(SCRAPING_OUTPUT_DIR, file);
    const fixedPath = path.join(FIXED_OUTPUT_DIR, file);
    
    let filePath;
    if (fs.existsSync(fixedPath)) {
      filePath = fixedPath;
    } else if (fs.existsSync(originalPath)) {
      filePath = originalPath;
    } else {
      console.warn(`⚠️ Fichier non trouvé: ${file}`);
      results.failed.push({ file, error: 'Fichier non trouvé' });
      continue;
    }
    
    // Déterminer la clé KV
    const key = file.replace('.json', '');
    
    // Déployer le fichier
    const deployResult = await deployToCloudflareKV(filePath, key);
    
    if (deployResult.success) {
      console.log(`✅ Déploiement réussi: ${file} -> ${key}`);
      results.success.push(file);
    } else {
      console.error(`❌ Échec du déploiement: ${file} -> ${key}`);
      results.failed.push({ file, error: deployResult.error || 'Erreur inconnue' });
    }
  }
  
  console.log('\n📊 Résumé du déploiement:');
  console.log(`  - Fichiers déployés avec succès: ${results.success.length}`);
  console.log(`  - Fichiers en échec: ${results.failed.length}`);
  
  return results;
}

/**
 * Fonction principale
 */
async function main() {
  const startTime = Date.now();
  console.log(`🚀 Démarrage de l'automatisation complète FloDrama - ${new Date().toLocaleString('fr-FR')}`);
  
  try {
    // Étape 1: Exécuter le scraping complet
    console.log('\n📌 ÉTAPE 1: SCRAPING COMPLET');
    const scrapingResult = await runFullScraping();
    
    // Étape 2: Valider et corriger les fichiers JSON
    console.log('\n📌 ÉTAPE 2: VALIDATION ET CORRECTION DES FICHIERS');
    const validationResults = await validateAndFixAllFiles();
    
    // Étape 3: Déployer les fichiers vers Cloudflare KV
    console.log('\n📌 ÉTAPE 3: DÉPLOIEMENT VERS CLOUDFLARE KV');
    const deploymentResults = await deployAllFiles();
    
    // Étape 4: Purger le cache Cloudflare
    console.log('\n📌 ÉTAPE 4: PURGE DU CACHE CLOUDFLARE');
    const purgeResult = await purgeCloudflareCache();
    
    // Étape 5: Vérifier la santé des données Cloudflare KV
    console.log('\n📌 ÉTAPE 5: VÉRIFICATION DE LA SANTÉ DES DONNÉES');
    const healthCheckResult = await executeCommandAsync('node', ['monitor-cloudflare-kv.js'], __dirname);
    
    // Calculer le temps d'exécution
    const executionTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    // Générer un rapport final
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: `${executionTime} minutes`,
      scraping: scrapingResult,
      validation: validationResults,
      deployment: deploymentResults,
      purgeCache: purgeResult,
      healthCheck: healthCheckResult
    };
    
    // Sauvegarder le rapport
    const reportPath = path.join(LOG_DIR, `automation-report-${getTimestamp()}.json`);
    fs.writeJsonSync(reportPath, report, { spaces: 2 });
    
    // Envoyer une notification Discord
    await sendDiscordNotification(
      '✅ Automatisation FloDrama terminée avec succès',
      `L'automatisation complète s'est terminée en ${executionTime} minutes.`,
      [
        {
          name: 'Scraping',
          value: scrapingResult.success ? '✅ Réussi' : '❌ Échec',
          inline: true
        },
        {
          name: 'Validation',
          value: `✅ ${validationResults.valid.length} valides\n🔧 ${validationResults.fixed.length} corrigés\n❌ ${validationResults.failed.length} échecs`,
          inline: true
        },
        {
          name: 'Déploiement',
          value: `✅ ${deploymentResults.success.length} réussis\n❌ ${deploymentResults.failed.length} échecs`,
          inline: true
        }
      ],
      0x00FF00 // Vert
    );
    
    console.log(`\n✅ Automatisation terminée en ${executionTime} minutes`);
    console.log(`📝 Rapport sauvegardé dans ${reportPath}`);
    
  } catch (error) {
    console.error(`\n❌ Erreur lors de l'automatisation: ${error.message}`);
    
    // Envoyer une notification d'erreur
    await sendDiscordNotification(
      '❌ Erreur lors de l\'automatisation FloDrama',
      `Une erreur s'est produite: ${error.message}`,
      [],
      0xFF0000 // Rouge
    );
  }
}

// Exécuter le script
main().catch(console.error);
