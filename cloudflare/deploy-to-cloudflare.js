/**
 * Script de déploiement des données scrapées vers Cloudflare Workers KV
 * 
 * Ce script prend les données JSON scrapées et les déploie vers Cloudflare Workers KV
 * pour qu'elles soient accessibles par l'application FloDrama.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

// Configuration
const SCRAPING_OUTPUT_DIR = path.join(__dirname, 'scraping/output');
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_NAMESPACE_ID = process.env.CLOUDFLARE_NAMESPACE_ID;
const CLOUDFLARE_WORKER_NAME = 'flodrama-api';

// Vérifier les variables d'environnement
if (!CLOUDFLARE_API_TOKEN) {
  console.error('❌ CLOUDFLARE_API_TOKEN non défini. Veuillez définir cette variable d\'environnement.');
  console.error('Vous pouvez l\'exporter avec: export CLOUDFLARE_API_TOKEN=votre_token');
  process.exit(1);
}

if (!CLOUDFLARE_ACCOUNT_ID) {
  console.error('❌ CLOUDFLARE_ACCOUNT_ID non défini. Veuillez définir cette variable d\'environnement.');
  console.error('Vous pouvez l\'exporter avec: export CLOUDFLARE_ACCOUNT_ID=votre_id_compte');
  process.exit(1);
}

if (!CLOUDFLARE_NAMESPACE_ID) {
  console.error('❌ CLOUDFLARE_NAMESPACE_ID non défini. Veuillez définir cette variable d\'environnement.');
  console.error('Vous pouvez l\'exporter avec: export CLOUDFLARE_NAMESPACE_ID=votre_id_namespace');
  process.exit(1);
}

// Fonction pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
}

// Fonction pour déployer un fichier JSON vers Cloudflare KV
async function deployJsonToCloudflare(key, jsonData) {
  console.log(`📤 Déploiement de la clé "${key}" vers Cloudflare KV...`);
  
  // Convertir en chaîne JSON si ce n'est pas déjà le cas
  const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  
  try {
    // Utiliser l'API Cloudflare pour mettre à jour la valeur KV
    const response = await axios({
      method: 'put',
      url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/values/${key}`,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: jsonString
    });
    
    if (response.data.success) {
      console.log(`✅ Clé "${key}" déployée avec succès (${formatFileSize(jsonString.length)})`);
      return true;
    } else {
      console.error(`❌ Erreur lors du déploiement de la clé "${key}": ${JSON.stringify(response.data.errors)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors du déploiement de la clé "${key}": ${error.message}`);
    if (error.response) {
      console.error(`  Détails: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Fonction pour déployer tous les fichiers JSON du dossier de sortie
async function deployAllJsonFiles() {
  console.log('🚀 Démarrage du déploiement des données vers Cloudflare Workers KV...');
  
  // Vérifier que le dossier de sortie existe
  if (!fs.existsSync(SCRAPING_OUTPUT_DIR)) {
    console.error(`❌ Le dossier de sortie ${SCRAPING_OUTPUT_DIR} n'existe pas.`);
    return false;
  }
  
  // Lister tous les fichiers JSON dans le dossier de sortie
  const jsonFiles = fs.readdirSync(SCRAPING_OUTPUT_DIR).filter(file => file.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.error('❌ Aucun fichier JSON trouvé dans le dossier de sortie.');
    return false;
  }
  
  console.log(`📋 ${jsonFiles.length} fichiers JSON trouvés dans le dossier de sortie.`);
  
  // Déployer chaque fichier JSON
  let successCount = 0;
  let failureCount = 0;
  
  for (const jsonFile of jsonFiles) {
    const filePath = path.join(SCRAPING_OUTPUT_DIR, jsonFile);
    const key = jsonFile.replace('.json', '');
    
    try {
      // Lire le fichier JSON
      const jsonData = fs.readJsonSync(filePath);
      
      // Déployer vers Cloudflare KV
      const success = await deployJsonToCloudflare(key, jsonData);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
      failureCount++;
    }
  }
  
  console.log(`\n📊 Résumé du déploiement:`);
  console.log(`  - Total: ${jsonFiles.length} fichiers`);
  console.log(`  - Succès: ${successCount} fichiers`);
  console.log(`  - Échecs: ${failureCount} fichiers`);
  
  return failureCount === 0;
}

// Fonction pour purger le cache Cloudflare
async function purgeCache() {
  console.log('🧹 Purge du cache Cloudflare...');
  
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${CLOUDFLARE_WORKER_NAME}/subdomain-routes/cache/purge-all`,
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Cache purgé avec succès');
      return true;
    } else {
      console.error(`❌ Erreur lors de la purge du cache: ${JSON.stringify(response.data.errors)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la purge du cache: ${error.message}`);
    if (error.response) {
      console.error(`  Détails: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🔄 Déploiement des données scrapées vers Cloudflare Workers KV...');
    
    // Déployer tous les fichiers JSON
    const deploySuccess = await deployAllJsonFiles();
    
    if (deploySuccess) {
      console.log('✅ Tous les fichiers ont été déployés avec succès.');
      
      // Purger le cache
      const purgeSuccess = await purgeCache();
      
      if (purgeSuccess) {
        console.log('✅ Le cache a été purgé avec succès.');
      } else {
        console.warn('⚠️ Le cache n\'a pas pu être purgé, mais les données ont été déployées.');
      }
    } else {
      console.error('❌ Certains fichiers n\'ont pas pu être déployés.');
    }
    
    console.log('✅ Processus de déploiement terminé.');
    
  } catch (error) {
    console.error(`❌ Erreur lors du déploiement: ${error.message}`);
    console.error(error);
  }
}

// Exécuter le script
main().catch(console.error);
