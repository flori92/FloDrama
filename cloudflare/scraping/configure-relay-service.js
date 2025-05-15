/**
 * Script de configuration du service relais Render pour FloDrama
 * 
 * Ce script permet de configurer et de tester la connexion entre
 * le workflow GitHub Actions et le service relais Render.
 * 
 * @author FloDrama Team
 * @version 1.0.0
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const RENDER_SERVICE_URL = process.env.RENDER_SERVICE_URL || 'https://flodrama-scraper.onrender.com';
const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_DJfpQC9gEu4KgTRvX8iQzMXxrteP';
const CONFIG_FILE = path.join(__dirname, 'relay-config.json');

// Fonction principale
async function configureRelayService() {
  console.log('🔧 Configuration du service relais Render pour FloDrama');
  console.log('================================================================================');
  
  try {
    // Vérification de la disponibilité du service
    console.log('🔄 Vérification de la disponibilité du service relais...');
    
    try {
      const statusResponse = await axios.get(`${RENDER_SERVICE_URL}/status`, {
        headers: { 'Authorization': `Bearer ${RENDER_API_KEY}` },
        timeout: 10000
      });
      
      if (statusResponse.status === 200 && statusResponse.data.status === 'ok') {
        console.log('✅ Service relais Render disponible et opérationnel');
        console.log(`   Version: ${statusResponse.data.version || 'inconnue'}`);
        console.log(`   Uptime: ${statusResponse.data.uptime || 'inconnu'}`);
        
        // Récupération des sources supportées
        const sourcesResponse = await axios.get(`${RENDER_SERVICE_URL}/sources`, {
          headers: { 'Authorization': `Bearer ${RENDER_API_KEY}` },
          timeout: 10000
        });
        
        if (sourcesResponse.status === 200 && sourcesResponse.data.sources) {
          console.log(`🔍 Sources supportées par le service relais: ${sourcesResponse.data.sources.join(', ')}`);
        }
      } else {
        console.warn(`⚠️ Service relais Render disponible mais signale un problème: ${statusResponse.data.message || 'Raison inconnue'}`);
      }
    } catch (error) {
      console.error(`❌ Service relais Render indisponible: ${error.message}`);
      console.log('\n🔧 Suggestions:');
      console.log('1. Vérifiez que le service est bien déployé sur Render');
      console.log('2. Vérifiez que l\'URL et la clé API sont correctes');
      console.log('3. Vérifiez que le service n\'est pas en pause (cold start)');
      process.exit(1);
    }
    
    // Test de scraping via le service relais
    console.log('\n🧪 Test de scraping via le service relais...');
    
    try {
      // Préparation des données pour la requête de test
      const testPayload = {
        source: 'tmdb',  // Source de test qui devrait toujours fonctionner
        type: 'film',
        urls: ['https://api.themoviedb.org/3/movie/popular'],
        selectors: {
          main: '.movie-item',
          wait: '.movie-list'
        },
        minItems: 5
      };
      
      console.log('📡 Envoi d\'une requête de test au service relais...');
      const testResponse = await axios.post(`${RENDER_SERVICE_URL}/scrape`, testPayload, {
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (testResponse.data && testResponse.data.items && testResponse.data.items.length > 0) {
        console.log(`✅ Test réussi: ${testResponse.data.items.length} éléments récupérés`);
        
        // Sauvegarde de la configuration
        const config = {
          url: RENDER_SERVICE_URL,
          api_key: RENDER_API_KEY,
          status: 'configured',
          last_test: new Date().toISOString(),
          test_result: 'success'
        };
        
        await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
        console.log(`📝 Configuration sauvegardée dans ${CONFIG_FILE}`);
        
        // Mise à jour des secrets GitHub si possible
        try {
          console.log('\n🔐 Tentative de mise à jour des secrets GitHub...');
          
          // Vérifier si nous sommes dans un environnement GitHub Actions
          if (process.env.GITHUB_ACTIONS) {
            console.log('✅ Environnement GitHub Actions détecté, les secrets sont déjà configurés');
          } else {
            console.log('⚠️ Environnement local détecté, mise à jour manuelle des secrets GitHub nécessaire');
            console.log('   Ajoutez le secret RENDER_API_KEY dans les paramètres de votre dépôt GitHub');
          }
        } catch (error) {
          console.warn(`⚠️ Impossible de mettre à jour les secrets GitHub: ${error.message}`);
        }
        
      } else {
        console.warn('⚠️ Test échoué: aucun élément récupéré');
      }
    } catch (error) {
      console.error(`❌ Erreur lors du test de scraping: ${error.message}`);
    }
    
    console.log('\n================================================================================');
    console.log('✅ Configuration du service relais terminée');
    console.log('================================================================================');
    
  } catch (error) {
    console.error(`❌ Erreur lors de la configuration: ${error.message}`);
    process.exit(1);
  }
}

// Exécution de la fonction principale
configureRelayService().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
