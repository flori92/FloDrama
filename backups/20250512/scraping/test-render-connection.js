/**
 * Script de test de connexion au service Render
 * 
 * Ce script permet de tester la connexion au service Render
 * et de vérifier qu'il est correctement configuré.
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const API_KEY = process.env.RENDER_API_KEY || 'rnd_DJfpQC9gEu4KgTRvX8iQzMXxrteP';
const POSSIBLE_URLS = [
  'https://flodrama-scraper.onrender.com',
  'https://flodrama-scraper-relay.onrender.com',
  'https://flodrama-scraper-service.onrender.com'
];

// Fonction principale
async function testRenderConnection() {
  console.log('🔍 Test de connexion au service Render');
  console.log('================================================================================');
  
  // Tester chaque URL possible
  for (const url of POSSIBLE_URLS) {
    console.log(`\n📡 Test de l'URL: ${url}`);
    
    try {
      // Test sans authentification
      console.log('🔄 Test sans authentification...');
      try {
        const noAuthResponse = await axios.get(`${url}/status`, { timeout: 10000 });
        console.log(`✅ Réponse reçue (${noAuthResponse.status}): ${JSON.stringify(noAuthResponse.data)}`);
      } catch (error) {
        if (error.response) {
          console.log(`⚠️ Erreur ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else {
          console.log(`❌ Erreur: ${error.message}`);
        }
      }
      
      // Test avec authentification
      console.log('🔄 Test avec authentification...');
      try {
        const authResponse = await axios.get(`${url}/status`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` },
          timeout: 10000
        });
        console.log(`✅ Réponse reçue (${authResponse.status}): ${JSON.stringify(authResponse.data)}`);
        
        // Si on arrive ici, le service est accessible
        console.log(`\n🎉 Service Render accessible à l'URL: ${url}`);
        console.log(`🔑 Clé API: ${API_KEY}`);
        
        // Mettre à jour la configuration
        updateConfig(url);
        
        return true;
      } catch (error) {
        if (error.response) {
          console.log(`⚠️ Erreur ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else {
          console.log(`❌ Erreur: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Erreur générale: ${error.message}`);
    }
  }
  
  console.log('\n❌ Aucune URL ne fonctionne. Le service Render n\'est pas accessible.');
  console.log('Vérifiez que le service est bien déployé et que l\'URL est correcte.');
  
  return false;
}

// Fonction pour mettre à jour la configuration
function updateConfig(url) {
  // Mettre à jour le fichier de configuration local pour les tests
  const configPath = path.join(__dirname, 'relay-config.json');
  const config = {
    url,
    api_key: API_KEY,
    status: 'configured',
    last_test: new Date().toISOString(),
    test_result: 'success'
  };
  
  fs.writeJsonSync(configPath, config, { spaces: 2 });
  console.log(`📝 Configuration sauvegardée dans ${configPath}`);
  
  // Afficher les commandes curl pour tester le service
  console.log('\n🔧 Commandes pour tester le service:');
  console.log(`curl -H "Authorization: Bearer ${API_KEY}" ${url}/status`);
  console.log(`curl -H "Authorization: Bearer ${API_KEY}" ${url}/sources`);
}

// Exécution de la fonction principale
testRenderConnection().catch(error => {
  console.error('❌ Erreur fatale:', error);
});
