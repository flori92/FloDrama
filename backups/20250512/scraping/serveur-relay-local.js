/**
 * Serveur de relais local pour le scraping FloDrama
 * 
 * Ce script permet de lancer un serveur local qui simule le service Render
 * pour tester le scraping sans dépendre du service distant.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const API_KEY = process.env.API_KEY || 'rnd_DJfpQC9gEu4KgTRvX8iQzMXxrteP';
const OUTPUT_DIR = path.join(__dirname, 'relay-output');

// Middleware pour l'authentification
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token !== API_KEY) {
    return res.status(403).json({ error: 'Clé API invalide' });
  }
  
  next();
};

// Configuration de l'application
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Créer le dossier de sortie s'il n'existe pas
fs.ensureDirSync(OUTPUT_DIR);

// Route pour vérifier le statut du service
app.get('/status', authenticate, (req, res) => {
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);
  
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: uptimeFormatted,
    mode: 'local'
  });
});

// Route pour lister les sources supportées
app.get('/sources', authenticate, (req, res) => {
  res.json({
    sources: [
      'allocine-films',
      'allocine-series',
      'senscritique-films',
      'senscritique-series',
      'imdb-films',
      'imdb-series',
      'tmdb-films',
      'tmdb-series'
    ]
  });
});

// Route principale pour le scraping
app.post('/scrape', authenticate, (req, res) => {
  // Répondre immédiatement pour éviter les timeouts
  res.status(202).json({
    status: 'processing',
    message: 'Requête de scraping acceptée et en cours de traitement',
    requestId: Date.now().toString(36) + Math.random().toString(36).substring(2)
  });
  
  // Traiter la requête en arrière-plan
  processScrapingRequest(req.body);
});

// Fonction pour traiter les requêtes de scraping en arrière-plan
async function processScrapingRequest(body) {
  const startTime = Date.now();
  const { source, type, urls, selectors, pagination, minItems } = body;
  
  if (!source || !urls || !Array.isArray(urls) || urls.length === 0) {
    console.error(`❌ Paramètres invalides pour la source ${source}`);
    return;
  }
  
  console.log(`📌 Démarrage du scraping local pour ${source} (${type || 'inconnu'})`);
  console.log(`🔗 URLs: ${urls.join(', ')}`);
  
  try {
    // Créer un dossier temporaire pour les résultats
    const tempOutputDir = path.join(OUTPUT_DIR, source);
    fs.ensureDirSync(tempOutputDir);
    
    // Créer un fichier de configuration pour le scraping
    const configFile = path.join(tempOutputDir, 'config.json');
    fs.writeJsonSync(configFile, {
      source,
      type,
      urls,
      selectors,
      pagination,
      minItems,
      timestamp: new Date().toISOString()
    }, { spaces: 2 });
    
    // Générer directement des données fictives pour les tests
    // Cela permet d'éviter les timeouts et de tester rapidement l'intégration
    console.log(`✨ Génération de données fictives pour ${source}`);
    const results = generateMockData(source, type, 10);
    fs.writeJsonSync(path.join(tempOutputDir, `${source}.json`), results, { spaces: 2 });
    
    // Copier les résultats vers le dossier de sortie de FloDrama
    const flodramaOutputDir = path.join(__dirname, 'output');
    fs.ensureDirSync(flodramaOutputDir);
    fs.writeJsonSync(path.join(flodramaOutputDir, `${source}.json`), results, { spaces: 2 });
    
    // Mettre à jour le fichier global.json
    updateGlobalJson(results, type);
    
    console.log(`✅ Traitement terminé pour ${source} en ${(Date.now() - startTime) / 1000}s`);
  } catch (error) {
    console.error(`⚠️ Erreur lors du traitement de ${source}: ${error.message}`);
  }
}
    
    // Lire les résultats
    let results = [];
    try {
      const resultFiles = fs.readdirSync(tempOutputDir).filter(file => file.endsWith('.json') && file !== 'config.json');
      
      if (resultFiles.length > 0) {
        for (const file of resultFiles) {
          const filePath = path.join(tempOutputDir, file);
          const fileContent = fs.readJsonSync(filePath);
          
          if (Array.isArray(fileContent)) {
            results = results.concat(fileContent);
          }
        }
      } else {
        // Si aucun résultat n'a été généré, créer des données factices pour les tests
        console.log('⚠️ Aucun résultat généré, création de données factices pour les tests');
        results = generateMockData(source, type, 10);
        fs.writeJsonSync(path.join(tempOutputDir, `${source}-mock.json`), results, { spaces: 2 });
      }
    } catch (error) {
      console.error(`⚠️ Erreur lors de la lecture des résultats: ${error.message}`);
      results = generateMockData(source, type, 5);
    }
    
    // Calculer le temps d'exécution
    const executionTime = (Date.now() - startTime) / 1000;
    
    // Envoyer les résultats
    res.json({
      source,
      type,
      items: results,
      count: results.length,
      execution_time: executionTime,
      timestamp: new Date().toISOString(),
      mode: 'local'
    });
    
    console.log(`✅ Scraping local terminé en ${executionTime.toFixed(2)}s - ${results.length} éléments récupérés`);
  } catch (error) {
    console.error(`❌ Erreur lors du scraping local: ${error.message}`);
    res.status(500).json({
      error: 'Erreur lors du scraping local',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Fonction pour générer des données factices pour les tests
function generateMockData(source, type, count) {
  const results = [];
  
  for (let i = 0; i < count; i++) {
    results.push({
      id: `mock-${source}-${i}`,
      title: `Titre de test ${i + 1} pour ${source}`,
      original_title: `Test Title ${i + 1} for ${source}`,
      description: `Ceci est une description générée automatiquement pour le test ${i + 1} de la source ${source}.`,
      poster_url: `https://via.placeholder.com/300x450.png?text=${encodeURIComponent(source)}`,
      rating: (Math.random() * 5).toFixed(1),
      year: 2020 + Math.floor(Math.random() * 5),
      source,
      type,
      url: `https://example.com/${source}/${i + 1}`
    });
  }
  
  return results;
}

// Fonction pour formater le temps d'uptime
function formatUptime(uptime) {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}j ${hours}h ${minutes}m ${seconds}s`;
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de relais local FloDrama démarré sur le port ${PORT}`);
  console.log(`📅 Date de démarrage: ${new Date().toISOString()}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🔑 Clé API: ${API_KEY}`);
  console.log(`\n📋 Commandes pour tester le serveur:`);
  console.log(`curl -H "Authorization: Bearer ${API_KEY}" http://localhost:${PORT}/status`);
  console.log(`curl -H "Authorization: Bearer ${API_KEY}" http://localhost:${PORT}/sources`);
});
