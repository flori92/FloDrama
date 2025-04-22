// Script pour créer un service web sur Render.com
const https = require('https');

// Configuration
const RENDER_API_KEY = 'rnd_dmyuIVCQ74QtllqhTldOJSk3IZpS';
const GITHUB_REPO = 'flori92/FloDrama';
const SERVICE_NAME = 'flodrama-cors-proxy';

// Données du service
const serviceData = {
  type: 'web_service',
  name: SERVICE_NAME,
  repo: `https://github.com/${GITHUB_REPO}`,
  branch: 'main',
  rootDir: 'cors-proxy',
  envVars: [
    {
      key: 'PORT',
      value: '10000'
    }
  ],
  buildCommand: 'npm install',
  startCommand: 'node cors-anywhere.js',
  plan: 'free'
};

// Options de la requête
const options = {
  hostname: 'api.render.com',
  port: 443,
  path: '/v1/services',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

// Effectuer la requête
const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const response = JSON.parse(data);
      console.log('✅ Service créé avec succès !');
      console.log(`🔗 URL du service: ${response.service?.url || 'En attente de déploiement'}`);
      console.log(`🆔 ID du service: ${response.service?.id || 'Non disponible'}`);
      console.log(`\n⏳ Le déploiement initial peut prendre quelques minutes...`);
      console.log(`📝 Une fois le déploiement terminé, mettez à jour le frontend avec:`);
      console.log(`cd ../Frontend && echo "VITE_API_URL=https://${SERVICE_NAME}.onrender.com/api" >> .env.production && git add .env.production && git commit -m "✨ [CONFIG] Mise à jour de l'URL de l'API pour utiliser le proxy CORS" && git push`);
    } else {
      console.error(`❌ Erreur (${res.statusCode}):`, data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur:', error.message);
});

// Envoyer les données
req.write(JSON.stringify(serviceData));
req.end();

console.log('🚀 Création du service en cours...');
