// scripts/export-flodrama-data.js
// Script universel d'export des données FloDrama pour S3/CDN
// Génère dramas.json, trending.json, recent.json, meta/*.json avec playUrl & trailerUrl

const fs = require('fs');
const path = require('path');

// 1. Charger les données scrappées (adapter le chemin si besoin)
const rawData = require('../scraped/content.json'); // Structure attendue : { items: [...] }
const dramas = rawData.items;

// 2. Fonctions utilitaires pour générer les URLs dynamiques
const CDN_BASE = 'https://d11nnqvjfooahr.cloudfront.net'; // À adapter si besoin
const PLAY_BASE = 'https://streaming.cdn.flo.com'; // À adapter selon infra

function getPlayUrl(drama) {
  // Si déjà présent dans le scraping, on garde, sinon on génère
  return drama.playUrl || `${PLAY_BASE}/${drama.id}/master.m3u8`;
}
function getTrailerUrl(drama) {
  return drama.trailerUrl || `${CDN_BASE}/media/trailers/${drama.id}.mp4`;
}

// 3. Créer les dossiers de sortie
const outDataDir = path.join(__dirname, '../data');
const outMetaDir = path.join(outDataDir, 'meta');
if (!fs.existsSync(outDataDir)) fs.mkdirSync(outDataDir, { recursive: true });
if (!fs.existsSync(outMetaDir)) fs.mkdirSync(outMetaDir, { recursive: true });

// 4. Générer dramas.json (liste principale enrichie)
const dramasExport = dramas.map(drama => ({
  ...drama,
  playUrl: getPlayUrl(drama),
  trailerUrl: getTrailerUrl(drama)
}));
fs.writeFileSync(
  path.join(outDataDir, 'dramas.json'),
  JSON.stringify(dramasExport, null, 2),
  'utf8'
);

// 5. Générer trending.json et recent.json
const trending = dramasExport.filter(d => d.tags && d.tags.includes('tendance')).slice(0, 10);
const recent = dramasExport.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
fs.writeFileSync(
  path.join(outDataDir, 'trending.json'),
  JSON.stringify(trending.map(d => d.id), null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(outDataDir, 'recent.json'),
  JSON.stringify(recent.map(d => d.id), null, 2),
  'utf8'
);

// 6. Générer les fiches individuelles meta/dramaXXX.json
for (const drama of dramasExport) {
  fs.writeFileSync(
    path.join(outMetaDir, `${drama.id}.json`),
    JSON.stringify(drama, null, 2),
    'utf8'
  );
}

console.log(`Export terminé : ${dramas.length} dramas, ${trending.length} trending, ${recent.length} récents, ${dramas.length} fiches meta. URLs play/trailer intégrées.`);
