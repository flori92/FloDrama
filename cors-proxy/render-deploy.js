// Script de déploiement automatique sur Render.com
// Utilise l'API Render pour créer un service web

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration (à personnaliser)
const RENDER_API_KEY = 'rnd_dmyuIVCQ74QtllqhTldOJSk3IZpS';
const GITHUB_REPO = 'flori92/FloDrama';
const GITHUB_BRANCH = 'main';
const SERVICE_NAME = 'flodrama-cors-proxy';

// Fonction pour faire une requête à l'API Render
function renderApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`Erreur API Render (${res.statusCode}): ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Fonction principale
async function deployToRender() {
  try {
    console.log('🚀 Déploiement du proxy CORS FloDrama sur Render.com');
    
    // Vérifier si le service existe déjà
    console.log('🔍 Recherche du service existant...');
    let services;
    try {
      services = await renderApiRequest('GET', '/services');
    } catch (error) {
      console.error('❌ Erreur lors de la recherche des services:', error.message);
      return;
    }
    
    const existingService = services.find(service => service.name === SERVICE_NAME);
    
    if (existingService) {
      console.log(`✅ Service existant trouvé: ${existingService.name} (${existingService.id})`);
      console.log(`🔗 URL du service: ${existingService.serviceDetails.url}`);
      
      // Mise à jour du service existant
      console.log('🔄 Déclenchement d\'un nouveau déploiement...');
      try {
        await renderApiRequest('POST', `/services/${existingService.id}/deploys`);
        console.log('✅ Nouveau déploiement déclenché avec succès');
      } catch (error) {
        console.error('❌ Erreur lors du déclenchement du déploiement:', error.message);
      }
      
      console.log(`\n📝 Pour mettre à jour le frontend, exécutez:`);
      console.log(`cd ../Frontend && echo "VITE_API_URL=${existingService.serviceDetails.url}/api" >> .env.production && git add .env.production && git commit -m "✨ [CONFIG] Mise à jour de l'URL de l'API pour utiliser le proxy CORS" && git push`);
      
      return;
    }
    
    // Création d'un nouveau service
    console.log('🔧 Création d\'un nouveau service...');
    
    const serviceData = {
      name: SERVICE_NAME,
      type: 'web_service',
      env: 'node',
      region: 'frankfurt',
      plan: 'free',
      branch: GITHUB_BRANCH,
      repo: GITHUB_REPO,
      autoDeploy: 'yes',
      buildCommand: 'cd cors-proxy && npm install --production',
      startCommand: 'cd cors-proxy && node cors-anywhere.js',
      envVars: [
        {
          key: 'PORT',
          value: '10000'
        }
      ]
    };
    
    try {
      const newService = await renderApiRequest('POST', '/services', serviceData);
      console.log(`✅ Service créé avec succès: ${newService.name} (${newService.id})`);
      console.log(`🔗 URL du service: ${newService.serviceDetails.url || 'En attente de déploiement'}`);
      
      console.log(`\n⏳ Le déploiement initial peut prendre quelques minutes...`);
      console.log(`📝 Une fois le déploiement terminé, mettez à jour le frontend avec:`);
      console.log(`cd ../Frontend && echo "VITE_API_URL=https://${SERVICE_NAME}.onrender.com/api" >> .env.production && git add .env.production && git commit -m "✨ [CONFIG] Mise à jour de l'URL de l'API pour utiliser le proxy CORS" && git push`);
    } catch (error) {
      console.error('❌ Erreur lors de la création du service:', error.message);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécution de la fonction principale
deployToRender();
