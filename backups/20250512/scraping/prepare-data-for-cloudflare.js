/**
 * Script de préparation des données scrapées pour Cloudflare
 * 
 * Ce script prépare les données JSON scrapées pour être importées manuellement
 * dans Cloudflare Workers KV via l'interface web de Cloudflare.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');

// Configuration
const SCRAPING_OUTPUT_DIR = path.join(__dirname, 'output');
const CLOUDFLARE_EXPORT_DIR = path.join(__dirname, 'cloudflare-export');

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
        
        // Dernière tentative: essayer de lire ligne par ligne
        console.log(`🔍 Tentative de récupération ligne par ligne...`);
        const lines = content.split('\n');
        let validLines = [];
        let inArray = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line === '[') {
            inArray = true;
            validLines.push(line);
          } else if (line === ']') {
            inArray = false;
            validLines.push(line);
          } else if (inArray && line !== '') {
            // Supprimer la virgule finale si présente
            const cleanLine = line.endsWith(',') ? line.slice(0, -1) : line;
            
            try {
              // Vérifier si la ligne est un objet JSON valide
              JSON.parse(cleanLine);
              validLines.push(cleanLine + (i < lines.length - 2 ? ',' : ''));
            } catch (lineError) {
              console.log(`  Ligne ${i+1} ignorée: ${cleanLine.substring(0, 50)}...`);
            }
          }
        }
        
        const reconstructedJson = validLines.join('\n');
        
        try {
          const recoveredData = JSON.parse(reconstructedJson);
          console.log(`✅ JSON récupéré avec succès (${validLines.length} lignes valides)`);
          return { valid: true, data: recoveredData };
        } catch (recoveryError) {
          console.log(`❌ Échec de la récupération: ${recoveryError.message}`);
          return { valid: false, data: null };
        }
      }
    }
  } catch (fileError) {
    console.log(`❌ Erreur de lecture du fichier ${filePath}: ${fileError.message}`);
    return { valid: false, data: null };
  }
}

// Fonction principale pour préparer les données
function prepareDataForCloudflare() {
  console.log('🚀 Préparation des données pour Cloudflare...');
  
  // Vérifier que le dossier de sortie existe
  if (!fs.existsSync(SCRAPING_OUTPUT_DIR)) {
    console.error(`❌ Le dossier de sortie ${SCRAPING_OUTPUT_DIR} n'existe pas.`);
    return;
  }
  
  // Créer le dossier d'export s'il n'existe pas
  fs.ensureDirSync(CLOUDFLARE_EXPORT_DIR);
  
  // Lister tous les fichiers JSON dans le dossier de sortie
  const jsonFiles = fs.readdirSync(SCRAPING_OUTPUT_DIR).filter(file => file.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.error('❌ Aucun fichier JSON trouvé dans le dossier de sortie.');
    return;
  }
  
  console.log(`📋 ${jsonFiles.length} fichiers JSON trouvés dans le dossier de sortie.`);
  
  // Traiter chaque fichier JSON
  let successCount = 0;
  let failureCount = 0;
  
  // Créer un fichier d'instructions
  let instructions = `# Instructions pour importer les données dans Cloudflare Workers KV\n\n`;
  instructions += `Date de préparation: ${new Date().toLocaleString('fr-FR')}\n\n`;
  instructions += `## Étapes à suivre:\n\n`;
  instructions += `1. Connectez-vous à votre compte Cloudflare: https://dash.cloudflare.com\n`;
  instructions += `2. Allez dans Workers & Pages > KV\n`;
  instructions += `3. Sélectionnez le namespace "FLODRAMA_METADATA"\n`;
  instructions += `4. Pour chaque fichier ci-dessous, cliquez sur "Add entry" et:\n`;
  instructions += `   - Dans le champ "Key", entrez le nom de la clé (sans .json)\n`;
  instructions += `   - Sélectionnez "Text" comme type de valeur\n`;
  instructions += `   - Copiez-collez le contenu du fichier JSON correspondant\n`;
  instructions += `   - Cliquez sur "Save"\n\n`;
  instructions += `## Fichiers à importer:\n\n`;
  
  for (const jsonFile of jsonFiles) {
    const filePath = path.join(SCRAPING_OUTPUT_DIR, jsonFile);
    const key = jsonFile.replace('.json', '');
    const exportPath = path.join(CLOUDFLARE_EXPORT_DIR, jsonFile);
    
    console.log(`📝 Traitement de ${jsonFile}...`);
    
    // Nettoyer et valider le JSON
    const { valid, data } = cleanAndValidateJson(filePath);
    
    if (valid && data) {
      // Écrire le fichier JSON nettoyé
      fs.writeJsonSync(exportPath, data, { spaces: 2 });
      
      const fileSize = fs.statSync(exportPath).size;
      const fileSizeFormatted = formatFileSize(fileSize);
      
      console.log(`✅ Fichier ${jsonFile} préparé avec succès (${fileSizeFormatted})`);
      
      // Ajouter aux instructions
      instructions += `- **${key}**: ${fileSizeFormatted}\n`;
      
      successCount++;
    } else {
      console.log(`❌ Impossible de préparer le fichier ${jsonFile}`);
      failureCount++;
    }
  }
  
  // Ajouter des instructions supplémentaires
  instructions += `\n## Après l'importation:\n\n`;
  instructions += `1. Vérifiez que toutes les clés ont été importées correctement\n`;
  instructions += `2. Testez l'application FloDrama pour vous assurer que les données sont accessibles\n`;
  
  // Écrire le fichier d'instructions
  fs.writeFileSync(path.join(CLOUDFLARE_EXPORT_DIR, 'INSTRUCTIONS.md'), instructions);
  
  // Créer un fichier README
  let readme = `# Données FloDrama pour Cloudflare KV\n\n`;
  readme += `Ce dossier contient les données scrapées préparées pour être importées dans Cloudflare Workers KV.\n\n`;
  readme += `## Contenu:\n\n`;
  readme += `- ${successCount} fichiers JSON nettoyés et validés\n`;
  readme += `- 1 fichier d'instructions (INSTRUCTIONS.md)\n\n`;
  readme += `## Date de préparation:\n\n`;
  readme += `${new Date().toLocaleString('fr-FR')}\n`;
  
  fs.writeFileSync(path.join(CLOUDFLARE_EXPORT_DIR, 'README.md'), readme);
  
  // Afficher le résumé
  console.log(`\n📊 Résumé de la préparation:`);
  console.log(`  - Total: ${jsonFiles.length} fichiers`);
  console.log(`  - Succès: ${successCount} fichiers`);
  console.log(`  - Échecs: ${failureCount} fichiers`);
  
  console.log(`\n✅ Les fichiers préparés sont disponibles dans: ${CLOUDFLARE_EXPORT_DIR}`);
  console.log(`📄 Consultez le fichier INSTRUCTIONS.md pour savoir comment importer les données dans Cloudflare KV.`);
}

// Exécuter la fonction principale
prepareDataForCloudflare();
