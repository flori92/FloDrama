/**
 * Script pour convertir les fichiers JSON au format attendu par send-to-d1.js
 * Ce script prend les fichiers JSON générés par le scraper et les convertit au format attendu
 */

const fs = require('fs');
const path = require('path');

// Configuration
const inputPath = process.argv[2] || '../scraping-results';
const outputPath = process.argv[3] || '../scraping-results-converted';

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Fonction pour déterminer le type de contenu en fonction du nom de fichier
function getContentType(filename) {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('drama') || lowerFilename.includes('asianwiki')) {
    return 'drama';
  } else if (lowerFilename.includes('anime')) {
    return 'anime';
  } else if (lowerFilename.includes('film') || lowerFilename.includes('movie') || 
             lowerFilename.includes('streaming') || lowerFilename.includes('vostfree')) {
    return 'movie';
  } else if (lowerFilename.includes('bolly') || lowerFilename.includes('hindi')) {
    return 'bollywood';
  }
  
  return 'unknown';
}

// Fonction pour extraire le nom de la source à partir du nom de fichier
function getSourceName(filename) {
  // Le format attendu est source_timestamp.json
  const parts = filename.split('_');
  if (parts.length >= 1) {
    return parts[0];
  }
  return 'unknown';
}

// Fonction pour convertir un fichier JSON
function convertJsonFile(filePath) {
  try {
    // Lire le fichier
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    // Essayer de parser le JSON
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Erreur lors du parsing du fichier ${filename}: ${error.message}`);
      return false;
    }
    
    // Vérifier si le fichier est déjà au format attendu
    if (data && typeof data === 'object' && !Array.isArray(data) && data.data) {
      console.log(`Le fichier ${filename} est déjà au format attendu`);
      // Copier le fichier tel quel
      fs.copyFileSync(filePath, path.join(outputPath, filename));
      return true;
    }
    
    // Vérifier si le fichier contient un tableau d'objets
    if (Array.isArray(data) && data.length > 0) {
      // Extraire le nom de la source et le timestamp du nom de fichier
      const sourceName = getSourceName(filename);
      const timestamp = new Date().toISOString();
      const contentType = getContentType(filename);
      
      // Créer l'objet au format attendu
      const convertedData = {
        source: sourceName,
        timestamp: timestamp,
        count: data.length,
        data: data,
        is_mock: false,
        content_type: contentType
      };
      
      // Écrire le fichier converti
      fs.writeFileSync(
        path.join(outputPath, filename),
        JSON.stringify(convertedData, null, 2)
      );
      
      console.log(`Fichier ${filename} converti avec succès (${data.length} éléments)`);
      return true;
    }
    
    console.warn(`Le fichier ${filename} ne contient pas de données valides`);
    return false;
  } catch (error) {
    console.error(`Erreur lors de la conversion du fichier ${filePath}: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log(`Démarrage de la conversion des fichiers JSON à ${new Date().toISOString()}`);
  console.log(`Dossier d'entrée: ${inputPath}`);
  console.log(`Dossier de sortie: ${outputPath}`);
  
  // Récupérer tous les fichiers JSON du dossier d'entrée
  const files = fs.readdirSync(inputPath)
    .filter(file => file.endsWith('.json') && !file.includes('summary') && !file.includes('d1_import'))
    .map(file => path.join(inputPath, file));
  
  console.log(`${files.length} fichiers JSON trouvés dans ${inputPath}`);
  
  // Convertir chaque fichier
  let successCount = 0;
  let failureCount = 0;
  
  for (const file of files) {
    const success = convertJsonFile(file);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  // Afficher le résumé
  console.log('\n=== Résumé de la conversion ===');
  console.log(`Fichiers traités: ${files.length}`);
  console.log(`Succès: ${successCount}`);
  console.log(`Échecs: ${failureCount}`);
  
  // Écrire le résumé dans un fichier
  const summaryFile = path.join(outputPath, `conversion_summary_${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    files_count: files.length,
    success_count: successCount,
    failure_count: failureCount
  }, null, 2));
  
  console.log(`\nRésumé sauvegardé dans: ${summaryFile}`);
}

// Exécution du script
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
