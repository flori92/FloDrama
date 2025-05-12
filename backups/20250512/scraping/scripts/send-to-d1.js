/**
 * Script pour envoyer les données scrapées vers Cloudflare D1
 * Ce script prend les fichiers JSON générés par le scraper et les envoie vers la base de données Cloudflare D1
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const D1_DATABASE_NAME = 'flodrama-db';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '42fc982266a2c31b942593b18097e4b3';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'H1ITLGJaq4ZwAh57Y5tOSNdlL8pfXiHNQp8Zz40E';

// Récupération des arguments
const args = process.argv.slice(2);
const inputArg = args.find(arg => arg.startsWith('--input='));
const inputPath = inputArg ? inputArg.split('=')[1] : '../scraping-results';
const remoteArg = args.find(arg => arg === '--remote');
const isRemote = remoteArg !== undefined;
const dryRunArg = args.find(arg => arg === '--dry-run');
const isDryRun = dryRunArg !== undefined;

// Vérification du dossier d'entrée
if (!fs.existsSync(inputPath)) {
  console.error(`Erreur: Le dossier ${inputPath} n'existe pas`);
  process.exit(1);
}

// Fonction pour envoyer une requête HTTP
async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Fonction pour générer une requête SQL d'insertion
function generateInsertQuery(tableName, items) {
  if (!items || items.length === 0) {
    return null;
  }
  
  // Récupérer les champs du premier élément
  const firstItem = items[0];
  const fields = Object.keys(firstItem).filter(key => 
    typeof firstItem[key] !== 'object' || firstItem[key] === null
  );
  
  // Générer la requête SQL
  let query = `INSERT OR REPLACE INTO ${tableName} (${fields.join(', ')}) VALUES\n`;
  
  // Ajouter les valeurs pour chaque élément
  const values = items.map(item => {
    const itemValues = fields.map(field => {
      const value = item[field];
      if (value === null || value === undefined) {
        return 'NULL';
      } else if (typeof value === 'string') {
        // Échapper les apostrophes
        return `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'number') {
        return value;
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }
    });
    return `(${itemValues.join(', ')})`;
  }).join(',\n');
  
  query += values;
  
  return query;
}

// Fonction pour exécuter une requête SQL sur Cloudflare D1
async function executeD1Query(query, databaseName) {
  if (isDryRun) {
    console.log('Mode dry-run, la requête SQL ne sera pas exécutée');
    console.log('Requête SQL:');
    console.log(query);
    return { success: true, dry_run: true };
  }
  
  // Écrire la requête dans un fichier temporaire
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const sqlFile = path.join(tempDir, `insert_${Date.now()}.sql`);
  fs.writeFileSync(sqlFile, query);
  
  try {
    // Construire la commande wrangler
    let command = `npx wrangler d1 execute ${databaseName} --file=${sqlFile}`;
    
    // Ajouter le flag --remote si nécessaire
    if (isRemote) {
      command += ' --remote';
    }
    
    console.log(`Exécution de la commande: ${command}`);
    
    // Exécuter la commande
    const output = execSync(command, { 
      cwd: __dirname,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    console.log('Résultat de la commande:');
    console.log(output);
    
    return { success: true, output };
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la requête SQL: ${error.message}`);
    if (error.stdout) {
      console.error('Sortie standard:');
      console.error(error.stdout);
    }
    if (error.stderr) {
      console.error('Sortie d\'erreur:');
      console.error(error.stderr);
    }
    return { success: false, error: error.message };
  } finally {
    // Supprimer le fichier temporaire
    try {
      fs.unlinkSync(sqlFile);
    } catch (error) {
      console.warn(`Impossible de supprimer le fichier temporaire ${sqlFile}: ${error.message}`);
    }
  }
}

// Fonction pour traiter un fichier JSON
async function processJsonFile(filePath) {
  console.log(`Traitement du fichier: ${filePath}`);
  
  try {
    // Lire le fichier JSON
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Vérifier si le fichier contient des données
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn(`Le fichier ${filePath} ne contient pas de données valides`);
      return { success: false, error: 'Données invalides' };
    }
    
    // Déterminer le type de contenu
    let contentType = data.content_type;
    if (!contentType && data.data[0]) {
      contentType = data.data[0].content_type;
    }
    if (!contentType && filePath.includes('_')) {
      // Essayer de déterminer le type à partir du nom de fichier
      const sourceName = path.basename(filePath).split('_')[0];
      if (sourceName === 'voiranime' || sourceName === 'animesama' || sourceName === 'nekosama') {
        contentType = 'anime';
      } else if (sourceName === 'voirdrama' || sourceName === 'dramavostfr' || sourceName === 'mydramalist' || sourceName === 'asianwiki') {
        contentType = 'drama';
      } else if (sourceName === 'vostfree') {
        contentType = 'film';
      }
    }
    
    if (!contentType) {
      console.warn(`Impossible de déterminer le type de contenu pour ${filePath}`);
      return { success: false, error: 'Type de contenu inconnu' };
    }
    
    // Déterminer la table cible
    let tableName;
    switch (contentType.toLowerCase()) {
      case 'drama':
        tableName = 'dramas';
        break;
      case 'anime':
        tableName = 'animes';
        break;
      case 'film':
      case 'movie':
        tableName = 'films';
        break;
      case 'bollywood':
        tableName = 'bollywood';
        break;
      default:
        console.warn(`Type de contenu non pris en charge: ${contentType}`);
        return { success: false, error: `Type de contenu non pris en charge: ${contentType}` };
    }
    
    // Préparer les données pour l'insertion
    const items = data.data.map(item => {
      // Générer un ID unique si nécessaire
      if (!item.id) {
        const sourceName = data.source || path.basename(filePath).split('_')[0];
        const titleSlug = (item.title || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        item.id = `${sourceName}_${titleSlug}_${Date.now()}`;
      }
      
      // Ajouter des champs obligatoires
      if (!item.created_at) {
        item.created_at = new Date().toISOString();
      }
      if (!item.updated_at) {
        item.updated_at = new Date().toISOString();
      }
      
      // Normaliser les champs
      if (item.poster_path && !item.poster) {
        item.poster = item.poster_path;
        delete item.poster_path;
      }
      if (item.backdrop_path && !item.backdrop) {
        item.backdrop = item.backdrop_path;
        delete item.backdrop_path;
      }
      
      // Ajouter le type de contenu si manquant
      if (!item.content_type) {
        item.content_type = contentType.toLowerCase();
      }
      
      return item;
    });
    
    // Générer la requête SQL
    const query = generateInsertQuery(tableName, items);
    if (!query) {
      console.warn(`Impossible de générer une requête SQL pour ${filePath}`);
      return { success: false, error: 'Génération de requête SQL impossible' };
    }
    
    // Exécuter la requête SQL
    console.log(`Envoi de ${items.length} éléments vers la table ${tableName}`);
    const result = await executeD1Query(query, D1_DATABASE_NAME);
    
    // Enregistrer le résultat dans un fichier de log
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `d1_import_${tableName}_${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      file: filePath,
      table: tableName,
      items_count: items.length,
      result
    }, null, 2));
    
    // Enregistrer également un log dans le dossier de résultats
    const summaryFile = path.join(path.dirname(filePath), `d1_import_${path.basename(filePath)}`);
    fs.writeFileSync(summaryFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      file: filePath,
      table: tableName,
      items_count: items.length,
      result
    }, null, 2));
    
    return result;
  } catch (error) {
    console.error(`Erreur lors du traitement du fichier ${filePath}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function main() {
  console.log(`Démarrage de l'envoi des données vers Cloudflare D1 à ${new Date().toISOString()}`);
  console.log(`Mode: ${isRemote ? 'Remote' : 'Local'}`);
  console.log(`Dry-run: ${isDryRun ? 'Oui' : 'Non'}`);
  
  // Récupérer tous les fichiers JSON du dossier d'entrée
  const files = fs.readdirSync(inputPath)
    .filter(file => file.endsWith('.json') && !file.includes('summary') && !file.includes('d1_import'))
    .map(file => path.join(inputPath, file));
  
  console.log(`${files.length} fichiers JSON trouvés dans ${inputPath}`);
  
  // Traiter chaque fichier
  const results = [];
  for (const file of files) {
    const result = await processJsonFile(file);
    results.push({
      file,
      success: result.success,
      error: result.error
    });
  }
  
  // Afficher le résumé
  console.log('\n=== Résumé de l\'envoi des données ===');
  console.log(`Fichiers traités: ${results.length}`);
  console.log(`Succès: ${results.filter(r => r.success).length}`);
  console.log(`Échecs: ${results.filter(r => !r.success).length}`);
  
  // Détails des échecs
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\nDétails des échecs:');
    failures.forEach(failure => {
      console.log(`- ${path.basename(failure.file)}: ${failure.error}`);
    });
  }
  
  // Écrire le résumé dans un fichier
  const summaryFile = path.join(inputPath, `d1_import_summary_${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    mode: isRemote ? 'remote' : 'local',
    dry_run: isDryRun,
    files_count: files.length,
    success_count: results.filter(r => r.success).length,
    failure_count: results.filter(r => !r.success).length,
    results
  }, null, 2));
  
  console.log(`\nRésumé sauvegardé dans: ${summaryFile}`);
  
  // Retourner un code d'erreur si tous les fichiers ont échoué
  if (results.length > 0 && results.every(r => !r.success)) {
    console.error('Tous les fichiers ont échoué');
    process.exit(1);
  }
}

// Exécution du script
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
