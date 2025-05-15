-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des vidéos (tous types confondus)
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  category_id TEXT,
  image_url TEXT,
  video_url TEXT,
  is_trending BOOLEAN,
  is_featured BOOLEAN,
  created_at DATETIME,
  updated_at DATETIME
);

-- Table des catégories/types
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT
);

-- Historique de visionnage
CREATE TABLE IF NOT EXISTS history (
  user_id TEXT,
  video_id TEXT,
  watched_at DATETIME,
  PRIMARY KEY (user_id, video_id)
);

-- Listes personnalisées
CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT
);

CREATE TABLE IF NOT EXISTS list_items (
  list_id TEXT,
  video_id TEXT,
  PRIMARY KEY (list_id, video_id)
);

-- Commentaires
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  video_id TEXT,
  content TEXT,
  created_at DATETIME
);
