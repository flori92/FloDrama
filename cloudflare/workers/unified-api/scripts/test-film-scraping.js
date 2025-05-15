/**
 * Script de test pour le service de scraping des films
 * Ce script teste le système de tentatives multiples pour KissAsian
 */

// Import de node-fetch v2 (compatible avec CommonJS)
const fetch = require('node-fetch').default || require('node-fetch');

// Configuration
const API_BASE_URL = 'https://flodrama-content-api.florifavi.workers.dev';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Endpoints à tester
const endpoints = [
  { name: 'Films populaires', url: `${API_BASE_URL}/api/film` },
  { name: 'Recherche de films', url: `${API_BASE_URL}/api/film?q=avengers` }
];

// Fonction utilitaire pour attendre
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour effectuer une requête avec tentatives
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  try {
    console.log(`🔄 Tentative de requête vers ${url}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (retries <= 1) {
      console.error(`❌ Échec définitif après ${MAX_RETRIES} tentatives: ${error.message}`);
      throw error;
    }
    
    console.warn(`⚠️ Tentative échouée (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}): ${error.message}`);
    console.log(`⏱️ Nouvelle tentative dans ${delay}ms...`);
    
    await sleep(delay);
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
}

// Fonction principale pour tester les endpoints
async function testEndpoints() {
  console.log('🧪 Démarrage des tests du service de scraping des films');
  console.log('📅 Date et heure: ' + new Date().toISOString());
  console.log('🔗 API de base: ' + API_BASE_URL);
  console.log('---------------------------------------------------');
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Test de l'endpoint: ${endpoint.name}`);
    console.log(`🌐 URL: ${endpoint.url}`);
    
    try {
      const startTime = Date.now();
      const data = await fetchWithRetry(endpoint.url);
      const duration = (Date.now() - startTime) / 1000;
      
      console.log(`✅ Succès en ${duration.toFixed(2)}s`);
      console.log(`📊 Résultats: ${JSON.stringify(data).substring(0, 150)}...`);
      
      if (data && data.data && Array.isArray(data.data)) {
        console.log(`📋 Nombre d'éléments: ${data.data.length}`);
      }
      
      successCount++;
    } catch (error) {
      console.error(`❌ Échec: ${error.message}`);
    }
    
    console.log('---------------------------------------------------');
  }
  
  console.log(`\n📈 Résumé: ${successCount}/${endpoints.length} endpoints testés avec succès`);
}

// Exécuter les tests
testEndpoints()
  .then(() => {
    console.log('✨ Tests terminés');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur lors des tests:', error);
    process.exit(1);
  });
