/**
 * Service de base de données pour FloDrama
 * Utilise Cloudflare D1 pour stocker et récupérer les données
 */

/**
 * Initialise la connexion à la base de données
 * @param {Object} env - Variables d'environnement Cloudflare
 * @returns {Object} Client de base de données
 */
export const getDatabase = (env) => {
  if (!env.DB) {
    throw new Error('La base de données D1 n\'est pas configurée');
  }
  return env.DB;
};

/**
 * Vérifie la connexion à la base de données
 * @param {Object} db - Client de base de données
 * @returns {Promise<boolean>} True si la connexion est établie, false sinon
 */
export const checkDatabaseConnection = async (db) => {
  try {
    const { results } = await db.prepare('SELECT 1 AS test').all();
    return results && results.length > 0 && results[0].test === 1;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return false;
  }
};

/**
 * Initialise les tables nécessaires dans D1
 * @param {Object} db - Client de base de données
 * @returns {Promise<boolean>} True si l'initialisation est réussie, false sinon
 */
export const initializeTables = async (db) => {
  try {
    // Création de la table des sources
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        type TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_scraped_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Création de la table des contenus
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contents (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        poster_url TEXT,
        backdrop_url TEXT,
        release_year INTEGER,
        rating REAL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        metadata TEXT,
        FOREIGN KEY (source_id) REFERENCES sources(id)
      )
    `);

    // Création de la table des recommandations utilisateur
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        score REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        UNIQUE(user_id, content_id)
      )
    `);

    // Création de la table des préférences utilisateur
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        preferred_types TEXT,
        preferred_genres TEXT,
        preferred_sources TEXT,
        avoided_genres TEXT,
        avoided_sources TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Création de la table de l'historique utilisateur
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        content_id TEXT NOT NULL,
        watched_at TEXT DEFAULT (datetime('now')),
        progress REAL DEFAULT 0,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        UNIQUE(user_id, content_id)
      )
    `);

    // Création de la table des exécutions planifiées
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        results TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Création des index
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_contents_source_id ON contents(source_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_contents_rating ON contents(rating)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_contents_release_year ON contents(release_year)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id)`);

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des tables:', error);
    return false;
  }
};

/**
 * Convertit un objet en JSON pour le stockage
 * @param {Object} obj - Objet à convertir
 * @returns {string} Chaîne JSON
 */
export const toJson = (obj) => {
  if (!obj) {
    return null;
  }
  return JSON.stringify(obj);
};

/**
 * Convertit une chaîne JSON en objet
 * @param {string} json - Chaîne JSON
 * @returns {Object} Objet converti
 */
export const fromJson = (json) => {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Erreur lors de la conversion JSON:', error);
    return null;
  }
};

/**
 * Convertit un tableau en chaîne pour le stockage
 * @param {Array} arr - Tableau à convertir
 * @returns {string} Chaîne séparée par des virgules
 */
export const arrayToString = (arr) => {
  if (!arr || !Array.isArray(arr)) {
    return null;
  }
  return arr.join(',');
};

/**
 * Convertit une chaîne en tableau
 * @param {string} str - Chaîne séparée par des virgules
 * @returns {Array} Tableau converti
 */
export const stringToArray = (str) => {
  if (!str) {
    return [];
  }
  return str.split(',').filter(Boolean);
};
