// Script d'injection automatisée des contenus scrapés dans la base SQL FloDrama
// Compatible SQLite3 (peut être adapté pour Cloudflare D1)

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// === CONFIGURATION ===
const DB_PATH = path.resolve(__dirname, '../../../FloDrama-Cloudflare/database/flodrama.db'); // à adapter si besoin
const SCRAPED_DIR = path.resolve(__dirname, '../scraping-results-converted');

// Mapping entre dossier et table SQL
const TABLE_MAP = {
  'dramas': {
    table: 'dramas',
    fields: ['id', 'title', 'original_title', 'description', 'year', 'rating', 'country', 'genres', 'episodes_count', 'poster', 'backdrop', 'trailer_url', 'is_trending', 'is_featured']
  },
  'animes': {
    table: 'animes',
    fields: ['id', 'title', 'original_title', 'description', 'year', 'rating', 'country', 'genres', 'episodes', 'poster', 'backdrop', 'trailer_url', 'is_trending', 'is_featured']
  },
  'films': {
    table: 'films',
    fields: ['id', 'title', 'original_title', 'description', 'year', 'rating', 'country', 'genres', 'duration', 'poster', 'backdrop', 'trailer_url', 'is_trending', 'is_featured']
  },
  'bollywood': {
    table: 'bollywood',
    fields: ['id', 'title', 'original_title', 'description', 'year', 'rating', 'country', 'genres', 'duration', 'poster', 'backdrop', 'trailer_url', 'is_trending', 'is_featured']
  }
};

function getTableConfig(filename) {
  for (const key in TABLE_MAP) {
    if (filename.toLowerCase().includes(key)) return TABLE_MAP[key];
  }
  return null;
}

function insertContent(db, tableCfg, content) {
  // Préparation des valeurs
  const values = tableCfg.fields.map(field => {
    if (field === 'genres' && Array.isArray(content[field])) {
      return JSON.stringify(content[field]);
    }
    return content[field] !== undefined ? content[field] : null;
  });

  const placeholders = tableCfg.fields.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${tableCfg.table} (${tableCfg.fields.join(', ')}) VALUES (${placeholders})`;
  db.run(sql, values, function(err) {
    if (err) {
      console.error(`[ERREUR][${tableCfg.table}]`, content.id, err.message);
    } else {
      console.log(`[OK][${tableCfg.table}]`, content.id);
    }
  });
}

function main() {
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, err => {
    if (err) {
      console.error('Impossible d’ouvrir la base SQL:', err.message);
      process.exit(1);
    }
  });

  fs.readdirSync(SCRAPED_DIR).forEach(folder => {
    const folderPath = path.join(SCRAPED_DIR, folder);
    const tableCfg = getTableConfig(folder);
    if (!tableCfg || !fs.lstatSync(folderPath).isDirectory()) return;
    fs.readdirSync(folderPath).forEach(file => {
      if (!file.endsWith('.json')) return;
      const filePath = path.join(folderPath, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        insertContent(db, tableCfg, content);
      } catch (e) {
        console.error(`[ERREUR][PARSE]`, file, e.message);
      }
    });
  });

  db.close();
}

main();
