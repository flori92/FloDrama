const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { generateCategoryFiles } = require('./generateCategoryFiles');

// Configuration
const SCRAPER_API_URLS = [
  process.env.SCRAPER_API_URL || 'https://flodrama-scraper.florifavi.workers.dev',
  'https://flodrama-cors-proxy.florifavi.workers.dev',
  'https://flodrama-api.florifavi.workers.dev'
];
const MIN_ITEMS_PER_SOURCE = parseInt(process.env.MIN_ITEMS_PER_SOURCE || '100');
const OUTPUT_DIR = process.env.OUTPUT_DIR || './Frontend/src/data/content';
const SOURCES = (process.env.SOURCES || 'vostfree,dramacool,myasiantv,voirdrama,viki,wetv,iqiyi,kocowa,gogoanime,voiranime,nekosama,bollywoodmdb,zee5,hotstar,mydramalist').split(',');
const RETRY_ATTEMPTS = parseInt(process.env.RETRY_ATTEMPTS || '5');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '3000');
const TIMEOUT = parseInt(process.env.TIMEOUT || '60000'); // 60 secondes par défaut
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
const PARALLEL_REQUESTS = parseInt(process.env.PARALLEL_REQUESTS || '3');
const REQUIRE_REAL_DATA = process.env.REQUIRE_REAL_DATA !== 'false'; // Par défaut, exiger des données réelles

// Configuration d'Axios avec timeout
axios.defaults.timeout = TIMEOUT;

// Ajouter les en-têtes pour éviter les blocages
axios.defaults.headers.common['User-Agent'] = 'FloDrama-GithubAction/2.0';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'FloDrama-Scraper';

// Activer le suivi des redirections
axios.defaults.maxRedirects = 5;
axios.defaults.validateStatus = status => status >= 200 && status < 500;

// Statistiques
let stats = {
  total_items: 0,
  real_items: 0,
  fallback_items: 0,
  mock_items: 0,
  sources_processed: 0,
  sources_failed: 0,
  apis_used: new Set(),
  categories: {},
  start_time: new Date(),
  end_time: null,
  duration_ms: 0
};

// Créer le répertoire de sortie s'il n'existe pas
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Fonction pour scraper une source avec retry et gestion d'erreurs améliorée
 * @param {string} source - Nom de la source à scraper
 * @returns {Promise<Array>} - Liste des éléments récupérés
 */
