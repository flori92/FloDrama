/**
 * Script d'exécution pour l'extracteur de nouvelle génération
 * Implémente une interface CLI pour l'extraction robuste de contenu
 * Développé le 2025-05-12
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractStreamingWithDomainRotation } = require('./next-gen-extractor');
const sourcesConfig = require('./sources-config');

// Configuration du programme CLI
program
  .name('run-next-gen-extractor')
  .description('Extracteur de streaming nouvelle génération pour FloDrama')
  .version('1.0.0')
  .option('-s, --source <source>', 'Source de streaming à extraire (ex: dramacool)')
  .option('-c, --category <category>', 'Catégorie de contenu (dramas, animes, films, bollywood)')
  .option('-l, --limit <number>', 'Limite de contenus à extraire', parseInt)
  .option('-o, --output <directory>', 'Dossier de sortie pour les résultats')
  .option('-t, --test <url>', 'URL de test spécifique à extraire')
  .option('-v, --verbose', 'Mode verbeux pour le débogage')
  .parse(process.argv);

// Récupérer les options
const options = program.opts();

// Validation des options
if (!options.source) {
  console.error('❌ Erreur: Source non spécifiée. Utilisez --source ou -s.');
  process.exit(1);
}

if (!options.category) {
  console.error('❌ Erreur: Catégorie non spécifiée. Utilisez --category ou -c.');
  process.exit(1);
}

if (!options.limit || isNaN(options.limit) || options.limit <= 0) {
  options.limit = 100; // Valeur par défaut
  console.warn('⚠️ Limite non valide, utilisation de la valeur par défaut: 100');
}

if (!options.output) {
  options.output = path.join(__dirname, '../extraction-robuste', options.category, options.source);
  console.warn(`⚠️ Dossier de sortie non spécifié, utilisation du chemin par défaut: ${options.output}`);
}

// S'assurer que le dossier de sortie existe
if (!fs.existsSync(options.output)) {
  fs.mkdirSync(options.output, { recursive: true });
}

// Vérifier si la source est configurée
if (!sourcesConfig[options.source]) {
  console.error(`❌ Erreur: Source "${options.source}" non configurée.`);
  process.exit(1);
}

// Fonction pour obtenir les URLs de contenu à extraire
async function getContentUrls(source, category, limit) {
  // En mode test, utiliser l'URL de test de la configuration
  if (options.test) {
    console.log(`🔍 Mode test: extraction uniquement de l'URL ${options.test}`);
    return [options.test];
  }
  
  // En production, générer une liste d'URLs basée sur le site source
  const sourceConfig = sourcesConfig[source];
  
  // Utiliser les URLs de test de la configuration comme point de départ
  const testUrl = sourceConfig.testUrl;
  
  if (!testUrl) {
    throw new Error(`Aucune URL de test trouvée pour la source ${source}`);
  }
  
  console.log(`🔍 Utilisation de l'URL de test comme modèle: ${testUrl}`);
  
  // Pour l'instant, nous utilisons simplement l'URL de test
  // Dans une implémentation complète, nous pourrions crawler le site pour trouver des URLs
  return [testUrl];
}

// Fonction principale pour extraire le contenu
async function extractContent() {
  try {
    console.log(`🚀 Début de l'extraction pour ${options.source} (catégorie: ${options.category}, limite: ${options.limit})`);
    
    // Obtenir les URLs à extraire
    const urls = await getContentUrls(options.source, options.category, options.limit);
    
    // Statistiques d'extraction
    let successful = 0;
    let failed = 0;
    
    // Traiter chaque URL
    for (const url of urls) {
      try {
        console.log(`🌐 Traitement de l'URL: ${url}`);
        
        // Génération d'un ID unique pour cette extraction
        const contentId = `${options.source}_${uuidv4().substring(0, 8)}`;
        
        // Extraction avec rotation de domaines
        const streamingInfo = await extractStreamingWithDomainRotation(url, contentId);
        
        if (streamingInfo && streamingInfo.streaming_url) {
          // Sauvegarde des informations
          const outputFile = path.join(options.output, `${contentId}.json`);
          fs.writeFileSync(outputFile, JSON.stringify(streamingInfo, null, 2));
          
          console.log(`✅ URL de streaming extraite avec succès: ${outputFile}`);
          successful++;
        } else {
          console.error(`❌ Impossible d'extraire l'URL de streaming pour ${url}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${url}: ${error.message}`);
        failed++;
      }
    }
    
    // Résumé de l'extraction
    console.log('\n📊 Résumé de l\'extraction:');
    console.log(`✅ URLs extraites avec succès: ${successful}`);
    console.log(`❌ URLs en échec: ${failed}`);
    console.log(`📁 Résultats sauvegardés dans: ${options.output}`);
    
    // Sortie avec code approprié
    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error(`❌ Erreur globale: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Démarrer l'extraction
extractContent().catch(error => {
  console.error(`💥 Exception non gérée: ${error.message}`);
  if (options.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});
