// validate_endpoints.js
// Script de validation des endpoints AWS API Gateway et des images pour FloDrama
// Usage : node validate_endpoints.js

const axios = require('axios');

const BASE_URL = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';
const ENDPOINTS = [
  '/content/drama',
  '/content/anime',
  '/content/film',
  '/content/bollywood',
  '/health',
  '/status'
];

async function checkEndpoint(path) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const cors = response.headers['access-control-allow-origin'];
    console.log(`\n✅ [${path}] Code: ${response.status}, CORS: ${cors}`);
    if (Array.isArray(response.data)) {
      // Vérifie que ce sont des données réelles (présence d'au moins 1 titre et image)
      const sample = response.data[0];
      if (sample) {
        console.log(`   Exemple: titre = ${sample.title || sample.name}, image = ${sample.imageUrl || sample.poster}`);
        // Vérifie l'image si présente
        const imgUrl = sample.imageUrl || sample.poster;
        if (imgUrl) {
          await checkImage(imgUrl, path);
        }
      } else {
        console.warn(`   ⚠️ Données vides sur ${path}`);
      }
    }
    return true;
  } catch (err) {
    if (err.response) {
      console.error(`\n❌ [${path}] Code: ${err.response.status}, Message: ${err.response.statusText}`);
    } else {
      console.error(`\n❌ [${path}] Erreur: ${err.message}`);
    }
    return false;
  }
}

async function checkImage(url, fromEndpoint) {
  try {
    const res = await axios.head(url, { timeout: 10000 });
    if (res.status === 200) {
      console.log(`   🖼️ Image OK: ${url}`);
    } else {
      console.warn(`   ⚠️ Image non accessible (${res.status}): ${url}`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Image inaccessible depuis ${fromEndpoint}: ${url}`);
  }
}

(async () => {
  console.log('=== Validation des endpoints FloDrama AWS API Gateway ===');
  let ok = 0, fail = 0;
  for (const ep of ENDPOINTS) {
    const result = await checkEndpoint(ep);
    if (result) ok++; else fail++;
  }
  console.log(`\nRésultat final : ${ok} OK, ${fail} échecs.`);
})();