async function scrapeSource(source) {
  console.log(`Scraping de la source: ${source}`);
  
  // Vérifier si on doit utiliser des données mockées
  if (USE_MOCK_DATA) {
    console.log(`[${source}] Utilisation de données mockées (USE_MOCK_DATA=true)`);
    const mockItems = generateMockItems(source, MIN_ITEMS_PER_SOURCE);
    categorizeItems(mockItems, source);
    stats.total_items += mockItems.length;
    stats.mock_items += mockItems.length;
    stats.sources_processed++;
    return mockItems;
  }
  
  // Tentatives avec retry sur différentes APIs
  let lastError = null;
  let apiUrlsAttempted = 0;
  let currentApiUrlIndex = 0;
  
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    // Sélectionner l'URL de l'API à utiliser
    if (lastError && apiUrlsAttempted < SCRAPER_API_URLS.length) {
      currentApiUrlIndex = (currentApiUrlIndex + 1) % SCRAPER_API_URLS.length;
      apiUrlsAttempted++;
      console.log(`[${source}] Changement d'API: utilisation de ${SCRAPER_API_URLS[currentApiUrlIndex]}`);
    }
    
    const currentApiUrl = SCRAPER_API_URLS[currentApiUrlIndex];
    
    try {
      console.log(`[${source}] Tentative ${attempt}/${RETRY_ATTEMPTS} avec ${currentApiUrl}...`);
      
      // Vérifier si l'API est accessible avant de faire l'appel principal
      if (attempt === 1 || apiUrlsAttempted > 0) {
        try {
          // Ping l'API avec un timeout réduit pour vérifier sa disponibilité
          const healthResponse = await axios.get(`${currentApiUrl}/health`, { 
            timeout: 5000,
            validateStatus: status => status >= 200 && status < 600 // Accepter tous les codes de statut pour le diagnostic
          });
          
          if (healthResponse.status >= 200 && healthResponse.status < 300) {
            console.log(`[${source}] API ${currentApiUrl} accessible, procédant au scraping...`);
          } else {
            console.warn(`[${source}] API ${currentApiUrl} a répondu avec le statut ${healthResponse.status}`);
            // Continuer quand même, mais avec un avertissement
          }
        } catch (pingError) {
          console.warn(`[${source}] Avertissement: L'API ${currentApiUrl} semble inaccessible: ${pingError.message}`);
          // Essayer l'API suivante si disponible
          if (apiUrlsAttempted < SCRAPER_API_URLS.length) {
            continue;
          }
        }
      }
      
      // Déterminer si l'API est un proxy CORS ou une API complète
      const isCorsproxy = currentApiUrl.includes('cors-proxy');
      let response;
      
      if (isCorsproxy) {
        // Pour les proxies CORS, utiliser une URL avec paramètres
        const targetUrl = `${currentApiUrl}?url=https://flodrama-api.florifavi.workers.dev&source=${source}&limit=${MIN_ITEMS_PER_SOURCE}&timeout=${TIMEOUT/1000}&detailed=true&fallback=true`;
        console.log(`[${source}] Appel via proxy CORS: ${targetUrl}`);
        
        response = await axios.get(targetUrl, {
          headers: {
            'User-Agent': 'FloDrama-GithubAction/2.0',
            'Accept': 'application/json',
            'X-Requested-With': 'FloDrama-Scraper'
          }
        });
      } else {
        // Pour les APIs complètes, utiliser les paramètres de requête
        console.log(`[${source}] Appel direct à l'API: ${currentApiUrl}`);
        
        response = await axios.get(currentApiUrl, {
          params: {
            source: source,
            limit: MIN_ITEMS_PER_SOURCE,
            timeout: TIMEOUT / 1000, // Convertir en secondes pour l'API
            detailed: true, // Demander des données détaillées
            fallback: true // Autoriser les données de secours en cas d'échec
          },
          headers: {
            'User-Agent': 'FloDrama-GithubAction/2.0',
            'Accept': 'application/json',
            'X-Requested-With': 'FloDrama-Scraper'
          }
        });
      }
      
      // Analyse détaillée de la réponse
      if (response.data) {
        // Vérifier si la réponse contient des métadonnées (format API v2)
        const hasMetadata = response.data.metadata !== undefined;
        const results = hasMetadata ? response.data.results : response.data.results || response.data;
        
        if (Array.isArray(results)) {
          const items = results;
          const itemCount = items.length;
          const isFallback = hasMetadata && response.data.metadata.is_fallback === true;
          
          // Logs détaillés sur les données récupérées
          console.log(`[${source}] ${itemCount} éléments récupérés${isFallback ? ' (données de secours)' : ''} (minimum requis: ${MIN_ITEMS_PER_SOURCE})`);
          
          if (itemCount > 0) {
            console.log(`[${source}] Exemple de données: ${JSON.stringify(items[0].title || 'Titre inconnu')}`);
          }
          
          if (itemCount < MIN_ITEMS_PER_SOURCE) {
            console.warn(`[${source}] Attention: Nombre d'éléments insuffisant (${itemCount}/${MIN_ITEMS_PER_SOURCE})`);
          }
          
          // Vérifier la qualité des données
          const realItems = items.filter(item => !item.is_fallback && !item.is_mock);
          const fallbackItems = items.filter(item => item.is_fallback || item.is_mock);
          const missingFields = items.filter(item => !item.title || !item.id).length;
          
          if (missingFields > 0) {
            console.warn(`[${source}] Attention: ${missingFields} éléments ont des champs manquants`);
          }
          
          // Vérifier si on a des données réelles
          if (realItems.length === 0 && REQUIRE_REAL_DATA) {
            console.warn(`[${source}] Attention: Aucune donnée réelle reçue, uniquement des données de secours`);
            
            // Si on n'est pas à la dernière tentative, essayer une autre API
            if (attempt < RETRY_ATTEMPTS && apiUrlsAttempted < SCRAPER_API_URLS.length) {
              throw new Error(`Aucune donnée réelle reçue, tentative avec une autre API`);
            }
          }
          
          // Mettre à jour les statistiques
          stats.total_items += itemCount;
          stats.real_items += realItems.length;
          stats.fallback_items += fallbackItems.length;
          stats.sources_processed++;
          
          // Catégoriser les éléments
          categorizeItems(items, source);
          
          // Sauvegarder les logs détaillés
          saveScrapingLog(source, {
            timestamp: new Date().toISOString(),
            success: true,
            itemCount,
            realCount: realItems.length,
            fallbackCount: fallbackItems.length,
            minRequired: MIN_ITEMS_PER_SOURCE,
            missingFields,
            attempt,
            apiUrl: currentApiUrl,
            isFallback
          });
          
          return items;
        } else if (response.data.error) {
          throw new Error(`Erreur API: ${response.data.error}`);
        } else {
          throw new Error(`Format de réponse invalide: results n'est pas un tableau`);
        }
      } else {
        throw new Error(`Réponse vide de l'API`);
      }
    } catch (error) {
      lastError = error;
      console.error(`[${source}] Erreur (tentative ${attempt}/${RETRY_ATTEMPTS} avec ${currentApiUrl}):`, error.message);
      
      // Détails supplémentaires sur l'erreur
      if (error.response) {
        // Réponse du serveur avec code d'erreur
        console.error(`[${source}] Détails: Status ${error.response.status}, ${JSON.stringify(error.response.data || {})}`);
      } else if (error.request) {
        // Pas de réponse reçue
        console.error(`[${source}] Détails: Pas de réponse du serveur (timeout/réseau)`);
      }
      
      if (attempt < RETRY_ATTEMPTS) {
        // Attendre avant la prochaine tentative (backoff exponentiel)
        const delay = RETRY_DELAY * Math.pow(1.5, attempt - 1);
        console.log(`[${source}] Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  console.error(`[${source}] Échec après ${RETRY_ATTEMPTS} tentatives sur ${apiUrlsAttempted} APIs différentes`);
  stats.sources_failed++;
  
  // Sauvegarder les logs d'échec
  saveScrapingLog(source, {
    timestamp: new Date().toISOString(),
    success: false,
    error: lastError ? lastError.message : 'Erreur inconnue',
    attempts: RETRY_ATTEMPTS,
    apisAttempted: apiUrlsAttempted
  });
  
  // Générer des données de secours si nécessaire
  console.log(`[${source}] Génération de données de secours...`);
  const fallbackItems = generateMockItems(source, MIN_ITEMS_PER_SOURCE, true);
  categorizeItems(fallbackItems, source);
  stats.total_items += fallbackItems.length;
  stats.fallback_items += fallbackItems.length;
  
  return fallbackItems;
}

// Fonction pour catégoriser les éléments
function categorizeItems(items, source) {
  // Mapper les sources aux catégories
  const sourceCategories = {
    'vostfree': 'dramas',
    'dramacool': 'dramas',
    'myasiantv': 'dramas',
    'voirdrama': 'dramas',
    'viki': 'dramas',
    'wetv': 'dramas',
    'iqiyi': 'dramas',
    'kocowa': 'dramas',
    'gogoanime': 'animes',
    'voiranime': 'animes',
    'nekosama': 'animes',
    'bollywoodmdb': 'bollywood',
    'zee5': 'bollywood',
    'hotstar': 'bollywood',
    'mydramalist': 'metadata'
  };
  
  // Déterminer la catégorie en fonction de la source
  const category = sourceCategories[source] || 'unknown';
  
  // Mettre à jour les compteurs par catégorie
  if (category === 'dramas') {
    stats.dramas_count += items.length;
  }
  if (category === 'animes') {
    stats.animes_count += items.length;
  }
  if (category === 'films') {
    stats.films_count += items.length;
  }
  if (category === 'bollywood') {
    stats.bollywood_count += items.length;
  }
  
  // Sauvegarder les éléments dans le fichier correspondant à la source
  const outputFile = path.join(OUTPUT_DIR, `${source}.json`);
  fs.writeJsonSync(outputFile, { results: items }, { spaces: 2 });
  console.log(`Données sauvegardées dans ${outputFile}`);
}

/**
 * Divise un tableau en sous-tableaux de taille spécifiée
 * @param {Array} array - Tableau à diviser
 * @param {number} chunkSize - Taille des sous-tableaux
 * @returns {Array} - Tableau de sous-tableaux
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Formate une durée en millisecondes en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Durée formatée
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Génère un rapport HTML des statistiques de scraping
 * @param {Object} stats - Statistiques de scraping
 */
function generateHtmlReport(stats) {
  try {
    const reportPath = path.join(OUTPUT_DIR, 'logs', 'scraping-report.html');
    const realDataPercentage = Math.round(stats.real_items/stats.total_items*100) || 0;
    const fallbackPercentage = Math.round(stats.fallback_items/stats.total_items*100) || 0;
    const mockPercentage = Math.round(stats.mock_items/stats.total_items*100) || 0;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport de Scraping FloDrama</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    .card { background: #f9f9f9; border-radius: 5px; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .stat { display: flex; justify-content: space-between; margin: 5px 0; }
    .stat-label { font-weight: bold; }
    .progress-container { background: #eee; height: 20px; border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .progress-bar { height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; }
    .real { background: #2ecc71; }
    .fallback { background: #f39c12; }
    .mock { background: #e74c3c; }
    .sources { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .source-item { background: #fff; padding: 10px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .success { border-left: 4px solid #2ecc71; }
    .warning { border-left: 4px solid #f39c12; }
    .error { border-left: 4px solid #e74c3c; }
    .timestamp { color: #7f8c8d; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Rapport de Scraping FloDrama</h1>
  
  <div class="card">
    <h2>Résumé</h2>
    <div class="stat">
      <span class="stat-label">Date d'exécution:</span>
      <span>${new Date().toLocaleString('fr-FR')}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Durée totale:</span>
      <span>${stats.duration_formatted}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Total d'éléments:</span>
      <span>${stats.total_items}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Sources traitées:</span>
      <span>${stats.sources_processed}/${SOURCES.length}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Sources en échec:</span>
      <span>${stats.sources_failed}</span>
    </div>
  </div>
  
  <div class="card">
    <h2>Qualité des données</h2>
    <div class="stat">
      <span class="stat-label">Données réelles:</span>
      <span>${stats.real_items} (${realDataPercentage}%)</span>
    </div>
    <div class="progress-container">
      <div class="progress-bar real" style="width: ${realDataPercentage}%">${realDataPercentage}%</div>
    </div>
    
    <div class="stat">
      <span class="stat-label">Données de secours:</span>
      <span>${stats.fallback_items} (${fallbackPercentage}%)</span>
    </div>
    <div class="progress-container">
      <div class="progress-bar fallback" style="width: ${fallbackPercentage}%">${fallbackPercentage}%</div>
    </div>
    
    <div class="stat">
      <span class="stat-label">Données mockées:</span>
      <span>${stats.mock_items} (${mockPercentage}%)</span>
    </div>
    <div class="progress-container">
      <div class="progress-bar mock" style="width: ${mockPercentage}%">${mockPercentage}%</div>
    </div>
  </div>
  
  <div class="card">
    <h2>Répartition par catégorie</h2>
    ${Object.entries(stats.categories || {}).map(([category, count]) => `
      <div class="stat">
        <span class="stat-label">${category}:</span>
        <span>${count} éléments</span>
      </div>
    `).join('')}
  </div>
  
  <div class="card">
    <h2>APIs utilisées</h2>
    ${Array.from(stats.apis_used).map(api => `
      <div class="source-item success">
        <div>${api}</div>
      </div>
    `).join('')}
  </div>
  
  <div class="timestamp">Rapport généré le ${new Date().toLocaleString('fr-FR')}</div>
</body>
</html>`;
    
    fs.writeFileSync(reportPath, html);
    console.log(`Rapport HTML généré: ${reportPath}`);
  } catch (error) {
    console.error('Erreur lors de la génération du rapport HTML:', error.message);
  }
}

/**
 * Fonction principale pour exécuter le scraping sur toutes les sources
 */
async function runScraping() {
  console.log(`Démarrage du scraping pour ${SOURCES.length} sources...`);
  console.log(`Configuration:`);
  console.log(`- Minimum d'éléments par source: ${MIN_ITEMS_PER_SOURCE}`);
  console.log(`- Tentatives de retry: ${RETRY_ATTEMPTS}`);
  console.log(`- Délai entre tentatives: ${RETRY_DELAY}ms`);
  console.log(`- Timeout: ${TIMEOUT}ms`);
  console.log(`- Utilisation de données mockées: ${USE_MOCK_DATA ? 'Oui' : 'Non'}`);
  console.log(`- Exigence de données réelles: ${REQUIRE_REAL_DATA ? 'Oui' : 'Non'}`);
  console.log(`- Requêtes parallèles: ${PARALLEL_REQUESTS}`);
  console.log(`- APIs disponibles: ${SCRAPER_API_URLS.join(', ')}`);
  
  // Créer les répertoires de sortie
  fs.ensureDirSync(OUTPUT_DIR);
  fs.ensureDirSync(path.join(OUTPUT_DIR, 'logs'));
  
  // Vérifier la disponibilité des APIs avant de commencer
  console.log('\nVérification de la disponibilité des APIs...');
  for (const apiUrl of SCRAPER_API_URLS) {
    try {
      const response = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
      console.log(`- API ${apiUrl}: ${response.status === 200 ? 'Disponible ✅' : 'Problème ⚠️'} (${response.status})`);
      stats.apis_used.add(apiUrl);
    } catch (error) {
      console.log(`- API ${apiUrl}: Non disponible ❌ (${error.message})`);
    }
  }
  
  // Scraper les sources par lots parallèles
  console.log('\nDémarrage du scraping des sources...');
  const sourceChunks = chunkArray(SOURCES, PARALLEL_REQUESTS);
  
  for (const chunk of sourceChunks) {
    // Traiter chaque lot en parallèle
    await Promise.all(chunk.map(async (source) => {
      try {
        await scrapeSource(source);
      } catch (error) {
        console.error(`Erreur lors du scraping de ${source}:`, error);
        stats.sources_failed++;
      }
    }));
  }
  
  // Générer les fichiers par catégorie
  const categoryStats = await generateCategoryFiles(OUTPUT_DIR, MIN_ITEMS_PER_SOURCE);
  
  // Ajouter les statistiques des catégories aux statistiques globales
  stats.category_stats = categoryStats;
  
  // Calculer la durée totale
  stats.end_time = new Date();
  stats.duration_ms = stats.end_time - stats.start_time;
  stats.duration_formatted = formatDuration(stats.duration_ms);
  
  // Convertir le Set en array pour la sérialisation JSON
  stats.apis_used = Array.from(stats.apis_used);
  
  // Afficher les statistiques détaillées
  console.log('\n📊 Statistiques du scraping:');
  console.log(`⏱️ Durée totale: ${stats.duration_formatted}`);
  console.log(`📦 Total d'éléments: ${stats.total_items}`);
  console.log(`🌐 Éléments réels: ${stats.real_items} (${Math.round(stats.real_items/stats.total_items*100)}%)`);
  console.log(`⚠️ Éléments de secours: ${stats.fallback_items} (${Math.round(stats.fallback_items/stats.total_items*100)}%)`);
  console.log(`🔄 Éléments mockés: ${stats.mock_items} (${Math.round(stats.mock_items/stats.total_items*100)}%)`);
  console.log(`✅ Sources traitées: ${stats.sources_processed}/${SOURCES.length}`);
  console.log(`❌ Sources en échec: ${stats.sources_failed}`);
  console.log(`🔌 APIs utilisées: ${stats.apis_used.length}/${SCRAPER_API_URLS.length}`);
  
  // Afficher les statistiques par catégorie
  console.log('\n📂 Statistiques par catégorie:');
  for (const [category, count] of Object.entries(stats.categories)) {
    console.log(`- ${category}: ${count} éléments`);
  }
  
  // Sauvegarder les statistiques
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'logs', 'scraping-stats.json'),
    JSON.stringify(stats, null, 2)
  );
  
  // Générer un rapport HTML
  generateHtmlReport(stats);
  
  console.log('\n✨ Scraping terminé avec succès!');
  
  // Définir les outputs pour GitHub Actions
  const githubOutputFile = process.env.GITHUB_OUTPUT;
  if (githubOutputFile) {
    try {
      // Écrire les outputs dans le fichier d'environnement GitHub Actions
      const outputContent = [
        `total_items=${stats.total_items}`,
        `real_items=${stats.real_items}`,
        `fallback_items=${stats.fallback_items}`,
        `mock_items=${stats.mock_items}`,
        `sources_processed=${stats.sources_processed}`,
        `sources_failed=${stats.sources_failed}`,
        `real_data_percentage=${Math.round(stats.real_items/stats.total_items*100)}`,
        `scraping_success=${stats.sources_failed === 0 ? 'true' : 'false'}`,
        `duration=${stats.duration_ms}`
      ].join('\n');
      
      fs.appendFileSync(githubOutputFile, outputContent + '\n');
      console.log(`Outputs GitHub Actions définis avec succès.`);
    } catch (error) {
      console.error(`Erreur lors de la définition des outputs GitHub Actions:`, error.message);
    }
  } else {
    // Fallback pour les environnements locaux
    console.log(`total_items=${stats.total_items}`);
    console.log(`dramas_count=${stats.dramas_count}`);
    console.log(`animes_count=${stats.animes_count}`);
    console.log(`films_count=${stats.films_count}`);
    console.log(`bollywood_count=${stats.bollywood_count}`);
  }
  
  // Vérifier si on a suffisamment de données réelles
  const realDataPercentage = Math.round(stats.real_items/stats.total_items*100);
  if (realDataPercentage < 50 && REQUIRE_REAL_DATA) {
    console.warn(`\n AVERTISSEMENT: Seulement ${realDataPercentage}% des données sont réelles!`);
    console.warn(` AVERTISSEMENT: Vérifiez la configuration de l'API de scraping et les sources.`);
    
    if (realDataPercentage === 0) {
      console.error(`\n ERREUR CRITIQUE: Aucune donnée réelle n'a été récupérée!`);
      console.error(` ERREUR CRITIQUE: Le processus de distribution de contenu pourrait être compromis.`);
      process.exit(1); // Sortir avec un code d'erreur
    }
  }
}

