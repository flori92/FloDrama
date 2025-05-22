-- Schéma de base de données pour le système de recommandation FloDrama
-- À exécuter avec: npx wrangler d1 execute flodrama-db --file=src/utils/schema.sql

-- Table des sources
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_scraped_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Table des contenus
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
);

-- Table des recommandations utilisateur
CREATE TABLE IF NOT EXISTS user_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  score REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  UNIQUE(user_id, content_id)
);

-- Table des préférences utilisateur
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
);

-- Table de l'historique utilisateur
CREATE TABLE IF NOT EXISTS user_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  watched_at TEXT DEFAULT (datetime('now')),
  progress REAL DEFAULT 0,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  UNIQUE(user_id, content_id)
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT,
  last_active TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Table des exécutions planifiées
CREATE TABLE IF NOT EXISTS scheduled_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  results TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
CREATE INDEX IF NOT EXISTS idx_contents_source_id ON contents(source_id);
CREATE INDEX IF NOT EXISTS idx_contents_rating ON contents(rating);
CREATE INDEX IF NOT EXISTS idx_contents_release_year ON contents(release_year);
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);

-- Insertion des sources initiales
INSERT OR IGNORE INTO sources (id, name, base_url, type, is_active, created_at, updated_at) VALUES
-- Dramas
('dramacool', 'DramaCool', 'https://dramacool.com.tr', 'drama', 1, datetime('now'), datetime('now')),
('viewasian', 'ViewAsian', 'https://viewasian.lol', 'drama', 1, datetime('now'), datetime('now')),
('kissasian', 'KissAsian', 'https://kissasian.com.lv', 'drama', 1, datetime('now'), datetime('now')),
('voirdrama', 'VoirDrama', 'https://voirdrama.org', 'drama', 1, datetime('now'), datetime('now')),
-- Animes
('gogoanime', 'GogoAnime', 'https://gogoanime.cl', 'anime', 1, datetime('now'), datetime('now')),
('nekosama', 'NekoSama', 'https://neko-sama.fr', 'anime', 1, datetime('now'), datetime('now')),
('voiranime', 'VoirAnime', 'https://voiranime.com', 'anime', 1, datetime('now'), datetime('now')),
-- Films
('vostfree', 'VostFree', 'https://vostfree.cx', 'movie', 1, datetime('now'), datetime('now')),
('streamingdivx', 'StreamingDivx', 'https://streaming-films.net', 'movie', 1, datetime('now'), datetime('now')),
('filmcomplet', 'FilmComplet', 'https://www.film-complet.cc', 'movie', 1, datetime('now'), datetime('now')),
-- Bollywood
('bollyplay', 'BollyPlay', 'https://bollyplay.app', 'bollywood', 1, datetime('now'), datetime('now')),
('hindilinks4u', 'HindiLinks4U', 'https://hindilinks4u.skin', 'bollywood', 1, datetime('now'), datetime('now'));
