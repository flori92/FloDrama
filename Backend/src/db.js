const { Pool } = require('pg');
require('dotenv').config();

// Vérification de la présence de la variable d'environnement DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('ERREUR: La variable d\'environnement DATABASE_URL n\'est pas définie');
  console.error('Veuillez définir DATABASE_URL dans le fichier .env ou dans les variables d\'environnement Vercel');
}

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

// Fonction pour exécuter une requête avec gestion d'erreur améliorée
const query = async (text, params) => {
  try {
    console.log('Exécution de la requête:', text, 'avec les paramètres:', params);
    const result = await pool.query(text, params);
    console.log('Requête réussie, nombre de lignes:', result.rowCount);
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête:', error);
    console.error('Requête:', text);
    console.error('Paramètres:', params);
    throw error;
  }
};

module.exports = {
  query,
  pool
};