/**
 * Génère des données mockées pour une source
 * @param {string} source - Nom de la source
 * @param {number} count - Nombre d'éléments à générer
 * @param {boolean} isFallback - Indique si c'est un fallback après échec
 * @returns {Array} - Liste des éléments générés
 */
function generateMockItems(source, count, isFallback = false) {
  console.log(`Génération de ${count} éléments mockés pour ${source}${isFallback ? ' (fallback)' : ''}`);
  
  // Déterminer la catégorie en fonction de la source
  const sourceCategories = {
    'vostfree': 'dramas',
    'dramacool': 'dramas',
    'myasiantv': 'dramas',
    'voirdrama': 'dramas',
    'viki': 'dramas',
    'wetv': 'dramas',
    'iqiyi': 'dramas',
    'kocowa': 'dramas',
    'gogoanime': 'animes',
    'voiranime': 'animes',
    'nekosama': 'animes',
    'bollywoodmdb': 'bollywood',
    'zee5': 'bollywood',
    'hotstar': 'bollywood',
    'mydramalist': 'metadata'
  };
  
  const category = sourceCategories[source] || 'unknown';
  const items = [];
  
  // Générer des titres plus réalistes en fonction de la catégorie
  const titlePrefixes = {
    'dramas': ['Korean', 'Chinese', 'Japanese', 'Thai', 'Taiwanese'],
    'animes': ['Shonen', 'Shojo', 'Seinen', 'Isekai', 'Mecha'],
    'bollywood': ['Bollywood', 'Indian', 'Mumbai', 'Delhi', 'Chennai'],
    'films': ['Asian', 'Korean', 'Chinese', 'Japanese', 'Thai'],
    'metadata': ['Info', 'Meta', 'Data', 'Review', 'Rating']
  };
  
  const titleSuffixes = {
    'dramas': ['Love', 'Story', 'Secret', 'Romance', 'Family', 'Doctor', 'Lawyer', 'Business'],
    'animes': ['Adventure', 'Quest', 'Ninja', 'Academy', 'Hero', 'Titan', 'Dragon', 'Slayer'],
    'bollywood': ['Dance', 'Song', 'Wedding', 'Family', 'Love', 'Action', 'Hero', 'Romance'],
    'films': ['Movie', 'Action', 'Thriller', 'Romance', 'Comedy', 'Drama', 'Horror', 'Mystery'],
    'metadata': ['Database', 'Collection', 'Archive', 'Ratings', 'Reviews', 'Scores', 'Rankings']
  };
  
  const categoryPrefix = titlePrefixes[category] || titlePrefixes['dramas'];
  const categorySuffix = titleSuffixes[category] || titleSuffixes['dramas'];
  
  for (let i = 1; i <= count; i++) {
    // Générer un titre plus réaliste
    const prefix = categoryPrefix[Math.floor(Math.random() * categoryPrefix.length)];
    const suffix = categorySuffix[Math.floor(Math.random() * categorySuffix.length)];
    const title = `${prefix} ${suffix} ${i}`;
    
    // Générer une description plus réaliste
    const descriptions = [
      `Une histoire captivante qui vous tiendra en haleine du début à la fin.`,
      `Découvrez l'histoire extraordinaire de personnages attachants dans ce ${category}.`,
      `Une production originale avec des scènes mémorables et des personnages charismatiques.`,
      `Une aventure épique remplie d'émotions et de rebondissements inattendus.`,
      `Un chef-d'œuvre du genre qui a conquis des millions de spectateurs à travers le monde.`
    ];
    
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Générer un élément avec des données plus réalistes
    items.push({
      id: `${source}-${isFallback ? 'fallback' : 'mock'}-${i}`,
      title: title,
      original_title: title,
      description: description,
      poster: `/placeholders/${category}-poster.jpg`,
      backdrop: `/placeholders/${category}-backdrop.jpg`,
      rating: (Math.random() * 3 + 7).toFixed(1), // Entre 7.0 et 10.0
      year: 2024 - Math.floor(Math.random() * 5), // Entre 2019 et 2024
      source: source,
      is_mock: true,
      is_fallback: isFallback,
      genres: ['Mock', category.charAt(0).toUpperCase() + category.slice(1)],
      episodes_count: category === 'dramas' ? Math.floor(Math.random() * 16) + 8 : null // Entre 8 et 24 épisodes pour les dramas
    });
  }
  
  return items;
}

