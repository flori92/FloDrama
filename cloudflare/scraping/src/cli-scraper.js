/**
 * Interface en ligne de commande pour les scrapers FloDrama
 * Ce script permet d'exécuter les scrapers depuis la ligne de commande ou GitHub Actions
 * sans avoir besoin de déployer un Worker Cloudflare.
 */

const { VoirDramaScraper } = require('./drama-scrapers');
const { MyDramaListScraper } = require('./metadata-scrapers');
const { VoirAnimeScraper, AnimeSamaScraper } = require('./anime-scrapers');
const { DramaVostfrScraper } = require('./drama-scrapers');
const fs = require('fs');
const path = require('path');

// Récupération des arguments de la ligne de commande
const args = process.argv.slice(2);
const sourceArg = args.find(arg => arg.startsWith('--source='));
const source = sourceArg ? sourceArg.split('=')[1] : null;
const outputArg = args.find(arg => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.split('=')[1] : './scraping-results';

// Vérification des arguments
if (!source) {
  console.error('Erreur: Veuillez spécifier une source avec --source=<nom_source>');
  console.error('Sources disponibles: voirdrama, mydramalist, voiranime, dramavostfr, animesama');
  process.exit(1);
}

// Création du dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Fonction pour sauvegarder les résultats
async function saveResults(results, sourceName) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = path.join(outputPath, `${sourceName}_${timestamp}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`Résultats sauvegardés dans ${filename}`);
}

// Fonction principale
async function main() {
  console.log(`Démarrage du scraping pour la source: ${source}`);
  let scraper;
  let results;

  try {
    switch (source.toLowerCase()) {
      case 'voirdrama':
        scraper = new VoirDramaScraper(true);
        results = await scraper.scrapeLatestContent();
        break;
      
      case 'mydramalist':
        scraper = new MyDramaListScraper(true);
        results = await scraper.scrapeTopDramas();
        break;
      
      case 'voiranime':
        scraper = new VoirAnimeScraper(true);
        results = await scraper.scrapeLatestContent();
        break;
      
      case 'dramavostfr':
        scraper = new DramaVostfrScraper(true);
        results = await scraper.scrapeLatestContent();
        break;
      
      case 'animesama':
        scraper = new AnimeSamaScraper(true);
        results = await scraper.scrapeLatestContent();
        break;
      
      default:
        console.error(`Erreur: Source non reconnue: ${source}`);
        console.error('Sources disponibles: voirdrama, mydramalist, voiranime, dramavostfr, animesama');
        process.exit(1);
    }

    if (results && results.length > 0) {
      console.log(`${results.length} éléments récupérés depuis ${source}`);
      await saveResults(results, source);
      console.log(`Scraping de ${source} terminé avec succès`);
    } else {
      console.warn(`Aucun résultat obtenu pour ${source}`);
    }
  } catch (error) {
    console.error(`Erreur lors du scraping de ${source}:`, error);
    process.exit(1);
  }
}

// Exécution du script
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
