const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion au Transaction pooler de Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test de la connexion
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connexion à la base de données établie:', res.rows[0]);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};