/**
 * Sauvegarde les logs de scraping pour analyse ultérieure
 * @param {string} source - Nom de la source
 * @param {Object} logData - Données de log
 */
function saveScrapingLog(source, logData) {
  try {
    // Créer le répertoire de logs s'il n'existe pas
    const logsDir = path.join(OUTPUT_DIR, 'logs');
    fs.ensureDirSync(logsDir);
    
    // Nom du fichier de log
    const logFile = path.join(logsDir, `${source}-${new Date().toISOString().split('T')[0]}.json`);
    
    // Charger les logs existants ou créer un nouveau fichier
    let logs = [];
    if (fs.existsSync(logFile)) {
      try {
        logs = fs.readJsonSync(logFile);
      } catch (e) {
        console.warn(`Erreur lors de la lecture du fichier de log ${logFile}:`, e.message);
      }
    }
    
    // Ajouter le nouveau log
    logs.push({
      ...logData,
      timestamp: new Date().toISOString()
    });
    
    // Sauvegarder le fichier de log
    fs.writeJsonSync(logFile, logs, { spaces: 2 });
    
    console.log(`Log de scraping sauvegardé pour ${source}`);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du log pour ${source}:`, error.message);
  }
}

// Exécuter le scraping
runScraping().catch(error => {
  console.error('Erreur lors du scraping:', error);
  process.exit(1);
});
