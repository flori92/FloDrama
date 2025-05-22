/**
 * Script d'initialisation de la base de données Supabase pour FloDrama
 * Crée les tables nécessaires et initialise les sources configurées
 */

import { getSupabaseClient } from '../services/supabase.js';
import { SOURCES, SOURCE_TYPES } from '../config/sources.js';

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fffgoqubrbgppcqqkyod.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Vérification des variables d'environnement
if (!SUPABASE_KEY) {
  console.error('ERREUR: La variable d\'environnement SUPABASE_SERVICE_KEY est requise');
  process.exit(1);
}

// Initialisation du client Supabase
const supabase = getSupabaseClient({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY
});

/**
 * Crée les tables nécessaires dans Supabase
 */
async function createTables() {
  console.log('Création des tables dans Supabase...');

  try {
    // Création de la table des sources
    const createSourcesTable = `
      CREATE TABLE IF NOT EXISTS sources (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        base_url TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_scraped_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Création de la table des contenus
    const createContentsTable = `
      CREATE TABLE IF NOT EXISTS contents (
        id VARCHAR(100) PRIMARY KEY,
        source_id VARCHAR(50) REFERENCES sources(id),
        title TEXT NOT NULL,
        description TEXT,
        poster_url TEXT,
        backdrop_url TEXT,
        release_year INTEGER,
        rating FLOAT,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB
      );
    `;

    // Création de la table des recommandations utilisateur
    const createUserRecommendationsTable = `
      CREATE TABLE IF NOT EXISTS user_recommendations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        content_id VARCHAR(100) REFERENCES contents(id) ON DELETE CASCADE,
        score FLOAT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, content_id)
      );
    `;

    // Création de la table des préférences utilisateur
    const createUserPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL UNIQUE,
        preferred_types TEXT[],
        preferred_genres TEXT[],
        preferred_sources TEXT[],
        avoided_genres TEXT[],
        avoided_sources TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Création de la table de l'historique utilisateur
    const createUserHistoryTable = `
      CREATE TABLE IF NOT EXISTS user_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        content_id VARCHAR(100) REFERENCES contents(id) ON DELETE CASCADE,
        watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        progress FLOAT DEFAULT 0,
        UNIQUE(user_id, content_id)
      );
    `;

    // Création de la table des exécutions planifiées
    const createScheduledExecutionsTable = `
      CREATE TABLE IF NOT EXISTS scheduled_executions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        results JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Exécution des requêtes SQL
    const tables = [
      { name: 'sources', sql: createSourcesTable },
      { name: 'contents', sql: createContentsTable },
      { name: 'user_recommendations', sql: createUserRecommendationsTable },
      { name: 'user_preferences', sql: createUserPreferencesTable },
      { name: 'user_history', sql: createUserHistoryTable },
      { name: 'scheduled_executions', sql: createScheduledExecutionsTable }
    ];

    for (const table of tables) {
      console.log(`Création de la table ${table.name}...`);
      const { error } = await supabase.rpc('run_sql', { query: table.sql });
      
      if (error) {
        console.error(`Erreur lors de la création de la table ${table.name}:`, error);
      } else {
        console.log(`Table ${table.name} créée avec succès.`);
      }
    }

    console.log('Toutes les tables ont été créées avec succès.');
    return true;
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
    return false;
  }
}

/**
 * Initialise les sources configurées dans Supabase
 */
async function initializeSources() {
  console.log('Initialisation des sources...');

  try {
    // Préparer les données des sources
    const sourcesToInsert = Object.values(SOURCES).map(source => ({
      id: source.id,
      name: source.name,
      base_url: source.baseUrl,
      type: source.type,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insérer les sources
    const { data, error } = await supabase
      .from('sources')
      .upsert(sourcesToInsert, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Erreur lors de l\'initialisation des sources:', error);
      return false;
    }

    console.log(`${sourcesToInsert.length} sources initialisées avec succès.`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des sources:', error);
    return false;
  }
}

/**
 * Fonction principale d'initialisation
 */
async function initialize() {
  console.log('Début de l\'initialisation de la base de données...');

  try {
    // 1. Créer les tables
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.error('Erreur lors de la création des tables. Arrêt de l\'initialisation.');
      process.exit(1);
    }

    // 2. Initialiser les sources
    const sourcesInitialized = await initializeSources();
    if (!sourcesInitialized) {
      console.error('Erreur lors de l\'initialisation des sources. Arrêt de l\'initialisation.');
      process.exit(1);
    }

    console.log('Initialisation de la base de données terminée avec succès.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

// Exécuter l'initialisation
initialize();
