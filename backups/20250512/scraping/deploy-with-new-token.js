/**
 * Script de déploiement des données scrapées vers Cloudflare Workers KV
 * avec le nouveau token API
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Configuration
const SCRAPING_OUTPUT_DIR = path.join(__dirname, 'output');
const CLOUDFLARE_ACCOUNT_ID = '42fc982266a2c31b942593b18097e4b3';
const CLOUDFLARE_NAMESPACE_ID = '7388919bd83241cfab509b44f819bb2f';
const CLOUDFLARE_API_TOKEN = 'E7aPZRNN-u--0TI0BE237AP9zL79kF7gQinJnh0M';

// Fonction pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}

// Fonction pour nettoyer et valider un fichier JSON
function cleanAndValidateJson(filePath) {
  try {
    // Lire le fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Essayer de parser le JSON
    try {
      const data = JSON.parse(content);
      return { valid: true, data };
    } catch (parseError) {
      console.log(`⚠️ Erreur de parsing JSON dans ${filePath}: ${parseError.message}`);
      
      // Tentative de nettoyage du JSON
      console.log(`🔧 Tentative de nettoyage du JSON...`);
      
      // Supprimer les caractères non-UTF8
      content = content.replace(/[^\x00-\x7F]/g, '');
      
      // Supprimer les commentaires
      content = content.replace(/\/\/.*$/gm, '');
      
      // Supprimer les virgules finales dans les objets et tableaux
      content = content.replace(/,(\s*[\]}])/g, '$1');
      
      try {
        const cleanedData = JSON.parse(content);
        console.log(`✅ JSON nettoyé avec succès`);
        return { valid: true, data: cleanedData };
      } catch (cleanError) {
        console.log(`❌ Échec du nettoyage: ${cleanError.message}`);
        return { valid: false, data: null };
      }
    }
  } catch (fileError) {
    console.log(`❌ Erreur de lecture du fichier ${filePath}: ${fileError.message}`);
    return { valid: false, data: null };
  }
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
    
    // Nettoyer et valider le JSON
    const { valid, data } = cleanAndValidateJson(filePath);
    
    if (valid && data) {
      // Déployer vers Cloudflare KV
      const success = await deployJsonToCloudflare(key, data);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    } else {
      console.log(`❌ Impossible de déployer le fichier ${jsonFile} (JSON invalide)`);
      failureCount++;
    }
  }
  
  console.log(`\n📊 Résumé du déploiement:`);
  console.log(`  - Total: ${jsonFiles.length} fichiers`);
  console.log(`  - Succès: ${successCount} fichiers`);
  console.log(`  - Échecs: ${failureCount} fichiers`);
  
  return failureCount === 0;
}

// Fonction principale
async function main() {
  try {
    console.log('🔄 Déploiement des données scrapées vers Cloudflare Workers KV...');
    
    // Déployer tous les fichiers JSON
    const deploySuccess = await deployAllJsonFiles();
    
    if (deploySuccess) {
      console.log('✅ Tous les fichiers ont été déployés avec succès.');
    } else {
      console.log('⚠️ Certains fichiers n\'ont pas pu être déployés.');
    }
    
    console.log('✅ Processus de déploiement terminé.');
    
  } catch (error) {
    console.error(`❌ Erreur lors du déploiement: ${error.message}`);
    console.error(error);
  }
}

// Exécuter le script
main().catch(console.error);
