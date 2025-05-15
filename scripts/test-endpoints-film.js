/**
 * Script de test des endpoints /api/film/* en production FloDrama
 * Cible : https://flodrama-api-prod.florifavi.workers.dev
 *
 * Usage : node scripts/test-endpoints-film.js
 * Nécessite : node >= 18 (fetch natif) ou installer 'node-fetch'
 *
 * Résultats affichés en français (statut, résumé, erreurs)
 */

const BASE_URL = 'https://flodrama-api-prod.florifavi.workers.dev';
const ENDPOINTS = [
  { name: 'Popular', url: '/api/film/popular' },
  { name: 'Trending', url: '/api/film/trending' },
  { name: 'Recent', url: '/api/film/recent' },
  { name: 'Genre (action)', url: '/api/film/genre/action' },
  { name: 'Film ID (1)', url: '/api/film/1' },
  { name: 'Streaming Film ID (1)', url: '/api/film/1/streaming' }
];

async function testEndpoint(endpoint) {
  const url = BASE_URL + endpoint.url;
  try {
    const res = await fetch(url, { method: 'GET' });
    const status = res.status;
    let bodyText = await res.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      body = bodyText;
    }
    console.log(`\n[${endpoint.name}] ${url}`);
    console.log(`Statut HTTP : ${status}`);
    if (typeof body === 'object') {
      const resume = JSON.stringify(body, null, 2);
      console.log('Réponse :', resume.length > 600 ? resume.slice(0, 600) + '... (tronqué)' : resume);
    } else {
      console.log('Réponse brute :', body.slice(0, 600));
    }
  } catch (err) {
    console.error(`\n[${endpoint.name}] ERREUR lors de la requête :`, err.message);
  }
}

(async () => {
  console.log('--- Test des endpoints /api/film/* en production FloDrama ---');
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  console.log('\n--- Fin des tests ---');
})();
