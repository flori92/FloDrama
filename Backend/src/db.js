const { Pool } = require('pg');
require('dotenv').config();

// Affichage de la variable d'environnement DATABASE_URL (masquée partiellement pour la sécurité)
if (process.env.DATABASE_URL) {
  const dbUrlParts = process.env.DATABASE_URL.split('@');
  const maskedUrl = dbUrlParts[0].split(':').slice(0, -1).join(':') + ':****@' + dbUrlParts[1];
  console.log('DATABASE_URL est définie:', maskedUrl);
} else {
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
    
    // Vérifier les tables disponibles
    pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'', (err, res) => {
      if (err) {
        console.error('Erreur lors de la récupération des tables:', err);
      } else {
        console.log('Tables disponibles dans la base de données:', res.rows.map(row => row.table_name));
      }
    });
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