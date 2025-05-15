const fetch = require('node-fetch');

const BASE_URL = 'https://flodrama-content-api.florifavi.workers.dev';

const endpoints = [
  '/api',
  '/api/anime',
  '/api/drama',
  '/api/film',
  '/api/bollywood',
  '/api/anime/search?q=naruto',
  '/api/drama/search?q=love',
  '/api/bollywood/search?q=shahrukh',
  '/api/anime/trending',
  '/api/drama/trending',
  '/api/bollywood/trending',
  '/api/anime/recent',
  '/api/drama/recent',
  '/api/bollywood/recent',
  '/api/anime/random',
  '/api/drama/popular',
  '/api/bollywood/popular',
  '/banners',
  '/trending'
];

async function testEndpoint(path) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return { path, ok: false, status: res.status, msg: 'Réponse non JSON', body: text };
    }
    if (json.data !== undefined || json.error) {
      return { path, ok: true, status: res.status, msg: 'OK', body: json };
    }
    return { path, ok: false, status: res.status, msg: 'Champ data ou error manquant', body: json };
  } catch (err) {
    return { path, ok: false, status: 0, msg: err.message };
  }
}

(async () => {
  console.log('--- Audit des endpoints FloDrama ---');
  for (const ep of endpoints) {
    const result = await testEndpoint(ep);
    if (result.ok) {
      console.log(`✅ ${ep} [${result.status}]`);
    } else {
      console.error(`❌ ${ep} [${result.status}] — ${result.msg}`);
      if (result.body) console.error(result.body);
    }
  }
})();
