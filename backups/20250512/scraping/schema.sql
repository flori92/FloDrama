-- Schéma de base de données pour FloDrama
-- Version: 1.0.0
-- Date: 2025-05-10

-- Table principale pour le contenu
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  type TEXT NOT NULL,
  source TEXT,
  url TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  description TEXT,
  year INTEGER,
  rating REAL DEFAULT 0,
  genres TEXT, -- JSON array
  streaming_urls TEXT, -- JSON array
  trailer TEXT, -- JSON object
  cast TEXT, -- JSON array
  tmdb_id INTEGER,
  created_at TEXT,
  updated_at TEXT,
  is_enriched INTEGER DEFAULT 0
);

-- Table pour les statistiques de scraping
CREATE TABLE IF NOT EXISTS scraping_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_date TEXT NOT NULL,
  source TEXT NOT NULL,
  items_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  notes TEXT
);

-- Table pour les utilisateurs (préparation pour fonctionnalités futures)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT,
  created_at TEXT,
  last_login TEXT
);

-- Table pour les favoris des utilisateurs
CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT,
  content_id TEXT,
  created_at TEXT,
  PRIMARY KEY (user_id, content_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

-- Table pour l'historique de visionnage
CREATE TABLE IF NOT EXISTS watch_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  content_id TEXT,
  watched_at TEXT,
  progress REAL DEFAULT 0,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_year ON content(year);
CREATE INDEX IF NOT EXISTS idx_content_rating ON content(rating);
CREATE INDEX IF NOT EXISTS idx_content_tmdb_id ON content(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_scraping_stats_date ON scraping_stats(run_date);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
