/**
 * Script de test pour vérifier l'intégration de la source FilmApik
 * Ce script vérifie la configuration et l'état des données via l'API Cloudflare
 */

import { getDatabase } from './src/services/database.js';
import { getSourceById } from './src/config/sources.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Charger les variables d'environnement
dotenv.config();

// Configuration
const SOURCE_ID = 'filmapik';
const API_KEY = process.env.CLOUDFLARE_API_KEY || '507f4127285e65f9b4882ea54719cfcd';
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://flodrama-recommendations-prod.florifavi.workers.dev/api';

/**
 * Effectue une requête à l'API
 * @param {string} endpoint - Point de terminaison de l'API
 * @param {string} method - Méthode HTTP (GET, POST, etc.)
 * @param {Object} [body] - Corps de la requête (optionnel)
 * @returns {Promise<Object>} Réponse de l'API
 */
async function fetchAPI(endpoint, method = 'GET', body = null) {
  const url = `${API_ENDPOINT}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de l'appel à ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fonction principale de test
 */
async function testFilmApikIntegration() {
  console.log('🚀 Démarrage du test d\'intégration FilmApik...');
  
  try {
    // 1. Vérifier la configuration de la source
    console.log('🔍 Vérification de la configuration de la source...');
    const source = getSourceById(SOURCE_ID);
    
    if (!source) {
      throw new Error(`La source ${SOURCE_ID} n'est pas configurée`);
    }
    
    console.log(`✅ Source configurée: ${source.name} (${source.baseUrl})`);
    
    // 2. Vérifier l'état du service via l'API
    console.log('🔌 Vérification de l\'état du service...');
    const health = await fetchAPI('/health');
    console.log(`✅ Service opérationnel: ${health.status}`);
    
    // 3. Récupérer les statistiques de la source
    console.log('📊 Récupération des statistiques de la source...');
    const stats = await fetchAPI(`/sources/${SOURCE_ID}/stats`);
    
    if (stats.error) {
      console.warn(`⚠️ Aucune donnée trouvée pour la source: ${stats.message}`);
    } else {
      console.log(`📊 Statistiques pour ${source.name}:`);
      console.log(`- Nombre total de contenus: ${stats.totalItems || 0}`);
      console.log(`- Dernière mise à jour: ${new Date(stats.lastUpdated).toLocaleString() || 'Inconnue'}`);
      
      // 4. Récupérer un échantillon des contenus
      if (stats.totalItems > 0) {
        console.log('🔍 Récupération d\'un échantillon de contenus...');
        const contents = await fetchAPI(`/contents?source=${SOURCE_ID}&limit=5`);
        
        if (contents.data && contents.data.length > 0) {
          console.log('🎬 Derniers contenus ajoutés/mis à jour:');
          contents.data.forEach(item => {
            console.log(`- ${item.title} (${item.release_year}) - ${new Date(item.updated_at).toLocaleString()}`);
          });
        }
      } else {
        console.log('ℹ️ Aucun contenu trouvé pour cette source. Le scraping a-t-il été exécuté ?');
      }
    }
    
    // 5. Vérifier si le scraping est configuré dans le workflow
    console.log('⚙️ Vérification de la configuration du scraping...');
    try {
      const scrapingConfig = await fetchAPI(`/scrape/config`);
      const sourceConfig = scrapingConfig.sources?.find(s => s.id === SOURCE_ID);
      
      if (sourceConfig) {
        console.log(`✅ La source est configurée pour le scraping (priorité: ${sourceConfig.priority || 'par défaut'})`);
      } else {
        console.warn(`⚠️ La source n'est pas configurée pour le scraping`);
      }
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer la configuration du scraping:', error.message);
    }
    
    console.log('✅ Test d\'intégration terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'intégration:', error);
    process.exit(1);
  }
}

// Exécuter le test
testFilmApikIntegration().catch(console.error);
