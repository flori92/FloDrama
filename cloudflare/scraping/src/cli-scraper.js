/**
 * Interface en ligne de commande pour les scrapers FloDrama
 * Ce script permet d'exécuter les scrapers depuis la ligne de commande ou GitHub Actions
 * pour récupérer des données réelles des sources et les envoyer à Cloudflare.
 */

// Conversion des imports ES modules en require pour Node.js standard
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration des sources et scrapers
const SOURCES = {
  mydramalist: {
    name: 'MyDramaList',
    baseUrl: 'https://mydramalist.com',
    contentType: 'drama'
  },
  voiranime: {
    name: 'VoirAnime',
    baseUrl: 'https://v6.voiranime.com',
    contentType: 'anime'
  },
  voirdrama: {
    name: 'VoirDrama',
    baseUrl: 'https://voirdrama.org',
    contentType: 'drama'
  },
  dramavostfr: {
    name: 'DramaVostfr',
    baseUrl: 'https://dramavostfr.com',
    contentType: 'drama'
  },
  animesama: {
    name: 'AnimeSama',
    baseUrl: 'https://anime-sama.fr',
    contentType: 'anime'
  }
};

// Récupération des arguments de la ligne de commande
const args = process.argv.slice(2);
const sourceArg = args.find(arg => arg.startsWith('--source='));
const source = sourceArg ? sourceArg.split('=')[1] : null;
const outputArg = args.find(arg => arg.startsWith('--output='));
const outputPath = outputArg ? outputArg.split('=')[1] : './scraping-results';
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10;

// Vérification des arguments
if (!source) {
  console.error('Erreur: Veuillez spécifier une source avec --source=<nom_source>');
  console.error('Sources disponibles: ' + Object.keys(SOURCES).join(', '));
  process.exit(1);
}

// Vérification de la source
if (!SOURCES[source]) {
  console.error(`Erreur: Source non reconnue: ${source}`);
  console.error('Sources disponibles: ' + Object.keys(SOURCES).join(', '));
  process.exit(1);
}

// Création du dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Fonction pour effectuer une requête HTTP
async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Fonction pour scraper via le Worker Cloudflare
async function scrapeViaWorker(source) {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
  
  if (!workerUrl) {
    throw new Error('Variable d\'environnement CLOUDFLARE_WORKER_URL non définie');
  }
  
  console.log(`Utilisation du Worker Cloudflare: ${workerUrl}`);
  
  const url = new URL(workerUrl);
  url.searchParams.append('source', source);
  url.searchParams.append('limit', limit.toString());
  
  console.log(`Requête vers: ${url.toString()}`);
  
  try {
    const data = await fetchUrl(url.toString());
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erreur lors de la requête au Worker: ${error.message}`);
    throw error;
  }
}

// Fonction pour sauvegarder les résultats
async function saveResults(results, sourceName) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = path.join(outputPath, `${sourceName}_${timestamp}.json`);
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`Résultats sauvegardés dans ${filename}`);
  
  // Envoyer les résultats à Cloudflare si l'URL est définie
  if (process.env.CLOUDFLARE_API_URL) {
    try {
      console.log(`Envoi des résultats à Cloudflare: ${process.env.CLOUDFLARE_API_URL}`);
      // Code pour envoyer les résultats à Cloudflare via l'API
      // Cette partie peut être implémentée ultérieurement
    } catch (error) {
      console.error(`Erreur lors de l'envoi des résultats à Cloudflare: ${error.message}`);
    }
  }
}

// Fonction principale
async function main() {
  console.log(`Démarrage du scraping pour la source: ${source}`);
  console.log(`Source: ${SOURCES[source].name} (${SOURCES[source].contentType})`);
  console.log(`URL de base: ${SOURCES[source].baseUrl}`);
  
  try {
    // Utiliser le Worker Cloudflare pour effectuer le scraping
    const results = await scrapeViaWorker(source);
    
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
