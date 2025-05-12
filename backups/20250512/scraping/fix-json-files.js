/**
 * Script de correction des fichiers JSON corrompus
 * 
 * Ce script tente de corriger les fichiers JSON qui ont échoué lors du déploiement
 * en utilisant des techniques avancées de réparation.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Configuration
const SCRAPING_OUTPUT_DIR = path.join(__dirname, 'output');
const FIXED_OUTPUT_DIR = path.join(__dirname, 'fixed-output');
const CLOUDFLARE_ACCOUNT_ID = '42fc982266a2c31b942593b18097e4b3';
const CLOUDFLARE_NAMESPACE_ID = '7388919bd83241cfab509b44f819bb2f';
const CLOUDFLARE_API_TOKEN = 'E7aPZRNN-u--0TI0BE237AP9zL79kF7gQinJnh0M';

// Liste des fichiers à corriger
const FILES_TO_FIX = [
  'anime.json',
  'bollywood.json',
  'drama.json',
  'film.json',
  'global.json'
];

// Créer le dossier de sortie s'il n'existe pas
fs.ensureDirSync(FIXED_OUTPUT_DIR);

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

/**
 * Fonction avancée pour réparer un fichier JSON corrompu
 * Cette fonction utilise plusieurs techniques pour tenter de récupérer un maximum de données
 */
function fixJsonFile(filePath) {
  console.log(`🔧 Tentative de réparation du fichier ${path.basename(filePath)}...`);
  
  try {
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Technique 1: Extraction des objets JSON valides
    console.log(`  Technique 1: Extraction des objets JSON valides...`);
    
    // Rechercher le début du tableau JSON
    const arrayStartIndex = content.indexOf('[');
    if (arrayStartIndex === -1) {
      console.log(`  ❌ Impossible de trouver le début du tableau JSON`);
      return null;
    }
    
    // Rechercher des objets JSON valides dans le contenu
    const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const matches = content.match(objectRegex) || [];
    
    if (matches.length === 0) {
      console.log(`  ❌ Aucun objet JSON valide trouvé`);
      return null;
    }
    
    console.log(`  ✅ ${matches.length} objets JSON valides trouvés`);
    
    // Filtrer les objets JSON valides
    const validObjects = [];
    for (const match of matches) {
      try {
        const obj = JSON.parse(match);
        validObjects.push(obj);
      } catch (e) {
        // Ignorer les objets invalides
      }
    }
    
    console.log(`  ✅ ${validObjects.length} objets JSON valides après filtrage`);
    
    if (validObjects.length === 0) {
      // Technique 2: Extraction ligne par ligne
      console.log(`  Technique 2: Extraction ligne par ligne...`);
      
      const lines = content.split('\n');
      const jsonLines = [];
      
      // Chercher les lignes qui ressemblent à des objets JSON
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('{') && trimmedLine.endsWith('},')) {
          try {
            // Supprimer la virgule finale
            const jsonStr = trimmedLine.slice(0, -1);
            const obj = JSON.parse(jsonStr);
            jsonLines.push(obj);
          } catch (e) {
            // Ignorer les lignes invalides
          }
        }
      }
      
      console.log(`  ✅ ${jsonLines.length} objets JSON valides extraits ligne par ligne`);
      
      if (jsonLines.length > 0) {
        return jsonLines;
      }
      
      // Technique 3: Récupération par extraction de propriétés communes
      console.log(`  Technique 3: Récupération par extraction de propriétés communes...`);
      
      // Analyser le contenu pour trouver des motifs communs
      const titleRegex = /"title"\s*:\s*"([^"]*)"/g;
      const urlRegex = /"url"\s*:\s*"([^"]*)"/g;
      const imageRegex = /"image"\s*:\s*"([^"]*)"/g;
      
      const titles = [];
      const urls = [];
      const images = [];
      
      let match;
      
      while ((match = titleRegex.exec(content)) !== null) {
        titles.push(match[1]);
      }
      
      while ((match = urlRegex.exec(content)) !== null) {
        urls.push(match[1]);
      }
      
      while ((match = imageRegex.exec(content)) !== null) {
        images.push(match[1]);
      }
      
      // Créer des objets à partir des propriétés extraites
      const extractedObjects = [];
      const maxLength = Math.max(titles.length, urls.length, images.length);
      
      for (let i = 0; i < maxLength; i++) {
        const obj = {};
        if (i < titles.length) obj.title = titles[i];
        if (i < urls.length) obj.url = urls[i];
        if (i < images.length) obj.image = images[i];
        
        if (Object.keys(obj).length > 0) {
          extractedObjects.push(obj);
        }
      }
      
      console.log(`  ✅ ${extractedObjects.length} objets reconstruits à partir des propriétés`);
      
      if (extractedObjects.length > 0) {
        return extractedObjects;
      }
      
      return null;
    }
    
    return validObjects;
    
  } catch (error) {
    console.log(`  ❌ Erreur lors de la réparation: ${error.message}`);
    return null;
  }
}

/**
 * Fonction pour déployer un fichier JSON vers Cloudflare KV
 */
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

/**
 * Fonction principale pour corriger et déployer les fichiers JSON
 */
async function fixAndDeployJsonFiles() {
  console.log('🚀 Démarrage de la correction et du déploiement des fichiers JSON...');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const fileName of FILES_TO_FIX) {
    const filePath = path.join(SCRAPING_OUTPUT_DIR, fileName);
    const key = fileName.replace('.json', '');
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Le fichier ${fileName} n'existe pas`);
      failureCount++;
      continue;
    }
    
    // Réparer le fichier JSON
    const fixedData = fixJsonFile(filePath);
    
    if (!fixedData || fixedData.length === 0) {
      console.log(`❌ Impossible de réparer le fichier ${fileName}`);
      failureCount++;
      continue;
    }
    
    // Sauvegarder le fichier réparé
    const fixedFilePath = path.join(FIXED_OUTPUT_DIR, fileName);
    fs.writeJsonSync(fixedFilePath, fixedData, { spaces: 2 });
    
    console.log(`✅ Fichier ${fileName} réparé avec succès (${fixedData.length} éléments)`);
    
    // Déployer le fichier réparé vers Cloudflare KV
    const success = await deployJsonToCloudflare(key, fixedData);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log(`\n📊 Résumé de la correction et du déploiement:`);
  console.log(`  - Total: ${FILES_TO_FIX.length} fichiers`);
  console.log(`  - Succès: ${successCount} fichiers`);
  console.log(`  - Échecs: ${failureCount} fichiers`);
}

// Exécuter la fonction principale
fixAndDeployJsonFiles().catch(console.error);
