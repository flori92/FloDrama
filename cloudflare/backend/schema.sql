-- Schéma de base de données pour FloDrama sur Cloudflare D1
-- Ce fichier sera utilisé pour initialiser la base de données D1

-- Table des dramas
CREATE TABLE IF NOT EXISTS dramas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  rating REAL DEFAULT 0,
  year INTEGER,
  created_at TEXT,
  updated_at TEXT
);

-- Table des films
CREATE TABLE IF NOT EXISTS films (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  rating REAL DEFAULT 0,
  year INTEGER,
  created_at TEXT,
  updated_at TEXT
);

-- Table des animes
CREATE TABLE IF NOT EXISTS animes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  rating REAL DEFAULT 0,
  year INTEGER,
  created_at TEXT,
  updated_at TEXT
);

-- Table des contenus bollywood
CREATE TABLE IF NOT EXISTS bollywood (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  rating REAL DEFAULT 0,
  year INTEGER,
  created_at TEXT,
  updated_at TEXT
);

-- Table des logs de scraping
CREATE TABLE IF NOT EXISTS scraping_logs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  content_type TEXT NOT NULL,
  status TEXT,
  items_scraped INTEGER DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT 0,
  details TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Table des favoris
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des vues
CREATE TABLE IF NOT EXISTS views (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dramas_year ON dramas(year);
CREATE INDEX IF NOT EXISTS idx_films_year ON films(year);
CREATE INDEX IF NOT EXISTS idx_animes_year ON animes(year);
CREATE INDEX IF NOT EXISTS idx_bollywood_year ON bollywood(year);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_views_user ON views(user_id);
CREATE INDEX IF NOT EXISTS idx_views_content ON views(content_id, content_type);
