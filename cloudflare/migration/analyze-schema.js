/**
 * Script d'analyse du schéma de la base de données PostgreSQL
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL;

// Pool de connexion PostgreSQL
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Analyse du schéma de la base de données PostgreSQL');
  
  const client = await pool.connect();
  
  try {
    console.log('✅ Connexion à PostgreSQL établie avec succès');
    
    // Liste des tables à analyser
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`\n📋 Tables trouvées: ${tables.join(', ')}`);
    
    // Analyse de chaque table
    for (const table of tables) {
      console.log(`\n=== Structure de la table ${table} ===`);
      
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log('Colonnes:');
      columnsResult.rows.forEach(column => {
        console.log(`  - ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Récupération du nombre d'enregistrements
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`Nombre d'enregistrements: ${countResult.rows[0].count}`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse: ${error}`);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution de la fonction principale
main().catch(error => {
  console.error(`❌ Erreur fatale: ${error}`);
  process.exit(1);
});
